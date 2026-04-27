"""Typed Firestore-facing schemas for durable agent runs."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

AgentRunStatus = Literal[
    "queued",
    "running",
    "awaiting-human",
    "completed",
    "failed",
    "cancelled",
]
AgentRunSemaphore = Literal["green", "yellow", "red"]


class AgentRunError(BaseModel):
    code: str
    message: str


class AgentRun(BaseModel):
    """Canonical agent run summary stored under a user's situation."""

    model_config = ConfigDict(extra="forbid")

    run_id: str = Field(alias="runId")
    uid: str
    situation_id: str | None = Field(alias="situationId")
    tool_id: str = Field(alias="toolId")
    workflow: str
    status: AgentRunStatus
    checkpoint_thread_id: str = Field(alias="checkpointThreadId")
    started_at: datetime = Field(alias="startedAt")
    last_activity_at: datetime = Field(alias="lastActivityAt")
    expires_at: datetime = Field(alias="expiresAt")
    completed_at: datetime | None = Field(default=None, alias="completedAt")
    checkpoint_deleted_at: datetime | None = Field(default=None, alias="checkpointDeletedAt")
    error: AgentRunError | None = None
    summary: str | None = None
    semaphore: AgentRunSemaphore = "green"


class AgentEvent(BaseModel):
    """Structured event emitted by LangGraph-backed agent workflows."""

    model_config = ConfigDict(extra="allow")

    run_id: str = Field(alias="runId")
    uid: str | None = None
    situation_id: str | None = Field(default=None, alias="situationId")
    workflow: str
    kind: str
    severity: Literal["info", "warning", "error"] = "info"
    created_at: datetime = Field(alias="createdAt")
    expires_at: datetime = Field(alias="expiresAt")
    metadata: dict[str, Any] = Field(default_factory=dict)
