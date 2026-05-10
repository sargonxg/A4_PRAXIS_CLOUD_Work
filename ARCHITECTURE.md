# PRAXIS Architecture

Last updated: 2026-05-10.

## Canonical references

- [`docs/architecture/PRAXIS_ARCHITECTURE.md`](./docs/architecture/PRAXIS_ARCHITECTURE.md) — architecture bible / invariant source.
- [`docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`](./docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md) — shipped, partial, gated, and drift state.
- [`docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md`](./docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md) — current product model (Home, Ask PRAXIS, Sources, Situation Model, Outputs, Advanced; eight context cores).

## Active simplification (v7)

- [`docs/v7/STATUS.md`](./docs/v7/STATUS.md) — slice ledger.
- [`docs/v7/00_VISION_AND_OPERATING_PRINCIPLES.md`](./docs/v7/00_VISION_AND_OPERATING_PRINCIPLES.md).
- [`docs/v7/SLICES/`](./docs/v7/SLICES/) — proposed slices, do not implement without explicit approval.

## Cleanup pass

The 2026-05-10 v4 cleanup pass moved historical specs, codex prompts, V2
session intakes, and the phase-foundation docs to
[`docs/_archive/2026-05-pre-v4/`](./docs/_archive/2026-05-pre-v4/). The
cleanup inventory is at
[`docs/audits/2026-05-10-v4-cleanup-inventory.md`](./docs/audits/2026-05-10-v4-cleanup-inventory.md)
and the completion summary is at
[`docs/audits/2026-05-10-v4-cleanup-completion.md`](./docs/audits/2026-05-10-v4-cleanup-completion.md).

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
