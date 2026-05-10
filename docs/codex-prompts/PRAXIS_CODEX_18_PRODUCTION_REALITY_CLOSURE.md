# PRAXIS — Codex Pack 18: Production Reality Closure

**File**: `PRAXIS_CODEX_18_PRODUCTION_REALITY_CLOSURE.md`
**Branch**: `feature/production-reality-closure`
**Depends on**: All prior packs merged (03–17). v1.0.0 NOT yet tagged. This is the pack that earns the tag.
**Estimated effort**: ~10 days (~80 engineering hours).
**Target release**: v1.0.0 (this pack closes the launch gate)
**Voice**: Senior release engineer who has shipped real products. Knows that "audit says green" and "feature works" are different bars. Closes the gap between the architecture bible's claims and the live app's behavior, item by item, with evidence.

---

## 0. Why this pack exists

Codex executed packs 03–17 and produced a substantial codebase: a Next.js workbench, a 20-tool marketplace registry, ten canonical persona specs, deterministic boardroom scaffolding, ACH workbench surface, ingestion pipelines, GCP infrastructure scripts, a self-audit that surfaced 45 findings (3 S0 / 15 S1 / 20 S2 / 5 S3), and a Pack 16 gap audit that catalogued ten missing items. The product is real. It boots. It deploys. It is **not yet v1.0.0** under the master charter's launch contract.

The current state is a **launch foundation**, not a launch. The architecture bible promises ten concrete things that the live app cannot yet demonstrate end-to-end:

1. Public read-only `/demo/syria-2024` available without sign-in.
2. Persona suites green for ten consecutive CI runs.
3. Canonical entry routes (`/waitlist`, `/login/callback`, `/legal/{privacy,terms,security,data-retention}`) resolving by contract.
4. Production context/storage parity (User → Workspace → Case → Conversation round-trip with evidence).
5. Two-phase Firestore↔Postgres commit with reconciler and crash-injection proof.
6. Structural firewall enforced on every graph write path, AST-verified.
7. Synthesized review queue for Source Augmenter and Memo Drafter candidates.
8. The 16 marketplace tools producing **specialist outputs** (model-backed handlers), not generic prompt-contract scaffolds.
9. `cross.memo-create` and `cross.memo-refresh` registered as first-class marketplace tools.
10. Live Agent Engine deployments for the four base subagents (Context Preparer, Source Augmenter, Output Refiner, Memo Drafter) plus pack 15's `red_team_analyst` and pack 16's `analyst_persona` + `moderator` — seven runtimes, all eval-fresh, all Cloud Trace–covered, all cost-tracked.

This pack closes those ten gaps. It does not add features. It earns evidence. After this pack ships, the architecture bible's claims and the live app's behavior agree, and the v1.0.0 tag is honest.

