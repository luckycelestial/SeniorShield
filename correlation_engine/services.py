import os
import math
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

try:
    from .correlation_engine import CampaignCorrelationEngine
    from .campaign_clustering import (
        run_leiden,
        attach_communities,
        summarize_campaigns,
        classify_campaigns,
        _to_dict
    )
    from .neo4j_exporter import Neo4jScamGraphStore
    from .schemas import (
        CorrelateEventRequest,
        CorrelateEventResponse,
        CampaignInfo,
        EvidenceInfo,
        DecisionInfo
    )
except ImportError:
    from correlation_engine import CampaignCorrelationEngine
    from campaign_clustering import (
        run_leiden,
        attach_communities,
        summarize_campaigns,
        classify_campaigns,
        _to_dict
    )
    from neo4j_exporter import Neo4jScamGraphStore
    from schemas import (
        CorrelateEventRequest,
        CorrelateEventResponse,
        CampaignInfo,
        EvidenceInfo,
        DecisionInfo
    )

class CorrelationService:
    def __init__(self, csv_filepath: Optional[str] = None):
        if csv_filepath is None:
            csv_filepath = os.path.join(os.path.dirname(__file__), "events.csv")
        self.csv_filepath = csv_filepath
        self.engine = CampaignCorrelationEngine(min_risk_threshold=0.50, min_cluster_events=3)
        self.events: List[Dict[str, Any]] = []
        self.load_initial_events()

    def load_initial_events(self):
        """Loads baseline events from CSV if present, or generates a baseline dataset."""
        if os.path.exists(self.csv_filepath):
            raw_events = self.engine.load_events_from_csv(self.csv_filepath)
            self.events = [_to_dict(e) for e in raw_events]
        else:
            from generate_dataset import generate_events
            raw_events = generate_events(output_file=self.csv_filepath, total_events=200, seed=42)
            self.events = [_to_dict(e) for e in raw_events]

    def correlate_single_event(
        self,
        req: CorrelateEventRequest,
        sync_neo4j: bool = True
    ) -> CorrelateEventResponse:
        """
        Normalizes input event, updates correlation state using the frozen Leiden algorithm,
        determines campaign state and evidence, and conditionally syncs with Neo4j.
        """
        # 1. Normalize Event Data
        new_event = {
            "event_id": req.event_id,
            "timestamp": req.timestamp,
            "channel": req.channel,
            "phone": req.phone.strip() if req.phone else "",
            "sender": req.sender.strip() if req.sender else "",
            "domain": req.domain.strip() if req.domain else "",
            "app": req.app.strip() if req.app else "",
            "risk_score": float(req.risk_score),
            "intent": req.intent.strip() if req.intent else ""
        }

        # Check if event_id already exists in event store, update or append
        existing_idx = next(
            (i for i, e in enumerate(self.events) if e["event_id"] == req.event_id),
            None
        )
        if existing_idx is not None:
            self.events[existing_idx] = new_event
        else:
            self.events.append(new_event)

        # 2. Run Frozen Leiden Community Correlation Engine
        leiden_memberships, leiden_stats = run_leiden(self.events, resolution=1.0, seed=42)
        events_with_communities = attach_communities(self.events, leiden_memberships)
        all_communities = summarize_campaigns(events_with_communities)
        scam_campaigns, benign_communities = classify_campaigns(all_communities)

        # 3. Locate Target Event's Community / Campaign
        target_event = next(
            (e for e in events_with_communities if e["event_id"] == req.event_id),
            None
        )
        if not target_event:
            raise ValueError(f"Failed to locate correlated event {req.event_id}")

        community_id = target_event["community_id"]
        
        # Find matching community summary from all_communities
        target_summary = next(
            (c for c in all_communities if c["community_id"] == community_id),
            None
        )
        if not target_summary:
            raise ValueError(f"Community summary for ID {community_id} not found")

        is_scam = target_summary.get("classification") == "SCAM_CAMPAIGN"
        
        # 4. Construct Campaign & Evidence Data
        channels = target_summary["channels_involved"]
        cross_channel = len(channels) > 1
        avg_risk = target_summary["avg_risk_score"]
        
        # Confidence calculation based on risk, infrastructure, and multi-channel coverage
        infra = target_summary["shared_identifiers"]
        infra_count = len(infra["phones"]) + len(infra["senders"]) + len(infra["domains"])
        confidence = round(min(1.0, 0.40 + (avg_risk * 0.40) + (0.15 if cross_channel else 0.0) + (0.05 * min(3, infra_count))), 2)

        threat_level = target_summary["threat_level"] if is_scam else "LOW"
        classification = "SCAM_CAMPAIGN" if is_scam else "BENIGN_OR_NOISE"
        action = "ALERT" if is_scam else "MONITOR"

        campaign_info = CampaignInfo(
            campaign_id=target_summary["campaign_id"],
            community_id=community_id,
            threat_level=threat_level,
            risk_score=avg_risk,
            confidence=confidence,
            total_events=target_summary["total_events"],
            channels=channels
        )

        evidence_info = EvidenceInfo(
            phones=infra["phones"],
            senders=infra["senders"],
            domains=infra["domains"],
            apps=infra["apps"],
            cross_channel=cross_channel
        )

        decision_info = DecisionInfo(
            classification=classification,
            action=action
        )

        # 5. Persist Graph State to Neo4j if sync_neo4j is True
        if sync_neo4j:
            try:
                uri = os.getenv("NEO4J_URI", "neo4j+ssc://6d61e62c.databases.neo4j.io")
                user = os.getenv("NEO4J_USER", "neo4j")
                pwd = os.getenv("NEO4J_PASSWORD", "ljN94kP1sPlIcftBipMwLcCGch879WqxoHRkXOqlldY")
                db = os.getenv("NEO4J_DATABASE", "neo4j")
                
                with Neo4jScamGraphStore(uri=uri, username=user, password=pwd, database=db) as store:
                    store.ingest_campaign_results({"campaigns": [target_summary]})
            except Exception as e:
                # Log Neo4j sync error without breaking endpoint execution unless required
                print(f"[WARNING] Neo4j sync warning for event {req.event_id}: {e}")

        return CorrelateEventResponse(
            event_id=req.event_id,
            campaign=campaign_info,
            evidence=evidence_info,
            decision=decision_info
        )
