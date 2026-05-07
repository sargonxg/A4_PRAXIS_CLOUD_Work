"""Pydantic mirror for PRAXIS four-layer context contracts."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ContextLayer = Literal["user", "workspace", "case", "conversation"]
UserRole = Literal[
    "diplomat",
    "mediator",
    "analyst",
    "researcher",
    "policy_advisor",
    "human_rights_officer",
    "sanctions_analyst",
    "humanitarian_coordinator",
    "treaty_lawyer",
    "defense_analyst",
    "other",
]
CommunicationStyle = Literal["concise", "thorough", "narrative"]
ConfidenceTolerance = Literal["low", "medium", "high"]


class UserContext(BaseModel):
    uid: str
    workspace_id: str = Field(alias="workspaceId")
    identity: dict
    mandate: dict | None = None
    preferences: dict = Field(default_factory=dict)
    captured_at: dict = Field(default_factory=dict, alias="capturedAt")


class WorkspaceGuideline(BaseModel):
    id: str
    workspace_id: str = Field(alias="workspaceId")
    title: str
    kind: Literal["methodology", "style_guide", "glossary", "reference", "other"]
    storage_ref: str = Field(alias="storageRef")
    embedding_node_id: str | None = Field(default=None, alias="embeddingNodeId")
    uploaded_at: str = Field(alias="uploadedAt")
    text_hash: str = Field(alias="textHash")


class WorkspaceContext(BaseModel):
    workspace_id: str = Field(alias="workspaceId")
    owner_uid: str = Field(alias="ownerUid")
    label: str
    guidelines: list[WorkspaceGuideline] = Field(default_factory=list)
    glossary: list[dict] = Field(default_factory=list)
    methodology_docs: list[WorkspaceGuideline] = Field(default_factory=list, alias="methodologyDocs")


class CaseContext(BaseModel):
    case_id: str = Field(alias="caseId")
    owner_uid: str = Field(alias="ownerUid")
    ontology_id: str = Field(alias="ontologyId")
    ontology_ids: list[str] = Field(default_factory=list, alias="ontologyIds")
    primary_ontology_id: str | None = Field(default=None, alias="primaryOntologyId")
    frame: dict
    source_count: int = Field(alias="sourceCount")
    document_count: int = Field(alias="documentCount")
    graph_node_count: int = Field(alias="graphNodeCount")
    graph_edge_count: int = Field(alias="graphEdgeCount")
    context_health: dict = Field(alias="contextHealth")


class ConversationContext(BaseModel):
    session_id: str = Field(alias="sessionId")
    started_at: str = Field(alias="startedAt")
    workbench_tab: str | None = Field(default=None, alias="workbenchTab")
    focused_node_id: str | None = Field(default=None, alias="focusedNodeId")
    focused_tool_id: str | None = Field(default=None, alias="focusedToolId")
    focused_memo_block_id: str | None = Field(default=None, alias="focusedMemoBlockId")
    recent_actions: list[dict] = Field(default_factory=list, alias="recentActions")


class ContextAdvisory(BaseModel):
    layer: ContextLayer
    severity: Literal["info", "warn", "critical"]
    message: str
    action: str | None = None


class ContextSnapshot(BaseModel):
    user: UserContext
    workspace: WorkspaceContext
    case: CaseContext
    conversation: ConversationContext
    composite: dict


class ContextSpec(BaseModel):
    user: dict | None = None
    workspace: dict | None = None
    case_graph: dict | None = Field(default=None, alias="caseGraph")
    conversation: dict | None = None
    min_health_score: int | None = Field(default=None, alias="minHealthScore")
    graceful: bool = True


class PreparedContext(BaseModel):
    spec: ContextSpec
    source: ContextSnapshot
    prepared: dict
