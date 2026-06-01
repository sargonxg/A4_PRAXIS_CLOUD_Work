# LATEST Baseline Audit

- Date: 2026-06-01
- Scope: P3 hardening, full regression, route calibration, model-string grep, docs hygiene
- Repo: `C:\Users\giuli\A4_PRAXIS_CLOUD_Work`
- Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

## Summary

- TypeScript: PASS
- Vitest: PASS
- Lint: PASS
- Build: PASS
- Landing bundle: PASS
- Mobile landing E2E: PASS
- Audit gate: PASS
- AI route calibration audit: PASS
- Forbidden Gemini grep: PASS (0 matches; rg exit 1 treated as success)

## Raw Gate Output

### TypeScript

- Command: `npx tsc --noEmit`
- Result: PASS

```text
(no output)
```

### Vitest

- Command: `npx vitest run`
- Result: PASS

```text

[1m[46m RUN [49m[22m [36mv4.1.1 [39m[90mC:/Users/giuli/A4_PRAXIS_CLOUD_Work[39m


[2m Test Files [22m [1m[32m293 passed[39m[22m[90m (293)[39m
[2m      Tests [22m [1m[32m1249 passed[39m[22m[90m (1249)[39m
[2m   Start at [22m 14:44:52
[2m   Duration [22m 46.03s[2m (transform 7.63s, setup 2.19s, import 79.22s, tests 25.37s, environment 49ms)[22m
```

### Lint

- Command: `npm run lint`
- Result: PASS

```text

> tacitus-app@6.4.1 lint
> eslint

[BABEL] Note: The code generator has deoptimised the styling of C:\Users\giuli\A4_PRAXIS_CLOUD_Work\src\components\praxis\tasklet-praxis-workbench.tsx as it exceeds the max of 500KB.
[BABEL] Note: The code generator has deoptimised the styling of C:\Users\giuli\A4_PRAXIS_CLOUD_Work\src\lib\product\context-capsules.ts as it exceeds the max of 500KB.
```

### Build

- Command: `npm run build`
- Result: PASS

