# PRAXIS Architecture

Last updated: 2026-05-06.

The canonical architecture reference is now:

- [`docs/architecture/PRAXIS_ARCHITECTURE.md`](./docs/architecture/PRAXIS_ARCHITECTURE.md)

The live-app parity layer is:

- [`docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`](./docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md)

Read both together. The architecture bible is the product/architecture target
and invariant source. The live-app alignment document records what is shipped,
what is partially implemented, and what remains owner-gated or production-gated.

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

## Active Enforcement

The following architectural gates are active in the repo:

- `npm run audit:routes`
- `npm run audit:ai-provider-isolation`
- `npm run audit:ai-provider-vertex-default`
- `npm run audit:observability-coverage`
- `npm run audit:ux-polish`
- `npm run audit:context-vs-tools`
- `npm run audit:context-aware-coverage`
- `npm run audit:ontology`
- `npm run audit:tool-marketplace`
- `npm run audit:tool-contract-v2`
- `npm run audit:tool-skills-present`
- `npm run audit:kg-backend`
- `npm run audit:memo-studio`
- `npm run audit:architecture-reference`

`npm run audit:gate` includes these checks, then reaches the known `audit:gcp`
barrier when local `gcloud` credentials require interactive reauthentication.

## Deeper References

- [`README.md`](./README.md): high-level repo guide.
- [`AGENTS.md`](./AGENTS.md): AI-agent startup order.
- [`docs/architecture/MODEL_SELECTION.md`](./docs/architecture/MODEL_SELECTION.md): model matrix and Gemini Enterprise / Vertex AI posture.
- [`docs/architecture/CAPACITY_PLAN.md`](./docs/architecture/CAPACITY_PLAN.md): Pack 14 capacity plan scaffold.
- [`docs/backlog/2026-05-06-master-charter-completion-todo.md`](./docs/backlog/2026-05-06-master-charter-completion-todo.md): live remaining-work ledger.
- [`docs/audits/2026-05-06-MASTER_CHARTER_STATUS.md`](./docs/audits/2026-05-06-MASTER_CHARTER_STATUS.md): current master-charter status.
