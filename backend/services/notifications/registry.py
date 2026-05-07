"""Notification taxonomy and typed payloads for PRAXIS."""
from __future__ import annotations

from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class NotificationCategory(StrEnum):
    OPERATIONAL = "operational"
    ANALYTICAL = "analytical"
    ADMINISTRATIVE = "administrative"
    COLLABORATIVE = "collaborative"
    PERSONAL = "personal"


class NotificationUrgency(StrEnum):
    IMMEDIATE = "immediate"
    DIGEST_DAILY = "digest-daily"
    DIGEST_WEEKLY = "digest-weekly"
    BUNDLED = "bundled"


class NotificationChannel(StrEnum):
    IN_APP = "in-app"
    EMAIL_DIGEST = "email-digest"
    EMAIL_IMMEDIATE = "email-immediate"
    BROWSER_PUSH = "browser-push"
    WEBHOOK = "webhook"


class NotificationSpec(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    type: str
    category: NotificationCategory
    default_urgency: NotificationUrgency
    default_channels: tuple[NotificationChannel, ...]
    payload_model: type[BaseModel] = Field(exclude=True)
    action_verb: str
    action_template: str
    description: str

    def action_url(self, payload: dict[str, Any]) -> str:
        url = self.action_template
        for key, value in payload.items():
            if isinstance(value, (str, int, float)):
                url = url.replace(f"{{{key}}}", str(value))
        return url


class SourceIngestCompletePayload(BaseModel):
    case_id: str
    source_id: str
    source_title: str
    candidates_count: int = Field(ge=0)
    embeddings_count: int = Field(ge=0)
    duration: float = Field(ge=0)


class SourceIngestFailedPayload(BaseModel):
    case_id: str
    source_id: str
    source_title: str
    error_class: str
    retry_count: int = Field(ge=0)


class CandidatesReadyBatchPayload(BaseModel):
    case_id: str
    count: int = Field(ge=1)
    primitives: list[str] = Field(default_factory=list)


class DedupSuggestionReadyPayload(BaseModel):
    case_id: str
    group_count: int = Field(ge=1)
    sample_names: list[str] = Field(default_factory=list)


class ThreadIdleNudgePayload(BaseModel):
    case_id: str
    thread_id: str
    question: str
    last_recall_days_ago: int = Field(ge=10)


class ThreadClosedMemifiedPayload(BaseModel):
    case_id: str
    thread_id: str
    memory_coverage_before: float = Field(ge=0)
    memory_coverage_after: float = Field(ge=0)


class RecipeCompletePayload(BaseModel):
    case_id: str
    run_id: str
    recipe_id: str
    judgment_summary: str
    cost: float = Field(ge=0)


class BriefingExportedPayload(BaseModel):
    case_id: str
    briefing_id: str
    format: str
    download_url: str


class BudgetWarningPayload(BaseModel):
    case_id: str
    used_tokens: int = Field(ge=0)
    budget: int = Field(gt=0)


class BudgetPausedPayload(BaseModel):
    case_id: str
    used_tokens: int = Field(ge=0)
    resumes_at: str


class CogneeDegradedPayload(BaseModel):
    queue_depth: int = Field(ge=0)
    last_failure_reason: str


class OntologyUpdateAvailablePayload(BaseModel):
    slug: str
    current_version: str
    new_version: str
    changelog_url: str


class OntologyGapProposedPayload(BaseModel):
    slug: str
    top_patterns: list[str]
    sample_quotes: list[str]


class WorkspaceSharedPayload(BaseModel):
    workspace_id: str
    sharer_uid: str
    sharer_name: str
    role: str


class MemoCommentPayload(BaseModel):
    case_id: str
    memo_id: str
    commenter_name: str
    snippet: str


class CaseMilestonePayload(BaseModel):
    case_id: str
    milestone_type: str


NOTIFICATION_REGISTRY: dict[str, NotificationSpec] = {
    "source_ingest_complete": NotificationSpec(
        type="source_ingest_complete",
        category=NotificationCategory.OPERATIONAL,
        default_urgency=NotificationUrgency.IMMEDIATE,
        default_channels=(NotificationChannel.IN_APP, NotificationChannel.EMAIL_DIGEST),
        payload_model=SourceIngestCompletePayload,
        action_verb="Review candidates",
        action_template="/app/workbench/{case_id}?tab=ontology&source_id={source_id}",
        description="A source finished extraction and produced reviewable candidates.",
    ),
    "source_ingest_failed": NotificationSpec(
        type="source_ingest_failed",
        category=NotificationCategory.OPERATIONAL,
        default_urgency=NotificationUrgency.IMMEDIATE,
        default_channels=(NotificationChannel.IN_APP, NotificationChannel.EMAIL_IMMEDIATE),
        payload_model=SourceIngestFailedPayload,
        action_verb="Inspect",
        action_template="/app/workbench/{case_id}?tab=library&source_id={source_id}",
        description="A source failed after retry and needs analyst attention.",
    ),
    "candidates_ready_batch": NotificationSpec(
        type="candidates_ready_batch",
        category=NotificationCategory.OPERATIONAL,
        default_urgency=NotificationUrgency.BUNDLED,
        default_channels=(NotificationChannel.IN_APP,),
        payload_model=CandidatesReadyBatchPayload,
        action_verb="Review",
        action_template="/app/workbench/{case_id}?tab=ontology",
        description="At least ten ontology candidates are ready since the last visit.",
    ),
    "dedup_suggestion_ready": NotificationSpec(
        type="dedup_suggestion_ready",
        category=NotificationCategory.ANALYTICAL,
        default_urgency=NotificationUrgency.IMMEDIATE,
        default_channels=(NotificationChannel.IN_APP,),
        payload_model=DedupSuggestionReadyPayload,
        action_verb="Review groups",
        action_template="/app/workbench/{case_id}?tab=ontology&view=dedup",
        description="Candidate grouping is ready for review.",
    ),
    "thread_idle_nudge": NotificationSpec(
        type="thread_idle_nudge",
        category=NotificationCategory.PERSONAL,
        default_urgency=NotificationUrgency.DIGEST_WEEKLY,
        default_channels=(NotificationChannel.IN_APP, NotificationChannel.EMAIL_DIGEST),
        payload_model=ThreadIdleNudgePayload,
        action_verb="Resume",
        action_template="/app/workbench/{case_id}?chapter=research&thread_id={thread_id}",
        description="A research thread has been idle long enough to consider closing or resuming.",
    ),
    "thread_closed_memified": NotificationSpec(
        type="thread_closed_memified",
        category=NotificationCategory.OPERATIONAL,
        default_urgency=NotificationUrgency.IMMEDIATE,
        default_channels=(NotificationChannel.IN_APP,),
        payload_model=ThreadClosedMemifiedPayload,
        action_verb="View health",
        action_template="/app/workbench/{case_id}?chapter=desk",
        description="A closed research thread has been saved to memory.",
    ),
    "recipe_complete": NotificationSpec(
        type="recipe_complete",
        category=NotificationCategory.ANALYTICAL,
        default_urgency=NotificationUrgency.IMMEDIATE,
        default_channels=(NotificationChannel.IN_APP,),
        payload_model=RecipeCompletePayload,
        action_verb="View",
        action_template="/app/workbench/{case_id}?chapter=tools&run_id={run_id}",
        description="A DIALECTICA recipe completed with a judgment summary.",
    ),
    "briefing_exported": NotificationSpec(
        type="briefing_exported",
        category=NotificationCategory.OPERATIONAL,
        default_urgency=NotificationUrgency.IMMEDIATE,
        default_channels=(NotificationChannel.IN_APP, NotificationChannel.EMAIL_IMMEDIATE),
        payload_model=BriefingExportedPayload,
        action_verb="Download",
        action_template="{download_url}",
        description="A briefing export is ready to download.",
    ),
    "budget_warning": NotificationSpec(
        type="budget_warning",
        category=NotificationCategory.ADMINISTRATIVE,
        default_urgency=NotificationUrgency.IMMEDIATE,
        default_channels=(NotificationChannel.IN_APP, NotificationChannel.EMAIL_IMMEDIATE),
        payload_model=BudgetWarningPayload,
        action_verb="Adjust",
        action_template="/app/settings?section=budget&case_id={case_id}",
        description="A case reached 80 percent of its token budget.",
    ),
    "budget_paused": NotificationSpec(
        type="budget_paused",
        category=NotificationCategory.ADMINISTRATIVE,
        default_urgency=NotificationUrgency.IMMEDIATE,
        default_channels=(NotificationChannel.IN_APP, NotificationChannel.EMAIL_IMMEDIATE, NotificationChannel.BROWSER_PUSH),
        payload_model=BudgetPausedPayload,
        action_verb="Override",
        action_template="/app/settings?section=budget&case_id={case_id}",
        description="A case reached its token budget and paused generation.",
    ),
    "cognee_degraded": NotificationSpec(
        type="cognee_degraded",
        category=NotificationCategory.ADMINISTRATIVE,
        default_urgency=NotificationUrgency.IMMEDIATE,
        default_channels=(NotificationChannel.IN_APP,),
        payload_model=CogneeDegradedPayload,
        action_verb="View status",
        action_template="/app/settings/system-health",
        description="Cognee is unavailable and pending writes are building up.",
    ),
    "ontology_update_available": NotificationSpec(
        type="ontology_update_available",
        category=NotificationCategory.ADMINISTRATIVE,
        default_urgency=NotificationUrgency.DIGEST_WEEKLY,
        default_channels=(NotificationChannel.IN_APP, NotificationChannel.EMAIL_DIGEST),
        payload_model=OntologyUpdateAvailablePayload,
        action_verb="Review changes",
        action_template="/app/settings/system-health?ontology={slug}",
        description="A new ontology specialization version is available.",
    ),
    "ontology_gap_proposed": NotificationSpec(
        type="ontology_gap_proposed",
        category=NotificationCategory.ADMINISTRATIVE,
        default_urgency=NotificationUrgency.DIGEST_WEEKLY,
        default_channels=(NotificationChannel.IN_APP, NotificationChannel.EMAIL_DIGEST),
        payload_model=OntologyGapProposedPayload,
        action_verb="Review proposal",
        action_template="/app/settings/system-health?ontology_gap={slug}",
        description="An extraction pattern may need ontology stewardship.",
    ),
    "workspace_shared": NotificationSpec(
        type="workspace_shared",
        category=NotificationCategory.COLLABORATIVE,
        default_urgency=NotificationUrgency.IMMEDIATE,
        default_channels=(NotificationChannel.IN_APP, NotificationChannel.EMAIL_IMMEDIATE),
        payload_model=WorkspaceSharedPayload,
        action_verb="Open",
        action_template="/app/workbench?workspace_id={workspace_id}",
        description="A teammate shared a workspace.",
    ),
    "memo_comment": NotificationSpec(
        type="memo_comment",
        category=NotificationCategory.COLLABORATIVE,
        default_urgency=NotificationUrgency.IMMEDIATE,
        default_channels=(NotificationChannel.IN_APP, NotificationChannel.EMAIL_IMMEDIATE),
        payload_model=MemoCommentPayload,
        action_verb="Reply",
        action_template="/app/workbench/{case_id}?chapter=memos&memo_id={memo_id}",
        description="A teammate commented on a memo.",
    ),
    "case_milestone": NotificationSpec(
        type="case_milestone",
        category=NotificationCategory.PERSONAL,
        default_urgency=NotificationUrgency.DIGEST_WEEKLY,
        default_channels=(NotificationChannel.IN_APP,),
        payload_model=CaseMilestonePayload,
        action_verb="View",
        action_template="/app/workbench/{case_id}?chapter=desk",
        description="A case reached a meaningful milestone.",
    ),
}


def get_spec(notification_type: str) -> NotificationSpec:
    try:
        return NOTIFICATION_REGISTRY[notification_type]
    except KeyError as exc:
        raise ValueError(f"Unknown notification type: {notification_type}") from exc