```text

> tacitus-app@6.4.1 build
> next build

▲ Next.js 16.2.6 (Turbopack)
- Experiments (use with caution):
  · serverActions

  Creating an optimized production build ...
✓ Compiled successfully in 26.4s
  Running TypeScript ...
  Finished TypeScript in 26.9s ...
  Collecting page data using 7 workers ...
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
  Generating static pages using 7 workers (0/167) ...
  Generating static pages using 7 workers (41/167) 
  Generating static pages using 7 workers (83/167) 
  Generating static pages using 7 workers (125/167) 
✓ Generating static pages using 7 workers (167/167) in 2.1s
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /agents/[runId]
├ ƒ /api/account
├ ƒ /api/admin/system-health
├ ƒ /api/agents/runs
├ ƒ /api/agents/runs/[runId]
├ ƒ /api/agents/runs/[runId]/approvals/[approvalId]
├ ƒ /api/agents/runs/[runId]/cancel
├ ƒ /api/agents/runs/[runId]/dispatch
├ ƒ /api/agents/runs/[runId]/execute
├ ƒ /api/agents/runs/[runId]/retry
├ ƒ /api/agents/runs/[runId]/stream
├ ƒ /api/ai/actor-brief
├ ƒ /api/ai/actor-enrichment
├ ƒ /api/ai/actor-profiles
├ ƒ /api/ai/advisory
├ ƒ /api/ai/argus
├ ƒ /api/ai/ask
├ ƒ /api/ai/ask-praxis
├ ƒ /api/ai/auto-briefing
├ ƒ /api/ai/auto-structure
├ ƒ /api/ai/brainstorming-table
├ ƒ /api/ai/brief
├ ƒ /api/ai/brief-builder
├ ƒ /api/ai/briefing-generate
├ ƒ /api/ai/chat
├ ƒ /api/ai/commitment-scan
├ ƒ /api/ai/compare
├ ƒ /api/ai/critique
├ ƒ /api/ai/dashboard-summary
├ ƒ /api/ai/deep-research
├ ƒ /api/ai/deep-search-agent
├ ƒ /api/ai/discover-sources
├ ƒ /api/ai/document
├ ƒ /api/ai/dossier-generate
├ ƒ /api/ai/drafting-action
├ ƒ /api/ai/economic-impact
├ ƒ /api/ai/electoral-risk
├ ƒ /api/ai/external-actors
├ ƒ /api/ai/extract
├ ƒ /api/ai/extract-episodes
├ ƒ /api/ai/forecast
├ ƒ /api/ai/game-theory
├ ƒ /api/ai/geospatial
├ ƒ /api/ai/graph-propose
├ ƒ /api/ai/grounded-search
├ ƒ /api/ai/human-rights
├ ƒ /api/ai/humanitarian
├ ƒ /api/ai/info-environment
├ ƒ /api/ai/legal-tracker
├ ƒ /api/ai/media-analyze
├ ƒ /api/ai/media-roundup
├ ƒ /api/ai/mediation-design
├ ƒ /api/ai/negotiation
├ ƒ /api/ai/peacebuilding-index
├ ƒ /api/ai/policy-memo
├ ƒ /api/ai/power-map
├ ƒ /api/ai/red-team-review
├ ƒ /api/ai/report
├ ƒ /api/ai/research-extract
├ ƒ /api/ai/risk-indicators
├ ƒ /api/ai/sanctions-check
├ ƒ /api/ai/sanctions-scan
├ ƒ /api/ai/scenario
├ ƒ /api/ai/search
├ ƒ /api/ai/situation-intelligence
├ ƒ /api/ai/source-scout
├ ƒ /api/ai/sourceability
├ ƒ /api/ai/talking-points
├ ƒ /api/ai/timeline-events
├ ƒ /api/ai/treaty-analyze
├ ƒ /api/ai/un-toolkit
├ ƒ /api/ai/writer/ask
├ ƒ /api/annotations
├ ƒ /api/app/search
├ ƒ /api/artifacts/list
├ ƒ /api/assistant/intent
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/session
├ ƒ /api/auth/test-firebase
├ ƒ /api/backend/[...path]
├ ƒ /api/backend/graph/test-connection
├ ƒ /api/billing/checkout
├ ƒ /api/billing/portal
├ ƒ /api/billing/webhook
├ ƒ /api/boardroom/history
├ ƒ /api/boardroom/runs
├ ƒ /api/capabilities
├ ƒ /api/capsules
├ ƒ /api/capsules/[capsuleId]
├ ƒ /api/capsules/[capsuleId]/fork
├ ƒ /api/capsules/[capsuleId]/publish
├ ƒ /api/capsules/assist/[action]
├ ƒ /api/capsules/eval/dry-run
├ ƒ /api/context/capsules
├ ƒ /api/context/capsules/[capsuleId]
├ ƒ /api/context/capsules/[capsuleId]/attach
├ ƒ /api/context/capsules/[capsuleId]/capsule-plus
├ ƒ /api/context/capsules/[capsuleId]/diff
├ ƒ /api/context/capsules/[capsuleId]/evaluations
├ ƒ /api/context/capsules/[capsuleId]/graph/edges
├ ƒ /api/context/capsules/[capsuleId]/graph/nodes
├ ƒ /api/context/capsules/[capsuleId]/history
├ ƒ /api/context/capsules/[capsuleId]/memories
├ ƒ /api/context/capsules/[capsuleId]/notes
├ ƒ /api/context/capsules/[capsuleId]/spans
├ ƒ /api/context/capsules/[capsuleId]/swap
├ ƒ /api/context/capsules/[capsuleId]/usage
├ ƒ /api/context/capsules/capsule-plus/import
├ ƒ /api/context/capsules/shared/[token]
├ ƒ /api/context/check-claim
├ ƒ /api/context/packages
├ ƒ /api/context/prompt-health
├ ƒ /api/context/readiness
├ ƒ /api/context/resolve
├ ƒ /api/context/trust-posture
├ ƒ /api/conversations
├ ƒ /api/conversations/[conversationId]
├ ƒ /api/conversations/[conversationId]/turns
├ ƒ /api/cores/library
├ ƒ /api/created-work
├ ƒ /api/credits/burn-rate
├ ƒ /api/cron/check-alerts
├ ƒ /api/cron/daily-brief
├ ƒ /api/cron/early-warning-refresh
├ ƒ /api/cron/generate-briefing
├ ƒ /api/cron/verify-neo4j-sync
├ ƒ /api/data/intelligence
├ ƒ /api/documents
├ ƒ /api/documents/[id]
├ ƒ /api/documents/[id]/extract-stored
├ ƒ /api/documents/retrieve
├ ƒ /api/documents/upload
├ ƒ /api/entities/enrich
├ ƒ /api/events/pubsub/profile
├ ƒ /api/export
├ ƒ /api/export/work-product
├ ƒ /api/graph/approve-staged
├ ƒ /api/graph/changes
├ ƒ /api/graph/context
├ ƒ /api/graph/cypher
├ ƒ /api/graph/evolution
├ ƒ /api/graph/ops
├ ƒ /api/graph/populate
├ ƒ /api/graph/proposals
├ ƒ /api/graph/proposals/[id]/approve
├ ƒ /api/graph/proposals/[id]/reject
├ ƒ /api/graph/staging-stream
├ ƒ /api/health
├ ƒ /api/health/agentic-search
├ ƒ /api/health/breakers
├ ƒ /api/health/diagnostics
├ ƒ /api/health/features
├ ƒ /api/health/feeds
├ ƒ /api/health/provider
├ ƒ /api/health/runtime
├ ƒ /api/health/skc
├ ƒ /api/knowledge/documents/[documentId]/capsules
├ ƒ /api/knowledge/documents/[documentId]/summarize
├ ƒ /api/knowledge/ingest-runs/[id]
├ ƒ /api/knowledge/repositories
├ ƒ /api/knowledge/repositories/[repositoryId]
├ ƒ /api/knowledge/repositories/[repositoryId]/attach
├ ƒ /api/knowledge/repositories/[repositoryId]/documents
├ ƒ /api/memory/[...slug]
├ ƒ /api/memory/working
├ ƒ /api/memory/working/[factId]
├ ƒ /api/memos
├ ƒ /api/memos/[id]
├ ƒ /api/memos/[id]/handover-package
├ ƒ /api/memos/from-ask
├ ƒ /api/memos/from-ask-pack
├ ƒ /api/memos/search
├ ƒ /api/methods/[methodId]/run
├ ƒ /api/notifications/[id]
├ ƒ /api/onboarding/chips
├ ƒ /api/onboarding/chips/suggest
├ ƒ /api/onboarding/complete
├ ƒ /api/onboarding/draft
├ ƒ /api/onboarding/profile
├ ƒ /api/onboarding/skip
├ ƒ /api/output-capsules
├ ƒ /api/output-capsules/[outputCapsuleId]
├ ƒ /api/paths
├ ƒ /api/paths/classify
├ ƒ /api/preferences
├ ƒ /api/profile
├ ƒ /api/profile/export
├ ƒ /api/profile/resolved
├ ƒ /api/promo/redeem
├ ƒ /api/reports
├ ƒ /api/reports/[id]
├ ƒ /api/reports/[id]/export
├ ƒ /api/research
├ ƒ /api/research/run
├ ƒ /api/settings/ai
├ ƒ /api/settings/api-keys
├ ƒ /api/settings/api-keys/[provider]
├ ƒ /api/settings/api-keys/[provider]/validate
├ ƒ /api/settings/validate-key
├ ƒ /api/situations
├ ƒ /api/situations/[id]
├ ƒ /api/situations/[id]/context-health
├ ƒ /api/situations/[id]/cores/[kind]
├ ƒ /api/situations/[id]/cost-cap
├ ƒ /api/situations/[id]/feed-alerts
├ ƒ /api/situations/[id]/graph-updates
├ ƒ /api/situations/[id]/inspect
├ ƒ /api/situations/[id]/open-questions
├ ƒ /api/situations/[id]/recent-tools
├ ƒ /api/situations/classify
├ ƒ /api/situations/classify-domain
├ ƒ /api/sources
├ ƒ /api/telemetry/log
├ ƒ /api/tool-data
├ ƒ /api/tool-feedback
├ ƒ /api/tool-status
├ ƒ /api/tools/contracts
├ ƒ /api/tools/marketplace/run
├ ƒ /api/tools/recommend
├ ƒ /api/usage/monthly-free
├ ƒ /api/usage/weekly-free
├ ƒ /api/waitlist
├ ƒ /api/work-products/export-docx
├ ƒ /api/work-products/import-docx
├ ƒ /api/workspace/context-stack
├ ƒ /api/workspace/next-moves
├ ○ /app
├ ○ /app/boardroom
├ ƒ /app/capsules
├ ƒ /app/capsules/builder
├ ƒ /app/conversations/[conversationId]
├ ○ /app/recent-work
├ ○ /app/repository
├ ƒ /app/settings
├ ○ /changelog
├ ○ /guide
├ ○ /help
├ ○ /learn
├ ● /legal/[slug]
│ ├ /legal/privacy
│ ├ /legal/cookies
│ ├ /legal/gdpr
│ └ [+5 more paths]
├ ○ /login
├ ○ /login/callback
├ ○ /onboarding
├ ○ /opengraph-image
├ ○ /pricing
├ ○ /release-notes
├ ○ /robots.txt
└ ○ /sitemap.xml


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

### Landing bundle

- Command: `npm run check:landing-bundle`
- Result: PASS

```text

