# PRAXIS TODO

Last updated: 2026-05-13.

## Current Build Queue

- v5 MVP control file: `docs/build/PRAXIS_v5_EXECUTION_LEDGER.md`.
- v5 operating guide: `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`.
- Backend phase prompts: `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md`.
- Frontend/ship prompts: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md`.

## Immediate Next Steps

0. Verify the Context Core Lite mode switch in a signed-in browser flow:
   PRAXIS mode must create a Situation Core, Capsule, Context Package, active
   stack, and health/gaps summary; DIALECTICA mode must remain clearly disabled
   as "Coming soon" while pointing to the typed adapter contract.
1. Verify the experimental Grafeo Context Core Lite graph in a signed-in browser
   flow and Cloud Run build before making `grafeo_experimental` anything other
   than an opt-in backend. Keep Firestore capsules/context packages as the MVP
   source of truth.
2. Extend Active Context Stack persistence beyond the reliable default stack to named stacks when the final multi-stack UX is approved.
3. Promote Canvas from draggable review-layout nodes to a richer read/write graph-editing surface if the team approves that scope; React Flow is not needed for the current MVP.
4. Add a signed-in integration test for v5 demo copy against a Firebase emulator or test project; current validation covers the typed demo core objects and the UI copy affordance, not a live Firestore mutation.
5. Add the first PRAXIS-to-DIALECTICA adapter proof only after the standalone MVP flow is smooth: one typed context query, one cited response, one reviewable graph delta.
6. Complete Pack 24 backend Reasoning Spine: Rust BLAKE3 context-pack compiler, real trace ids, Langfuse or equivalent trace store, and live event streaming behind the current Spine panel.
7. Complete Pack 23 backend Library Bucket: production-grade source auto-structure after upload, including better PDF page provenance, source-span citations, entity normalization, and review queues beyond the current inline MVP extraction.
8. Keep user-created Situation Cores primary inside `/app/contexts` and `/app/cores/context`; public `/contexts` is now only a redirect.
9. Reconcile checkout/pricing with the current Polar billing implementation and any approved Stripe requirement.
10. Track persona smoke CI until the required 10 consecutive green runs are real, not projected; current streak is 3/10.
11. Decide whether to leave Cognee disabled-first or deploy the separate `praxis-cognee` service.
12. Review the 2026-05-13 GCP/Firebase cleanup candidates before any mutating cloud cleanup: retired provider secrets, Artifact Registry retention, and the two unclear projects `plasma-talon-lt3cf` / `google-mpf-mc7f341560lx`.
13. Run live export/download checks for briefing and boardroom artifacts in the next improvement round.
14. Add production-browser coverage for the authenticated command palette once a stable production test user/session path is approved; local signed-session smoke now covers the simplified five-surface flow.
15. After the current capsule/core composer lands, use `docs/superpowers/specs/2026-05-15-next-20-simplification-ai-context-writing-search.md` as the next improvement queue for simplification, stronger AI, context creation/combination, drafting, writing, and search.

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
