# PRAXIS — Codex Pack 14: Production Excellence on Google Cloud

**File**: `PRAXIS_CODEX_14_PRODUCTION_EXCELLENCE.md`
**Branch**: `feature/production-excellence-gcp`
**Depends on**: Packs 03-13 merged. This pack is the final hardening, GCP-native rewiring, and user-experience polish pass.
**Owner gate**: Do not merge to `main` without Giulio's explicit sign-off on (a) the Vertex AI cost projection, (b) the Terraform-managed infrastructure plan, (c) the canary deploy strategy, and (d) the launch-readiness sign-off.
**Estimated effort**: ~9 days (~75 engineering hours).
**Voice**: Production-engineering lead with a product head. Ambitious, GCP-native, innovation-aware. Deploys to praxis.tacitus.me with confidence.

---

## 0. Why this pack exists

After packs 03-13, PRAXIS is structurally complete: workbench shell, four ontologies, Postgres-backed knowledge graph, Cytoscape graph viewer, sixteen tools in a marketplace, memo studio with six templates, four-layer context substrate, Tool Contract v2 with ContextProvider injection, four LangGraph subagents (Context Preparer / Source Augmenter / Output Refiner / Memo Drafter), suggestion engine, persona suites green for ten consecutive runs. The codebase is ready. The product, in the most important senses, is not yet *real*: the AI provider abstraction has been Anthropic-direct (or undecided) when the deployment target is Google Cloud and the natural model home is Vertex AI; the embeddings have been specified as `text-embedding-3-small` (OpenAI) when the GCP-native equivalent is `text-embedding-005` and the at-scale upgrade is Vertex AI Vector Search; the four subagents run as ad-hoc Python under `backend/agents/` when Vertex AI Agent Engine offers a managed runtime with native LangGraph support; the infrastructure is implicit when it should be Terraform-managed; the user-experience polish that turns "the product works" into "the user wants to come back" has been deferred at every pack boundary; and there is no public demo, no waitlist, no 60-second wow flow, no real evidence that a brand-new policy professional landing on praxis.tacitus.me on a Tuesday morning will understand what PRAXIS is, sign up, create a case, ingest a document, run a tool, and produce a memo all in the same session.

This pack closes those gaps. It is ambitious by design. It rewires PRAXIS to be **GCP-native and Vertex AI-first**, deploys the four subagents to **Vertex AI Agent Engine** for managed runtime and observability, switches embeddings to **`text-embedding-005`** (with **Vertex AI Vector Search** as the at-scale upgrade path beside pgvector), provisions every GCP resource via **Terraform** so a fresh staging or production environment is one `terraform apply` away, wires **Cloud Trace + Cloud Logging + Cloud Monitoring + Error Reporting + Budget Alerts** end-to-end, ships a **public read-only demo case** plus a **waitlist with magic-link signup**, and finishes with a comprehensive **user-experience polish sweep** that touches every empty state, loading state, error state, transition, and micro-interaction across the workbench. The result is a product on praxis.tacitus.me that a brand-new user can land on, understand in fifteen seconds, sign up for in fifteen more, and produce a real artifact from in under five minutes.

The pack also commits a **Multi-Agent Codex Orchestration Playbook** as a first-class repo artifact at `docs/contributing/CODEX_ORCHESTRATION.md`, encoding the patterns this pack itself uses (typed-schema boundaries, git worktrees, parallel subagent decomposition, critic loops, demo-driven development) so every subsequent pack runs faster.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | All AI calls (Gemini, Claude, embeddings) route through Vertex AI by default; provider switch to `anthropic-direct` retained as fallback behind `AI_PROVIDER` env flag | `npm run audit:ai-provider-vertex-default` exits 0 |
| 2 | The four subagents (Context Preparer, Source Augmenter, Output Refiner, Memo Drafter) run on Vertex AI Agent Engine with managed sessions, telemetry, and per-call cost tracking | Each subagent's smoke test from staging exits 0; Cloud Trace shows end-to-end spans |
| 3 | Embeddings switched from OpenAI `text-embedding-3-small` to Vertex AI `text-embedding-005` (default 768-dim); pgvector indexes recomputed; semantic search precision-at-10 maintained or improved on the eval set | Migration script + before/after eval report |
| 4 | Vertex AI Vector Search added as an *optional* secondary index (behind `KG_SEARCH_BACKEND=pgvector\|vertex\|both`, default `pgvector`); reflective sync from pgvector | Smoke runs all three modes |
| 5 | Full Terraform plan at `infrastructure/terraform/` provisioning Cloud Run, Cloud SQL, Cloud Storage, Firestore, Vertex AI APIs, Identity Platform, Secret Manager, Cloud Tasks, Cloud Scheduler, Cloud Build, Cloud Trace/Logging/Monitoring | `cd infrastructure/terraform && terraform plan -out plan.out && terraform apply plan.out` provisions a clean staging in < 30 minutes |
| 6 | Cloud Trace spans every request end-to-end (browser → Cloud Run → Cloud SQL/Firestore → Vertex AI → response) | Open Cloud Trace; latest 100 traces show 100% coverage of the `/v1/cases/*/tools/*/run` path |
| 7 | Structured logging via Cloud Logging with request-id propagation; Cloud Monitoring dashboards published; Error Reporting alerting configured; Budget alerts at 50/80/100% thresholds | Each verified by deliberate trigger |
| 8 | Public demo case at `/demo/syria-2024` (signed-out, read-only, watermarked); shareable; no auth required; degraded but lossless graph + tool browsing | Lighthouse desktop > 92, accessibility 100; 30-second comprehension test passes with three external testers |
| 9 | Waitlist + magic-link signup at `/login` with 60-second post-signup "first win" (Welcome → sample case auto-suggested → first memo auto-drafted → DOCX downloaded) | E2E `e2e/onboarding/60-second-wow.spec.ts` green; wall-clock under 90s |
| 10 | User-experience polish sweep: every empty state, loading state, error state, transition, and micro-interaction reviewed and fixed across all surfaces | `npm run audit:ux-polish` exits 0; visual regression suite green |
| 11 | Load testing: 100 concurrent users, 1000 case ingestions, 10000 tool runs over a 1-hour window; capacity plan documented for 10/100/1k/10k user tiers | `infrastructure/loadtest/` script + report |
| 12 | Cost dashboard at `/app/admin/diagnostics?tab=cost`: real-time spend per user, per case, per tool, per subagent, per month; budget alerts wired to Sentry + email | Verified by deliberate spend trigger |
| 13 | Trust + compliance: privacy policy, terms of service, security disclosure, data-retention statement, GDPR DPA-ready, status page at `status.tacitus.me` | All pages live; signed by Giulio |
| 14 | Multi-Agent Codex Orchestration Playbook at `docs/contributing/CODEX_ORCHESTRATION.md` with the five patterns this pack uses + the worktree workflow | Committed; reviewed |
| 15 | Canary deploy to praxis.tacitus.me using Cloud Run revisions: 5% → 25% → 100% over 48 hours; auto-rollback on error-rate spike | Canary metrics dashboard signed by Giulio at each phase |

---

## 2. Pre-work confirmation note

