"""
ai/classifier/model_loader.py
==============================
Thread-safe lazy model loader for FastAPI.
Loads fine-tuned bert-tiny / DistilBERT model ONCE and reuses singleton across all requests.
Does not block server startup or port binding.
"""

import os
import threading
from typing import Optional
from ai.classifier.base import BaseClassifier

_classifier: Optional[BaseClassifier] = None
_lock = threading.Lock()


def load_classifier() -> BaseClassifier:
    """
    Load and return the classifier singleton thread-safely.
    Can be called during background warmup or lazily on first request.
    """
    global _classifier
    if _classifier is not None:
        return _classifier

    with _lock:
        if _classifier is not None:
            return _classifier

        # Deferred import to prevent heavy ML loading during module import
        from ai.classifier.distilbert_classifier import DistilBertClassifier

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
    Return the loaded classifier singleton.
    Lazily loads on first call if not yet loaded.
    Used as FastAPI dependency injection for /api/analyze.
    """
    global _classifier
    if _classifier is None:
        return load_classifier()
    return _classifier
