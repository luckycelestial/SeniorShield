"""
evaluation/metrics.py
======================
Classification metrics for SeniorShield benchmark.
All values come from actual model predictions on a labeled dataset.
Never hardcode or fabricate metrics.
"""

from dataclasses import dataclass, field
from typing import List, Optional
import numpy as np


@dataclass
class ClassificationMetrics:
    """Full metrics suite for one benchmark run."""
    # Dataset info
    dataset_name: str
    total_samples: int
    class_distribution: dict   # {"SAFE": N, "SCAM": N}

    # Core metrics
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1: Optional[float] = None
    false_positive_rate: Optional[float] = None
    pr_auc: Optional[float] = None

    # Confusion matrix [TN, FP, FN, TP]
    confusion_matrix: Optional[List[int]] = None

    # Latency stats (ms)
    cold_start_ms: Optional[float] = None
    mean_inference_ms: Optional[float] = None
    p50_inference_ms: Optional[float] = None
    p95_inference_ms: Optional[float] = None

    # Model info
    model: str = ""
    model_version: str = ""
    model_status: str = ""
    device: str = ""
    runs: int = 0


def compute_metrics(
    y_true: List[str],
    y_pred: List[str],
    y_prob_scam: List[float],
    latencies_ms: List[float],
    dataset_name: str,
    class_dist: dict,
    model_info: dict,
    cold_start_ms: float,
) -> ClassificationMetrics:
    """
    Compute full metrics from prediction lists.

    Args:
        y_true:        Ground-truth labels  ["SCAM", "SAFE", ...]
        y_pred:        Model predictions    ["SCAM", "SAFE", ...]
        y_prob_scam:   Softmax P(SCAM)      [0.93, 0.12, ...]
        latencies_ms:  Per-sample inference times in ms
        dataset_name:  Name of evaluation dataset
        class_dist:    {"SAFE": N, "SCAM": N}
        model_info:    dict with model/version/status/device keys
        cold_start_ms: Model load time
    """
    from sklearn.metrics import (
        accuracy_score,
        precision_score,
        recall_score,
        f1_score,
        confusion_matrix,
        average_precision_score,
    )

    # Convert labels to binary (SCAM=1, SAFE=0)
    label_to_int = {"SAFE": 0, "SCAM": 1}
    y_true_int = [label_to_int[l] for l in y_true]
    y_pred_int = [label_to_int[l] for l in y_pred]

    acc = accuracy_score(y_true_int, y_pred_int)
    prec = precision_score(y_true_int, y_pred_int, zero_division=0)
    rec = recall_score(y_true_int, y_pred_int, zero_division=0)
    f1 = f1_score(y_true_int, y_pred_int, zero_division=0)
    cm = confusion_matrix(y_true_int, y_pred_int, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0

    try:
        pr_auc = average_precision_score(y_true_int, y_prob_scam)
    except Exception:
        pr_auc = None

    arr = np.array(latencies_ms)
    mean_ms = float(np.mean(arr))
    p50_ms = float(np.percentile(arr, 50))
    p95_ms = float(np.percentile(arr, 95))

    return ClassificationMetrics(
        dataset_name=dataset_name,
        total_samples=len(y_true),
        class_distribution=class_dist,
        accuracy=round(acc, 4),
        precision=round(prec, 4),
        recall=round(rec, 4),
        f1=round(f1, 4),
        false_positive_rate=round(fpr, 4),
        pr_auc=round(pr_auc, 4) if pr_auc is not None else None,
        confusion_matrix=[int(tn), int(fp), int(fn), int(tp)],
        cold_start_ms=round(cold_start_ms, 2),
        mean_inference_ms=round(mean_ms, 2),
        p50_inference_ms=round(p50_ms, 2),
        p95_inference_ms=round(p95_ms, 2),
        model=model_info.get("model", ""),
        model_version=model_info.get("model_version", ""),
        model_status=model_info.get("model_status", ""),
        device=model_info.get("device", ""),
        runs=len(latencies_ms),
    )
