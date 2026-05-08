# Public API surface

Static classification from route files. Public here means callable route exists; auth posture is inferred from wrappers and may need runtime verification.

| route | method | kind | auth | calibration | file |
|---|---|---|---|---|---|
| /api/account | UNKNOWN | next | withAuth |  | src/app/api/account/route.ts |
| /api/admin/add-credits | UNKNOWN | next | withAuth |  | src/app/api/admin/add-credits/route.ts |
| /api/admin/advisor-feed | UNKNOWN | next | withAuth |  | src/app/api/admin/advisor-feed/route.ts |
| /api/admin/diagnostics | UNKNOWN | next | withAuth |  | src/app/api/admin/diagnostics/route.ts |
| /api/admin/domains/:id | UNKNOWN | next | withAuth |  | src/app/api/admin/domains/[id]/route.ts |
| /api/admin/domains | UNKNOWN | next | withAuth |  | src/app/api/admin/domains/route.ts |
| /api/admin/me | UNKNOWN | next | withAuth |  | src/app/api/admin/me/route.ts |
| /api/admin/operator-console | UNKNOWN | next | withAuth |  | src/app/api/admin/operator-console/route.ts |
| /api/admin/set-all-credits | UNKNOWN | next | withAuth |  | src/app/api/admin/set-all-credits/route.ts |
| /api/admin/users | UNKNOWN | next | withAuth |  | src/app/api/admin/users/route.ts |
| /api/advisors/:id | UNKNOWN | next | withAuth |  | src/app/api/advisors/[id]/route.ts |
| /api/advisors/recent-by-situation | UNKNOWN | next | withAuth |  | src/app/api/advisors/recent-by-situation/route.ts |
| /api/advisors | UNKNOWN | next | none/manual/unknown |  | src/app/api/advisors/route.ts |
| /api/ai/actor-brief | UNKNOWN | next | admin/manual | withCalibration | src/app/api/ai/actor-brief/route.ts |
| /api/ai/actor-enrichment | UNKNOWN | next | admin/manual | withCalibration | src/app/api/ai/actor-enrichment/route.ts |
| /api/ai/actor-profiles | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/actor-profiles/route.ts |
| /api/ai/advisor-chat | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/advisor-chat/route.ts |
| /api/ai/advisory | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/advisory/route.ts |
| /api/ai/argus | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/argus/route.ts |
| /api/ai/ask-praxis | UNKNOWN | next | none/manual/unknown |  | src/app/api/ai/ask-praxis/route.ts |
| /api/ai/auto-briefing | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/auto-briefing/route.ts |
| /api/ai/auto-structure | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/auto-structure/route.ts |
| /api/ai/boardroom/:sessionId/replay | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/boardroom/[sessionId]/replay/route.ts |
| /api/ai/brainstorming-table | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/brainstorming-table/route.ts |
| /api/ai/brief-builder | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/brief-builder/route.ts |
| /api/ai/briefing-generate | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/briefing-generate/route.ts |
| /api/ai/chat | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/chat/route.ts |
| /api/ai/commitment-scan | UNKNOWN | next | admin/manual | withCalibration | src/app/api/ai/commitment-scan/route.ts |
| /api/ai/compare | UNKNOWN | next | admin/manual | withCalibration | src/app/api/ai/compare/route.ts |
| /api/ai/concordia | UNKNOWN | next | admin/manual | withCalibration | src/app/api/ai/concordia/route.ts |
| /api/ai/dashboard-summary | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/dashboard-summary/route.ts |
| /api/ai/deep-research | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/deep-research/route.ts |
| /api/ai/deep-search-agent | UNKNOWN | next | admin/manual | withCalibration | src/app/api/ai/deep-search-agent/route.ts |
| /api/ai/dialectica | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/dialectica/route.ts |
| /api/ai/discover-sources | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/discover-sources/route.ts |
| /api/ai/dossier-generate | UNKNOWN | next | admin/manual | withCalibration | src/app/api/ai/dossier-generate/route.ts |
| /api/ai/economic-impact | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/economic-impact/route.ts |
| /api/ai/electoral-risk | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/electoral-risk/route.ts |
| /api/ai/escalation-scan | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/escalation-scan/route.ts |
| /api/ai/external-actors | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/external-actors/route.ts |
| /api/ai/extract-episodes | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/extract-episodes/route.ts |
| /api/ai/extract | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/extract/route.ts |
| /api/ai/forecast | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/forecast/route.ts |
| /api/ai/game-theory | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/game-theory/route.ts |
| /api/ai/geospatial | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/geospatial/route.ts |
| /api/ai/grounded-search | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/grounded-search/route.ts |
| /api/ai/human-rights | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/human-rights/route.ts |
| /api/ai/humanitarian | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/humanitarian/route.ts |
| /api/ai/info-environment | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/info-environment/route.ts |
| /api/ai/legal-check | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/legal-check/route.ts |
| /api/ai/legal-tracker | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/legal-tracker/route.ts |
| /api/ai/media-analyze | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/media-analyze/route.ts |
| /api/ai/media-compass | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/media-compass/route.ts |
| /api/ai/media-roundup | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/media-roundup/route.ts |
| /api/ai/media-scan | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/media-scan/route.ts |
| /api/ai/mediation-design | UNKNOWN | next | admin/manual | withCalibration | src/app/api/ai/mediation-design/route.ts |
| /api/ai/negotiation | UNKNOWN | next | admin/manual | withCalibration | src/app/api/ai/negotiation/route.ts |
| /api/ai/peacebuilding-index | UNKNOWN | next | admin/manual | withCalibration | src/app/api/ai/peacebuilding-index/route.ts |
| /api/ai/pir | UNKNOWN | next | withAuth | withCalibration | src/app/api/ai/pir/route.ts |
| /api/ai/policy-memo | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/policy-memo/route.ts |
| /api/ai/power-map | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/power-map/route.ts |
| /api/ai/red-team-review | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/red-team-review/route.ts |
| /api/ai/report | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/report/route.ts |
| /api/ai/research-extract | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/research-extract/route.ts |
| /api/ai/resolution | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/resolution/route.ts |
| /api/ai/risk-assessment | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/risk-assessment/route.ts |
| /api/ai/risk-indicators | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/risk-indicators/route.ts |
| /api/ai/sanctions-check | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/sanctions-check/route.ts |
| /api/ai/sanctions-scan | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/sanctions-scan/route.ts |
| /api/ai/sat | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/sat/route.ts |
| /api/ai/scenario | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/scenario/route.ts |
| /api/ai/situation-intelligence | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/situation-intelligence/route.ts |
| /api/ai/source-scout | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/source-scout/route.ts |
| /api/ai/stakeholder-map | UNKNOWN | next | admin/manual | withCalibration | src/app/api/ai/stakeholder-map/route.ts |
| /api/ai/talking-points | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/talking-points/route.ts |
| /api/ai/terminology | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/terminology/route.ts |
| /api/ai/timeline-events | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/timeline-events/route.ts |
| /api/ai/treaty-analyze | UNKNOWN | next | admin/manual | withCalibration | src/app/api/ai/treaty-analyze/route.ts |
| /api/ai/un-toolkit | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/ai/un-toolkit/route.ts |
| /api/annotations | UNKNOWN | next | withAuth |  | src/app/api/annotations/route.ts |
| /api/artifacts/list | UNKNOWN | next | withAuth |  | src/app/api/artifacts/list/route.ts |
| /api/assistant/intent | UNKNOWN | next | withAuth |  | src/app/api/assistant/intent/route.ts |
| /api/auth/login | POST | next | none/manual/unknown |  | src/app/api/auth/login/route.ts |
| /api/auth/logout | POST | next | none/manual/unknown |  | src/app/api/auth/logout/route.ts |
| /api/auth/session | POST | next | admin/manual |  | src/app/api/auth/session/route.ts |
| /api/auth/session | GET | next | admin/manual |  | src/app/api/auth/session/route.ts |
| /api/auth/session | DELETE | next | admin/manual |  | src/app/api/auth/session/route.ts |
| /api/auth/test-firebase | GET | next | admin/manual |  | src/app/api/auth/test-firebase/route.ts |
| /api/backend/:path* | UNKNOWN | next | withAuth |  | src/app/api/backend/[...path]/route.ts |
| /api/backend/graph/test-connection | UNKNOWN | next | withAuth |  | src/app/api/backend/graph/test-connection/route.ts |
| /api/boardroom/deliberations/:deliberationId/abort | UNKNOWN | next | withAuth |  | src/app/api/boardroom/deliberations/[deliberationId]/abort/route.ts |
| /api/boardroom/deliberations/:deliberationId/export | UNKNOWN | next | withAuth |  | src/app/api/boardroom/deliberations/[deliberationId]/export/route.ts |
| /api/boardroom/deliberations/:deliberationId | UNKNOWN | next | withAuth |  | src/app/api/boardroom/deliberations/[deliberationId]/route.ts |
| /api/boardroom/deliberations/:deliberationId/start | UNKNOWN | next | withAuth |  | src/app/api/boardroom/deliberations/[deliberationId]/start/route.ts |
| /api/boardroom/deliberations/:deliberationId/stream | UNKNOWN | next | withAuth |  | src/app/api/boardroom/deliberations/[deliberationId]/stream/route.ts |
| /api/boardroom/deliberations/:deliberationId/synthesis/promote | UNKNOWN | next | withAuth |  | src/app/api/boardroom/deliberations/[deliberationId]/synthesis/promote/route.ts |
| /api/boardroom/deliberations | UNKNOWN | next | withAuth |  | src/app/api/boardroom/deliberations/route.ts |
| /api/boardroom/personas/:personaId | UNKNOWN | next | withAuth |  | src/app/api/boardroom/personas/[personaId]/route.ts |
| /api/boardroom/personas | UNKNOWN | next | withAuth |  | src/app/api/boardroom/personas/route.ts |
| /api/calendar/import | UNKNOWN | next | withAuth |  | src/app/api/calendar/import/route.ts |
| /api/capabilities | UNKNOWN | next | withAuth |  | src/app/api/capabilities/route.ts |
| /api/cases/:caseId/context-scope | UNKNOWN | next | withAuth |  | src/app/api/cases/[caseId]/context-scope/route.ts |
| /api/cases/:caseId/draft/export | UNKNOWN | next | withAuth |  | src/app/api/cases/[caseId]/draft/export/route.ts |
| /api/cases/:caseId/ontologies | UNKNOWN | next | withAuth |  | src/app/api/cases/[caseId]/ontologies/route.ts |
| /api/cases/:caseId/open-questions/:questionId | UNKNOWN | next | withAuth |  | src/app/api/cases/[caseId]/open-questions/[questionId]/route.ts |
| /api/cases/:caseId/open-questions | UNKNOWN | next | withAuth |  | src/app/api/cases/[caseId]/open-questions/route.ts |
| /api/cases/:caseId/research/ingest | UNKNOWN | next | withAuth |  | src/app/api/cases/[caseId]/research/ingest/route.ts |
| /api/cases/:caseId/research/plan | UNKNOWN | next | withAuth |  | src/app/api/cases/[caseId]/research/plan/route.ts |
| /api/cases/:caseId/research | UNKNOWN | next | withAuth |  | src/app/api/cases/[caseId]/research/route.ts |
| /api/cases/:caseId/saved-claims | UNKNOWN | next | withAuth |  | src/app/api/cases/[caseId]/saved-claims/route.ts |
| /api/cases/scaffold/audit | UNKNOWN | next | withAuth |  | src/app/api/cases/scaffold/audit/route.ts |
| /api/cases/scaffold | UNKNOWN | next | withAuth |  | src/app/api/cases/scaffold/route.ts |
| /api/context/prompt-health | GET | next | withAuth |  | src/app/api/context/prompt-health/route.ts |
| /api/context/prompt-health | POST | next | withAuth |  | src/app/api/context/prompt-health/route.ts |
| /api/credits/burn-rate | UNKNOWN | next | withAuth |  | src/app/api/credits/burn-rate/route.ts |
| /api/cron/check-alerts | GET | next | admin/manual |  | src/app/api/cron/check-alerts/route.ts |
| /api/cron/daily-brief | GET | next | admin/manual |  | src/app/api/cron/daily-brief/route.ts |
| /api/cron/early-warning-refresh | GET | next | admin/manual |  | src/app/api/cron/early-warning-refresh/route.ts |
| /api/cron/generate-briefing | GET | next | admin/manual |  | src/app/api/cron/generate-briefing/route.ts |
| /api/cron/operational-metrics | GET | next | admin/manual |  | src/app/api/cron/operational-metrics/route.ts |
| /api/cron/verify-neo4j-sync | GET | next | none/manual/unknown |  | src/app/api/cron/verify-neo4j-sync/route.ts |
| /api/data/conflicts | GET | next | none/manual/unknown |  | src/app/api/data/conflicts/route.ts |
| /api/data/geospatial | UNKNOWN | next | withAuth |  | src/app/api/data/geospatial/route.ts |
| /api/data/intelligence | UNKNOWN | next | withAuth |  | src/app/api/data/intelligence/route.ts |
| /api/dialectica/reason/:recipe | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/dialectica/reason/[recipe]/route.ts |
| /api/documents/:id/extract-stored | UNKNOWN | next | withAuth |  | src/app/api/documents/[id]/extract-stored/route.ts |
| /api/documents/retrieve | UNKNOWN | next | withAuth |  | src/app/api/documents/retrieve/route.ts |
| /api/documents | UNKNOWN | next | withAuth |  | src/app/api/documents/route.ts |
| /api/documents/upload | UNKNOWN | next | withAuth |  | src/app/api/documents/upload/route.ts |
| /api/email/welcome | UNKNOWN | next | withAuth |  | src/app/api/email/welcome/route.ts |
| /api/entities/enrich | UNKNOWN | next | withAuth |  | src/app/api/entities/enrich/route.ts |
| /api/export | UNKNOWN | next | withAuth |  | src/app/api/export/route.ts |
| /api/graph/approve-staged | UNKNOWN | next | withAuth |  | src/app/api/graph/approve-staged/route.ts |
| /api/graph/changes | UNKNOWN | next | withAuth |  | src/app/api/graph/changes/route.ts |
| /api/graph/context | UNKNOWN | next | withAuth |  | src/app/api/graph/context/route.ts |
| /api/graph/cypher | UNKNOWN | next | withAuth |  | src/app/api/graph/cypher/route.ts |
| /api/graph/evolution | UNKNOWN | next | withAuth |  | src/app/api/graph/evolution/route.ts |
| /api/graph/ingest | POST | next | none/manual/unknown |  | src/app/api/graph/ingest/route.ts |
| /api/graph/ops | UNKNOWN | next | withAuth |  | src/app/api/graph/ops/route.ts |
| /api/graph/populate | UNKNOWN | next | withAuth |  | src/app/api/graph/populate/route.ts |
| /api/graph/query | POST | next | admin/manual |  | src/app/api/graph/query/route.ts |
| /api/graph/staging-stream | UNKNOWN | next | withAuth |  | src/app/api/graph/staging-stream/route.ts |
| /api/health/breakers | UNKNOWN | next | withAuth |  | src/app/api/health/breakers/route.ts |
| /api/health/diagnostics | GET | next | admin/manual |  | src/app/api/health/diagnostics/route.ts |
| /api/health/features | GET | next | none/manual/unknown |  | src/app/api/health/features/route.ts |
| /api/health/feeds | GET | next | none/manual/unknown |  | src/app/api/health/feeds/route.ts |
| /api/health/provider | UNKNOWN | next | withAuth |  | src/app/api/health/provider/route.ts |
| /api/health | GET | next | admin/manual |  | src/app/api/health/route.ts |
| /api/health/skc | UNKNOWN | next | withAuth |  | src/app/api/health/skc/route.ts |
| /api/intelligence/corpus-search | UNKNOWN | next | withAuth | withCalibration | src/app/api/intelligence/corpus-search/route.ts |
| /api/intelligence/dev-backlog | UNKNOWN | next | withAuth |  | src/app/api/intelligence/dev-backlog/route.ts |
| /api/intelligence/disseminate | UNKNOWN | next | withAuth |  | src/app/api/intelligence/disseminate/route.ts |
| /api/intelligence/global-search | UNKNOWN | next | withAuth |  | src/app/api/intelligence/global-search/route.ts |
| /api/memory/:slug* | UNKNOWN | next | withAuth |  | src/app/api/memory/[...slug]/route.ts |
| /api/memos | UNKNOWN | next | withAuth |  | src/app/api/memos/route.ts |
| /api/notifications/:id | PATCH | next | withAuth |  | src/app/api/notifications/[id]/route.ts |
| /api/onboarding/chips | UNKNOWN | next | withAuth |  | src/app/api/onboarding/chips/route.ts |
| /api/onboarding/chips/suggest | UNKNOWN | next | withAuth |  | src/app/api/onboarding/chips/suggest/route.ts |
| /api/onboarding/complete | UNKNOWN | next | withAuth |  | src/app/api/onboarding/complete/route.ts |
| /api/onboarding/draft | UNKNOWN | next | withAuth |  | src/app/api/onboarding/draft/route.ts |
| /api/onboarding/profile | UNKNOWN | next | withAuth |  | src/app/api/onboarding/profile/route.ts |
| /api/onboarding/skip | UNKNOWN | next | withAuth |  | src/app/api/onboarding/skip/route.ts |
| /api/polar/checkout | UNKNOWN | next | withAuth |  | src/app/api/polar/checkout/route.ts |
| /api/polar/portal | UNKNOWN | next | withAuth |  | src/app/api/polar/portal/route.ts |
| /api/polar/webhook | UNKNOWN | next | admin/manual |  | src/app/api/polar/webhook/route.ts |
| /api/preferences | UNKNOWN | next | withAuth |  | src/app/api/preferences/route.ts |
| /api/profile/export | UNKNOWN | next | withAuth |  | src/app/api/profile/export/route.ts |
| /api/profile/resolved | UNKNOWN | next | withAuth |  | src/app/api/profile/resolved/route.ts |
| /api/profile | UNKNOWN | next | withAuth |  | src/app/api/profile/route.ts |
| /api/promo/redeem | UNKNOWN | next | withAuth |  | src/app/api/promo/redeem/route.ts |
| /api/reports/:id/export | POST | next | none/manual/unknown |  | src/app/api/reports/[id]/export/route.ts |
| /api/reports/:id | GET | next | none/manual/unknown |  | src/app/api/reports/[id]/route.ts |
| /api/reports/:id | PUT | next | none/manual/unknown |  | src/app/api/reports/[id]/route.ts |
| /api/reports | GET | next | none/manual/unknown |  | src/app/api/reports/route.ts |
| /api/reports | POST | next | none/manual/unknown |  | src/app/api/reports/route.ts |
| /api/research | UNKNOWN | next | withAuth |  | src/app/api/research/route.ts |
| /api/sats/ach/:achId | UNKNOWN | next | withAuth |  | src/app/api/sats/ach/[achId]/route.ts |
| /api/sats/ach | UNKNOWN | next | withAuth |  | src/app/api/sats/ach/route.ts |
| /api/settings/ai | GET | next | admin/manual |  | src/app/api/settings/ai/route.ts |
| /api/settings/ai | PUT | next | admin/manual |  | src/app/api/settings/ai/route.ts |
| /api/settings/api-keys/:provider | UNKNOWN | next | withAuth |  | src/app/api/settings/api-keys/[provider]/route.ts |
| /api/settings/api-keys/:provider/validate | UNKNOWN | next | withAuth |  | src/app/api/settings/api-keys/[provider]/validate/route.ts |
| /api/settings/api-keys | UNKNOWN | next | withAuth |  | src/app/api/settings/api-keys/route.ts |
| /api/settings/validate-key | UNKNOWN | next | withAuth |  | src/app/api/settings/validate-key/route.ts |
| /api/situations/:id/context-health | GET | next | withAuth |  | src/app/api/situations/[id]/context-health/route.ts |
| /api/situations/:id/context-health | POST | next | withAuth |  | src/app/api/situations/[id]/context-health/route.ts |
| /api/situations/:id/cost-cap | UNKNOWN | next | withAuth |  | src/app/api/situations/[id]/cost-cap/route.ts |
| /api/situations/:id/feed-alerts | UNKNOWN | next | withAuth |  | src/app/api/situations/[id]/feed-alerts/route.ts |
| /api/situations/:id/graph-updates | UNKNOWN | next | withAuth |  | src/app/api/situations/[id]/graph-updates/route.ts |
| /api/situations/:id/inspect | GET | next | withAuth |  | src/app/api/situations/[id]/inspect/route.ts |
| /api/situations/:id/recent-tools | UNKNOWN | next | withAuth |  | src/app/api/situations/[id]/recent-tools/route.ts |
| /api/situations/:id | GET | next | withAuth |  | src/app/api/situations/[id]/route.ts |
| /api/situations/:id | PATCH | next | withAuth |  | src/app/api/situations/[id]/route.ts |
| /api/situations/:id | DELETE | next | withAuth |  | src/app/api/situations/[id]/route.ts |
| /api/situations/:id/syria-extract | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/situations/[id]/syria-extract/route.ts |
| /api/situations/:id/syria-ingest | UNKNOWN | next | withAuth |  | src/app/api/situations/[id]/syria-ingest/route.ts |
| /api/situations/:id/syria-promote | UNKNOWN | next | none/manual/unknown | withCalibration | src/app/api/situations/[id]/syria-promote/route.ts |
| /api/situations/classify-domain | UNKNOWN | next | withAuth |  | src/app/api/situations/classify-domain/route.ts |
| /api/situations/copy-from-demo | UNKNOWN | next | withAuth |  | src/app/api/situations/copy-from-demo/route.ts |
| /api/situations | UNKNOWN | next | withAuth |  | src/app/api/situations/route.ts |
| /api/sources | UNKNOWN | next | withAuth |  | src/app/api/sources/route.ts |
| /api/telemetry/log | UNKNOWN | next | withAuth |  | src/app/api/telemetry/log/route.ts |
| /api/tool-data | UNKNOWN | next | withAuth |  | src/app/api/tool-data/route.ts |
| /api/tool-feedback | UNKNOWN | next | withAuth |  | src/app/api/tool-feedback/route.ts |
| /api/tool-status | UNKNOWN | next | withAuth |  | src/app/api/tool-status/route.ts |
| /api/tools/contracts | GET | next | none/manual/unknown |  | src/app/api/tools/contracts/route.ts |
| /api/tools/marketplace/run | UNKNOWN | next | withAuth |  | src/app/api/tools/marketplace/run/route.ts |
| /api/waitlist | POST | next | admin/manual |  | src/app/api/waitlist/route.ts |
| /api/work-products/export-docx | UNKNOWN | next | withAuth |  | src/app/api/work-products/export-docx/route.ts |
| /api/work-products/import-docx | UNKNOWN | next | withAuth |  | src/app/api/work-products/import-docx/route.ts |
| /{situation_id}/pivot-actors | GET | fastapi | Depends auth/manual |  | backend/routers/analyze.py |
| /{situation_id}/hidden-linkages | GET | fastapi | Depends auth/manual |  | backend/routers/analyze.py |
| /{situation_id}/intelligence-gaps | GET | fastapi | Depends auth/manual |  | backend/routers/analyze.py |
| /{situation_id}/escalation | GET | fastapi | Depends auth/manual |  | backend/routers/analyze.py |
| /{situation_id}/factions | GET | fastapi | Depends auth/manual |  | backend/routers/analyze.py |
| /{situation_id}/negotiation-space | GET | fastapi | Depends auth/manual |  | backend/routers/analyze.py |
| /{situation_id}/brief | GET | fastapi | Depends auth/manual |  | backend/routers/analyze.py |
| /{situation_id}/brief.json | GET | fastapi | Depends auth/manual |  | backend/routers/analyze.py |
| /{situation_id}/diff | POST | fastapi | Depends auth/manual |  | backend/routers/analyze.py |
| /desk/summary | GET | fastapi | Depends auth/manual |  | backend/routers/chapters.py |
