"""
ai/llm/groq_service.py
======================
Grounded Groq LLM Explanation Service for SeniorShield.

ARCHITECTURE ROLE:
  DistilBERT = Classifier (Authoritative Security Decision)
  XAI        = Model Explanation (Integrated Gradients Token Attribution)
  RULES      = Deterministic Signal Engine
  THREAT INT = External Entity Intelligence
  Groq LLM   = Language / Explanation Generator ONLY

OUTPUTS GENERATED:
  1. Senior Citizen Response: Simple, short, non-technical, action-first.
  2. Caretaker / Family Response: Formal, detailed, multi-source evidence-grounded.

CRITICAL CONSTRAINTS:
  1. Groq is NOT the security authority. It MUST NOT change the classification.
  2. Groq is called ONLY with structured EvidenceObjects containing Model, Rule, and TI facts.
  3. If Groq times out, errors, or fails grounding validation, deterministic
     fallbacks are returned for both audiences without failing the security pipeline.
"""

import os
import json
import time
import urllib.request
import urllib.error

try:
    import requests
except ImportError:
    requests = None

from typing import Dict, Any, Tuple, Optional, List, Union
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Ensure .env is loaded
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
load_dotenv(dotenv_path=env_path)

from evidence.schema import EvidenceObject
from evidence.grounding_validator import GroundingValidator, ValidationResult


class SeniorExplanation(BaseModel):
    headline: str = Field(..., description="Short, direct 3-6 word title for senior citizen")
    message: str = Field(..., description="1-2 simple everyday sentences explaining safety status")
    action: str = Field(..., description="1 clear actionable instruction on what the senior should do")


class CaretakerExplanation(BaseModel):
    headline: str = Field(..., description="Formal descriptive headline for caretaker")
    summary: str = Field(..., description="Objective overview of what happened and why flagged")
    why_flagged: List[str] = Field(default_factory=list, description="Specific evidence bullet points linking model decision, rules, and external evidence")
    recommended_action: str = Field(..., description="Recommended protective action for family/guardian")


class ExplanationResponse(BaseModel):
    senior: SeniorExplanation
    caretaker: CaretakerExplanation


class LLMStatus(BaseModel):
    status: str            # "success" | "fallback" | "disabled" | "timeout" | "api_error" | "validation_failed" | "missing_key"
    model: str             # Groq model identifier or "fallback"
    grounding_status: str  # "passed" | "failed" | "bypassed"
    error_message: Optional[str] = None


def get_deterministic_fallback(label: str, confidence: float, evidence_obj: Optional[EvidenceObject] = None) -> ExplanationResponse:
    """
    Generate deterministic, evidence-safe fallbacks for both audiences.
    Used on LLM timeout, API error, disabled flag, or validation failure.
    """
    is_scam = label.upper() == "SCAM"
    conf_rounded = round(confidence, 4)

    why_flagged_list = [f"The model classified the interaction as {label} with {conf_rounded * 100:.1f}% confidence."]
    if evidence_obj:
        if evidence_obj.rule_evidence:
            for r in evidence_obj.rule_evidence[:3]:
                why_flagged_list.append(f"The rule engine detected: {r.description}")
        if evidence_obj.threat_intelligence:
            for ti in evidence_obj.threat_intelligence[:2]:
                why_flagged_list.append(f"External threat intelligence flagged {ti.entity.value} as {ti.reputation}.")

    if is_scam:
        senior = SeniorExplanation(
            headline="Be Careful",
            message="This looks like a scam. Do not share your OTP, password, or send money.",
            action="Do not reply or click any link. Ask your family member first."
        )
        caretaker = CaretakerExplanation(
            headline="High-Risk Interaction Detected",
            summary="The incoming interaction was flagged as a potential fraud attempt.",
            why_flagged=why_flagged_list,
            recommended_action="Advise the senior citizen not to share codes or transfer money. Verify the sender through official contact channels."
        )
    else:
        senior = SeniorExplanation(
            headline="Message Looks Safe",
            message="No scam warning signs were found in this message.",
            action="You may proceed normally, but always maintain standard caution."
        )
        caretaker = CaretakerExplanation(
            headline="Low Risk: Standard Interaction",
            summary="The incoming interaction passed standard security checks.",
            why_flagged=why_flagged_list,
            recommended_action="No immediate guardian intervention required."
        )

    return ExplanationResponse(senior=senior, caretaker=caretaker)


