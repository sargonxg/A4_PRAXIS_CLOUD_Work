# PRAXIS Full Audit - 2026-04-28

Scope: billing/entitlements, admin operations, Firecrawl, Parallel, Google /
Vertex defaults, tool calibration, situation creation, RAG/storage, and docs.

## Executive Status

| Area | Status | Notes |
|---|---|---|
| Firebase Admin | Working locally | Service account is in ignored `.env.local`; build initializes Admin SDK successfully. |
| Firecrawl | Working | Key stored in Secret Manager as `praxis-firecrawl-api-key`; v2 search and scrape smoke passed. |
| Parallel | Working | Key stored in Secret Manager as `praxis-parallel-api-key`; Codex MCP `parallel-search` added; direct v1 search smoke passed after mode update. |
| Google Cloud | Strong base | Vertex AI, Firebase Vertex AI, Firestore, Secret Manager, Cloud Run, Cloud Tasks, Pub/Sub, BigQuery, Storage, Model Armor are enabled. |
| Polar code | Implemented | Checkout, webhook, portal, Firestore entitlement mirror, settings upgrade path, and protected Firestore fields exist. |
| Polar live launch | Blocked by owner action | `.env.local` lacks webhook secret and product IDs; the supplied OAT previously failed auth. Create fresh products/secrets before live checkout. |
| Admin | Improved | `/app/admin/users` now shows billing provider/status/expiry and premium key coverage. |
| Situation creation | Functional | Server route validates name, classifies domain, stores source/category choices, and triggers episode extraction. |
| RAG/storage | Functional but not complete | Uploaded document text/chunks live in Firestore. Buckets exist, but upload route does not yet store original binaries in Cloud Storage. |

## Payment And Entitlements

Current active path:

- `/api/polar/checkout` creates hosted Polar checkout for configured products.
- `/api/polar/webhook` handles subscription lifecycle and `order.paid`.
- `/api/polar/portal` creates a customer portal session.
- `users/{uid}.subscription` remains the server-side entitlement source.
- `src/lib/api/tier.ts` resolves free / analyst / team / enterprise and
  downgrades expired promo access.

Owner actions still required:

1. Generate a fresh Polar production organization access token.
2. Create Polar products:
   - `PRAXIS Analyst`, $99/month, 14-day trial, metadata `tier=analyst`.
   - `PRAXIS Team`, team price, 14-day trial, metadata `tier=team`.
   - Optional `PRAXIS Enterprise`, metadata `tier=enterprise`.
3. Store secrets: `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`,
   `POLAR_PRODUCT_ANALYST`, `POLAR_PRODUCT_TEAM`, optional
   `POLAR_PRODUCT_ENTERPRISE`.
4. Add webhook `https://praxis.tacitus.me/api/polar/webhook`.
5. Run a live checkout smoke and verify Firestore updates:
   `subscriptionProvider=polar`, `subscriptionStatus=active|trialing`,
   `polarCustomerId`, `polarSubscriptionId`, and `subscriptionExpiresAt`.

## Safe Management Model

Use Firestore as the only entitlement read path. Do not call Polar on every
request. Paid capability checks should use:

- `resolveTier(uid, isDemo)` for server gates.
- `gateTier(currentTier, minTier)` inside AI tools.
- Provider key status from `/api/settings/api-keys` for Firecrawl, Parallel,
  Tavily, Anthropic, and Google AI.

Admin access:

- `giulio@tacitus.me` works if the Firebase email is verified.
- Default allowlist also includes `giuliocatanzariti@gmail.com`.
- Production env also sets `ADMIN_EMAIL_ALLOWLIST` in `cloudbuild.yaml`.

## Premium Research Providers

Firecrawl use cases:

- Live source search with full-page markdown for current policy questions.
- Scrape JS-rendered policy portals, think-tank pages, PDFs, and source pages.
- Crawl/map monitored source domains for Source Scout and Source Monitor.
- Structured extraction into future `CorpusItem` knowledge-base pipelines.

Parallel use cases:

- Second-source checks for contested claims.
- LLM-ready excerpts for briefings, dossiers, and red-team review.
- Entity enrichment and media/source monitoring.
- Codex/agent MCP search via `parallel-search`.

Limits:

- Free users keep Google/open web fallbacks.
- Firecrawl broad crawl/map/extract and Parallel advanced/deep tasks should be
  paid/trial or support-approved because they are credit/usage based.

## Google / Vertex

Every user should get baseline Google-first functionality:

- Cloud Run production uses `AI_PROVIDER=vertex`,
  `GOOGLE_VERTEX_PROJECT=praxisbytacitus`, and
  `GOOGLE_VERTEX_LOCATION=us-central1`.
- `GOOGLE_AI_API_KEY` remains available as a direct AI Studio fallback.
- `searchWeb()` no longer requires Firecrawl; free users get Wikipedia/GDELT
  fallbacks when premium scraping is absent.

Next Google Cloud upgrades:

- Add explicit Google Search grounding tool contract in `getGroundedModel()`
  once provider support is pinned.
- Store original uploaded files in Cloud Storage bucket
  `praxisbytacitus-praxis-uploads` or Firebase Storage bucket
  `praxisbytacitus.firebasestorage.app`.
- Promote larger corpora from Firestore chunk search to Vertex AI Vector Search
  when p95 retrieval latency or corpus scale justifies it.

## Tool / Agentic Audit

Strongest connected tools today:

- Ask PRAXIS: profile + situation + corpus + extension tools.
- Brief Builder: `runAgent()` over active situation corpus.
- Brainstorming Table: multi-persona output over situation corpus.
- Source Scout and Red-Team Review: corpus-aware and method-specific.
- Risk indicators, timeline events, briefing blocks: increasingly situation
  and corpus aware.

Required next pass:

1. Finish the tool output audit in `docs/TOOL_QUALITY_AUDIT_2026-04-28.md`.
2. Normalize all durable tool outputs to one contract (`tools/{toolId}` vs
   `tool-data/{toolId}` is still split).
3. Ensure every flagship route uses `withCalibration()` or `runAgent()` so
   AnalystProfile, situation, domain, corpus, and provenance are injected.
4. Add evals for empty outputs, citation discipline, and situation-specificity.

## Situation And RAG

Situation creation:

- Writes to `users/{uid}/situations/{situationId}`.
- Stores name, type, description, region, actors, source URLs, context notes,
  domain, source category preferences, and custom sources.
- Triggers `extract-episodes` fire-and-forget.

Document/RAG:

- Upload route accepts PDF, DOCX, TXT, MD.
- Extracted text and chunks are stored under
  `users/{uid}/situations/{sid}/documents/{docId}/chunks`.
- Embeddings are generated with Google AI key when available.
- Retrieval combines vector similarity and keyword scoring.

Gap:

- Original binaries are not persisted to Cloud Storage yet. This is the next
  reliability improvement for audits, re-extraction, Document AI fallback, and
  future knowledge-base publishing.

## References

- Polar Next.js adapter: https://polar.sh/docs/integrate/sdk/adapters/nextjs
- Firecrawl v2 API: https://docs.firecrawl.dev/api-reference/v2-introduction
- Firecrawl Search: https://docs.firecrawl.dev/api-reference/v2-endpoint/search
- Parallel Search quickstart: https://docs.parallel.ai/search/search-quickstart
- Parallel Search MCP: https://docs.parallel.ai/integrations/mcp/search-mcp
- Vertex AI Agent Engine: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview
- Vertex AI Vector Search: https://docs.cloud.google.com/vertex-ai/docs/vector-search/overview
- Firestore vector search: https://firebase.google.com/docs/firestore/vector-search
