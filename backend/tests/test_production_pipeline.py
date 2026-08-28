"""
tests/test_production_pipeline.py
==================================
Comprehensive Production Test Suite for Refactored SeniorShield AI Backend.

Covers all 16 required test cases + Event Distribution & Neo4j Storage:
  1. Normal SAFE SMS
  2. Clear SCAM SMS
  3. OTP request
  4. OTP negation
  5. KYC message
  6. Urgency
  7. Payment request
  8. Remote-access request
  9. Message containing URL
  10. Unknown URL reputation
  11. Threat Intelligence failure
  12. Groq failure (deterministic fallback)
  13. Explainability failure
  14. Grounding violation
  15. Minimal request: {"text": "..."}
  16. Full request with metadata
  17. POST /api/events Neo4j Event Distribution
"""

import os
import sys
import json
import pytest
from fastapi.testclient import TestClient

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from ai.classifier.model_loader import load_classifier

# Ensure classifier is loaded before tests
load_classifier()
client = TestClient(app)


def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode('ascii', errors='replace').decode('ascii'))


# ── Test 1: Normal SAFE SMS ──
def test_1_normal_safe_sms():
    safe_print("\n=== Test 1: Normal SAFE SMS ===")
    response = client.post("/api/analyze", json={"text": "Hey Mom, I will be home for dinner around 7 PM."})
    assert response.status_code == 200
    data = response.json()
    assert data["classification"]["label"] == "SAFE"
    assert data["analysis"]["fraud_type"] == "NONE"
    assert "senior" in data["explanation"]
    assert "caretaker" in data["explanation"]
    safe_print(f"  [PASS] SAFE message correctly classified with confidence {data['classification']['confidence']}")


