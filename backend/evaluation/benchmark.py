"""
evaluation/benchmark.py
========================
Benchmark runner for the SeniorShield DistilBERT classifier.

Usage:
    cd backend
    python -m evaluation.benchmark --csv data/eval_dataset.csv --runs 100

CSV format required:
    text,label
    "Your KYC will expire today. Send OTP.",SCAM
    "Your electricity bill is due tomorrow.",SAFE

IMPORTANT:
  - All metrics come from actual model inference on the provided dataset.
  - Do NOT interpret results as production accuracy until the model is
    fine-tuned on real scam data.
  - Dataset info is printed in the benchmark report.
"""

import argparse
import json
import platform
import sys
import time
from pathlib import Path
from collections import Counter

import pandas as pd


def run_benchmark(csv_path: str, runs: int = 100) -> dict:
    """
    Run full benchmark on a labeled CSV dataset.

    Args:
        csv_path: Path to CSV with columns: text, label
        runs:     Number of warm inference repetitions for latency stats

    Returns:
        Dictionary with all metrics (serialisable to JSON).
    """
    # --- Load dataset ---
    df = pd.read_csv(csv_path)
    required_cols = {"text", "label"}
    if not required_cols.issubset(df.columns):
        raise ValueError(f"CSV must have columns: {required_cols}. Got: {list(df.columns)}")

    df = df.dropna(subset=["text", "label"])
    df["label"] = df["label"].str.upper().str.strip()
    valid_labels = {"SAFE", "SCAM"}
    df = df[df["label"].isin(valid_labels)].reset_index(drop=True)

    if len(df) == 0:
        raise ValueError("No valid rows after filtering. Labels must be SAFE or SCAM.")

    total = len(df)
    class_dist = dict(Counter(df["label"].tolist()))
    print(f"\n[Benchmark] Dataset: {csv_path}")
    print(f"[Benchmark] Total samples: {total}")
    print(f"[Benchmark] Class distribution: {class_dist}")

    # --- Load classifier ---
    print("\n[Benchmark] Loading classifier...")
    from ai.classifier.model_loader import load_classifier
    classifier = load_classifier()
    cold_start_ms = getattr(classifier, "cold_start_ms", None)
    print(f"[Benchmark] Cold start: {cold_start_ms:.1f} ms" if cold_start_ms else "[Benchmark] Cold start: unknown")

    # --- Full dataset inference ---
    print(f"\n[Benchmark] Running inference on {total} samples...")
    y_true, y_pred, y_prob_scam, latencies = [], [], [], []

    for i, row in df.iterrows():
        result = classifier.predict(str(row["text"]))
        y_true.append(row["label"])
        y_pred.append(result.prediction)
        y_prob_scam.append(result.probabilities.get("SCAM", 0.0))
        latencies.append(result.latency.inference_ms)
        if (i + 1) % 20 == 0:
            print(f"  ... {i+1}/{total}")

    # --- Warm latency benchmark ---
    print(f"\n[Benchmark] Warm latency runs: {runs}")
    sample_text = df.iloc[0]["text"]
    warm_latencies = []
    for _ in range(runs):
        r = classifier.predict(str(sample_text))
        warm_latencies.append(r.latency.inference_ms)

    import numpy as np
    mean_ms = float(np.mean(warm_latencies))
    p50_ms = float(np.percentile(warm_latencies, 50))
    p95_ms = float(np.percentile(warm_latencies, 95))

    # --- Compute quality metrics ---
    from evaluation.metrics import compute_metrics
    metrics = compute_metrics(
        y_true=y_true,
        y_pred=y_pred,
        y_prob_scam=y_prob_scam,
        latencies_ms=latencies,
        dataset_name=Path(csv_path).name,
        class_dist=class_dist,
        model_info={
            "model": classifier.get_model_name(),
            "model_version": classifier.get_model_version(),
            "model_status": classifier.get_model_status(),
            "device": classifier.get_device(),
        },
        cold_start_ms=cold_start_ms or 0.0,
    )

    # Build output dict
    result_dict = {
        "benchmark_metadata": {
            "dataset": Path(csv_path).name,
            "total_samples": total,
            "class_distribution": class_dist,
            "hardware": {
                "platform": platform.platform(),
                "processor": platform.processor(),
                "python": platform.python_version(),
                "device": classifier.get_device(),
            },
        },
        "model": {
            "name": metrics.model,
            "version": metrics.model_version,
            "status": metrics.model_status,
        },
        "model_quality": {
            "accuracy": metrics.accuracy,
            "precision": metrics.precision,
            "recall": metrics.recall,
            "f1": metrics.f1,
            "false_positive_rate": metrics.false_positive_rate,
            "pr_auc": metrics.pr_auc,
            "confusion_matrix": {
                "TN": metrics.confusion_matrix[0] if metrics.confusion_matrix else None,
                "FP": metrics.confusion_matrix[1] if metrics.confusion_matrix else None,
                "FN": metrics.confusion_matrix[2] if metrics.confusion_matrix else None,
                "TP": metrics.confusion_matrix[3] if metrics.confusion_matrix else None,
            },
        },
        "latency": {
            "cold_start_ms": metrics.cold_start_ms,
            "dataset_mean_inference_ms": round(float(np.mean(latencies)), 2),
            "dataset_p50_ms": round(float(np.percentile(latencies, 50)), 2),
            "dataset_p95_ms": round(float(np.percentile(latencies, 95)), 2),
            "warm_runs": runs,
            "warm_mean_ms": round(mean_ms, 2),
            "warm_p50_ms": round(p50_ms, 2),
            "warm_p95_ms": round(p95_ms, 2),
        },
    }

    return result_dict


