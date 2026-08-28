"""
rules/patterns.py
=================
Regex patterns and contextual matchers for deterministic rule detection.

CRITICAL PRINCIPLE:
  Context matters. Rules must distinguish between:
    - Active requests ("Share your OTP") -> MATCH
    - Defensive warnings ("Never share your OTP with anyone") -> DO NOT MATCH
"""

import re
from typing import Optional, Tuple, List

# ── General Negation / Advisory Patterns ──
# Matches protective warnings where sensitive keywords appear defensively
NEGATION_PATTERNS = [
    r"\b(?:never|do\s+not|don'?t|should\s+not|must\s+not|will\s+not|refrain\s+from)\s+(?:share|disclose|give|send|tell|provide|ask|enter|input|forward)\b",
    r"\b(?:will\s+never|we\s+never|bank\s+never)\s+(?:ask|request|seek|call|demand)\b",
    r"\bkeep\s+your\s+(?:otp|pin|password|credentials)\s+secret\b",
    r"\bdo\s+not\s+disclose\b",
    r"\bnever\s+disclose\b",
    r"\bnever\b",
    r"\bdo\s+not\b",
    r"\bdon'?t\b",
]

RE_NEGATION_CLAUSE = re.compile(r"|".join(NEGATION_PATTERNS[:3]), re.IGNORECASE)
RE_DIRECT_NEGATION_WORDS = re.compile(r"\b(?:never|do\s+not|don'?t|should\s+not|must\s+not|will\s+not)\b", re.IGNORECASE)


def is_negated_or_advisory(text: str, match_start: int, window: int = 50) -> bool:
    """
    Checks if a match is preceded or surrounded by advisory/negation phrases.
    """
    start_pos = max(0, match_start - window)
    end_pos = min(len(text), match_start + 40)
    
    # 1. Check preceding text directly for negation words like "never ", "do not "
    prefix_ctx = text[start_pos:match_start].strip().lower()
    if RE_DIRECT_NEGATION_WORDS.search(prefix_ctx):
        return True

    # 2. Check the surrounding context window
    surrounding_ctx = text[start_pos:end_pos].lower()
    if RE_NEGATION_CLAUSE.search(surrounding_ctx):
        return True

    return False


# ── Rule 1: OTP_REQUEST ──
# Matches contextual requests for one-time passwords
OTP_PATTERNS = [
    r"(?:share|send|enter|provide|verify|tell|give|forward|submit|input)\s+(?:your\s+)?(?:otp|one[\-\s]*time[\-\s]*password|verification\s*code|security\s*code)",
    r"(?:otp|one[\-\s]*time[\-\s]*password|verification\s*code)\s+(?:is\s+required|needed|required\s+to\s+verify|to\s+unblock)",
    r"share\s+otp",
    r"send\s+the\s+otp",
    r"verify\s+your\s+otp",
    r"share\s+your\s+otp"
]
RE_OTP = re.compile(r"|".join(OTP_PATTERNS), re.IGNORECASE)


# ── Rule 2: CREDENTIAL_REQUEST ──
# Matches contextual requests for passwords, PINs, CVV, card numbers
CREDENTIAL_PATTERNS = [
    r"(?:share|send|enter|provide|verify|tell|give|input)\s+(?:your\s+)?(?:password|upi\s*pin|atm\s*pin|cvv|card\s*number|card\s*details|login\s*credentials|netbanking\s*password)",
    r"(?:send|share|give)\s+(?:your\s+)?(?:pin|password|cvv)",
    r"update\s+your\s+card\s+details",
    r"verify\s+your\s+atm\s*pin"
]
RE_CREDENTIAL = re.compile(r"|".join(CREDENTIAL_PATTERNS), re.IGNORECASE)


# ── Rule 3: KYC_CONTEXT ──
# Detects KYC verification, Aadhaar, PAN or account verification context
KYC_PATTERNS = [
    r"\bkyc\b",
    r"aadhaar\s+(?:verification|update|linking)",
    r"pan\s+(?:verification|update|linking|card\s+expired?)",
    r"identity\s+verification",
    r"account\s+verification",
    r"kyc\s+(?:will\s+)?expires?",
    r"update\s+(?:your\s+)?kyc",
    r"complete\s+(?:your\s+)?kyc"
]
RE_KYC = re.compile(r"|".join(KYC_PATTERNS), re.IGNORECASE)


