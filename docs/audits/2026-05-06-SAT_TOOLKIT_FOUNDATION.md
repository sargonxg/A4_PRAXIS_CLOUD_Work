# Pack 15 SAT Toolkit Foundation Pass

Date: 2026-05-06

## Implemented

- Added shared SAT TypeScript schemas at `src/types/sats.ts`.
- Added Pydantic mirrors at `backend/types/sats.py`.
- Added deterministic ACH ranking at `src/lib/sats/ach-ranking.ts`.
- Added first-class ACH routes:
  - `/app/workbench/[caseId]/ach`
  - `/app/workbench/[caseId]/ach/[achId]`
- Added ACH workbench tab and reusable ACH matrix components.
- Added authenticated ACH persistence routes:
  - `GET/POST /api/sats/ach?caseId=...`
  - `GET/PATCH /api/sats/ach/[achId]?caseId=...`
- Added owner-scoped Firestore ACH helper at `src/lib/sats/ach-store.ts`.
- Wired the ACH workbench to list, create, load, edit cell ratings, save, and export Markdown.
- Extended marketplace contracts with optional `satCategory`.
- Added four Analyst's Toolkit registry entries:
  - `cross.ach`
  - `cross.kac`
  - `cross.red-team`
  - `cross.premortem`
- Added SAT skill files with Heuer-Pherson/Klein attribution.
- Added red-team analyst subagent scaffold, prompt guardrails, eval fixtures, and tests.
- Extended Memo block schema with `sat-annex`.
- Added ADRs 0021-0023.

## Still Required

- Firestore persistence for KAC, Red Team, and Premortem reports.
- Firestore security-rules update for direct client-side SAT collections, if PRAXIS later allows direct client reads/writes instead of authenticated server routes.
- Graph evidence pull for ACH candidate evidence.
- DOCX/PDF SAT annex renderers.
- Live Memo Drafter modes for KAC and Premortem.
- Live Vertex Agent Engine deployment for `red_team_analyst`.
- Persona/e2e flows for ACH, Red Team, Premortem, and SAT annex export.
- Cloud Trace/cost telemetry for live subagent calls.

## Verification Targets

- `npm run typecheck`
- `npm run audit:tool-marketplace`
- `npm run audit:tool-contract-v2`
- `npm run audit:tool-skills-present`
- `npm run audit:workbench`
- `npm run test -- tests/unit/lib/sats/ach-ranking.test.ts`
- `npm run test -- tests/unit/lib/sats/ach-store.test.ts`
- `pytest backend/tests/test_sats_parity.py backend/tests/test_red_team_analyst.py -q`
