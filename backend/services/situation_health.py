"""Deterministic situation health scoring for dashboard and advisor context.

The helper is intentionally pure: callers pass already-fetched Firestore or
backend snapshots, and the return value contains everything a UI or prompt
builder needs without causing extra reads.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class HealthState(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"
    GREY = "grey"


class DegradationKind(str, Enum):
    STALE_FEEDS = "stale_feeds"
    MISSING_PROFILE_FIELDS = "missing_profile_fields"
    STALE_TOOL_OUTPUTS = "stale_tool_outputs"
    FAILED_JOBS = "failed_jobs"
    DEGRADED_CORPUS_COVERAGE = "degraded_corpus_coverage"
    NO_SIGNAL = "no_signal"


class HealthFinding(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: DegradationKind
    state: HealthState
    message: str
    evidence: dict[str, str | int | float | bool | None] = Field(default_factory=dict)


class HealthDimension(BaseModel):
    model_config = ConfigDict(extra="forbid")

    state: HealthState
    findings: list[HealthFinding] = Field(default_factory=list)


class AnalystProfileHealthInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: str | None = None
    domain: str | None = None
    working_style: str | None = Field(default=None, alias="workingStyle")
    preferred_lenses: list[str] = Field(default_factory=list, alias="preferredLenses")


class FeedHealthInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: str
    last_success_at: datetime | None = Field(default=None, alias="lastSuccessAt")
    last_attempt_at: datetime | None = Field(default=None, alias="lastAttemptAt")
    degraded: bool = False


class ToolOutputHealthInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tool_id: str = Field(alias="toolId")
    generated_at: datetime | None = Field(default=None, alias="generatedAt")
    status: Literal["ok", "degraded", "failed"] = "ok"


class JobHealthInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: str = Field(alias="jobId")
    kind: str
    status: Literal["queued", "running", "completed", "failed", "dead_letter"] = Field(alias="status")
    updated_at: datetime | None = Field(default=None, alias="updatedAt")
    attempts: int = 0


class CorpusCoverageHealthInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_chunks: int = Field(default=0, alias="totalChunks")
    cited_items: int = Field(default=0, alias="citedItems")
    vector_index_ready: bool = Field(default=False, alias="vectorIndexReady")
    last_indexed_at: datetime | None = Field(default=None, alias="lastIndexedAt")

    @field_validator("total_chunks", "cited_items")
    @classmethod
    def _non_negative(cls, value: int) -> int:
        if value < 0:
            raise ValueError("coverage counts must be non-negative")
        return value


class SituationHealthInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    now: datetime = Field(default_factory=lambda: datetime.now(UTC))
    profile: AnalystProfileHealthInput | None = None
    feeds: list[FeedHealthInput] = Field(default_factory=list)
    tool_outputs: list[ToolOutputHealthInput] = Field(default_factory=list, alias="toolOutputs")
    jobs: list[JobHealthInput] = Field(default_factory=list)
    corpus: CorpusCoverageHealthInput | None = None
    required_profile_fields: list[Literal["role", "domain", "working_style", "preferred_lenses"]] = Field(
        default_factory=lambda: ["role", "domain", "preferred_lenses"],
        alias="requiredProfileFields",
    )
    expected_tool_ids: list[str] = Field(default_factory=list, alias="expectedToolIds")
    stale_feed_after: timedelta = Field(default=timedelta(hours=6), alias="staleFeedAfter")
    stale_tool_after: timedelta = Field(default=timedelta(days=7), alias="staleToolAfter")
    stale_corpus_after: timedelta = Field(default=timedelta(days=3), alias="staleCorpusAfter")


class SituationHealthReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    state: HealthState
    summary: str
    dimensions: dict[str, HealthDimension]
    findings: list[HealthFinding]


def compute_situation_health(snapshot: SituationHealthInput) -> SituationHealthReport:
    """Compute deterministic red/yellow/green/grey situation health."""
    dimensions = {
        "profile": _profile_health(snapshot),
        "feeds": _feed_health(snapshot),
        "toolOutputs": _tool_output_health(snapshot),
        "jobs": _job_health(snapshot),
        "corpus": _corpus_health(snapshot),
    }
    findings = [finding for dimension in dimensions.values() for finding in dimension.findings]
    state = _rollup_state([dimension.state for dimension in dimensions.values()])
    return SituationHealthReport(
        state=state,
        summary=_summary_for(state, findings),
        dimensions=dimensions,
        findings=findings,
    )


def _profile_health(snapshot: SituationHealthInput) -> HealthDimension:
    profile = snapshot.profile
    if profile is None:
        return _grey_dimension(DegradationKind.NO_SIGNAL, "No analyst profile snapshot supplied.")

    missing = []
    for field_name in snapshot.required_profile_fields:
        value = getattr(profile, field_name)
        if value is None or value == "" or value == []:
            missing.append(field_name)

    if not missing:
        return HealthDimension(state=HealthState.GREEN)
    return HealthDimension(
        state=HealthState.YELLOW,
        findings=[
            HealthFinding(
                kind=DegradationKind.MISSING_PROFILE_FIELDS,
                state=HealthState.YELLOW,
                message="Analyst profile is missing calibration fields.",
                evidence={"missing": ",".join(missing), "count": len(missing)},
            )
        ],
    )


def _feed_health(snapshot: SituationHealthInput) -> HealthDimension:
    if not snapshot.feeds:
        return _grey_dimension(DegradationKind.NO_SIGNAL, "No feed status snapshots supplied.")

    stale = []
    degraded = []
    for feed in snapshot.feeds:
        age = _age(snapshot.now, feed.last_success_at)
        if feed.degraded:
            degraded.append(feed.source)
        if feed.last_success_at is None or age > snapshot.stale_feed_after:
            stale.append((feed.source, None if age is None else round(age.total_seconds() / 3600, 2)))

    findings = []
    if stale:
        findings.append(
            HealthFinding(
                kind=DegradationKind.STALE_FEEDS,
                state=HealthState.RED,
                message="One or more data feeds have not succeeded within the freshness window.",
                evidence={"sources": ",".join(source for source, _ in stale), "count": len(stale)},
            )
        )
    if degraded:
        findings.append(
            HealthFinding(
                kind=DegradationKind.STALE_FEEDS,
                state=HealthState.YELLOW,
                message="One or more data feeds are reporting degraded status.",
                evidence={"sources": ",".join(degraded), "count": len(degraded)},
            )
        )
    return HealthDimension(state=_rollup_state([finding.state for finding in findings]), findings=findings)


def _tool_output_health(snapshot: SituationHealthInput) -> HealthDimension:
    if not snapshot.tool_outputs and not snapshot.expected_tool_ids:
        return _grey_dimension(DegradationKind.NO_SIGNAL, "No tool-output snapshots supplied.")

    by_tool = {output.tool_id: output for output in snapshot.tool_outputs}
    missing = [tool_id for tool_id in snapshot.expected_tool_ids if tool_id not in by_tool]
    stale = []
    degraded_or_failed = []
    for output in snapshot.tool_outputs:
        age = _age(snapshot.now, output.generated_at)
        if output.generated_at is None or age > snapshot.stale_tool_after:
            stale.append(output.tool_id)
        if output.status in {"degraded", "failed"}:
            degraded_or_failed.append(output.tool_id)

    findings = []
    if missing:
        findings.append(
            HealthFinding(
                kind=DegradationKind.STALE_TOOL_OUTPUTS,
                state=HealthState.YELLOW,
                message="Expected tool outputs have not been generated for this situation.",
                evidence={"toolIds": ",".join(missing), "count": len(missing)},
            )
        )
    if stale:
        findings.append(
            HealthFinding(
                kind=DegradationKind.STALE_TOOL_OUTPUTS,
                state=HealthState.YELLOW,
                message="Tool outputs are older than the freshness window.",
                evidence={"toolIds": ",".join(stale), "count": len(stale)},
            )
        )
    if degraded_or_failed:
        findings.append(
            HealthFinding(
                kind=DegradationKind.STALE_TOOL_OUTPUTS,
                state=HealthState.RED,
                message="Tool outputs include degraded or failed runs.",
                evidence={"toolIds": ",".join(degraded_or_failed), "count": len(degraded_or_failed)},
            )
        )
    return HealthDimension(state=_rollup_state([finding.state for finding in findings]), findings=findings)


def _job_health(snapshot: SituationHealthInput) -> HealthDimension:
    if not snapshot.jobs:
        return _grey_dimension(DegradationKind.NO_SIGNAL, "No background job snapshots supplied.")

    failed = [job for job in snapshot.jobs if job.status in {"failed", "dead_letter"}]
    if not failed:
        return HealthDimension(state=HealthState.GREEN)

    dead_letter_count = sum(1 for job in failed if job.status == "dead_letter")
    state = HealthState.RED if dead_letter_count else HealthState.YELLOW
    return HealthDimension(
        state=state,
        findings=[
            HealthFinding(
                kind=DegradationKind.FAILED_JOBS,
                state=state,
                message="Background jobs have failed and may block fresh context.",
                evidence={
                    "count": len(failed),
                    "deadLetterCount": dead_letter_count,
                    "jobIds": ",".join(job.job_id for job in failed),
                },
            )
        ],
    )


def _corpus_health(snapshot: SituationHealthInput) -> HealthDimension:
    corpus = snapshot.corpus
    if corpus is None:
        return _grey_dimension(DegradationKind.NO_SIGNAL, "No corpus coverage snapshot supplied.")

    findings = []
    if corpus.total_chunks == 0:
        findings.append(
            HealthFinding(
                kind=DegradationKind.DEGRADED_CORPUS_COVERAGE,
                state=HealthState.RED,
                message="Situation corpus has no indexed chunks.",
                evidence={"totalChunks": corpus.total_chunks},
            )
        )
    elif corpus.cited_items == 0 or not corpus.vector_index_ready:
        findings.append(
            HealthFinding(
                kind=DegradationKind.DEGRADED_CORPUS_COVERAGE,
                state=HealthState.YELLOW,
                message="Situation corpus coverage is incomplete for cited retrieval.",
                evidence={
                    "totalChunks": corpus.total_chunks,
                    "citedItems": corpus.cited_items,
                    "vectorIndexReady": corpus.vector_index_ready,
                },
            )
        )

    age = _age(snapshot.now, corpus.last_indexed_at)
    if corpus.last_indexed_at is None or age > snapshot.stale_corpus_after:
        findings.append(
            HealthFinding(
                kind=DegradationKind.DEGRADED_CORPUS_COVERAGE,
                state=HealthState.YELLOW,
                message="Situation corpus has not been indexed recently.",
                evidence={"lastIndexedAt": corpus.last_indexed_at.isoformat() if corpus.last_indexed_at else None},
            )
        )

    return HealthDimension(state=_rollup_state([finding.state for finding in findings]), findings=findings)


def _grey_dimension(kind: DegradationKind, message: str) -> HealthDimension:
    return HealthDimension(
        state=HealthState.GREY,
        findings=[HealthFinding(kind=kind, state=HealthState.GREY, message=message)],
    )


def _age(now: datetime, then: datetime | None) -> timedelta | None:
    if then is None:
        return None
    return _as_utc(now) - _as_utc(then)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _rollup_state(states: list[HealthState]) -> HealthState:
    if not states:
        return HealthState.GREEN
    if HealthState.RED in states:
        return HealthState.RED
    if HealthState.YELLOW in states:
        return HealthState.YELLOW
    non_grey = [state for state in states if state != HealthState.GREY]
    if not non_grey:
        return HealthState.GREY
    return HealthState.GREEN


def _summary_for(state: HealthState, findings: list[HealthFinding]) -> str:
    actionable = [finding for finding in findings if finding.state in {HealthState.RED, HealthState.YELLOW}]
    if state == HealthState.GREEN:
        return "Situation context is current enough for calibrated analysis."
    if state == HealthState.GREY:
        return "Situation health cannot be assessed until context snapshots are available."
    return f"{len(actionable)} situation health issue(s) require attention before high-confidence analysis."
