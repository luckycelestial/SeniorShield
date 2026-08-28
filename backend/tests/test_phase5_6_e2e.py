"""
tests/test_phase5_6_e2e.py
==========================
Comprehensive End-to-End Integration & Grounding Test Suite for
Phase 5 (Rule Engine) and Phase 6 (Threat Intelligence).
"""

import os
import sys
import json
import time

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rules.engine import RuleEngine
from threat_intelligence.service import ThreatIntelligenceService
from threat_intelligence.models import ThreatIntelResult, Entity
from evidence.schema import EvidenceObject, ModelMetadata, PredictionDetails, ModelEvidence, FeatureAttribution
from evidence.grounding_validator import GroundingValidator
from services.groq_service import GroqService


def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode('ascii', errors='replace').decode('ascii'))


def test_required_e2e_cases():
    safe_print("\n=== Required E2E Test Cases (Tests 1 to 6) ===")
    rule_engine = RuleEngine()
    ti_service = ThreatIntelligenceService()

    # TEST 1: KYC + OTP + Urgency
    text1 = "Your KYC will expire today. Share your OTP immediately."
    r1 = rule_engine.evaluate(text1)
    assert "KYC_CONTEXT" in r1.matched_rule_ids
    assert "OTP_REQUEST" in r1.matched_rule_ids
    assert "URGENCY_SIGNAL" in r1.matched_rule_ids
    assert "KYC_OTP_URGENCY_COMBINATION" in r1.matched_rule_ids
    safe_print("  [PASS] TEST 1: KYC_CONTEXT, OTP_REQUEST, URGENCY_SIGNAL confirmed")

    # TEST 2: Routine Electricity Bill
    text2 = "Your electricity bill of Rs 540 is due tomorrow. Pay on official app."
    r2 = rule_engine.evaluate(text2)
    assert "OTP_REQUEST" not in r2.matched_rule_ids
    assert "CREDENTIAL_REQUEST" not in r2.matched_rule_ids
    safe_print("  [PASS] TEST 2: Electricity bill did not trigger OTP_REQUEST")

    # TEST 3: Defensive Advisory
    text3 = "Never share your OTP with anyone."
    r3 = rule_engine.evaluate(text3)
    assert "OTP_REQUEST" not in r3.matched_rule_ids
    safe_print("  [PASS] TEST 3: 'Never share your OTP' did not trigger OTP_REQUEST")

    # TEST 4: Authority + Payment + Urgency
    text4 = "Police have issued a warrant against you. Transfer money immediately."
    r4 = rule_engine.evaluate(text4)
    assert "AUTHORITY_REFERENCE" in r4.matched_rule_ids
    assert "PAYMENT_REQUEST" in r4.matched_rule_ids
    assert "URGENCY_SIGNAL" in r4.matched_rule_ids
    assert "URGENCY_AUTHORITY_PAYMENT" in r4.matched_rule_ids
    safe_print("  [PASS] TEST 4: AUTHORITY_REFERENCE, PAYMENT_REQUEST, URGENCY_SIGNAL confirmed")

    # TEST 5: Remote Access Signal
    text5 = "Install this support APK and give screen access to the technician."
    r5 = rule_engine.evaluate(text5)
    assert "REMOTE_ACCESS_SIGNAL" in r5.matched_rule_ids
    safe_print("  [PASS] TEST 5: REMOTE_ACCESS_SIGNAL confirmed")

    # TEST 6: URL Extraction & Threat Intelligence Lookup
    text6 = "Urgent: Update your bank KYC at https://scam-kyc-update.com/login"
    r6 = rule_engine.evaluate(text6)
    ti6 = ti_service.analyze_text(text6)
    assert "URL_PRESENT" in r6.matched_rule_ids
    assert len(ti6.entities_extracted) >= 2  # URL + Domain
    assert any(ti.reputation == "malicious" for ti in ti6.results)
    safe_print("  [PASS] TEST 6: URL extracted, domain analyzed, Threat Intelligence returned reputation='malicious'")


