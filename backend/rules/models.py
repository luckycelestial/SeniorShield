"""
rules/models.py
===============
Data models for the deterministic Rule-Based Signal Engine.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class RuleSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class RuleCategory(str, Enum):
    CREDENTIAL_REQUEST = "credential_request"
    IDENTITY_VERIFICATION = "identity_verification"
    URGENCY = "urgency"
    FINANCIAL_REQUEST = "financial_request"
    IMPERSONATION_AUTHORITY = "impersonation_authority"
    REMOTE_ACCESS = "remote_access"
    EXTERNAL_LINK = "external_link"
    COMPOUND_PATTERN = "compound_pattern"


class RuleEvidence(BaseModel):
    source: str = "RULE"
    rule_id: str = Field(..., description="Unique stable rule identifier")
    category: str = Field(..., description="Category of rule signal")
    description: str = Field(..., description="Human-readable description of the matched signal")
    severity: str = Field(..., description="CRITICAL, HIGH, MEDIUM, LOW, or INFO")
    matched_text: str = Field(..., description="The specific substring that triggered the rule")
    confidence: float = Field(default=1.0, description="Deterministic confidence score")


class RuleEngineResult(BaseModel):
    rule_evidence: List[RuleEvidence] = Field(default_factory=list)
    rules_ms: float = 0.0
    matched_rule_ids: List[str] = Field(default_factory=list)
