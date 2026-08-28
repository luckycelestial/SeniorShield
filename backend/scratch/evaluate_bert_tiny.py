"""
scratch/evaluate_bert_tiny.py
=============================
Rigorous ML Validation & Latency/Memory Benchmarking for bert-tiny-scam-v1.
"""

import os
import sys
import time
import psutil
import numpy as np
import pandas as pd
import torch
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    precision_recall_curve,
    auc,
)

# Set base path
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)

from ai.classifier.distilbert_classifier import DistilBertClassifier
from ai.classifier.attributor import DistilBertAttributor
from rules.engine import RuleEngine
from threat_intelligence.service import ThreatIntelligenceService
from evidence.builder import build_evidence_object
from ai.llm.groq_service import GroqService

process = psutil.Process(os.getpid())

print("=" * 60)
print("1. MEMORY BENCHMARK: STEP-BY-STEP (RAM RSS)")
print("=" * 60)

mem_base = process.memory_info().rss / (1024 * 1024)
print(f"  [1] Base Python/Process RSS:          {mem_base:.2f} MB")

# Load model
t_cold_start = time.perf_counter()
model_path = os.path.join(base_dir, "models", "bert-tiny-scam-v1")
classifier = DistilBertClassifier(model_path=model_path, device="cpu")
cold_start_ms = (time.perf_counter() - t_cold_start) * 1000.0

mem_after_model = process.memory_info().rss / (1024 * 1024)
print(f"  [2] After bert-tiny Loaded RSS:       {mem_after_model:.2f} MB (Delta: +{mem_after_model - mem_base:.2f} MB)")
print(f"  [3] Cold-start Model Load Latency:    {cold_start_ms:.2f} ms")

# Inference
sample_text = "Your KYC will expire today. Share your OTP immediately."
res = classifier.predict(sample_text)
mem_after_infer = process.memory_info().rss / (1024 * 1024)
print(f"  [4] After Single ML Inference RSS:    {mem_after_infer:.2f} MB (Delta: +{mem_after_infer - mem_after_model:.2f} MB)")

# Explainability
attributor = DistilBertAttributor(classifier)
attr_res = attributor.explain(sample_text, top_k=5)
mem_after_xai = process.memory_info().rss / (1024 * 1024)
print(f"  [5] After Explainability (XAI) RSS:   {mem_after_xai:.2f} MB (Delta: +{mem_after_xai - mem_after_infer:.2f} MB)")

# Complete Pipeline Execution
rule_engine = RuleEngine()
ti_service = ThreatIntelligenceService()
groq_service = GroqService()

rule_res = rule_engine.evaluate(sample_text)
ti_res = ti_service.analyze_text(sample_text)
ev_obj = build_evidence_object(
    source_text=sample_text,
    class_result=res,
    attr_result=attr_res,
    rule_evidence=rule_res.rule_evidence,
    threat_intelligence=ti_res.results,
    entities=ti_res.entities,
)
groq_out, status, groq_ms = groq_service.generate_explanation(evidence=ev_obj, disable_llm=True)

mem_peak = process.memory_info().rss / (1024 * 1024)
print(f"  [6] Peak Process RAM:                 {mem_peak:.2f} MB")
print(f"  --> RENDER 512 MB HEADROOM:           {512 - mem_peak:.2f} MB free ({((512 - mem_peak)/512)*100:.1f}% free)")

print("\n" + "=" * 60)
print("2. ML VALIDATION: HELD-OUT TEST SET (test_set.csv)")
print("=" * 60)

test_df = pd.read_csv(os.path.join(base_dir, "data", "test_set.csv"))
label_map = {"SAFE": 0, "SCAM": 1}
y_true = test_df["label"].map(label_map).tolist()

y_pred = []
y_probs = []

for text in test_df["text"]:
    pred_res = classifier.predict(text)
    pred_label = 1 if pred_res.prediction == "SCAM" else 0
    scam_prob = pred_res.probabilities["SCAM"]
    y_pred.append(pred_label)
    y_probs.append(scam_prob)

acc = accuracy_score(y_true, y_pred)
prec = precision_score(y_true, y_pred, zero_division=0)
rec = recall_score(y_true, y_pred, zero_division=0)
f1 = f1_score(y_true, y_pred, zero_division=0)

cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
tn, fp, fn, tp = cm.ravel()

fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0

precisions, recalls, _ = precision_recall_curve(y_true, y_probs)
pr_auc = auc(recalls, precisions)

print(f"  Model Evaluated:        bert-tiny-scam-v1")
print(f"  Dataset:                data/test_set.csv ({len(test_df)} samples)")
print(f"  Accuracy:               {acc * 100:.2f}%")
print(f"  Precision:              {prec * 100:.2f}%")
print(f"  Recall:                 {rec * 100:.2f}%")
print(f"  F1 Score:               {f1 * 100:.2f}%")
print(f"  False Positive Rate:    {fpr * 100:.2f}%")
print(f"  False Negative Rate:    {fnr * 100:.2f}%")
print(f"  PR-AUC:                 {pr_auc:.4f}")
print(f"  Confusion Matrix:       TP={tp}, TN={tn}, FP={fp}, FN={fn}")
print(f"                          [[TN={tn}, FP={fp}], [FN={fn}, TP={tp}]]")

