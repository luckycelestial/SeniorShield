"""
ai/classifier/base.py
=====================
Abstract base class for all SeniorShield text classifiers.

This interface is deliberately minimal so that future classifiers
(SVM, Logistic Regression, XLM-R, Groq, etc.) can be plugged in
without changing the API contract.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class LatencyBreakdown:
    """Latency components for a single classification call (in milliseconds)."""
    preprocessing_ms: float
    inference_ms: float
    total_ms: float


@dataclass
class ClassificationResult:
    """
    Unified result returned by every BaseClassifier implementation.

    Fields marked FUTURE are placeholders for later pipeline stages
    (SHAP, threat intelligence, campaign correlation). They are not
    populated in this step.
    """
    # --- Core prediction ---
    prediction: str              # "SCAM" or "SAFE"
    probability: float           # Probability of the predicted class (0.0–1.0)
    probabilities: Dict[str, float]  # {"SAFE": 0.07, "SCAM": 0.93}

    # --- Model metadata ---
    model: str                   # Human-readable model name, e.g. "distilbert"
    model_version: str           # Checkpoint identifier
    model_status: str            # "fine-tuned" | "prototype / requires fine-tuning"
    device: str                  # "cpu" | "cuda"

    # --- Latency ---
    latency: LatencyBreakdown

    # --- FUTURE placeholders (not populated in step 1) ---
    # shap_values: Optional[dict] = None
    # threat_indicators: Optional[list] = None
    # campaign_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Abstract classifier interface
# ---------------------------------------------------------------------------

class BaseClassifier(ABC):
    """
    Abstract text classifier.

    Every classifier in the SeniorShield pipeline must implement this
    interface. The FastAPI endpoint (api/analysis.py) depends only on
    BaseClassifier, never on a concrete implementation.
    """

    @abstractmethod
    def predict(self, text: str) -> ClassificationResult:
        """
        Run the full classification pipeline on raw input text.

        Internally: preprocessing → tokenization → model inference.
        Returns a ClassificationResult with real latency measurements.
        """
        ...

    @abstractmethod
    def predict_proba(self, text: str) -> Dict[str, float]:
        """
        Return per-class probability dict without full result wrapping.

        Example: {"SAFE": 0.07, "SCAM": 0.93}
        """
        ...

    @abstractmethod
    def get_model_name(self) -> str:
        """Return a short human-readable model identifier."""
        ...

    @abstractmethod
    def get_model_version(self) -> str:
        """Return the exact checkpoint/version string."""
        ...

    @abstractmethod
    def get_model_status(self) -> str:
        """
        Return a human-readable status string.

        Examples:
          "fine-tuned on SeniorShield-SMS-v1"
          "prototype / requires fine-tuning"
        """
        ...

    @abstractmethod
    def get_device(self) -> str:
        """Return the compute device: 'cpu' or 'cuda'."""
        ...
