import os
import sys
import unittest
from fastapi.testclient import TestClient

CE_DIR = r"c:\Users\RAJENDRAN\CIT_Hack\SeniorShield\correlation_engine"
if CE_DIR not in sys.path:
    sys.path.insert(0, CE_DIR)

from api import app, correlation_service

class TestCorrelationAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_valid_sms_event(self):
        payload = {
            "event_id": "TEST_SMS_001",
            "timestamp": "2026-08-28T10:00:00+05:30",
            "channel": "SMS",
            "text": "Your electricity bill is unpaid.",
            "phone": "+919876543210",
            "sender": "EB-NOTIF",
            "domain": "pay-elec-bill-now.com",
            "risk_score": 0.88
        }
        res = self.client.post("/api/v1/correlate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["event_id"], "TEST_SMS_001")
        self.assertIn("campaign", data)
        self.assertIn("evidence", data)
        self.assertIn("decision", data)

    def test_02_valid_call_event(self):
        payload = {
            "event_id": "TEST_CALL_001",
            "timestamp": "2026-08-28T10:15:00+05:30",
            "channel": "call",
            "text": "Urgent police verification call",
            "phone": "+919123456789",
            "sender": "CBI-NOTICE",
            "risk_score": 0.95
        }
        res = self.client.post("/api/v1/correlate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["event_id"], "TEST_CALL_001")
        self.assertEqual(data["decision"]["classification"], "SCAM_CAMPAIGN")

    def test_03_valid_url_event(self):
        payload = {
            "event_id": "TEST_URL_001",
            "timestamp": "2026-08-28T10:30:00+05:30",
            "channel": "URL",
            "domain": "sbi-kyc-update-portal.org",
            "phone": "+919988776655",
            "risk_score": 0.92
        }
        res = self.client.post("/api/v1/correlate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["event_id"], "TEST_URL_001")
        self.assertIn("sbi-kyc-update-portal.org", data["evidence"]["domains"])

    def test_04_valid_payment_event(self):
        payload = {
            "event_id": "TEST_PAY_001",
            "timestamp": "2026-08-28T10:45:00+05:30",
            "channel": "payment",
            "app": "GPay",
            "phone": "+919876543210",
            "domain": "electricity-update.in",
            "risk_score": 0.89
        }
        res = self.client.post("/api/v1/correlate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["event_id"], "TEST_PAY_001")

    def test_05_missing_timestamp(self):
        payload = {
            "event_id": "TEST_NO_TS",
            "channel": "SMS",
            "phone": "+919876543210",
            "risk_score": 0.50
        }
        res = self.client.post("/api/v1/correlate", json=payload)
        self.assertIn(res.status_code, [400, 422])
        self.assertEqual(res.json()["error"], "Bad Request")

    def test_06_invalid_channel(self):
        payload = {
            "event_id": "TEST_BAD_CH",
            "timestamp": "2026-08-28T11:00:00+05:30",
            "channel": "BLUETOOTH",
            "risk_score": 0.50
        }
        res = self.client.post("/api/v1/correlate", json=payload)
        self.assertEqual(res.status_code, 422)
        self.assertEqual(res.json()["error"], "Unprocessable Entity")

    def test_07_malformed_risk_score(self):
        payload = {
            "event_id": "TEST_BAD_RISK",
            "timestamp": "2026-08-28T11:15:00+05:30",
            "channel": "SMS",
            "risk_score": 5.5  # Invalid risk_score > 1.0
        }
        res = self.client.post("/api/v1/correlate", json=payload)
        self.assertEqual(res.status_code, 422)
        self.assertEqual(res.json()["error"], "Unprocessable Entity")

    def test_08_missing_event_id(self):
        payload = {
            "timestamp": "2026-08-28T11:30:00+05:30",
            "channel": "SMS",
            "risk_score": 0.50
        }
        res = self.client.post("/api/v1/correlate", json=payload)
        self.assertIn(res.status_code, [400, 422])
        self.assertEqual(res.json()["error"], "Bad Request")

    def test_09_neo4j_unavailable(self):
        # Override NEO4J_URI to an invalid host and pass strict dependency header
        old_uri = os.environ.get("NEO4J_URI", "")
        os.environ["NEO4J_URI"] = "neo4j+ssc://invalid-host-9999.databases.neo4j.io"
        try:
            payload = {
                "event_id": "TEST_NEO4J_ERR",
                "timestamp": "2026-08-28T11:45:00+05:30",
                "channel": "SMS",
                "risk_score": 0.50
            }
            res = self.client.post("/api/v1/correlate", json=payload, headers={"X-Neo4j-Required": "true"})
            self.assertEqual(res.status_code, 503)
            self.assertEqual(res.json()["error"], "Service Unavailable")
        finally:
            if old_uri:
                os.environ["NEO4J_URI"] = old_uri

    def test_10_known_synthetic_campaign_event(self):
        payload = {
            "event_id": "EVT_001",
            "timestamp": "2026-08-28T10:30:00+05:30",
            "channel": "SMS",
            "text": "Your electricity bill is overdue",
            "phone": "+919876543210",
            "sender": "EB-NOTIF",
            "domain": "electricity-update.in",
            "app": None,
            "risk_score": 0.91
        }
        res = self.client.post("/api/v1/correlate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        self.assertEqual(data["event_id"], "EVT_001")
        self.assertTrue(data["campaign"]["campaign_id"].startswith("CAMPAIGN_LEIDEN_"))
        self.assertEqual(data["campaign"]["threat_level"], "CRITICAL")
        self.assertEqual(data["decision"]["classification"], "SCAM_CAMPAIGN")
        self.assertEqual(data["decision"]["action"], "ALERT")
        self.assertTrue(data["evidence"]["cross_channel"])

if __name__ == "__main__":
    unittest.main()