> tacitus-app@6.4.1 check:landing-bundle
> tsx scripts/check-landing-bundle.ts

Landing route JS: 74.2 KB gzip across 6 chunk(s).
```

### Mobile landing E2E

- Command: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3011 npm run test:mobile`
- Result: PASS

```text

> tacitus-app@6.4.1 test:mobile
> playwright test tests/e2e/mobile-landing.spec.ts


Running 2 tests using 1 worker

  ok 1 tests\e2e\mobile-landing.spec.ts:8:7 › Mobile landing - iPhone 13 › light marketing home renders without cockpit overflow (1.1s)
  ok 2 tests\e2e\mobile-landing.spec.ts:21:7 › Mobile landing - iPhone 13 › primary mobile CTA meets touch-target floor (907ms)

  2 passed (2.8s)
```

### Audit gate

- Command: `npm run audit:gate`
- Result: PASS

```text

> tacitus-app@6.4.1 audit:gate
> tsx scripts/audit-runner.ts gate

[audit-runner] starting gate (9 steps)
[audit-runner] dropped duplicate audit leaves:
[audit-runner] - audit:ontology -> audit:ontology-system: duplicate package alias removed; docs now call the durable script directly
[audit-runner] - audit:path-coverage -> audit:path-tool-coverage: duplicate package alias removed; path-tool coverage remains the durable leaf

[audit-runner] TypeScript: npm run typecheck

> tacitus-app@6.4.1 typecheck
> tsc --noEmit


[audit-runner] Production build: npm run build

> tacitus-app@6.4.1 build
> next build

▲ Next.js 16.2.6 (Turbopack)
- Experiments (use with caution):
  · serverActions

  Creating an optimized production build ...
✓ Compiled successfully in 24.2s
  Running TypeScript ...
  Finished TypeScript in 52s ...
  Collecting page data using 7 workers ...
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
  Generating static pages using 7 workers (0/167) ...
  Generating static pages using 7 workers (41/167) 
  Generating static pages using 7 workers (83/167) 
  Generating static pages using 7 workers (125/167) 
✓ Generating static pages using 7 workers (167/167) in 2.8s
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /agents/[runId]
├ ƒ /api/account
├ ƒ /api/admin/system-health
├ ƒ /api/agents/runs
├ ƒ /api/agents/runs/[runId]
├ ƒ /api/agents/runs/[runId]/approvals/[approvalId]
├ ƒ /api/agents/runs/[runId]/cancel
├ ƒ /api/agents/runs/[runId]/dispatch
├ ƒ /api/agents/runs/[runId]/execute
├ ƒ /api/agents/runs/[runId]/retry
├ ƒ /api/agents/runs/[runId]/stream
├ ƒ /api/ai/actor-brief
├ ƒ /api/ai/actor-enrichment
├ ƒ /api/ai/actor-profiles
├ ƒ /api/ai/advisory
├ ƒ /api/ai/argus
├ ƒ /api/ai/ask
├ ƒ /api/ai/ask-praxis
├ ƒ /api/ai/auto-briefing
├ ƒ /api/ai/auto-structure
├ ƒ /api/ai/brainstorming-table
├ ƒ /api/ai/brief
├ ƒ /api/ai/brief-builder
├ ƒ /api/ai/briefing-generate
├ ƒ /api/ai/chat
├ ƒ /api/ai/commitment-scan
├ ƒ /api/ai/compare
├ ƒ /api/ai/critique
├ ƒ /api/ai/dashboard-summary
├ ƒ /api/ai/deep-research
├ ƒ /api/ai/deep-search-agent
├ ƒ /api/ai/discover-sources
├ ƒ /api/ai/document
├ ƒ /api/ai/dossier-generate
├ ƒ /api/ai/drafting-action
├ ƒ /api/ai/economic-impact
├ ƒ /api/ai/electoral-risk
├ ƒ /api/ai/external-actors
├ ƒ /api/ai/extract
├ ƒ /api/ai/extract-episodes
├ ƒ /api/ai/forecast
├ ƒ /api/ai/game-theory
├ ƒ /api/ai/geospatial
├ ƒ /api/ai/graph-propose
├ ƒ /api/ai/grounded-search
├ ƒ /api/ai/human-rights
├ ƒ /api/ai/humanitarian
├ ƒ /api/ai/info-environment
├ ƒ /api/ai/legal-tracker
├ ƒ /api/ai/media-analyze
├ ƒ /api/ai/media-roundup
├ ƒ /api/ai/mediation-design
├ ƒ /api/ai/negotiation
├ ƒ /api/ai/peacebuilding-index
├ ƒ /api/ai/policy-memo
├ ƒ /api/ai/power-map
├ ƒ /api/ai/red-team-review
├ ƒ /api/ai/report
├ ƒ /api/ai/research-extract
├ ƒ /api/ai/risk-indicators
├ ƒ /api/ai/sanctions-check
├ ƒ /api/ai/sanctions-scan
├ ƒ /api/ai/scenario
├ ƒ /api/ai/search
├ ƒ /api/ai/situation-intelligence
├ ƒ /api/ai/source-scout
├ ƒ /api/ai/sourceability
├ ƒ /api/ai/talking-points
├ ƒ /api/ai/timeline-events
├ ƒ /api/ai/treaty-analyze
├ ƒ /api/ai/un-toolkit
├ ƒ /api/ai/writer/ask
├ ƒ /api/annotations
├ ƒ /api/app/search
├ ƒ /api/artifacts/list
├ ƒ /api/assistant/intent
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/session
├ ƒ /api/auth/test-firebase
├ ƒ /api/backend/[...path]
├ ƒ /api/backend/graph/test-connection
├ ƒ /api/billing/checkout
├ ƒ /api/billing/portal
├ ƒ /api/billing/webhook
├ ƒ /api/boardroom/history
├ ƒ /api/boardroom/runs
├ ƒ /api/capabilities
├ ƒ /api/capsules
├ ƒ /api/capsules/[capsuleId]
├ ƒ /api/capsules/[capsuleId]/fork
├ ƒ /api/capsules/[capsuleId]/publish
├ ƒ /api/capsules/assist/[action]
├ ƒ /api/capsules/eval/dry-run
├ ƒ /api/context/capsules
├ ƒ /api/context/capsules/[capsuleId]
├ ƒ /api/context/capsules/[capsuleId]/attach
├ ƒ /api/context/capsules/[capsuleId]/capsule-plus
├ ƒ /api/context/capsules/[capsuleId]/diff
├ ƒ /api/context/capsules/[capsuleId]/evaluations
├ ƒ /api/context/capsules/[capsuleId]/graph/edges
├ ƒ /api/context/capsules/[capsuleId]/graph/nodes
├ ƒ /api/context/capsules/[capsuleId]/history
├ ƒ /api/context/capsules/[capsuleId]/memories
├ ƒ /api/context/capsules/[capsuleId]/notes
├ ƒ /api/context/capsules/[capsuleId]/spans
├ ƒ /api/context/capsules/[capsuleId]/swap
├ ƒ /api/context/capsules/[capsuleId]/usage
├ ƒ /api/context/capsules/capsule-plus/import
├ ƒ /api/context/capsules/shared/[token]
├ ƒ /api/context/check-claim
├ ƒ /api/context/packages
├ ƒ /api/context/prompt-health
├ ƒ /api/context/readiness
├ ƒ /api/context/resolve
├ ƒ /api/context/trust-posture
├ ƒ /api/conversations
├ ƒ /api/conversations/[conversationId]
├ ƒ /api/conversations/[conversationId]/turns
├ ƒ /api/cores/library
├ ƒ /api/created-work
├ ƒ /api/credits/burn-rate
├ ƒ /api/cron/check-alerts
├ ƒ /api/cron/daily-brief
├ ƒ /api/cron/early-warning-refresh
├ ƒ /api/cron/generate-briefing
├ ƒ /api/cron/verify-neo4j-sync
├ ƒ /api/data/intelligence
├ ƒ /api/documents
├ ƒ /api/documents/[id]
├ ƒ /api/documents/[id]/extract-stored
├ ƒ /api/documents/retrieve
├ ƒ /api/documents/upload
├ ƒ /api/entities/enrich
├ ƒ /api/events/pubsub/profile
├ ƒ /api/export
├ ƒ /api/export/work-product
├ ƒ /api/graph/approve-staged
├ ƒ /api/graph/changes
├ ƒ /api/graph/context
├ ƒ /api/graph/cypher
├ ƒ /api/graph/evolution
├ ƒ /api/graph/ops
├ ƒ /api/graph/populate
├ ƒ /api/graph/proposals
├ ƒ /api/graph/proposals/[id]/approve
├ ƒ /api/graph/proposals/[id]/reject
├ ƒ /api/graph/staging-stream
├ ƒ /api/health
├ ƒ /api/health/agentic-search
├ ƒ /api/health/breakers
├ ƒ /api/health/diagnostics
├ ƒ /api/health/features
├ ƒ /api/health/feeds
├ ƒ /api/health/provider
├ ƒ /api/health/runtime
├ ƒ /api/health/skc
├ ƒ /api/knowledge/documents/[documentId]/capsules
├ ƒ /api/knowledge/documents/[documentId]/summarize
├ ƒ /api/knowledge/ingest-runs/[id]
├ ƒ /api/knowledge/repositories
├ ƒ /api/knowledge/repositories/[repositoryId]
├ ƒ /api/knowledge/repositories/[repositoryId]/attach
├ ƒ /api/knowledge/repositories/[repositoryId]/documents
├ ƒ /api/memory/[...slug]
├ ƒ /api/memory/working
├ ƒ /api/memory/working/[factId]
├ ƒ /api/memos
├ ƒ /api/memos/[id]
├ ƒ /api/memos/[id]/handover-package
├ ƒ /api/memos/from-ask
├ ƒ /api/memos/from-ask-pack
├ ƒ /api/memos/search
├ ƒ /api/methods/[methodId]/run
├ ƒ /api/notifications/[id]
├ ƒ /api/onboarding/chips
├ ƒ /api/onboarding/chips/suggest
├ ƒ /api/onboarding/complete
├ ƒ /api/onboarding/draft
├ ƒ /api/onboarding/profile
├ ƒ /api/onboarding/skip
├ ƒ /api/output-capsules
├ ƒ /api/output-capsules/[outputCapsuleId]
├ ƒ /api/paths
├ ƒ /api/paths/classify
├ ƒ /api/preferences
├ ƒ /api/profile
├ ƒ /api/profile/export
├ ƒ /api/profile/resolved
├ ƒ /api/promo/redeem
├ ƒ /api/reports
├ ƒ /api/reports/[id]
├ ƒ /api/reports/[id]/export
├ ƒ /api/research
├ ƒ /api/research/run
├ ƒ /api/settings/ai
├ ƒ /api/settings/api-keys
├ ƒ /api/settings/api-keys/[provider]
├ ƒ /api/settings/api-keys/[provider]/validate
├ ƒ /api/settings/validate-key
├ ƒ /api/situations
├ ƒ /api/situations/[id]
├ ƒ /api/situations/[id]/context-health
├ ƒ /api/situations/[id]/cores/[kind]
├ ƒ /api/situations/[id]/cost-cap
├ ƒ /api/situations/[id]/feed-alerts
├ ƒ /api/situations/[id]/graph-updates
├ ƒ /api/situations/[id]/inspect
├ ƒ /api/situations/[id]/open-questions
├ ƒ /api/situations/[id]/recent-tools
├ ƒ /api/situations/classify
├ ƒ /api/situations/classify-domain
├ ƒ /api/sources
├ ƒ /api/telemetry/log
├ ƒ /api/tool-data
├ ƒ /api/tool-feedback
├ ƒ /api/tool-status
├ ƒ /api/tools/contracts
├ ƒ /api/tools/marketplace/run
├ ƒ /api/tools/recommend
├ ƒ /api/usage/monthly-free
├ ƒ /api/usage/weekly-free
├ ƒ /api/waitlist
├ ƒ /api/work-products/export-docx
├ ƒ /api/work-products/import-docx
├ ƒ /api/workspace/context-stack
├ ƒ /api/workspace/next-moves
├ ○ /app
├ ○ /app/boardroom
├ ƒ /app/capsules
├ ƒ /app/capsules/builder
├ ƒ /app/conversations/[conversationId]
├ ○ /app/recent-work
├ ○ /app/repository
├ ƒ /app/settings
├ ○ /changelog
├ ○ /guide
├ ○ /help
├ ○ /learn
├ ● /legal/[slug]
│ ├ /legal/privacy
│ ├ /legal/cookies
│ ├ /legal/gdpr
│ └ [+5 more paths]
├ ○ /login
├ ○ /login/callback
├ ○ /onboarding
├ ○ /opengraph-image
├ ○ /pricing
├ ○ /release-notes
├ ○ /robots.txt
└ ○ /sitemap.xml


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand


[audit-runner] Routes: npm run audit:routes

> tacitus-app@6.4.1 audit:routes
> tsx scripts/audit-runner.ts routes

[audit-runner] starting routes (1 steps)
[audit-runner] dropped duplicate audit leaves:
[audit-runner] - audit:ontology -> audit:ontology-system: duplicate package alias removed; docs now call the durable script directly
[audit-runner] - audit:path-coverage -> audit:path-tool-coverage: duplicate package alias removed; path-tool coverage remains the durable leaf

[audit-runner] AI route inventory: npm run internal:audit-routes

> tacitus-app@6.4.1 internal:audit-routes
> node scripts/audit-ai-routes.mjs && tsx scripts/audit-capability-registry.ts

OK - 61 AI route files, 61 calibrated, 10 exempt (static-marker).
audit:capability-registry OK (61 routes -> 24 capabilities -> 15 families)
[audit-runner] routes complete

[audit-runner] Capsule lane: npm run audit:capsules

> tacitus-app@6.4.1 audit:capsules
> tsx scripts/audit-runner.ts capsules

[audit-runner] starting capsules (13 steps)
[audit-runner] dropped duplicate audit leaves:
[audit-runner] - audit:ontology -> audit:ontology-system: duplicate package alias removed; docs now call the durable script directly
[audit-runner] - audit:path-coverage -> audit:path-tool-coverage: duplicate package alias removed; path-tool coverage remains the durable leaf

[audit-runner] Capsule depth: npm run audit:capsule-depth

> tacitus-app@6.4.1 audit:capsule-depth
> tsx scripts/audit-capsule-depth.ts

audit:capsule-depth OK (205 starters, 2026-05-31-graphlite-advisory-projection-v17)

[audit-runner] Capsule consolidation: npm run audit:capsule-consolidation

> tacitus-app@6.4.1 audit:capsule-consolidation
> tsx scripts/audit-capsule-consolidation.ts

audit:capsule-consolidation OK (205 starters, avg prompt 9441 chars)

[audit-runner] Capsule contract: npm run audit:capsule-contract

> tacitus-app@6.4.1 audit:capsule-contract
> tsx scripts/audit-capsule-contract.ts

audit:capsule-contract OK

[audit-runner] Capsule memory contract: npm run audit:capsule-memory-contract

> tacitus-app@6.4.1 audit:capsule-memory-contract
> tsx scripts/audit-capsule-memory-contract.ts

audit:capsule-memory-contract OK

[audit-runner] Capsule V3: npm run audit:capsule-v3

> tacitus-app@6.4.1 audit:capsule-v3
> tsx scripts/audit-capsule-v3.ts

audit:capsule-v3 OK

[audit-runner] Capsule context capture: npm run audit:capsule-context-capture

> tacitus-app@6.4.1 audit:capsule-context-capture
> tsx scripts/audit-capsule-context-capture.ts

audit:capsule-context-capture OK (205 starters, avg prompt 9441 chars)

[audit-runner] Capsule research dossiers: npm run audit:capsule-research-dossiers

> tacitus-app@6.4.1 audit:capsule-research-dossiers
> tsx scripts/audit-capsule-research-dossiers.ts

audit:capsule-research-dossiers OK
Starters: 205
Average prompt chars: 9441

[audit-runner] Capsule backfill readiness: npm run audit:capsule-backfill-readiness

> tacitus-app@6.4.1 audit:capsule-backfill-readiness
> tsx scripts/audit-capsule-backfill-readiness.ts

audit:capsule-backfill-readiness OK
Checks: 17

[audit-runner] Capsule graphlite projections: npm run audit:capsule-graphlite-projections

> tacitus-app@6.4.1 audit:capsule-graphlite-projections
> tsx scripts/audit-capsule-graphlite-projections.ts

audit:capsule-graphlite-projections OK
Starters: 205
Named graphs: 205

[audit-runner] Output capsule storage: npm run audit:output-capsule-storage

> tacitus-app@6.4.1 audit:output-capsule-storage
> tsx scripts/audit-output-capsule-storage.ts

audit:output-capsule-storage OK

[audit-runner] Knowledge library contract: npm run audit:knowledge-library-contract

> tacitus-app@6.4.1 audit:knowledge-library-contract
> tsx scripts/audit-knowledge-library-contract.ts

audit:knowledge-library-contract OK

[audit-runner] Named stack contract: npm run audit:named-stack-contract

> tacitus-app@6.4.1 audit:named-stack-contract
> tsx scripts/audit-named-stack-contract.ts

audit:named-stack-contract OK

[audit-runner] Graph proposal review contract: npm run audit:graph-proposal-review-contract

> tacitus-app@6.4.1 audit:graph-proposal-review-contract
> tsx scripts/audit-graph-proposal-review-contract.ts

audit:graph-proposal-review-contract OK
[audit-runner] capsules complete

[audit-runner] Agent lane: npm run audit:agents

> tacitus-app@6.4.1 audit:agents
> tsx scripts/audit-runner.ts agents

[audit-runner] starting agents (2 steps)
[audit-runner] dropped duplicate audit leaves:
[audit-runner] - audit:ontology -> audit:ontology-system: duplicate package alias removed; docs now call the durable script directly
[audit-runner] - audit:path-coverage -> audit:path-tool-coverage: duplicate package alias removed; path-tool coverage remains the durable leaf

[audit-runner] Agent process contract: npm run audit:agent-process-contract

> tacitus-app@6.4.1 audit:agent-process-contract
> tsx scripts/audit-agent-process-contract.ts

audit:agent-process-contract OK

[audit-runner] Agent runtime proof: npm run audit:agent-runtime-proof

> tacitus-app@6.4.1 audit:agent-runtime-proof
> tsx scripts/audit-agent-runtime-proof.ts

[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
Agent runtime proof audit
OK   static contract: create, dispatch, execute, Firestore onSnapshot mirror, stream fallback, ledger, worker, mirror, ADK, and Genkit markers found
WARN ledger: runtime proof can run with doubles only
OK   Cloud Tasks queue: projects/praxisbytacitus/locations/us-central1/queues/agent-runs
WARN worker target: dispatch URL cannot be built for live Cloud Tasks
WARN worker auth: live worker route will reject Cloud Tasks calls until auth env is set
WARN Genkit: google-ai at global: defaulting to Google AI Studio path; set GOOGLE_GENAI_API_KEY or GOOGLE_VERTEX_PROJECT
WARN ADK Agent Engine: queued ADK worker should stay planned/unconfigured
OK   proof command: npx vitest run tests/unit/lib/agent-runtime src/__tests__/genkit-provider.test.ts
WARN: Agent ledger env is missing: AGENT_RUNTIME_DATABASE_URL, PRAXIS_DATABASE_URL, or DATABASE_URL.
audit:agent-runtime-proof OK
WARN: Worker base URL is missing: set AGENT_RUN_WORKER_BASE_URL or APP_URL before Cloud Tasks dispatch.
WARN: Worker auth is not production-ready: set Cloud Tasks OIDC service account/audience or local shared secret.
WARN: Genkit provider resolves, but live model calls are not configured in this shell.
WARN: ADK Agent Engine is unconfigured for queued agent execution in this shell.
[audit-runner] agents complete

[audit-runner] Architecture lane: npm run audit:architecture

> tacitus-app@6.4.1 audit:architecture
> tsx scripts/audit-runner.ts architecture

[audit-runner] starting architecture (3 steps)
[audit-runner] dropped duplicate audit leaves:
[audit-runner] - audit:ontology -> audit:ontology-system: duplicate package alias removed; docs now call the durable script directly
[audit-runner] - audit:path-coverage -> audit:path-tool-coverage: duplicate package alias removed; path-tool coverage remains the durable leaf

[audit-runner] Architecture chain: npm run audit:architecture-chain

> tacitus-app@6.4.1 audit:architecture-chain
> tsx scripts/audit-architecture-chain.ts

Architecture chain audit passed: 10 core audits are wired. Historical audits may live under scripts/_archive/audits. (static-marker)

[audit-runner] Repository shape: npm run audit:repo-shape

> tacitus-app@6.4.1 audit:repo-shape
> tsx scripts/audit-repo-shape.ts

Repo shape audit passed. (static-marker)

[audit-runner] Architecture reference: npm run audit:architecture-reference

> tacitus-app@6.4.1 audit:architecture-reference
> tsx scripts/audit-architecture-reference.ts

[audit:architecture-reference] ok (static-marker)
[audit-runner] architecture complete

[audit-runner] Surface lane: npm run audit:surface

> tacitus-app@6.4.1 audit:surface
> tsx scripts/audit-runner.ts surface

[audit-runner] starting surface (7 steps)
[audit-runner] dropped duplicate audit leaves:
[audit-runner] - audit:ontology -> audit:ontology-system: duplicate package alias removed; docs now call the durable script directly
[audit-runner] - audit:path-coverage -> audit:path-tool-coverage: duplicate package alias removed; path-tool coverage remains the durable leaf

[audit-runner] MVP route shape: npm run audit:mvp-route-shape

> tacitus-app@6.4.1 audit:mvp-route-shape
> tsx scripts/audit-mvp-route-shape.ts

[audit:mvp-route-shape] ok

[audit-runner] Tool contracts: npm run audit:tool-contracts

> tacitus-app@6.4.1 audit:tool-contracts
> tsx scripts/audit-tool-contracts.ts

Wrote C:\Users\giuli\A4_PRAXIS_CLOUD_Work\docs\audits\LATEST-tool-contracts.md
55/55 tools pass >=6/7 operating-contract checks (static-marker)

[audit-runner] Purpose surface: npm run audit:purpose-surface

> tacitus-app@6.4.1 audit:purpose-surface
> tsx scripts/audit-purpose-surface.ts

[audit:purpose-surface] ok (static-marker)

[audit-runner] Public surface: npm run audit:public-surface

> tacitus-app@6.4.1 audit:public-surface
> tsx scripts/audit-public-surface.ts

audit:public-surface OK

[audit-runner] Release notes: npm run audit:release-notes

> tacitus-app@6.4.1 audit:release-notes
> tsx scripts/audit-release-notes.ts

[audit:release-notes] ok 6.4.1 build 2026.05.31.03

[audit-runner] Ask cockpit runtime: npm run audit:ask-cockpit-runtime

> tacitus-app@6.4.1 audit:ask-cockpit-runtime
> tsx scripts/audit-ask-cockpit-runtime.ts

[audit:ask-cockpit-runtime] ok

[audit-runner] Single H1: npm run audit:single-h1

> tacitus-app@6.4.1 audit:single-h1
> node scripts/audit-single-h1.mjs

audit-single-h1: ok - retired workbench component tree is absent.
[audit-runner] surface complete

[audit-runner] Runtime lane: npm run audit:runtime

> tacitus-app@6.4.1 audit:runtime
> tsx scripts/audit-runner.ts runtime

[audit-runner] starting runtime (3 steps)
[audit-runner] dropped duplicate audit leaves:
[audit-runner] - audit:ontology -> audit:ontology-system: duplicate package alias removed; docs now call the durable script directly
[audit-runner] - audit:path-coverage -> audit:path-tool-coverage: duplicate package alias removed; path-tool coverage remains the durable leaf

[audit-runner] Deep preship: npm run audit:deep-preship

> tacitus-app@6.4.1 audit:deep-preship
> tsx scripts/audit-deep-preship.ts

[audit:deep-preship] wrote docs\audits\LATEST-DEEP_PRESHIP_CHECKLIST.md and docs\audits\LATEST-DEEP_PRESHIP_CHECKLIST.json
[audit:deep-preship] 141 PASS, 2 WARN, 0 BLOCKED (static-marker)

[audit-runner] Cognee isolation: npm run audit:cognee

> tacitus-app@6.4.1 audit:cognee
> tsx scripts/audit-cognee-isolation.ts

[audit:cognee] ok (static-marker)

[audit-runner] GCP: npm run audit:gcp

> tacitus-app@6.4.1 audit:gcp
> node scripts/audit-gcp.mjs

OK   [api] Vertex AI API enabled
OK   [api] Firestore API enabled
OK   [api] Cloud Run API enabled
OK   [api] Cloud Build API enabled
OK   [api] Pub/Sub API enabled
OK   [api] Cloud Functions API enabled
OK   [api] Cloud Scheduler API enabled
OK   [api] Cloud Tasks API enabled
OK   [api] Cloud SQL Admin API enabled
OK   [api] Service Networking API enabled
OK   [api] Secret Manager API enabled
OK   [api] BigQuery API enabled
OK   [api] Artifact Registry API enabled
OK   [data] BigQuery dataset praxis_analytics
OK   [data] Storage bucket praxis-uploads
OK   [secret] Secret: praxis-firebase-sa
OK   [secret] Secret: praxis-google-ai-key
OK   [secret] Secret: praxis-cron-secret
OK   [secret] Secret: praxis-cookie-secret
OK   [secret] Secret: praxis-user-key-master
OK   [secret] Secret: praxis-db-password
OK   [secret] Secret: NEO4J_URI
OK   [secret] Secret: praxis-langgraph-db-password
OK   [secret] Secret: praxis-vertex-adk-engine-id
OK   [secret] Secret: praxis-pubsub-push-secret
OK   [pubsub] Pub/Sub topic: profile.events
OK   [pubsub] Pub/Sub topic: praxis.events
OK   [tasks] Cloud Tasks queue: praxis-research
OK   [tasks] Cloud Tasks queue: praxis-agents
OK   [tasks] Cloud Tasks queue: praxis-embeddings
OK   [runtime] Cloud Run: praxis-frontend
OK   [runtime] Cloud Run: praxis-backend
OK   [sql] Cloud SQL: praxisbytacitus-instance
OK   [sql] Cloud SQL database: praxis
OK   [sql] Cloud SQL user: praxis_app
OK   [sql] Cloud SQL database: praxis_langgraph
OK   [iam] Service account: praxis-agents-sa
WARN [schedule] Scheduler job exists

Summary: api=13, data=2, secret=10, pubsub=2, tasks=3, runtime=2, sql=4, iam=1, schedule=1
Hard failures: 0 · Soft warnings: 1 (runtime-proof)
[audit-runner] runtime complete

[audit-runner] Simplification: npm run audit:simplification

> tacitus-app@6.4.1 audit:simplification
> tsx scripts/audit-runner.ts simplification

[audit-runner] starting simplification (6 steps)
[audit-runner] dropped duplicate audit leaves:
[audit-runner] - audit:ontology -> audit:ontology-system: duplicate package alias removed; docs now call the durable script directly
[audit-runner] - audit:path-coverage -> audit:path-tool-coverage: duplicate package alias removed; path-tool coverage remains the durable leaf

[audit-runner] Route consolidation: npm run audit:route-consolidation

> tacitus-app@6.4.1 audit:route-consolidation
> tsx scripts/audit-route-consolidation.ts

audit:route-consolidation OK (25 removed route files verified)

[audit-runner] Archive guard: npm run audit:no-normal-user-archive

> tacitus-app@6.4.1 audit:no-normal-user-archive
> tsx scripts/audit-no-normal-user-archive.ts

audit:no-normal-user-archive OK (2 Workspace hrefs verified)

[audit-runner] Admin internals: npm run audit:admin-only-internals

> tacitus-app@6.4.1 audit:admin-only-internals
> tsx scripts/audit-admin-only-internals.ts

audit:admin-only-internals OK (6 internal paths verified)

[audit-runner] Next moves: npm run audit:next-moves

> tacitus-app@6.4.1 audit:next-moves
> tsx scripts/audit-next-moves.ts

audit:next-moves OK (MAX_NEXT_MOVES <= 3, vocabulary locked, consumers consume getNextMoves)

[audit-runner] Context health: npm run audit:context-health

> tacitus-app@6.4.1 audit:context-health
> tsx scripts/audit-context-health.ts

audit:context-health OK (deterministic rules first, max 3 visible next actions)

[audit-runner] Canonical names: npm run audit:names

> tacitus-app@6.4.1 audit:names
> tsx scripts/audit-canonical-names.ts

canonical-names audit
  TOOL_REGISTRY entries:        55
  PRAXIS_CANONICAL_TOOLS entries: 13
  errors:    0
  warnings:  0

OK: canonical-name contract holds.
[audit-runner] simplification complete
[audit-runner] gate complete
```

