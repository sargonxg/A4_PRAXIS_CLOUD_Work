# PRAXIS Public Launch And Agentic Readiness Plan

Date: 2026-05-26
Owner: PRAXIS launch workstream
Status: execution plan
Scope: GitHub-main deploy proof, `praxis.tacitus.me`, Ask PRAXIS, agent runtime, SQL/Firebase/Cognee/context stores, ContextCapsules, tools, artifacts, and public-launch gates.

## Current Checkpoint

- Canonical local repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
- Canonical GitHub repo: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work`
- Canonical branch: `main`
- Launch URL: `https://praxis.tacitus.me`
- Current deploy-source work: Cloud Build and Docker provenance expose source repo, branch, commit, trigger, build id, Cloud Run service, and Cloud Run revision through runtime health.
- Verified GitHub-main deploy: `frontend-main-on-push` build `c0273ff4-cd5f-4abd-8bd2-f2237e9c1c63` deployed commit `b3f901513597c4819fc92ae17695f8e9d66b2fd4` to Cloud Run revision `praxis-frontend-00813-z5t`.
- Cloudflare state: `tacitus.me` is active in Cloudflare; `praxis.tacitus.me` is DNS-only CNAME to `ghs.googlehosted.com`.

## Product Principle

PRAXIS should stay simple on the surface and deep underneath.

The user-facing app should feel like:

```text
Ask PRAXIS -> see thinking/status -> get an answer -> inspect sources/artifacts when needed
```

The hidden runtime should be:

```text
ContextCapsules -> triage plan -> tools/agents -> evidence -> quality checks -> artifacts -> durable ledger
```

Do not add a new top-level agent app, separate primary navigation surface, or separate policy-research dashboard for this wave. Improve the existing Ask PRAXIS and Tasklet workbench surfaces.

## Non-Negotiables

1. GitHub `main` is the deploy source of truth. Manual local deploys are emergency fallback only.
2. `praxis.tacitus.me/api/health/runtime` must show the live build provenance: repo, branch, commit, build source, Cloud Run service, and revision.
3. ContextCapsules remain the canonical PRAXIS context repository. Cognee/graph enrichment is optional, review-gated, and non-authoritative unless promoted.
4. Firestore remains the owner-scoped app/capsule/conversation state store.
5. Cloud SQL Postgres remains the durable AgentRun/tool-call/approval ledger.
6. The Ask surface stays one conversation window. Receipts, agents, sources, artifacts, and capsule suggestions appear inline or in a collapsible work panel.
7. Long/high-stakes policy answers must have a triage and quality plan before generation.
8. Agent activity must be truthful. Show queued/running/completed/degraded status, not decorative "thinking" states.
9. Every launch-critical path needs a local verification gate and a live verification gate.

## Phase 0 - Finish GitHub-Main Deploy Proof

Goal: every production deploy to `praxis.tacitus.me` is traceable to GitHub `main`.

Status: complete for the frontend path as of 2026-05-26. Keep the full-stack
trigger as the heavier backend/infrastructure deploy path.

Tasks:

- Complete GitHub OAuth for Cloud Build connection `projects/praxisbytacitus/locations/us-central1/connections/praxis-github`.
- Register repository `sargonxg/A4_PRAXIS_CLOUD_Work` with that Cloud Build connection.
- Create `frontend-main-on-push` trigger from `cloudbuild.frontend.yaml`.
- Create `full-main-on-push` trigger from `cloudbuild.yaml` for backend/pgbouncer/full-stack changes.
- Trigger or wait for a `main` build from the current commit.
- Verify Cloud Build source repo, branch, and commit.
- Verify Cloud Run latest ready revision uses the commit-tagged image.
- Verify `https://praxis.tacitus.me/api/health/runtime` exposes the same source commit.

Acceptance:

- `git rev-list --left-right --count origin/main...HEAD` is `0 0`.
- GitHub Actions pass on the latest `main`.
- Cloud Build trigger run succeeds from GitHub `main`.
- Runtime health `build.commit` matches GitHub `main` HEAD.
- Manual deploy path is documented as fallback only.

## Phase 1 - Production Data-Plane Audit

Goal: prove the stores behind PRAXIS work together before public sharing.

### Cloud SQL Postgres

Check:

- AgentRun tables exist and are reachable: agents, agent_runs, agent_run_events, tool_calls, approvals, agent_triggers.
- Worker can create, update, and complete a synthetic AgentRun.
- Tool-call rows keep status, arguments, result summaries, error summaries, and timestamps.
- Approvals are explicit for risky actions: external export, graph mutation, unsupported claim acceptance, browser/write actions.
- Runtime health reports SQL/agent ledger status without leaking credentials.

Fix if needed:

- Add a no-write or disposable write canary for AgentRun lifecycle.
- Add a same-thread Ask-to-AgentRun proof test.

### Firebase / Firestore

Check:

