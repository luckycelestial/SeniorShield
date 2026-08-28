"""
ai/classifier/preprocessing.py
================================
Deterministic text normalization for the SeniorShield classification pipeline.

DESIGN PRINCIPLES:
  1. Deterministic — same input always produces same output.
  2. Security-token preserving — important scam indicators are NOT removed.
  3. Lightweight — runs in < 5ms on CPU.
  4. Consistent — the EXACT same function must be used at:
       training time (train.py)
       validation time
       benchmark time (benchmark.py)
       inference time (distilbert_classifier.py)

IMPORTANT:
  Do NOT aggressively strip tokens. Scam detectors depend on words like
  OTP, KYC, URGENT, BLOCKED, etc. Removing them would destroy signal.
"""

import re
import time
from typing import Tuple

# ---------------------------------------------------------------------------
# Security-sensitive tokens that must never be removed or altered.
# (For reference — preprocessing preserves ALL words; this list documents
# why we intentionally avoid aggressive stopword removal.)
# ---------------------------------------------------------------------------
SECURITY_TOKENS = frozenset({
    "otp", "kyc", "pin", "cvv", "upi", "bank", "account", "urgent",
    "blocked", "verify", "verification", "password", "credential",
    "aadhar", "aadhaar", "pan", "neft", "imps", "rtgs", "wallet",
    "fraud", "scam", "arrest", "police", "cbi", "rbi", "sebi",
    "electricity", "disconnected", "disconnection", "suspend", "suspended",
    "helpline", "court", "warrant", "lottery", "prize", "refund",
    "invoice", "legal", "notice", "block", "unblock",
})

# Maximum input length guard (characters) — prevents memory abuse.
MAX_INPUT_CHARS = 2000


def normalize_text(text: str) -> Tuple[str, float]:
    """
    Normalize raw input text for DistilBERT classification.

    Args:
        text: Raw input string (SMS body, call transcript, etc.)

    Returns:
        Tuple of:
          normalized_text (str)  — cleaned text ready for tokenization
          preprocessing_latency_ms (float)  — wall-clock time in milliseconds

    Normalization steps:
      1. Strip leading/trailing whitespace.
      2. Truncate to MAX_INPUT_CHARS (guard against adversarial inputs).
      3. Collapse multiple whitespace sequences to a single space.
      4. Lowercase everything (DistilBERT-uncased is case-insensitive).
      5. Keep alphanumeric characters, Indian Rupee sign ₹, and
         common punctuation. Remove other special characters.
      6. Re-collapse whitespace after character filtering.

    What we deliberately DO NOT do:
      - Remove stopwords (would remove "not", changing meaning).
      - Stem or lemmatize (would distort token identity).
      - Remove digits (amounts like "5000" are scam signals).
      - Remove punctuation like ! or ? (urgency markers).
    """
    _start = time.perf_counter()

    if not isinstance(text, str):
        text = str(text)

    # Step 1: Strip edges
    text = text.strip()

    # Step 2: Hard length cap
    if len(text) > MAX_INPUT_CHARS:
        text = text[:MAX_INPUT_CHARS]

    # Step 3: Normalize internal whitespace (tabs, newlines → space)
    text = re.sub(r"[\t\n\r\f\v]+", " ", text)
    text = re.sub(r" {2,}", " ", text)

    # Step 4: Lowercase
    text = text.lower()

    # Step 5: Keep alphanumeric, ₹, and punctuation relevant to scam messages.
    #         Remove other unicode symbols / control characters.
    text = re.sub(r"[^\w\s₹.,!?@#%:/\-\'\"()]", " ", text)

    # Step 6: Final whitespace collapse
    text = re.sub(r" {2,}", " ", text).strip()

    _elapsed_ms = (time.perf_counter() - _start) * 1000.0

    return text, round(_elapsed_ms, 4)


def validate_input(text: str) -> str:
    """
    Validate raw input before classification.

    Returns:
        Error message string if invalid, or empty string if valid.
    """
    if not text or not text.strip():
        return "Text cannot be empty."
    if len(text.strip()) < 3:
        return "Text is too short to classify (minimum 3 characters)."
    if len(text) > MAX_INPUT_CHARS * 2:
        return f"Text exceeds maximum allowed length ({MAX_INPUT_CHARS * 2} characters)."
    return ""
