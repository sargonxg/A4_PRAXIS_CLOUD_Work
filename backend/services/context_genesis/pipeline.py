"""Pack 30 pipeline stage contract.

The heavy extraction libraries run in isolated Cloud Run workers. The main
backend owns orchestration, stage accounting, and review/firewall invariants.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


PipelineStageId = Literal[
    "fetch",
    "parse",
    "chunk",
    "recall_ner",
    "precision_extract",
    "firewall_write",
]


PIPELINE_STAGES: list[PipelineStageId] = [
    "fetch",
    "parse",
    "chunk",
    "recall_ner",
    "precision_extract",
    "firewall_write",
]


@dataclass(frozen=True)
class PipelineStage:
    id: PipelineStageId
    worker: str | None
    cost_ceiling_usd: float
    writes_directly: bool
    review_required: bool
    description: str
    writes: list[str] = field(default_factory=list)


STAGE_CONTRACTS: dict[PipelineStageId, PipelineStage] = {
    "fetch": PipelineStage("fetch", None, 0.01, False, False, "Fetch source document or upload reference."),
    "parse": PipelineStage("parse", "extract-docling", 0.05, False, False, "Parse to reading-order markdown and structural JSON."),
    "chunk": PipelineStage("chunk", None, 0.01, False, False, "Chunk parsed markdown on semantic and table boundaries."),
    "recall_ner": PipelineStage("recall_ner", "extract-ner-gliner", 0.01, False, True, "High-recall ontology-aware candidate span extraction."),
    "precision_extract": PipelineStage("precision_extract", None, 0.5, False, True, "Gemini verifies candidates and structures ACO assertions."),
    "firewall_write": PipelineStage(
        "firewall_write",
        None,
        0.01,
        True,
        True,
        "Symbolic firewall and two-phase write or review queue routing.",
        ["postgres_graph", "firestore_review_queue"],
    ),
}


@dataclass(frozen=True)
class PipelineRunPlan:
    case_id: str = ""
    source_uri: str = ""
    ontology_ids: list[str] = field(default_factory=list)
    stages: list[PipelineStage] = field(default_factory=lambda: [STAGE_CONTRACTS[stage] for stage in PIPELINE_STAGES])

    @property
    def total_cost_ceiling_usd(self) -> float:
        return round(sum(stage.cost_ceiling_usd for stage in self.stages), 2)

    def assert_invariants(self) -> None:
        ids = [stage.id for stage in self.stages]
        if ids != PIPELINE_STAGES:
            raise ValueError(f"Pipeline stage order drifted: {ids}")
        for stage in self.stages:
            if stage.worker in {"extract-docling", "extract-ner-gliner", "extract-graphrag"} and stage.writes_directly:
                raise ValueError(f"{stage.worker} must not write directly to graph stores")
        if not STAGE_CONTRACTS["firewall_write"].writes_directly:
            raise ValueError("firewall_write must remain the only direct write stage")


def default_pipeline_plan(case_id: str = "", source_uri: str = "", ontology_ids: list[str] | None = None) -> PipelineRunPlan:
    plan = PipelineRunPlan(case_id=case_id, source_uri=source_uri, ontology_ids=ontology_ids or [])
    plan.assert_invariants()
    return plan
