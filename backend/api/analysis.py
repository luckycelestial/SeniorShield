"""
api/analysis.py
================
POST /api/analyze — SeniorShield Primary Unified AI Analysis Endpoint.

Pipeline:
  Normalized Text -> Preprocessing -> bert-tiny-scam-v1 -> Attribution (XAI)
  -> Rule Engine -> Threat Intelligence -> EvidenceObject -> Risk Determination
  -> Groq LLM (Grounded) -> Senior/Caretaker Explanation -> Structured JSON Output
"""

import time
import uuid
from typing import Optional, Dict, Any, List, Tuple, Union
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ai.classifier.base import BaseClassifier
from ai.classifier.model_loader import get_classifier
from ai.classifier.preprocessing import validate_input
from ai.classifier.attributor import DistilBertAttributor
from ai.llm.groq_service import GroqService, ExplanationResponse, LLMStatus
from rules.engine import RuleEngine
from threat_intelligence.service import ThreatIntelligenceService
from evidence.builder import build_evidence_object

router = APIRouter(prefix="/api", tags=["analysis"])
MAX_TEXT_LENGTH = 4000

rule_engine = RuleEngine()
threat_intel_service = ThreatIntelligenceService()
groq_service = GroqService()


# ── Request Schema ──
class AnalyzeRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=MAX_TEXT_LENGTH,
        description="Normalized message or transcript text",
        example="Your KYC will expire today. Share your OTP immediately.",
    )
    channel: Optional[str] = Field(
        default="SMS",
        description="Delivery channel: SMS / CALL / EMAIL / NOTIFICATION / MESSAGE",
        example="SMS"
    )
    user_id: Optional[str] = Field(
        default=None,
        description="Optional unique identifier for the user",
        example="usr_001"
    )
    source_id: Optional[str] = Field(
        default=None,
        description="Optional sender ID, caller number, or origin",
        example="+919876543210"
    )
    timestamp: Optional[str] = Field(
        default=None,
        description="Optional ISO-8601 timestamp",
        example="2026-08-28T05:30:00Z"
    )
    include_evidence: bool = Field(default=True, description="Compute XAI token attributions")
    include_rules: bool = Field(default=True, description="Execute deterministic rule engine")
    include_threat_intel: bool = Field(default=True, description="Query threat intelligence for extracted entities")
    include_llm: bool = Field(default=True, description="Generate senior & caretaker explanations")


# ── Response Sub-Schemas ──
class EventMetadata(BaseModel):
    event_id: str
    user_id: Optional[str] = None
    channel: str = "SMS"
    source_id: Optional[str] = None
    timestamp: str


class InputPayload(BaseModel):
    text: str


class ClassificationResultSchema(BaseModel):
    label: str
    confidence: float


class ModelMetadataSchema(BaseModel):
    name: str
    version: str
    status: Optional[str] = None


class AnalysisInferenceSchema(BaseModel):
    fraud_type: str = "UNKNOWN"
    intent: List[str] = Field(default_factory=list)
    asset_at_risk: List[str] = Field(default_factory=list)


class LatencyBreakdownSchema(BaseModel):
    preprocessing: float
    distilbert: float  # Maintained for backward compatibility
    ml_inference: Optional[float] = None
    explainability: float
    rules: float
    threat_intelligence: float
    groq: float
    total: float


class StatusSchema(BaseModel):
    analysis: str = "complete"
    grounding: str = "passed"


class SeniorExplanationSchema(BaseModel):
    headline: str
    message: str
    action: str


class CaretakerExplanationSchema(BaseModel):
    headline: str
    summary: str
    why_flagged: List[str] = Field(default_factory=list)
    recommended_action: str


class ExplanationContainerSchema(BaseModel):
    senior: SeniorExplanationSchema
    caretaker: CaretakerExplanationSchema


class RuleSummarySchema(BaseModel):
    matched_rules: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    details: List[Dict[str, Any]] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    # Top-level direct fields
    event_id: str
    prediction: str
    confidence: float
    probabilities: Dict[str, float]
    fraud_type: str
    intent: Union[str, List[str]]
    risk_score: int
    risk_level: str

    model: ModelMetadataSchema
    rules: RuleSummarySchema
    evidence: Dict[str, Any]
    explanation: ExplanationContainerSchema
    latency: LatencyBreakdownSchema

    # Nested namespaces for backward-compatibility
    event: EventMetadata
    input: InputPayload
    classification: ClassificationResultSchema
    analysis: AnalysisInferenceSchema
    latency_ms: LatencyBreakdownSchema
    status: StatusSchema


class ErrorResponse(BaseModel):
    error: str


