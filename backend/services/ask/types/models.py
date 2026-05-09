from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ASK_MODES = ("quick", "deep", "plan", "memo", "brief", "talking_points")
ASK_THREAD_STATUSES = ("active", "archived")
ASK_MESSAGE_ROLES = ("user", "assistant", "system", "tool")
ASK_ROUTE_ACTIONS = ("direct_answer", "run_skill", "run_subagent_plan", "clarify")
ASK_CITATION_SOURCE_KINDS = ("source_receipt", "document", "graph_node", "graph_edge", "core", "web", "other")

AskMode = Literal["quick", "deep", "plan", "memo", "brief", "talking_points"]
AskThreadStatus = Literal["active", "archived"]
AskMessageRole = Literal["user", "assistant", "system", "tool"]
AskRouteAction = Literal["direct_answer", "run_skill", "run_subagent_plan", "clarify"]
AskCitationSourceKind = Literal["source_receipt", "document", "graph_node", "graph_edge", "core", "web", "other"]


class AskThread(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: UUID
    owner_uid: str = Field(min_length=1)
    situation_id: str | None = None
    situation_core_id: UUID | None = None
    title: str = Field(min_length=1)
    mode: AskMode = "quick"
    status: AskThreadStatus = "active"
    attached_core_ids: list[UUID] = Field(default_factory=list)
    created_at: str
    updated_at: str
    archived_at: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AskMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: UUID
    owner_uid: str = Field(min_length=1)
    thread_id: UUID
    role: AskMessageRole
    content: str
    sequence: int = Field(ge=0)
    route_action: AskRouteAction | None = None
    skill_id: str | None = None
    subagent_id: str | None = None
    token_count: int = Field(default=0, ge=0)
    cost_usd: float = Field(default=0, ge=0)
    created_at: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class AskMessageCitation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: UUID
    owner_uid: str = Field(min_length=1)
    message_id: UUID
    citation_index: int = Field(gt=0)
    source_kind: AskCitationSourceKind
    source_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    excerpt: str | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: str


class AskResolvedCore(BaseModel):
    id: UUID
    kind: str = Field(min_length=1)
    name: str = Field(min_length=1)
    status: str = Field(min_length=1)
    ontology_id: str | None = None
    ontology_version: str | None = None
    tags: list[str] = Field(default_factory=list)
    summary: str = ""
    metadata_keys: list[str] = Field(default_factory=list)
    implicit: bool = False


class AskOntologyBinding(BaseModel):
    core_id: UUID = Field(alias="coreId")
    ontology_id: str = Field(alias="ontologyId", min_length=1)
    ontology_version: str | None = Field(default=None, alias="ontologyVersion")


class AskCoreContextSnapshot(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    attached_core_ids: list[UUID] = Field(alias="attachedCoreIds", default_factory=list)
    implicit_core_ids: list[UUID] = Field(alias="implicitCoreIds", default_factory=list)
    resolved_cores: list[AskResolvedCore] = Field(alias="resolvedCores", default_factory=list)
    missing_core_ids: list[UUID] = Field(alias="missingCoreIds", default_factory=list)
    ontology_binding: AskOntologyBinding | None = Field(default=None, alias="ontologyBinding")
    context_health: int = Field(alias="contextHealth", ge=0, le=100)
    advisories: list[str] = Field(default_factory=list)


class AskRunRequest(BaseModel):
    query: str = Field(min_length=1)
    mode: AskMode = "quick"
    situation_id: str | None = None
    attached_core_ids: list[UUID] = Field(default_factory=list)
    thread_id: UUID | None = None
    skill_id: str | None = Field(default=None, min_length=1)
