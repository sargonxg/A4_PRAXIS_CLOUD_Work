# Phase 00 - establish the real integration baseline

Additional required reading: [research/RESEARCH_DECISIONS.md](../../research/RESEARCH_DECISIONS.md), [research/SOLO_FOUNDER_EXECUTION.md](../../research/SOLO_FOUNDER_EXECUTION.md). Use these as design inputs; verify current provider/repository contracts in this checkout.

Execute this phase before product changes. Read the repository's active AGENTS.md chain and every document it requires before architecture work. Read the kit controller, full project blueprint, implementation contracts and acceptance matrix. The dated reference inspection was commit `276d9cbb62c2cd6a212770c4fa78547c901ee82b`; your checkout may be newer.

Inspect branch, commit, uncommitted changes, runtime pins, package manager, lockfile and available tests. Never overwrite unrelated work. Locate the actual authenticated app shell and route boundaries, current workbench/project model, evidence storage, object storage, native capsule services, cognitive compiler, source receipts, review service, central model gateway, worker dispatch, scheduler and deployment procedure. Search first; do not assume `src/lib/projects` exists because an old note named it.

The inspected contracts included `src/lib/context/capsule-v3.ts`, `src/lib/cognitive-capsule/compiler.ts`, `src/lib/cognitive-capsule/types.ts`, `src/types/source-receipt.ts` and `src/lib/agent-runtime/schema.ts`. Verify their current forms and callers. Inspect the authoritative storage/data-plane documents before deciding where SIGNAL assertions belong. A stale graph report can assist navigation but cannot override current code.

Install locked dependencies using the repository's runtime and normal install procedure. Run applicable baseline typecheck, lint, focused tests and required architecture/provider audits. Do not run production writes, seeding/backfill or live deployment scripts to establish a baseline. Record pre-existing failures and unavailable auth/provider checks precisely.

Create `docs/signal/PROGRESS.md` from the kit template. Create `docs/signal/INTEGRATION_MAP.md` with current paths, public function signatures, storage ownership, tenant boundary and planned additive changes. Create `docs/signal/DECISIONS.md` with the ledger/projection choice and any deviations from the blueprint. If appropriate, add the small AGENTS pointer without replacing existing instructions.

Acceptance: the integration map points to real code; runtime and lockfile are recorded; baseline failures are distinguished from missing access; `/signal` is an additive authenticated module; no production data or unrelated code changed. Finish with the concrete map and next phase. Do not spend this phase implementing every feature.