- Firebase Auth gates authenticated Ask, capsule, memo, and settings routes.
- Firestore rules protect owner-scoped objects.
- Firestore indexes support conversation, capsule, memo, output-capsule, source, and context-stack queries.
- Conversation turns persist through `/api/conversations/[conversationId]/turns`.
- ContextCapsules persist in the canonical user/workspace collections.

Fix if needed:

- Add missing indexes/rules before adding new query patterns.
- Add authenticated browser smoke using the disposable test Firebase user.

### ContextCapsule Repository

Check:

- Starter/catalog integrity passes.
- Existing conflict/policy capsules are discoverable by domain, geography, actor, phase, source posture, and readiness.
- Active capsule context is visible before Ask.
- Weak context states are plain: ready, thin, missing sources, stale sources, needs review.
- Capsule suggestions from answers can be reviewed before becoming canonical.
- Capsule version/history is preserved.

Fix if needed:

- Add capsule health score and "ask with this capsule" flows inside the existing Ask/workbench surface.
- Add source-gap capture from weak answers.

### Cognee / Graph Layer

Check:

- Cognee configuration is explicit: configured, unavailable, or intentionally disabled.
- Graph enrichment is review-gated and cannot silently overwrite canonical ContextCapsules.
- Graph proposals link back to source receipts.
- Health surfaces distinguish "optional graph unavailable" from core runtime failure.

Fix if needed:

- Add a Cognee readiness probe or admin-only diagnostic card.
- Add graph-proposal review states before promotion.

### Documents, Sources, And Storage

Check:

- Document upload, retrieval, chunk/source preview, and memo handoff still use canonical routes.
- Source cards include provenance and do not overclaim unsupported evidence.
- Large document/source workflows degrade gracefully.

Fix if needed:

- Add sourceability repair actions directly under the answer.

## Phase 2 - Make Ask PRAXIS A Conversation Window

Goal: the main user experience is one simple conversation.

Tasks:

- Keep `TaskletPraxisWorkbench` as the canonical surface.
- Convert the useful `AskStreamPanel` pattern into reusable Ask message/status/artifact components.
- Render each turn as:

```text
User prompt
PRAXIS status rail
Assistant answer
Quality/source/tool/capsule chips
Inline suggestions
Artifact preview when produced
```

- Collapse receipts by default while keeping them one click away.
- Put long answers, tables, evidence annexes, and memos in the same conversation work panel.
- Keep deep links to agent runs and Memo Studio, but do not navigate away by default.

Acceptance:

- Authenticated Ask uses `/api/conversations/[conversationId]/turns`.
- A saved conversation reloads in the same surface.
- Agent status, sources, artifacts, and capsule suggestions render in the same thread.
- Mobile uses a bottom sheet/work panel, not a second page.

## Phase 3 - Add An AskTurnPlan Before Generation

Goal: every non-trivial answer has a clear plan before the model writes.

Create a shared plan contract:

```ts
type AskTurnPlan = {
  intent: 'quick_answer' | 'policy_research' | 'conflict_analysis' | 'source_check' | 'memo' | 'handover' | 'capsule_build';
  complexity: 'simple' | 'standard' | 'deep' | 'multi_agent';
  answerShape: 'short_answer' | 'research_memo' | 'table' | 'evidence_annex' | 'briefing' | 'handover_pack' | 'output_capsule';
  requiredTools: string[];
  requiredAgents: string[];
  qualityBar: string[];
  statusRail: string[];
  artifactPlan: string[];
  continuationPolicy: 'complete_now' | 'offer_deep_run' | 'queue_agent' | 'ask_for_sources' | 'needs_human_review';
};
```

Implementation:

- Centralize triage across `ask-orchestrator`, `tacitus-routing-policy`, and the work-intent router.
- Start deterministic and testable.
- Add a typed evaluator later for hard prompts, not as the first dependency.
- Persist the selected plan in the answer envelope and AgentRun ledger.

Acceptance:

- Long answers declare whether they need a table, memo, evidence annex, source repair, or agent run.
- Deep/current/source-heavy prompts queue the right agent or explain why they cannot.
- UI shows a friendly version of the plan as status updates, not technical routing internals.

## Phase 4 - Same-Thread AgentRun Proof

Goal: agentic work is visible where the user asked the question.

Tasks:

- Ensure `/api/ai/chat` and `/api/conversations/[conversationId]/turns` attach queued AgentRuns to the same conversation turn.
- Improve `/api/agents/runs/[runId]/stream` from snapshot polling toward live event streaming or disciplined polling.
- Render queued, running, tool-call, waiting-for-approval, completed, failed, and degraded events as message parts.
- Append completion cards: memo, evidence annex, sourceability review, red-team note, output capsule, or handover package.
- Add an authenticated same-thread canary.

Acceptance:

- A deep Ask prompt visibly queues an AgentRun.
- The run updates in the same conversation.
- The finished artifact links back to sources, capsule ids, and tool calls.
- Runtime health and local audit agree on whether worker/ledger are configured.

## Phase 5 - Quality Triage And Evaluator

