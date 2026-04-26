# PRAXIS Documentation Index — 2026-04-26

> Single-pane navigation for every doc in the repo. Every agent should
> open this first. Outdated docs go to `docs/archive/` (Codex / Claude
> may move them).

## Read in this order if you're cold

1. [`CLAUDE.md`](../CLAUDE.md) — repo + architecture guide
2. [`AGENTS.md`](../AGENTS.md) — hard rules + validation gate
3. [`docs/CONTINUATION.md`](./CONTINUATION.md) — last "do this next" handoff
4. [`docs/CODEX_HANDOFF_2026-04-26.md`](./CODEX_HANDOFF_2026-04-26.md) — the active drop-in prompt
5. [`docs/TODO_BOARD_2026-04-26.md`](./TODO_BOARD_2026-04-26.md) — every open brick
6. [`CHANGELOG.md`](../CHANGELOG.md) — what just shipped (Unreleased section)

## Strategy & roadmap

| Doc | Purpose |
|---|---|
| [`IMPROVEMENT_15_2026-04-26.md`](./IMPROVEMENT_15_2026-04-26.md) | **Round-3 plan: 15 named improvements with rationale + persona impact + DoD.** |
| [`STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md`](./STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md) | 20-item high-impact queue + agent lanes |
| [`PRAXIS_HIGH_IMPACT_PRODUCT_PLAN_2026-04-26.md`](./PRAXIS_HIGH_IMPACT_PRODUCT_PLAN_2026-04-26.md) | Multi-day product plan (dashboard, Ask PRAXIS, tool envelopes, knowledge architecture) |
| [`PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md`](./PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md) | **Flagship 90-day roadmap. 30+ named bricks (now 44 with rounds 3-4 additions). Read this for the big picture.** |
| [`NEXT_BRICKS_2026-04-26.md`](./NEXT_BRICKS_2026-04-26.md) | Top-10 bricks for the next 7 days + lane assignments |
| [`specs/2026-04-26-improvements/`](./specs/2026-04-26-improvements/) | Drop-in specs for round-3 items 9-15 (onboarding rationale, Document AI, Cloud Translation, Brainstorming Cloud Tasks, changed-since diff, Briefing versioning, domain overrides) |
| [`SPRINT_EXECUTION_PLAN_2026-04-25.md`](./SPRINT_EXECUTION_PLAN_2026-04-25.md) | This week's sprint plan |
| [`SPRINT_BACKLOG.md`](./SPRINT_BACKLOG.md) | Canonical actionable backlog |
| [`SPRINT_2026-04-25.md`](./SPRINT_2026-04-25.md) | Week sprint plan |
| [`STRATEGY.md`](./STRATEGY.md) | Six-week roadmap |
| [`VISION_2026.md`](./VISION_2026.md) | Strategic north-star objective |

## Architecture

| Doc | Purpose |
|---|---|
| [`OPERATIONAL_SPINE.md`](./OPERATIONAL_SPINE.md) | tool_runs, background_jobs, system_events, notifications, semaphore states, idempotency, retention |
| [`CONTEXT_INJECTION.md`](./CONTEXT_INJECTION.md) | Architectural contract every AI route must honour |
| [`CORPUS_ARCHITECTURE.md`](./CORPUS_ARCHITECTURE.md) | Corpus retrieval contract; steps 1–3 shipped 2026-04-26 |
| [`AGENTIC_SYSTEM.md`](./AGENTIC_SYSTEM.md) | Agent execution model; Brainstorming Table First Implementation Queue |
| [`AGENT_REGISTRY.md`](./AGENT_REGISTRY.md) | Single source of truth for agent personas (codified in `src/lib/agents/registry.ts`) |
| [`GCP_OPERATIONS.md`](./GCP_OPERATIONS.md) | Every gcloud / Secret Manager command |
| [`GCP_EXPANSION_PLAN_2026-04-26.md`](./GCP_EXPANSION_PLAN_2026-04-26.md) | 12 new GCP services to layer in (Document AI, Translation, Vertex Search, etc.) |

## Tools

