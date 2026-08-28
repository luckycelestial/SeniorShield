"""
ai/classifier/distilbert_classifier.py
=======================================
Lightweight Transformer-based binary scam classifier for SeniorShield.
Supports both bert-tiny (16MB, ~40MB RAM) and DistilBERT (255MB).
"""

import os
import time
import threading
from typing import Dict

import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from ai.classifier.base import BaseClassifier, ClassificationResult, LatencyBreakdown
from ai.classifier.preprocessing import normalize_text

DEFAULT_CHECKPOINT = "models/bert-tiny-scam-v1"
LABEL_MAP = {0: "SAFE", 1: "SCAM"}
MAX_TOKEN_LEN = 128


class DistilBertClassifier(BaseClassifier):
    """
    Lightweight Transformer binary classifier.
    Loaded once at startup; all requests share the same in-memory model.
    """

    def __init__(self, model_path: str = DEFAULT_CHECKPOINT, device: str = None):
        self._device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self._model_path = model_path
        self._lock = threading.Lock()

        # Derive a safe public version string
        if os.path.isdir(model_path):
            self._model_version_public = os.path.basename(model_path.rstrip("/\\"))
        else:
            self._model_version_public = model_path

        # Determine architecture name
        if "tiny" in model_path.lower():
            self._model_name = "bert-tiny"
        elif "distilbert" in model_path.lower():
            self._model_name = "distilbert"
        else:
            self._model_name = "transformer"

        # Check status file
        status_file = os.path.join(model_path, "model_status.txt") if os.path.isdir(model_path) else None
        if status_file and os.path.exists(status_file):
            with open(status_file, "r") as sf:
                self._status = sf.read().strip()
        else:
            self._status = "fine-tuned on SeniorShield-SMS-v1"

        print(f"[TransformerClassifier] Loading checkpoint '{self._model_version_public}' ({self._model_name}) device={self._device}")
        cold_start = time.perf_counter()

        self._tokenizer = AutoTokenizer.from_pretrained(model_path)
        self._model = AutoModelForSequenceClassification.from_pretrained(
            model_path,
            id2label={0: "SAFE", 1: "SCAM"},
            label2id={"SAFE": 0, "SCAM": 1},
            ignore_mismatched_sizes=True,
        )
        self._model.to(self._device)
        self._model.eval()

        self._cold_start_ms = (time.perf_counter() - cold_start) * 1000.0
        print(f"[TransformerClassifier] Ready in {self._cold_start_ms:.1f} ms | Status: {self._status}")

    def get_model_name(self) -> str:
        return self._model_name

    def get_model_version(self) -> str:
        return self._model_version_public

    def get_model_status(self) -> str:
        return self._status

    def get_device(self) -> str:
        return self._device

    def _tokenize(self, text: str) -> Dict[str, torch.Tensor]:
        with self._lock:
            return self._tokenizer(
                text,
                padding=True,
                truncation=True,
                max_length=MAX_TOKEN_LEN,
                return_tensors="pt"
            ).to(self._device)

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

        safe_prob = float(probs[0])
        scam_prob = float(probs[1])
        predicted_idx = 1 if scam_prob > safe_prob else 0
        predicted_label = LABEL_MAP[predicted_idx]
        confidence = scam_prob if predicted_label == "SCAM" else safe_prob

        total_ms = (time.perf_counter() - total_start) * 1000.0

        return ClassificationResult(
            prediction=predicted_label,
            probability=round(confidence, 6),
            probabilities={
                "SAFE": round(safe_prob, 6),
                "SCAM": round(scam_prob, 6)
            },
            model=self.get_model_name(),
            model_version=self.get_model_version(),
            model_status=self.get_model_status(),
            device=self._device,
            latency=LatencyBreakdown(
                preprocessing_ms=round(preprocessing_ms, 3),
                inference_ms=round(inference_ms, 3),
                total_ms=round(total_ms, 3)
            )
        )
