# Deletion candidates ranked

No deletion was executed in this pass. The audit prompt requires review before source cleanup.

## Tier 1 - likely safe after focused verification

| item | kind | lines | action | evidence |
|---|---|---|---|---|
| src/components/landing/_archive/* | archived components | 1243 | move to docs/archive or delete after visual regression | 02-graphs/orphan-modules.md |
| scripts/audit-phase3-product-surface.ts | old audit script | 31 | delete if superseded by current gate audits | 03-dead-code/unused-files.md |
| scripts/audit-routes.ts | old audit script | 61 | delete if superseded by audit-ai-routes.mjs | 03-dead-code/unused-files.md |
| scripts/audit-spine.ts | old audit script | 60 | delete if no package script/history needs it | 03-dead-code/unused-files.md |
| scripts/audit-verb-hookup.ts | old audit script | 45 | delete or archive after current route audit covers it | 03-dead-code/unused-files.md |
| dep @types/leaflet | dependency | n/a | remove if map components no longer type-import Leaflet | 03-dead-code/unused-deps-frontend.md |
| dep rehype-highlight | dependency | n/a | remove if markdown highlighter not runtime used | 03-dead-code/unused-deps-frontend.md |
| dep @google-cloud/tasks | dependency | n/a | remove or wire actual Cloud Tasks producer | 03-dead-code/unused-deps-frontend.md |
| dep @radix-ui/react-popover | dependency | n/a | remove if no popover component uses it | 03-dead-code/unused-deps-frontend.md |
| legacy docs in docs/_archive | documentation | 26502 | keep archived but exclude from active product docs search/navigation | 03-dead-code/unused-files.md |

## Tier 2 - investigate before removal

| item | kind | lines | action | evidence |
|---|---|---|---|---|
| src/lib/constants/frameworks.ts | orphan module | 672 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| backend/routers/chapters.py | orphan module | 588 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| src/lib/constants/media-sources.ts | orphan module | 568 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| backend/routers/tabs.py | orphan module | 523 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| src/lib/constants/concordia-demo.ts | orphan module | 498 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| src/lib/constants/scenario-configs.ts | orphan module | 478 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| src/lib/constants/un-terminology.ts | orphan module | 474 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| backend/services/cognee_memory.py | orphan module | 428 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| backend/graphify_tacitus/analyze.py | orphan module | 408 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| backend/routers/graph.py | orphan module | 368 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| backend/services/situation_health.py | orphan module | 363 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| backend/services/notifications/__init__.py | orphan module | 340 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| backend/services/notifications/registry.py | orphan module | 329 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| src/lib/ai/prompts/report.ts | orphan module | 328 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| src/lib/constants/risk-monitor-data.ts | orphan module | 321 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| backend/routers/pipeline.py | orphan module | 312 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| src/lib/constants/actor-profiles.ts | orphan module | 311 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| backend/main.py | orphan module | 300 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| src/proxy.ts | orphan module | 284 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
| backend/routers/notifications.py | orphan module | 282 | verify dynamic import/string refs, then delete/archive | 02-graphs/orphan-modules.md |
