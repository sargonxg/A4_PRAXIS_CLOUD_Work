# Audit Pack: Substrate, AI Orchestration, UX

Date: 2026-05-07

Inputs:

- `C:\Users\giuli\Downloads\SUBSTRATE_AUDIT_PROMPT.md`
- `C:\Users\giuli\Downloads\AI_ORCHESTRATION_AUDIT_PROMPT.md`
- `C:\Users\giuli\Downloads\USER_EXPERIENCE_AUDIT_PROMPT.md`

## Executive Summary

This pass found a product that is structurally coherent but still uneven in live execution. The substrate is disciplined and disabled-safe, the workbench UX has real surfaces, and static audits now match the current four-tab/seven-chapter model. The major remaining gap is the live execution substrate: Cognee and the workspace orchestrator need real staging-proven ingestion/search/event/model runs before PRAXIS can claim full production automation.

## Severity Counts

| Severity | Count | Notes |
| --- | ---: | --- |
| P0 | 2 | Live Cognee service calls and live AI orchestration are not yet proven. |
| P1 | 10 | Event streaming, cost ledger, staging smoke tests, browser proof, and stale audit assumptions. |
| P2 | 5 | Parity audits, chapter personalization proof, export fidelity, Gemini 3 readiness gating. |

## Completed In This Pass

- Added the missing ACO OWL artifact at `backend/data/ontologies/praxis_aco.owl`.
- Added regression coverage for the ACO OWL artifact in `scripts/audit-cognee-operations.ts`.
- Fixed stale Cognee operations audit expectations so Cognee stays behind Library/Ontology/Graph rather than adding a fifth Memory tab.
- Fixed stale Memo Studio audit expectations so memos remain a work chapter rather than a top-level tab.
- Centralized settings model preferences in `src/lib/ai/model-preferences.ts`.
- Updated model preference UI, API validation, and Firestore defaults to use the shared model preference contract.
- Added local backend-unconfigured fallbacks for Library and Draft `/api/backend/*` routes so demo UX no longer emits 500s when the Python backend URL is absent.
- Updated Playwright smoke coverage for the current workbench modal tab model and custom Syria chapter visuals.
- Saved detailed substrate, AI orchestration, and UX reports under `docs/audits/`.

## Verification Snapshot

```text
npm run audit:cognee
npm run audit:cognee-operations
npm run audit:orchestrator-writes
npm run audit:memo-studio
npm run typecheck
npm run test
npm run build
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'; npx playwright test tests/e2e/app-usability-smoke.spec.ts
```

All listed checks passed on 2026-05-07 after the fixes above.

## Priority Queue

1. Build and test live isolated Cognee add/cognify/search/memify/forget.
2. Build a real durable workspace orchestrator runner and event stream.
3. Add model token/cost ledger writes at every live orchestration step.
4. Run browser smoke across the main signed-in user surfaces.
5. Add export fidelity tests for Memo Studio and draft assembly.
6. Add ACO OWL/Pydantic/ontology registry parity checks.
7. Keep Gemini 3 migration readiness-gated until production availability is verified.