> I am Codex acting as production-engineering lead for pack 14. I have read the pack. I understand:
> 1. **Vertex AI is the primary AI provider after this pack.** Model strings live exclusively in `src/lib/ai/providers.ts` and `backend/ai/providers.py`. The default mapping: `gemini-3.1-pro` for complex reasoning (memo drafter, contradiction analysis), `gemini-3-flash` for balanced (most tool handlers), `gemini-2.5-flash-lite` for cheap classification (ontology classifier, tool suggestion ranker), `claude-opus-4.7` on Vertex Model Garden for paragraph-quality writing tasks (output refiner, memo block drafting), `text-embedding-005` for embeddings. The `AI_PROVIDER=anthropic-direct` fallback is retained for development without GCP.
> 2. **The four subagents deploy to Vertex AI Agent Engine** using `vertexai.agent_engines.LanggraphAgent`. Sessions go to Vertex AI Sessions; long-term memory to Memory Bank. Per-call cost ceiling and latency budget are enforced at the runtime, not at the application layer.
> 3. **Terraform is the only sanctioned way to provision GCP resources.** Hand-clicking in the Cloud Console is not allowed. The repo has `infrastructure/terraform/` covering project setup, IAM, APIs, networking, Cloud Run services, Cloud SQL, Firestore, Cloud Storage buckets, Vertex AI Vector Search index, Cloud Tasks, Cloud Scheduler, Cloud Build triggers, secrets, monitoring dashboards, alert policies, and budgets.
> 4. **The canary deploy is not optional.** Every production push goes 5% → 25% → 100% over 48 hours. Auto-rollback fires on error-rate spike > 0.5% or latency P95 > 2× baseline.
> 5. **The four-phase collaboration pattern applies** to every prompt in this pack. Read & report → Propose & confirm → Execute → Verify. I will not deploy to production without staging green for 24 hours and Giulio's signed canary phase gate.
> 6. **No prior pack invariants are weakened.** ACO substrate, model strings only in providers, owner scoping, atomic two-phase commits, symbolic firewall, ContextProvider as the only context API, every tool has a SKILL.md.
>
> Open questions for Giulio:
> - **Q1**: Vertex AI region — propose `us-central1` for compute (lowest latency for US-based diplomats and mediators) and Cloud SQL HA across `us-central1-a` and `us-central1-b`. Acceptable, or do you want `europe-west4` (closer to UN Geneva, FCDO London) given GC's UN/UKMIS workflow? My recommendation is to ship `us-central1` at v1 and add `europe-west4` as a multi-region upgrade in v1.1.
> - **Q2**: Vertex AI Vector Search — propose **adding it alongside pgvector**, not replacing. pgvector remains the source of truth (cheaper at < 1M vectors, simpler operations); Vector Search is provisioned with `KG_SEARCH_BACKEND=both` for production-scale (≥ 1M vectors) tenants. Default stays pgvector. Acceptable?
> - **Q3**: Public demo case — propose **Syria 2024** (the canonical case from the codebase) loaded as read-only, no signup, watermarked "Demo — based on public sources only," with an "Open in your own workbench" CTA that triggers signup. Cost: a small DB snapshot served from a separate read-only Cloud Run revision so no PII or per-user data leaks. Acceptable?
> - **Q4**: Magic-link signup — propose Identity Platform (the Firebase Auth successor on GCP) with email-link sign-in primary, Google SSO secondary, no password. Magic-link expiry 15 minutes; rate-limit 5 per email per hour. Acceptable, or do you want passwords retained as fallback?
> - **Q5**: Multi-agent Codex orchestration patterns to commit to playbook — propose: (a) typed-schema boundaries between subagents (Pydantic / Zod, validated), (b) git-worktree isolation for parallel branches, (c) critic-loop subagent reviewing every PR before human review, (d) demo-driven development (write the persona test first), (e) MCP servers for cross-agent communication. Acceptable, or amend?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| N1 | Vertex AI primary provider; provider abstraction; model selection matrix | 8 |
| N2 | Four subagents deployed to Vertex AI Agent Engine; sessions + memory bank wired | 10 |
| N3 | Embeddings migrated to `text-embedding-005`; optional Vertex AI Vector Search beside pgvector | 7 |
| N4 | Terraform infrastructure for praxis.tacitus.me (staging + production); one-command provision | 10 |
| N5 | Observability: Cloud Trace + Logging + Monitoring + Error Reporting + Budget Alerts | 7 |
| N6 | Public demo case + waitlist + magic-link signup + 60-second wow flow | 9 |
| N7 | User-experience polish sweep across all surfaces | 9 |
| N8 | Load testing, capacity planning, cost projections, cost dashboard | 6 |
| N9 | Trust + compliance pass + Multi-Agent Codex Orchestration Playbook | 5 |
| N10 | Canary deploy to praxis.tacitus.me (5% → 25% → 100%); launch sign-off | 4 |
| **Total** | | **~75** |

---

## 4. Hard rules

- **All AI provider calls route through `src/lib/ai/providers.ts` / `backend/ai/providers.py`.** Direct imports of `@google-cloud/aiplatform`, `vertexai`, `@anthropic-ai/sdk`, `openai`, etc., outside the providers module are a contract violation, statically caught by `audit:ai-provider-isolation`.
- **The model selection matrix is data, not prose.** A single `MODEL_MATRIX.json` declares `task_kind → (provider, model_id, max_tokens, temperature, cost_class)` and every consumer reads it. Adding a model is a one-line entry.
- **Vertex AI Agent Engine deployments are versioned.** Each subagent has a `version` field; deployments are immutable; rollback is one CLI command.
- **Terraform state is remote** (Cloud Storage backend, encrypted, locked via `gs://praxis-terraform-state/`). Local state is forbidden.
- **No infrastructure changes in PRs that also change application code.** Terraform PRs are reviewed and applied separately, with a `plan.out` attached for reproducibility.
- **Canary deploys are mandatory.** Direct push to 100% production traffic is forbidden. Every revision rolls 5% → 25% → 100% over 48 hours with auto-rollback wired.
- **Cost ceilings are enforced at the gateway.** A user-level monthly budget is set in Identity Platform custom claims; a soft alert fires at 80%, a hard cap at 100% (returns 402 Payment Required with a friendly upgrade-or-wait message).
- **Public demo case carries no PII.** A static read-only snapshot served from a separate Cloud Run revision with no Firestore/Postgres write paths; CSP locked down; analytics anonymous.
- **Waitlist signups are owner-curated until v1.0.0** (Giulio approves each one); after v1.0.0 the gate opens. Documented in the runbook.
- **Persona suites are still the production bar.** 10 consecutive green CI runs after every commit in this pack.
- **All prior invariants from packs 03-13 hold.** This pack does not relitigate decisions; it operationalizes them.

---

## 5. Prompt N1 — Vertex AI primary provider; model selection matrix

### Persona
Backend engineer who has wired three production LLM stacks before. Knows that the value is in the boundary: a typed provider interface, a data-driven model matrix, and one unit-tested integration test per provider.

### Phase 1 — Read & report

- Audit current `src/lib/ai/providers.ts` and `backend/ai/providers.py` (created in earlier packs). What models are currently referenced? What providers are used? What's the test coverage?
- Map every consumer of the providers (tools, subagents, ingestion pipeline, ontology classifier, memo drafter, output refiner) to its task kind.
- Output `docs/audits/2026-05-06-AI_PROVIDER_INVENTORY.md`.

### Phase 2 — Propose & confirm

Propose the **Model Selection Matrix** at `src/lib/ai/MODEL_MATRIX.json`:

