"""
api/benchmark.py
=================
GET /api/benchmark  -  Run in-process benchmark on built-in dev samples.

This endpoint runs the benchmark on the built-in DEVELOPMENT test samples
(NOT a real evaluation dataset). It is for pipeline verification only.

To evaluate model quality properly, use:
    python -m evaluation.benchmark --csv data/eval_dataset.csv
"""

import time
import platform
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
import numpy as np

from ai.classifier.base import BaseClassifier
from ai.classifier.model_loader import get_classifier

router = APIRouter(prefix="/api", tags=["benchmark"])

# ---------------------------------------------------------------------------
# Development-only test samples (pipeline smoke test, NOT accuracy benchmark)
# ---------------------------------------------------------------------------
DEV_SAMPLES = [
    {"text": "Your KYC will expire today. Send the OTP immediately.", "label": "SCAM"},
    {"text": "Your bank account will be blocked today. Share OTP to complete KYC.", "label": "SCAM"},
    {"text": "Police department has issued a warrant against you. Pay Rs 5000 now.", "label": "SCAM"},
    {"text": "Your electricity connection will be disconnected today. Pay immediately.", "label": "SCAM"},
    {"text": "Congratulations! You have won a lottery prize of Rs 10 lakh. Call now.", "label": "SCAM"},
    {"text": "Your electricity bill of Rs 540 is due tomorrow.", "label": "SAFE"},
    {"text": "Your bank statement is now available in the official banking app.", "label": "SAFE"},
    {"text": "Your OTP for UPI transaction is 847291. Do not share with anyone.", "label": "SAFE"},
    {"text": "Your order has been dispatched and will arrive in 2-3 business days.", "label": "SAFE"},
    {"text": "Reminder: Annual health check-up scheduled for next Monday at 10 AM.", "label": "SAFE"},
]


class SampleResult(BaseModel):
    text: str
    true_label: str
    predicted_label: str
    confidence: float
    correct: bool
    inference_ms: float


class BenchmarkResponse(BaseModel):
    warning: str
    model: str
    model_status: str
    device: str
    hardware: str
    total_dev_samples: int
    correct: int
    dev_accuracy: float
    cold_start_ms: Optional[float]
    warm_mean_ms: float
    warm_p50_ms: float
    warm_p95_ms: float
    samples: List[SampleResult]


@router.get(
    "/benchmark",
    response_model=BenchmarkResponse,
    summary="Pipeline smoke test on built-in dev samples (NOT a real accuracy benchmark)",
)
def run_dev_benchmark(
    classifier: BaseClassifier = Depends(get_classifier),
):
    """
    Run inference on a small set of built-in development samples.

    WARNING: These are manually written dev examples, NOT a validated dataset.
    The accuracy reported here does NOT represent real scam-detection accuracy.
    Use POST /api/analyze for individual predictions.
    Use `python -m evaluation.benchmark --csv data/eval_dataset.csv` for real evaluation.
    """
    results = []
    latencies = []

    for sample in DEV_SAMPLES:
        result = classifier.predict(sample["text"])
        correct = result.prediction == sample["label"]
        latencies.append(result.latency.inference_ms)
        results.append(SampleResult(
            text=sample["text"][:80] + ("..." if len(sample["text"]) > 80 else ""),
            true_label=sample["label"],
            predicted_label=result.prediction,
            confidence=result.probability,
            correct=correct,
            inference_ms=result.latency.inference_ms,
        ))

    n_correct = sum(1 for r in results if r.correct)
    arr = np.array(latencies)

    cold_start = getattr(classifier, "cold_start_ms", None)

    return BenchmarkResponse(
        warning=(
            "DEV SAMPLES ONLY - Not a real accuracy benchmark. "
            "Model is 'prototype / requires fine-tuning'. "
            "Run evaluation.benchmark with a labeled dataset for real metrics."
        ),
        model=classifier.get_model_name(),
        model_status=classifier.get_model_status(),
        device=classifier.get_device(),
        hardware=f"{platform.processor()} | {classifier.get_device()}",
        total_dev_samples=len(DEV_SAMPLES),
        correct=n_correct,
        dev_accuracy=round(n_correct / len(DEV_SAMPLES), 4),
        cold_start_ms=round(cold_start, 1) if cold_start else None,
        warm_mean_ms=round(float(np.mean(arr)), 2),
        warm_p50_ms=round(float(np.percentile(arr, 50)), 2),
        warm_p95_ms=round(float(np.percentile(arr, 95)), 2),
        samples=results,
    )