# ── Helper: Derive Fraud Category & Intent from Verified Evidence ──
def derive_analysis_fields(
    label: str,
    matched_rule_ids: List[str],
    text: str
) -> Tuple[str, List[str], List[str]]:
    text_lower = text.lower()
    intents = []
    assets = []

    # Derive Intents & Assets
    if "OTP_REQUEST" in matched_rule_ids or "otp" in text_lower:
        intents.append("OTP_THEFT")
        assets.append("CREDENTIALS")

    if "CREDENTIAL_REQUEST" in matched_rule_ids or "password" in text_lower or "cvv" in text_lower or "pin" in text_lower:
        intents.append("CREDENTIAL_HARVESTING")
        if "CREDENTIALS" not in assets:
            assets.append("CREDENTIALS")

    if "REMOTE_ACCESS_SIGNAL" in matched_rule_ids or "anydesk" in text_lower or "screen access" in text_lower:
        intents.append("REMOTE_CONTROL")
        assets.append("DEVICE_ACCESS")

    if "AUTHORITY_REFERENCE" in matched_rule_ids and ("PAYMENT_REQUEST" in matched_rule_ids or "fine" in text_lower or "warrant" in text_lower):
        intents.append("COERCIVE_EXTORTION")
        assets.append("BANK_FUNDS")
    elif "PAYMENT_REQUEST" in matched_rule_ids or "transfer" in text_lower or "fee" in text_lower:
        intents.append("UNAUTHORIZED_TRANSFER")
        if "BANK_FUNDS" not in assets:
            assets.append("BANK_FUNDS")

    # Derive Fraud Type
    if "KYC_CONTEXT" in matched_rule_ids or "kyc" in text_lower or "aadhaar" in text_lower or "pan" in text_lower:
        fraud_type = "BANK_KYC"
    elif "REMOTE_ACCESS_SIGNAL" in matched_rule_ids or "quicksupport" in text_lower or "anydesk" in text_lower:
        fraud_type = "REMOTE_ACCESS"
    elif "AUTHORITY_REFERENCE" in matched_rule_ids or "police" in text_lower or "cbi" in text_lower or "customs" in text_lower:
        fraud_type = "DIGITAL_ARREST"
    elif "ELECTRICITY_DISCONNECTION" in matched_rule_ids or "electricity" in text_lower or "power bill" in text_lower:
        fraud_type = "UTILITY_BILL"
    elif "LOTTERY_REWARD" in matched_rule_ids or "winner" in text_lower or "prize" in text_lower:
        fraud_type = "LOTTERY_PRIZE"
    elif label == "SCAM":
        fraud_type = "PHISHING_SCAM"
    else:
        fraud_type = "LEGITIMATE_COMMUNICATION"

    return fraud_type, intents or ["GENERAL_INQUIRY"], assets or ["NONE"]


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal processing failure"},
    },
    summary="Unified AI Fraud Analysis Pipeline (bert-tiny-scam-v1 + Rules + Threat Intel + Groq)",
)
def analyze_content(
    req: AnalyzeRequest,
    classifier: BaseClassifier = Depends(get_classifier),
) -> AnalyzeResponse:
    """
    Primary analysis endpoint for SeniorShield.
    Receives normalized text, processes through all AI layers, and returns structured analysis.
    """
    request_start = time.perf_counter()

    # Step 1: Preprocessing & Validation
    err = validate_input(req.text)
    if err:
        raise HTTPException(status_code=400, detail=err)

    event_id = f"evt_{uuid.uuid4().hex[:12]}"
    event_ts = req.timestamp or datetime.utcnow().isoformat() + "Z"

    # Step 2: Sequence Classification (bert-tiny-scam-v1)
    result = classifier.predict(req.text)
    preprocessing_ms = result.latency.preprocessing_ms
    distilbert_ms = result.latency.inference_ms

    # Step 3: Explainability / Token Feature Attribution (XAI)
    explainability_ms = 0.0
    attr_result = None

    if req.include_evidence:
        try:
            attributor = DistilBertAttributor(classifier)
            attr_result = attributor.explain(req.text, top_k=5)
            explainability_ms = attr_result.explainability_ms
        except Exception as e:
            print(f"[Attribution] Warning: explainability failed: {e}")

    # Step 4: Deterministic Rule-Based Signal Engine
    rules_ms = 0.0
    rule_evidences = []
    matched_rule_ids = []
    rule_categories = []
    rule_details = []
    if req.include_rules:
        try:
            rule_res = rule_engine.evaluate(req.text, channel=req.channel or "SMS")
            rule_evidences = rule_res.rule_evidence
            matched_rule_ids = rule_res.matched_rule_ids
            rules_ms = rule_res.rules_ms
            rule_categories = list({r.category for r in rule_evidences})
            rule_details = [
                {
                    "rule_id": r.rule_id,
                    "category": r.category,
                    "severity": r.severity,
                    "description": r.description,
                    "matched_text": r.matched_text
                }
                for r in rule_evidences
            ]
        except Exception as e:
            print(f"[RuleEngine] Warning: rule evaluation failed: {e}")

    # Step 5: Entity Extraction & Threat Intelligence
    threat_intel_ms = 0.0
    ti_results = []
    extracted_entities = None
    if req.include_threat_intel:
        try:
            ti_batch = threat_intel_service.analyze_text(req.text)
            ti_results = ti_batch.results
            extracted_entities = ti_batch.entities
            threat_intel_ms = ti_batch.threat_intelligence_ms
        except Exception as e:
            print(f"[ThreatIntelligence] Warning: lookup failed: {e}")

    # Step 6: Consolidate Unified EvidenceObject
    evidence_obj = build_evidence_object(
        source_text=req.text,
        class_result=result,
        attr_result=attr_result,
        rule_evidence=rule_evidences,
        threat_intelligence=ti_results,
        entities=extracted_entities,
        top_k=5,
    )
    evidence_dict = evidence_obj.model_dump() if hasattr(evidence_obj, "model_dump") else evidence_obj.dict()

    # Step 7: Grounded Groq LLM Generation
    two_audience_output, llm_status, llm_ms = groq_service.generate_explanation(
        evidence=evidence_obj,
        disable_llm=not req.include_llm,
    )

    # Derive high-level fraud metadata grounded in facts
    fraud_type, intent_list, asset_list = derive_analysis_fields(
        label=result.prediction,
        matched_rule_ids=matched_rule_ids,
        text=req.text
    )

    # Calculate Risk Score & Level
    if result.prediction == "SCAM":
        base_score = int(round(result.probability * 100))
        if any(r.get("severity") in ["HIGH", "CRITICAL"] for r in rule_details):
            risk_score = max(base_score, 85)
        else:
            risk_score = max(base_score, 60)
        risk_level = "HIGH" if risk_score >= 70 else "MEDIUM"
    else:
        risk_score = int(round((1.0 - result.probability) * 100))
        risk_level = "LOW" if risk_score < 40 else "MEDIUM"

    total_request_ms = (time.perf_counter() - request_start) * 1000.0

    latency_breakdown = LatencyBreakdownSchema(
        preprocessing=round(preprocessing_ms, 3),
        distilbert=round(distilbert_ms, 3),
        ml_inference=round(distilbert_ms, 3),
        explainability=round(explainability_ms, 3),
        rules=round(rules_ms, 3),
        threat_intelligence=round(threat_intel_ms, 3),
        groq=round(llm_ms, 3),
        total=round(total_request_ms, 3),
    )

    senior_exp = SeniorExplanationSchema(
        headline=two_audience_output.senior.headline,
        message=two_audience_output.senior.message,
        action=two_audience_output.senior.action,
    )

    caretaker_exp = CaretakerExplanationSchema(
        headline=two_audience_output.caretaker.headline,
        summary=two_audience_output.caretaker.summary,
        why_flagged=two_audience_output.caretaker.why_flagged,
        recommended_action=two_audience_output.caretaker.recommended_action,
    )

    explanation_container = ExplanationContainerSchema(
        senior=senior_exp,
        caretaker=caretaker_exp,
    )

    rules_container = RuleSummarySchema(
        matched_rules=matched_rule_ids,
        categories=rule_categories,
        details=rule_details,
    )

    model_container = ModelMetadataSchema(
        name="bert-tiny-scam-v1",
        version="bert-tiny-scam-v1",
        status=result.model_status,
    )

    return AnalyzeResponse(
        event_id=event_id,
        prediction=result.prediction,
        confidence=round(result.probability, 4),
        probabilities=result.probabilities,
        fraud_type=fraud_type,
        intent=intent_list,
        risk_score=risk_score,
        risk_level=risk_level,
        model=model_container,
        rules=rules_container,
        evidence=evidence_dict,
        explanation=explanation_container,
        latency=latency_breakdown,
        # Legacy namespaces
        event=EventMetadata(
            event_id=event_id,
            user_id=req.user_id,
            channel=req.channel or "SMS",
            source_id=req.source_id,
            timestamp=event_ts,
        ),
        input=InputPayload(text=req.text),
        classification=ClassificationResultSchema(
            label=result.prediction,
            confidence=round(result.probability, 4),
        ),
        analysis=AnalysisInferenceSchema(
            fraud_type=fraud_type,
            intent=intent_list,
            asset_at_risk=asset_list,
        ),
        latency_ms=latency_breakdown,
        status=StatusSchema(
            analysis="complete",
            grounding=llm_status.grounding_status,
        ),
    )
