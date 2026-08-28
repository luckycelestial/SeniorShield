import os
import csv
import unittest
from generate_dataset import generate_events
from correlation_engine import CampaignCorrelationEngine

class TestScamCorrelationEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_csv = "test_events.csv"
        generate_events(output_file=cls.test_csv, total_events=200, seed=42)
        cls.engine = CampaignCorrelationEngine(min_risk_threshold=0.50, min_cluster_events=3)
        cls.events = cls.engine.load_events_from_csv(cls.test_csv)
        cls.results = cls.engine.analyze(cls.events)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.test_csv):
            os.remove(cls.test_csv)

    def test_dataset_size_and_schema(self):
        """Verify 200 events exist with all 9 required schema fields."""
        self.assertEqual(len(self.events), 200)
        
        required_fields = {"event_id", "timestamp", "channel", "phone", "sender", "domain", "app", "risk_score", "intent"}
        with open(self.test_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            header_fields = set(reader.fieldnames)
            self.assertTrue(required_fields.issubset(header_fields), f"Missing fields: {required_fields - header_fields}")

    def test_channels_present(self):
        """Verify events span across call, SMS, URL, and payment channels."""
        channels = {e.channel for e in self.events}
        expected_channels = {"call", "SMS", "URL", "payment"}
        self.assertEqual(channels, expected_channels)

    def test_scam_campaign_detection(self):
        """Verify exactly 3 distinct scam campaigns are detected."""
        campaigns = self.results["campaigns"]
        self.assertEqual(len(campaigns), 3, f"Expected 3 scam campaigns, found {len(campaigns)}")

    def test_campaign_event_counts(self):
        """Verify each detected campaign has approximately 50 correlated events."""
        for camp in self.results["campaigns"]:
            self.assertGreaterEqual(camp["total_events"], 45)
            self.assertLessEqual(camp["total_events"], 55)

    def test_benign_noise_separation(self):
        """Verify benign noise events are excluded from scam campaigns."""
        total_campaign_events = sum(c["total_events"] for c in self.results["campaigns"])
        benign_count = self.results["benign_unclustered_count"]
        
        self.assertEqual(total_campaign_events + benign_count, 200)
        self.assertEqual(benign_count, 50)

    def test_risk_scores(self):
        """Verify campaign risk scores reflect elevated risk."""
        for camp in self.results["campaigns"]:
            self.assertGreaterEqual(camp["avg_risk_score"], 0.70)
            self.assertIn(camp["threat_level"], ["HIGH", "CRITICAL"])

if __name__ == "__main__":
    unittest.main()
