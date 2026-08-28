import os
import csv
import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Set, Tuple
from neo4j import GraphDatabase, Driver, Session

try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(dotenv_path=env_path)
    load_dotenv()
except ImportError:
    pass

try:
    from graphdatascience import GraphDataScience
    HAS_GDS_CLIENT = True
except ImportError:
    HAS_GDS_CLIENT = False

def parse_iso_timestamp(ts_str: str) -> datetime:
    """Parses ISO-8601 timestamp string into datetime object."""
    ts_clean = ts_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(ts_clean)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

class Neo4jScamGraphStore:
    """
    Neo4j Graph Database Handler for SeniorShield Scam Campaign Correlation Engine.
    Supports Neo4j AuraDB (bolt:// / neo4j+s://) with environment variable credentials.
    """
    def __init__(
        self,
        uri: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None
    ):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.username = username or os.getenv("NEO4J_USER", os.getenv("NEO4J_USERNAME", "neo4j"))
        self.password = password or os.getenv("NEO4J_PASSWORD", "password")
        self.database = database or os.getenv("NEO4J_DATABASE", "neo4j")
        self.driver: Optional[Driver] = None



    def connect(self) -> Driver:
        """Establishes connection to Neo4j AuraDB / local instance."""
        if not self.driver:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.username, self.password)
            )
        return self.driver

    def close(self):
        """Closes active driver connection."""
        if self.driver:
            self.driver.close()
            self.driver = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    # -------------------------------------------------------------------------
    # Schema & Constraints Initialization
    # -------------------------------------------------------------------------
    def init_schema(self):
        """
        Creates uniqueness constraints for Event, PhoneNumber, SenderID, Domain, App, and Campaign nodes.
        """
        constraints = [
            "CREATE CONSTRAINT event_id_unique IF NOT EXISTS FOR (e:Event) REQUIRE e.event_id IS UNIQUE",
            "CREATE CONSTRAINT phone_number_unique IF NOT EXISTS FOR (p:PhoneNumber) REQUIRE p.number IS UNIQUE",
            "CREATE CONSTRAINT sender_id_unique IF NOT EXISTS FOR (s:SenderID) REQUIRE s.sender_id IS UNIQUE",
            "CREATE CONSTRAINT domain_name_unique IF NOT EXISTS FOR (d:Domain) REQUIRE d.domain_name IS UNIQUE",
            "CREATE CONSTRAINT app_name_unique IF NOT EXISTS FOR (a:App) REQUIRE a.name IS UNIQUE",
            "CREATE CONSTRAINT campaign_id_unique IF NOT EXISTS FOR (c:Campaign) REQUIRE c.campaign_id IS UNIQUE"
        ]
        
        with self.driver.session(database=self.database) as session:
            for cypher in constraints:
                session.run(cypher)
        print("[Neo4j] Schema uniqueness constraints successfully created/verified.")

    # -------------------------------------------------------------------------
    # Node Creation Functions
    # -------------------------------------------------------------------------
    @staticmethod
    def create_event_node(session: Session, event_data: Dict[str, Any]):
        """Creates or merges an Event node."""
        query = """
        MERGE (e:Event {event_id: $event_id})
        SET e.timestamp = $timestamp,
            e.channel = $channel,
            e.risk_score = toFloat($risk_score),
            e.intent = $intent
        RETURN e
        """
        session.run(
            query,
            event_id=event_data["event_id"],
            timestamp=event_data["timestamp"],
            channel=event_data["channel"],
            risk_score=float(event_data["risk_score"]),
            intent=event_data["intent"]
        )

    @staticmethod
    def create_phone_number_node(session: Session, phone_number: str):
        """Creates or merges a PhoneNumber node."""
        if not phone_number:
            return
        query = "MERGE (p:PhoneNumber {number: $number}) RETURN p"
        session.run(query, number=phone_number)

    @staticmethod
    def create_sender_id_node(session: Session, sender_id: str):
        """Creates or merges a SenderID node."""
        if not sender_id:
            return
        query = "MERGE (s:SenderID {sender_id: $sender_id}) RETURN s"
        session.run(query, sender_id=sender_id)

    @staticmethod
    def create_domain_node(session: Session, domain_name: str):
        """Creates or merges a Domain node."""
        if not domain_name:
            return
        query = "MERGE (d:Domain {domain_name: $domain_name}) RETURN d"
        session.run(query, domain_name=domain_name)

    @staticmethod
    def create_app_node(session: Session, app_name: str):
        """Creates or merges an App node."""
        if not app_name:
            return
        query = "MERGE (a:App {name: $name}) RETURN a"
        session.run(query, name=app_name)

    @staticmethod
    def create_campaign_node(session: Session, campaign_data: Dict[str, Any]):
        """Creates or merges a Campaign node."""
        query = """
        MERGE (c:Campaign {campaign_id: $campaign_id})
        SET c.community_id = toInteger($community_id),
            c.threat_level = $threat_level,
            c.avg_risk_score = toFloat($avg_risk_score),
            c.max_risk_score = toFloat($max_risk_score),
            c.cumulative_risk = toFloat($cumulative_risk),
            c.total_events = toInteger($total_events)
        RETURN c
        """
        session.run(
            query,
            campaign_id=campaign_data["campaign_id"],
            community_id=campaign_data.get("community_id", -1),
            threat_level=campaign_data.get("threat_level", "UNKNOWN"),
            avg_risk_score=campaign_data.get("avg_risk_score", 0.0),
            max_risk_score=campaign_data.get("max_risk_score", 0.0),
            cumulative_risk=campaign_data.get("cumulative_risk", 0.0),
            total_events=campaign_data.get("total_events", 0)
        )

    # -------------------------------------------------------------------------
    # Relationship Creation Functions: INVOLVES, TEMPORAL_LINK, BELONGS_TO
    # -------------------------------------------------------------------------
    @staticmethod
    def create_involves_relationship(
        session: Session,
        source_label: str,
        source_key: str,
        source_val: str,
        target_label: str,
        target_key: str,
        target_val: str
    ):
        """
        Creates an INVOLVES relationship between nodes:
        (Event)-[:INVOLVES]->(PhoneNumber/SenderID/Domain/App) or (Campaign)-[:INVOLVES]->(Event)
        """
        query = f"""
        MATCH (a:{source_label} {{{source_key}: $source_val}})
        MATCH (b:{target_label} {{{target_key}: $target_val}})
        MERGE (a)-[r:INVOLVES]->(b)
        RETURN r
        """
        session.run(query, source_val=source_val, target_val=target_val)

    @staticmethod
    def create_belongs_to_relationship(
        session: Session,
        event_id: str,
        campaign_id: str
    ):
        """
        Creates a BELONGS_TO relationship linking an Event to its Campaign node:
        (Event)-[:BELONGS_TO]->(Campaign)
        """
        query = """
        MATCH (e:Event {event_id: $event_id})
        MATCH (c:Campaign {campaign_id: $campaign_id})
        MERGE (e)-[r:BELONGS_TO]->(c)
        RETURN r
        """
        session.run(query, event_id=event_id, campaign_id=campaign_id)

    @staticmethod
    def create_temporal_link_relationship(
        session: Session,
        prev_event_id: str,
        next_event_id: str,
        delta_hours: float,
        weight: float
    ):
        """
        Creates a TEMPORAL_LINK relationship between events within 72 hours:
        (Event1)-[:TEMPORAL_LINK {delta_hours: ..., weight: 1/(hours_difference+1)}]->(Event2)
        """
        query = """
        MATCH (e1:Event {event_id: $prev_event_id})
        MATCH (e2:Event {event_id: $next_event_id})
        MERGE (e1)-[r:TEMPORAL_LINK]->(e2)
        SET r.delta_hours = toFloat($delta_hours),
            r.weight = toFloat($weight)
        RETURN r
        """
        session.run(
            query,
            prev_event_id=prev_event_id,
            next_event_id=next_event_id,
            delta_hours=delta_hours,
            weight=weight
        )

    # -------------------------------------------------------------------------
    # Ingestion Workflows
    # -------------------------------------------------------------------------
    def ingest_full_event(self, session: Session, event_data: Dict[str, Any]):
        """
        Creates Event node and connected entity nodes (PhoneNumber, SenderID, Domain, App),
        and builds INVOLVES relationships.
        """
        self.create_event_node(session, event_data)

        if event_data.get("phone"):
            phone = event_data["phone"].strip()
            if phone:
                self.create_phone_number_node(session, phone)
                self.create_involves_relationship(
                    session, "Event", "event_id", event_data["event_id"],
                    "PhoneNumber", "number", phone
                )

        if event_data.get("sender"):
            sender = event_data["sender"].strip()
            if sender:
                self.create_sender_id_node(session, sender)
                self.create_involves_relationship(
                    session, "Event", "event_id", event_data["event_id"],
                    "SenderID", "sender_id", sender
                )

        if event_data.get("domain"):
            domain = event_data["domain"].strip()
            if domain:
                self.create_domain_node(session, domain)
                self.create_involves_relationship(
                    session, "Event", "event_id", event_data["event_id"],
                    "Domain", "domain_name", domain
                )

        if event_data.get("app"):
            app = event_data["app"].strip()
            if app:
                self.create_app_node(session, app)
                self.create_involves_relationship(
                    session, "Event", "event_id", event_data["event_id"],
                    "App", "name", app
                )

    def ingest_campaign_results(self, analysis_results: Dict[str, Any]):
        """
        Ingests full campaign analysis results into Neo4j graph using batched Cypher queries:
        - Batches Campaign nodes, Event nodes, and entity nodes (PhoneNumber, SenderID, Domain, App).
        - Builds (Campaign)-[:INVOLVES]->(Event) and (Event)-[:INVOLVES]->(Entity) relationships.
        - Builds (Event)-[:TEMPORAL_LINK]->(Event) relationships between consecutive timeline events.
        """
        self.init_schema()
        campaigns = analysis_results.get("campaigns", [])
        if not campaigns:
            print("[Neo4j] No campaigns to ingest.")
            return

        with self.driver.session(database=self.database) as session:
            # 1. Batch Create Campaign Nodes
            session.run("""
                UNWIND $campaigns AS c
                MERGE (camp:Campaign {campaign_id: c.campaign_id})
                SET camp.community_id = toInteger(c.community_id),
                    camp.threat_level = c.threat_level,
                    camp.avg_risk_score = toFloat(c.avg_risk_score),
                    camp.max_risk_score = toFloat(c.max_risk_score),
                    camp.cumulative_risk = toFloat(c.cumulative_risk),
                    camp.total_events = toInteger(c.total_events)
            """, campaigns=campaigns)

            # Gather all events & relations across campaigns
            events_batch = []
            campaign_event_links = []
            temporal_links = []

            for campaign in campaigns:
                camp_id = campaign["campaign_id"]
                timeline = campaign.get("timeline", [])
                for i, evt in enumerate(timeline):
                    events_batch.append(evt)
                    campaign_event_links.append({"campaign_id": camp_id, "event_id": evt["event_id"]})
                    if i > 0:
                        prev_evt = timeline[i - 1]
                        temporal_links.append({
                            "prev_id": prev_evt["event_id"],
                            "next_id": evt["event_id"],
                            "delta_hours": 0.0,
                            "weight": 1.0
                        })

            # 2. Batch Create Event & Entity Nodes & Relationships
            session.run("""
                UNWIND $events AS evt
                MERGE (e:Event {event_id: evt.event_id})
                SET e.timestamp = evt.timestamp,
                    e.channel = evt.channel,
                    e.phone = evt.phone,
                    e.sender = evt.sender,
                    e.domain = evt.domain,
                    e.app = evt.app,
                    e.risk_score = toFloat(evt.risk_score),
                    e.intent = evt.intent

                WITH e, evt
                FOREACH (_ IN CASE WHEN evt.phone IS NOT NULL AND evt.phone <> '' THEN [1] ELSE [] END |
                    MERGE (p:PhoneNumber {number: evt.phone})
                    MERGE (e)-[:INVOLVES]->(p)
                )
                FOREACH (_ IN CASE WHEN evt.sender IS NOT NULL AND evt.sender <> '' THEN [1] ELSE [] END |
                    MERGE (s:SenderID {sender_id: evt.sender})
                    MERGE (e)-[:INVOLVES]->(s)
                )
                FOREACH (_ IN CASE WHEN evt.domain IS NOT NULL AND evt.domain <> '' THEN [1] ELSE [] END |
                    MERGE (d:Domain {domain_name: evt.domain})
                    MERGE (e)-[:INVOLVES]->(d)
                )
                FOREACH (_ IN CASE WHEN evt.app IS NOT NULL AND evt.app <> '' THEN [1] ELSE [] END |
                    MERGE (a:App {name: evt.app})
                    MERGE (e)-[:INVOLVES]->(a)
                )
            """, events=events_batch)

            # 3. Batch Create Campaign -> Event links
            session.run("""
                UNWIND $links AS l
                MATCH (c:Campaign {campaign_id: l.campaign_id})
                MATCH (e:Event {event_id: l.event_id})
                MERGE (c)-[:INVOLVES]->(e)
            """, links=campaign_event_links)

            # 4. Batch Create Temporal links
            if temporal_links:
                session.run("""
                    UNWIND $links AS l
                    MATCH (e1:Event {event_id: l.prev_id})
                    MATCH (e2:Event {event_id: l.next_id})
                    MERGE (e1)-[r:TEMPORAL_LINK]->(e2)
                    SET r.delta_hours = toFloat(l.delta_hours),
                        r.weight = toFloat(l.weight)
                """, links=temporal_links)

        print("[Neo4j] Campaign graph ingestion complete.")

    def load_events_csv(self, csv_filepath: str = "events.csv") -> Dict[str, int]:
        """
        Reads events.csv and for each event:
        1. Creates Event node.
        2. Creates/merges entity nodes (PhoneNumber, SenderID, Domain, App).
        3. Creates INVOLVES relationships.
        4. Creates TEMPORAL_LINK relationships between events of the same channel or sharing an entity
           that occur within 72 hours, with weight = 1 / (hours_difference + 1).
        """
        self.init_schema()
        
        events: List[Dict[str, Any]] = []
        with open(csv_filepath, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                events.append(row)

        events_parsed = []
        for e in events:
            dt = parse_iso_timestamp(e["timestamp"])
            events_parsed.append((dt, e))
        events_parsed.sort(key=lambda x: x[0])

        events_created = 0
        temporal_links_created = 0

        with self.driver.session(database=self.database) as session:
            for dt, event_data in events_parsed:
                self.ingest_full_event(session, event_data)
                events_created += 1

            n = len(events_parsed)
            for i in range(n):
                dt1, e1 = events_parsed[i]
                
                e1_entities = set()
                if e1.get("phone"): e1_entities.add(f"phone:{e1['phone'].strip()}")
                if e1.get("sender"): e1_entities.add(f"sender:{e1['sender'].strip()}")
                if e1.get("domain"): e1_entities.add(f"domain:{e1['domain'].strip()}")
                if e1.get("app"): e1_entities.add(f"app:{e1['app'].strip()}")

                for j in range(i + 1, n):
                    dt2, e2 = events_parsed[j]
                    delta_seconds = (dt2 - dt1).total_seconds()
                    delta_hours = delta_seconds / 3600.0

                    if delta_hours > 72.0:
                        break

                    same_channel = (e1.get("channel") == e2.get("channel")) and bool(e1.get("channel"))
                    
                    e2_entities = set()
                    if e2.get("phone"): e2_entities.add(f"phone:{e2['phone'].strip()}")
                    if e2.get("sender"): e2_entities.add(f"sender:{e2['sender'].strip()}")
                    if e2.get("domain"): e2_entities.add(f"domain:{e2['domain'].strip()}")
                    if e2.get("app"): e2_entities.add(f"app:{e2['app'].strip()}")

                    shared_entities = e1_entities.intersection(e2_entities)

                    if same_channel or shared_entities:
                        weight = 1.0 / (delta_hours + 1.0)
                        self.create_temporal_link_relationship(
                            session,
                            prev_event_id=e1["event_id"],
                            next_event_id=e2["event_id"],
                            delta_hours=round(delta_hours, 4),
                            weight=round(weight, 6)
                        )
                        temporal_links_created += 1

        print(f"[Neo4j] Ingested {events_created} events and created {temporal_links_created} TEMPORAL_LINK relationships from '{csv_filepath}'.")
        return {
            "events_ingested": events_created,
            "temporal_links_created": temporal_links_created
        }

    # -------------------------------------------------------------------------
    # Graph Data Science (GDS) - Leiden Community Detection & Campaign Clustering
    # -------------------------------------------------------------------------
    def run_leiden_community_detection(
        self,
        graph_name: str = "scamEventGraph",
        write_property: str = "communityId"
    ) -> Dict[str, Any]:
        """
        Using Neo4j Graph Data Science (GDS):
        1. Projects the Event graph with TEMPORAL_LINK relationships and 'weight' property.
        2. Executes gds.leiden.write algorithm with TEMPORAL_LINK weights.
        3. Writes communityId back to each Event node in the Neo4j database.
        """
        if HAS_GDS_CLIENT:
            try:
                gds = GraphDataScience(self.uri, auth=(self.username, self.password))
                if gds.graph.exists(graph_name).exists:
                    gds.graph.drop(gds.graph.get(graph_name))

                G, proj_result = gds.graph.project(
                    graph_name,
                    "Event",
                    {
                        "TEMPORAL_LINK": {
                            "type": "TEMPORAL_LINK",
                            "orientation": "UNDIRECTED",
                            "properties": "weight"
                        }
                    }
                )

                leiden_result = gds.leiden.write(
                    G,
                    writeProperty=write_property,
                    relationshipWeightProperty="weight",
                    includeIntermediateCommunities=False
                )

                res_dict = {
                    "nodeCount": proj_result["nodeCount"],
                    "relationshipCount": proj_result["relationshipCount"],
                    "communityCount": leiden_result["communityCount"],
                    "modularity": leiden_result.get("modularity", 0.0),
                    "writeProperty": write_property
                }
                print(f"[GDS Python Client] Leiden community detection finished: {res_dict['communityCount']} communities detected.")
                return res_dict
            except Exception as e:
                print(f"[GDS Python Client Info] Falling back to Cypher GDS procedures: {e}")

        with self.driver.session(database=self.database) as session:
            drop_query = "CALL gds.graph.drop($graph_name, false) YIELD graphName"
            try:
                session.run(drop_query, graph_name=graph_name)
            except Exception:
                pass

            project_query = """
            CALL gds.graph.project(
                $graph_name,
                'Event',
                {
                    TEMPORAL_LINK: {
                        type: 'TEMPORAL_LINK',
                        orientation: 'UNDIRECTED',
                        properties: 'weight'
                    }
                }
            )
            YIELD graphName, nodeCount, relationshipCount
            """
            proj = session.run(project_query, graph_name=graph_name).single()
            node_count = proj["nodeCount"] if proj else 0
            rel_count = proj["relationshipCount"] if proj else 0

            leiden_query = """
            CALL gds.leiden.write(
                $graph_name,
                {
                    writeProperty: $write_property,
                    relationshipWeightProperty: 'weight',
                    includeIntermediateCommunities: false
                }
            )
            YIELD communityCount, modularity
            """
            leiden = session.run(leiden_query, graph_name=graph_name, write_property=write_property).single()
            community_count = leiden["communityCount"] if leiden else 0
            modularity = leiden["modularity"] if leiden and "modularity" in leiden else 0.0

            res_dict = {
                "nodeCount": node_count,
                "relationshipCount": rel_count,
                "communityCount": community_count,
                "modularity": modularity,
                "writeProperty": write_property
            }
            print(f"[Cypher GDS] Leiden community detection finished: {community_count} communities detected.")
            return res_dict

    # -------------------------------------------------------------------------
    # Group Events into Campaign Nodes with Time Decay Cumulative Risk
    # -------------------------------------------------------------------------
    def create_campaigns_from_leiden_communities(
        self,
        community_property: str = "communityId",
        decay_factor: float = 0.05
    ) -> List[Dict[str, Any]]:
        """
        Groups events by their Leiden community ID into Campaign nodes.
        For each campaign:
        1. Computes cumulative_risk as a weighted accumulation of member event risk_scores
           with exponential time decay factor:
               weight(e) = exp(-decay_factor * delta_hours_from_latest)
               cumulative_risk = sum(risk_score(e) * weight(e))
        2. Creates Campaign nodes.
        3. Creates (Event)-[:BELONGS_TO]->(Campaign) relationships.
        """
        query = f"""
        MATCH (e:Event)
        WHERE e.{community_property} IS NOT NULL
        RETURN e.event_id AS event_id,
               e.{community_property} AS community_id,
               e.timestamp AS timestamp,
               e.risk_score AS risk_score,
               e.channel AS channel,
               e.intent AS intent
        ORDER BY e.timestamp ASC
        """
        
        with self.driver.session(database=self.database) as session:
            records = session.run(query).data()

        if not records:
            print("[Neo4j Warning] No events found with communityId property. Run run_leiden_community_detection first.")
            return []

        # Group by community_id
        community_groups = defaultdict(list)
        for r in records:
            community_groups[r["community_id"]].append(r)

        campaign_summaries = []

        with self.driver.session(database=self.database) as session:
            for comm_id, member_events in community_groups.items():
                campaign_id = f"CAMPAIGN_LEIDEN_{comm_id}"

                # Parse timestamps
                events_with_dt = []
                for me in member_events:
                    dt = parse_iso_timestamp(me["timestamp"])
                    events_with_dt.append((dt, me))

                events_with_dt.sort(key=lambda x: x[0])
                latest_dt = events_with_dt[-1][0]

                # Compute time-decayed cumulative risk
                cumulative_risk = 0.0
                total_risk = 0.0
                max_risk = 0.0

                for dt, me in events_with_dt:
                    risk = float(me["risk_score"])
                    total_risk += risk
                    if risk > max_risk:
                        max_risk = risk

                    # Time difference in hours relative to latest event in campaign
                    delta_hours = (latest_dt - dt).total_seconds() / 3600.0
                    decay_weight = math.exp(-decay_factor * delta_hours)
                    cumulative_risk += risk * decay_weight

                avg_risk = total_risk / len(member_events)

                # Determine threat level
                if max_risk >= 0.85 or avg_risk >= 0.75:
                    threat_level = "CRITICAL"
                elif max_risk >= 0.65 or avg_risk >= 0.50:
                    threat_level = "HIGH"
                else:
                    threat_level = "MEDIUM"

                camp_data = {
                    "campaign_id": campaign_id,
                    "community_id": comm_id,
                    "threat_level": threat_level,
                    "avg_risk_score": round(avg_risk, 3),
                    "max_risk_score": round(max_risk, 3),
                    "cumulative_risk": round(cumulative_risk, 3),
                    "total_events": len(member_events)
                }

                # 1. Create Campaign node
                self.create_campaign_node(session, camp_data)

                # 2. Create (Event)-[:BELONGS_TO]->(Campaign) relationships
                for _, me in events_with_dt:
                    self.create_belongs_to_relationship(
                        session,
                        event_id=me["event_id"],
                        campaign_id=campaign_id
                    )

                campaign_summaries.append(camp_data)

        print(f"[Neo4j] Successfully created {len(campaign_summaries)} Campaign nodes & BELONGS_TO relationships from Leiden communities.")
        return campaign_summaries

if __name__ == "__main__":
    import sys
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "events.csv"
    with Neo4jScamGraphStore() as store:
        store.load_events_csv(csv_path)
        try:
            store.run_leiden_community_detection()
            store.create_campaigns_from_leiden_communities()
        except Exception as e:
            print(f"[NOTE] GDS procedure call requires Neo4j GDS plugin enabled on server: {e}")
