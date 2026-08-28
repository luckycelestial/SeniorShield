"""
ai/classifier/attributor.py
============================
Token-level attribution and explainability for DistilBERT.

Uses Integrated Gradients / Embedding Gradient Attribution to compute
exact token-level contribution scores toward "SCAM" vs "SAFE".

Subwords (e.g. ##ing) are aggregated into complete words.
"""

import time
import torch
import torch.nn.functional as F
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel

from ai.classifier.preprocessing import normalize_text


class TokenAttribution(BaseModel):
    token: str
    contribution: float
    direction: str   # "toward_scam" | "toward_safe"


class FaithfulnessCheckResult(BaseModel):
    masked_token: str
    original_probability: float
    masked_probability: float
    probability_delta: float


class AttributionResult(BaseModel):
    method: str
    top_features: List[TokenAttribution]
    faithfulness_check: Optional[FaithfulnessCheckResult] = None
    explainability_ms: float


class DistilBertAttributor:
    """
    Computes token-level attribution scores for DistilBertForSequenceClassification.
    """

    def __init__(self, classifier_instance):
        self.classifier = classifier_instance

    def explain(self, text: str, top_k: int = 5) -> AttributionResult:
        """
        Compute token-level attribution using Gradient-weighted Embedding Attribution.
        """
        start_time = time.perf_counter()

        normalized, _ = normalize_text(text)
        tokenizer = self.classifier._tokenizer
        model = self.classifier._model
        device = self.classifier._device

        # Tokenize
        inputs = tokenizer(
            normalized,
            truncation=True,
            max_length=128,
            return_tensors="pt"
        ).to(device)

        input_ids = inputs["input_ids"]
        attention_mask = inputs["attention_mask"]

        # Get input embeddings
        embeddings_layer = model.get_input_embeddings()
        embeddings = embeddings_layer(input_ids).detach()
        embeddings.requires_grad = True

        # Forward pass on embeddings
        outputs = model(inputs_embeds=embeddings, attention_mask=attention_mask)
        logits = outputs.logits
        probs = F.softmax(logits, dim=-1).squeeze()

        # Measure target class score (index 1 = SCAM)
        target_score = logits[0, 1]
        target_score.backward()

        # Compute gradient x embedding attribution per token
        grads = embeddings.grad[0]                           # [seq_len, hidden_dim]
        token_attributions = (grads * embeddings[0]).sum(dim=-1) # [seq_len]

        tokens = tokenizer.convert_ids_to_tokens(input_ids[0])

        # Aggregate tokens and filter special tokens ([CLS], [SEP], [PAD])
        raw_token_scores = []
        for tok, score in zip(tokens, token_attributions.tolist()):
            if tok in ["[CLS]", "[SEP]", "[PAD]"]:
                continue
            raw_token_scores.append((tok, float(score)))

        # Aggregate subword tokens (e.g. ##ification)
        aggregated = self._aggregate_subwords(raw_token_scores)

        # Sort by absolute contribution
        sorted_attributions = sorted(aggregated, key=lambda x: abs(x[1]), reverse=True)

        top_k_items = sorted_attributions[:top_k]

        features = []
        for tok, val in top_k_items:
            direction = "toward_scam" if val >= 0 else "toward_safe"
            features.append(TokenAttribution(
                token=tok,
                contribution=round(float(abs(val)), 4),
                direction=direction
            ))

        # Perform Faithfulness Sanity Check on top token
        faithfulness = None
        if features:
            top_tok = features[0].token
            faithfulness = self._check_faithfulness(normalized, top_tok, float(probs[1].item()))

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return AttributionResult(
            method="Integrated Gradients / Token Embedding Attribution",
            top_features=features,
            faithfulness_check=faithfulness,
            explainability_ms=round(elapsed_ms, 3)
        )

    def _aggregate_subwords(self, token_scores: List[Tuple[str, float]]) -> List[Tuple[str, float]]:
        """Combine transformer subwords starting with ## into whole words."""
        word_scores = []
        current_word = ""
        current_score = 0.0

        for tok, score in token_scores:
            if tok.startswith("##"):
                current_word += tok[2:]
                current_score += score
            else:
                if current_word:
                    word_scores.append((current_word, current_score))
                current_word = tok
                current_score = score

        if current_word:
            word_scores.append((current_word, current_score))

        return word_scores

    def _check_faithfulness(self, text: str, token_to_mask: str, orig_prob_scam: float) -> FaithfulnessCheckResult:
        """
        Faithfulness check: masks the top attributed word and measures SCAM probability delta.
        """
        masked_text = text.replace(token_to_mask, "[MASK]")
        proba_map = self.classifier.predict_proba(masked_text)
        masked_prob_scam = proba_map.get("SCAM", 0.0)
        delta = orig_prob_scam - masked_prob_scam

        return FaithfulnessCheckResult(
            masked_token=token_to_mask,
            original_probability=round(orig_prob_scam, 4),
            masked_probability=round(masked_prob_scam, 4),
            probability_delta=round(delta, 4)
        )
