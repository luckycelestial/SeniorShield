"""
neo4j/repository.py
===================
Repository for storing structured FraudEvent objects into Neo4j graph nodes and relationships.

Graph Schema:
  (:User {user_id}) -[:RECEIVED]-> (:Event {event_id, channel, source_id, timestamp, label, confidence, fraud_type})
  (:Event) -[:FROM]-> (:Phone {number})
  (:Event) -[:CONTAINS]-> (:URL {url})
  (:Event) -[:CONTAINS]-> (:Domain {domain})
  (:Event) -[:TARGETS]-> (:FraudType {name})
"""

import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from neo4j.client import Neo4jClient

logger = logging.getLogger("seniorshield.neo4j.repository")


class EventRepository:
    """
    Persists structured fraud events and extracts graph entities into Neo4j.
    """

    def __init__(self, client: Optional[Neo4jClient] = None):
        self.client = client or Neo4jClient()
        self._in_memory_store: List[Dict[str, Any]] = []

    def store_event(self, event_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Store a completed FraudEvent into Neo4j (or local memory store if offline).

        Args:
            event_payload: Complete structured JSON output from /api/analyze.

        Returns:
            Dict containing storage status, event_id, and metadata.
        """
        event_meta = event_payload.get("event", {})
        event_id = event_meta.get("event_id", f"evt_{int(time.time()*1000)}")
        user_id = event_meta.get("user_id") or "anonymous_user"
        channel = event_meta.get("channel", "SMS")
        source_id = event_meta.get("source_id", "unknown_source")
        timestamp = event_meta.get("timestamp", datetime.utcnow().isoformat() + "Z")

        classification = event_payload.get("classification", {})
        label = classification.get("label", "UNKNOWN")
        confidence = float(classification.get("confidence", 0.0))

        analysis = event_payload.get("analysis", {})
        fraud_type = analysis.get("fraud_type", "UNKNOWN")

        evidence = event_payload.get("evidence", {})
        entities = evidence.get("entities", {})

        urls = entities.get("urls", [])
        domains = entities.get("domains", [])
        phones = entities.get("phone_numbers", [])
        if source_id and source_id.startswith("+") and source_id not in phones:
            phones.append(source_id)

        # 1. Attempt Live Neo4j Storage if connected
        if self.client.is_connected:
            session = self.client.get_session()
            if session:
                try:
                    cypher_query = """
                    MERGE (u:User {id: $user_id})
                    CREATE (e:Event {
                        id: $event_id,
                        channel: $channel,
                        source_id: $source_id,
                        timestamp: $timestamp,
                        label: $label,
                        confidence: $confidence,
                        fraud_type: $fraud_type
                    })
                    MERGE (u)-[:RECEIVED]->(e)
                    MERGE (ft:FraudType {name: $fraud_type})
                    MERGE (e)-[:TARGETS]->(ft)
                    WITH e
                    UNWIND $phones AS phone_num
                    MERGE (p:Phone {number: phone_num})
                    MERGE (e)-[:FROM]->(p)
                    WITH e
                    UNWIND $urls AS url_val
                    MERGE (u_node:URL {url: url_val})
                    MERGE (e)-[:CONTAINS]->(u_node)
                    WITH e
                    UNWIND $domains AS dom_val
                    MERGE (d_node:Domain {name: dom_val})
                    MERGE (e)-[:CONTAINS]->(d_node)
                    RETURN e.id AS created_id
                    """

                    params = {
                        "user_id": user_id,
                        "event_id": event_id,
                        "channel": channel,
                        "source_id": source_id,
                        "timestamp": timestamp,
                        "label": label,
                        "confidence": confidence,
                        "fraud_type": fraud_type,
                        "phones": phones or ["none"],
                        "urls": urls or ["none"],
                        "domains": domains or ["none"],
                    }

                    result = session.run(cypher_query, params)
                    session.close()
                    logger.info(f"[Neo4j] Successfully persisted event {event_id} to Neo4j graph.")

                    return {
                        "status": "stored",
                        "storage": "neo4j_live",
                        "event_id": event_id,
                        "user_id": user_id,
                        "stored_at": datetime.utcnow().isoformat() + "Z",
                        "graph_summary": {
                            "phones_linked": len(phones),
                            "urls_linked": len(urls),
                            "domains_linked": len(domains),
                            "fraud_type": fraud_type
                        }
                    }
                except Exception as exc:
                    logger.warning(f"[Neo4j] Failed to write event to Neo4j ({exc}). Falling back to memory store.")
                    if session:
                        session.close()

        # 2. Fallback in-memory storage (when Neo4j is offline / unconfigured)
        self._in_memory_store.append({
            "event_id": event_id,
            "user_id": user_id,
            "channel": channel,
            "source_id": source_id,
            "timestamp": timestamp,
            "label": label,
            "confidence": confidence,
            "fraud_type": fraud_type,
            "phones": phones,
            "urls": urls,
            "domains": domains,
            "stored_at": datetime.utcnow().isoformat() + "Z"
        })

        return {
            "status": "stored",
            "storage": "in_memory_queue",
            "event_id": event_id,
            "user_id": user_id,
            "stored_at": datetime.utcnow().isoformat() + "Z",
            "graph_summary": {
                "phones_linked": len(phones),
                "urls_linked": len(urls),
                "domains_linked": len(domains),
                "fraud_type": fraud_type
            }
        }