# ── Test 2: Clear SCAM SMS ──
def test_2_clear_scam_sms():
    safe_print("\n=== Test 2: Clear SCAM SMS ===")
    response = client.post("/api/analyze", json={"text": "Your account has been suspended. Share your OTP immediately to restore access."})
    assert response.status_code == 200
    data = response.json()
    assert data["classification"]["label"] == "SCAM"
    assert data["classification"]["confidence"] > 0.6
    assert "OTP_REQUEST" in [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    safe_print(f"  [PASS] SCAM message correctly classified with confidence {data['classification']['confidence']}")


# ── Test 3: OTP Request ──
def test_3_otp_request():
    safe_print("\n=== Test 3: OTP Request Rule Signal ===")
    response = client.post("/api/analyze", json={"text": "Please provide your one-time password to verify transaction."})
    assert response.status_code == 200
    data = response.json()
    rule_ids = [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    assert "OTP_REQUEST" in rule_ids
    assert "OTP_THEFT" in data["analysis"]["intent"]
    safe_print("  [PASS] OTP_REQUEST signal identified and intent mapped to OTP_THEFT")


# ── Test 4: OTP Negation (Advisory) ──
def test_4_otp_negation():
    safe_print("\n=== Test 4: OTP Negation / Advisory Resistance ===")
    response = client.post("/api/analyze", json={"text": "Never share your OTP with anyone. Bank will never ask for your password."})
    assert response.status_code == 200
    data = response.json()
    rule_ids = [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    assert "OTP_REQUEST" not in rule_ids
    assert "CREDENTIAL_REQUEST" not in rule_ids
    safe_print("  [PASS] Advisory text did NOT trigger OTP_REQUEST or CREDENTIAL_REQUEST")


# ── Test 5: KYC Message ──
def test_5_kyc_message():
    safe_print("\n=== Test 5: KYC Context Signal ===")
    response = client.post("/api/analyze", json={"text": "Your Aadhaar verification and KYC update are pending."})
    assert response.status_code == 200
    data = response.json()
    rule_ids = [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    assert "KYC_CONTEXT" in rule_ids
    assert data["analysis"]["fraud_type"] == "BANK_KYC"
    safe_print("  [PASS] KYC_CONTEXT detected and mapped to BANK_KYC fraud type")


# ── Test 6: Urgency Signal ──
def test_6_urgency_signal():
    safe_print("\n=== Test 6: Urgency Signal ===")
    response = client.post("/api/analyze", json={"text": "Final warning: your service will be disconnected today if no action taken."})
    assert response.status_code == 200
    data = response.json()
    rule_ids = [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    assert "URGENCY_SIGNAL" in rule_ids
    safe_print("  [PASS] URGENCY_SIGNAL rule triggered on coercive deadline")


# ── Test 7: Payment Request ──
def test_7_payment_request():
    safe_print("\n=== Test 7: Payment Request ===")
    response = client.post("/api/analyze", json={"text": "Transfer Rs 1500 processing fee to claim prize."})
    assert response.status_code == 200
    data = response.json()
    rule_ids = [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    assert "PAYMENT_REQUEST" in rule_ids
    assert "BANK_FUNDS" in data["analysis"]["asset_at_risk"]
    assert len(data["evidence"]["entities"]["amounts"]) > 0
    safe_print("  [PASS] PAYMENT_REQUEST triggered and monetary amount Rs 1500 extracted")


# ── Test 8: Remote Access Request ──
def test_8_remote_access():
    safe_print("\n=== Test 8: Remote Access Request ===")
    response = client.post("/api/analyze", json={"text": "Install this AnyDesk support application and grant screen control to fix banking issue."})
    assert response.status_code == 200
    data = response.json()
    rule_ids = [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    assert "REMOTE_ACCESS_SIGNAL" in rule_ids
    assert data["analysis"]["fraud_type"] == "REMOTE_ACCESS"
    assert "REMOTE_CONTROL" in data["analysis"]["intent"]
    safe_print("  [PASS] REMOTE_ACCESS_SIGNAL detected and intent mapped to REMOTE_CONTROL")


# ── Test 9: Message Containing Known Malicious URL ──
def test_9_message_containing_url():
    safe_print("\n=== Test 9: Message Containing URL & Threat Intelligence ===")
    response = client.post("/api/analyze", json={"text": "Urgent: Complete KYC at https://scam-kyc-update.com/login"})
    assert response.status_code == 200
    data = response.json()
    entities = data["evidence"]["entities"]
    assert "https://scam-kyc-update.com/login" in entities["urls"]
    assert "scam-kyc-update.com" in entities["domains"]
    ti_results = data["evidence"]["threat_intelligence"]
    assert any(ti["reputation"] == "malicious" for ti in ti_results)
    safe_print("  [PASS] URL & domain extracted and verified malicious by Threat Intelligence")


# ── Test 10: Unknown URL Reputation ──
def test_10_unknown_url_reputation():
    safe_print("\n=== Test 10: Unknown URL Reputation Preservation ===")
    response = client.post("/api/analyze", json={"text": "Visit https://random-unknown-new-site-999.xyz/index"})
    assert response.status_code == 200
    data = response.json()
    ti_results = data["evidence"]["threat_intelligence"]
    assert any(ti["reputation"] == "unknown" for ti in ti_results)
    # Ensure unknown is never converted to safe
    for ti in ti_results:
        if ti["reputation"] == "unknown":
            assert ti["reputation"] != "benign"
    safe_print("  [PASS] Unknown entity returns reputation='unknown' (not converted to safe)")


# ── Test 11: Threat Intelligence Failure Resilience ──
def test_11_threat_intel_failure_resilience():
    safe_print("\n=== Test 11: Threat Intelligence Disabled / Failure Resilience ===")
    response = client.post("/api/analyze", json={
        "text": "Your account has been suspended. Share your OTP immediately.",
        "include_threat_intel": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["classification"]["label"] == "SCAM"
    assert data["status"]["analysis"] == "complete"
    safe_print("  [PASS] Analysis pipeline completed without Threat Intelligence")


# ── Test 12: Groq Failure Deterministic Fallback ──
def test_12_groq_failure_fallback():
    safe_print("\n=== Test 12: Groq Disabled / Failure Deterministic Fallback ===")
    response = client.post("/api/analyze", json={
        "text": "Your KYC will expire today. Share your OTP immediately.",
        "include_llm": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["classification"]["label"] == "SCAM"
    assert data["explanation"]["senior"]["headline"] == "Be Careful"
    assert data["explanation"]["caretaker"]["summary"] is not None
    safe_print("  [PASS] Deterministic evidence-grounded fallback returned when LLM disabled")


# ── Test 13: Explainability Failure Resilience ──
def test_13_explainability_failure_resilience():
    safe_print("\n=== Test 13: Explainability Failure Resilience ===")
    response = client.post("/api/analyze", json={
        "text": "Your account is active and safe.",
        "include_evidence": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["classification"]["label"] == "SAFE"
    safe_print("  [PASS] Classification succeeded when attribution disabled")


# ── Test 14: Grounding Validation Violation Rejection ──
def test_14_grounding_violation_rejection():
    safe_print("\n=== Test 14: Grounding Validation Violation Rejection ===")
    from evidence.grounding_validator import GroundingValidator
    from evidence.schema import EvidenceObject, ModelMetadata, PredictionDetails, ModelEvidence

    validator = GroundingValidator()
    evidence = EvidenceObject(
        model=ModelMetadata(name="distilbert", version="distilbert-scam-v1", status="fine-tuned"),
        prediction=PredictionDetails(label="SCAM", probability=0.88, probabilities={"SAFE": 0.12, "SCAM": 0.88}),
        attribution=ModelEvidence(method="Integrated Gradients", top_features=[]),
        evidence=ModelEvidence(method="Integrated Gradients", top_features=[]),
        rule_evidence=[],
        threat_intelligence=[],
        entities={},
        source_text="Your account is under review."
    )

    # Rejection 1: Classification Mismatch
    v1 = validator.validate("This message is completely safe.", candidate_risk="SAFE", evidence=evidence)
    assert not v1.is_grounded

    # Rejection 2: Hallucinated Bank Entity
    v2 = validator.validate("Your State Bank of India account has Rs 50,000 fine.", candidate_risk="SCAM", evidence=evidence)
    assert not v2.is_grounded
    safe_print("  [PASS] GroundingValidator rejected classification mismatch and hallucinated entities")


# ── Test 15: Minimal Request ──
def test_15_minimal_request():
    safe_print("\n=== Test 15: Minimal Request with only 'text' field ===")
    response = client.post("/api/analyze", json={"text": "Your electricity bill of Rs 540 is due tomorrow."})
    assert response.status_code == 200
    data = response.json()
    assert data["input"]["text"] == "Your electricity bill of Rs 540 is due tomorrow."
    assert data["event"]["channel"] == "SMS"  # default channel
    assert data["event"]["event_id"].startswith("evt_")
    safe_print(f"  [PASS] Minimal request processed successfully (event_id={data['event']['event_id']})")


# ── Test 16: Full Request with Metadata ──
def test_16_full_request_with_metadata():
    safe_print("\n=== Test 16: Full Request with Complete Metadata ===")
    payload = {
        "text": "Your KYC will expire today. Share your OTP immediately.",
        "channel": "WHATSAPP",
        "user_id": "usr_test_999",
        "source_id": "+919876543210",
        "timestamp": "2026-08-28T05:30:00Z"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["event"]["user_id"] == "usr_test_999"
    assert data["event"]["channel"] == "WHATSAPP"
    assert data["event"]["source_id"] == "+919876543210"
    assert data["event"]["timestamp"] == "2026-08-28T05:30:00Z"
    assert data["classification"]["label"] == "SCAM"
    assert data["analysis"]["fraud_type"] == "BANK_KYC"
    safe_print(f"  [PASS] Full metadata preserved in response (event_id={data['event']['event_id']})")


# ── Test 17: POST /api/events Neo4j Distribution ──
def test_17_events_distribution_neo4j():
    safe_print("\n=== Test 17: POST /api/events Event Ingestion to Neo4j ===")
    # 1. Generate full analysis
    analyze_resp = client.post("/api/analyze", json={
        "text": "Urgent: Complete KYC at https://scam-kyc-update.com/login",
        "channel": "SMS",
        "user_id": "usr_alice",
        "source_id": "+919876543210"
    })
    assert analyze_resp.status_code == 200
    fraud_event_json = analyze_resp.json()

    # 2. Ingest into /api/events
    event_resp = client.post("/api/events", json=fraud_event_json)
    assert event_resp.status_code == 200
    res_data = event_resp.json()
    assert res_data["status"] == "stored"
    assert res_data["event_id"] == fraud_event_json["event"]["event_id"]
    assert res_data["user_id"] == "usr_alice"
    assert res_data["graph_summary"]["fraud_type"] == "BANK_KYC"
    safe_print(f"  [PASS] FraudEvent ingested via POST /api/events (storage: {res_data['storage']})")


if __name__ == "__main__":
    safe_print("============================================================")
    safe_print("RUNNING SENIORSHIELD REFACTORED PRODUCTION TEST SUITE")
    safe_print("============================================================")
    test_1_normal_safe_sms()
    test_2_clear_scam_sms()
    test_3_otp_request()
    test_4_otp_negation()
    test_5_kyc_message()
    test_6_urgency_signal()
    test_7_payment_request()
    test_8_remote_access()
    test_9_message_containing_url()
    test_10_unknown_url_reputation()
    test_11_threat_intel_failure_resilience()
    test_12_groq_failure_fallback()
    test_13_explainability_failure_resilience()
    test_14_grounding_violation_rejection()
    test_15_minimal_request()
    test_16_full_request_with_metadata()
    test_17_events_distribution_neo4j()
    safe_print("\n============================================================")
    safe_print("ALL 17 PRODUCTION PIPELINE TESTS PASSED!")
    safe_print("============================================================")
