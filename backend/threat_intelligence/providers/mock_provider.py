"""
threat_intelligence/providers/mock_provider.py
==============================================
Deterministic Mock / Development Provider for SeniorShield (Phase 6).

Clearly marked as 'mock_dev_provider'. Contains sample malicious and benign
IOCs for testing and demonstration without external network dependencies.
"""

from typing import Dict, Any
from datetime import datetime

from threat_intelligence.models import Entity, EntityType, ThreatIntelResult, ReputationStatus
from threat_intelligence.providers.base import ThreatIntelligenceProvider


class MockThreatIntelligenceProvider(ThreatIntelligenceProvider):
    """
    Mock Threat Intelligence Provider for local development, tests, and demo.
    """

    @property
    def provider_name(self) -> str:
        return "mock_dev_provider"

    # Known malicious test IOCs
    _MALICIOUS_DOMAINS = {
        "scam-kyc-update.com": "Known phishing domain targeting banking KYC updates",
        "verify-aadhaar-alert.in": "Reported credential harvesting portal",
        "police-fine-portal.org": "Impersonation domain used in fake arrest warrant scams",
        "anydesk-support.xyz": "Malicious APK distribution endpoint",
        "bit.ly/fake-kyc": "Shortened link redirecting to banking credential phish",
        "sbi-rewards-gift.site": "Fake lottery and gift card phishing site",
        "electricity-bill-pay.click": "Fake utility payment gateway"
    }

    _MALICIOUS_PHONES = {
        "+919876543210": "Reported 142 times for digital arrest coercion scams",
        "+919999988888": "Associated with fake courier seizure extortion campaigns",
        "+918888877777": "Reported for remote screen sharing support scams"
    }

    # Known benign test IOCs
    _BENIGN_DOMAINS = {
        "sbi.co.in": "Official State Bank of India portal",
        "hdfcbank.com": "Official HDFC Bank portal",
        "icicibank.com": "Official ICICI Bank portal",
        "amazon.in": "Official Amazon India portal",
        "google.com": "Official Google portal",
        "gov.in": "Official Government of India domain",
        "uidai.gov.in": "Official UIDAI Aadhaar portal"
    }

    def check_entity(self, entity: Entity) -> ThreatIntelResult:
        val = entity.value.lower().strip()
        etype = entity.type.upper()
        now = datetime.utcnow().isoformat() + "Z"

        # 1. Check Malicious Domains / URLs
        if etype in [EntityType.DOMAIN.value, EntityType.URL.value]:
            for mal_dom, reason in self._MALICIOUS_DOMAINS.items():
                if mal_dom in val:
                    return ThreatIntelResult(
                        entity=entity,
                        provider=self.provider_name,
                        status="checked",
                        reputation=ReputationStatus.MALICIOUS.value,
                        confidence=0.98,
                        evidence=f"Threat intelligence source flagged domain as malicious: {reason}",
                        checked_at=now
                    )

            # Check Benign Domains
            for ben_dom, reason in self._BENIGN_DOMAINS.items():
                if ben_dom == val or val.endswith("." + ben_dom):
                    return ThreatIntelResult(
                        entity=entity,
                        provider=self.provider_name,
                        status="checked",
                        reputation=ReputationStatus.BENIGN.value,
                        confidence=0.95,
                        evidence=f"Verified legitimate domain: {reason}",
                        checked_at=now
                    )

        # 2. Check Malicious Phone Numbers
        if etype == EntityType.PHONE.value:
            for mal_phone, reason in self._MALICIOUS_PHONES.items():
                if mal_phone == val:
                    return ThreatIntelResult(
                        entity=entity,
                        provider=self.provider_name,
                        status="checked",
                        reputation=ReputationStatus.MALICIOUS.value,
                        confidence=0.92,
                        evidence=f"Phone intelligence reported high abuse score: {reason}",
                        checked_at=now
                    )

        # 3. Default: Unknown (NOT safe, just no external records found)
        return ThreatIntelResult(
            entity=entity,
            provider=self.provider_name,
            status="checked",
            reputation=ReputationStatus.UNKNOWN.value,
            confidence=0.0,
            evidence="No external threat intelligence records found for this entity.",
            checked_at=now
        )