```json
{
  "task_kinds": {
    "complex_reasoning":  { "provider": "vertex", "model": "gemini-3.1-pro",       "max_tokens": 8192,  "temperature": 0.2, "cost_class": "expensive" },
    "balanced":           { "provider": "vertex", "model": "gemini-3-flash",       "max_tokens": 4096,  "temperature": 0.3, "cost_class": "medium" },
    "cheap_classify":     { "provider": "vertex", "model": "gemini-2.5-flash-lite","max_tokens": 1024,  "temperature": 0.0, "cost_class": "cheap" },
    "long_context":       { "provider": "vertex", "model": "gemini-3.1-pro",       "max_tokens": 32768, "temperature": 0.2, "cost_class": "expensive_long" },
    "writing_quality":    { "provider": "vertex", "model": "claude-opus-4.7@vertex","max_tokens": 4096, "temperature": 0.4, "cost_class": "expensive" },
    "embeddings_text":    { "provider": "vertex", "model": "text-embedding-005",   "dimensions": 768,                       "cost_class": "cheap" },
    "embeddings_long":    { "provider": "vertex", "model": "gemini-embedding-001", "dimensions": 1536,                      "cost_class": "medium" }
  },
  "fallback_provider": {
    "anthropic-direct": {
      "complex_reasoning":  "claude-opus-4.7",
      "balanced":           "claude-sonnet-4.6",
      "cheap_classify":     "claude-haiku-4.5",
      "writing_quality":    "claude-opus-4.7"
    }
  }
}
```

Task-kind assignments per existing consumer:
- Ontology classifier → `cheap_classify`
- Context Preparer → `balanced` (with `complex_reasoning` for high-stakes cases)
- Source Augmenter → `balanced`
- Output Refiner → `writing_quality`
- Memo Drafter → `writing_quality`
- Memo block "suggest content" → `writing_quality`
- Tool: `cross.contradiction-finder` → `complex_reasoning`
- Tool: `cross.scenario-projector` → `complex_reasoning` with `long_context` if input > 50k tokens
- Tool: `mediation.mediation-brief` (subagent path) → `writing_quality`
- All embeddings → `embeddings_text` (default) or `embeddings_long` for documents > 8k tokens
- Tool suggestion ranker → no LLM (pure data, per Pack 13 M4)

Wait for sign-off.

### Phase 3 — Execute

- Author `src/lib/ai/MODEL_MATRIX.json` and a typed loader at `src/lib/ai/model-matrix.ts`.
- Refactor `src/lib/ai/providers.ts`:
  ```ts
  export interface AIProvider {
    chat(taskKind: TaskKind, messages: Message[], opts?: ChatOpts): Promise<ChatResult>;
    embed(taskKind: 'embeddings_text' | 'embeddings_long', texts: string[]): Promise<number[][]>;
  }

  export const provider: AIProvider = process.env.AI_PROVIDER === 'anthropic-direct'
    ? new AnthropicDirectProvider()
    : new VertexAIProvider();
  ```
- Author `src/lib/ai/providers/vertex.ts` using `@google-cloud/aiplatform` (Node) and `google-genai` (Python).
- Author `src/lib/ai/providers/anthropic-direct.ts` as fallback.
- Update every consumer to call `provider.chat(taskKind, ...)` instead of importing model strings.
- Cost-table integration: every call records `{ task_kind, provider, model, input_tokens, output_tokens, latency_ms, cost_usd }` to the existing audit collection.
- Author `audit:ai-provider-isolation` script — fails if any file outside `src/lib/ai/providers/` and `backend/ai/providers/` imports `@google-cloud/aiplatform`, `vertexai`, `@anthropic-ai/sdk`, `openai`, or references model-string literals.
- Author `audit:ai-provider-vertex-default` — verifies `AI_PROVIDER` is unset or `vertex` in production env; fails otherwise.
- Author parity test: 8 representative prompts run through both providers; outputs structurally similar (same JSON schema), latency comparable.

### Phase 4 — Verify

- All consumers green.
- Persona suites green on Vertex provider.
- Cost telemetry flowing.
- Manual smoke: each task kind exercised with a deliberate test prompt; latency + cost recorded.

### Files to create

- `src/lib/ai/MODEL_MATRIX.json`.
- `src/lib/ai/model-matrix.ts`.
- `src/lib/ai/providers.ts` (refactored).
- `src/lib/ai/providers/vertex.ts`, `anthropic-direct.ts`.
- `backend/ai/providers/vertex.py`, `anthropic_direct.py`.
- `scripts/audit-ai-provider-isolation.ts`, `audit-ai-provider-vertex-default.ts`.
- `backend/tests/test_provider_parity.py`.
- `docs/audits/2026-05-06-AI_PROVIDER_INVENTORY.md`.
- `docs/architecture/MODEL_SELECTION.md` — explains the matrix, when to add a row, how to override per-call.

### Files to edit

- Every consumer of model strings (now reads `provider.chat(taskKind, ...)`).
- `package.json` — add new audit scripts.
- `audit:gate` chain — append the two new audits.

### Verification commands

```bash
npm run audit:ai-provider-isolation
npm run audit:ai-provider-vertex-default
pytest backend/tests/test_provider_parity.py -q
npm run test:e2e:personas   # all four green
```

---

## 6. Prompt N2 — Subagents on Vertex AI Agent Engine

### Persona
ML/agent engineer who has shipped LangGraph agents to production. Knows that the win of Agent Engine over self-hosted is observability (Cloud Trace spans), persistence (Sessions + Memory Bank), and automatic scaling — and that the cost is GCP-residency lock-in, which is a feature not a bug for this product.

### Phase 1 — Read & report

For each of the four subagents (Context Preparer, Source Augmenter, Output Refiner, Memo Drafter):
- Read the LangGraph subgraph definition.
- Identify any direct external dependencies that won't work in Agent Engine (e.g., direct Firestore writes — these are fine as Agent Engine has full GCP access; direct file-system writes — these need Cloud Storage).
- Identify the input / output schemas to validate at the Agent Engine boundary.
- Output `docs/audits/2026-05-06-SUBAGENT_DEPLOYMENT_PLAN.md`.

### Phase 2 — Propose & confirm

Propose the deployment shape:

```python
# backend/agents/deploy.py
from vertexai import agent_engines
from backend.agents.context_preparer.graph import build_graph as build_preparer_graph
from backend.agents.source_augmenter.graph import build_graph as build_augmenter_graph
from backend.agents.output_refiner.graph import build_graph as build_refiner_graph
from backend.agents.memo_drafter.graph import build_graph as build_drafter_graph

def deploy_subagent(name, build_graph_fn, model_task_kind):
    agent = agent_engines.LanggraphAgent(
        graph_builder=build_graph_fn,
        model=resolve_model(model_task_kind),  # from MODEL_MATRIX
        sessions={"backend": "vertex"},  # Vertex Sessions for conversation continuity
        memory_bank={"enabled": True, "scope": "per-user"},
        observability={"trace": "cloud_trace", "log": "cloud_logging"},
    )
    return agent_engines.create(
        agent=agent,
        display_name=f"praxis-{name}",
        description=f"PRAXIS {name} subagent",
    )
```

