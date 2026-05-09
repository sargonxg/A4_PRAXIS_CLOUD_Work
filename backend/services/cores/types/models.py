"""Pydantic models for the PRAXIS v7 Context Core contract."""

from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


CoreKind = Literal[
    "praxis",
    "user",
    "team",
    "situation",
    "source",
    "document",
    "graph",
    "output",
]
CoreStatus = Literal["active", "archived", "locked"]
TruthLayer = Literal["Source", "Claim", "Evidence", "Verdict"]
Primitive = Literal[
    "Actor",
    "Claim",
    "Interest",
    "Constraint",
    "Leverage",
    "Commitment",
    "Event",
    "Narrative",
]

CORE_KINDS: tuple[CoreKind, ...] = (
    "praxis",
    "user",
    "team",
    "situation",
    "source",
    "document",
    "graph",
    "output",
)


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class OntologyRef(StrictModel):
    id: str = Field(min_length=1)
    version: str | None = None


class SkillRef(StrictModel):
    id: str = Field(min_length=1)
    version: str | None = None


SubagentRef = SkillRef


class PraxisDefaultModels(StrictModel):
    quick: str = Field(min_length=1)
    deep: str = Field(min_length=1)
    memo: str = Field(min_length=1)


class PraxisCoreMetadata(StrictModel):
    name: str = Field(min_length=1)
    version: str = Field(min_length=1)
    tools: list[SkillRef]
    subagents: list[SubagentRef]
    truth_layers: list[TruthLayer]
    primitives: list[Primitive]
    ontologies: list[OntologyRef]
    default_models: PraxisDefaultModels
    routing_rules: list[dict[str, Any]] = Field(default_factory=list)


class UserStyle(StrictModel):
    formality: Literal["formal", "plain", "casual"]
    citation_density: Literal["high", "medium", "low"]
    structure_preference: Literal["narrative", "bulleted", "mixed"]


class UserModelPrefs(StrictModel):
    quick_model: str | None = None
    deep_model: str | None = None
    cost_ceiling_per_thread_usd: float | None = Field(default=None, ge=0)


class UserCoreMetadata(StrictModel):
    name: str = Field(min_length=1)
    role: str = Field(min_length=1)
    mandate: str | None = None
    language: str = Field(min_length=2)
    jurisdiction: str | None = None
    style: UserStyle
    model_prefs: UserModelPrefs = Field(default_factory=UserModelPrefs)
    default_attached_cores: list[UUID] = Field(default_factory=list)
    saved_situations: list[UUID] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


class TeamMember(StrictModel):
    uid: str = Field(min_length=1)
    role: Literal["admin", "editor", "viewer"]


class TeamRubrics(StrictModel):
    memo_template_ids: list[UUID] = Field(default_factory=list)
    brief_template_ids: list[UUID] = Field(default_factory=list)
    output_branding: dict[str, Any] = Field(default_factory=dict)


class TeamSkillOverride(StrictModel):
    default_model: str | None = None
    disabled: bool | None = None


class TeamCoreMetadata(StrictModel):
    name: str = Field(min_length=1)
    org: str = Field(min_length=1)
    members: list[TeamMember]
    default_situation_template_id: UUID | None = None
    rubrics: TeamRubrics = Field(default_factory=TeamRubrics)
    shared_skill_overrides: dict[str, TeamSkillOverride] = Field(default_factory=dict)


class SituationFrame(StrictModel):
    what_is_happening: str
    why_does_it_matter: str
    what_would_change_assessment: str
    policy_question: str


class LocalRelation(StrictModel):
    name: str = Field(min_length=1)
    source: Primitive
    target: Primitive


class LocalOntologyExtensions(StrictModel):
    primitive_subtypes: dict[str, list[str]] = Field(default_factory=dict)
    relations: list[LocalRelation] = Field(default_factory=list)


class Geography(StrictModel):
    regions: list[str] = Field(default_factory=list)
    iso_codes: list[str] = Field(default_factory=list)
    bbox: list[float] | None = Field(default=None, min_length=4, max_length=4)


class Hypothesis(StrictModel):
    id: str = Field(min_length=1)
    text: str
    status: Literal["open", "supported", "refuted"]


