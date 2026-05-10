from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


WorkOntologyId = Literal["foreign-policy-research", "domestic-policy-analysis", "corporate-strategic-analysis"]


class OutputPreferences(BaseModel):
    citation_format: str = "footnotes"
    brief_vs_long: str = "brief"
    language_posture: str = "neutral"


class SourcePreferences(BaseModel):
    trusted: list[str] = Field(default_factory=list)
    deprioritized: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=lambda: ["en"])


class UserModelFields(BaseModel):
    identity: str
    role: str
    mandate: str
    organization: str | None = None
    methodology_toolkit: list[str] = Field(default_factory=list)
    communication_style: str = "analytical"
    confidence_tolerance: str = "medium"
    default_ontology_stacks: dict[str, list[str]] = Field(default_factory=dict)
    tool_affinities: list[str] = Field(default_factory=list)
    standing_assumptions: list[str] = Field(default_factory=list)
    prohibited_frames: list[str] = Field(default_factory=list)
    output_preferences: OutputPreferences = Field(default_factory=OutputPreferences)
    source_preferences: SourcePreferences = Field(default_factory=SourcePreferences)
    parent_model_id: str | None = None
    work_ontology_id: WorkOntologyId
    audience_defaults: list[str] = Field(default_factory=list)
