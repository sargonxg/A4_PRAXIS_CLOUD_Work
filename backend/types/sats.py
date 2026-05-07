"""Pydantic mirrors for PRAXIS Structured Analytic Technique artifacts."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


SATCategory = Literal["ach", "kac", "red_team", "premortem"]
ACHStatus = Literal["draft", "in_progress", "concluded", "archived"]
ACHScoreRating = Literal["consistent", "inconsistent", "irrelevant", "unknown"]
ACHConclusion = Literal["most_likely", "plausible", "unlikely", "rejected"]


class ACHHypothesis(BaseModel):
    id: str
    text: str
    proposed_by: Literal["user", "subagent"] = Field(alias="proposedBy")
    notes: str | None = None


class ACHEvidence(BaseModel):
    id: str
    text: str
    source_kind: Literal["graph_node", "free_text", "document"] = Field(alias="sourceKind")
    source_ref: str | None = Field(default=None, alias="sourceRef")
    weight: float = Field(ge=0, le=1)
    diagnosticity: float | None = Field(default=None, ge=0, le=1)


class ACHScore(BaseModel):
    hypothesis_id: str = Field(alias="hypothesisId")
    evidence_id: str = Field(alias="evidenceId")
    rating: ACHScoreRating
    note: str | None = None


class ACHRanking(BaseModel):
    hypothesis_id: str = Field(alias="hypothesisId")
    inconsistency_count: int = Field(alias="inconsistencyCount", ge=0)
    weighted_inconsistency: float = Field(alias="weightedInconsistency", ge=0)
    rank: int = Field(ge=1)
    conclusion: ACHConclusion


class ACHMatrix(BaseModel):
    id: str
    case_id: str = Field(alias="caseId")
    owner_uid: str = Field(alias="ownerUid")
    title: str
    status: ACHStatus
    hypotheses: list[ACHHypothesis]
    evidence: list[ACHEvidence]
    scores: list[ACHScore]
    ranking: list[ACHRanking] | None = None
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")


class KACAssumption(BaseModel):
    id: str
    text: str
    status: Literal["stated", "unstated"]
    support_level: Literal["well_supported", "questionable", "unsupported", "unrated"] = Field(alias="supportLevel")
    evidence: list[str] | None = None
    user_verdict: Literal["accept", "flag", "reject"] | None = Field(default=None, alias="userVerdict")


class KACReport(BaseModel):
    id: str
    case_id: str = Field(alias="caseId")
    owner_uid: str = Field(alias="ownerUid")
    scope_ref: dict[str, str] = Field(alias="scopeRef")
    assumptions: list[KACAssumption]
    generated_at: str = Field(alias="generatedAt")
    subagent_run_id: str = Field(alias="subagentRunId")
    synthesized: Literal[True] = True
    confidence: float = Field(default=0.6, le=0.6)


class RedTeamMove(BaseModel):
    move: str
    rationale: str
    probability: Literal["high", "medium", "low"]


class RedTeamActorView(BaseModel):
    actor_id: str = Field(alias="actorId")
    view: str


class RedTeamAnalysis(BaseModel):
    interests: list[str]
    constraints: list[str]
    likely_moves: list[RedTeamMove] = Field(alias="likelyMoves")
    view_of_other_actors: list[RedTeamActorView] = Field(alias="viewOfOtherActors")


class RedTeamReport(BaseModel):
    id: str
    case_id: str = Field(alias="caseId")
    owner_uid: str = Field(alias="ownerUid")
    target_actor_id: str = Field(alias="targetActorId")
    framing_note: str = Field(alias="framingNote")
    analysis: RedTeamAnalysis
    generated_at: str = Field(alias="generatedAt")
    subagent_run_id: str = Field(alias="subagentRunId")
    synthesized: Literal[True] = True
    confidence: float = Field(default=0.6, le=0.6)


class PremortemPathway(BaseModel):
    id: str
    description: str
    severity: Literal["low", "medium", "high", "catastrophic"]
    likelihood: Literal["low", "medium", "high"]
    triggering_conditions: list[str] = Field(alias="triggeringConditions")
    mitigations: list[str]


class PremortemReport(BaseModel):
    id: str
    case_id: str = Field(alias="caseId")
    owner_uid: str = Field(alias="ownerUid")
    scope_ref: dict[str, str] = Field(alias="scopeRef")
    failure_pathways: list[PremortemPathway] = Field(alias="failurePathways")
    generated_at: str = Field(alias="generatedAt")
    subagent_run_id: str = Field(alias="subagentRunId")
    synthesized: Literal[True] = True
    confidence: float = Field(default=0.6, le=0.6)
