from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class TruthLayer(str, Enum):
    source = "source"
    claim = "claim"
    evidence = "evidence"
    verdict = "verdict"


class ProvenanceSpan(BaseModel):
    start: int = Field(ge=0)
    end: int = Field(ge=0)

    @model_validator(mode="after")
    def end_must_follow_start(self) -> "ProvenanceSpan":
        if self.end < self.start:
            raise ValueError("span.end must be greater than or equal to span.start")
        return self


class ProvenanceRef(BaseModel):
    sourceId: str = Field(min_length=1)
    span: ProvenanceSpan | None = None
    retrievedAt: str = Field(min_length=1)
    retriever: Literal[
        "analyst",
        "gdelt",
        "ucdp",
        "reliefweb",
        "hdx",
        "unhcr",
        "un-news",
        "world-bank",
        "google-grounded",
        "private-corpus",
    ] | None = None


class TruthLayerNode(BaseModel):
    id: str = Field(min_length=1)
    caseId: str = Field(min_length=1)
    ownerUid: str = Field(min_length=1)
    layer: TruthLayer
    confidence: float = Field(ge=0, le=1)
    provenance: list[ProvenanceRef] = Field(default_factory=list)
    validFrom: str = Field(min_length=1)
    validTo: str | None = None
    assertedFrom: str = Field(min_length=1)
    assertedTo: str | None = None

    @field_validator("validTo", "assertedTo")
    @classmethod
    def empty_string_as_none(cls, value: str | None) -> str | None:
        return value or None

    @model_validator(mode="after")
    def temporal_bounds_must_be_ordered(self) -> "TruthLayerNode":
        if self.validTo and self.validFrom > self.validTo:
            raise ValueError("validFrom must be less than or equal to validTo")
        if self.assertedTo and self.assertedFrom > self.assertedTo:
            raise ValueError("assertedFrom must be less than or equal to assertedTo")
        return self


KIND_TO_TRUTH_LAYER: dict[str, TruthLayer] = {
    "source": TruthLayer.source,
    "actor": TruthLayer.claim,
    "event": TruthLayer.claim,
    "claim": TruthLayer.claim,
    "narrative": TruthLayer.claim,
    "interest": TruthLayer.evidence,
    "constraint": TruthLayer.evidence,
    "leverage": TruthLayer.evidence,
    "commitment": TruthLayer.verdict,
    "verdict": TruthLayer.verdict,
}


def infer_truth_layer(kind: str | None) -> TruthLayer:
    if not kind:
        return TruthLayer.claim
    return KIND_TO_TRUTH_LAYER.get(kind, TruthLayer.claim)
