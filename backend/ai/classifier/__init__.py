"""
ai/classifier/__init__.py
=========================
Production transformer classifier & XAI explainability for SeniorShield.
"""

from ai.classifier.base import BaseClassifier, ClassificationResult, LatencyBreakdown
from ai.classifier.distilbert_classifier import DistilBertClassifier
from ai.classifier.model_loader import load_classifier, get_classifier
from ai.classifier.attributor import DistilBertAttributor, AttributionResult, TokenAttribution

__all__ = [
    "BaseClassifier",
    "ClassificationResult",
    "LatencyBreakdown",
    "DistilBertClassifier",
    "load_classifier",
    "get_classifier",
    "DistilBertAttributor",
    "AttributionResult",
    "TokenAttribution",
]