The order is deliberate. The structural fixes (review queue, firewall coverage, two-phase commit) come first because everything else is built on top of them. The Agent Engine deployments come next because the boardroom and the specialist tool handlers depend on them. The marketplace specialist handlers come third because they are the user-visible output quality. The route/landing/demo work comes fourth because it is the public face. The persona CI green streak comes last because it depends on all of the above being real.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | `/demo/syria-2024` is signed-out, read-only, watermarked; passes Lighthouse (≥92 desktop) + axe (100); 30s comprehension test green | E2E `tests/e2e/demo/public-demo-readonly.spec.ts` 5/5 green |
| 2 | Canonical entry routes (`/waitlist`, `/login/callback`, `/legal/{privacy,terms,security,data-retention}`) all return 200 by contract | `audit:routes` extended to assert these routes; CI green |
| 3 | Two-phase commit reconciler implemented; crash-injection test proves Firestore↔Postgres recovery; nightly drift verifier reports zero drift on staging | `pytest backend/tests/test_two_phase_commit.py` green; `npm run audit:kg-drift -- --env=staging` reports 0 drift across 7 nights |
| 4 | Structural firewall wraps every graph-write API (AST audit fails on bypass); coverage proven by AST-based `audit:firewall-coverage` | `audit:firewall-coverage` extended to AST scan all `*POST*` routes that touch graph; reports 100% coverage |
| 5 | Synthesized review queue: Source Augmenter and Memo Drafter candidates persisted to `users/{uid}/situations/{caseId}/review-queue/`, surfaced in workbench, accepted/rejected through firewall | `tests/e2e/workbench/review-queue.spec.ts` green |
| 6 | Production context/storage parity proven: synthetic staging user round-trips User + Workspace + Case + Conversation; evidence committed to `docs/audits/2026-NN-NN-CONTEXT_STORAGE_PARITY.md` | Audit doc with per-layer round-trip evidence; reproducible from `scripts/smoke-context-parity.ts` |
| 7 | All 7 subagents deployed to Vertex AI Agent Engine (4 base + red_team_analyst + analyst_persona + moderator); each has fresh eval (≤7 days); each has Cloud Trace span tree on a sample invocation | `audit:subagent-deployment-fresh` extended to enforce the 7; `audit:subagent-eval-fresh` enforces eval freshness; trace samples committed to `docs/audits/2026-NN-NN-SUBAGENT_TRACE_EVIDENCE.md` |
| 8 | Persona corpus real ingestion: `persona_corpus_chunks` migration applied; 10 canonical corpus manifests on disk with 15-25 entries each; ingestion script produces real pgvector chunks; retriever returns real similarity scores (not deterministic fallback) | `pytest backend/tests/test_persona_corpus_real.py` green; sample retrieval shows non-fallback similarities |
| 9 | All 16 v1 marketplace tools have model-backed handlers (not prompt-contract scaffolds); each tool's canary fixture is an executable test asserting schema + semantic checks | `audit:tool-canary-executable` (new) green for all 16; `pytest backend/tests/test_tool_handlers.py` green |
| 10 | `cross.memo-create` and `cross.memo-refresh` registered with v2 contract, SKILL.md, model-backed handler, canary | Tool registry shows 22 tools (20 prior + 2 memo); `audit:tool-marketplace` green |
| 11 | Persona CI green streak: 4 persona suites (Diplomat-Syria, Mediator-Northwind, Analyst-Sahel, Researcher-Nordalia) green for 10 consecutive CI runs on `main` | Green-streak ledger at `docs/audits/persona-green-streak.md` shows 10 entries |
| 12 | Production deploy follows canary 5→25→100 protocol with timestamps; evidence committed to `docs/launch/CANARY_LOG.md` | Canary log shows phase timestamps; `audit:canary-log-fresh` green |
| 13 | Cloud SQL HA + 30-day PITR or owner-approved ADR explaining cost/risk deferral | Either HA+PITR active in `gcloud sql instances describe` evidence, or `docs/adr/0029-cloud-sql-posture-deferral.md` with Giulio's signature |
| 14 | Embeddings dimensionality drift resolved: `graph_embeddings` schema has both legacy 1536-dim column and new 768-dim column for `text-embedding-005`; cutover migration plan committed | Migration `0012_embeddings_v2.py` applied on staging; `audit:embeddings-v2-coverage` green |
| 15 | Master Charter §1 status table updated: every pack 03-17 row green or owner-deferred-with-ADR; v1.0.0 tag pre-conditions documented | `audit:master-charter` green; `docs/launch/PRODUCTION_READINESS.signed.md` exists |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 18. I understand:
> 1. **This pack closes the v1.0.0 launch gate.** It does not add features. Every prompt below replaces a scaffold with a real implementation, replaces a prompt-contract with a model-backed handler, or produces evidence the architecture bible already claims.
> 2. **Order matters.** Structural fixes (R1 review queue, R2 firewall coverage, R3 two-phase commit) come before Agent Engine work (R4) because synthesized candidates need a queue to land in. Agent Engine deployments (R4) come before specialist tool handlers (R5) because the handlers invoke subagents. Specialist handlers come before persona CI (R10) because the personas exercise the handlers end-to-end. Route/landing/demo work (R7) is parallelizable with R5.
> 3. **Evidence is committed to the repo.** Every claim in §1 has a counterpart audit doc, log file, or test fixture committed. "Audit says green" must be a re-runnable script, not a verbal statement.
> 4. **Architecture invariants from the bible (§3) are inviolable.** ACO substrate unchanged. Four-layer context unchanged. ContextProvider-only access. Symbolic firewall enforced on every write. No new model strings outside `MODEL_MATRIX.json`. No new tool that bypasses the v2 contract. No new subagent that doesn't deploy to Agent Engine.
> 5. **The four-phase pattern applies to every prompt.** Read & report → Propose & confirm → Execute → Verify. I will not proceed past Propose without Giulio's "proceed [section]".
> 6. **Cost discipline.** This pack's GCP burn estimate: $400-600 across staging deploys, eval re-runs, and the canary phases. Budget approved before R4 begins.
> 7. **Persona CI is the final gate.** No v1.0.0 tag without 10 consecutive green runs of the four persona suites on `main` post-merge.
>
> Open questions for Giulio:
> - **Q1**: Cloud SQL posture — propose: enable HA + 30-day PITR on staging immediately ($120/month delta vs zonal); production HA gated on Giulio's cost approval. If approval is "defer to v1.1," produce ADR 0029 with cost/risk and proceed. Acceptable?
> - **Q2**: Specialist handler rollout strategy — propose: implement model-backed handlers in two waves of 8 tools each, gated behind `TOOL_HANDLER_VERSION=specialist|prompt-contract` env flag, defaulting to specialist on staging and prompt-contract in production until canary canary canary covers. Acceptable, or full cutover at once?
> - **Q3**: Persona CI green streak — the four persona suites need to actually run on every PR to `main`. Propose: GitHub Actions workflow `persona-suites.yml` triggered on push to main; record green-streak counter in repo at `docs/audits/persona-green-streak.md`; reset to 0 on any red run. Acceptable?
> - **Q4**: Public demo data — propose: ship `/demo/syria-2024` reading from a static JSON snapshot at `src/lib/cases/syria-2026/demo-snapshot.json` rather than hitting Postgres (eliminates leak risk; faster page load). Snapshot regenerated weekly via `scripts/regenerate-demo-snapshot.ts` from staging Postgres. Acceptable?
> - **Q5**: Synthesized review queue UI — propose: new tab `/app/workbench/[caseId]/review-queue` with a card list of pending candidates, accept/reject buttons, full provenance. When accepted, candidate flows through the firewall as a normal user-asserted node. Acceptable, or different UI placement (e.g., review queue items inline in graph tab)?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| R1 | Synthesized review queue: schema, persistence, workbench UI, firewall integration | 8 |
| R2 | Structural firewall AST coverage audit — proves wrapper is on every graph-write route | 4 |
| R3 | Two-phase Firestore↔Postgres commit reconciler + crash-injection proof | 6 |
| R4 | Deploy 7 subagents to Vertex AI Agent Engine; eval fresh; trace evidence | 12 |
| R5 | Wave-1 specialist handlers (8 tools) — replace prompt-contract scaffolds with model-backed handlers | 12 |
| R6 | Wave-2 specialist handlers (8 tools + memo-create + memo-refresh) | 14 |
| R7 | Public demo + canonical entry routes + landing CTA closure | 8 |
| R8 | Persona corpus real ingestion (canonical corpora, pgvector chunks, real retrieval) | 6 |
| R9 | Embeddings v2 cutover (768-dim alongside 1536-dim during transition) | 4 |
| R10 | Persona CI green streak workflow + canary deploy + production readiness sign-off | 6 |
| **Total** | | **~80** |

