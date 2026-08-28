"""
evidence/builder.py
===================
Constructs a valid canonical EvidenceObject from classification, attribution, rules, threat intelligence, and entities.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime

from ai.classifier.base import ClassificationResult
from ai.classifier.attributor import AttributionResult
from rules.models import RuleEvidence
from threat_intelligence.models import ThreatIntelResult, ExtractedEntities
from evidence.schema import (
    EvidenceObject,
    ModelMetadata,
    PredictionDetails,
    ModelEvidence,
    FeatureAttribution,
    FaithfulnessCheck,
)


def build_evidence_object(
    source_text: str,
    class_result: ClassificationResult,
    attr_result: Optional[AttributionResult],
    rule_evidence: Optional[List[RuleEvidence]] = None,
    threat_intelligence: Optional[List[ThreatIntelResult]] = None,
    entities: Optional[ExtractedEntities] = None,
    top_k: int = 5,
) -> EvidenceObject:
    """
    Build structured canonical EvidenceObject consolidating all pipeline facts.
    """
    features = []
    faithfulness = None
    method = "none"
    explain_ms = 0.0

    if attr_result is not None:
        method = attr_result.method
        explain_ms = attr_result.explainability_ms
        features = [
            FeatureAttribution(
                token=f.token,
                contribution=f.contribution,
                direction=f.direction
            )
            for f in attr_result.top_features
        ]

        if attr_result.faithfulness_check:
            fc = attr_result.faithfulness_check
            faithfulness = FaithfulnessCheck(
                masked_token=fc.masked_token,
                original_probability=fc.original_probability,
                masked_probability=fc.masked_probability,
                probability_delta=fc.probability_delta
            )

    model_evidence = ModelEvidence(
        method=method,
        top_features=features,
        faithfulness_check=faithfulness
    )

    entities_dict = entities.model_dump() if entities and hasattr(entities, "model_dump") else (entities.dict() if entities else {})

    return EvidenceObject(
        model=ModelMetadata(
            name=class_result.model,
            version=class_result.model_version,
            status=class_result.model_status,
            preprocessing_version="v1.0"
        ),
        prediction=PredictionDetails(
            label=class_result.prediction,
            probability=class_result.probability,
            probabilities=class_result.probabilities
        ),
        attribution=model_evidence,
        evidence=model_evidence,
        source_text=source_text,
        rule_evidence=rule_evidence or [],
        threat_intelligence=threat_intelligence or [],
        entities=entities_dict,
        timestamp=datetime.utcnow().isoformat() + "Z",
        explainability_metadata={
            "top_k": top_k,
            "explainability_ms": explain_ms
        }
    )
