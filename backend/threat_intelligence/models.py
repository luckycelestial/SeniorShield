"""
threat_intelligence/models.py
==============================
Data models for the Threat Intelligence and Entity Extraction layer.
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class EntityType(str, Enum):
    URL = "URL"
    DOMAIN = "DOMAIN"
    PHONE = "PHONE"
    EMAIL = "EMAIL"
    AMOUNT = "AMOUNT"


class ReputationStatus(str, Enum):
    MALICIOUS = "malicious"
    SUSPICIOUS = "suspicious"
    BENIGN = "benign"
    UNKNOWN = "unknown"
    UNAVAILABLE = "unavailable"


class Entity(BaseModel):
    type: str = Field(..., description="URL, DOMAIN, PHONE, EMAIL, or AMOUNT")
    value: str = Field(..., description="Normalized entity value")
    raw_value: Optional[str] = Field(default=None, description="Raw extracted substring")


class MonetaryAmount(BaseModel):
    value: float
    currency: str = "INR"
    raw_text: str


class ExtractedEntities(BaseModel):
    urls: List[str] = Field(default_factory=list)
    domains: List[str] = Field(default_factory=list)
    phone_numbers: List[str] = Field(default_factory=list)
    emails: List[str] = Field(default_factory=list)
    amounts: List[Dict[str, Any]] = Field(default_factory=list)


class ThreatIntelResult(BaseModel):
    source: str = "THREAT_INTELLIGENCE"
    entity: Entity
    provider: str = Field(..., description="Name of the threat intelligence provider or 'mock_dev_provider'")
    status: str = Field(..., description="'checked', 'cached', 'unavailable', or 'skipped'")
    reputation: str = Field(..., description="'malicious', 'suspicious', 'benign', 'unknown', or 'unavailable'")
    confidence: float = Field(default=0.0, description="Reputation confidence score (0.0 to 1.0)")
    evidence: str = Field(default="", description="Grounded explanation from intelligence source")
    checked_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


class ThreatIntelBatchResult(BaseModel):
    entities: ExtractedEntities = Field(default_factory=ExtractedEntities)
    results: List[ThreatIntelResult] = Field(default_factory=list)
    threat_intelligence_ms: float = 0.0
