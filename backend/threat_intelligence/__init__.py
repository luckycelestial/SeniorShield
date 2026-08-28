"""
threat_intelligence/__init__.py
==============================
Threat Intelligence and Entity Extraction layer for SeniorShield (Phase 6).
"""

from threat_intelligence.models import (
    Entity,
    EntityType,
    ThreatIntelResult,
    ThreatIntelBatchResult,
    ReputationStatus,
)
from threat_intelligence.extractor import EntityExtractor
from threat_intelligence.cache import ThreatIntelCache
from threat_intelligence.service import ThreatIntelligenceService

__all__ = [
    "ThreatIntelligenceService",
    "EntityExtractor",
    "ThreatIntelCache",
    "Entity",
    "EntityType",
    "ThreatIntelResult",
    "ThreatIntelBatchResult",
    "ReputationStatus",
]
