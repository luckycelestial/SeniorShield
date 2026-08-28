"""
rules/rules_config.py
=====================
Declarative rule configuration and metadata for SeniorShield.
"""

from typing import Dict, Any, List
from rules.models import RuleSeverity, RuleCategory

RULE_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "OTP_REQUEST": {
        "category": RuleCategory.CREDENTIAL_REQUEST.value,
        "severity": RuleSeverity.HIGH.value,
        "description": "The message requests a one-time password (OTP) or security verification code."
    },
    "CREDENTIAL_REQUEST": {
        "category": RuleCategory.CREDENTIAL_REQUEST.value,
        "severity": RuleSeverity.CRITICAL.value,
        "description": "The message requests sensitive login credentials, PIN, CVV, or card information."
    },
    "KYC_CONTEXT": {
        "category": RuleCategory.IDENTITY_VERIFICATION.value,
        "severity": RuleSeverity.MEDIUM.value,
        "description": "The message references KYC, Aadhaar, PAN, or account identity verification."
    },
    "URGENCY_SIGNAL": {
        "category": RuleCategory.URGENCY.value,
        "severity": RuleSeverity.HIGH.value,
        "description": "The message uses urgent or coercive language to pressure immediate action."
    },
    "PAYMENT_REQUEST": {
        "category": RuleCategory.FINANCIAL_REQUEST.value,
        "severity": RuleSeverity.HIGH.value,
        "description": "The message asks for an immediate money transfer, fee, deposit, or fine payment."
    },
    "AUTHORITY_REFERENCE": {
        "category": RuleCategory.IMPERSONATION_AUTHORITY.value,
        "severity": RuleSeverity.HIGH.value,
        "description": "The message references law enforcement, government officials, banking authorities, or courts."
    },
    "REMOTE_ACCESS_SIGNAL": {
        "category": RuleCategory.REMOTE_ACCESS.value,
        "severity": RuleSeverity.CRITICAL.value,
        "description": "The message requests installing remote desktop software, APKs, or granting screen control."
    },
    "URL_PRESENT": {
        "category": RuleCategory.EXTERNAL_LINK.value,
        "severity": RuleSeverity.INFO.value,
        "description": "An external link or URL was detected in the message content."
    },
    # ── Compound / Combination Rules ──
    "OTP_PAYMENT_COMBINATION": {
        "category": RuleCategory.COMPOUND_PATTERN.value,
        "severity": RuleSeverity.CRITICAL.value,
        "description": "High-risk pattern: The message simultaneously requests both an OTP and a financial payment."
    },
    "URGENCY_AUTHORITY_PAYMENT": {
        "category": RuleCategory.COMPOUND_PATTERN.value,
        "severity": RuleSeverity.CRITICAL.value,
        "description": "High-risk pattern: Coercive demand combining authority impersonation, urgency, and money transfer."
    },
    "KYC_OTP_URGENCY_COMBINATION": {
        "category": RuleCategory.COMPOUND_PATTERN.value,
        "severity": RuleSeverity.CRITICAL.value,
        "description": "Classic phishing pattern: KYC expiration urgency combined with an immediate OTP request."
    }
}