# ── Rule 4: URGENCY_SIGNAL ──
# Detects artificial urgency and panic triggers
URGENCY_PATTERNS = [
    r"\burgent(?:ly)?\b",
    r"\bimmediately\b",
    r"\bright\s+now\b",
    r"\bact\s+now\b",
    r"\btoday\s+only\b",
    r"\b(?:final|last)\s+(?:warning|notice|reminder)\b",
    r"\bexpires?\s+today\b",
    r"within\s+\d+\s*(?:minutes?|mins?|hours?|hrs?)",
    r"account\s+(?:will\s+be\s+)?(?:blocked|suspended|frozen|closed|deactivated)",
    r"card\s+(?:will\s+be\s+)?(?:blocked|deactivated)",
    r"sim\s+(?:will\s+be\s+)?(?:blocked|deactivated|suspended)",
    r"(?:service|connection|electricity|power)\s+(?:will\s+be\s+)?(?:disconnected|suspended|cut|terminated)(?:\s+tonight|\s+today)?",
    r"legal\s+action\s+(?:will\s+be\s+taken|initiated)",
    r"arrest\s+warrant\s+issued"
]
RE_URGENCY = re.compile(r"|".join(URGENCY_PATTERNS), re.IGNORECASE)


# ── Rule 5: PAYMENT_REQUEST ──
# Matches contextual requests for money transfer, fee, deposit, fine
PAYMENT_PATTERNS = [
    r"(?:pay|transfer|send|remit|deposit)\s+(?:the\s+|a\s+)?(?:rs\.?|inr|usd|\$|amount|money|fee|fine|penalty|charges?)",
    r"(?:transfer|pay)\s+immediately",
    r"processing\s+fee",
    r"verification\s+fee",
    r"investigation\s+fee",
    r"clearance\s+fee",
    r"pay\s+(?:the\s+)?fine\s+now",
    r"upi\s+payment\s+required",
    r"refund\s+fee",
    r"courier\s+fee",
    r"parcel\s+fee"
]
RE_PAYMENT = re.compile(r"|".join(PAYMENT_PATTERNS), re.IGNORECASE)


# ── Rule 6: AUTHORITY_REFERENCE ──
# Detects references to police, CBI, tax officers, customs, RBI, telecom
AUTHORITY_PATTERNS = [
    r"\bpolice\b",
    r"\bcbi\b",
    r"\brbi\b",
    r"\breserve\s+bank\b",
    r"cyber\s*crime\s*(?:department|cell|police)?",
    r"income\s+tax\s*(?:officer|department)?",
    r"\bcustoms\s+(?:officer|department|duty)\b",
    r"arrest\s+warrant",
    r"digital\s+arrest",
    r"supreme\s+court",
    r"high\s+court",
    r"bank\s+(?:manager|officer|technician|representative)",
    r"telecom\s+(?:authority|officer|department)|\btrai\b",
    r"courier\s+(?:authority|officer|customs)"
]
RE_AUTHORITY = re.compile(r"|".join(AUTHORITY_PATTERNS), re.IGNORECASE)


# ── Rule 7: REMOTE_ACCESS_SIGNAL ──
# Detects remote desktop apps, screen sharing, APK downloads
REMOTE_ACCESS_PATTERNS = [
    r"\banydesk\b",
    r"\bteamviewer\b",
    r"\brustdesk\b",
    r"\bquicksupport\b",
    r"remote\s+access",
    r"screen\s+shar(?:ing|e)",
    r"remote\s+control",
    r"support\s+app(?:lication)?",
    r"install\s+(?:this\s+)?(?:app|apk|application|software)",
    r"download\s+(?:this\s+)?(?:app|apk|application|tool)",
    r"screen\s+access",
    r"accessibility\s+permission",
    r"give\s+access\s+to\s+(?:the\s+)?(?:technician|officer|manager)"
]
RE_REMOTE_ACCESS = re.compile(r"|".join(REMOTE_ACCESS_PATTERNS), re.IGNORECASE)


# ── Rule 8: URL_PRESENT ──
# Extracts valid URLs and web links
RE_URL = re.compile(
    r"(?:https?:\/\/|www\.)[^\s\/$.?#].[^\s]*|[a-zA-Z0-9-]+\.(?:com|org|net|in|co|xyz|top|site|live|app|online|cc|ru|vip|click)(?:\/[^\s]*)?",
    re.IGNORECASE
)
