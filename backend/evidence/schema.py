"""
evidence/schema.py
==================
Typed EvidenceObject schema for SeniorShield.

Structures:
  1. Model Prediction & Version
  2. Model Evidence / Token Feature Attribution (Integrated Gradients)
  3. Rule-Based Signal Evidence (Deterministic Rules)
  4. Threat Intelligence & External Verification Evidence
  5. Extracted Entities (URLs, Domains, Phone Numbers, Emails, Amounts)
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from rules.models import RuleEvidence
from threat_intelligence.models import ThreatIntelResult


class FeatureAttribution(BaseModel):
    token: str
    contribution: float
    direction: str   # "toward_scam" | "toward_safe"


class FaithfulnessCheck(BaseModel):
    masked_token: str
    original_probability: float
    masked_probability: float
    probability_delta: float


class ModelEvidence(BaseModel):
    method: str
    top_features: List[FeatureAttribution] = Field(default_factory=list)
    faithfulness_check: Optional[FaithfulnessCheck] = None


class ModelMetadata(BaseModel):
    name: str
    version: str
    status: str
    preprocessing_version: str = "v1.0"


class PredictionDetails(BaseModel):
    label: str
    probability: float
    probabilities: Dict[str, float]


class EvidenceObject(BaseModel):
    model: ModelMetadata
    prediction: PredictionDetails
    attribution: ModelEvidence = Field(..., description="Token feature attributions from XAI")
    evidence: ModelEvidence = Field(..., description="Legacy alias for attribution")
    rule_evidence: List[RuleEvidence] = Field(default_factory=list, description="Matched deterministic rule signals")
    threat_intelligence: List[ThreatIntelResult] = Field(default_factory=list, description="External entity threat intelligence results")
    entities: Dict[str, Any] = Field(default_factory=dict, description="Extracted URLs, domains, phones, emails, amounts")
    source_text: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    explainability_metadata: Dict[str, Any] = Field(default_factory=dict)
