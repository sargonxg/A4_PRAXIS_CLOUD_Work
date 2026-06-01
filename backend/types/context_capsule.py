"""Pydantic mirror for ADR 0050 ContextCapsule capsule/v2."""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class AliasModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class CapsuleRef(AliasModel):
    id: str
    version: str | None = None
    hash: str | None = None


class CapsuleImport(AliasModel):
    ref: CapsuleRef
    as_: str = Field(alias="as")
    pick: list[str] | None = None


class FewShotExample(AliasModel):
    id: str
    input: str
    output: str
    notes: str | None = None
    version: str | None = None
    source_refs: list[str] | None = Field(default=None, alias="sourceRefs")


class SourcingPolicy(AliasModel):
    mode: Literal["live-search", "corpus", "skc", "hybrid"]
    min_sources_per_claim: int = Field(alias="minSourcesPerClaim")
    allowed_domains: list[str] = Field(default_factory=list, alias="allowedDomains")
    blocked_domains: list[str] = Field(default_factory=list, alias="blockedDomains")
    recency_window_days: int | None = Field(default=None, alias="recencyWindowDays")
    required_source_types: list[str] = Field(default_factory=list, alias="requiredSourceTypes")
    citation_style: Literal["inline", "footnote", "source-card"] | None = Field(default=None, alias="citationStyle")
    source_trust: dict[str, float] | None = Field(default=None, alias="sourceTrust")


class RetrievalConfig(AliasModel):
    mode: Literal["live-search", "corpus", "skc", "hybrid"]
    corpora: list[str] = Field(default_factory=list)
    graph_expansion_depth: int = Field(alias="graphExpansionDepth")
    top_k: int = Field(alias="topK")
    trust_rank: Literal["balanced", "strict", "recency"] = Field(alias="trustRank")
    vector_index: str | None = Field(default=None, alias="vectorIndex")
    filters: dict[str, Any] | None = None


class VertexSafetySetting(AliasModel):
    category: str
    threshold: str


class CapsuleEvalThresholds(AliasModel):
    faithfulness: float
    citation_coverage: float = Field(alias="citationCoverage")
    context_recall: float = Field(alias="contextRecall")
    schema_conformance: float = Field(alias="schemaConformance")
    red_team_pass_rate: float = Field(alias="redTeamPassRate")
    safety_score: float = Field(alias="safetyScore")


class CapsuleEvalLastRun(AliasModel):
    run_id: str = Field(alias="runId")
    scores: dict[str, float]
    passed_at: str = Field(alias="passedAt")


class CapsuleEval(AliasModel):
    golden_set_ref: str = Field(alias="goldenSetRef")
    thresholds: CapsuleEvalThresholds
    metrics: list[
        Literal[
            "faithfulness",
            "response_relevancy",
            "context_precision",
            "context_recall",
            "factual_correctness",
            "tool_call_accuracy",
            "agent_goal_accuracy",
        ]
    ]
    judge: str
    last_run: CapsuleEvalLastRun | None = Field(default=None, alias="lastRun")


class CertificationBadge(AliasModel):
    tier: Literal["community", "reviewed", "verified"]
    scores: dict[str, float]
    eval_run_id: str = Field(alias="evalRunId")
    signed_by: str = Field(alias="signedBy")
    expires_at: str = Field(alias="expiresAt")


class CapsuleAuthor(AliasModel):
    uid: str
    org: str | None = None


class CapsuleProvenance(AliasModel):
    author: CapsuleAuthor
    created_at: str = Field(alias="createdAt")
    published_at: str | None = Field(default=None, alias="publishedAt")
    signature: dict[str, Any] | None = None
    attestation: dict[str, Any] | None = None
    certification: CertificationBadge | None = None


class MarketRevenueShare(AliasModel):
    author_uid: str = Field(alias="authorUid")
    pct: float


class MarketMetadata(AliasModel):
    visibility: Literal["private", "org", "unlisted", "public"]
    pricing: Literal["free", "credits", "subscription"]
    credits: int | None = None
    category: str
    tags: list[str] = Field(default_factory=list)
    installs: int = 0
    rating: float = 0
    revenue_share: MarketRevenueShare | None = Field(default=None, alias="revenueShare")


class CapsulePersona(AliasModel):
    analyst_profile: dict[str, Any] = Field(default_factory=dict, alias="analystProfile")
    system_frame: str = Field(alias="systemFrame")
    domain: str
    frameworks: list[str] = Field(default_factory=list)
    few_shot: list[FewShotExample] = Field(default_factory=list, alias="fewShot")


class CapsuleOutput(AliasModel):
    format: Literal["json", "markdown", "report", "brief"]
    response_json_schema: dict[str, Any] = Field(alias="responseJsonSchema")
    property_ordering: list[str] = Field(alias="propertyOrdering")
    zod_ref: str | None = Field(default=None, alias="zodRef")
    render_template: str | None = Field(default=None, alias="renderTemplate")


class CapsuleTools(AliasModel):
    bound: list[str] = Field(default_factory=list)
    recommended: list[str] = Field(default_factory=list)
    policy: Literal["auto", "suggest", "manual"]


class CapsuleGuardrails(AliasModel):
    refusal_policy: str = Field(alias="refusalPolicy")
    blocked_topics: list[str] = Field(default_factory=list, alias="blockedTopics")
    pii_handling: Literal["redact", "block", "allow"] = Field(alias="piiHandling")
    citation_required: bool = Field(alias="citationRequired")
    max_ungrounded_claims: int = Field(alias="maxUngroundedClaims")
    safety_settings: list[VertexSafetySetting] = Field(default_factory=list, alias="safetySettings")


class ContextCapsule(AliasModel):
    id: str
    schema_version: Literal["capsule/v2"] = Field(alias="schemaVersion")
    version: str
    content_hash: str = Field(alias="contentHash")
    status: Literal["draft", "published", "deprecated", "verified"]
    forked_from: CapsuleRef | None = Field(default=None, alias="forkedFrom")
    immutable: bool
    extends: CapsuleRef | None = None
    imports: list[CapsuleImport] | None = None
    merge_strategy: Literal["prototype", "deep-merge", "override"] = Field(alias="mergeStrategy")
    persona: CapsulePersona
    output: CapsuleOutput
    sourcing: SourcingPolicy
    retrieval: RetrievalConfig
    tools: CapsuleTools
    guardrails: CapsuleGuardrails
    eval: CapsuleEval
    provenance: CapsuleProvenance
    market: MarketMetadata
