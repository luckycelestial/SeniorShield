"""
evidence/grounding_validator.py
================================
Grounding Validator for Multi-Source Two-Audience LLM Explanations (Phase 4, 5, 6).

Validates candidate LLM outputs (Senior Citizen Response & Caretaker Response)
against the authoritative EvidenceObject (Model + Rules + Threat Intelligence).

CORE ARCHITECTURAL RULES:
  1. The LLM is NOT the security authority. It cannot alter the SCAM/SAFE decision.
  2. The LLM may only explain evidence present in the EvidenceObject.
  3. The LLM must not invent banks, police departments, monetary amounts, or URLs.
  4. The LLM must not claim an unknown URL is "safe".
  5. The Senior response must remain free of technical jargon.
  6. The Caretaker response must remain grounded in actual model metrics, rules, and TI.
"""

import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from evidence.schema import EvidenceObject


class GroundingViolation(BaseModel):
    violation_type: str   # "CLASSIFICATION_MISMATCH" | "HALLUCINATED_ENTITY" | "HALLUCINATED_AMOUNT" | "UNSUPPORTED_TI_CLAIM" | "UNSUPPORTED_CLAIM" | "SENIOR_JARGON" | "EMPTY_EXPLANATION"
    severity: str         # "CRITICAL" | "WARNING"
    details: str


class ValidationResult(BaseModel):
    is_grounded: bool
    violations: List[GroundingViolation]