class GroqService:
    """
    Dedicated service for calling Groq LLM API to generate multi-source grounded explanations.
    """

    def __init__(self):
        self.validator = GroundingValidator()

    def generate_explanation(
        self,
        evidence: EvidenceObject,
        disable_llm: bool = False
    ) -> Tuple[ExplanationResponse, LLMStatus, float]:
        """
        Generate grounded explanations for both Senior Citizen and Caretaker audiences.

        Args:
            evidence:    The structured EvidenceObject from classifier + rules + TI pipeline.
            disable_llm: If True, bypasses Groq and uses deterministic fallback (dev control).

        Returns:
            Tuple of (ExplanationResponse, LLMStatus, llm_latency_ms)
        """
        llm_start = time.perf_counter()

        api_key = os.environ.get("GROQ_API_KEY", "").strip()
        model_name = os.environ.get("GROQ_MODEL", "groq/compound-mini").strip()
        try:
            timeout = float(os.environ.get("GROQ_TIMEOUT_SECONDS", "3.0"))
        except ValueError:
            timeout = 10.0

        label = evidence.prediction.label.upper()
        confidence = evidence.prediction.probability
        fallback_output = get_deterministic_fallback(label, confidence, evidence)

        # 1. Dev toggle or missing key check
        if disable_llm:
            elapsed_ms = (time.perf_counter() - llm_start) * 1000.0
            return (
                fallback_output,
                LLMStatus(
                    status="disabled",
                    model="fallback",
                    grounding_status="bypassed",
                    error_message="LLM generation explicitly disabled by client flag."
                ),
                round(elapsed_ms, 3)
            )

        if not api_key or api_key == "your_groq_api_key_here":
            elapsed_ms = (time.perf_counter() - llm_start) * 1000.0
            return (
                fallback_output,
                LLMStatus(
                    status="missing_key",
                    model="fallback",
                    grounding_status="bypassed",
                    error_message="GROQ_API_KEY is not configured in .env."
                ),
                round(elapsed_ms, 3)
            )

        # 2. System and User Prompt setup
        system_prompt = (
            "You are the explanation component of SeniorShield. You must generate TWO grounded JSON explanations for a security incident:\n"
            "1. senior: extremely simple words, max 2 short sentences, action-first, NO technical jargon, no AI/model terms.\n"
            "2. caretaker: formal, detailed summary with why_flagged bullet points and recommended_action.\n\n"
            "CRITICAL CONSTRAINTS:\n"
            "- You are NOT the classifier. The security decision (SCAM or SAFE) has already been determined. Do NOT change it.\n"
            "- Distinguish evidence sources: MODEL SIGNAL (DistilBERT + attribution) vs RULE SIGNAL (deterministic engine) vs EXTERNAL THREAT INTELLIGENCE.\n"
            "- If Threat Intelligence is 'unknown' or 'unavailable', do NOT claim the link/entity is safe.\n"
            "- Respond ONLY with a valid JSON object matching this exact structure:\n"
            "{\n"
            "  \"senior\": {\n"
            "    \"headline\": \"...\",\n"
            "    \"message\": \"...\",\n"
            "    \"action\": \"...\"\n"
            "  },\n"
            "  \"caretaker\": {\n"
            "    \"headline\": \"...\",\n"
            "    \"summary\": \"...\",\n"
            "    \"why_flagged\": [\"...\"],\n"
            "    \"recommended_action\": \"...\"\n"
            "  }\n"
            "}\n"
            "- Do NOT invent banks, police departments, monetary amounts, or URLs not present in the evidence."
        )

        evidence_payload = {
            "prediction": evidence.prediction.label,
            "confidence": round(evidence.prediction.probability, 4),
            "model_features": [
                {
                    "token": feat.token,
                    "contribution": round(feat.contribution, 4),
                    "direction": feat.direction,
                }
                for feat in (evidence.attribution.top_features if evidence.attribution else [])
            ],
            "rule_signals": [
                {
                    "rule_id": r.rule_id,
                    "severity": r.severity,
                    "description": r.description,
                    "matched": r.matched_text,
                }
                for r in evidence.rule_evidence
            ],
            "threat_intelligence": [
                {
                    "entity_type": ti.entity.type,
                    "value": ti.entity.value,
                    "reputation": ti.reputation,
                    "evidence": ti.evidence,
                }
                for ti in evidence.threat_intelligence
            ],
            "entities": evidence.entities,
            "untrusted_source_text": evidence.source_text,
        }

        user_prompt = (
            f"SECURITY EVIDENCE:\n{json.dumps(evidence_payload, indent=2)}\n\n"
            "Generate the two-audience JSON explanation based ONLY on the evidence above."
        )

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
            "max_tokens": 500
        }

        # 3. API Call to Groq
        try:
            if requests is not None:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=timeout
                )
                elapsed_ms = (time.perf_counter() - llm_start) * 1000.0

                if response.status_code != 200:
                    print(f"[GroqService] Groq API returned HTTP {response.status_code}: {response.text[:200]}")
                    return (
                        fallback_output,
                        LLMStatus(
                            status="api_error",
                            model=model_name,
                            grounding_status="failed",
                            error_message=f"Groq API returned HTTP {response.status_code}"
                        ),
                        round(elapsed_ms, 3)
                    )

                res_json = response.json()
                raw_content = res_json["choices"][0]["message"]["content"]
            else:
                # Built-in urllib fallback (requires zero external packages)
                req_data = json.dumps(payload).encode("utf-8")
                req_obj = urllib.request.Request(
                    "https://api.groq.com/openai/v1/chat/completions",
                    data=req_data,
                    headers=headers,
                    method="POST"
                )
                with urllib.request.urlopen(req_obj, timeout=timeout) as resp:
                    elapsed_ms = (time.perf_counter() - llm_start) * 1000.0
                    resp_body = resp.read().decode("utf-8")
                    res_json = json.loads(resp_body)
                    raw_content = res_json["choices"][0]["message"]["content"]

            # Parse JSON output into ExplanationResponse schema
            parsed_data = json.loads(raw_content)

            sr_data = parsed_data.get("senior", parsed_data.get("senior_response", {}))
            cr_data = parsed_data.get("caretaker", parsed_data.get("caretaker_response", {}))

            # Clean and construct SeniorExplanation
            senior_output = SeniorExplanation(
                headline=str(sr_data.get("headline", fallback_output.senior.headline)).strip(),
                message=str(sr_data.get("message", fallback_output.senior.message)).strip(),
                action=str(sr_data.get("action", fallback_output.senior.action)).strip()
            )

            # Clean and construct CaretakerExplanation
            raw_wf = cr_data.get("why_flagged", fallback_output.caretaker.why_flagged)
            if isinstance(raw_wf, str):
                why_flagged_list = [raw_wf]
            elif isinstance(raw_wf, list):
                why_flagged_list = [str(x).strip() for x in raw_wf]
            else:
                why_flagged_list = fallback_output.caretaker.why_flagged

            caretaker_output = CaretakerExplanation(
                headline=str(cr_data.get("headline", fallback_output.caretaker.headline)).strip(),
                summary=str(cr_data.get("summary", fallback_output.caretaker.summary)).strip(),
                why_flagged=why_flagged_list,
                recommended_action=str(cr_data.get("recommended_action", fallback_output.caretaker.recommended_action)).strip()
            )

            two_audience_output = ExplanationResponse(
                senior=senior_output,
                caretaker=caretaker_output
            )

            # 4. Grounding Validation across both responses
            val_result: ValidationResult = self.validator.validate_two_audience(
                senior_text=f"{senior_output.headline} {senior_output.message} {senior_output.action}",
                caretaker_text=f"{caretaker_output.headline} {caretaker_output.summary} {' '.join(caretaker_output.why_flagged)}",
                caretaker_prediction=label,
                evidence=evidence
            )

            if not val_result.is_grounded:
                print(f"[GroqService] Grounding validation failed for response: {val_result.violations}")
                return (
                    fallback_output,
                    LLMStatus(
                        status="validation_failed",
                        model=model_name,
                        grounding_status="failed",
                        error_message=f"Explanation failed grounding verification: {val_result.violations[0].details if val_result.violations else 'unsupported claims'}"
                    ),
                    round(elapsed_ms, 3)
                )

            return (
                two_audience_output,
                LLMStatus(
                    status="success",
                    model=model_name,
                    grounding_status="passed"
                ),
                round(elapsed_ms, 3)
            )

        except requests.exceptions.Timeout:
            elapsed_ms = (time.perf_counter() - llm_start) * 1000.0
            print(f"[GroqService] Groq request timed out ({timeout}s)")
            return (
                fallback_output,
                LLMStatus(
                    status="timeout",
                    model=model_name,
                    grounding_status="bypassed",
                    error_message=f"Groq API request timed out after {timeout}s"
                ),
                round(elapsed_ms, 3)
            )
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - llm_start) * 1000.0
            print(f"[GroqService] Unexpected error: {exc}")
            return (
                fallback_output,
                LLMStatus(
                    status="fallback",
                    model=model_name,
                    grounding_status="bypassed",
                    error_message=f"LLM exception: {type(exc).__name__}"
                ),
                round(elapsed_ms, 3)
            )
