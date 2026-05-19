# API Route Inventory

Generated: 2026-05-19T05:19:20.489Z
Total routes: 207

| Category | Count |
| --- | ---: |
| canonical | 100 |
| compatibility | 37 |
| admin/internal | 68 |
| staged | 2 |
| deletion-candidate | 0 |

| Route | Category | Auth posture | Calibration | Caller evidence | Recommended action |
| --- | --- | --- | --- | --- | --- |
| `/api/account` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>PATCH handler<br>DELETE handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/admin/system-health` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/agents/runs` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep canonical. |
| `/api/agents/runs/[runId]` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>/agents/[runId] workspace/API family | Keep canonical. |
| `/api/agents/runs/[runId]/approvals/[approvalId]` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler<br>/agents/[runId] workspace/API family | Keep canonical. |
| `/api/agents/runs/[runId]/cancel` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler<br>/agents/[runId] workspace/API family | Keep canonical. |
| `/api/agents/runs/[runId]/dispatch` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler<br>/agents/[runId] workspace/API family | Keep canonical. |
| `/api/agents/runs/[runId]/execute` | canonical | user authenticated | not AI route | server auth boundary<br>/agents/[runId] workspace/API family | Keep canonical. |
| `/api/agents/runs/[runId]/retry` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler<br>/agents/[runId] workspace/API family | Keep canonical. |
| `/api/agents/runs/[runId]/stream` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>/agents/[runId] workspace/API family | Keep canonical. |
| `/api/ai/actor-brief` | admin/internal | public or route-local | withCalibration | POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/ai/actor-enrichment` | admin/internal | public/sanitized | withCalibration | POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/ai/actor-profiles` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/advisory` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/argus` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/ask` | canonical | public or route-local | review required | static route export | Keep calibrated or document exemption. |
| `/api/ai/ask-praxis` | canonical | public or route-local | review required | static route export | Keep calibrated or document exemption. |
| `/api/ai/auto-briefing` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/auto-structure` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/brainstorming-table` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/brief` | canonical | public or route-local | review required | static route export | Keep calibrated or document exemption. |
| `/api/ai/brief-builder` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/briefing-generate` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/chat` | admin/internal | user authenticated | withCalibration | server auth boundary<br>GET handler<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/ai/commitment-scan` | admin/internal | public or route-local | withCalibration | POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/ai/compare` | admin/internal | public/sanitized | withCalibration | POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/ai/critique` | canonical | public or route-local | review required | static route export | Keep calibrated or document exemption. |
| `/api/ai/dashboard-summary` | canonical | public or route-local | withCalibration | POST handler | Keep calibrated or document exemption. |
| `/api/ai/deep-research` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/deep-search-agent` | admin/internal | public or route-local | withCalibration | POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/ai/discover-sources` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/document` | canonical | public or route-local | review required | static route export | Keep calibrated or document exemption. |
| `/api/ai/dossier-generate` | admin/internal | public/sanitized | withCalibration | POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/ai/economic-impact` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/electoral-risk` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/external-actors` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/extract` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/extract-episodes` | canonical | public or route-local | withCalibration | POST handler | Keep calibrated or document exemption. |
| `/api/ai/forecast` | canonical | public or route-local | withCalibration | POST handler | Keep calibrated or document exemption. |
| `/api/ai/game-theory` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/geospatial` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/graph-propose` | canonical | public or route-local | withCalibration | POST handler | Keep calibrated or document exemption. |
| `/api/ai/grounded-search` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/human-rights` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/humanitarian` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/info-environment` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/legal-tracker` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/media-analyze` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/media-roundup` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/mediation-design` | admin/internal | public/sanitized | withCalibration | POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/ai/negotiation` | admin/internal | public/sanitized | withCalibration | POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/ai/peacebuilding-index` | admin/internal | public or route-local | withCalibration | POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/ai/policy-memo` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/power-map` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/red-team-review` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/report` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/research-extract` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/risk-indicators` | canonical | public or route-local | withCalibration | POST handler | Keep calibrated or document exemption. |
| `/api/ai/sanctions-check` | canonical | public or route-local | withCalibration | POST handler | Keep calibrated or document exemption. |
| `/api/ai/sanctions-scan` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/scenario` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/search` | canonical | public or route-local | review required | static route export | Keep calibrated or document exemption. |
| `/api/ai/situation-intelligence` | canonical | public or route-local | withCalibration | POST handler | Keep calibrated or document exemption. |
| `/api/ai/source-scout` | compatibility | public or route-local | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/sourceability` | canonical | public or route-local | withCalibration | POST handler | Keep calibrated or document exemption. |
| `/api/ai/talking-points` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/timeline-events` | canonical | public or route-local | withCalibration | POST handler | Keep calibrated or document exemption. |
| `/api/ai/treaty-analyze` | admin/internal | public/sanitized | withCalibration | POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/ai/un-toolkit` | compatibility | public/sanitized | withCalibration | POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/ai/writer/ask` | canonical | public or route-local | withCalibration | POST handler | Keep calibrated or document exemption. |
| `/api/annotations` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/artifacts/list` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/assistant/intent` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/auth/login` | canonical | public or route-local | not AI route | static route export | Keep canonical. |
| `/api/auth/logout` | canonical | public or route-local | not AI route | static route export | Keep canonical. |
| `/api/auth/session` | admin/internal | public or route-local | not AI route | static route export | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/auth/test-firebase` | admin/internal | public or route-local | not AI route | static route export | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/backend/[...path]` | compatibility | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>DELETE handler | Keep as compatibility boundary; document caller before removal. |
| `/api/backend/graph/test-connection` | admin/internal | user authenticated | not AI route | server auth boundary<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/billing/checkout` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/billing/portal` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/billing/webhook` | admin/internal | public or route-local | not AI route | static route export | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/capabilities` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler | Keep canonical. |
| `/api/context/capsules` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>ContextCapsule cockpit/repository family | Keep canonical. |
| `/api/context/capsules/[capsuleId]` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>PATCH handler<br>DELETE handler<br>ContextCapsule cockpit/repository family | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/context/capsules/[capsuleId]/attach` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler<br>ContextCapsule cockpit/repository family | Keep canonical. |
| `/api/context/capsules/[capsuleId]/diff` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>ContextCapsule cockpit/repository family | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/context/capsules/[capsuleId]/evaluations` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>ContextCapsule cockpit/repository family | Keep canonical. |
| `/api/context/capsules/[capsuleId]/history` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>ContextCapsule cockpit/repository family | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/context/capsules/[capsuleId]/memories` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>ContextCapsule cockpit/repository family | Keep canonical. |
| `/api/context/capsules/[capsuleId]/notes` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>ContextCapsule cockpit/repository family | Keep canonical. |
| `/api/context/capsules/[capsuleId]/spans` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>ContextCapsule cockpit/repository family | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/context/capsules/[capsuleId]/swap` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler<br>ContextCapsule cockpit/repository family | Keep canonical. |
| `/api/context/capsules/shared/[token]` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>ContextCapsule cockpit/repository family | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/context/check-claim` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/context/packages` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep canonical. |
| `/api/context/prompt-health` | canonical | user authenticated | not AI route | server auth boundary | Keep canonical. |
| `/api/context/readiness` | admin/internal | user authenticated | not AI route | server auth boundary | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/context/resolve` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/context/trust-posture` | canonical | user authenticated | not AI route | server auth boundary | Keep canonical. |
| `/api/conversations` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>Ask PRAXIS conversation flow | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/conversations/[conversationId]` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>Ask PRAXIS conversation flow | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/conversations/[conversationId]/turns` | admin/internal | user authenticated | not AI route | server auth boundary<br>POST handler<br>Ask PRAXIS conversation flow | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/cores/library` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler | Keep canonical. |
| `/api/credits/burn-rate` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/cron/check-alerts` | admin/internal | public or route-local | not AI route | static route export | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/cron/daily-brief` | admin/internal | public or route-local | not AI route | static route export | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/cron/early-warning-refresh` | admin/internal | public/sanitized | not AI route | static route export | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/cron/generate-briefing` | admin/internal | public or route-local | not AI route | static route export | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/cron/verify-neo4j-sync` | canonical | public or route-local | not AI route | static route export | Keep canonical. |
| `/api/data/intelligence` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/documents` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler | Keep canonical. |
| `/api/documents/[id]` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler | Keep canonical. |
| `/api/documents/[id]/extract-stored` | admin/internal | user authenticated | not AI route | server auth boundary<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/documents/retrieve` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/documents/upload` | admin/internal | user authenticated | not AI route | server auth boundary<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/entities/enrich` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/events/pubsub/profile` | canonical | public or route-local | not AI route | static route export | Keep canonical. |
| `/api/export` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/graph/approve-staged` | staged | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Block launch claims until implemented or hidden. |
| `/api/graph/changes` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler | Keep canonical. |
| `/api/graph/context` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler | Keep canonical. |
| `/api/graph/cypher` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/graph/evolution` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep canonical. |
| `/api/graph/ops` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler | Keep canonical. |
| `/api/graph/populate` | admin/internal | user authenticated | not AI route | server auth boundary<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/graph/proposals` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler | Keep canonical. |
| `/api/graph/proposals/[id]/approve` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/graph/proposals/[id]/reject` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/graph/staging-stream` | staged | user authenticated | not AI route | server auth boundary<br>GET handler | Block launch claims until implemented or hidden. |
| `/api/health` | admin/internal | public/sanitized | not AI route | runtime health diagnostics | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/health/breakers` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>runtime health diagnostics | Keep canonical. |
| `/api/health/diagnostics` | admin/internal | public/sanitized | not AI route | runtime health diagnostics | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/health/features` | canonical | public/sanitized | not AI route | runtime health diagnostics | Keep canonical. |
| `/api/health/feeds` | canonical | public/sanitized | not AI route | runtime health diagnostics | Keep canonical. |
| `/api/health/provider` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>runtime health diagnostics | Keep canonical. |
| `/api/health/runtime` | canonical | public/sanitized | not AI route | runtime health diagnostics | Keep canonical. |
| `/api/health/skc` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>runtime health diagnostics | Keep canonical. |
| `/api/knowledge/documents/[documentId]/capsules` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/knowledge/documents/[documentId]/summarize` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/knowledge/ingest-runs/[id]` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep canonical. |
| `/api/knowledge/repositories` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep canonical. |
| `/api/knowledge/repositories/[repositoryId]` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>PATCH handler<br>DELETE handler | Keep canonical. |
| `/api/knowledge/repositories/[repositoryId]/attach` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/knowledge/repositories/[repositoryId]/documents` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler | Keep canonical. |
| `/api/memory/[...slug]` | compatibility | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>DELETE handler | Keep as compatibility boundary; document caller before removal. |
| `/api/memory/working` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/memory/working/[factId]` | admin/internal | user authenticated | not AI route | server auth boundary<br>PATCH handler<br>DELETE handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/memos` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep canonical. |
| `/api/memos/[id]/handover-package` | admin/internal | user authenticated | not AI route | server auth boundary<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/memos/from-ask` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/memos/from-ask-pack` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/memos/search` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/methods/[methodId]/run` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/notifications/[id]` | admin/internal | user authenticated | not AI route | server auth boundary | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/onboarding/chips` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/onboarding/chips/suggest` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/onboarding/complete` | admin/internal | user authenticated | not AI route | server auth boundary<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/onboarding/draft` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>PATCH handler<br>DELETE handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/onboarding/profile` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>PATCH handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/onboarding/skip` | admin/internal | user authenticated | not AI route | server auth boundary<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/output-capsules` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep canonical. |
| `/api/output-capsules/[outputCapsuleId]` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler | Keep canonical. |
| `/api/paths` | canonical | public/sanitized | not AI route | static route export | Keep canonical. |
| `/api/paths/classify` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/preferences` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>PATCH handler | Keep canonical. |
| `/api/profile` | admin/internal | user authenticated | not AI route | server auth boundary<br>DELETE handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/profile/export` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/profile/resolved` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/promo/redeem` | admin/internal | user authenticated | not AI route | server auth boundary<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/reports` | canonical | public or route-local | not AI route | static route export | Keep canonical. |
| `/api/reports/[id]` | canonical | public or route-local | not AI route | static route export | Keep canonical. |
| `/api/reports/[id]/export` | canonical | public or route-local | not AI route | static route export | Keep canonical. |
| `/api/research` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/research/run` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/settings/ai` | admin/internal | public or route-local | not AI route | static route export | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/settings/api-keys` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler | Keep canonical. |
| `/api/settings/api-keys/[provider]` | canonical | user authenticated | not AI route | server auth boundary<br>DELETE handler | Keep canonical. |
| `/api/settings/api-keys/[provider]/validate` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/settings/validate-key` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/situations` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/situations/[id]` | canonical | user authenticated | not AI route | server auth boundary | Keep canonical. |
| `/api/situations/[id]/context-health` | admin/internal | user authenticated | not AI route | server auth boundary | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/situations/[id]/cores/[kind]` | canonical | user authenticated | not AI route | server auth boundary | Keep canonical. |
| `/api/situations/[id]/cost-cap` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>PATCH handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/situations/[id]/feed-alerts` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler | Keep canonical. |
| `/api/situations/[id]/graph-updates` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep canonical. |
| `/api/situations/[id]/inspect` | admin/internal | user authenticated | not AI route | server auth boundary | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/situations/[id]/open-questions` | canonical | user authenticated | not AI route | server auth boundary | Keep canonical. |
| `/api/situations/[id]/recent-tools` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/situations/classify` | admin/internal | user authenticated | not AI route | server auth boundary<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/situations/classify-domain` | admin/internal | user authenticated | not AI route | server auth boundary<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/sources` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep canonical. |
| `/api/telemetry/log` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/tool-data` | compatibility | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>DELETE handler | Keep as compatibility boundary; document caller before removal. |
| `/api/tool-feedback` | canonical | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep canonical. |
| `/api/tool-status` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/tools/contracts` | canonical | public or route-local | not AI route | static route export | Keep canonical. |
| `/api/tools/marketplace/run` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/tools/recommend` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/usage/monthly-free` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/usage/weekly-free` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/waitlist` | admin/internal | public or route-local | not AI route | static route export | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/work-products/export-docx` | compatibility | user authenticated | not AI route | server auth boundary<br>POST handler | Keep as compatibility boundary; document caller before removal. |
| `/api/work-products/import-docx` | canonical | user authenticated | not AI route | server auth boundary<br>POST handler | Keep canonical. |
| `/api/workspace/context-stack` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
| `/api/workspace/next-moves` | admin/internal | user authenticated | not AI route | server auth boundary<br>GET handler<br>POST handler<br>PATCH handler | Keep sanitized/admin-gated and exclude from normal-user UI. |