---

## 4. Hard rules

- **No new code outside the existing canonical surfaces.** This pack closes gaps; it does not add tabs, routes, ontologies, or marketplace categories. Surface additions go in pack 19+.
- **Every promoted-to-graph synthesized candidate routes through the symbolic firewall.** Bypass is a contract violation, AST-caught.
- **Specialist handlers consume `ContextProvider` only.** Direct Firestore/Postgres reads from a handler are CI failures.
- **Subagent invocations enforce the per-call cost ceiling at the runtime, not the application.** If the runtime ceiling fires, the handler returns the partial output with a `costGuardFired: true` field, never crashes.
- **Real-data retrieval replaces all deterministic fallbacks in production paths.** Fallbacks remain for offline-development convenience but are gated by `process.env.NODE_ENV === 'development'`.
- **Persona CI is mandatory.** Ten consecutive green runs of all four suites on `main` is the final gate. Reset on any red run. Tracked in repo.
- **All prior invariants from packs 03-17 hold.** ACO substrate, four-layer context, owner scoping, two-phase commit, model strings only in providers, tool contract v2, every tool has a SKILL.md, every subagent has an eval set.

---

## 5. Prompt R1 — Synthesized review queue

### Persona
Backend + frontend engineer who knows that the difference between "AI that proposes" and "AI that decides" is whether the user has a queue they can accept or reject from.

### Phase 1 — Read & report

- Inspect existing Firestore writers in `src/lib/firebase/`, `backend/services/firestore_sync.py`, and any path under `backend/agents/source_augmenter/` and `backend/agents/memo_drafter/` that produces structured candidates today.
- Output `docs/audits/2026-NN-NN-REVIEW_QUEUE_PLAN.md` listing every code path that currently writes synthesized candidates and where they land (Firestore? lost? in-memory only?).

### Phase 2 — Propose & confirm

Schema:

```ts
// src/types/review-queue.ts
export interface ReviewQueueItem {
  id: string;
  caseId: string;
  ownerUid: string;
  source: {
    kind: 'source-augmenter' | 'memo-drafter' | 'red-team-analyst' | 'analyst-persona' | 'tool-handler';
    runId: string;                              // links to the originating run
  };
  proposalKind: 'graph-node' | 'graph-edge' | 'memo-block' | 'frame-update';
  payload: GraphNodeProposal | GraphEdgeProposal | MemoBlockProposal | FrameUpdateProposal;
  confidence: number;                            // capped at 0.6 per firewall rule
  synthesized: true;                             // always true for items in this queue
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  reviewedAt?: string;
  reviewedBy?: string;                           // user uid; system on auto-expire
  reviewNote?: string;
}
```