| Doc | Purpose |
|---|---|
| [`tools/INDEX.md`](./tools/INDEX.md) | Per-tool micro-app spec catalogue |
| [`tools/UX_AUDIT_2026-04-26.md`](./tools/UX_AUDIT_2026-04-26.md) | Tool-by-tool UX audit (13 priority tools) |
| [`TOOL_RELIABILITY_AUDIT_2026-04-26.md`](./TOOL_RELIABILITY_AUDIT_2026-04-26.md) | Top-10 tools failure-mode walk + per-tool TODOs |
| [`USER_RESEARCH_SYNTHESIS_2026-04-26.md`](./USER_RESEARCH_SYNTHESIS_2026-04-26.md) | Persona-based survey synthesis |

## Testing

| Doc | Purpose |
|---|---|
| [`TEST_PLAN_2026-04-26.md`](./TEST_PLAN_2026-04-26.md) | Multi-persona test matrix (onboarding, profile, tools, Ask PRAXIS, spine, prod smoke) |
| [`personas/README.md`](./personas/README.md) | How to write persona walkthroughs |
| [`personas/PERSONA_WALKTHROUGHS_2026-04-26.md`](./personas/PERSONA_WALKTHROUGHS_2026-04-26.md) | Five scenario-driven walkthroughs + cross-persona heatmap |

## Operations

| Doc | Purpose |
|---|---|
| [`DEPLOYMENT_LOG.md`](./DEPLOYMENT_LOG.md) | Daily deployment status |
| [`COMPLIANCE.md`](./COMPLIANCE.md) | Licensing, certs, sub-processors, audit log |
| [`USER_ACTION_LIST.md`](./USER_ACTION_LIST.md) | Things only Giulio can do |
| [`TEAM_OPS.md`](./TEAM_OPS.md) | Multi-agent operations playbook |

## Handoffs & prompts

| Doc | Purpose |
|---|---|
| [`CODEX_HANDOFF_2026-04-26.md`](./CODEX_HANDOFF_2026-04-26.md) | **Active** Codex drop-in prompt |
| [`CONTINUATION.md`](./CONTINUATION.md) | Cumulative session-by-session handoff history |
| [`HANDOFF_PROMPTS.md`](./HANDOFF_PROMPTS.md) | Drop-in prompts to start a fresh session |
| [`RESEARCH_PROMPTS.md`](./RESEARCH_PROMPTS.md) | Prompts to give the user when info is missing |
| [`CLAUDE_TANDEM_PROMPTS_2026-04-25.md`](./CLAUDE_TANDEM_PROMPTS_2026-04-25.md) | Claude tandem prompts |

## Specs (per-feature design docs)

`docs/superpowers/specs/` holds dated design specs. Notable:

- `2026-04-18-user-onboarding-tool-calibration-design.md`
- `2026-04-19-domain-taxonomy-stabilization-design.md`
- `2026-04-26-brainstorming-table-media-intelligence-plan.md`

## Research artifacts

- `docs/compass_artifact_wf-7af05074-9b31-4316-834d-b3a7500f4cf7_text_markdown.md`
  — 789-line deep-research artifact (2026-04-25) answering the
  10 research prompts.

## Where new docs go

- **Strategy / roadmap** → `docs/<TOPIC>_<YYYY-MM-DD>.md`.
- **Per-feature spec** → `docs/superpowers/specs/<YYYY-MM-DD>-<feature>.md`.
- **Persona walkthroughs** → `docs/personas/<TOPIC>_<YYYY-MM-DD>.md`.
- **Per-tool spec** → `docs/tools/<tool-id>.md`.
- **Operational** → `docs/<TOPIC>.md` (no date — these stay current).

When a doc supersedes another, move the older one to
`docs/archive/<YYYY-MM>/` and add a one-line redirect header to it
pointing at the new file.

## Maintaining this index

- After landing a brick that adds a new doc: append the doc to the
  relevant section above.
- After consolidating two docs: move the loser to `docs/archive/` and
  remove its row.
- After 90 days: re-sort sections by relevance, archive old plans
  whose dates are past their stated horizon.