class GroundingValidator:
    """
    Validates candidate LLM explanation outputs against the EvidenceObject.
    """

    # High-risk entity names that must not be hallucinated if absent from source text & evidence
    _KNOWN_ORGANIZATIONS = [
        "sbi", "state bank of india", "hdfc", "icici", "axis bank",
        "punjab national bank", "pnb", "bank of baroda", "kotak",
        "cbi", "rbi", "sebi", "cyber crime", "police department",
        "trai", "income tax department", "customs", "netflix",
        "amazon", "google pay", "phonepe", "paytm"
    ]

    # External intelligence tools that should not be claimed as used unless present in TI results
    _EXTERNAL_TOOL_PATTERNS = [
        "url reputation", "blacklist", "truecaller", "whois",
        "campaign id", "prior scam history", "ip address",
        "dark web", "multi-step campaign"
    ]

    # Forbidden technical terms for senior citizen audience
    _SENIOR_FORBIDDEN_JARGON = [
        "distilbert", "model confidence", "attribution", "shap",
        "integrated gradients", "logits", "embeddings", "neural network",
        "classifier", "threat actor", "phishing vector", "credential theft",
        "risk score", "% confidence", "percent confidence", "probability of",
        "threat intelligence provider"
    ]

    def validate(
        self,
        candidate_explanation: str,
        candidate_risk: str,
        evidence: EvidenceObject,
        is_senior_view: bool = False,
    ) -> ValidationResult:
        """
        Validate an explanation string against the EvidenceObject.
        """
        violations: List[GroundingViolation] = []
        source_lower = evidence.source_text.lower()
        explanation_lower = candidate_explanation.lower()
        true_label = evidence.prediction.label.strip().upper()

        # Combine source text and all evidence fields for allowable context
        allowed_text = source_lower
        if evidence.threat_intelligence:
            allowed_text += " " + " ".join(ti.evidence.lower() + " " + ti.entity.value.lower() for ti in evidence.threat_intelligence)
        if evidence.rule_evidence:
            allowed_text += " " + " ".join(r.matched_text.lower() + " " + r.description.lower() for r in evidence.rule_evidence)

        # ── 1. Classification Mismatch (CRITICAL) ──
        if candidate_risk.strip().upper() != true_label:
            violations.append(GroundingViolation(
                violation_type="CLASSIFICATION_MISMATCH",
                severity="CRITICAL",
                details=(
                    f"Candidate claim '{candidate_risk}' contradicts system verdict '{true_label}'. "
                    "LLM is not the security decision-maker."
                ),
            ))

        # ── 2. Hallucinated Organization / Bank / Authority (CRITICAL) ──
        for org in self._KNOWN_ORGANIZATIONS:
            if org in explanation_lower and org not in allowed_text:
                violations.append(GroundingViolation(
                    violation_type="HALLUCINATED_ENTITY",
                    severity="CRITICAL",
                    details=(
                        f"Explanation references organization/entity '{org}' which is NOT "
                        "present in the source text or evidence."
                    ),
                ))

        # ── 3. Hallucinated Monetary Amounts (CRITICAL) ──
        amount_patterns = [
            r"rs\.?\s*[\d,]+", r"₹\s*[\d,]+", r"\$\s*[\d,]+",
            r"[\d,]+\s*(?:lakh|crore|thousand|rupees)"
        ]
        for pattern in amount_patterns:
            matches = re.findall(pattern, explanation_lower)
            for match in matches:
                clean_match = match.replace(" ", "").replace(".", "")
                clean_allowed = allowed_text.replace(" ", "").replace(".", "")
                if clean_match not in clean_allowed:
                    violations.append(GroundingViolation(
                        violation_type="HALLUCINATED_AMOUNT",
                        severity="CRITICAL",
                        details=(
                            f"Explanation references monetary amount '{match}' which does NOT "
                            "appear in the original source message or evidence."
                        ),
                    ))

        # ── 4. Threat Intelligence Claim Verification (CRITICAL / WARNING) ──
        # Check: If TI is empty or unknown, LLM must not claim URL is safe or verified malicious
        ti_results = evidence.threat_intelligence or []
        has_malicious_ti = any(ti.reputation == "malicious" for ti in ti_results)
        has_benign_ti = any(ti.reputation == "benign" for ti in ti_results)

        if "threat intelligence reported" in explanation_lower or "security service reported" in explanation_lower or "link is malicious" in explanation_lower:
            if not has_malicious_ti and not ("malicious" in allowed_text):
                violations.append(GroundingViolation(
                    violation_type="UNSUPPORTED_TI_CLAIM",
                    severity="CRITICAL",
                    details="Explanation claims external threat intelligence flagged entity as malicious when no such TI record exists.",
                ))

        if ("url is safe" in explanation_lower or "link is safe" in explanation_lower or "domain is verified safe" in explanation_lower) and not has_benign_ti:
            violations.append(GroundingViolation(
                violation_type="UNSUPPORTED_TI_CLAIM",
                severity="CRITICAL",
                details="Explanation claims link/domain is verified safe when Threat Intelligence is unknown or unavailable.",
            ))

        # ── 5. Unsupported External Tools / Sources (WARNING) ──
        for tool_pat in self._EXTERNAL_TOOL_PATTERNS:
            if tool_pat in explanation_lower and tool_pat not in allowed_text:
                violations.append(GroundingViolation(
                    violation_type="UNSUPPORTED_CLAIM",
                    severity="WARNING",
                    details=f"Explanation claims external source '{tool_pat}' which was not in evidence.",
                ))

        # ── 6. Senior Audience Jargon Check (WARNING) ──
        if is_senior_view:
            for jargon in self._SENIOR_FORBIDDEN_JARGON:
                if jargon in explanation_lower:
                    violations.append(GroundingViolation(
                        violation_type="SENIOR_JARGON",
                        severity="WARNING",
                        details=f"Senior response contains technical term '{jargon}'. Must use plain everyday language.",
                    ))

        # ── 7. Empty / Too short check ──
        if len(candidate_explanation.strip()) < 8:
            violations.append(GroundingViolation(
                violation_type="EMPTY_EXPLANATION",
                severity="WARNING",
                details="Explanation is empty or trivially short.",
            ))

        is_grounded = all(v.severity != "CRITICAL" for v in violations)
        return ValidationResult(is_grounded=is_grounded, violations=violations)

    def validate_two_audience(
        self,
        senior_text: str,
        caretaker_text: str,
        caretaker_prediction: str,
        evidence: EvidenceObject,
    ) -> ValidationResult:
        """
        Validate both senior citizen and caretaker explanation outputs.
        """
        v_senior = self.validate(
            candidate_explanation=senior_text,
            candidate_risk=evidence.prediction.label,
            evidence=evidence,
            is_senior_view=True
        )

        v_caretaker = self.validate(
            candidate_explanation=caretaker_text,
            candidate_risk=caretaker_prediction,
            evidence=evidence,
            is_senior_view=False
        )

        all_violations = v_senior.violations + v_caretaker.violations
        is_grounded = v_senior.is_grounded and v_caretaker.is_grounded

        return ValidationResult(is_grounded=is_grounded, violations=all_violations)
