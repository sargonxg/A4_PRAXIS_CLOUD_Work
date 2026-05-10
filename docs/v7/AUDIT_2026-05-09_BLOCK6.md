# Block 6 Audit - Vertex / AI Isolation

Date: 2026-05-09
Branch: `inspect/v7-block6-provider-isolation`

## Scope

Block 6 focused on the provider/model isolation failure that was blocking the stacked v7 work after Block 5. No model provider behavior was changed; this pass only removed duplicated v7 model literals from UI/proxy files and kept them behind the audited AI boundary.

## Findings

- `audit:ai-provider-isolation` failed because `src/app/api/backend/[...path]/route.ts`, `src/components/v7/v7-core-drawer.tsx`, and `src/components/v7/v7-user-core-editor.tsx` carried raw Gemini model literals.
- `audit:v7-inline-cores` also required those raw literals in the User Core editor, which conflicted with provider isolation.

## Fix

- Added `V7_USER_CORE_MODEL_DEFAULTS` and `V7_USER_CORE_MODEL_OPTIONS` in `src/lib/ai/model-matrix.ts`.
- Updated the local backend fallback, Core drawer, and User Core editor to consume the central constants.
- Updated `audit:v7-inline-cores` to verify the UI imports the central model defaults and that the AI model boundary carries the locked v7 defaults.

## Verification

- `npm run audit:ai-provider-isolation`: pass.
- `npm run audit:ai-provider-vertex-default`: pass.
- `npm run audit:model-matrix-coverage`: pass.
- `npm run audit:hero-tool-calibration-coverage`: pass.
- `npm run audit:v7-inline-cores`: pass.
- `npm run audit:cores-picker-coverage`: pass.
- `npm run audit:experience-map-coherence`: pass.
- `npm run audit:v7-shell-skeleton`: pass.
- `npm run audit:v7-cores-surface`: pass.
- `npm run audit:v7-cores-api`: pass.
- `npm run audit:v7-ask-routing-layer`: pass.
- `npm run audit:workbench`: pass.
- `npm run audit:master-charter`: pass after `graphify update .`.
- `npx tsc --noEmit`: pass.
- `npm run build`: pass.
- `npm run audit:gate`: pass.

## Remaining

- Block 4 Ask routing should remain gated on trusted Cores read/write path plus a green provider-isolation posture.
- Runtime production SQL inspection still needs Cloud SQL Proxy/psql or an approved production-safe SQL path.
