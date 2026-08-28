"""
ai/classifier/distilbert_classifier.py
=======================================
DistilBERT-based binary scam classifier for SeniorShield.
"""

import os
import time
import threading
from typing import Dict

import torch
import torch.nn.functional as F
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification

from ai.classifier.base import BaseClassifier, ClassificationResult, LatencyBreakdown
from ai.classifier.preprocessing import normalize_text

DEFAULT_CHECKPOINT = "distilbert-base-uncased"
LABEL_MAP = {0: "SAFE", 1: "SCAM"}
MAX_TOKEN_LEN = 128


class DistilBertClassifier(BaseClassifier):
    """
    DistilBERT binary classifier.
    Loaded once at startup; all requests share the same in-memory model.
    """

    def __init__(self, model_path: str = DEFAULT_CHECKPOINT, device: str = None):
        self._device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self._model_path = model_path  # INTERNAL ONLY — never returned in API
        self._lock = threading.Lock()

        # Derive a safe public version string (no filesystem paths)
        if os.path.isdir(model_path):
            self._model_version_public = os.path.basename(model_path.rstrip("/\\"))
        else:
            # HuggingFace Hub checkpoint: already safe (e.g. "distilbert-base-uncased")
            self._model_version_public = model_path

        # Check for status file written by train.py
        status_file = os.path.join(model_path, "model_status.txt") if os.path.isdir(model_path) else None
        if status_file and os.path.exists(status_file):
            with open(status_file, "r") as sf:
                self._status = sf.read().strip()
        elif self._model_version_public == DEFAULT_CHECKPOINT:
            self._status = "prototype / requires fine-tuning"
        else:
            self._status = "fine-tuned on SeniorShield-SMS-v1"

        # Internal load — path kept server-side only
        print(f"[DistilBertClassifier] Loading checkpoint '{self._model_version_public}'  device={self._device}")
        cold_start = time.perf_counter()

        self._tokenizer = DistilBertTokenizerFast.from_pretrained(model_path)
        self._model = DistilBertForSequenceClassification.from_pretrained(
            model_path,
            id2label={0: "SAFE", 1: "SCAM"},
            label2id={"SAFE": 0, "SCAM": 1},
            ignore_mismatched_sizes=True,
        )
        self._model.to(self._device)
        self._model.eval()

        self._cold_start_ms = (time.perf_counter() - cold_start) * 1000.0
        print(f"[DistilBertClassifier] Ready in {self._cold_start_ms:.1f} ms | Status: {self._status}")

    def get_model_name(self) -> str:
        return "distilbert"

    def get_model_version(self) -> str:
        """Return safe public version string. Never exposes filesystem paths."""
        return self._model_version_public

    def get_model_status(self) -> str:
        return self._status

    def get_device(self) -> str:
        return self._device

    def predict_proba(self, text: str) -> Dict[str, float]:
        normalized, _ = normalize_text(text)
        inputs = self._tokenize(normalized)
        with torch.no_grad():
            logits = self._model(**inputs).logits
        probs = F.softmax(logits, dim=-1).squeeze().tolist()
        if isinstance(probs, float):
            probs = [probs, 1.0 - probs]
        return {LABEL_MAP[i]: round(probs[i], 6) for i in range(len(probs))}

    def predict(self, text: str) -> ClassificationResult:
        total_start = time.perf_counter()

        normalized, preprocessing_ms = normalize_text(text)

        inference_start = time.perf_counter()
        inputs = self._tokenize(normalized)
        with torch.no_grad():
            logits = self._model(**inputs).logits
        inference_ms = (time.perf_counter() - inference_start) * 1000.0

        probs = F.softmax(logits, dim=-1).squeeze().tolist()
        if isinstance(probs, float):
            probs = [probs, 1.0 - probs]

        probabilities = {LABEL_MAP[i]: round(probs[i], 6) for i in range(len(probs))}
        predicted_idx = int(torch.argmax(logits, dim=-1).item())
        prediction = LABEL_MAP[predicted_idx]
        probability = round(probs[predicted_idx], 6)
        total_ms = (time.perf_counter() - total_start) * 1000.0

        return ClassificationResult(
            prediction=prediction,
            probability=probability,
            probabilities=probabilities,
            model=self.get_model_name(),
            model_version=self.get_model_version(),
            model_status=self.get_model_status(),
            device=self._device,
            latency=LatencyBreakdown(
                preprocessing_ms=round(preprocessing_ms, 3),
                inference_ms=round(inference_ms, 3),
                total_ms=round(total_ms, 3),
            ),
        )

    def _tokenize(self, text: str) -> Dict[str, torch.Tensor]:
        with self._lock:
            encoded = self._tokenizer(
                text, max_length=MAX_TOKEN_LEN,
                truncation=True, padding="max_length", return_tensors="pt",
            )
        return {k: v.to(self._device) for k, v in encoded.items()}

    @property
    def cold_start_ms(self) -> float:
        return self._cold_start_ms