print("\n" + "=" * 60)
print("3. ML VALIDATION: VALIDATION SET (val_set.csv)")
print("=" * 60)

val_df = pd.read_csv(os.path.join(base_dir, "data", "val_set.csv"))
y_true_v = val_df["label"].map(label_map).tolist()
y_pred_v = []
y_probs_v = []

for text in val_df["text"]:
    pred_res = classifier.predict(text)
    y_pred_v.append(1 if pred_res.prediction == "SCAM" else 0)
    y_probs_v.append(pred_res.probabilities["SCAM"])

acc_v = accuracy_score(y_true_v, y_pred_v)
prec_v = precision_score(y_true_v, y_pred_v, zero_division=0)
rec_v = recall_score(y_true_v, y_pred_v, zero_division=0)
f1_v = f1_score(y_true_v, y_pred_v, zero_division=0)
cm_v = confusion_matrix(y_true_v, y_pred_v, labels=[0, 1])
tn_v, fp_v, fn_v, tp_v = cm_v.ravel()
fpr_v = fp_v / (fp_v + tn_v) if (fp_v + tn_v) > 0 else 0.0

print(f"  Validation Accuracy:    {acc_v * 100:.2f}%")
print(f"  Validation Precision:   {prec_v * 100:.2f}%")
print(f"  Validation Recall:      {rec_v * 100:.2f}%")
print(f"  Validation F1 Score:    {f1_v * 100:.2f}%")
print(f"  Validation FPR:         {fpr_v * 100:.2f}%")
print(f"  Validation Matrix:      TP={tp_v}, TN={tn_v}, FP={fp_v}, FN={fn_v}")

print("\n" + "=" * 60)
print("4. LATENCY BENCHMARK: MODEL INFERENCE (100 Runs)")
print("=" * 60)

latencies = []
for _ in range(100):
    t0 = time.perf_counter()
    classifier.predict(sample_text)
    latencies.append((time.perf_counter() - t0) * 1000.0)

latencies = np.array(latencies)
print(f"  Inference Runs:         100")
print(f"  Min Latency:            {np.min(latencies):.2f} ms")
print(f"  Max Latency:            {np.max(latencies):.2f} ms")
print(f"  Mean Latency:           {np.mean(latencies):.2f} ms")
print(f"  P50 (Median):           {np.percentile(latencies, 50):.2f} ms")
print(f"  P95 Latency:            {np.percentile(latencies, 95):.2f} ms")

print("\n" + "=" * 60)
print("5. COMPLETE API ENDPOINT LATENCY BREAKDOWN (POST /api/analyze)")
print("=" * 60)

# Measure explainability
t_xai = time.perf_counter()
attr_out = attributor.explain(sample_text, top_k=5)
xai_ms = (time.perf_counter() - t_xai) * 1000.0

# Measure rules
t_rules = time.perf_counter()
r_out = rule_engine.evaluate(sample_text)
rules_ms = (time.perf_counter() - t_rules) * 1000.0

# Measure TI
t_ti = time.perf_counter()
ti_out = ti_service.analyze_text(sample_text)
ti_ms = (time.perf_counter() - t_ti) * 1000.0

# Preprocessing & Inference
t_inf = time.perf_counter()
inf_out = classifier.predict(sample_text)
inf_ms = (time.perf_counter() - t_inf) * 1000.0

# Evidence build
t_ev = time.perf_counter()
ev_out = build_evidence_object(
    source_text=sample_text,
    class_result=inf_out,
    attr_result=attr_out,
    rule_evidence=r_out.rule_evidence,
    threat_intelligence=ti_out.results,
    entities=ti_out.entities,
)
ev_ms = (time.perf_counter() - t_ev) * 1000.0

print(f"  1. Preprocessing Latency:       {inf_out.latency.preprocessing_ms:.3f} ms")
print(f"  2. ML Inference (bert-tiny):    {inf_out.latency.inference_ms:.3f} ms")
print(f"  3. Explainability (XAI):        {xai_ms:.3f} ms")
print(f"  4. Rule-Based Engine:           {rules_ms:.3f} ms")
print(f"  5. Threat Intelligence:         {ti_ms:.3f} ms")
print(f"  6. Evidence Generation:         {ev_ms:.3f} ms")
print(f"  7. LLM Generation (Groq/FB):    {groq_ms:.3f} ms")
total_pipeline_ms = (
    inf_out.latency.preprocessing_ms
    + inf_out.latency.inference_ms
    + xai_ms
    + rules_ms
    + ti_ms
    + ev_ms
    + groq_ms
)
print(f"  --------------------------------------------------")
print(f"  TOTAL END-TO-END LATENCY:       {total_pipeline_ms:.3f} ms")
print("=" * 60)
