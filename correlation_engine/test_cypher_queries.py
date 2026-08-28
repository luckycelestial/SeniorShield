import unittest
from unittest.mock import MagicMock
from neo4j_exporter import Neo4jScamGraphStore
from cypher_queries import (
    QUERY_1_LIST_CAMPAIGNS,
    QUERY_2_EVENTS_BY_PHONE,
    QUERY_3_CROSS_CHANNEL_PATH,
    execute_and_print_scam_queries
)

class TestCypherQueries(unittest.TestCase):
    def setUp(self):
        self.mock_driver = MagicMock()
        self.mock_session = MagicMock()
        self.mock_driver.session.return_value.__enter__.return_value = self.mock_session
        
        self.store = Neo4jScamGraphStore()
        self.store.driver = self.mock_driver

    def test_query_1_cypher_structure(self):
        """Verify Query 1 Cypher syntax components."""
        self.assertIn("MATCH (c:Campaign)", QUERY_1_LIST_CAMPAIGNS)
        self.assertIn("OPTIONAL MATCH (e:Event)-[:BELONGS_TO]->(c)", QUERY_1_LIST_CAMPAIGNS)
        self.assertIn("c.cumulative_risk AS cumulative_risk", QUERY_1_LIST_CAMPAIGNS)

    def test_query_2_cypher_structure(self):
        """Verify Query 2 Cypher syntax components."""
        self.assertIn("MATCH (p:PhoneNumber {number: $phone_number})<-[:INVOLVES]-(e:Event)", QUERY_2_EVENTS_BY_PHONE)
        self.assertIn("c.campaign_id AS campaign_id", QUERY_2_EVENTS_BY_PHONE)

    def test_query_3_cypher_structure(self):
        """Verify Query 3 cross-channel path syntax components."""
        self.assertIn("callEvent:Event {channel: 'call'}", QUERY_3_CROSS_CHANNEL_PATH)
        self.assertIn("smsEvent:Event {channel: 'SMS'}", QUERY_3_CROSS_CHANNEL_PATH)
        self.assertIn("urlEvent:Event {channel: 'URL'}", QUERY_3_CROSS_CHANNEL_PATH)

    def test_execute_and_print_queries(self):
        """Verify execution flow of all 3 Cypher queries."""
        mock_res1 = MagicMock()
        mock_res1.data.return_value = [
            {"campaign_id": "CAMPAIGN_01", "threat_level": "CRITICAL", "event_count": 50, "cumulative_risk": 42.92, "avg_risk_score": 0.858, "max_risk_score": 0.98}
        ]
        
        mock_res2 = MagicMock()
        mock_res2.data.return_value = [
            {"event_id": "EVT_001", "channel": "call", "timestamp": "2026-08-20T09:29:00Z", "risk_score": 0.9, "intent": "fake_utility", "campaign_id": "CAMPAIGN_01"}
        ]
        
        mock_res3 = MagicMock()
        mock_res3.data.return_value = [
            {
                "campaign_id": "CAMPAIGN_01",
                "call_event_id": "EVT_001", "call_time": "2026-08-20T09:00:00Z", "call_intent": "urgency_coercion",
                "call_to_sms_hours": 0.25,
                "sms_event_id": "EVT_002", "sms_time": "2026-08-20T09:15:00Z", "sms_intent": "phishing_link",
                "sms_to_url_hours": 0.50,
                "url_event_id": "EVT_003", "url_time": "2026-08-20T09:45:00Z", "url_intent": "credential_harvest"
            }
        ]

        self.mock_session.run.side_effect = [mock_res1, mock_res2, mock_res3]

        execute_and_print_scam_queries(self.store, target_phone="+919876543210")
        self.assertEqual(self.mock_session.run.call_count, 3)

if __name__ == "__main__":
    unittest.main()
