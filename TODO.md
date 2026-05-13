# PRAXIS TODO

Last updated: 2026-05-13.

## Current Build Queue

- v5 MVP control file: `docs/build/PRAXIS_v5_EXECUTION_LEDGER.md`.
- v5 operating guide: `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`.
- Backend phase prompts: `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md`.
- Frontend/ship prompts: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md`.

## Immediate Next Steps

1. Extend Active Context Stack persistence beyond the default stack to named stacks and saved Canvas layouts when the final multi-stack UX is approved.
2. Promote Canvas from review-light structure nodes to a read/write layout surface if the team approves adding React Flow or using the current graph stack for draggable persisted layouts.
3. Add a signed-in integration test for v5 demo copy against a Firebase emulator or test project; current validation covers the typed demo core objects and the UI copy affordance, not a live Firestore mutation.
4. Add the first PRAXIS-to-DIALECTICA adapter proof only after the standalone MVP flow is smooth: one typed context query, one cited response, one reviewable graph delta.
5. Complete Pack 24 backend Reasoning Spine: Rust BLAKE3 context-pack compiler, real trace ids, Langfuse or equivalent trace store, and live event streaming behind the current Spine panel.
6. Complete Pack 23 backend Library Bucket: deeper source auto-structure after upload: persisted extracted key claims, actors, and timeline events for every PDF/DOCX/MD source receipt.
7. Keep user-created Situation Cores primary inside `/app/contexts` and `/app/cores/context`; public `/contexts` is now only a redirect.
8. Reconcile checkout/pricing with the current Polar billing implementation and any approved Stripe requirement.
9. Track persona smoke CI until the required 10 consecutive green runs are real, not projected; current streak is 3/10.
10. Decide whether to leave Cognee disabled-first or deploy the separate `praxis-cognee` service.
11. Review the 2026-05-13 GCP/Firebase cleanup candidates before any mutating cloud cleanup: retired provider secrets, Artifact Registry retention, and the two unclear projects `plasma-talon-lt3cf` / `google-mpf-mc7f341560lx`.
12. Run live export/download checks for briefing and boardroom artifacts in the next improvement round.
13. Add production-browser coverage for the authenticated command palette once a stable production test user/session path is approved; local signed-session smoke now covers the simplified five-surface flow.

## Future Architecture Direction

- Keep PRAXIS focused on user context, analysis, writing, review, and handover.
- Use DIALECTICA as the ingestion and knowledge layer through a narrow adapter contract; see `docs/architecture/PRAXIS_DIALECTICA_KNOWLEDGE_LAYER_ALIGNMENT.md`.
- Treat KAIROS and AGON as upstream evidence/graph providers to DIALECTICA, not as direct PRAXIS UI dependencies.

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
- **smoke:core-flows**: fast Playwright check for the landing Ask preview, `/app/cores/context`, and memo output in the workbench.
- **audit:mvp-route-shape**: static guard that legacy public demo/context/method/draft/user routes redirect into the canonical app surface.
