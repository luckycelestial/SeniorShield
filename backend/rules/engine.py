"""
rules/engine.py
===============
Deterministic Rule-Based Signal Engine for SeniorShield (Phase 5).

Evaluates incoming text against contextual patterns and combination rules.
Produces structured RuleEvidence objects for the EvidenceObject.
"""

import time
from typing import List, Dict, Any, Optional

from rules.models import RuleEvidence, RuleEngineResult, RuleSeverity, RuleCategory
from rules.rules_config import RULE_DEFINITIONS
from rules.patterns import (
    RE_OTP,
    RE_CREDENTIAL,
    RE_KYC,
    RE_URGENCY,
    RE_PAYMENT,
    RE_AUTHORITY,
    RE_REMOTE_ACCESS,
    RE_URL,
    is_negated_or_advisory
)


class RuleEngine:
    """
    Deterministic Rule-Based Signal Engine.
    Executes base rules and combination rules with context and negation awareness.
    """

    def __init__(self):
        self.definitions = RULE_DEFINITIONS

    def evaluate(self, text: str, channel: str = "SMS") -> RuleEngineResult:
        """
        Evaluate input text against all deterministic rules.

        Args:
            text:    The incoming text message / transcript.
            channel: The delivery channel (e.g. "SMS", "WHATSAPP", "CALL").

        Returns:
            RuleEngineResult with list of matched RuleEvidence items and latency.
        """
        t0 = time.perf_counter()
        evidences: List[RuleEvidence] = []
        matched_ids = set()

        if not text or not text.strip():
            return RuleEngineResult(
                rule_evidence=[],
                rules_ms=0.0,
                matched_rule_ids=[]
            )

        # ── 1. OTP_REQUEST ──
        otp_match = RE_OTP.search(text)
        if otp_match:
            # Check for negation/advisory context ("Never share your OTP with anyone")
            if not is_negated_or_advisory(text, otp_match.start()):
                rule_id = "OTP_REQUEST"
                meta = self.definitions[rule_id]
                evidences.append(RuleEvidence(
                    rule_id=rule_id,
                    category=meta["category"],
                    description=meta["description"],
                    severity=meta["severity"],
                    matched_text=otp_match.group(0),
                    confidence=1.0
                ))
                matched_ids.add(rule_id)

        # ── 2. CREDENTIAL_REQUEST ──
        cred_match = RE_CREDENTIAL.search(text)
        if cred_match:
            if not is_negated_or_advisory(text, cred_match.start()):
                rule_id = "CREDENTIAL_REQUEST"
                meta = self.definitions[rule_id]
                evidences.append(RuleEvidence(
                    rule_id=rule_id,
                    category=meta["category"],
                    description=meta["description"],
                    severity=meta["severity"],
                    matched_text=cred_match.group(0),
                    confidence=1.0
                ))
                matched_ids.add(rule_id)

        # ── 3. KYC_CONTEXT ──
        kyc_match = RE_KYC.search(text)
        if kyc_match:
            rule_id = "KYC_CONTEXT"
            meta = self.definitions[rule_id]
            evidences.append(RuleEvidence(
                rule_id=rule_id,
                category=meta["category"],
                description=meta["description"],
                severity=meta["severity"],
                matched_text=kyc_match.group(0),
                confidence=1.0
            ))
            matched_ids.add(rule_id)

        # ── 4. URGENCY_SIGNAL ──
        urgency_match = RE_URGENCY.search(text)
        if urgency_match:
            rule_id = "URGENCY_SIGNAL"
            meta = self.definitions[rule_id]
            evidences.append(RuleEvidence(
                rule_id=rule_id,
                category=meta["category"],
                description=meta["description"],
                severity=meta["severity"],
                matched_text=urgency_match.group(0),
                confidence=1.0
            ))
            matched_ids.add(rule_id)

        # ── 5. PAYMENT_REQUEST ──
        payment_match = RE_PAYMENT.search(text)
        if payment_match:
            if not is_negated_or_advisory(text, payment_match.start()):
                rule_id = "PAYMENT_REQUEST"
                meta = self.definitions[rule_id]
                evidences.append(RuleEvidence(
                    rule_id=rule_id,
                    category=meta["category"],
                    description=meta["description"],
                    severity=meta["severity"],
                    matched_text=payment_match.group(0),
                    confidence=1.0
                ))
                matched_ids.add(rule_id)

        # ── 6. AUTHORITY_REFERENCE ──
        auth_match = RE_AUTHORITY.search(text)
        if auth_match:
            rule_id = "AUTHORITY_REFERENCE"
            meta = self.definitions[rule_id]
            evidences.append(RuleEvidence(
                rule_id=rule_id,
                category=meta["category"],
                description=meta["description"],
                severity=meta["severity"],
                matched_text=auth_match.group(0),
                confidence=1.0
            ))
            matched_ids.add(rule_id)

        # ── 7. REMOTE_ACCESS_SIGNAL ──
        remote_match = RE_REMOTE_ACCESS.search(text)
        if remote_match:
            if not is_negated_or_advisory(text, remote_match.start()):
                rule_id = "REMOTE_ACCESS_SIGNAL"
                meta = self.definitions[rule_id]
                evidences.append(RuleEvidence(
                    rule_id=rule_id,
                    category=meta["category"],
                    description=meta["description"],
                    severity=meta["severity"],
                    matched_text=remote_match.group(0),
                    confidence=1.0
                ))
                matched_ids.add(rule_id)

        # ── 8. URL_PRESENT ──
        url_match = RE_URL.search(text)
        if url_match:
            rule_id = "URL_PRESENT"
            meta = self.definitions[rule_id]
            evidences.append(RuleEvidence(
                rule_id=rule_id,
                category=meta["category"],
                description=meta["description"],
                severity=meta["severity"],
                matched_text=url_match.group(0),
                confidence=1.0
            ))
            matched_ids.add(rule_id)

        # ── 9. COMBINATION RULES ──
        # Combination A: OTP_REQUEST + PAYMENT_REQUEST
        if "OTP_REQUEST" in matched_ids and "PAYMENT_REQUEST" in matched_ids:
            rule_id = "OTP_PAYMENT_COMBINATION"
            meta = self.definitions[rule_id]
            evidences.append(RuleEvidence(
                rule_id=rule_id,
                category=meta["category"],
                description=meta["description"],
                severity=meta["severity"],
                matched_text="[OTP_REQUEST + PAYMENT_REQUEST]",
                confidence=1.0
            ))
            matched_ids.add(rule_id)

        # Combination B: AUTHORITY_REFERENCE + PAYMENT_REQUEST + URGENCY_SIGNAL
        if "AUTHORITY_REFERENCE" in matched_ids and "PAYMENT_REQUEST" in matched_ids and "URGENCY_SIGNAL" in matched_ids:
            rule_id = "URGENCY_AUTHORITY_PAYMENT"
            meta = self.definitions[rule_id]
            evidences.append(RuleEvidence(
                rule_id=rule_id,
                category=meta["category"],
                description=meta["description"],
                severity=meta["severity"],
                matched_text="[AUTHORITY + PAYMENT + URGENCY]",
                confidence=1.0
            ))
            matched_ids.add(rule_id)

        # Combination C: KYC_CONTEXT + OTP_REQUEST + URGENCY_SIGNAL
        if "KYC_CONTEXT" in matched_ids and "OTP_REQUEST" in matched_ids and "URGENCY_SIGNAL" in matched_ids:
            rule_id = "KYC_OTP_URGENCY_COMBINATION"
            meta = self.definitions[rule_id]
            evidences.append(RuleEvidence(
                rule_id=rule_id,
                category=meta["category"],
                description=meta["description"],
                severity=meta["severity"],
                matched_text="[KYC + OTP + URGENCY]",
                confidence=1.0
            ))
            matched_ids.add(rule_id)

        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        return RuleEngineResult(
            rule_evidence=evidences,
            rules_ms=round(elapsed_ms, 3),
            matched_rule_ids=list(matched_ids)
        )
