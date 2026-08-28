"""
ai/classifier/model_loader.py
==============================
Singleton model loader for FastAPI startup.
Loads fine-tuned bert-tiny model (16MB, ~40MB RAM) or DistilBERT if configured.
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
    bert_tiny_path = os.path.join(base_dir, "models", "bert-tiny-scam-v1")
    distilbert_path = os.path.join(base_dir, "models", "distilbert-scam-v1")

    if os.path.exists(bert_tiny_path):
        default_path = bert_tiny_path
    elif os.path.exists(distilbert_path):
        default_path = distilbert_path
    else:
        default_path = "prajjwal1/bert-tiny"

    model_path = os.environ.get("MODEL_PATH", default_path)
    device = os.environ.get("MODEL_DEVICE", None)

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
