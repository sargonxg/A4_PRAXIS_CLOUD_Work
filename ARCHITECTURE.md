# PRAXIS Architecture

Last updated: 2026-05-28.

## Canonical references

- [`docs/architecture/PRAXIS_ARCHITECTURE.md`](./docs/architecture/PRAXIS_ARCHITECTURE.md) — architecture bible / invariant source.
- [`docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`](./docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md) — shipped, partial, gated, and drift state.
- [`docs/architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md`](./docs/architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md) — canonical Ask PRAXIS / AgentRun / Genkit / ADK runtime architecture: PRAXIS-owned state, queued worker execution, mirrored events, approvals, receipts, evals, and local-vs-production proof.
- [`docs/architecture/PRAXIS_DIALECTICA_KNOWLEDGE_LAYER_ALIGNMENT.md`](./docs/architecture/PRAXIS_DIALECTICA_KNOWLEDGE_LAYER_ALIGNMENT.md) — future product boundary: PRAXIS as the user-facing policy workbench, DIALECTICA as the ingestion/knowledge layer, with KAIROS and AGON feeding structured evidence upstream.
- [`docs/PRAXIS_CODEX_PLAYBOOK.md`](./docs/PRAXIS_CODEX_PLAYBOOK.md) — authoritative priorities, vision→gap map, and per-surface work packets. The current visible product spine is Home + Capsules, with Ask, sources, outputs, diagnostics, and agent work inside the shared cockpit.
- [`docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`](./docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md) — current canonical product/app structure for the Tasklet-style ContextCapsule runtime on Google Cloud.
- [`docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`](./docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md) — canonical guide for policy/statecraft capsule anatomy, generic and path-bound users, personas, combination, tools, connectors, and output products.
- [`docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`](./docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md) — implementation plan for persistent capsule-aware agents, Cloud SQL run ledger, Cloud Tasks dispatch, approvals, MCP, and browser/sandbox deferral.
- [`docs/product/TASKLET_RESEARCH_INTAKE_2026-05-15.md`](./docs/product/TASKLET_RESEARCH_INTAKE_2026-05-15.md) — what was incorporated from the external Tasklet-class browser-agent research and what was rejected/deferred.
- [`docs/product/PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md`](./docs/product/PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md) — current coherence check across product docs, substrate, and build order.
- [`docs/product/PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md`](./docs/product/PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md) — ADK + Genkit integration map: ADK owns long-running/multi-step workers, Genkit owns typed flows/tools/structured outputs/evals, and PRAXIS owns ContextCapsules, Firestore app state, Cloud SQL run ledger, approvals, and receipts.
- [`docs/architecture/GRAPHLITE_CAPSULE_EMBEDDED_GRAPH.md`](./docs/architecture/GRAPHLITE_CAPSULE_EMBEDDED_GRAPH.md) — selected GraphLite embedded graph plan for Capsule+ exports, local GQL inspection, ontology hints, provenance, advisory recall, and review-gated graph rows.
- [`docs/architecture/TRUSTGRAPH_CONTEXT_SUBSTRATE.md`](./docs/architecture/TRUSTGRAPH_CONTEXT_SUBSTRATE.md) — legacy optional TrustGraph bridge/substrate plan for derived capsule context, graph paths, ontology extraction, and explainability receipts.
- [`docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`](./docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md) — active implementation ledger and queue for the public-to-app, capsule workbench, run ledger, dispatch, and agent waves.
- [`docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`](./docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md) — copy-paste Codex and Claude Code prompts for parallel implementation sessions.

## Historical / Subsumed Directions

Historical v4/v5/v7 and May 8 design-led slice plans were removed during the
Tasklet cleanup pass, and the dated daily audit ledgers were pruned on 2026-06-01.
Use the product docs above and
[`docs/PRAXIS_CODEX_PLAYBOOK.md`](./docs/PRAXIS_CODEX_PLAYBOOK.md)
for the current priorities and cleanup rules.

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
- ADK and Genkit as runtime substrates only: ADK for long-running/multi-step
  workers, Genkit for typed flows/tools/structured outputs/evals. Neither ADK
  sessions nor Genkit traces are canonical product state.

The next canonical runtime target is Cloud Run first, GKE later:

- `praxis-frontend` remains the public Cloud Run service for the Next.js app
  and control-plane API routes.
- `praxis-agent-worker` becomes the private Cloud Run worker for queued
  capsule-aware agent runs.
- Cloud SQL Postgres becomes the canonical agent run ledger for runs, tool
  calls, approvals, document chunks, and operational joins.
- Firestore remains the owner-scoped source of truth for capsules,
  context stacks, cores, and user-facing app state.
- ContextCapsules now normalize v1/v2/v3 envelopes into the v3 in-memory
  contract on read. Firestore remains canonical; Capsule+ graph materialization,
  Cognee recall, and imported graph rows are derived/review-gated artifacts.
- Capsule+ exports now include optional GraphLite GQL seed artifacts for
  owner/capsule-scoped embedded graph inspection. These artifacts are portable
  and advisory; they do not replace Firestore canonical capsule state or
  Postgres approved graph rows.
- GraphLite advisory recall is disabled-first. Enabled recall flows through a
  private `praxis-graphlite-bridge` contract and can return only provenance-
  bound embedded graph context, explainability receipts, and review-gated graph
  candidates.
- Capsule readiness is derived from the unified quality/readiness path and is
  softly adjusted by usage rollups from agent read receipts: thin fallback,
  dropped-core events, and stale-core hits lower operability readiness.
- Cognee remains disabled-first and advisory-only. Enabled recall flows through
  the isolated `praxis-cognee` service contract and can promote only
  capsule-scoped memory facts through review cards.
- TrustGraph remains a legacy disabled-first compatibility lane. Prefer
  GraphLite for embedded capsule graph artifacts unless a dedicated TrustGraph
  service plan is explicitly active.
- Cloud Tasks dispatches durable per-run work; Pub/Sub broadcasts events;
  Cloud Scheduler triggers daily briefs/watchlists and maintenance.
- MCP and browser/code sandbox workers are phased after run ledger and approval
  gates are stable.
- When browser automation becomes necessary, the preferred deferred lane is
  `browser-use` plus Steel.dev managed first, self-hosted on GKE only when
  economics or concurrency require it.

## Product Surface Doctrine

The current product shell is intentionally small:

- Public Home (`/`) is the prompt-first entry.
- Signed-in Home and Capsules are the only primary product surfaces.
- Ask PRAXIS, capsule library, source review, Memo Studio, canvas/graph work,
  diagnostics, and AgentRun proof appear as panels/actions inside the shared
  cockpit and `TaskletPraxisWorkbench`.
- Legacy signed-in URLs and focused run URLs may redirect or deep-link for
  compatibility, but they must reuse the shared cockpit and must not add a new
  top-level app page or primary navigation item.

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
- [`docs/audits/2026-05-06-MASTER_CHARTER_STATUS.md`](./docs/audits/2026-05-06-MASTER_CHARTER_STATUS.md): current master-charter status.
