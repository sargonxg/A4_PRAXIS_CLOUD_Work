# PRAXIS Documentation Map

Updated: 2026-09-30
Status: canonical documentation entrypoint

Start here when orienting the repo. Historical documents remain useful, but the
files below define the current product, runtime, validation, and ship posture.

Current checkpoint: [user readiness](reviews/2026-09-29-praxis-user-readiness.md)
records repairs and remaining work. The [production acceptance record](reviews/2026-09-29-praxis-production-acceptance.md)
records the exact served release and real-service journey results.

## Current Entrypoints

1. [`../README.md`](../README.md) - repo overview, setup, validation, deploy.
2. [`../STATUS.md`](../STATUS.md) - newest implementation checkpoints.
3. [`../TODO.md`](../TODO.md) - current build queue and next work.
4. [`../CHANGELOG.md`](../CHANGELOG.md) - shipped changes by wave.
5. [`CODEX_SESSION_BRIEF.md`](./CODEX_SESSION_BRIEF.md) - Codex startup and ship lane.
6. [`product/README.md`](./product/README.md) - canonical product docs index.
7. [`product/PRAXIS_PUBLIC_COPY_CONTRACT_2026-06-09.md`](./product/PRAXIS_PUBLIC_COPY_CONTRACT_2026-06-09.md) - public/pre-login copy contract.
8. [`architecture/PRAXIS_ARCHITECTURE.md`](./architecture/PRAXIS_ARCHITECTURE.md) - architecture reference.
9. [`GCP_OPERATIONS.md`](./GCP_OPERATIONS.md) - cloud operations and deploy notes.
10. [`audits/README.md`](./audits/README.md) - audit index and latest red flags.
11. [Agent runtime ownership](architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md) - context, execution, approvals and saved output.
12. [Optional backend agent integrations](architecture/PRAXIS_BACKEND_AGENT_INTEGRATIONS.md) - Python integration boundaries and validation.

## Current Product Truth

- PRAXIS is a ContextCapsule-native policy workspace.
- Public and pre-login UX should be human-first: ask the question, attach
  sources or saved context when needed, and leave with reviewable work.
- The visible app stays simple: public Home plus signed-in Home and Capsules;
  Ask, writing and inspection stay inside the existing cockpit/workbench.
- Firestore ContextCapsules remain canonical.
- Graph, ontology, Cognee, SQL projection, and advisory memory enrichment stay
  proposed/non-canonical until a human review gate promotes them.
- The active capsule catalog is
  `2026-05-30-capsule-consolidation-expert-grade-v15`.

## Documentation Hygiene

- Prefer updating these index files over adding another standalone plan.
- Keep dated audits as evidence unless a cleanup commit proves no references.
- Move obsolete prompt packs or historical plans under `docs/_archive` only
  after current docs no longer route to them.
- When behavior changes, update `README.md`, `STATUS.md`, `TODO.md`,
  `CHANGELOG.md`, and the relevant product/architecture doc together.