Each subagent gets:
- Its own Agent Engine resource (4 total).
- Per-call cost ceiling enforced at the runtime ($0.05 / $0.10 / $0.03 / $0.08 for preparer / augmenter / refiner / drafter).
- Cloud Trace propagation: caller's `traceparent` header forwarded; spans nested under the caller's trace.
- Sessions with `session_id = sha256(uid + case_id + subagent_id)` (deterministic per (user, case, subagent) tuple).
- Memory Bank scoped per-user (so the Memo Drafter, for example, learns the user's preferred phrasing over time).

The application calls subagents via `ContextProvider.subagent(id, input)` — the implementation now resolves to the Agent Engine HTTP endpoint instead of an in-process LangGraph call. The interface is unchanged.

Wait for sign-off, especially on the per-user memory scope and the cost ceilings.

### Phase 3 — Execute

- Author `backend/agents/deploy.py` deployment script.
- Add `terraform/modules/agent-engine/` Terraform module (created in N4) that provisions the four Agent Engines from this script.
- Refactor `ContextProvider.subagent` to call the Agent Engine endpoint; add caching, retry, circuit-breaker.
- Update each subagent's eval set runner to test against the deployed Agent Engine in staging (catches deployment-specific issues).
- Add subagent invocation panel to the diagnostics dashboard (per-subagent invocation count, P95 latency, cost-per-call, error rate, queue depth).
- Document rollback: `agent_engines.update(agent_id, version=N-1)` reverts to the prior version in < 60 seconds.

### Phase 4 — Verify

- Each subagent's smoke test from staging: 10 representative inputs, latency P95 within budget, output schema-conformant, cost under ceiling.
- Cloud Trace shows end-to-end spans: tool invocation → Agent Engine call → LangGraph node sequence → return.
- Memory Bank verified: a Memo Drafter call followed by another Memo Drafter call for the same user retains stylistic preferences.
- Failure injection: kill an Agent Engine mid-call; circuit breaker fires; tool returns degraded response.
- Persona suites green.

### Files to create

- `backend/agents/deploy.py`.
- `backend/agents/agent_engine_client.py` — typed HTTP client.
- `infrastructure/terraform/modules/agent-engine/` (referenced from N4).
- `scripts/deploy-subagents-staging.sh`, `scripts/deploy-subagents-prod.sh`, `scripts/rollback-subagent.sh`.
- `docs/runbooks/SUBAGENT_AGENT_ENGINE.md`.
- `docs/audits/2026-05-06-SUBAGENT_DEPLOYMENT_PLAN.md`.

### Files to edit

- `src/lib/context/provider.ts` and `backend/context/provider.py` — `subagent()` now calls Agent Engine.
- Diagnostics dashboard — add subagent panel.
- `audit:gate` chain — append `audit:subagent-deployment-fresh` (asserts each subagent was redeployed within last 30 days).

### Verification commands

```bash
bash scripts/deploy-subagents-staging.sh
pytest backend/tests/test_subagent_agent_engine.py -q
python -m backend.agents.context_preparer.eval.run_eval --target=staging
python -m backend.agents.source_augmenter.eval.run_eval --target=staging
python -m backend.agents.output_refiner.eval.run_eval --target=staging
python -m backend.agents.memo_drafter.eval.run_eval --target=staging
```

---

## 7. Prompt N3 — Embeddings migrated to `text-embedding-005`; Vertex AI Vector Search optional

### Persona
Search engineer who has migrated embedding stacks before. Knows that the cost of doing this incrementally — both old and new in parallel during cutover, eval set as the gate — is much lower than the cost of doing it all-at-once and discovering 5% precision regression after launch.

### Phase 1 — Read & report

- Inventory all embedding consumers: pack 10 J6 (graph node embeddings), pack 12 L3 (workspace guidelines), and any others.
- Current embedding model: `text-embedding-3-small` (OpenAI, 1536 dim).
- Target embedding model: `text-embedding-005` (Vertex AI, 768 dim default).
- Eval set: pack 10 J6's 50 hand-labeled (query, expected nodes) pairs; pack 12 L3's workspace retrieval eval set.
- Output `docs/audits/2026-05-06-EMBEDDINGS_MIGRATION_PLAN.md`.

### Phase 2 — Propose & confirm

Propose:

1. **Recompute embeddings** — for each existing embedding row in `graph_embeddings` and `workspace_embeddings` tables, generate a new embedding via `text-embedding-005`. Background batch job using Cloud Run Jobs + Cloud Tasks for fan-out. Estimated cost: ≈ $5 per 1M characters of source text (Vertex AI batch pricing).
2. **Schema migration** — column `graph_embeddings.embedding_v2 vector(768)` added; both `embedding` (legacy 1536) and `embedding_v2` (new 768) live during cutover. Cutover triggered by `EMBEDDING_VERSION = 2` env flag.
3. **Re-index pgvector** — IVFFlat index on `embedding_v2` with `lists = sqrt(N)` heuristic.
4. **Eval gate** — precision-at-10 on the full eval set must be ≥ 80% (pack 10 floor) and ≥ 95% of the legacy embedding's score. If not, investigate per-query before cutting over.
5. **Drop legacy column** in a follow-up migration after 30 days of clean v2 operation.
6. **Optional Vertex AI Vector Search index** added behind `KG_SEARCH_BACKEND=vertex|both`, default `pgvector`. STREAM_UPDATE mode; reflective sync from pgvector via Cloud Tasks. Use case: tenants with > 1M graph rows (none at v1, prepared for v2 enterprise).

Wait for sign-off.

### Phase 3 — Execute

- Schema migration `0003_embeddings_v2.py`.
- Cloud Run Jobs definition `infrastructure/cloud-run-jobs/recompute-embeddings/` (Dockerfile + job spec).
- Cloud Tasks queue `embeddings-recompute` with 1000-task fan-out, 8 workers.
- Run the recompute on staging first; verify counts; eval; cut over staging.
- Run on production with the same protocol; eval again; cut over.
- Add Vertex AI Vector Search Terraform module (referenced from N4); index built but undeployed at v1.

### Phase 4 — Verify

- Eval scores match or beat baseline.
- Recompute job idempotent (re-running produces same result).
- Drift verifier (pack 10) extended: rows in `graph_embeddings` with `embedding_v2 IS NULL` are surfaced in diagnostics.
- Persona suites green (their semantic-search-dependent paths still work).

### Files to create

- `backend/migrations/alembic/versions/0003_embeddings_v2.py`.
- `infrastructure/cloud-run-jobs/recompute-embeddings/Dockerfile`, `job.py`.
- `scripts/cutover-embeddings.sh` (orchestrates recompute → eval → cutover).
- `docs/audits/2026-05-06-EMBEDDINGS_MIGRATION_PLAN.md`.

### Files to edit

- `backend/ingestion/embeddings/embedder.py` — uses `provider.embed('embeddings_text', texts)` from N1.
- `MODEL_MATRIX.json` — `text-embedding-005` default; `gemini-embedding-001` for long-context fallback.
- `audit:kg-drift` — extends to flag missing v2 embeddings.

### Verification commands

```bash
bash scripts/cutover-embeddings.sh --env=staging
python -m backend.ingestion.eval.semantic_search_eval --version=v2
bash scripts/cutover-embeddings.sh --env=production
npm run audit:gate
```

---

## 8. Prompt N4 — Terraform infrastructure-as-code

### Persona
Platform engineer who has shipped Terraform-managed GCP at startup scale. Knows that the goal is "one command provisions a fresh staging environment in 30 minutes," and that the moment human-clicked resources start appearing in the GCP project, the IaC battle is half-lost.

### Phase 1 — Read & report

Inventory every GCP resource currently in use (manually clicked or scripted): project, IAM bindings, enabled APIs, service accounts, Cloud Run services, Cloud SQL instances, Firestore database, Cloud Storage buckets (uploads, exports, terraform-state, agent-engine artifacts), Secret Manager secrets, Cloud Tasks queues, Cloud Scheduler jobs, Cloud Build triggers, Vertex AI APIs/quotas, Cloud DNS records (praxis.tacitus.me), SSL certificates, load balancer, monitoring dashboards, alert policies, budgets.

Output `docs/audits/2026-05-06-GCP_RESOURCE_INVENTORY.md`.

### Phase 2 — Propose & confirm

Propose the Terraform layout:

```
infrastructure/terraform/
  README.md
  versions.tf                 # provider versions, backend
  variables.tf                # env-agnostic variables
  outputs.tf
  envs/
    staging/
      terraform.tfvars
      backend.tf              # gs://praxis-terraform-state-staging
    production/
      terraform.tfvars
      backend.tf              # gs://praxis-terraform-state-production
  modules/
    project-bootstrap/        # APIs enabled, default service accounts, IAM
    networking/               # VPC, firewall rules, Cloud NAT
    cloud-run/                # frontend (Next.js) + backend (FastAPI) services
    cloud-sql/                # Postgres 16 with pgvector, HA in production
    firestore/                # Firestore native mode
    cloud-storage/            # uploads, exports, agent artifacts buckets
    identity-platform/        # auth, magic links, OAuth providers
    secret-manager/           # API keys, signing secrets, OAuth secrets
    cloud-tasks/              # async-tools, embeddings-recompute, ingestion queues
    cloud-scheduler/          # 6h drift verifier, daily cost aggregation, weekly backups
    cloud-build/              # CI/CD pipelines for frontend + backend + subagents
    agent-engine/             # 4 subagent deployments (referenced from N2)
    vertex-vector-search/     # optional KG search index (default disabled)
    monitoring/               # dashboards, alert policies, budgets, uptime checks
    cloud-dns/                # praxis.tacitus.me + staging.praxis.tacitus.me records
    load-balancer/            # HTTPS LB, SSL cert, Cloud Armor rules
```

Hard rules baked into the modules:
- Least-privilege IAM (service accounts have only the roles they need; documented per role).
- Customer-managed encryption keys (CMEK) for Cloud SQL and Cloud Storage in production (via Cloud KMS).
- VPC Service Controls for Vertex AI in production (data-exfiltration prevention).
- Cloud SQL: HA in production, automated backups every 6 hours, 30-day point-in-time recovery, deletion protection on.
- Cloud Storage: versioning on, lifecycle rules to glacier-tier for objects older than 90 days, public access prevention enforced.
- Cloud Run: min-instances=1 (production), max-instances=20, concurrency=80, request timeout 300s, CPU always allocated.
- Cloud Armor: WAF rules for OWASP Top 10, rate-limiting per IP at 100 req/min.
- All resources tagged with `app=praxis`, `env=staging|production`, `owner=tacitus`, `cost-center=praxis`.

Wait for sign-off, especially on:
- VPC Service Controls (operationally heavier; recommended for production but could defer to v1.1).
- CMEK (small cost increase; recommended for production-grade).
- Cloud Armor rules (start with managed defaults; tune over time).

### Phase 3 — Execute

- Author every module above.
- Author `envs/staging/` and `envs/production/` with appropriate variables.
- Author `scripts/terraform-apply.sh` that wraps `terraform plan` + manual review + `terraform apply` with sensible defaults.
- Author `scripts/terraform-destroy-staging.sh` (production destruction is intentionally manual).
- Run `terraform plan` against the existing project; reconcile any drift (resources clicked but not in Terraform).
- Run `terraform apply` against staging from a clean slate to verify the 30-minute target.

### Phase 4 — Verify

- `terraform plan` against staging shows zero drift.
- `terraform plan` against production shows only intentional drift documented in PR description.
- A new staging environment provisioned end-to-end in < 30 minutes using `bash scripts/terraform-apply.sh staging`.
- Persona suites green on the new staging.

### Files to create

- All Terraform modules and env files listed above.
- `infrastructure/terraform/README.md` — getting started, module catalog, common operations.
- `docs/runbooks/TERRAFORM_OPERATIONS.md` — apply, rollback, drift detection, state manipulation.
- `docs/runbooks/INCIDENT_INFRASTRUCTURE.md` — what to do when GCP has an outage or a human accidentally clicks something.
- `docs/audits/2026-05-06-GCP_RESOURCE_INVENTORY.md`.

### Files to edit

- `package.json` — `tf:plan-staging`, `tf:plan-prod`, `tf:apply-staging` scripts.

### Verification commands

```bash
cd infrastructure/terraform/envs/staging
terraform init
terraform plan -out plan.out
terraform apply plan.out
# Verify provisioning time < 30 minutes
```

---

## 9. Prompt N5 — Observability end-to-end

### Persona
SRE who has been paged at 3 AM with no logs. Instruments so the next on-call has a fighting chance.

### Outcome

Cloud Trace spans every request end-to-end. Cloud Logging captures structured events with request-id propagation. Cloud Monitoring publishes dashboards. Error Reporting alerts. Budget alerts wired to Sentry + email at 50/80/100% thresholds.

### Files to create

- `backend/middleware/cloud_trace.py` — automatic instrumentation via OpenTelemetry; Vertex AI / Cloud Run / Cloud SQL / Firestore spans nested under inbound HTTP.
- `src/lib/observability/cloud-trace-init.ts` — frontend trace propagation via `traceparent` header.
- `infrastructure/terraform/modules/monitoring/dashboards/` — JSON dashboard definitions:
  - `praxis-overview.json` — request rate, error rate, latency P50/P95/P99, active users, ingestion throughput, tool runs, subagent invocations
  - `praxis-cost.json` — daily Vertex AI spend, Cloud SQL spend, Cloud Run spend, Cloud Storage spend, cumulative monthly burn, projected end-of-month
  - `praxis-context-health.json` — pack 12 metrics
  - `praxis-graph-ops.json` — pack 07/10 metrics
  - `praxis-tools-marketplace.json` — pack 08 metrics
  - `praxis-memo-studio.json` — pack 11 metrics
  - `praxis-onboarding-funnel.json` — sign-up → first-case → first-tool → first-memo conversion at each step
- `infrastructure/terraform/modules/monitoring/alerts/` — alert policy definitions:
  - error-rate > 1% over 5 min
  - latency P95 > 5s over 5 min
  - subagent cost-per-call > 2× ceiling for any subagent over 1 hour
  - drift verifier red
  - budget 50%, 80%, 100% thresholds
  - SSL certificate < 30 days from expiry
- `docs/runbooks/<each>.md` — one runbook per alert.
- `docs/architecture/OBSERVABILITY.md` — request-id propagation, span hierarchy, log fields.

### Hard rules

- Every Cloud Run service has structured-logging middleware that writes JSON logs with `traceId`, `spanId`, `userId`, `caseId`, `requestId` on every line.
- No PII in logs at INFO level. User profile freeform fields, document content, memo content — DEBUG-only and disabled in production.
- Sentry release-tagging tied to git SHA; deploys auto-create a release.
- Budget alerts go to Sentry + email + Slack (if configured).
- Uptime checks against `praxis.tacitus.me/healthz` (frontend) and `praxis.tacitus.me/api/v1/healthz` (backend) every 60 seconds from 6 regions.

### Definition of Done

- Cloud Trace coverage 100% on the `/v1/cases/*/tools/*/run` path (verified by sampling latest 100 traces).
- Each alert path triggered deliberately and verified.
- Each runbook written.

### Verification commands

```bash
# Trigger error rate alert
bash scripts/observability-alert-test.sh --alert=error-rate

# Trigger budget alert (test mode)
bash scripts/observability-alert-test.sh --alert=budget-50

# Verify trace coverage
python -m backend.observability.trace_coverage_audit --threshold=99
```

---

## 10. Prompt N6 — Public demo case + waitlist + magic-link signup + 60-second wow

### Persona
Product engineer + growth engineer. Knows that the first fifteen seconds on the landing page determine whether the user signs up; that the first sixty seconds after signup determine whether they come back; and that the public demo is the cheapest, highest-leverage growth tool a B2B product has.

### Phase 1 — Read & report

- Walk the current landing → signup → workbench flow as a brand-new user. Time it. Note friction points, dead ends, "what do I do now" moments.
- Inventory existing onboarding from packs 09 I7, 11 K5.
- Output `docs/audits/2026-05-06-FIRST_RUN_FRICTION.md` with timestamps and screenshots.

### Phase 2 — Propose & confirm

Propose:

1. **Public demo case** at `/demo/syria-2024`. Loaded from a static read-only Postgres snapshot served by a separate Cloud Run revision. The user can:
   - Browse the workbench tabs (Frame / Sources / Documents / Ontology / Graph / Tools / Memos / Runs).
   - Inspect graph nodes (read-only).
   - Run *one* simulated tool (`mediation.position-vs-interest` against Northwind) — output is canned + watermarked "Demo output, not personalized."
   - View the auto-populated Mandate brief memo.
   - Click "Open in your own workbench" → triggers signup.
2. **Waitlist** at `/waitlist`. Email capture. Owner-curated approval (Giulio approves each one until v1.0.0). Approval triggers a magic link.
3. **Magic-link signup** at `/login`. Email-link primary, Google SSO secondary. Identity Platform handles delivery via SendGrid. Magic link valid 15 minutes. After click → onboarding.
4. **60-second wow flow** — extends pack 09 I7 onboarding:
   - **0:00** Welcome modal. "What kind of work do you do?" (one tap).
   - **0:05** Sample-case suggestion based on role. "Open Northwind mediation case?" (one tap → case opens).
   - **0:15** Coach overlay highlights the auto-populated Frame.
   - **0:25** "Let's draft your first memo." → Mediation summary template auto-selected → auto-populator runs (Memo Drafter subagent invoked) → memo opens with content already there.
   - **0:50** "Export it." → DOCX downloads.
   - **0:60** Confetti + "First memo done. Now try your own case."
   - Total wall-clock: under 90 seconds.
5. **Status page** at `status.tacitus.me` — public, scraped from Cloud Monitoring uptime checks. Shows the last 90 days of API + frontend uptime, current incidents.

Wait for sign-off, especially on the demo case content (canned outputs may feel less compelling than live; but live runs cost money on every random visitor and risk leaking data through prompt injection).

### Phase 3 — Execute

- Demo Cloud Run revision: `infrastructure/cloud-run-jobs/demo-snapshot-builder/` produces a static read-only Postgres dump weekly; the demo backend reads from it.
- Demo route at `/demo/syria-2024` with CSP locked, analytics anonymous, no auth.
- Waitlist UI + Identity Platform integration.
- Magic-link flow + Identity Platform email-link sign-in.
- Onboarding extended in `src/components/onboarding/`.
- Status page at a separate Cloud Run revision pulling from Cloud Monitoring API.
- Three external testers do the 60-second wow run; record sessions; iterate.

### Phase 4 — Verify

- Demo: Lighthouse desktop score > 92; accessibility 100; 30-second comprehension test passes ("what does this app do?" — three external testers answer correctly).
- Waitlist + magic link: round-trip test, approval admin tool, expiry test.
- 60-second wow: `e2e/onboarding/60-second-wow.spec.ts` green; wall-clock under 90s.
- Status page live; uptime data flowing.

### Files to create

- `src/app/demo/syria-2024/page.tsx`, `layout.tsx`.
- `src/app/waitlist/page.tsx`.
- `src/lib/auth/magic-link.ts`.
- `src/components/onboarding/SixtySecondWow.tsx` (the new orchestrator).
- `infrastructure/cloud-run-jobs/demo-snapshot-builder/`.
- `infrastructure/terraform/modules/status-page/`.
- `e2e/onboarding/60-second-wow.spec.ts`.
- `e2e/demo/public-demo-readonly.spec.ts`.
- `docs/audits/2026-05-06-FIRST_RUN_FRICTION.md`.

### Files to edit

- Sidebar — add "Open public demo" footer link in signed-out state.
- Landing page (pack 04) — replace primary signup CTA with "Try the demo, no signup" + secondary "Join the waitlist".
- Auth flow — magic-link primary, password retained as fallback for admin/test accounts.

### Verification commands

```bash
npx playwright test e2e/demo/public-demo-readonly.spec.ts
npx playwright test e2e/onboarding/60-second-wow.spec.ts
npm run lh:ci -- --route=/demo/syria-2024
```

---

## 11. Prompt N7 — User-experience polish sweep

### Persona
Design-engineering lead. Knows that "the product works" and "the user wants to come back" are different bars, and that the difference is dozens of fifteen-minute fixes scattered across every surface.

### Phase 1 — Read & report

Walk every surface of the app — landing, login, demo, workbench tabs, settings, admin — as a user. For each, audit:

- **Empty states**: every list, table, graph, search-result panel, runs panel. Designed or blank?
- **Loading states**: skeleton, spinner, layout-shift-free, latency-appropriate (instant for cache hits, animated for > 300ms).
- **Error states**: typed message, recovery action, support link.
- **Transitions**: tab switching, modal open/close, route change, drawer open. Smooth or jarring?
- **Micro-interactions**: button press feedback, hover states, focus rings, success toasts, drag-and-drop.
- **Visual hierarchy**: typographic scale, color contrast, whitespace, alignment.
- **Accessibility**: keyboard navigation, screen reader labels, focus trap in modals, color-blind-safe palette, 4.5:1 contrast minimum.
- **Mobile**: responsive layout, touch targets ≥ 44px, no hover-only interactions.

Output `docs/audits/2026-05-06-UX_POLISH.md` with one row per surface and per dimension.

### Phase 2 — Propose & confirm

Propose remediations grouped by:
- **S0 broken**: surfaces with no empty state, no error handling, or accessibility violations. Must fix.
- **S1 jarring**: surfaces with usable but unpolished states. Should fix.
- **S2 nice-to-have**: surfaces where polish would help but isn't blocking. Backlog.

Wait for sign-off on the S0 + S1 list.

### Phase 3 — Execute

- Apply fixes in named commits, grouped by surface.
- Visual regression suite: Playwright screenshot diffs against baseline; new baseline committed at end.
- Accessibility: `axe-core` integration tests on every page; no violations of WCAG 2.1 AA.
- Animations: respect `prefers-reduced-motion`.
- Confetti on first-memo completion (pack 11 K5) — yes, but skip for `prefers-reduced-motion`.

### Phase 4 — Verify

- `audit:ux-polish` — runs a checklist against every surface; exits non-zero if S0 or S1 unresolved.
- Visual regression suite green.
- `axe-core` clean.
- Five external testers (different from the demo testers) do a 5-minute exploration; rate the experience 1-5; mean ≥ 4.

### Files to create

- `scripts/audit-ux-polish.ts`.
- `e2e/visual-regression/` — Playwright screenshot suite.
- `docs/audits/2026-05-06-UX_POLISH.md`.

### Files to edit

- Many components across the codebase.
- `audit:gate` chain — append `audit:ux-polish`.

### Verification commands

```bash
npm run audit:ux-polish
npx playwright test e2e/visual-regression/
npm run test:a11y
```

---

## 12. Prompt N8 — Load testing, capacity planning, cost projections, cost dashboard

### Persona
Performance engineer. Knows that "we tested with 5 users and it was fast" is not a load test, and that capacity planning without numbers is hand-waving.

### Phase 1 — Read & report

- Inventory all production endpoints. Categorize by expected load profile (browser-driven vs cron-driven vs ingestion-driven).
- Output `docs/audits/2026-05-06-LOAD_PROFILE.md`.

### Phase 2 — Propose & confirm

Propose load tests using `k6` (open source, GCP-native via Cloud Build):

1. **Smoke test** — 5 users, 5 minutes, every endpoint hit at least once. Sanity check.
2. **Stress test** — 100 concurrent users, each: signs up → opens case → ingests one document → runs three tools → drafts a memo → exports.
3. **Soak test** — 50 concurrent users, sustained over 1 hour. Detect memory leaks, connection pool exhaustion.
4. **Ingestion stress** — 1000 documents ingested concurrently across 10 cases. Verify two-phase commit holds.
5. **Tool-runs stress** — 10000 tool runs over 1 hour, mix of cheap (`cheap_classify`) and expensive (`complex_reasoning`). Verify cost dashboard tracks.

Capacity plan: project resource needs at 10 / 100 / 1k / 10k DAU (daily active users). For each tier: Cloud Run instances, Cloud SQL tier, Vertex AI quota, monthly cost estimate.

Cost projections per tier:
- 10 DAU: ~$200/mo
- 100 DAU: ~$1500/mo
- 1k DAU: ~$10000/mo (committed-use discounts kick in)
- 10k DAU: ~$70000/mo (negotiated enterprise rates assumed)

Wait for sign-off, especially on the at-scale projections (these inform fundraise math and pricing).

### Phase 3 — Execute

- Author k6 test scripts.
- Run each on staging; iterate on findings.
- Author cost dashboard at `/app/admin/diagnostics?tab=cost`:
  - Daily spend per resource (Vertex AI, Cloud SQL, Cloud Run, Cloud Storage, Cloud Tasks).
  - Daily spend per user (top 10 by cost).
  - Daily spend per tool (top 10).
  - Monthly run-rate vs budget.
  - Cost-per-tool-run distribution.
  - Cost-per-active-user distribution.
- Author per-user soft + hard budget caps in Identity Platform custom claims; gateway enforces.

### Phase 4 — Verify

- Each load test runs to completion with clean results.
- Capacity plan in `docs/architecture/CAPACITY_PLAN.md`.
- Cost dashboard populated with real data.
- Per-user budget cap tested: a deliberate over-budget user gets 402 with friendly message.

### Files to create

- `infrastructure/loadtest/k6/` — test scripts.
- `infrastructure/loadtest/run-stress.sh`, `run-soak.sh`, `run-ingestion.sh`, `run-tools.sh`.
- `src/components/admin/diagnostics/CostPanel.tsx`.
- `backend/services/billing/budget_enforcer.py`.
- `docs/architecture/CAPACITY_PLAN.md`.
- `docs/architecture/COST_PROJECTIONS.md`.
- `docs/audits/2026-05-06-LOAD_PROFILE.md`.

### Verification commands

```bash
bash infrastructure/loadtest/run-stress.sh --target=staging
bash infrastructure/loadtest/run-soak.sh --target=staging --duration=1h
bash infrastructure/loadtest/run-ingestion.sh --target=staging --docs=1000
bash infrastructure/loadtest/run-tools.sh --target=staging --runs=10000
```

---

## 13. Prompt N9 — Trust + compliance + Multi-Agent Codex Orchestration Playbook

### Persona
Product + legal-aware engineer. Knows that the trust pages are not optional, that a missing privacy policy will lose enterprise customers, and that documenting how the team builds with multi-agent Codex is the highest-leverage knowledge-asset the project can ship.

### Outcome

Trust + compliance pages live. The Multi-Agent Codex Orchestration Playbook committed.

### Files to create

#### Trust + compliance

- `src/app/legal/privacy-policy/page.tsx` — what data is collected, why, retention, deletion, third-party processors (Vertex AI, Anthropic if fallback used, SendGrid for email, Sentry for errors), GDPR rights summary.
- `src/app/legal/terms-of-service/page.tsx` — usage terms, acceptable use, IP, liability, dispute resolution.
- `src/app/legal/security/page.tsx` — security model summary (owner scoping, encryption at rest + in transit, CMEK in production, VPC Service Controls, audit logging, vuln-disclosure mailbox `security@tacitus.me`).
- `src/app/legal/data-retention/page.tsx` — what's kept how long, deletion semantics, export rights.
- `docs/legal/dpa-template.docx` — Data Processing Agreement template for enterprise customers.
- `infrastructure/terraform/modules/data-retention/` — automated deletion policies for inactive accounts (90 days warning, 180 days delete) and request-based GDPR erasure.

#### Multi-Agent Codex Orchestration Playbook

- `docs/contributing/CODEX_ORCHESTRATION.md` — committed playbook covering the five patterns:

  1. **Subagents pattern** — single orchestrator spawns specialized children. When to use: 3-5 tasks of similar shape, single repo. Codex CLI native subagents work here. Example: "spawn one agent per pack and audit DoD in parallel."

  2. **Agent Teams pattern** — multiple agents share a task list, peer-message, file-lock for parallel writes. When to use: 5-15 agents on independent vertical slices. Tools: Conductor, Vibe Kanban, Claude Squad, Antigravity. Example: "the production-excellence pack itself — one agent per N-prompt."

  3. **Ralph Loop pattern** — hard context reset each iteration; memory through git history. When to use: long iterative tasks where context contamination is the failure mode. Example: "running the autonomous Charter loop from `PRAXIS_CODEX_00_MASTER_CHARTER.md`."

  4. **Critic-loop pattern** — every PR reviewed by a senior-engineer-critic subagent before human review. Catches: type-safety regressions, missing tests, contract violations, over-broad changes. Implementation: Codex CLI hook on PR creation invokes a `critic` agent with the diff + repo invariants.

  5. **Demo-driven development** — write the persona test first. The test is the spec. The agent builds until the test passes. Used in this pack for the 60-second wow flow.

  Plus the worktree workflow:
  - `git worktree add ../praxis-N6 feature/public-demo`
  - Each agent gets its own worktree; merges via PR; no two agents touch the same file simultaneously.
  - Cleanup: `git worktree remove` after merge.

  And typed-schema boundaries — every agent-to-agent message validated via Pydantic / Zod. The reason this matters: messy NL boundaries are the #1 multi-agent failure mode (per GitHub Feb 2026 post).

- `scripts/codex-orchestration-template/` — copy-paste templates for spawning new orchestrations:
  - `spawn-subagents.md` — natural-language template
  - `team-handoff.json` — typed handoff schema
  - `critic-prompt.md` — critic-agent system prompt

### Phase 4 — Verify

- All legal pages live and link-checked.
- Playbook reviewed by Giulio.
- Spike test: a future pack uses one of the patterns and reports back; the pattern is documented well enough to be self-serve.

### Files to create

(All listed above.)

### Verification commands

```bash
npm run audit:legal-pages-present
npm run audit:docs   # markdownlint + lychee link check
```

---

## 14. Prompt N10 — Canary deploy to praxis.tacitus.me

### Persona
Release engineer. Knows that the launch is not an event, it is a process — 5%, then 25%, then 100%, with a rollback button at every phase.

### Phase 1 — Read & report

- Verify all prior packs' final gates green.
- Verify staging has been running clean for ≥ 24 hours.
- Output `docs/audits/2026-05-06-LAUNCH_GATE.md` — every check in the master charter §5 verified, every signed-off file present.

### Phase 2 — Propose & confirm

Propose:

- **Canary phase 1 (5% traffic, 24 hours)**: Cloud Run revision tagged `canary-5`. Monitor: error rate, latency P95, cost-per-request, persona-suite-equivalent synthetic checks. Auto-rollback if error-rate > 0.5% over 10 minutes.
- **Canary phase 2 (25% traffic, 24 hours)**: tagged `canary-25`. Same monitoring.
- **Canary phase 3 (100% traffic)**: tagged `prod`. Old revision retained for 7 days as one-click rollback.
- Communications: drafted launch announcement at `docs/launch/ANNOUNCEMENT.md` published when canary phase 3 holds for 24 hours.

Wait for sign-off at each phase.

### Phase 3 — Execute

- Deploy `canary-5`. Monitor 24 hours. Sign-off → `canary-25`. Monitor 24 hours. Sign-off → `prod`.
- Tag `v1.0.0` after `prod` holds 24 hours.
- Publish launch announcement.
- Open the waitlist publicly.
- Notify pre-approved beta users via magic-link email.

### Phase 4 — Verify

- All phases held.
- No rollback fired.
- `v1.0.0` tagged.
- Master charter §12 written.

### Files to create

- `docs/launch/CANARY_LOG.md` — log of each phase, metrics, sign-offs.
- `docs/launch/ANNOUNCEMENT.md` (final).
- `docs/launch/PRODUCTION_READINESS.signed.md` (final, signed by Giulio).

### Files to edit

- `CHANGELOG.md` — `## [1.0.0] - 2026-05-06` final entry.

### Verification commands

```bash
# Final gate from charter
npm run audit:gate
npm run test:e2e:personas

# Canary metrics
bash scripts/canary-monitor.sh --phase=5
bash scripts/canary-monitor.sh --phase=25
bash scripts/canary-monitor.sh --phase=100

# Tag
git tag v1.0.0
git push --tags
```

---

## 15. Final verification gate (before tagging v1.0.0)

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# Pack 14 audits
npm run audit:ai-provider-isolation
npm run audit:ai-provider-vertex-default
npm run audit:subagent-deployment-fresh
npm run audit:embeddings-v2-coverage
npm run audit:terraform-drift
npm run audit:observability-coverage
npm run audit:legal-pages-present
npm run audit:ux-polish

# All prior pack audits
npm run audit:gate

# Persona suites
npm run test:e2e:personas   # 10 consecutive runs, post-canary

# Demo + onboarding
npx playwright test e2e/demo/public-demo-readonly.spec.ts
npx playwright test e2e/onboarding/60-second-wow.spec.ts

# Visual regression
npx playwright test e2e/visual-regression/

# A11y
npm run test:a11y

# Subagent evals on Agent Engine
python -m backend.agents.context_preparer.eval.run_eval --target=production
python -m backend.agents.source_augmenter.eval.run_eval --target=production
python -m backend.agents.output_refiner.eval.run_eval --target=production
python -m backend.agents.memo_drafter.eval.run_eval --target=production

# Load tests passed
test -f docs/audits/2026-05-06-LOAD_PROFILE.md
test -f docs/architecture/CAPACITY_PLAN.md
test -f docs/architecture/COST_PROJECTIONS.md

# Canary held
test -f docs/launch/CANARY_LOG.md
grep -q "phase=100, status=HELD" docs/launch/CANARY_LOG.md

# Trust + legal
test -f src/app/legal/privacy-policy/page.tsx
test -f src/app/legal/terms-of-service/page.tsx
test -f src/app/legal/security/page.tsx
test -f src/app/legal/data-retention/page.tsx

# Playbook
test -f docs/contributing/CODEX_ORCHESTRATION.md

# Tag
git tag --list v1.0.0
test -f docs/launch/PRODUCTION_READINESS.signed.md
test -f docs/launch/ANNOUNCEMENT.md
```

All commands exit 0. Canary held at 100% for 24h. PRAXIS v1.0.0 is launched.

---

## 16. Out of scope

- Multi-region production (us-central1 + europe-west4) — v1.1.
- AlloyDB migration from Cloud SQL — when graph queries outgrow Cloud SQL HA limits, ~v2.
- Vertex AI Vector Search as primary search (replacing pgvector) — v2 enterprise tier.
- A2A (Agent2Agent) protocol exposing PRAXIS tools to other GCP-native apps — v2.
- White-label deployment for INGOs / governments — v2.
- Mobile workbench — v2.
- i18n (Arabic, French, Russian, Chinese, Spanish) — v3.
- Edge deployment for low-bandwidth field operations — v3.
- Public sharing of cases — v3.
- Partner / customer / contact integrations beyond email — v2+.

---

## 17. Closing note

Pack 14 is the **make-it-real** pack. The eleven prior packs built the architecture; this pack puts that architecture on Google Cloud, wires it to Vertex AI, gives it a public face the user can find without being an existing customer, polishes every interaction the user will have, and rolls it out to production with the discipline a real product deserves.

The innovation in this pack is not in any single component. It is in the *integration*: a four-layer context substrate served by a Postgres-backed knowledge graph, with an ontology-aware ingestion pipeline that produces validated graph augmentations through a symbolic firewall, with sixteen tools that consume context through a single typed API, with four LangGraph subagents running on Vertex AI Agent Engine for managed observability, with a memo studio that grounds every assertion in graph citations, with a Cytoscape graph viewer that round-trips edits, with a public read-only demo that converts a curious visitor into a signed-up user in under sixty seconds, all running on Terraform-provisioned GCP infrastructure with end-to-end Cloud Trace coverage and budget alerts wired to Sentry — that is the integration that no off-the-shelf product offers a policy / mediation / conflict / diplomacy professional, and that integration is what turns PRAXIS from "a useful prototype" into the workbench that defines its category.

The Multi-Agent Codex Orchestration Playbook (N9) is a knowledge asset that pays compounding returns. Every future pack runs faster because the patterns are documented, the tooling is configured, and the failure modes are known. The playbook is the meta-deliverable of pack 14.

Branch: `feature/production-excellence-gcp`. Commit prefix `prod(<area>): <prompt-id> <description>` (e.g., `prod(vertex-ai): N1 wire VertexAIProvider with model matrix`). PR titled `Pack 14 — Production Excellence on Google Cloud`.

Do not merge to `main` without:
1. All audits in §15 green.
2. Canary phase 100% held for 24 hours with no rollback.
3. Persona suites green for 10 consecutive runs post-canary.
4. Giulio's signature on `docs/launch/PRODUCTION_READINESS.signed.md`.
5. Cost projection in `docs/architecture/COST_PROJECTIONS.md` reviewed and approved.
6. The launch announcement at `docs/launch/ANNOUNCEMENT.md` finalized.

After merge:
1. Tag `v1.0.0`.
2. Open the waitlist publicly.
3. Notify pre-approved beta users.
4. Begin the v1.1 roadmap from the Comprehensive Audit (Pack 11 K9) and the post-launch backlog.

PRAXIS at praxis.tacitus.me. Live. Real. Helping the people it was built for.

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_14_PRODUCTION_EXCELLENCE.md`

**Update to master charter**: Add row 14 to §1 of `PRAXIS_CODEX_00_MASTER_CHARTER.md`:

| 14 | Production Excellence on Google Cloud | `C:\Users\giuli\Downloads\PRAXIS_CODEX_14_PRODUCTION_EXCELLENCE.md` | Vertex AI primary, GCP-native deploy, multi-agent orchestration, UX polish, canary launch | `feature/production-excellence-gcp` | ~75 | ☐ |

Total cumulative scope across all 12 packs: **~618 hours / ~60 working days**.
