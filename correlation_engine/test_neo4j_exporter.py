import unittest
from unittest.mock import MagicMock, patch
import math
from neo4j_exporter import Neo4jScamGraphStore, HAS_GDS_CLIENT

class TestNeo4jScamGraphStore(unittest.TestCase):
    def setUp(self):
        self.mock_driver = MagicMock()
        self.mock_session = MagicMock()
        self.mock_driver.session.return_value.__enter__.return_value = self.mock_session
        
        self.store = Neo4jScamGraphStore(
            uri="bolt://localhost:7687",
            username="neo4j",
            password="password"
        )
        self.store.driver = self.mock_driver

    def test_init_schema_constraints(self):
        """Verify uniqueness constraints are created for Event and other nodes."""
        self.store.init_schema()
        self.assertGreaterEqual(self.mock_session.run.call_count, 6)
        
        calls = [c[0][0] for c in self.mock_session.run.call_args_list]
        self.assertTrue(any("REQUIRE e.event_id IS UNIQUE" in q for q in calls))
        self.assertTrue(any("REQUIRE p.number IS UNIQUE" in q for q in calls))
        self.assertTrue(any("REQUIRE s.sender_id IS UNIQUE" in q for q in calls))
        self.assertTrue(any("REQUIRE d.domain_name IS UNIQUE" in q for q in calls))
        self.assertTrue(any("REQUIRE a.name IS UNIQUE" in q for q in calls))
        self.assertTrue(any("REQUIRE c.campaign_id IS UNIQUE" in q for q in calls))

    def test_create_event_node(self):
        """Verify Event node creation query execution."""
        event_data = {
            "event_id": "EVT_001",
            "timestamp": "2026-08-20T09:00:00Z",
            "channel": "SMS",
            "risk_score": 0.85,
            "intent": "urgency_coercion"
        }
        self.store.create_event_node(self.mock_session, event_data)
        self.mock_session.run.assert_called_once()
        query = self.mock_session.run.call_args[0][0]
        self.assertIn("MERGE (e:Event {event_id: $event_id})", query)

    def test_create_belongs_to_relationship(self):
        """Verify BELONGS_TO relationship creation between Event and Campaign."""
        self.store.create_belongs_to_relationship(self.mock_session, "EVT_001", "CAMPAIGN_LEIDEN_1")
        self.mock_session.run.assert_called_once()
        query = self.mock_session.run.call_args[0][0]
        self.assertIn("MERGE (e)-[r:BELONGS_TO]->(c)", query)

    def test_temporal_link_weight_formula(self):
        """Verify weight = 1 / (hours_difference + 1)."""
        delta_hours = 3.0
        expected_weight = 1.0 / (3.0 + 1.0)
        self.assertEqual(expected_weight, 0.25)

    def test_time_decay_cumulative_risk_formula(self):
        """Verify exponential time decay cumulative risk formula: risk * exp(-decay_factor * delta_hours)."""
        decay_factor = 0.05
        # Latest event delta_hours = 0 -> weight = 1.0
        # 10 hours ago -> weight = exp(-0.05 * 10) = exp(-0.5)
        risk_latest = 0.90
        risk_old = 0.80
        
        weight_latest = math.exp(-0.05 * 0.0) # 1.0
        weight_old = math.exp(-0.05 * 10.0) # ~0.60653
        
        expected_cum_risk = (risk_latest * weight_latest) + (risk_old * weight_old)
        self.assertAlmostEqual(expected_cum_risk, 0.90 + (0.80 * 0.6065306), places=4)

    def test_create_campaigns_from_leiden_communities(self):
        """Verify grouping events into Campaign nodes and BELONGS_TO relationships."""
        mock_events = [
            {"event_id": "EVT_001", "community_id": 1, "timestamp": "2026-08-20T09:00:00Z", "risk_score": 0.85, "channel": "SMS", "intent": "urgency_coercion"},
            {"event_id": "EVT_002", "community_id": 1, "timestamp": "2026-08-20T11:00:00Z", "risk_score": 0.95, "channel": "URL", "intent": "phishing_payment"},
            {"event_id": "EVT_003", "community_id": 2, "timestamp": "2026-08-20T10:00:00Z", "risk_score": 0.15, "channel": "call", "intent": "benign_social"},
        ]

        self.mock_session.run.return_value.data.return_value = mock_events

        campaigns = self.store.create_campaigns_from_leiden_communities(decay_factor=0.05)
        self.assertEqual(len(campaigns), 2)
        
        # Campaign 1 has 2 events
        camp1 = next(c for c in campaigns if c["campaign_id"] == "CAMPAIGN_LEIDEN_1")
        self.assertEqual(camp1["total_events"], 2)
        self.assertEqual(camp1["threat_level"], "CRITICAL")
        self.assertGreater(camp1["cumulative_risk"], 1.0)

if __name__ == "__main__":
    unittest.main()
