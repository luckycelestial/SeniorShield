"""
threat_intelligence/service.py
==============================
Threat Intelligence Service for SeniorShield.

Orchestrates:
  1. Structured Entity Extraction (URLs, Domains, Phone numbers, Emails, Amounts)
  2. In-Memory Cache Lookup
  3. Swappable Provider Evaluation with strict 2-second timeout bounds
  4. Non-blocking failure isolation
"""

import os
import time
from typing import List, Optional
from datetime import datetime
from dotenv import load_dotenv

from threat_intelligence.models import (
    Entity,
    EntityType,
    ThreatIntelResult,
    ThreatIntelBatchResult,
    ExtractedEntities,
    ReputationStatus,
)
from threat_intelligence.extractor import EntityExtractor
from threat_intelligence.cache import ThreatIntelCache
from threat_intelligence.providers.base import ThreatIntelligenceProvider
from threat_intelligence.providers.mock_provider import MockThreatIntelligenceProvider

# Ensure .env is loaded
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=env_path)


class ThreatIntelligenceService:
    """
    Orchestrates Threat Intelligence lookups for extracted entities.
    """

    def __init__(self, provider: Optional[ThreatIntelligenceProvider] = None, cache_ttl_seconds: int = 300):
        self.extractor = EntityExtractor()
        self.cache = ThreatIntelCache(default_ttl_seconds=cache_ttl_seconds)
        self.provider = provider or MockThreatIntelligenceProvider()

    def analyze_text(self, text: str) -> ThreatIntelBatchResult:
        """
        Extract all entities from text and query Threat Intelligence for their reputation.

        Args:
            text: Unstructured message text.

        Returns:
            ThreatIntelBatchResult with structured entities, results list, and latency.
        """
        t0 = time.perf_counter()

        try:
            timeout_sec = float(os.environ.get("THREAT_INTEL_TIMEOUT_SECONDS", "2.0"))
        except ValueError:
            timeout_sec = 2.0

        if not text or not text.strip():
            return ThreatIntelBatchResult(
                entities=ExtractedEntities(),
                results=[],
                threat_intelligence_ms=0.0
            )

        # 1. Extract structured entities
        structured_entities = self.extractor.extract_structured(text)
        entities_to_check = self.extractor.extract_all(text)

        if not entities_to_check:
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            return ThreatIntelBatchResult(
                entities=structured_entities,
                results=[],
                threat_intelligence_ms=round(elapsed_ms, 3)
            )

        results: List[ThreatIntelResult] = []

        # 2. Check each entity (Cache -> Provider -> Fallback)
        for entity in entities_to_check:
            # Check Cache
            cached_res = self.cache.get(entity.type, entity.value)
            if cached_res:
                results.append(cached_res)
                continue

            # Query Provider with bounded execution time
            try:
                if (time.perf_counter() - t0) > timeout_sec:
                    results.append(ThreatIntelResult(
                        entity=entity,
                        provider=self.provider.provider_name,
                        status="unavailable",
                        reputation=ReputationStatus.UNAVAILABLE.value,
                        confidence=0.0,
                        evidence=f"Threat intelligence lookup timed out after {timeout_sec}s",
                        checked_at=datetime.utcnow().isoformat() + "Z"
                    ))
                    continue

                res = self.provider.check_entity(entity)
                self.cache.set(entity.type, entity.value, res)
                results.append(res)

            except Exception as e:
                print(f"[ThreatIntelService] Error checking entity {entity.value}: {e}")
                results.append(ThreatIntelResult(
                    entity=entity,
                    provider=self.provider.provider_name,
                    status="unavailable",
                    reputation=ReputationStatus.UNAVAILABLE.value,
                    confidence=0.0,
                    evidence=f"Threat intelligence check failed: {type(e).__name__}",
                    checked_at=datetime.utcnow().isoformat() + "Z"
                ))

        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        return ThreatIntelBatchResult(
            entities=structured_entities,
            results=results,
            threat_intelligence_ms=round(elapsed_ms, 3)
        )