def print_report(result: dict) -> None:
    print("\n" + "=" * 60)
    print("  SENIORPHIELD AI BENCHMARK REPORT")
    print("=" * 60)
    m = result["model"]
    print(f"\nModel:   {m['name']}  ({m['version']})")
    print(f"Status:  {m['status']}")
    hw = result["benchmark_metadata"]["hardware"]
    print(f"Device:  {hw['device']}  |  {hw['platform']}")

    print(f"\nDataset: {result['benchmark_metadata']['dataset']}")
    print(f"Samples: {result['benchmark_metadata']['total_samples']}")
    print(f"Dist:    {result['benchmark_metadata']['class_distribution']}")

    q = result["model_quality"]
    print("\n--- MODEL QUALITY ---")
    for k, v in q.items():
        if k != "confusion_matrix":
            pct = f"{v*100:.2f}%" if isinstance(v, float) else str(v)
            print(f"  {k:<22} {pct}")
    cm = q["confusion_matrix"]
    print(f"\n  Confusion Matrix:")
    print(f"    TN={cm['TN']}  FP={cm['FP']}")
    print(f"    FN={cm['FN']}  TP={cm['TP']}")

    lat = result["latency"]
    print("\n--- LATENCY ---")
    print(f"  Cold start           {lat['cold_start_ms']:.1f} ms")
    print(f"  Warm mean            {lat['warm_mean_ms']:.1f} ms")
    print(f"  Warm P50             {lat['warm_p50_ms']:.1f} ms")
    print(f"  Warm P95             {lat['warm_p95_ms']:.1f} ms")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SeniorShield DistilBERT Benchmark")
    parser.add_argument("--csv", required=True, help="Path to labeled CSV (text,label)")
    parser.add_argument("--runs", type=int, default=100, help="Warm latency repetitions")
    parser.add_argument("--output", default=None, help="Optional JSON output path")
    args = parser.parse_args()

    try:
        results = run_benchmark(args.csv, args.runs)
        print_report(results)

        if args.output:
            with open(args.output, "w") as f:
                json.dump(results, f, indent=2)
            print(f"\n[Benchmark] Results saved to: {args.output}")

        # Also expose as JSON on stdout for API use
        print("\n[JSON OUTPUT]")
        print(json.dumps(results, indent=2))

    except Exception as e:
        print(f"[Benchmark] ERROR: {e}", file=sys.stderr)
        sys.exit(1)
