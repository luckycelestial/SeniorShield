"""
tests/test_production_pipeline.py
==================================
Comprehensive Production Test Suite for SeniorShield AI Backend.

Covers all 16 pipeline requirements + Health Check:
  0. GET /health (Liveness probe)
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
  11. Threat Intelligence failure resilience
  12. Groq failure (deterministic fallback)
  13. Explainability failure resilience
  14. Grounding violation rejection
  15. Minimal request: {"text": "..."}
  16. Full request with metadata
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


# ── Test 0: GET /health Liveness Probe ──
def test_0_health_probe():
    safe_print("\n=== Test 0: GET /health Liveness Probe ===")
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"
    safe_print("  [PASS] GET /health responded with {'status': 'ok'}")


# ── Test 1: Normal SAFE SMS ──
def test_1_normal_safe_sms():
    safe_print("\n=== Test 1: Normal SAFE SMS ===")
    response = client.post("/api/analyze", json={"text": "Hey Mom, I will be home for dinner around 7 PM."})
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "SAFE"
    assert data["classification"]["label"] == "SAFE"
    assert "senior" in data["explanation"]
    assert "caretaker" in data["explanation"]
    safe_print(f"  [PASS] SAFE message correctly classified with confidence {data['confidence']}")


# ── Test 2: Clear SCAM SMS ──
def test_2_clear_scam_sms():
    safe_print("\n=== Test 2: Clear SCAM SMS ===")
    response = client.post("/api/analyze", json={"text": "URGENT: Your SBI account is blocked. Call +919876543210 immediately to unblock."})
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "SCAM"
    assert data["classification"]["label"] == "SCAM"
    assert data["risk_score"] >= 60
    assert data["evidence"]["rule_evidence"] is not None
    safe_print(f"  [PASS] SCAM message correctly classified with confidence {data['confidence']}")


# ── Test 3: OTP Request Rule Signal ──
def test_3_otp_request():
    safe_print("\n=== Test 3: OTP Request Rule Signal ===")
    response = client.post("/api/analyze", json={"text": "Your one time password is required. Please share OTP 482910 to verify transaction."})
    assert response.status_code == 200
    data = response.json()
    matched_ids = [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    assert "OTP_REQUEST" in matched_ids
    assert "OTP_THEFT" in data["analysis"]["intent"]
    safe_print("  [PASS] OTP_REQUEST signal identified and intent mapped to OTP_THEFT")


# ── Test 4: OTP Negation / Advisory Resistance ──
def test_4_otp_negation():
    safe_print("\n=== Test 4: OTP Negation / Advisory Resistance ===")
    response = client.post("/api/analyze", json={"text": "Do not share your OTP with anyone. Bank never asks for OTP."})
    assert response.status_code == 200
    data = response.json()
    matched_ids = [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    assert "OTP_REQUEST" not in matched_ids
    assert "CREDENTIAL_REQUEST" not in matched_ids
    safe_print("  [PASS] Advisory text did NOT trigger OTP_REQUEST or CREDENTIAL_REQUEST")


# ── Test 5: KYC Context Signal ──
def test_5_kyc_message():
    safe_print("\n=== Test 5: KYC Context Signal ===")
    response = client.post("/api/analyze", json={"text": "Dear customer, your KYC documents expired. Update Aadhaar and PAN immediately."})
    assert response.status_code == 200
    data = response.json()
    matched_ids = [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    assert "KYC_CONTEXT" in matched_ids
    assert data["fraud_type"] == "BANK_KYC"
    safe_print("  [PASS] KYC_CONTEXT detected and mapped to BANK_KYC fraud type")


# ── Test 6: Urgency Signal ──
def test_6_urgency_signal():
    safe_print("\n=== Test 6: Urgency Signal ===")
    response = client.post("/api/analyze", json={"text": "Action required within 24 hours or your electricity will be disconnected tonight."})
    assert response.status_code == 200
    data = response.json()
    matched_ids = [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    assert "URGENCY_SIGNAL" in matched_ids
    safe_print("  [PASS] URGENCY_SIGNAL rule triggered on coercive deadline")


# ── Test 7: Payment Request ──
def test_7_payment_request():
    safe_print("\n=== Test 7: Payment Request ===")
    response = client.post("/api/analyze", json={"text": "Kindly send fee of Rs 1500 to confirm your parcel release."})
    assert response.status_code == 200
    data = response.json()
    matched_ids = [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    assert "PAYMENT_REQUEST" in matched_ids
    extracted_amounts = data["evidence"]["entities"]["amounts"]
    assert len(extracted_amounts) > 0
    safe_print("  [PASS] PAYMENT_REQUEST triggered and monetary amount Rs 1500 extracted")


# ── Test 8: Remote Access Request ──
def test_8_remote_access():
    safe_print("\n=== Test 8: Remote Access Request ===")
    response = client.post("/api/analyze", json={"text": "Install AnyDesk app from playstore for immediate remote support."})
    assert response.status_code == 200
    data = response.json()
    matched_ids = [r["rule_id"] for r in data["evidence"]["rule_evidence"]]
    assert "REMOTE_ACCESS_SIGNAL" in matched_ids
    assert "REMOTE_CONTROL" in data["analysis"]["intent"]
    safe_print("  [PASS] REMOTE_ACCESS_SIGNAL detected and intent mapped to REMOTE_CONTROL")


# ── Test 9: Message Containing URL & Threat Intelligence ──
def test_9_message_containing_url():
    safe_print("\n=== Test 9: Message Containing URL & Threat Intelligence ===")
    response = client.post("/api/analyze", json={"text": "Click here to update info: https://scam-kyc-update.com/login"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["evidence"]["entities"]["urls"]) > 0
    assert len(data["evidence"]["entities"]["domains"]) > 0
    ti_results = data["evidence"]["threat_intelligence"]
    assert len(ti_results) > 0
    assert any(ti["reputation"] == "malicious" for ti in ti_results)
    safe_print("  [PASS] URL & domain extracted and verified malicious by Threat Intelligence")


# ── Test 10: Unknown URL Reputation Preservation ──
def test_10_unknown_url_reputation():
    safe_print("\n=== Test 10: Unknown URL Reputation Preservation ===")
    from threat_intelligence.service import ThreatIntelligenceService
    ti_service = ThreatIntelligenceService()
    res = ti_service.analyze_text("Visit https://unseen-brand-new-domain-xyz123.com for news.")
    assert len(res.results) > 0
    assert str(res.results[0].reputation) == "unknown"
    safe_print("  [PASS] Unknown entity returns reputation='unknown' (not converted to safe)")


# ── Test 11: Threat Intelligence Disabled / Failure Resilience ──
def test_11_threat_intel_failure_resilience():
    safe_print("\n=== Test 11: Threat Intelligence Disabled / Failure Resilience ===")
    response = client.post("/api/analyze", json={
        "text": "Your account has been suspended. Share your OTP immediately.",
        "include_threat_intel": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "SCAM"
    assert data["evidence"]["threat_intelligence"] == []
    safe_print("  [PASS] Analysis pipeline completed without Threat Intelligence")


# ── Test 12: Groq Disabled / Failure Deterministic Fallback ──
def test_12_groq_failure_fallback():
    safe_print("\n=== Test 12: Groq Disabled / Failure Deterministic Fallback ===")
    response = client.post("/api/analyze", json={
        "text": "Your SBI account is blocked. Call +919876543210 immediately.",
        "include_llm": False
    })
    assert response.status_code == 200
    data = response.json()
    assert "senior" in data["explanation"]
    assert "caretaker" in data["explanation"]
    assert len(data["explanation"]["senior"]["message"]) > 0
    safe_print("  [PASS] Deterministic evidence-grounded fallback returned when LLM disabled")


# ── Test 13: Explainability Failure Resilience ──
def test_13_explainability_failure_resilience():
    safe_print("\n=== Test 13: Explainability Failure Resilience ===")
    response = client.post("/api/analyze", json={
        "text": "Your electricity will be cut off tonight. Pay Rs 500 now.",
        "include_evidence": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "SCAM"
    assert data["latency"]["explainability"] == 0.0
    safe_print("  [PASS] Classification succeeded when attribution disabled")


# ── Test 14: Grounding Validation Violation Rejection ──
def test_14_grounding_violation_rejection():
    safe_print("\n=== Test 14: Grounding Validation Violation Rejection ===")
    from evidence.grounding_validator import GroundingValidator
    from ai.llm.groq_service import ExplanationResponse, SeniorExplanation, CaretakerExplanation
    from evidence.schema import EvidenceObject, ModelMetadata, ModelEvidence, PredictionDetails

    fake_evidence = EvidenceObject(
        model=ModelMetadata(name="bert-tiny-scam-v1", version="v1", status="fine-tuned"),
        prediction=PredictionDetails(label="SAFE", probability=0.95, probabilities={"SAFE": 0.95, "SCAM": 0.05}),
        attribution=ModelEvidence(method="XAI", top_features=[]),
        evidence=ModelEvidence(method="XAI", top_features=[]),
        source_text="Hey Mom, I will be home for dinner."
    )

    validator = GroundingValidator()
    val_res = validator.validate(
        candidate_explanation="This is a SCAM! Pay 50000 Rs to +919999999999.",
        candidate_risk="SCAM",
        evidence=fake_evidence,
        is_senior_view=True
    )
    assert not val_res.is_grounded
    assert len(val_res.violations) > 0
    safe_print("  [PASS] GroundingValidator rejected classification mismatch and hallucinated entities")


# ── Test 15: Minimal Request ──
def test_15_minimal_request():
    safe_print("\n=== Test 15: Minimal Request with only 'text' field ===")
    response = client.post("/api/analyze", json={"text": "Your account is temporarily locked."})
    assert response.status_code == 200
    data = response.json()
    assert "event_id" in data
    assert "prediction" in data
    assert "confidence" in data
    assert "fraud_type" in data
    assert "risk_score" in data
    safe_print(f"  [PASS] Minimal request processed successfully (event_id={data['event_id']})")


# ── Test 16: Full Request with Complete Metadata ──
def test_16_full_request_with_metadata():
    safe_print("\n=== Test 16: Full Request with Complete Metadata ===")
    response = client.post("/api/analyze", json={
        "text": "Urgent: Complete KYC at https://scam-kyc-update.com/login",
        "channel": "WHATSAPP",
        "user_id": "usr_test_999",
        "source_id": "+919876543210",
        "timestamp": "2026-08-28T05:30:00Z"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["event"]["user_id"] == "usr_test_999"
    assert data["event"]["channel"] == "WHATSAPP"
    assert data["event"]["source_id"] == "+919876543210"
    assert data["event"]["timestamp"] == "2026-08-28T05:30:00Z"
    assert data["prediction"] == "SCAM"
    assert data["fraud_type"] == "BANK_KYC"
    safe_print(f"  [PASS] Full metadata preserved in response (event_id={data['event_id']})")


if __name__ == "__main__":
    safe_print("============================================================")
    safe_print("RUNNING SENIORSHIELD PRODUCTION TEST SUITE")
    safe_print("============================================================")
    test_0_health_probe()
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
    safe_print("\n============================================================")
    safe_print("ALL TESTS PASSED SUCCESSFULLY!")
    safe_print("============================================================")