Goal: PRAXIS should know when a "good answer" needs more than one model response.

Tasks:

- Add `answerQualitySummary` as the compact answer boundary contract.
- Add `contextRepairActions` for missing/stale/thin sources.
- Add `agenticDepthRecommendation` for prompts that merit deeper work.
- For long/high-stakes answers, run a quality pass that checks:
  - source count and source diversity;
  - unsupported claims;
  - caveats and uncertainty;
  - table/evidence-annex need;
  - policy/conflict analysis dimensions;
  - whether a red-team/sourceability agent should run.
- Surface quality as plain chips: sources, weak claims, needs review, table ready, memo draft, deeper run available.

Acceptance:

- The user sees the answer first.
- The user also sees why PRAXIS thinks the answer is ready, thin, or worth deepening.
- Unsupported claims never look equivalent to sourced claims.

## Phase 6 - Tools And Artifacts

Goal: make PRAXIS useful beyond chat without making the app complicated.

Priority tools:

- `context-resolve`
- `capsule-evidence-pack`
- `sourceability-reviewer`
- `document-retrieve`
- `grounded-search`
- `deep-search-agent`
- `policy-memo`
- `memo-formatter`
- `red-team-review`
- `boardroom-deliberation`
- `handover-package`
- `output-capsule-save`
- `graph-mutation` with review gate
- `external-export` with review gate

Priority artifacts:

- source table;
- actor/stakeholder table;
- conflict timeline;
- policy options memo;
- evidence annex;
- risk register;
- red-team note;
- handover pack;
- OutputCapsule.

Acceptance:

- The answer can produce tables and artifacts in-thread.
- High-risk tools require approval.
- Artifact cards include source and capsule provenance.

## Phase 7 - ContextCapsule Moat

Goal: make the context repository the reason PRAXIS beats a generic LLM.

Tasks:

- Improve capsule browse/search/attach inside the existing Ask/workbench flow.
- Support large numbers of conflict and policy capsules with simple filters.
- Add "Ask with this capsule" and "Compare these capsules" actions.
- Add capsule health/readiness and source-gap repair.
- Add capsule lineage: source receipts, answer spans, graph proposals, and version history.
- Keep user review before capsule promotion.

Acceptance:

- A new user can find a relevant capsule and ask with it quickly.
- A power user can inspect why the capsule is trustworthy.
- PRAXIS can create suggested capsule updates, but cannot silently rewrite canonical context.

## Phase 8 - Public Launch Hardening

Goal: safe public sharing with honest runtime proof.

Tasks:

- Run authenticated browser smoke for login, Ask, saved conversation reload, capsule attach, source preview, memo/artifact handoff, and same-thread agent run.
- Run local gates:
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run lint`
  - `npm run audit:repo-shape`
  - `npm run audit:gate`
  - `npm run audit:architecture-reference`
  - `npm run audit:gcp`
  - `npm run audit:ask-same-window-contract`
  - `npm run audit:ask-cockpit-runtime`
  - `npm run audit:agent-process-contract`
  - `npm run audit:agent-runtime-proof`
  - `npm run audit:runtime-health-live`
  - focused Vitest for touched contracts.
- Run live gates:
  - `/`
  - `/login`
  - `/app`
  - `/api/health`
  - `/api/health/runtime`
  - `/api/health/agentic-search`
  - authenticated Ask/capsule canary.
- Verify rate limits, cost gates, AI route calibration, upload bounds, and secret handling.
- Verify rollback path and incident owner notes.
- Align public copy with actual stack and runtime status.

Acceptance:

- Public routes work unauthenticated where intended.
- Authenticated work paths pass with a test user.
- No public copy claims a capability that runtime health or tests cannot support.
- Production health distinguishes core failures from optional degraded integrations.

## What I Would Do Next, In Order

1. Finish Cloud Build GitHub OAuth and create the `main` triggers.
2. Run a GitHub-triggered frontend deploy and verify runtime health exposes the latest `main` commit.
3. Add the authenticated same-thread Ask-to-AgentRun canary.
4. Implement the same-window Ask conversation component consolidation.
5. Add `AskTurnPlan` and deterministic triage.
6. Add answer quality summary, context repair actions, and agentic depth recommendation.
7. Add compact in-thread status/proof UI for agent runs and tool calls.
8. Harden ContextCapsule browse/search/attach and source-gap repair.
9. Add Cognee/graph readiness diagnostics with non-authoritative review gates.
10. Run the full public-launch gate and update `docs/launch/CANARY_LOG.md`.

## Launch Score Target

Target before public sharing: 85/100 production readiness.

Current expected cap until Phase 0 completes: 84/100, because the app can be live and healthy while deploy provenance is not yet proven from GitHub `main`.

Current expected cap until same-thread agent proof is verified: 84/100, because agentic value is present but not fully proven in the primary user flow.

Current expected cap if authenticated Ask/capsule canaries are missing: 84/100, because the launch-critical path has not been tested end to end.