class Gap(StrictModel):
    id: str = Field(min_length=1)
    kind: Literal["source", "actor", "event", "claim", "graph"]
    text: str
    severity: float = Field(ge=0, le=100)


class Methodology(StrictModel):
    parent_methodology_core_id: UUID | None = None
    rubric_id: str | None = None
    notes: str = ""


class SituationCoreMetadata(StrictModel):
    name: str = Field(min_length=1)
    frame: SituationFrame
    goals: list[str] = Field(default_factory=list)
    geography: Geography = Field(default_factory=Geography)
    case_type: str = Field(min_length=1)
    case_type_secondary: str | None = None
    ontology_id: str = Field(min_length=1)
    ontology_compat: list[str] = Field(default_factory=list)
    ontology_version: str = Field(min_length=1)
    hypotheses: list[Hypothesis] = Field(default_factory=list)
    gaps: list[Gap] = Field(default_factory=list)
    methodology: Methodology = Field(default_factory=Methodology)
    source_core_id: UUID | None = None
    document_core_id: UUID | None = None
    graph_core_id: UUID | None = None
    output_core_id: UUID | None = None
    shared_with_team_id: str | None = None
    local_ontology_extensions: LocalOntologyExtensions = Field(default_factory=LocalOntologyExtensions)


class CredibilityRules(StrictModel):
    require_two_independent_for: list[Literal["Claim", "Verdict"]] = Field(default_factory=list)
    blocked_domains: list[str] = Field(default_factory=list)
    trusted_domains: list[str] = Field(default_factory=list)


class CoverageTimeframe(StrictModel):
    from_: str = Field(alias="from")
    to: str


class CoverageTargets(StrictModel):
    actors_min: int | None = Field(default=None, ge=0)
    events_min: int | None = Field(default=None, ge=0)
    timeframe: CoverageTimeframe | None = None


class SourceCoreMetadata(StrictModel):
    name: str = Field(min_length=1)
    source_receipts_count: int = Field(ge=0)
    credibility_rules: CredibilityRules = Field(default_factory=CredibilityRules)
    coverage_targets: CoverageTargets = Field(default_factory=CoverageTargets)


class ExtractionRules(StrictModel):
    ocr_threshold: float = Field(ge=0, le=1)
    language_hints: list[str] = Field(default_factory=list)


class EntityFilters(StrictModel):
    include_types: list[str] = Field(default_factory=list)
    exclude_types: list[str] = Field(default_factory=list)


class DocumentCoreMetadata(StrictModel):
    name: str = Field(min_length=1)
    document_count: int = Field(ge=0)
    extraction_rules: ExtractionRules
    entity_filters: EntityFilters = Field(default_factory=EntityFilters)


class GraphCoreMetadata(StrictModel):
    name: str = Field(min_length=1)
    ontology_id: str = Field(min_length=1)
    ontology_version: str = Field(min_length=1)
    embedding_model: str = Field(min_length=1)
    confidence_floor: float = Field(default=0.45, ge=0, le=1)
    promotion_policy: Literal["manual", "auto-low", "never-auto"] = "never-auto"
    layers_enabled: list[TruthLayer] = Field(default_factory=lambda: ["Source", "Claim", "Evidence", "Verdict"])


class OutputCoreMetadata(StrictModel):
    name: str = Field(min_length=1)
    output_count: int = Field(ge=0)
    template_id: str | None = None
    branding: dict[str, Any] | None = None
    default_export_formats: list[Literal["md", "docx", "pdf"]] = Field(
        default_factory=lambda: ["md", "docx", "pdf"]
    )


class CoreRecord(StrictModel):
    id: UUID
    kind: CoreKind
    name: str = Field(min_length=1)
    description: str | None = None
    owner_uid: str = Field(min_length=1)
    team_id: str | None = None
    parent_core_id: UUID | None = None
    version: int = Field(gt=0)
    status: CoreStatus
    tags: list[str]
    metadata: dict[str, Any]
    ontology_id: str | None = None
    ontology_version: str | None = None
    created_at: str
    updated_at: str
    created_by: str = Field(min_length=1)
