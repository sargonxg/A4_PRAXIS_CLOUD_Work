# PRAXIS Architecture

Last updated: 2026-05-15.

## Canonical references

- [`docs/architecture/PRAXIS_VISION_v4_01_VISION.md`](./docs/architecture/PRAXIS_VISION_v4_01_VISION.md) — v5 MVP product vision and three-persona market frame.
- [`docs/architecture/PRAXIS_VISION_v4_02_ARCHITECTURE.md`](./docs/architecture/PRAXIS_VISION_v4_02_ARCHITECTURE.md) — v5 MVP architecture direction: dual ontology layer, owner scope, model/provider boundaries, and two-phase commit posture.
- [`docs/architecture/PRAXIS_VISION_v4_03_BUILD.md`](./docs/architecture/PRAXIS_VISION_v4_03_BUILD.md) — v5 MVP phase plan and build governance.
- [`docs/architecture/PRAXIS_ARCHITECTURE.md`](./docs/architecture/PRAXIS_ARCHITECTURE.md) — architecture bible / invariant source.
- [`docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`](./docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md) — shipped, partial, gated, and drift state.
- [`docs/architecture/PRAXIS_DIALECTICA_KNOWLEDGE_LAYER_ALIGNMENT.md`](./docs/architecture/PRAXIS_DIALECTICA_KNOWLEDGE_LAYER_ALIGNMENT.md) — future product boundary: PRAXIS as the user-facing policy workbench, DIALECTICA as the ingestion/knowledge layer, with KAIROS and AGON feeding structured evidence upstream.
- [`docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md`](./docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md) — current product model (Home, Ask PRAXIS, Sources, Situation Model, Outputs, Advanced; eight context cores).
- [`docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`](./docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md) — current canonical product/app structure for the Tasklet-style ContextCapsule runtime on Google Cloud.
- [`docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`](./docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md) — implementation plan for persistent capsule-aware agents, Cloud SQL run ledger, Cloud Tasks dispatch, approvals, MCP, and browser/sandbox deferral.
- [`docs/product/TASKLET_RESEARCH_INTAKE_2026-05-15.md`](./docs/product/TASKLET_RESEARCH_INTAKE_2026-05-15.md) — what was incorporated from the external Tasklet-class browser-agent research and what was rejected/deferred.
- [`docs/product/PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md`](./docs/product/PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md) — current coherence check across product docs, substrate, and build order.
- [`docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`](./docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md) — copy-paste Codex and Claude Code prompts for parallel implementation sessions.

## Active MVP Build (v5)

- [`docs/build/PRAXIS_v5_EXECUTION_LEDGER.md`](./docs/build/PRAXIS_v5_EXECUTION_LEDGER.md) — phase queue, validation, commit, and blocker ledger.
- [`docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`](./docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md) — agent operating guide.
- [`docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md`](./docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md) and [`docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md`](./docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md) — executable phase prompts.

## Historical / Subsumed Directions

- [`docs/v7/STATUS.md`](./docs/v7/STATUS.md) — slice ledger.
- [`docs/v7/00_VISION_AND_OPERATING_PRINCIPLES.md`](./docs/v7/00_VISION_AND_OPERATING_PRINCIPLES.md).
- [`docs/v7/SLICES/`](./docs/v7/SLICES/) — v7 design-led simplification slices. Slice 1 is now mapped to v5 Phase 1; remaining v7 slices are historical planning references unless remapped in the v5 ledger.

## Current Production Shape

PRAXIS is a dual-service GCP application:

- Next.js 16 frontend and API gateway on Cloud Run.
- Private Python FastAPI backend on Cloud Run for graph, extraction, pipeline,
  and analysis work.
- Firebase Auth and Firestore for user/session/situation metadata.
- Postgres + pgvector architecture as the knowledge-graph target, with
  Firestore-backed compatibility paths still present while production cutover
  evidence is gathered.
- Cloud Storage for blobs and exports.
- Vertex AI as the managed model runtime, aligned with Gemini Enterprise as the
  enterprise agent/work platform.

The next canonical runtime target is Cloud Run first, GKE later:

- `praxis-frontend` remains the public Cloud Run service for the Next.js app
  and control-plane API routes.
- `praxis-agent-worker` becomes the private Cloud Run worker for queued
  capsule-aware agent runs.
- Cloud SQL Postgres becomes the canonical agent run ledger for runs, tool
  calls, approvals, document chunks, and operational joins.
- Firestore remains the owner-scoped source of truth for capsules,
  context stacks, cores, and user-facing app state.
- Cloud Tasks dispatches durable per-run work; Pub/Sub broadcasts events;
  Cloud Scheduler triggers daily briefs/watchlists and maintenance.
- MCP and browser/code sandbox workers are phased after run ledger and approval
  gates are stable.
- When browser automation becomes necessary, the preferred deferred lane is
  `browser-use` plus Steel.dev managed first, self-hosted on GKE only when
  economics or concurrency require it.

## Active Enforcement

The following architectural gates are active in the repo:

- `npm run audit:routes`
- `npm run audit:architecture-chain`
- `npm run audit:architecture-reference`
- `npm run audit:ai-provider-isolation`
- `npm run audit:ai-provider-vertex-default`
- `npm run audit:observability-coverage`
- `npm run audit:ux-polish`
- `npm run audit:context-vs-tools`
- `npm run audit:context-aware-coverage`
- `npm run audit:ontology`
- `npm run audit:ontology-mapping`
- `npm run audit:ontology-versions`
- `npm run audit:context-types-parity`
- `npm run audit:tool-marketplace`
- `npm run audit:tool-contract-v2`
- `npm run audit:tool-skills-present`
- `npm run audit:tool-skill-conforms`
- `npm run audit:tool-context-isolation`
- `npm run audit:firewall-coverage`
- `npm run audit:owner-scoping`
- `npm run audit:postgres-schema-current`
- `npm run audit:kg-drift`
- `npm run audit:legal-pages-present`
- `npm run audit:kg-backend`
- `npm run audit:memo-studio`

`npm run audit:architecture-chain` verifies that every `npm run ...` command
listed in the architecture bible's §19 audit chain is either implemented in
`package.json` or explicitly listed as owner/cloud-gated in the live alignment
doc. `npm run audit:gate` includes these checks, then reaches the known
`audit:gcp` barrier when local `gcloud` credentials require interactive
reauthentication.

## Deeper References

- [`README.md`](./README.md): high-level repo guide.
- [`AGENTS.md`](./AGENTS.md): AI-agent startup order.
- [`docs/architecture/MODEL_SELECTION.md`](./docs/architecture/MODEL_SELECTION.md): model matrix and Gemini Enterprise / Vertex AI posture.
- [`docs/architecture/CAPACITY_PLAN.md`](./docs/architecture/CAPACITY_PLAN.md): Pack 14 capacity plan scaffold.
- [`docs/backlog/2026-05-06-master-charter-completion-todo.md`](./docs/backlog/2026-05-06-master-charter-completion-todo.md): live remaining-work ledger.
- [`docs/audits/2026-05-06-MASTER_CHARTER_STATUS.md`](./docs/audits/2026-05-06-MASTER_CHARTER_STATUS.md): current master-charter status.
