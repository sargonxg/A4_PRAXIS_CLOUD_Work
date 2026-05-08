# Dead environment variables

## Set but unread

_Not computed from live environment; no local set-but-unread claims made._

## Read but not found in env/infra files

| var | read_sites | recommendation |
|---|---|---|
| ACLED_API_KEY | docs/superpowers/specs/2026-04-24-praxis-completion-master-plan.md | Document default or add to env template if required. |
| ADMIN_ALLOWLIST | src/lib/auth/admin-gate.ts | Document default or add to env template if required. |
| AUDIT_SPINE_BASE | scripts/audit-spine.ts | Document default or add to env template if required. |
| AUDIT_SPINE_SCAN_ALL | scripts/audit-spine.ts | Document default or add to env template if required. |
| AUTH_COOKIE_SECRET | src/lib/context/conversation-token.ts | Document default or add to env template if required. |
| COGNEE_BACKEND_URL | docs/codex-prompts/PRAXIS_V2_C0_COGNEE_LIVE.md, scripts/audit-cognee-runtime.ts, src/app/api/health/features/route.ts, src/app/api/memory/[...slug]/route.ts | Document default or add to env template if required. |
| COGNEE_ENABLED | docs/codex-prompts/PRAXIS_V2_C0_COGNEE_LIVE.md, scripts/audit-cognee-isolation.ts, scripts/audit-cognee-operations.ts, scripts/audit-cognee-runtime.ts | Document default or add to env template if required. |
| COGNEE_MODE | src/app/api/health/features/route.ts, src/app/api/health/route.ts | Document default or add to env template if required. |
| DIALECTICA_ENABLED | src/lib/dialectica/http-adapter.ts, src/lib/dialectica/index.ts | Document default or add to env template if required. |
| DIALECTICA_HTTP_URL | src/lib/dialectica/http-adapter.ts | Document default or add to env template if required. |
| GOOGLE_CLOUD_LOCATION | backend/agents/deploy.py | Document default or add to env template if required. |
| GOOGLE_CLOUD_REGION | scripts/auth-doctor.ts | Document default or add to env template if required. |
| INDEX_BACKOFF_SECONDS | cloud_functions/gdelt_poller/worker.py | Document default or add to env template if required. |
| KG_BACKEND | src/app/api/health/features/route.ts | Document default or add to env template if required. |
| KG_DUAL_WRITE | docs/codex-prompts/PRAXIS_V2_B1_DUAL_WRITE_GRAPH.md | Document default or add to env template if required. |
| KG_FIRESTORE_WRITES | docs/codex-prompts/PRAXIS_V2_B3_RETIRE_FIRESTORE_GRAPH.md | Document default or add to env template if required. |
| KG_READ_PRIMARY | docs/codex-prompts/PRAXIS_V2_B2_READ_PATH_POSTGRES.md | Document default or add to env template if required. |
| KG_SHADOW_READ | docs/codex-prompts/PRAXIS_V2_B2_READ_PATH_POSTGRES.md | Document default or add to env template if required. |
| LANGSMITH_TRACING | backend/agents/langsmith_config.py | Document default or add to env template if required. |
| LOG_LEVEL | backend/logging_config.py, docs/implementation/gdelt-ingestion-2026-04-25.md | Document default or add to env template if required. |
| MAX_SITUATIONS | cloud_functions/gdelt_poller/worker.py | Document default or add to env template if required. |
| NEO4J_USERNAME | src/lib/graph/neo4j-drift-verifier.ts, src/lib/knowledge/graph-layer.ts | Document default or add to env template if required. |
| NEXTAUTH_SECRET | src/lib/context/conversation-token.ts | Document default or add to env template if required. |
| NEXT_PUBLIC_APP_URL | docs/codex-prompts/PRAXIS_V2_A4_TEAM_INVITE_FLOW.md, src/app/api/polar/checkout/route.ts, src/app/api/polar/portal/route.ts | Document default or add to env template if required. |
| NEXT_PUBLIC_DEBUG_PANEL | src/components/app/debug-panel.tsx | Document default or add to env template if required. |
| NEXT_PUBLIC_MAPTILER_KEY | docs/codex-prompts/PRAXIS_CODEX_29_VISUALIZATION_WAVE.md, src/components/graph/PraxisMapReact.tsx | Document default or add to env template if required. |
| NEXT_PUBLIC_PRAXIS_FORCE_REDUCED_MOTION | src/components/landing/landing-motion-context.tsx | Document default or add to env template if required. |
| NEXT_PUBLIC_SENTRY_DSN | sentry.client.config.ts, sentry.server.config.ts | Document default or add to env template if required. |
| OPENSANCTIONS_MANIFEST_URL | backend/services/sanctions/sync_index.py | Document default or add to env template if required. |
| PG_DATABASE_URL | scripts/audit-kg-drift-runtime.ts | Document default or add to env template if required. |
| PLAYWRIGHT_BASE_URL | playwright.config.ts, tests/e2e/capabilities-api.spec.ts, tests/e2e/golden-path.spec.ts, tests/e2e/onboarding.spec.ts | Document default or add to env template if required. |
| POLAR_ACCESS_TOKEN | src/app/api/health/diagnostics/route.ts, src/app/api/health/route.ts, src/app/api/polar/checkout/route.ts, src/app/api/polar/portal/route.ts | Document default or add to env template if required. |
| POLAR_SERVER | src/app/api/health/diagnostics/route.ts, src/lib/billing/polar.ts | Document default or add to env template if required. |
| POLAR_SUCCESS_URL | src/app/api/polar/checkout/route.ts | Document default or add to env template if required. |
| POLAR_WEBHOOK_SECRET | src/app/api/health/diagnostics/route.ts, src/app/api/health/route.ts, src/app/api/polar/webhook/route.ts | Document default or add to env template if required. |
| PRAXIS_ALLOW_GEMINI3_TARGETS | scripts/audit-model-matrix-coverage.ts | Document default or add to env template if required. |
| PRAXIS_ALLOW_UNSIGNED_CONTEXT | src/lib/context/context-aware.ts | Document default or add to env template if required. |
| PRAXIS_AUDIENCE_TUNED_BRIEFING | src/lib/ai/audience-presets.ts, tests/unit/lib/ai/audience-presets.test.ts | Document default or add to env template if required. |
| PRAXIS_BASE_URL | scripts/audit-owner-scoping-runtime.ts, scripts/audit-tool-context-isolation-runtime.ts | Document default or add to env template if required. |
| PRAXIS_CONTEXT_TOKEN_SECRET | src/lib/context/conversation-token.ts | Document default or add to env template if required. |
| PRAXIS_EMAIL_PROVIDER | docs/codex-prompts/PRAXIS_V2_A4_TEAM_INVITE_FLOW.md | Document default or add to env template if required. |
| PRAXIS_GRAPHRAG_ENABLE_SUBPROCESS | services/extract-graphrag/main.py | Document default or add to env template if required. |
| PRAXIS_LIVE_DB_AUDIT | scripts/audit-embedding-dim.ts, scripts/audit-kg-drift-runtime.ts | Document default or add to env template if required. |
| PRAXIS_OWNER_SCOPING_TEST | scripts/audit-owner-scoping-runtime.ts, scripts/audit-tool-context-isolation-runtime.ts | Document default or add to env template if required. |
| PRAXIS_USE_GEMINI_31 | docs/phases/PRAXIS_PHASE_1_FOUNDATION.md, src/lib/ai/providers.ts | Document default or add to env template if required. |
| PRAXIS_WORKER_LOCAL_FIXTURE | services/extract-docling/main.py | Document default or add to env template if required. |
| PROMO_FULL_ACCESS_CODES | src/app/api/promo/redeem/route.ts | Document default or add to env template if required. |
| RESEND_API_KEY | src/app/api/health/diagnostics/route.ts, src/lib/services/email-service.ts | Document default or add to env template if required. |
| SENTRY_DSN | backend/main.py | Document default or add to env template if required. |
| SENTRY_ENVIRONMENT | backend/main.py | Document default or add to env template if required. |
| SENTRY_RELEASE | backend/main.py | Document default or add to env template if required. |
| SENTRY_TRACES_SAMPLE_RATE | backend/main.py | Document default or add to env template if required. |
| SESSION_COOKIE | scripts/verify-tools.ts | Document default or add to env template if required. |
| STRIPE_METERS_DISABLE | src/lib/billing/stripe-meters.ts, tests/services/stripe-meters.test.ts | Document default or add to env template if required. |
| STRIPE_SECRET_KEY | src/lib/billing/stripe-meters.ts, tests/services/stripe-meters.test.ts | Document default or add to env template if required. |
| SYRIA_LIVE_INGEST_ENABLED | src/app/api/situations/[id]/syria-ingest/route.ts | Document default or add to env template if required. |
| TEST_FIREBASE_EMAIL | tests/e2e/golden-path.spec.ts, tests/e2e/onboarding.spec.ts | Document default or add to env template if required. |
| TEST_FIREBASE_PASSWORD | tests/e2e/golden-path.spec.ts, tests/e2e/onboarding.spec.ts | Document default or add to env template if required. |
| TEST_OWNER_SCOPING_CASE_ID | scripts/audit-owner-scoping-runtime.ts | Document default or add to env template if required. |
| TEST_TOOL_CONTEXT_CASE_ID | scripts/audit-tool-context-isolation-runtime.ts | Document default or add to env template if required. |
| TEST_USER_B_COOKIE | scripts/audit-owner-scoping-runtime.ts, scripts/audit-tool-context-isolation-runtime.ts | Document default or add to env template if required. |
| UCDP_ACCESS_TOKEN | src/app/api/health/feeds/route.ts, src/lib/ai/live-source-pack.ts, src/lib/data-feeds/ucdp-client.ts | Document default or add to env template if required. |
| UCDP_API_VERSION | src/lib/data-feeds/ucdp-client.ts | Document default or add to env template if required. |
| VERCEL_ENV | scripts/audit-ai-provider-vertex-default.ts | Document default or add to env template if required. |
| WORKBENCH_INITIAL_JS_BUDGET_KB | scripts/audit-workbench-bundle.ts | Document default or add to env template if required. |
| YENTE_URL | backend/services/sanctions/yente_client.py | Document default or add to env template if required. |
