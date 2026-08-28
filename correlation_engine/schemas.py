from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ValidationInfo
from datetime import datetime

VALID_CHANNELS = {"call", "sms", "url", "payment"}

class CorrelateEventRequest(BaseModel):
    event_id: str = Field(..., min_length=1, description="Unique event ID (e.g. EVT_001)")
    timestamp: str = Field(..., description="ISO 8601 timestamp string")
    channel: str = Field(..., description="Channel type: call, SMS, URL, payment")
    text: Optional[str] = Field(None, description="Event message or transcript text")
    phone: Optional[str] = Field("", description="Phone number involved")
    sender: Optional[str] = Field("", description="SMS Sender ID or caller header")
    domain: Optional[str] = Field("", description="URL domain involved")
    app: Optional[str] = Field("", description="Application name")
    risk_score: float = Field(..., description="Event risk score between 0.0 and 1.0")
    intent: Optional[str] = Field("", description="Detected intent or scam vector")

    @field_validator("event_id")
    def validate_event_id(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("event_id cannot be empty")
        return v.strip()

    @field_validator("timestamp")
    def validate_timestamp(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("timestamp cannot be empty")
        # Validate ISO 8601 parsing
        ts_clean = v.strip().replace("Z", "+00:00")
        try:
            datetime.fromisoformat(ts_clean)
        except Exception:
            raise ValueError(f"Invalid ISO 8601 timestamp format: {v}")
        return v.strip()

    @field_validator("channel")
    def validate_channel(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("channel cannot be empty")
        ch_norm = v.strip().lower()
        if ch_norm not in VALID_CHANNELS:
            raise ValueError(f"Invalid channel '{v}'. Allowed channels: call, SMS, URL, payment")
        # Return canonical case matching generator ("call", "SMS", "URL", "payment")
        mapping = {"call": "call", "sms": "SMS", "url": "URL", "payment": "payment"}
        return mapping[ch_norm]

    @field_validator("risk_score")
    def validate_risk_score(cls, v: float) -> float:
        if v < 0.0 or v > 1.0:
            raise ValueError(f"risk_score must be between 0.0 and 1.0, got {v}")
        return float(v)

class CampaignInfo(BaseModel):
    campaign_id: str
    community_id: int
    threat_level: str
    risk_score: float
    confidence: float
    total_events: int
    channels: List[str]

class EvidenceInfo(BaseModel):
    phones: List[str]
    senders: List[str]
    domains: List[str]
    apps: List[str]
    cross_channel: bool

class DecisionInfo(BaseModel):
    classification: str
    action: str

class CorrelateEventResponse(BaseModel):
    event_id: str
    campaign: CampaignInfo
    evidence: EvidenceInfo
    decision: DecisionInfo