### AI route calibration audit

- Command: `node scripts/audit-ai-routes.mjs`
- Result: PASS

```text
OK - 61 AI route files, 61 calibrated, 10 exempt (static-marker).
```

### Forbidden Gemini grep

- Command: `rg "gemini-2\.0|gemini-3-pro-preview" src/ backend/`
- Result: PASS (0 matches; rg exit 1 treated as success)

```text
(no output)
```

## Mobile Server Log

```text

> tacitus-app@6.4.1 start
> next start -p 3011

▲ Next.js 16.2.6
- Local:         http://localhost:3011
- Network:       http://192.168.1.160:3011
✓ Ready in 165ms
[tracing] GCP_PROJECT_ID not set, skipping Cloud Trace init
{"latencyMs":3,"level":"info","message":"api_call","route":"/api/workspace/context-stack","status":401,"timestamp":"2026-06-01T18:48:05.271Z","uid":"anonymous"}
{"latencyMs":1,"level":"info","message":"api_call","route":"/api/workspace/context-stack","status":401,"timestamp":"2026-06-01T18:48:05.768Z","uid":"anonymous"}

⚠ "next start" does not work with "output: standalone" configuration. Use "node .next/standalone/server.js" instead.
[firebase-admin] Firebase Admin service-account credentials are not configured
[firebase-admin] ⚠️  Firestore is NOT available. All routes requiring Firestore (credits, tool data, auth rate limiting) will fail. Init error: Firebase Admin service-account credentials are not configured
```