Persistence:
- Firestore at `users/{uid}/situations/{caseId}/review-queue/{itemId}` (owner-scoped per the bible's §3.3).
- TTL: items not reviewed in 30 days expire to `status='expired'` via Cloud Scheduler nightly job.

Workbench surface at `/app/workbench/[caseId]/review-queue`:
- Card list, latest first, grouped by `source.kind`.
- Each card shows the proposal payload, confidence, originating run link.
- Accept routes the proposal through the firewall as a user-asserted candidate (which can promote to `Verdict` if firewall validations pass; otherwise stays at `Claim` per truth-layer rules).
- Reject persists rejection with optional note (improves future suggestions).
- Bulk accept/reject for items above a confidence threshold (with confirmation modal).

Wait for sign-off.

### Phase 3 — Execute

- Author types in `src/types/review-queue.ts` (Zod) + Pydantic mirror.
- Author Firestore rules block for the new collection.
- Author API routes: `GET /v1/cases/{caseId}/review-queue`, `POST /v1/cases/{caseId}/review-queue/{itemId}/accept`, `POST .../reject`.
- Author the workbench page.
- Refactor every existing synthesized-candidate path to write to the queue:
  - `backend/agents/source_augmenter/runner.py` outputs land in the queue, not directly in graph.
  - `backend/agents/memo_drafter/` synthesized graph augmentations land in the queue.
  - Boardroom synthesis claim "promote" buttons (already wired to the queue conceptually) write real queue entries.
- Author Cloud Scheduler nightly TTL expiry job at `infrastructure/scheduler/review-queue-ttl.tf`.
- Author `tests/e2e/workbench/review-queue.spec.ts`.

### Phase 4 — Verify

- For each synthesized-candidate source, generate a candidate, verify it lands in the queue with `status='pending'`, accept it via UI, verify it lands in graph with proper firewall validation.
- TTL test: synthetic candidate aged 31 days → cron fires → marked expired.
- Owner-scoping: cross-tenant access returns 403.

### Files to create / edit

- `src/types/review-queue.ts`, `backend/types/review_queue.py`.
- `firestore.rules` — extend.
- `src/app/api/cases/[caseId]/review-queue/...` — three routes.
- `src/app/app/workbench/[caseId]/review-queue/page.tsx`.
- `src/components/review-queue/ReviewCard.tsx`.
- `infrastructure/scheduler/review-queue-ttl.tf`.
- Refactor in `backend/agents/source_augmenter/`, `backend/agents/memo_drafter/`, `backend/services/boardroom_*.py`.
- `tests/e2e/workbench/review-queue.spec.ts`.

---

## 6. Prompt R2 — Structural firewall AST coverage audit

### Persona
Static-analysis engineer. Knows that "audit:firewall-coverage" passing today means it tested whatever it happens to test, not that the firewall is on every write path.

### Phase 1 — Read & report

- Inspect current `scripts/audit-firewall-coverage.ts`.
- Inventory every API route under `src/app/api/` that produces a graph mutation (extracts that to a CSV at `docs/audits/2026-NN-NN-GRAPH_WRITE_ROUTES.csv`).
- Inventory every `backend/routers/` endpoint that produces a graph mutation.

### Phase 2 — Propose & confirm

Rewrite `audit:firewall-coverage` as an AST-based audit:

```ts
// scripts/audit-firewall-coverage.ts (rewrite)
// Walk src/app/api/**/route.ts and backend/routers/*.py.
// For each handler that POST/PUT/PATCH/DELETE and references the
// graph repositories or Firestore graph collections:
//   - Verify it imports and calls the firewall wrapper.
// Fail with file:line list of bypasses.
```

Rule: every mutating handler that touches the graph must import from `src/lib/firewall/structural` (or `backend/firewall/structural`) and the firewall function must be called before the mutation occurs.

Wait for sign-off on which routes are exempt (e.g., admin-only repair tools may have a documented bypass with an explicit `// firewall:exempt-reason=...` comment).

### Phase 3 — Execute

- Rewrite the audit script with `ts-morph` (TypeScript) and `ast` (Python).
- Run against the codebase. Surface initial bypass list.
- Add firewall wrapper calls to every uncovered path.
- Re-run. Confirm 100% coverage.
- Add the audit to `audit:gate`.

### Phase 4 — Verify

- AST audit reports 100% coverage (or all bypasses tagged with documented exemption comments).
- Synthetic test: deliberately remove a firewall call → audit fails → restore → audit passes.

### Files to create / edit

- `scripts/audit-firewall-coverage.ts` — full rewrite.
- `docs/audits/2026-NN-NN-GRAPH_WRITE_ROUTES.csv`.
- Multiple route files — add firewall wrappers where missing.

---

## 7. Prompt R3 — Two-phase commit reconciler + crash-injection proof

### Persona
Distributed-systems engineer. Knows the design pattern only matters if the reconciler exists and the crash test passes.

### Phase 1 — Read & report

- Map every code path that writes to both Firestore and Postgres (graph nodes, graph edges, situations, runs, memos).
- For each, document the current pattern: is it sequential? Atomic? Compensating?
- Output `docs/audits/2026-NN-NN-TWO_PHASE_COMMIT_INVENTORY.md`.

### Phase 2 — Propose & confirm

Pattern:

```python
# backend/services/atomic_commit.py
async def in_transaction(session, ...):
    """
    1. Stage Firestore doc with status='pending', proposalId hash for idempotency.
    2. Postgres write (idempotent on proposalId).
    3. Mark Firestore status='committed'.

    Crash between any two: reconciler runs every 6h:
    - Find Firestore status='pending' older than 10min.
    - Check Postgres for proposalId. If present: mark Firestore committed.
    - If absent: roll Firestore back to deleted.
    """
```

Reconciler at `backend/services/two_phase_reconciler.py`, scheduled hourly via Cloud Scheduler.

Crash-injection test at `backend/tests/test_two_phase_commit.py`:
- Inject crash between Firestore stage and Postgres write → reconciler rolls Firestore back.
- Inject crash between Postgres write and Firestore commit → reconciler completes Firestore commit.
- Idempotent re-run: same proposalId never produces duplicate Postgres row.

Wait for sign-off.

### Phase 3 — Execute

- Author the atomic_commit module.
- Author the reconciler.
- Author the crash-injection test.
- Refactor every dual-write path to use the atomic_commit pattern.
- Schedule the reconciler.
- Wire drift verification: nightly job that compares Firestore↔Postgres counts and surfaces divergence in the diagnostics dashboard.

### Phase 4 — Verify

- `pytest backend/tests/test_two_phase_commit.py` green.
- Nightly drift verifier reports zero drift on staging for 7 consecutive nights.
- Crash-injection test simulates each of the 3 failure modes; reconciler recovers each.

### Files to create / edit

- `backend/services/atomic_commit.py`.
- `backend/services/two_phase_reconciler.py`.
- `backend/tests/test_two_phase_commit.py`.
- `infrastructure/scheduler/two-phase-reconciler.tf`.
- Refactors in graph repositories, situation repositories, memo repositories.

---

## 8. Prompt R4 — Deploy 7 subagents to Vertex AI Agent Engine

### Persona
ML/agent engineer. Knows that "deployed" means "live on Agent Engine, eval-fresh, Cloud-Trace-covered, cost-tracked," not "the Python file exists."

### Phase 1 — Read & report

- Inspect current `backend/agents/deploy.py` (deploys deep_research only).
- For each of the 7 subagents (context_preparer, source_augmenter, output_refiner, memo_drafter, red_team_analyst, analyst_persona, moderator), inspect:
  - Does the LangGraph build correctly? (`graph.py`)
  - Is the system prompt committed?
  - Is the output schema validated?
  - Is the eval set committed with fresh timestamp?
- Output `docs/audits/2026-NN-NN-SUBAGENT_DEPLOYMENT_INVENTORY.md`.

### Phase 2 — Propose & confirm

Extend `backend/agents/deploy.py` to deploy all seven:

```python
# backend/agents/deploy.py (extended)
SUBAGENTS = [
    SubagentDeploy('context_preparer', 'balanced'),       # gemini-3-flash
    SubagentDeploy('source_augmenter', 'balanced'),
    SubagentDeploy('output_refiner', 'writing_quality'),  # claude-opus-4.7@vertex
    SubagentDeploy('memo_drafter', 'writing_quality'),
    SubagentDeploy('red_team_analyst', 'writing_quality'),
    SubagentDeploy('analyst_persona', 'writing_quality'),
    SubagentDeploy('moderator', 'balanced'),
]
```

Each gets:
- LanggraphAgent resource with sessions=`vertex`, memory_bank scope=`per-user`.
- Per-call cost ceiling (declared in `MODEL_MATRIX.json` per task kind).
- Cloud Trace propagation via OpenTelemetry.
- Stored deployment metadata at `infrastructure/agent-engine-deployments.json` (engine ids, versions, deployment timestamps).

Eval freshness gate: `audit:subagent-eval-fresh` checks that each subagent's eval `last_run.json` is ≤ 7 days old AND pass rate ≥ 80%.

Wait for sign-off on the cost ceilings and the deployment region (`us-central1`).

### Phase 3 — Execute

- Run `bash scripts/deploy-subagents-staging.sh` deploying all 7.
- Run each subagent's eval against staging; commit `last_run.json` per subagent.
- Capture sample Cloud Trace span trees for one invocation each; commit to `docs/audits/2026-NN-NN-SUBAGENT_TRACE_EVIDENCE.md`.
- Update `infrastructure/agent-engine-deployments.json` with the 7 engine ids.
- Wire `ContextProvider.subagent()` to dispatch by id to the correct deployment.

### Phase 4 — Verify

- `audit:subagent-deployment-fresh` reports 7/7 fresh.
- `audit:subagent-eval-fresh` reports 7/7 ≥ 80%.
- Sample trace tree shows: inbound HTTP → Cloud Run handler → Agent Engine call → LangGraph node sequence → Vertex AI model call → return. End-to-end one trace_id.
- Cost telemetry: per-invocation cost recorded to BigQuery audit collection.

### Files to create / edit

- `backend/agents/deploy.py` — extend.
- `infrastructure/agent-engine-deployments.json` — committed.
- `infrastructure/deploy-agent-engine.sh` — extend for all 7.
- `scripts/audit-subagent-deployment-fresh.ts`.
- `scripts/audit-subagent-eval-fresh.ts`.
- `docs/audits/2026-NN-NN-SUBAGENT_TRACE_EVIDENCE.md`.
- Each `backend/agents/<id>/eval/last_run.json` (committed evidence file).

---

## 9. Prompt R5 — Wave-1 specialist handlers (8 tools)

### Persona
Tool-handler engineer. Knows that "prompt-contract" means "the prompt exists" and "specialist" means "the handler invokes the right subagent and returns structured output."

### Wave-1 tools (highest leverage first)

1. `cross.contradiction-finder` — invokes context_preparer + complex_reasoning task kind
2. `mediation.position-vs-interest` — invokes context_preparer + memo_drafter for narrative
3. `mediation.zopa-finder` — invokes context_preparer + complex_reasoning
4. `mediation.mediation-brief` — invokes memo_drafter directly
5. `governance.coalition-map` — invokes context_preparer + complex_reasoning
6. `cross.scenario-projector` — invokes complex_reasoning with `long_context` if input > 50k tokens
7. `cross.brief-exporter` — invokes memo_drafter
8. `cross.context-health-explainer` — invokes balanced

### Per-tool implementation pattern

```ts
// src/lib/tools/marketplace/handlers/<tool-id>.ts
import { handlerContract } from './contracts';
import type { ContextProvider } from '@/lib/tools/context-provider';

export async function handler(input: ToolInput, ctx: ContextProvider): Promise<ToolOutput> {
  const userContext = await ctx.user();
  const caseGraph = await ctx.graph();
  const prepared = await ctx.subagent('context_preparer', { /* spec from contract */ });

  const analysis = await ctx.subagent('output_refiner', {
    raw: await invokeSpecialistReasoning(prepared, caseGraph, input),
    style: userContext.preferences.communicationStyle,
  });

  await ctx.log({ kind: 'tool_specialist_run', toolId: '<tool-id>' });
  return { /* schema-validated output */ };
}
```

Each handler gets a canary fixture test that asserts:
- Output schema-conformant.
- Output contains the structural fields the SKILL.md promises.
- Output cites case-graph nodes (no fabricated citations).
- Cost recorded.
- Latency under estimatedRuntimeMs * 1.5.

### Phase 4 — Verify

- Each of the 8 tools' canary test green.
- Persona suites green (they exercise these tools).
- Cost telemetry shows per-tool cost in dashboard.

### Files to create / edit

- `src/lib/tools/marketplace/handlers/<tool-id>.ts` × 8.
- `tests/tools/handlers/<tool-id>.spec.ts` × 8.
- `src/lib/tools/marketplace/runner.ts` — extend to dispatch to the new handlers when `TOOL_HANDLER_VERSION=specialist`.

---

## 10. Prompt R6 — Wave-2 specialist handlers (8 tools + 2 memo)

### Outcome

The remaining 8 tools get model-backed handlers, plus `cross.memo-create` and `cross.memo-refresh` are registered as first-class marketplace tools.

### Wave-2 tools

9. `conflict.leverage-trace`
10. `conflict.commitment-check`
11. `conflict.escalation-timeline`
12. `governance.veto-probability`
13. `governance.mandate-traceback`
14. `narrative.frame-cascade`
15. `narrative.counter-narrative-finder`
16. `narrative.fact-check-traceback`

### Memo tools

17. `cross.memo-create` — invokes memo_drafter to create a new memo from case context with chosen template
18. `cross.memo-refresh` — invokes memo_drafter to refresh an existing memo's auto-populated sections from current graph state

Same pattern as R5. Each memo tool registered in `src/lib/tools/marketplace/registry.ts` with v2 contract, SKILL.md at `skills/tools/<id>/SKILL.md`, canary test, and persona-suite coverage.

### Phase 4 — Verify

- 16 + 2 = 18 tools, all model-backed, all canaries green.
- Tool count audit asserts 22 (16 + 4 SAT + 2 memo).
- Persona suites green.

---

## 11. Prompt R7 — Public demo + canonical entry routes + landing CTA

### Persona
Frontend engineer + product designer. Knows that the public demo is the funnel anchor and that route contracts matter for signups, SEO, and brand trust.

### Outcome

- `/demo/syria-2024` is signed-out, read-only, watermarked, served from a static snapshot.
- `/waitlist` returns 200 with a real form.
- `/login/callback` handles OAuth and email-link returns.
- `/legal/privacy`, `/legal/terms`, `/legal/security`, `/legal/data-retention` all return 200.
- Landing has one primary CTA ("Try the demo") and one secondary ("Join the waitlist"), no third.

### Files to create / edit

- `src/app/demo/syria-2024/page.tsx` — read from static JSON snapshot.
- `src/lib/cases/syria-2026/demo-snapshot.json` — committed snapshot.
- `scripts/regenerate-demo-snapshot.ts` — weekly regen from staging Postgres.
- `src/app/waitlist/page.tsx`.
- `src/app/login/callback/page.tsx`.
- `src/app/legal/{privacy,terms,security,data-retention}/page.tsx`.
- Landing page (existing) — CTA cleanup.
- `tests/e2e/demo/public-demo-readonly.spec.ts`.
- `tests/e2e/legal-pages.spec.ts`.
- `audit:routes` — extend to assert these routes return 200.
- `lh:ci` — add demo route to Lighthouse CI configuration.

### Verification

- All 6 routes return 200 in production.
- Demo Lighthouse desktop ≥ 92, mobile ≥ 85, axe 100.
- Demo has watermark visible, no signup forms, no write paths.
- Landing CTA hierarchy verified visually.

---

## 12. Prompt R8 — Persona corpus real ingestion

### Persona
Knowledge engineer. Replaces the deterministic fallback with real pgvector retrieval.

### Outcome

- `0012_persona_corpus_chunks.py` migration applied: `persona_corpus_chunks (id, namespace, persona_id, version, doc_id, chunk_index, text, embedding vector(768), citation, created_at)`.
- 10 canonical corpus manifests on disk at `backend/personas/canonical/<persona-id>/corpus_manifest.yaml` with 15-25 entries each.
- Corpus blobs in `gs://praxis-persona-corpora/<persona-id>/v1.0.0/` (public-read, CC-BY-4.0 / public-domain / fair-use docs only).
- `scripts/ingest-persona-corpus.sh <persona-id>` chunks via existing pipeline, embeds via `text-embedding-005`, writes to Postgres with namespace.
- `backend/services/persona_corpus/retriever.py` rewritten to query pgvector; falls back to deterministic only if `NODE_ENV=development` AND `PERSONA_CORPUS_LIVE=false`.
- `audit:persona-corpora-fresh` verifies each canonical persona has ≥ 15 chunks indexed.

### Verification

- Sample retrieval for "What does Putnam say about audience costs?" against political-analyst namespace returns a chunk citing Putnam 1988 with similarity ≥ 0.7.
- Boardroom deliberation invokes real corpus retrieval (verify via Cloud Trace span).

---

## 13. Prompt R9 — Embeddings v2 cutover

### Persona
Database engineer. Resolves the C-004 finding: `graph_embeddings vector(1536)` conflicts with current 768-dim Vertex `text-embedding-005`.

### Outcome

- Migration `0013_embeddings_v2.py`: adds `embedding_v2 vector(768)` column to `graph_embeddings`; new IVFFlat index on `embedding_v2`.
- Existing 1536-dim column retained during cutover.
- Cloud Run Job `recompute-embeddings-v2` regenerates `embedding_v2` for all rows (~$5/M chars at Vertex pricing).
- `audit:embeddings-v2-coverage`: passes when ≥ 95% of rows have non-null `embedding_v2`.
- New code paths read `embedding_v2`; old paths still read `embedding`.
- Schedule legacy column drop migration for v1.1 (after 30 days of clean v2 operation).

### Verification

- Migration applied on staging.
- Recompute job runs to completion.
- Semantic search precision-at-10 on v2 ≥ 80% AND ≥ 95% of v1 baseline.

---

## 14. Prompt R10 — Persona CI + canary deploy + production readiness

### Persona
Release engineer. Earns the v1.0.0 tag.

### Outcome

- GitHub Actions workflow `persona-suites.yml` triggered on every push to main:
  - Runs Diplomat-Syria, Mediator-Northwind, Analyst-Sahel, Researcher-Nordalia.
  - Reports green/red.
  - Increments counter at `docs/audits/persona-green-streak.md` on green; resets to 0 on red.
- After 10 consecutive green entries on `main`, run canary deploy:
  - Phase 1: 5% traffic for 24h. Monitor error rate, latency P95, cost-per-request, persona synthetic checks. Auto-rollback if error-rate > 0.5% over 10min.
  - Phase 2: 25% traffic for 24h. Same.
  - Phase 3: 100%. Old revision retained for 7 days.
- Tag `v1.0.0`. Publish launch announcement. Open waitlist publicly.

### Files to create / edit

- `.github/workflows/persona-suites.yml`.
- `docs/audits/persona-green-streak.md` (incremented file).
- `scripts/canary-monitor.ts` (extend if needed).
- `docs/launch/CANARY_LOG.md` (final canary phase log).
- `docs/launch/PRODUCTION_READINESS.signed.md` (Giulio's signature).
- `CHANGELOG.md` — `## [1.0.0] - 2026-NN-NN` final entry.

### Verification

- 10 green persona-suite entries committed.
- Canary phase logs show 5 → 25 → 100 progression with timestamps.
- No rollback fired.
- Tag `v1.0.0` exists.
- Production readiness signed.

---

## 15. Final verification gate

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# Pack-specific gates (new audits)
npm run audit:firewall-coverage          # AST coverage 100%
npm run audit:review-queue-fresh         # nightly TTL job ran
npm run audit:tool-canary-executable     # all 18 tools (16+2 memo) canaries pass
npm run audit:subagent-deployment-fresh  # 7/7
npm run audit:subagent-eval-fresh        # 7/7 ≥ 80%
npm run audit:persona-corpora-fresh      # ≥ 15 chunks per persona
npm run audit:embeddings-v2-coverage     # ≥ 95% rows have v2
npm run audit:legal-pages-present
npm run audit:routes                     # canonical entry routes resolve
npm run audit:canary-log-fresh

# Architecture invariants unchanged
npm run audit:gate

# Persona suites — the production bar
npm run test:e2e:personas                # 10 consecutive green on main

# Pack-specific E2E
npx playwright test tests/e2e/demo/public-demo-readonly.spec.ts
npx playwright test tests/e2e/workbench/review-queue.spec.ts
npx playwright test tests/e2e/legal-pages.spec.ts

# Two-phase commit
pytest backend/tests/test_two_phase_commit.py -q

# Live integration smoke
PRAXIS_ENV=staging python scripts/smoke-context-parity.py
PRAXIS_ENV=staging python scripts/smoke-subagent-deployments.py

# Tag
git tag --list v1.0.0
test -f docs/launch/PRODUCTION_READINESS.signed.md
```

All exit 0. Ten green persona runs. Canary held at 100% for 24h. PRAXIS v1.0.0 is launched.

---

## 16. Out of scope

- New tools beyond the 18 (16 + 2 memo) — pack 19+.
- New ontologies — pack 19+.
- Multi-region production — pack 22 in roadmap.
- Multi-tenant teams — v2.
- Advanced collaboration features — v2.
- Custom ontology authoring — v2.
- Mobile UI — v2.

---

## 17. Closing note

Pack 18 is the pack that earns the tag. Every prior pack added structure or a feature; this pack closes the gap between what the architecture bible promises and what the live app demonstrates. After this merges and `v1.0.0` is tagged, every public claim about PRAXIS is backed by re-runnable evidence in the repo: every tool has an executable canary, every subagent is live on Agent Engine with fresh evals, every graph write goes through the firewall, every dual-store write is reconciled, every synthesized candidate is reviewable, every entry route works, and the persona suites have been green for ten consecutive runs in CI.

The discipline this pack maintains is the same as every prior pack. ACO substrate unchanged. Four-layer context unchanged. Symbolic firewall enforced. Owner scoping absolute. The bible's invariants hold. The architecture is now fully real.

Branch: `feature/production-reality-closure`. Commit prefix `closure(<area>): <prompt-id> <description>` (e.g., `closure(firewall): R2 implement AST coverage audit`, `closure(agent-engine): R4 deploy analyst_persona to vertex`). PR titled `Pack 18 — Production Reality Closure (v1.0.0 gate)`.

After merge:
1. Tag `v1.0.0`.
2. Publish launch announcement.
3. Open waitlist publicly.
4. Notify pre-approved beta users.
5. Begin v1.1 from `PRAXIS_IMPROVEMENT_ROADMAP.md` § 11 priorities (Pack 15 SAT toolkit deepening, Pack 17 Early Warning, etc.).

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_18_PRODUCTION_REALITY_CLOSURE.md`
