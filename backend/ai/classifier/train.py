"""
ai/classifier/train.py
======================
Fine-tuning pipeline for SeniorShield DistilBERT binary scam classifier.

Usage:
    cd backend
    python -m ai.classifier.train --data data/scam_dataset.csv --epochs 5 --output models/distilbert-scam-v1
"""

import argparse
import os
import time
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification, AdamW, get_linear_schedule_with_warmup
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

from ai.classifier.preprocessing import normalize_text

LABEL_MAP = {"SAFE": 0, "SCAM": 1}
ID_TO_LABEL = {0: "SAFE", 1: "SCAM"}

class ScamDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        normalized, _ = normalize_text(text)
        label = self.labels[idx]

        encoding = self.tokenizer(
            normalized,
            truncation=True,
            padding="max_length",
            max_length=self.max_len,
            return_tensors="pt"
        )

        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "label": torch.tensor(label, dtype=torch.long)
        }

def train_model(data_path: str, epochs: int = 5, batch_size: int = 16, lr: float = 3e-5, output_dir: str = "models/distilbert-scam-v1"):
    print("=" * 60)
    print("  SENIORSHIELD DISTILBERT FINE-TUNING PIPELINE")
    print("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Train] Device: {device}")

    # Load dataset
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    df = pd.read_csv(data_path).dropna(subset=["text", "label"])
    df["label"] = df["label"].str.upper().str.strip()
    df = df[df["label"].isin(LABEL_MAP.keys())].reset_index(drop=True)
    df["target"] = df["label"].map(LABEL_MAP)

    print(f"[Train] Total samples: {len(df)}")
    print(f"[Train] Class distribution: {dict(df['label'].value_counts())}")

    # Train / val split (80/20 stratified)
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        df["text"].tolist(),
        df["target"].tolist(),
        test_size=0.2,
        random_state=42,
        stratify=df["target"].tolist()
    )

    print(f"[Train] Train samples: {len(train_texts)} | Val samples: {len(val_texts)}")

    # Load pretrained backbone
    tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")
    model = DistilBertForSequenceClassification.from_pretrained(
        "distilbert-base-uncased",
        num_labels=2
    )
    model.to(device)

    # DataLoaders
    train_ds = ScamDataset(train_texts, train_labels, tokenizer)
    val_ds = ScamDataset(val_texts, val_labels, tokenizer)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)

    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(optimizer, num_warmup_steps=int(total_steps*0.1), num_training_steps=total_steps)

    print(f"\n[Train] Starting training for {epochs} epochs...")
    start_time = time.time()

    for epoch in range(epochs):
        model.train()
        total_loss = 0.0

        for batch in train_loader:
            optimizer.zero_grad()
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["label"].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            loss = outputs.loss
            loss.backward()

            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            scheduler.step()

            total_loss += loss.item()

        avg_loss = total_loss / len(train_loader)

        # Validation
        model.eval()
        val_preds, val_targets = [], []
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["label"].to(device)

                logits = model(input_ids=input_ids, attention_mask=attention_mask).logits
                preds = torch.argmax(logits, dim=-1)

                val_preds.extend(preds.cpu().tolist())
                val_targets.extend(labels.cpu().tolist())

        acc = accuracy_score(val_targets, val_preds)
        prec, rec, f1, _ = precision_recall_fscore_support(val_targets, val_preds, average="binary", zero_division=0)

        print(f"Epoch {epoch+1}/{epochs} | Train Loss: {avg_loss:.4f} | Val Acc: {acc*100:.1f}% | Precision: {prec*100:.1f}% | Recall: {rec*100:.1f}% | F1: {f1*100:.1f}%")

    elapsed = time.time() - start_time
    print(f"\n[Train] Training complete in {elapsed:.1f}s")

    # Save model and tokenizer
    os.makedirs(output_dir, exist_ok=True)
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)

    # Save status flag in directory
    with open(os.path.join(output_dir, "model_status.txt"), "w") as f:
        f.write("fine-tuned on SeniorShield-SMS-v1")

    print(f"[Train] Model saved successfully to: {output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune DistilBERT for SeniorShield Scam Classification")
    parser.add_argument("--data", default="data/scam_dataset.csv", help="Path to CSV dataset")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=3e-5, help="Learning rate")
    parser.add_argument("--output", default="models/distilbert-scam-v1", help="Output directory for fine-tuned weights")
    args = parser.parse_args()

    train_model(
        data_path=args.data,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        output_dir=args.output
    )

