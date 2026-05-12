# PRAXIS TODO

Last updated: 2026-05-11.

## Current Build Queue

- v5 MVP control file: `docs/build/PRAXIS_v5_EXECUTION_LEDGER.md`.
- v5 operating guide: `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`.
- Backend phase prompts: `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md`.
- Frontend/ship prompts: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md`.

## Immediate Next Steps

1. Make Ask PRAXIS persist recommended next moves from the active User Core and Situation Core so the dashboard suggestions become saved workspace state, not only UI guidance.
2. Complete Pack 24 backend Reasoning Spine: Rust BLAKE3 context-pack compiler, real trace ids, Langfuse or equivalent trace store, and live event streaming behind the current Spine panel.
3. Complete Pack 23 backend Library Bucket: real DOCX/PDF/MD ingestion, source receipts, hybrid search, and provenance-ledger persistence behind the current Drafter Companion UI.
4. Merge private user-created contexts into `/contexts`; the wizard now creates owner-scoped contexts and opens the workbench, but the list still shows examples only.
5. Make Drafting and Memo Studio visibly show which cores fed the current output.
6. Reconcile checkout/pricing with the current Polar billing implementation and any approved Stripe requirement.
7. Track persona smoke CI until the required 10 consecutive green runs are real, not projected; current streak is 3/10.
8. Decide whether to leave Cognee disabled-first or deploy the separate `praxis-cognee` service.
9. Run live export/download checks for briefing and boardroom artifacts in the next improvement round.

## Live Production Blockers

- Provider-backed notification delivery remains open; see `BLOCKERS.md`.
- Live Cognee SDK calls remain service-owned and disabled-first; see `BLOCKERS.md`.
- Deep pre-ship live checks still require staging/prod execution; see `BLOCKERS.md`.
- Phase 9 production deploy approval was granted in this session; final QA is recorded in `docs/audits/2026-05-11-v5-final-product-qa.md`; billing provider configuration remains open.

## Standing Rules

- Do not touch the security boundaries listed in `CLAUDE.md`.
- Cognee stays disabled-first in production.
- Do not run mutating cloud/deploy commands without Giulio's explicit approval.
- Keep claims aligned with `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`.

## Repo Shape And Next-Round Readiness

- **graphify**: knowledge graph at `graphify-out/`. Run `graphify update .` after code edits to keep it current.
- **Knip**: dead-export detection. Not currently in `audit:gate`; run on demand when chasing unused exports.
- **audit:architecture-reference**: startup docs link to `docs/architecture/PRAXIS_ARCHITECTURE.md` and `PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`.
- **smoke:core-flows**: fast Playwright check for the landing context switch, `/contexts` creation modal, and drafting route.