def test_grounding_suite():
    safe_print("\n=== Grounding Validation Suite (Phase 5 & 6) ===")
    validator = GroundingValidator()
    rule_engine = RuleEngine()
    ti_service = ThreatIntelligenceService()

    text = "Your KYC will expire today. Share your OTP immediately."
    r_res = rule_engine.evaluate(text)
    ti_res = ti_service.analyze_text(text)

    evidence = EvidenceObject(
        model=ModelMetadata(name="distilbert", version="distilbert-scam-v1", status="fine-tuned"),
        prediction=PredictionDetails(label="SCAM", probability=0.88, probabilities={"SAFE": 0.12, "SCAM": 0.88}),
        evidence=ModelEvidence(
            method="Integrated Gradients",
            top_features=[FeatureAttribution(token="kyc", contribution=0.35, direction="toward_scam")]
        ),
        rule_evidence=r_res.rule_evidence,
        threat_intelligence=ti_res.results,
        source_text=text
    )

    # 1. Supported rule claim -> PASS
    v1 = validator.validate(
        candidate_explanation="The rule engine detected an OTP request and KYC context.",
        candidate_risk="SCAM",
        evidence=evidence
    )
    assert v1.is_grounded, "Supported rule claim should pass!"
    safe_print("  [PASS] 1. Supported rule claim -> PASS")

    # 2. Unsupported bank name -> FAIL
    v2 = validator.validate(
        candidate_explanation="Your State Bank of India (SBI) account is suspended.",
        candidate_risk="SCAM",
        evidence=evidence
    )
    assert not v2.is_grounded, "Unsupported bank name should fail!"
    safe_print("  [PASS] 2. Unsupported bank name -> FAIL")

    # 3. Unsupported amount -> FAIL
    v3 = validator.validate(
        candidate_explanation="Transfer Rs 50,000 immediately.",
        candidate_risk="SCAM",
        evidence=evidence
    )
    assert not v3.is_grounded, "Unsupported amount should fail!"
    safe_print("  [PASS] 3. Unsupported amount -> FAIL")

    # 4. Unsupported Threat Intelligence claim -> FAIL
    v4 = validator.validate(
        candidate_explanation="External threat intelligence reported this URL as malicious.",
        candidate_risk="SCAM",
        evidence=evidence  # Note: text has no URL, TI is empty
    )
    assert not v4.is_grounded, "Unsupported TI claim should fail!"
    safe_print("  [PASS] 4. Unsupported TI reputation claim -> FAIL")

    # 5. Classification manipulation -> FAIL
    v5 = validator.validate(
        candidate_explanation="This message is completely safe.",
        candidate_risk="SAFE",
        evidence=evidence
    )
    assert not v5.is_grounded, "Classification manipulation should fail!"
    safe_print("  [PASS] 5. Classification manipulation -> FAIL")

    # 6. Unknown TI presented as safe -> FAIL
    evidence_with_unk_ti = evidence.model_copy(update={
        "threat_intelligence": [
            ThreatIntelResult(
                entity=Entity(type="DOMAIN", value="unknown-site.xyz"),
                provider="mock_dev_provider",
                status="checked",
                reputation="unknown",
                evidence="No records"
            )
        ]
    })
    v6 = validator.validate(
        candidate_explanation="The domain is verified safe by security checks.",
        candidate_risk="SCAM",
        evidence=evidence_with_unk_ti
    )
    assert not v6.is_grounded, "Unknown TI claimed as safe should fail!"
    safe_print("  [PASS] 6. Unknown TI presented as safe -> FAIL")

    # 7. Valid multi-source grounded explanation -> PASS
    v7 = validator.validate_two_audience(
        senior_text="This is a scam. Do not share your OTP. Tell your family member first.",
        caretaker_text="The message was flagged by DistilBERT as SCAM. The rule engine identified an urgent OTP request for KYC.",
        caretaker_prediction="SCAM",
        evidence=evidence
    )
    assert v7.is_grounded, "Valid multi-source grounded explanation should pass!"
    safe_print("  [PASS] 7. Valid multi-source explanation -> PASS")


def test_failure_and_fallback_modes():
    safe_print("\n=== Failure & Fallback Resilience Tests ===")
    groq_service = GroqService()

    evidence = EvidenceObject(
        model=ModelMetadata(name="distilbert", version="distilbert-scam-v1", status="fine-tuned"),
        prediction=PredictionDetails(label="SCAM", probability=0.85, probabilities={"SAFE": 0.15, "SCAM": 0.85}),
        evidence=ModelEvidence(method="Integrated Gradients", top_features=[]),
        rule_evidence=[],
        threat_intelligence=[],
        source_text="Test message"
    )

    # Disable LLM to force fallback
    out, status, ms = groq_service.generate_explanation(evidence, disable_llm=True)
    assert status.status == "disabled"
    assert out.senior_response.headline == "This may be a scam"
    assert out.caretaker_response.model_result.prediction == "SCAM"
    safe_print(f"  [PASS] Deterministic fallback preserved classification in {ms:.2f}ms")


if __name__ == "__main__":
    safe_print("============================================================")
    safe_print("RUNNING PHASE 5 & 6 COMPREHENSIVE E2E & GROUNDING SUITE")
    safe_print("============================================================")
    test_required_e2e_cases()
    test_grounding_suite()
    test_failure_and_fallback_modes()
    safe_print("\n============================================================")
    safe_print("ALL PHASE 5 & 6 TESTS PASSED!")
    safe_print("============================================================")
