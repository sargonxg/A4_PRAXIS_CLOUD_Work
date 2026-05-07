from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


PersonaId = str
DeliberationPhase = Literal[
    "configure",
    "opening",
    "initial_takes",
    "disagreement",
    "deepening",
    "red_team_challenge",
    "ach_scoring",
    "synthesis",
    "closed",
    "aborted",
]


class PersonaFramework(BaseModel):
    name: str
    note: str


class Citation(BaseModel):
    id: str
    label: str
    sourceType: Literal["corpus", "graph", "tool", "opinion"]
    sourceRef: str | None = None
    excerpt: str | None = None


class PersonaSpec(BaseModel):
    id: PersonaId
    version: str
    displayName: str
    shortRole: str
    avatar: dict[str, str]
    background: dict[str, object]
    expertise: dict[str, object]
    voice: dict[str, object]
    tools: dict[str, object]
    corpus: dict[str, object]


class ToolUse(BaseModel):
    toolId: str
    label: str
    status: Literal["planned", "running", "completed", "skipped"]
    summary: str | None = None


class PersonaContribution(BaseModel):
    id: str
    personaId: PersonaId
    personaName: str
    phase: DeliberationPhase
    contributionType: Literal["opening", "initial_take", "reaction", "challenge", "deepening", "synthesis", "close"]
    text: str
    citations: list[Citation]
    toolUses: list[ToolUse] = Field(default_factory=list)
    wordCount: int
    confidence: float = Field(ge=0, le=0.6)
    synthesized: Literal[True]
    createdAt: str


class SynthesisClaim(BaseModel):
    id: str
    text: str
    confidence: float = Field(ge=0, le=0.6)
    citations: list[Citation]
    synthesized: Literal[True]


class DeliberationSynthesis(BaseModel):
    bluf: str
    consensusClaims: list[SynthesisClaim]
    dissentingViews: list[str]
    unresolvedQuestions: list[str]
    recommendedActions: list[str]
    confidence: float = Field(ge=0, le=0.6)
    synthesized: Literal[True]


class DeliberationConfig(BaseModel):
    question: str
    participantIds: list[PersonaId]
    rounds: int = Field(ge=1, le=8)
    moderatorStyle: Literal["concise", "standard", "deep"] = "standard"
    satIntegration: dict[str, bool] = Field(default_factory=dict)


class DeliberationArtifact(BaseModel):
    id: str
    caseId: str
    ownerUid: str
    title: str
    status: Literal["configured", "running", "synthesized", "closed", "aborted"]
    phase: DeliberationPhase
    config: DeliberationConfig
    participants: list[PersonaSpec]
    contributions: list[PersonaContribution]
    synthesis: DeliberationSynthesis | None = None
    cost: dict[str, float | bool]
    createdAt: str
    updatedAt: str
