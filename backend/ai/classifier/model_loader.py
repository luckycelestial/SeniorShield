"""
ai/classifier/model_loader.py
==============================
Singleton model loader for FastAPI startup.
Loads fine-tuned DistilBERT model if available, else base checkpoint.
"""

import os
from typing import Optional
from ai.classifier.distilbert_classifier import DistilBertClassifier
from ai.classifier.base import BaseClassifier

_classifier: Optional[BaseClassifier] = None


def load_classifier() -> BaseClassifier:
    """
    Load and return the classifier singleton.
    Called once during FastAPI lifespan startup.
    """
    global _classifier
    if _classifier is not None:
        return _classifier

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    fine_tuned_path = os.path.join(base_dir, "models", "distilbert-scam-v1")

    if os.path.exists(fine_tuned_path):
        default_path = fine_tuned_path
    else:
        default_path = "distilbert-base-uncased"

    model_path = os.environ.get("MODEL_PATH", default_path)
    device = os.environ.get("MODEL_DEVICE", None)   # None = auto

    _classifier = DistilBertClassifier(model_path=model_path, device=device)
    return _classifier


def get_classifier() -> BaseClassifier:
    """
    Return the loaded classifier. Raises RuntimeError if not loaded.
    Used as FastAPI dependency injection.
    """
    if _classifier is None:
        raise RuntimeError(
            "Classifier not loaded. "
            "Ensure load_classifier() is called during FastAPI startup."
        )
    return _classifier
