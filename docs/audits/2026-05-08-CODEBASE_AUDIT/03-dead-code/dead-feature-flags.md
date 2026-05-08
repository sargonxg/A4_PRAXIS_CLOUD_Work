# Dead feature flags

Flags and runtime switches discovered. Always-on/off status needs production env confirmation.

| flag | default | read_sites | status | recommendation |
|---|---|---|---|---|
| COGNEE_ENABLED | false unless true + backend URL | docs/codex-prompts/PRAXIS_V2_C0_COGNEE_LIVE.md, scripts/audit-cognee-isolation.ts, scripts/audit-cognee-operations.ts, scripts/audit-cognee-runtime.ts | read-only/defaulted | Confirm production value before inlining or deleting. |
| DIALECTICA_ENABLED | see read site | src/lib/dialectica/http-adapter.ts, src/lib/dialectica/index.ts | read-only/defaulted | Confirm production value before inlining or deleting. |
| KG_BACKEND | see read site | src/app/api/health/features/route.ts | read-only/defaulted | Confirm production value before inlining or deleting. |
| NEXT_PUBLIC_DEBUG_PANEL | see read site | src/components/app/debug-panel.tsx | read-only/defaulted | Confirm production value before inlining or deleting. |
| NEXT_PUBLIC_FIREBASE_APPCHECK_ENABLED | see read site | src/lib/firebase/config.ts | configured somewhere | Confirm production value before inlining or deleting. |
| SYRIA_LIVE_INGEST_ENABLED | see read site | src/app/api/situations/[id]/syria-ingest/route.ts | read-only/defaulted | Confirm production value before inlining or deleting. |
| VERTEX_AGENT_ENGINE_ID | see read site | scripts/audit-cognee-ui-honesty.ts, src/app/api/health/diagnostics/route.ts, src/app/api/health/features/route.ts, src/app/api/health/route.ts | configured somewhere | Confirm production value before inlining or deleting. |
