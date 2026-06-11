# API Route Cleanup Map

Generated: 2026-06-11T09:15:02.621Z
Total routes: 227

| Disposition | Count |
| --- | ---: |
| keep | 74 |
| compatibility | 37 |
| archive candidate | 0 |
| delete candidate | 0 |
| do not touch | 116 |

## Interpretation

- `delete candidate` is intentionally rare. A route only gets that label when static callers and graph references are absent.
- `archive candidate` means hide/archive first; deletion is a later wave after tests and graph references stay clean.
- `do not touch` covers auth, billing, runtime, health, documents, capsules, and agentic execution paths.

| Route | Disposition | Category | Methods | Data stores | Visible callers | Server callers | Tests | Graph refs | Gate |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| `/api/account` | do not touch | admin/internal | GET, PATCH, DELETE | Firestore/Firebase<br>Cloud Storage/documents | 1 | 0 | 1 | 10 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/admin/system-health` | do not touch | admin/internal | GET | none detected | 1 | 1 | 2 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/agents/runs` | do not touch | canonical | GET, POST | Cloud SQL/Postgres | 6 | 2 | 21 | 63 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/agents/runs/[runId]` | do not touch | canonical | GET | Cloud SQL/Postgres | 6 | 2 | 19 | 108 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/agents/runs/[runId]/approvals/[approvalId]` | do not touch | canonical | POST | Cloud SQL/Postgres<br>Cloud Tasks | 0 | 0 | 0 | 7 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/agents/runs/[runId]/cancel` | do not touch | canonical | POST | Cloud SQL/Postgres | 0 | 0 | 1 | 7 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/agents/runs/[runId]/dispatch` | do not touch | canonical | POST | Cloud Tasks | 0 | 0 | 0 | 3 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/agents/runs/[runId]/execute` | do not touch | canonical | none | Cloud Tasks | 0 | 0 | 0 | 8 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/agents/runs/[runId]/retry` | do not touch | canonical | POST | Cloud SQL/Postgres<br>Cloud Tasks | 0 | 0 | 1 | 9 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/agents/runs/[runId]/stream` | do not touch | canonical | GET | Cloud SQL/Postgres | 0 | 1 | 2 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/ai/actor-brief` | do not touch | admin/internal | POST | AI/model route | 0 | 0 | 0 | 7 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/ai/actor-enrichment` | do not touch | admin/internal | POST | AI/model route | 0 | 0 | 0 | 10 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/ai/actor-profiles` | compatibility | compatibility | POST | AI/model route | 0 | 1 | 0 | 10 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/advisory` | compatibility | compatibility | POST | Pub/Sub<br>AI/model route | 0 | 2 | 0 | 12 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/argus` | compatibility | compatibility | POST | Cloud Tasks<br>Pub/Sub<br>AI/model route | 0 | 1 | 0 | 11 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/ask` | keep | canonical | none | AI/model route | 4 | 5 | 2 | 2 | Keep as active or canonical route. |
| `/api/ai/ask-praxis` | keep | canonical | none | AI/model route | 3 | 3 | 2 | 1 | Keep as active or canonical route. |
| `/api/ai/auto-briefing` | compatibility | compatibility | POST | AI/model route | 0 | 2 | 0 | 17 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/auto-structure` | compatibility | compatibility | POST | Firestore/Firebase<br>Cloud Storage/documents<br>AI/model route | 0 | 0 | 0 | 17 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/brainstorming-table` | compatibility | compatibility | POST | Firestore/Firebase<br>Cloud Tasks<br>Cloud Storage/documents<br>AI/model route | 0 | 1 | 1 | 11 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/brief` | keep | canonical | none | AI/model route | 2 | 6 | 1 | 25 | Keep as active or canonical route. |
| `/api/ai/brief-builder` | compatibility | compatibility | POST | AI/model route | 0 | 2 | 1 | 8 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/briefing-generate` | compatibility | compatibility | POST | Cloud Tasks<br>AI/model route | 0 | 2 | 0 | 16 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/chat` | do not touch | admin/internal | GET, POST | Firestore/Firebase<br>Cloud SQL/Postgres<br>Cloud Tasks<br>Cloud Storage/documents<br>Pub/Sub<br>Secrets/Billing<br>AI/model route | 7 | 7 | 7 | 149 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/ai/commitment-scan` | do not touch | admin/internal | POST | AI/model route | 0 | 2 | 0 | 9 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/ai/compare` | do not touch | admin/internal | POST | AI/model route | 0 | 0 | 0 | 11 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/ai/critique` | keep | canonical | none | AI/model route | 0 | 1 | 1 | 1 | Keep as active or canonical route. |
| `/api/ai/dashboard-summary` | keep | canonical | POST | AI/model route | 0 | 2 | 1 | 8 | Keep as active or canonical route. |
| `/api/ai/deep-research` | compatibility | compatibility | POST | AI/model route | 0 | 0 | 0 | 11 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/deep-search-agent` | do not touch | admin/internal | POST | Firestore/Firebase<br>AI/model route | 1 | 2 | 0 | 14 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/ai/discover-sources` | compatibility | compatibility | POST | AI/model route | 0 | 1 | 0 | 8 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/document` | keep | canonical | none | AI/model route | 0 | 1 | 0 | 1 | Keep as active or canonical route. |
| `/api/ai/dossier-generate` | do not touch | admin/internal | POST | Secrets/Billing<br>AI/model route | 0 | 1 | 0 | 12 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/ai/drafting-action` | keep | canonical | POST | AI/model route | 0 | 0 | 1 | 6 | Keep as active or canonical route. |
| `/api/ai/economic-impact` | compatibility | compatibility | POST | AI/model route | 0 | 2 | 0 | 11 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/electoral-risk` | compatibility | compatibility | POST | AI/model route | 0 | 1 | 0 | 11 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/external-actors` | compatibility | compatibility | POST | AI/model route | 0 | 2 | 0 | 11 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/extract` | compatibility | compatibility | POST | Firestore/Firebase<br>AI/model route | 2 | 5 | 0 | 19 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/extract-episodes` | keep | canonical | POST | Firestore/Firebase<br>AI/model route | 1 | 2 | 0 | 7 | Keep as active or canonical route. |
| `/api/ai/forecast` | keep | canonical | POST | AI/model route | 0 | 1 | 1 | 4 | Keep as active or canonical route. |
| `/api/ai/game-theory` | compatibility | compatibility | POST | AI/model route | 0 | 1 | 0 | 11 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/geospatial` | compatibility | compatibility | POST | Pub/Sub<br>AI/model route | 0 | 1 | 0 | 11 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/graph-propose` | keep | canonical | POST | Firestore/Firebase<br>AI/model route | 0 | 1 | 0 | 4 | Keep as active or canonical route. |
| `/api/ai/grounded-search` | compatibility | compatibility | POST | AI/model route | 0 | 0 | 0 | 9 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/human-rights` | compatibility | compatibility | POST | AI/model route | 0 | 2 | 0 | 11 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/humanitarian` | compatibility | compatibility | POST | AI/model route | 0 | 2 | 1 | 10 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/info-environment` | compatibility | compatibility | POST | AI/model route | 0 | 3 | 1 | 11 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/legal-tracker` | compatibility | compatibility | POST | AI/model route | 0 | 1 | 0 | 11 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/media-analyze` | compatibility | compatibility | POST | Pub/Sub<br>AI/model route | 0 | 2 | 0 | 8 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/media-roundup` | compatibility | compatibility | POST | Pub/Sub<br>AI/model route | 0 | 1 | 0 | 13 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/mediation-design` | do not touch | admin/internal | POST | AI/model route | 0 | 1 | 0 | 12 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/ai/negotiation` | do not touch | admin/internal | POST | AI/model route | 0 | 2 | 0 | 11 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/ai/peacebuilding-index` | do not touch | admin/internal | POST | AI/model route | 0 | 1 | 0 | 11 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/ai/policy-memo` | compatibility | compatibility | POST | Pub/Sub<br>AI/model route | 0 | 1 | 0 | 12 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/power-map` | compatibility | compatibility | POST | AI/model route | 0 | 3 | 0 | 11 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/red-team-review` | compatibility | compatibility | POST | AI/model route | 1 | 2 | 2 | 8 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/report` | compatibility | compatibility | POST | AI/model route | 0 | 1 | 0 | 9 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/research-extract` | compatibility | compatibility | POST | Firestore/Firebase<br>AI/model route | 0 | 1 | 0 | 13 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/risk-indicators` | keep | canonical | POST | Cloud Storage/documents<br>AI/model route | 0 | 1 | 0 | 6 | Keep as active or canonical route. |
| `/api/ai/sanctions-check` | keep | canonical | POST | AI/model route | 0 | 1 | 0 | 4 | Keep as active or canonical route. |
| `/api/ai/sanctions-scan` | compatibility | compatibility | POST | AI/model route | 0 | 2 | 0 | 12 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/scenario` | compatibility | compatibility | POST | AI/model route | 0 | 3 | 0 | 12 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/search` | keep | canonical | none | AI/model route | 0 | 1 | 1 | 1 | Keep as active or canonical route. |
| `/api/ai/situation-intelligence` | keep | canonical | POST | Firestore/Firebase<br>AI/model route | 0 | 1 | 2 | 13 | Keep as active or canonical route. |
| `/api/ai/source-scout` | compatibility | compatibility | POST | Firestore/Firebase<br>AI/model route | 0 | 2 | 1 | 13 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/sourceability` | keep | canonical | POST | AI/model route | 1 | 1 | 1 | 2 | Keep as active or canonical route. |
| `/api/ai/talking-points` | compatibility | compatibility | POST | AI/model route | 0 | 1 | 0 | 12 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/timeline-events` | keep | canonical | POST | Cloud Storage/documents<br>AI/model route | 0 | 2 | 0 | 5 | Keep as active or canonical route. |
| `/api/ai/treaty-analyze` | do not touch | admin/internal | POST | AI/model route | 0 | 1 | 0 | 8 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/ai/un-toolkit` | compatibility | compatibility | POST | Pub/Sub<br>Secrets/Billing<br>AI/model route | 0 | 1 | 0 | 13 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/ai/writer/ask` | keep | canonical | POST | Secrets/Billing<br>AI/model route | 2 | 1 | 1 | 12 | Keep as active or canonical route. |
| `/api/annotations` | do not touch | admin/internal | GET, POST | Firestore/Firebase | 0 | 0 | 0 | 4 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/app/search` | keep | canonical | GET | none detected | 0 | 1 | 2 | 4 | Keep as active or canonical route. |
| `/api/artifacts/list` | do not touch | admin/internal | GET | Firestore/Firebase<br>Cloud Storage/documents | 0 | 0 | 0 | 3 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/assistant/intent` | keep | canonical | POST | none detected | 1 | 0 | 1 | 3 | Keep as active or canonical route. |
| `/api/auth/login` | do not touch | canonical | none | Firestore/Firebase | 0 | 0 | 0 | 3 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/auth/logout` | do not touch | canonical | none | none detected | 0 | 0 | 0 | 3 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/auth/session` | do not touch | admin/internal | none | Firestore/Firebase | 3 | 4 | 4 | 30 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/auth/test-firebase` | do not touch | admin/internal | none | Firestore/Firebase | 0 | 0 | 0 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/backend/[...path]` | compatibility | compatibility | GET, POST, PUT, DELETE | Cloud Tasks<br>Secrets/Billing | 1 | 3 | 2 | 34 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/backend/graph/test-connection` | do not touch | admin/internal | POST | none detected | 0 | 0 | 0 | 4 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/billing/checkout` | do not touch | canonical | POST | Secrets/Billing | 2 | 0 | 2 | 6 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/billing/portal` | do not touch | canonical | POST | Secrets/Billing | 1 | 0 | 1 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/billing/webhook` | do not touch | admin/internal | none | Firestore/Firebase<br>Secrets/Billing | 0 | 0 | 0 | 11 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/boardroom/history` | keep | canonical | GET | Cloud SQL/Postgres | 1 | 0 | 3 | 9 | Keep as active or canonical route. |
| `/api/boardroom/runs` | keep | canonical | POST | Cloud SQL/Postgres<br>Cloud Tasks | 1 | 0 | 5 | 16 | Keep as active or canonical route. |
| `/api/capabilities` | keep | canonical | GET | none detected | 0 | 0 | 1 | 3 | Keep as active or canonical route. |
| `/api/capsules` | keep | canonical | GET, POST | Cloud Storage/documents | 2 | 0 | 3 | 45 | Keep as active or canonical route. |
| `/api/capsules/[capsuleId]` | keep | canonical | GET, PATCH | Cloud Storage/documents | 2 | 0 | 3 | 59 | Keep as active or canonical route. |
| `/api/capsules/[capsuleId]/fork` | keep | canonical | POST | Cloud Storage/documents | 0 | 0 | 1 | 4 | Keep as active or canonical route. |
| `/api/capsules/[capsuleId]/publish` | keep | canonical | POST | Cloud Storage/documents | 0 | 0 | 1 | 4 | Keep as active or canonical route. |
| `/api/capsules/assist/[action]` | keep | canonical | POST | Cloud Storage/documents | 1 | 0 | 2 | 40 | Keep as active or canonical route. |
| `/api/capsules/eval/dry-run` | keep | canonical | POST | none detected | 1 | 0 | 1 | 4 | Keep as active or canonical route. |
| `/api/context/capsules` | do not touch | canonical | GET, POST | none detected | 16 | 2 | 14 | 145 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]` | do not touch | admin/internal | GET, POST, PATCH, DELETE | Firestore/Firebase<br>Cloud SQL/Postgres | 12 | 0 | 8 | 248 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]/attach` | do not touch | canonical | POST | none detected | 0 | 0 | 0 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]/capsule-plus` | do not touch | canonical | GET | Cloud SQL/Postgres | 1 | 0 | 0 | 13 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]/diff` | do not touch | admin/internal | GET, POST | Firestore/Firebase | 0 | 0 | 1 | 21 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]/evaluations` | do not touch | canonical | GET, POST | none detected | 0 | 0 | 0 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]/graph/edges` | do not touch | canonical | POST | none detected | 0 | 0 | 1 | 8 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]/graph/nodes` | do not touch | canonical | POST | none detected | 0 | 0 | 1 | 8 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]/history` | do not touch | admin/internal | GET | Firestore/Firebase | 0 | 0 | 1 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]/memories` | do not touch | canonical | GET, POST | none detected | 0 | 0 | 0 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]/notes` | do not touch | canonical | GET, POST | none detected | 0 | 0 | 0 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]/spans` | do not touch | admin/internal | GET, POST | Firestore/Firebase | 0 | 0 | 1 | 6 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]/swap` | do not touch | canonical | POST | none detected | 0 | 0 | 0 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/[capsuleId]/usage` | do not touch | canonical | GET | none detected | 0 | 0 | 0 | 4 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/capsule-plus/import` | do not touch | canonical | POST | Cloud SQL/Postgres | 1 | 0 | 0 | 8 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/import/dialectica` | do not touch | canonical | POST | none detected | 1 | 0 | 1 | 11 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/capsules/shared/[token]` | do not touch | admin/internal | GET, POST | Firestore/Firebase | 0 | 0 | 0 | 22 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/check-claim` | do not touch | canonical | POST | none detected | 0 | 1 | 0 | 3 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/packages` | do not touch | canonical | GET, POST | none detected | 0 | 1 | 2 | 6 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/prompt-health` | do not touch | canonical | none | none detected | 0 | 0 | 0 | 13 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/readiness` | do not touch | admin/internal | none | Firestore/Firebase | 2 | 0 | 1 | 25 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/resolve` | do not touch | canonical | POST | none detected | 0 | 2 | 2 | 8 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/context/trust-posture` | do not touch | canonical | none | Firestore/Firebase | 2 | 0 | 0 | 18 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/conversations` | do not touch | admin/internal | GET, POST | Firestore/Firebase | 3 | 1 | 12 | 25 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/conversations/[conversationId]` | do not touch | admin/internal | GET | Firestore/Firebase | 2 | 0 | 10 | 45 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/conversations/[conversationId]/turns` | do not touch | admin/internal | POST | Firestore/Firebase<br>Secrets/Billing | 0 | 0 | 2 | 18 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/cores/library` | keep | canonical | GET | none detected | 1 | 1 | 0 | 4 | Keep as active or canonical route. |
| `/api/created-work` | keep | canonical | GET | none detected | 2 | 0 | 1 | 4 | Keep as active or canonical route. |
| `/api/credits/burn-rate` | do not touch | admin/internal | GET | Firestore/Firebase | 0 | 0 | 0 | 4 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/cron/check-alerts` | do not touch | admin/internal | none | Firestore/Firebase<br>Secrets/Billing | 0 | 1 | 0 | 8 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/cron/daily-brief` | do not touch | admin/internal | none | Firestore/Firebase<br>Cloud SQL/Postgres<br>Cloud Tasks<br>Secrets/Billing | 0 | 0 | 1 | 14 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/cron/early-warning-refresh` | do not touch | admin/internal | none | Firestore/Firebase<br>Secrets/Billing | 0 | 0 | 1 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/cron/generate-briefing` | do not touch | admin/internal | none | Firestore/Firebase<br>Secrets/Billing | 0 | 0 | 0 | 8 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/cron/verify-neo4j-sync` | keep | canonical | none | Secrets/Billing | 0 | 0 | 0 | 7 | Keep as active or canonical route. |
| `/api/data/intelligence` | keep | canonical | POST | none detected | 0 | 1 | 0 | 6 | Keep as active or canonical route. |
| `/api/documents` | do not touch | canonical | GET | Firestore/Firebase<br>Cloud Storage/documents | 3 | 3 | 2 | 44 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/documents/[id]` | do not touch | canonical | GET | Firestore/Firebase<br>Cloud Storage/documents | 3 | 2 | 2 | 53 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/documents/[id]/extract-stored` | do not touch | admin/internal | POST | Firestore/Firebase<br>Cloud Storage/documents | 0 | 0 | 0 | 6 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/documents/retrieve` | do not touch | canonical | POST | Firestore/Firebase<br>Cloud Storage/documents | 0 | 0 | 0 | 3 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/documents/upload` | do not touch | admin/internal | POST | Firestore/Firebase<br>Cloud SQL/Postgres<br>Cloud Storage/documents | 1 | 0 | 2 | 29 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/entities/enrich` | keep | canonical | POST | none detected | 0 | 0 | 0 | 3 | Keep as active or canonical route. |
| `/api/events/pubsub/profile` | keep | canonical | none | Firestore/Firebase<br>Pub/Sub<br>Secrets/Billing | 0 | 0 | 1 | 12 | Keep as active or canonical route. |
| `/api/export` | keep | canonical | POST | none detected | 0 | 0 | 0 | 17 | Keep as active or canonical route. |
| `/api/export/work-product` | keep | canonical | POST | none detected | 0 | 0 | 0 | 7 | Keep as active or canonical route. |
| `/api/graph/approve-staged` | keep | canonical | GET, POST | none detected | 0 | 0 | 1 | 2 | Keep as active or canonical route. |
| `/api/graph/changes` | keep | canonical | GET | none detected | 0 | 0 | 0 | 3 | Keep as active or canonical route. |
| `/api/graph/context` | keep | canonical | GET | none detected | 0 | 0 | 0 | 4 | Keep as active or canonical route. |
| `/api/graph/cypher` | keep | canonical | POST | none detected | 0 | 0 | 0 | 4 | Keep as active or canonical route. |
| `/api/graph/evolution` | keep | canonical | GET, POST | Firestore/Firebase | 0 | 0 | 0 | 8 | Keep as active or canonical route. |
| `/api/graph/ops` | keep | canonical | GET | none detected | 0 | 1 | 1 | 4 | Keep as active or canonical route. |
| `/api/graph/populate` | do not touch | admin/internal | POST | Cloud Storage/documents | 0 | 0 | 0 | 6 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/graph/proposals` | keep | canonical | GET | Firestore/Firebase | 2 | 2 | 1 | 13 | Keep as active or canonical route. |
| `/api/graph/proposals/[id]/approve` | keep | canonical | POST | Firestore/Firebase | 0 | 0 | 1 | 5 | Keep as active or canonical route. |
| `/api/graph/proposals/[id]/reject` | keep | canonical | POST | Firestore/Firebase | 0 | 0 | 1 | 4 | Keep as active or canonical route. |
| `/api/graph/staging-stream` | keep | canonical | GET | none detected | 0 | 0 | 1 | 2 | Keep as active or canonical route. |
| `/api/health` | do not touch | admin/internal | none | Firestore/Firebase<br>Secrets/Billing | 7 | 11 | 5 | 40 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/health/agentic-search` | do not touch | canonical | none | none detected | 1 | 3 | 0 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/health/breakers` | do not touch | canonical | GET | none detected | 0 | 0 | 0 | 3 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/health/diagnostics` | do not touch | admin/internal | none | Firestore/Firebase<br>Secrets/Billing | 0 | 0 | 0 | 4 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/health/features` | do not touch | compatibility | none | Firestore/Firebase<br>Cloud SQL/Postgres<br>Secrets/Billing | 0 | 1 | 0 | 3 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/health/feeds` | do not touch | canonical | none | none detected | 0 | 0 | 0 | 3 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/health/provider` | do not touch | canonical | GET | Secrets/Billing | 0 | 0 | 1 | 7 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/health/runtime` | do not touch | canonical | none | none detected | 3 | 4 | 3 | 7 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/health/skc` | do not touch | canonical | GET | none detected | 0 | 0 | 0 | 2 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/knowledge/documents/[documentId]/capsules` | do not touch | canonical | POST | Cloud Storage/documents | 0 | 0 | 0 | 4 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/knowledge/documents/[documentId]/summarize` | do not touch | canonical | POST | Firestore/Firebase<br>Cloud Storage/documents | 0 | 0 | 0 | 12 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/knowledge/ingest-runs/[id]` | do not touch | canonical | GET, POST | none detected | 0 | 0 | 0 | 10 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/knowledge/repositories` | do not touch | canonical | GET, POST | none detected | 0 | 1 | 1 | 20 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/knowledge/repositories/[repositoryId]` | do not touch | canonical | GET, PATCH, DELETE | none detected | 0 | 0 | 0 | 35 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/knowledge/repositories/[repositoryId]/attach` | do not touch | canonical | POST | none detected | 0 | 0 | 0 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/knowledge/repositories/[repositoryId]/documents` | do not touch | canonical | GET | Cloud Storage/documents | 0 | 0 | 0 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/memory/[...slug]` | compatibility | compatibility | GET, POST, DELETE | none detected | 1 | 1 | 5 | 88 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/memory/working` | do not touch | admin/internal | GET, POST | Firestore/Firebase | 0 | 0 | 2 | 20 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/memory/working/[factId]` | do not touch | admin/internal | PATCH, DELETE | Firestore/Firebase | 0 | 0 | 2 | 29 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/memos` | keep | canonical | GET, POST | Firestore/Firebase | 7 | 1 | 4 | 134 | Keep as active or canonical route. |
| `/api/memos/[id]` | keep | canonical | GET | Firestore/Firebase | 6 | 0 | 4 | 183 | Keep as active or canonical route. |
| `/api/memos/[id]/handover-package` | do not touch | admin/internal | POST | Firestore/Firebase<br>Cloud Storage/documents | 0 | 0 | 0 | 48 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/memos/from-ask` | keep | canonical | POST | none detected | 5 | 0 | 3 | 48 | Keep as active or canonical route. |
| `/api/memos/from-ask-pack` | keep | canonical | POST | Firestore/Firebase<br>Cloud Storage/documents | 4 | 0 | 3 | 44 | Keep as active or canonical route. |
| `/api/memos/search` | do not touch | admin/internal | GET | Firestore/Firebase | 0 | 0 | 0 | 22 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/methods/[methodId]/run` | keep | canonical | POST | none detected | 0 | 0 | 0 | 9 | Keep as active or canonical route. |
| `/api/notifications/[id]` | do not touch | admin/internal | none | Firestore/Firebase | 1 | 1 | 0 | 10 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/onboarding/chips` | do not touch | admin/internal | GET | Firestore/Firebase | 3 | 3 | 0 | 9 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/onboarding/chips/suggest` | keep | canonical | POST | none detected | 2 | 2 | 0 | 4 | Keep as active or canonical route. |
| `/api/onboarding/complete` | do not touch | admin/internal | POST | Firestore/Firebase<br>Pub/Sub | 1 | 1 | 2 | 9 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/onboarding/draft` | do not touch | admin/internal | GET, PATCH, DELETE | Firestore/Firebase | 1 | 1 | 0 | 4 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/onboarding/profile` | do not touch | admin/internal | GET, PATCH | Firestore/Firebase | 3 | 1 | 0 | 7 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/onboarding/skip` | do not touch | admin/internal | POST | Firestore/Firebase | 1 | 1 | 1 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/output-capsules` | do not touch | canonical | GET, POST | Cloud Storage/documents | 1 | 0 | 1 | 9 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/output-capsules/[outputCapsuleId]` | do not touch | canonical | GET | Cloud Storage/documents | 0 | 0 | 0 | 13 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/paths` | keep | canonical | none | Firestore/Firebase | 1 | 0 | 1 | 8 | Keep as active or canonical route. |
| `/api/paths/classify` | keep | canonical | POST | none detected | 0 | 0 | 1 | 2 | Keep as active or canonical route. |
| `/api/preferences` | keep | canonical | GET, PATCH | Firestore/Firebase | 1 | 1 | 2 | 5 | Keep as active or canonical route. |
| `/api/profile` | do not touch | admin/internal | DELETE | Firestore/Firebase | 4 | 2 | 3 | 11 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/profile/export` | do not touch | admin/internal | GET | Firestore/Firebase | 1 | 0 | 1 | 3 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/profile/resolved` | do not touch | admin/internal | GET | Firestore/Firebase | 1 | 0 | 1 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/promo/redeem` | do not touch | admin/internal | POST | Firestore/Firebase | 0 | 0 | 0 | 5 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/reports` | keep | canonical | none | none detected | 1 | 1 | 0 | 27 | Keep as active or canonical route. |
| `/api/reports/[id]` | keep | canonical | none | none detected | 1 | 1 | 0 | 49 | Keep as active or canonical route. |
| `/api/reports/[id]/export` | keep | canonical | none | none detected | 0 | 0 | 0 | 18 | Keep as active or canonical route. |
| `/api/research` | do not touch | admin/internal | GET, POST | Firestore/Firebase | 0 | 1 | 0 | 15 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/research/run` | keep | canonical | POST | none detected | 0 | 1 | 0 | 4 | Keep as active or canonical route. |
| `/api/settings/ai` | do not touch | admin/internal | none | Firestore/Firebase | 1 | 1 | 2 | 20 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/settings/api-keys` | keep | canonical | GET | Secrets/Billing | 3 | 3 | 3 | 15 | Keep as active or canonical route. |
| `/api/settings/api-keys/[provider]` | keep | canonical | PUT, DELETE | Secrets/Billing | 2 | 1 | 1 | 27 | Keep as active or canonical route. |
| `/api/settings/api-keys/[provider]/validate` | keep | canonical | POST | Secrets/Billing | 0 | 0 | 0 | 7 | Keep as active or canonical route. |
| `/api/settings/validate-key` | keep | canonical | POST | none detected | 0 | 0 | 0 | 2 | Keep as active or canonical route. |
| `/api/situations` | do not touch | admin/internal | GET, POST | Firestore/Firebase<br>Cloud Tasks | 7 | 11 | 3 | 112 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/situations/[id]` | keep | canonical | none | Firestore/Firebase | 5 | 7 | 0 | 187 | Keep as active or canonical route. |
| `/api/situations/[id]/context-health` | do not touch | admin/internal | none | Firestore/Firebase | 0 | 0 | 0 | 11 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/situations/[id]/cores/[kind]` | keep | canonical | none | Firestore/Firebase | 0 | 0 | 0 | 7 | Keep as active or canonical route. |
| `/api/situations/[id]/cost-cap` | do not touch | admin/internal | GET, PATCH | Firestore/Firebase | 0 | 0 | 0 | 3 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/situations/[id]/feed-alerts` | keep | canonical | GET | Firestore/Firebase | 0 | 0 | 0 | 9 | Keep as active or canonical route. |
| `/api/situations/[id]/graph-updates` | keep | canonical | GET, POST | Firestore/Firebase | 0 | 1 | 0 | 7 | Keep as active or canonical route. |
| `/api/situations/[id]/inspect` | do not touch | admin/internal | none | Firestore/Firebase<br>Cloud Storage/documents | 0 | 0 | 0 | 8 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/situations/[id]/open-questions` | keep | canonical | none | none detected | 0 | 0 | 0 | 6 | Keep as active or canonical route. |
| `/api/situations/[id]/recent-tools` | do not touch | admin/internal | GET | Firestore/Firebase | 0 | 0 | 0 | 4 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/situations/classify` | do not touch | admin/internal | POST | Firestore/Firebase | 1 | 3 | 0 | 12 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/situations/classify-domain` | do not touch | admin/internal | POST | Firestore/Firebase | 0 | 2 | 0 | 6 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/sources` | keep | canonical | GET, POST | Firestore/Firebase | 1 | 0 | 0 | 4 | Keep as active or canonical route. |
| `/api/telemetry/log` | keep | canonical | POST | Cloud Storage/documents | 0 | 1 | 0 | 9 | Keep as active or canonical route. |
| `/api/tool-data` | compatibility | compatibility | GET, POST, DELETE | Firestore/Firebase | 0 | 0 | 0 | 7 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/tool-feedback` | keep | canonical | GET, POST | none detected | 0 | 0 | 1 | 6 | Keep as active or canonical route. |
| `/api/tool-status` | do not touch | admin/internal | GET | Firestore/Firebase | 0 | 0 | 0 | 9 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/tools/contracts` | keep | canonical | none | none detected | 0 | 0 | 0 | 13 | Keep as active or canonical route. |
| `/api/tools/marketplace/run` | do not touch | admin/internal | GET, POST | Firestore/Firebase | 0 | 1 | 0 | 12 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/tools/recommend` | keep | canonical | POST | none detected | 0 | 0 | 0 | 3 | Keep as active or canonical route. |
| `/api/usage/monthly-free` | do not touch | admin/internal | GET | Firestore/Firebase<br>Secrets/Billing | 1 | 0 | 2 | 8 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/usage/weekly-free` | do not touch | admin/internal | GET | Firestore/Firebase<br>Secrets/Billing | 0 | 0 | 0 | 8 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/waitlist` | do not touch | admin/internal | none | Firestore/Firebase<br>Cloud Storage/documents | 0 | 0 | 0 | 10 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/work-products/export-docx` | compatibility | compatibility | POST | none detected | 0 | 0 | 3 | 20 | Keep until replacement callers are proven and docs/tests stop referencing this route. |
| `/api/work-products/import-docx` | keep | canonical | POST | none detected | 0 | 0 | 0 | 6 | Keep as active or canonical route. |
| `/api/workspace/context-stack` | do not touch | admin/internal | GET, PUT | Firestore/Firebase | 1 | 0 | 0 | 28 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
| `/api/workspace/next-moves` | do not touch | admin/internal | GET, POST, PATCH | Firestore/Firebase | 1 | 0 | 0 | 9 | Preserve because this route supports auth, billing, runtime, health, documents, capsules, or agentic execution. |
