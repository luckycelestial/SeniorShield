"""
tests/test_phase6_threat_intel.py
==================================
Unit & Integration Tests for Threat Intelligence & Entity Extraction (Phase 6).
"""

import os
import sys
import time

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from threat_intelligence.extractor import EntityExtractor
from threat_intelligence.models import Entity, EntityType, ReputationStatus
from threat_intelligence.cache import ThreatIntelCache
from threat_intelligence.providers.mock_provider import MockThreatIntelligenceProvider
from threat_intelligence.service import ThreatIntelligenceService


def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode('ascii', errors='replace').decode('ascii'))


def test_entity_extraction():
    safe_print("\n=== Test 1: Entity Extraction (URLs, Domains, Phone, Email) ===")
    extractor = EntityExtractor()

    text = (
        "Urgent: Verify your account at https://scam-kyc-update.com/login immediately. "
        "Call +91 98765 43210 or email security@fakebank.com."
    )

    entities = extractor.extract_all(text)
    types = {e.type for e in entities}
    values = {e.value for e in entities}

    assert EntityType.URL.value in types, "URL should be extracted!"
    assert EntityType.DOMAIN.value in types, "Domain should be extracted!"
    assert EntityType.PHONE.value in types, "Phone should be extracted!"
    assert EntityType.EMAIL.value in types, "Email should be extracted!"

    assert "https://scam-kyc-update.com/login" in values
    assert "scam-kyc-update.com" in values
    assert "+919876543210" in values
    assert "security@fakebank.com" in values

    safe_print("  [PASS] Extracted URL, Domain, Normalized Phone (+91XXXXXXXXXX), and Email")


def test_reputation_states():
    safe_print("\n=== Test 2: Multi-State Threat Intelligence Reputation ===")
    provider = MockThreatIntelligenceProvider()

    # 1. Malicious domain
    res_mal = provider.check_entity(Entity(type="DOMAIN", value="scam-kyc-update.com"))
    assert res_mal.reputation == ReputationStatus.MALICIOUS.value
    assert res_mal.confidence > 0.9
    safe_print("  [PASS] Malicious domain detected with high confidence")

    # 2. Benign domain
    res_ben = provider.check_entity(Entity(type="DOMAIN", value="sbi.co.in"))
    assert res_ben.reputation == ReputationStatus.BENIGN.value
    safe_print("  [PASS] Benign domain recognized as benign")

    # 3. Unknown domain
    res_unk = provider.check_entity(Entity(type="DOMAIN", value="some-unseen-domain-12345.xyz"))
    assert res_unk.reputation == ReputationStatus.UNKNOWN.value
    assert res_unk.reputation != "benign", "Unknown must NOT be converted to benign!"
    safe_print("  [PASS] Unknown entity returns reputation='unknown' (not safe)")

    # 4. Malicious phone
    res_phone = provider.check_entity(Entity(type="PHONE", value="+919876543210"))
    assert res_phone.reputation == ReputationStatus.MALICIOUS.value
    safe_print("  [PASS] Malicious phone number detected")


def test_cache():
    safe_print("\n=== Test 3: In-Memory TTL Cache ===")
    cache = ThreatIntelCache(default_ttl_seconds=2)
    provider = MockThreatIntelligenceProvider()

    entity = Entity(type="DOMAIN", value="scam-kyc-update.com")
    result = provider.check_entity(entity)

    # Put in cache
    cache.set("DOMAIN", "scam-kyc-update.com", result, ttl_seconds=1)

    # Get from cache
    cached = cache.get("DOMAIN", "scam-kyc-update.com")
    assert cached is not None
    assert cached.status == "cached"
    safe_print("  [PASS] Cache hit returned status='cached'")

    # Wait for expiration
    time.sleep(1.2)
    expired = cache.get("DOMAIN", "scam-kyc-update.com")
    assert expired is None, "Expired cache entry must return None!"
    safe_print("  [PASS] Expired cache entry evicted properly")


def test_service_resilience_and_timeout():
    safe_print("\n=== Test 4: Service Resilience & Non-blocking Timeout ===")
    service = ThreatIntelligenceService()

    text = "Click https://scam-kyc-update.com/verify or visit https://sbi.co.in"
    batch = service.analyze_text(text)

    assert len(batch.results) >= 2
    assert batch.threat_intelligence_ms >= 0.0
    safe_print(f"  [PASS] ThreatIntelligenceService processed batch in {batch.threat_intelligence_ms:.2f}ms")


if __name__ == "__main__":
    safe_print("============================================================")
    safe_print("RUNNING PHASE 6 THREAT INTELLIGENCE TEST SUITE")
    safe_print("============================================================")
    test_entity_extraction()
    test_reputation_states()
    test_cache()
    test_service_resilience_and_timeout()
    safe_print("\n============================================================")
    safe_print("ALL PHASE 6 THREAT INTELLIGENCE TESTS PASSED!")
    safe_print("============================================================")
