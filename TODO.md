# PRAXIS TODO

Last updated: 2026-05-11.

## Current Build Queue

- v5 MVP control file: `docs/build/PRAXIS_v5_EXECUTION_LEDGER.md`.
- v5 operating guide: `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`.
- Backend phase prompts: `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md`.
- Frontend/ship prompts: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md`.

## Immediate Next Steps

1. Finish Queue `17` by committing/pushing the `/app` dashboard redirect patch, redeploying the frontend, and recording the final Cloud Build/revision.
2. Continue Queue `18` final product QA and red-team review on live production.
3. Reconcile checkout/pricing with the current Polar billing implementation and any approved Stripe requirement.
4. Track persona smoke CI until the required 10 consecutive green runs are real, not projected.

## Live Production Blockers

- Provider-backed notification delivery remains open; see `BLOCKERS.md`.
- Live Cognee SDK calls remain service-owned and disabled-first; see `BLOCKERS.md`.
- Deep pre-ship live checks still require staging/prod execution; see `BLOCKERS.md`.
- Phase 9 production deploy approval was granted in this session; final QA and billing provider configuration remain open.

## Standing Rules

- Do not touch the security boundaries listed in `CLAUDE.md`.
- Cognee stays disabled-first in production.
- Do not run mutating cloud/deploy commands without Giulio's explicit approval.
- Keep claims aligned with `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`.

## Repo Shape And Next-Round Readiness

- **graphify**: knowledge graph at `graphify-out/`. Run `graphify update .` after code edits to keep it current.
- **Knip**: dead-export detection. Not currently in `audit:gate`; run on demand when chasing unused exports.
- **audit:architecture-reference**: startup docs link to `docs/architecture/PRAXIS_ARCHITECTURE.md` and `PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`.
