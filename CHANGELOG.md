# Changelog

All notable changes to PRAXIS by TACITUS are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [3.10.0] — 2026-03-30

### Added

- **Deep Research Agent** — New flagship intelligence tool powered by Google ADK Multi-Agent System deployed on Vertex AI Agent Engine (project: `praxisbytacitus`). Accessible at `/app/deep-search-agent` and `/demo/deep-search-agent`. The agent runs a three-phase pipeline: Planning (decomposes the query into research tasks), Research (parallel agents query the web and cross-reference sources), Synthesis (a dedicated report-composer agent writes a structured intelligence brief). Live event feed shows each sub-agent's activity during research. Sessions are preserved for multi-turn follow-up queries. Requires `VERTEX_AGENT_ENGINE_ID` env var.
- **`src/lib/ai/vertex-agent.ts`** — Complete Vertex AI Agent Engine client library. Handles: service account auth via `FIREBASE_SERVICE_ACCOUNT_KEY` (reusing existing credentials), session creation (`POST .../reasoningEngines/{id}/sessions`), streaming turn execution (`POST .../sessions/{id}/turns:run`), single-shot query (`POST .../reasoningEngines/{id}:streamQuery`), and SSE event parsing across 5 different ADK response formats. Phase inference from ADK agent author names (planner/researcher/composer → planning/research/synthesis).
- **`POST /api/ai/deep-search-agent`** — Streaming API route for the ADK agent. Enriches the user query with full situation context (name, region, actors, risk level). Creates/reuses sessions. Re-streams ADK SSE with PRAXIS-structured events (`session`, `status`, `text`, `done`, `error`). 10 credits per use. `maxDuration = 120s`. Returns 503 if `VERTEX_AGENT_ENGINE_ID` not set.
- **`POST /api/admin/set-all-credits`** — Batch credit reset endpoint. Sets ALL existing users to 5000 credits. Protected by `Authorization: Bearer <CRON_SECRET>`. Firestore batch writes (chunks of 400). Logs to `credit_transactions` as `admin_bulk_reset`. Run once to bootstrap all existing accounts.
- **Deep Research Agent added to sidebar** — Under Intelligence section, top position, with `TACITUS ADK` badge. Uses `Telescope` icon.
- **Demo deep-search-agent page** — Full Nordalia Crisis demo with a pre-built 47-source research report on escalation dynamics. Shows all three phases with agent activity feed.

### Changed

- **New users start with 5,000 credits** (was 100) — `deductCreditsAdmin()` initial profile creation now sets `credits: 5000`. This prevents accounts from being exhausted immediately during normal testing and usage.
- **Debug Panel top-up now adds 1,000 credits** (was 500) — More useful buffer for testing complex workflows.
- **Added `ai_deep_search_agent: 10` to credit cost table** — ADK Deep Research is the highest-cost operation in PRAXIS (multi-agent, long-running, web research).

---

## [3.9.8] — 2026-03-30

### Fixed

- **402 errors on all AI routes — credits exhausted** — Added self-service credit top-up endpoint at `POST /api/admin/add-credits`. Adds 500 credits to the authenticated user's account via atomic Firestore transaction. Wired into Debug Panel with live credit counter and "+500 credits" button.
- **504 on actor-profiles** — Raised `maxDuration` from 60 to 120 seconds. Gemini Pro + complex 8-field nested actor schema routinely exceeded the 60s Vercel function limit.
- **500 on dossier-generate** — `searchWeb()` (Wikipedia + GDELT free API fallback) could hang or fail without timeout protection, crashing the route. Wrapped in 8s `Promise.race` timeout; web search failure is now non-blocking.
- **Missing credit type keys** — 8 routes used credit type strings not present in `AI_CREDIT_COSTS` table (defaulted silently to 1 credit each): `ai_actor_profiles`, `ai_commitment_scan`, `ai_info_environment`, `ai_mediation_design`, `ai_power_map`, `ai_media_roundup`, `media-roundup`, `research`. Now all have explicit costs.

---

## [3.9.7] — 2026-03-30

### Fixed

- **CSP: Google Analytics unblocked** — Added `www.google-analytics.com` and `*.google-analytics.com` to `connect-src`. GTM was loading but GA4 `collect` endpoint was blocked, silently dropping all analytics events.
- **Tool generation no longer hangs indefinitely** — `AiPopulate` now uses `AbortController` with a 90-second hard timeout on every `fetch` call. Previously the spinner could run forever if Gemini Pro was slow or a network issue occurred. Now gives a clear timeout error message after 90s and offers Retry.

### Added

- **Debug Panel** (`Ctrl+Shift+D`) — Floating debug console in the bottom-left corner of all `/app/*` pages. Shows: real-time API call log (request → success/error), elapsed time per call, HTTP status codes, error messages, and service health status (Firebase/GoogleAI/Anthropic/Firecrawl/Parallel). Red badge appears on the button when errors exist. Clears on demand. Designed for both development and production diagnostics.
- **AiPopulate elapsed timer** — Generating state now shows a live elapsed-time counter ("12s elapsed · up to 60s for complex situations") and step-by-step progress labels that update as generation proceeds.
- **AiPopulate cancel button** — Users can now cancel a generation in-flight. Aborts the fetch immediately and shows a retry option.

---

## [3.9.6] — 2026-03-30

### Changed

- **`buildToolContext()` massively expanded** — All 34 AI API routes receive a rich, structured situation context block (was 5 lines, now 25 lines). New context includes: risk level label (HIGH/MODERATE/LOW), Glasl escalation stage with name (e.g., "Stage 4/9 — Images/Coalitions"), analyst role framing, full knowledge base inventory (actors profiled, graph entities, documents), 14-entity ACO Conflict Grammar reminder (Core 8 + Extended 6), and analytical standards (Glasl + INFORM + named-actor grounding). This single change propagates to every tool: risk assessment, escalation scan, actor profiles, power map, negotiation, mediation, dossier, briefing, report, and all others.

### Fixed

- **`situation-initializer.ts`: `generateObject` removed in AI SDK v6** — Tool seeding after auto-structure was calling the removed `generateObject` API, causing silent failures on all new situation initializations. Rewrote to use `generateText` + `Output.object({ schema })` as required by AI SDK v6.

---

## [3.9.5] — 2026-03-30

### Fixed

- **CSP: Google Tag Manager unblocked** — Added `www.googletagmanager.com` to `script-src` in middleware. GTM analytics script was being blocked.
- **Daily Brief generation no longer hangs** — Root cause 1: `getSituationIntelligence()` called 7 external data feeds without a timeout; any slow feed blocked the entire response indefinitely. Fixed with 8-second `Promise.race` timeout per feed. Root cause 2: credit type was `ai_auto_briefing` (not in cost table, silent fallback to 1) — corrected to `ai_morning_digest`. Root cause 3: `maxDuration` was 45s — raised to 60s for deep research mode.

### Added

- **Daily Brief deep research mode** — New "Deep Research" button runs Firecrawl web search (up to 5 live sources) + Google-grounded Gemini real-time research before generating the brief. Shows source provenance in `sourcesSummary` field. Falls back gracefully if Firecrawl is not configured.
- **Daily Brief generation UX overhaul** — Replaced AiPopulate with direct generation controls. Two buttons: "Standard Brief" (ACLED/GDELT/ReliefWeb + AI, ~30s) and "Deep Research" (Standard + Firecrawl + Google grounding, ~45s). Step-by-step progress indicator during generation. Separate Refresh and Deep Research buttons on the header after first generation. Brief history cards show "deep" badge for deep-research briefs.

---

## [3.9.4] — 2026-03-30

### Added

- **Documents page fully wired** — Rewrote `/app/documents` to use real Firestore data. Added `GET /api/documents` (list documents per situation) and `POST /api/documents/{id}/extract-stored` (AI entity extraction with ACO Conflict Grammar). No more mock data — all documents load from Firestore on mount.
- **Stakeholder Map auto-generates on first visit** — Added `useEffect` that triggers `/api/ai/power-map` automatically when no stakeholder data exists and persisted cache is empty. Consistent with AiPopulate behavior on all other tools.

### Fixed

- **Analysis tools no longer show hardcoded Nordalia data in real mode** — Risk Monitor, Early Warning, and Actor Profiles previously showed hardcoded Nordalia Crisis placeholder data in the idle state (before generation). Now show a clean empty state with a prompt to generate, preventing confusion when users create their own situations (e.g., Syria, Sudan, etc.).

---

## [3.9.3] — 2026-03-30

### Fixed

- **503 on all AI routes resolved** — Root cause: `deductCredits` in `firestore.ts` used the client-side Firebase SDK (`firebase/firestore`) which has no auth context in server API routes. Firestore security rules (`allow write: if request.auth.uid == uid`) rejected every transaction, caught as error → 503. Rewrote `with-credits.ts` to use Firebase Admin SDK (`firebase-admin/firestore` + `FieldValue.increment`) which bypasses security rules server-side. All AI routes now pass credit checks correctly.
- **Health endpoint fixed** — Was checking `NEXT_PUBLIC_FIREBASE_API_KEY` (always false in prod since not a `NEXT_PUBLIC_` var) instead of `FIREBASE_SERVICE_ACCOUNT_KEY`. Now reports accurate service status.

---

## [3.9.2] — 2026-03-30

### Fixed

- **Google Sign-In working** — Root cause: `proxy.ts` was never executed (Next.js only loads `middleware.ts`). Renamed back to `src/middleware.ts` with `export function middleware`. Middleware manifest now shows active middleware. Route protection for `/app/*` and `/demo/*` is restored. COOP header `same-origin-allow-popups` is now actually applied.
- **Switched Google auth to redirect flow** — Replaced `signInWithPopup` with `signInWithRedirect` + `getRedirectResult` in `auth-context.tsx`. Avoids popup entirely, no COOP dependency. Login page detects returning redirect via `useEffect` on auth state change and auto-redirects to app.
- **Deleted dead `proxy.ts`** — Was misleadingly left as the "active" middleware. Next.js 16 uses `middleware.ts` exactly like previous versions.

---

## [3.9.1] — 2026-03-30

### Fixed

- **Firebase Auth popup working** — Added `Cross-Origin-Opener-Policy: same-origin-allow-popups` header to `proxy.ts`. Added `*.google.com`, `*.gstatic.com`, `identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, `wss://*.firebaseio.com` to CSP allowlists. Google Sign-In popup can now communicate back to the opener window. Re-added `unsafe-eval` to `script-src` as Firebase Auth SDK requires it for popup flow.
- **Graceful AI degradation** — Dashboard daily digest no longer auto-fires when `GOOGLE_AI_API_KEY` isn't configured. Checks `/api/health` first and shows clear message: "Set GOOGLE_AI_API_KEY to enable intelligence briefs."
- **Deleted conflicting `middleware.ts`** — Next.js 16 uses `proxy.ts` (not `middleware.ts`). Build was failing with "Both middleware and proxy detected" error.
- **Expanded proxy matcher** — Added `/login` and `/pricing` to proxy routes so security headers apply to public pages too.

### Added

- **Tool status indicators in sidebar** — Green dots next to tools that have generated data, grey dots for tools awaiting generation. Reads from `dashboard-snapshot` persisted tool data. Updates when situation changes.
- **Tool status mapping** — `HREF_TO_TOOL_ID` maps 21 sidebar routes to their tool data IDs for status lookup.

---

## [3.9.0] — 2026-03-29

### Added

- **Sidebar reorganized into 6 professional categories** — Context (dashboard, docs, sources, timeline, humanitarian, calendar), Analysis (risk, early warning, actors, graph, stakeholders, compare), Drafting (assistant, reports, dossier, talking points, briefing, daily brief, UN toolkit), Simulation (scenarios, negotiation, CONCORDIA, mediation), Intelligence (ARGUS, media compass, media roundup, info environment, sanctions, commitments, treaty, alerts), Workspace (cases, team).
- **Interactive Timeline page** (`/app/timeline`) — Chronological conflict event visualization with significance-based color coding (critical/high/medium/low), expandable event cards with actor tags and source links, filter by significance level, event count stats.
- **Humanitarian Dashboard** (`/app/humanitarian`) — Live humanitarian data aggregated from HDX HAPI, ReliefWeb, UNHCR, WFP, OCHA FTS. Shows: displacement (IDPs + refugees), IPC food security classification with phase bars, humanitarian funding progress, latest ReliefWeb reports. Auto-refreshable.
- **iCal calendar integration** — `ical-parser.ts` utility for parsing .ics feeds into calendar events. Server-side `POST /api/calendar/import` route fetches and parses iCal URLs. Supports institutional calendar feeds (UN, OSCE). Handles VEVENT parsing, line unfolding, date/time extraction.
- **Demo routes** for timeline and humanitarian pages.

### Changed

- Removed all `badge: 'NEW'` markers from sidebar (tools are now established)
- Sidebar version bumped to v3.9
- Added `Clock`, `Heart`, `Globe` icons to sidebar imports

---

## [3.8.0] — 2026-03-29

### Added

- **Email system (Resend)** — Complete transactional email service with 4 templates: welcome on signup (100 credits notification), credit warning (low balance alert), alert digest (intelligence alerts table), weekly summary (situation status overview). API route at `/api/email/welcome` auto-triggered on new user creation. Requires `RESEND_API_KEY` env var.
- **Vector embeddings for document RAG** — Gemini `text-embedding-004` generates 768-dimension embeddings on document upload. Stored inline on Firestore chunk documents. Retrieval uses hybrid scoring: cosine similarity (70% weight) + keyword overlap (30%). Falls back gracefully to keyword-only if embeddings unavailable.
- **Sentry error monitoring** — `@sentry/nextjs` configured for client, server, and edge. Error boundaries report to Sentry with component stack traces. Requires `NEXT_PUBLIC_SENTRY_DSN` env var. Disabled in development.
- **Landing page: Live Platform Preview** — New interactive section showing all 42 tools organized in 3 categories (Situation Room, Analysis & Drafting, Intelligence Tools) with animated tab switching. Stats bar: 42 tools, 21 AI chat tools, 59 API routes, 6 live data feeds.
- **Integration tests** — New `auth-security.test.ts` with 46 tests covering: auth security contracts, credit cost validation, subscription tier alignment, pricing tier structure, email service exports.

### Changed

- Welcome email sent automatically on first signup (fire-and-forget from auth-context)
- `.env.local.example` updated with `RESEND_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN` documentation

---

## [3.7.1] — 2026-03-29

### Added

- **Intelligence Readiness dashboard** — Renamed "Situation Health" to "Intelligence Readiness" with overall status counter ("3/5 core tools ready"), color-coded semaphore dot (green/amber/grey), and spinning indicator while tools are still seeding.
- **Auto-polling for tool seeding** — Dashboard polls every 8 seconds for up to 3 minutes after situation creation. As each tool finishes seeding (actor-profiles, risk-monitor, early-warning, conflict-graph, stakeholder-map), its semaphore flips from "Generate" to green checkmark in real-time.
- **Building state with progress skeleton** — When auto-structure is running, shows animated skeleton for each core tool with spinning indicators. User sees tools "light up" progressively.
- **Extended tools section** — Added 5 more tools to the readiness grid: Dossier, Negotiation Prep, Media Roundup, Sanctions Tracker, Briefing Room. Separated into "Core" (auto-seeded) and "Analysis & Intelligence" (user-triggered) sections.
- **Tool semaphore component** — Reusable `ToolSemaphore` with click-to-navigate, hover states, and visual status indicators.

### Audited

- Full tool page data flow audit: all 42 pages verified for AiPopulate/usePersistedToolData pattern, API route wiring, buildToolContext usage, first-visit behavior.
- Complete page → toolId → API route → data source → storage map created.
- All 34 AI routes confirmed using withAuth + checkAndDeductCredits + buildToolContext.
- Situation creation → auto-structure → tool seeding → dashboard display pipeline verified end-to-end.

---

## [3.7.0] — 2026-03-29

### Added

- **Real-time credit sync** — Firestore `onSnapshot` listener on user profile. Credits update instantly in the UI after Stripe payments, AI tool usage, or admin adjustments. No page refresh needed.
- **Pricing → checkout flow** — Clicking "Start Analyst Plan" on pricing page passes `?plan=analyst` through login, which redirects to `/app/settings?upgrade=analyst`, auto-triggering Stripe checkout. Full end-to-end payment flow now works.
- **Payment success/cancelled banners** — Settings page shows styled banners when arriving from Stripe (`?payment=success` or `?payment=cancelled`). Includes dismiss buttons.
- **CSP hardened** — Removed `unsafe-eval` from Content-Security-Policy (XSS protection). Added Stripe, HDX HAPI, World Bank API to `connect-src` and `frame-src` allowlists.

### Fixed

- **Unified subscription tiers** — `SubscriptionTier` type aligned to `free|analyst|team|enterprise` matching pricing page and Stripe metadata.
- **Stripe webhook hardened** — Added idempotency, audit trail logging, proper error responses for Stripe retries.
- **Stripe env var documentation** — Added all `STRIPE_PRICE_*` vars to `.env.local.example`.

### Removed

- **Dead code: `src/lib/subscription/tiers.ts`** — Conflicting pricing definitions with zero imports. Deleted.

---

## [3.6.2] — 2026-03-29

### Added

- **Token refresh loop** — Firebase ID tokens expire after 1 hour. Added `onIdTokenChanged()` listener in `auth-context.tsx` that detects token changes and proactively refreshes 5 minutes before expiry. Session cookie is automatically updated with fresh tokens. Users no longer hit 401s on long sessions.
- **Error boundaries** — Added Next.js `error.tsx` at root, `/app`, and `/demo` levels. Wired existing `ErrorBoundary` component into `AppShell` main content area. Any tool page crash now shows a styled fallback with "Try Again" and "Report Issue" buttons instead of a white screen.

---

## [3.6.1] — 2026-03-28

### Security — Auth Hardening

- **CRITICAL: Removed unsafe JWT fallback in `admin.ts`** — Previously decoded JWT payloads without cryptographic verification when Admin SDK verification failed. Attacker could craft fake JWTs to impersonate any user. Now strictly requires verified tokens via Firebase Admin SDK.
- **CRITICAL: Removed silent credit bypass on Firestore failure** — `with-credits.ts` returned `allowed: true` when Firestore was unavailable, allowing unlimited AI usage. Now returns 503 and blocks the request.
- **CRITICAL: Fixed credit deduction race condition** — `firestore.ts` used check-then-deduct pattern vulnerable to concurrent requests double-spending credits. Now uses `runTransaction()` for atomic check + deduct.
- **HIGH: Removed unsafe JWT decode in `with-credits.ts`** — `getSessionUid()` decoded JWT without verification to extract UID. Now uses `verifyIdToken()` from Admin SDK.
- **HIGH: Added server-side token validation to session route** — `POST /api/auth/session` stored tokens without verification. Now verifies token via Firebase Admin SDK before setting cookie.
- **HIGH: Added CSRF/origin validation to session route** — Validates `origin` header matches `host` to prevent cross-site session manipulation.
- **HIGH: Fixed rate limiter memory leak** — `rateLimitMap` in `with-auth.ts` grew unbounded. Added periodic garbage collection (every 5 minutes) to remove expired entries.
- **HIGH: Hardened Firestore security rules** — Users could previously modify `credits`, `totalCreditsUsed`, `subscription` fields directly via client SDK. Rules now block writes to protected fields; only Admin SDK (server-side) can modify credits.
- **MEDIUM: Moved Firebase client config to environment variables** — API key, project ID, and other client config moved from hardcoded values to `NEXT_PUBLIC_FIREBASE_*` env vars with backwards-compatible defaults.

### Changed

- Updated `.env.local.example` with Firebase client SDK env var documentation

---

## [3.6.0] — 2026-03-28

### Security

- **Wrapped 6 unprotected AI routes with `withAuth()`** — `claude-analyze`, `deep-research`, `grounded-search`, `media-analyze`, `research`, `terminology` were previously exposed without authentication verification or rate limiting. All now require valid Firebase session + enforce 100 req/min rate limit.
- **Added credit deduction to `auto-structure`** — This resource-intensive pipeline (web scraping, feed polling, multi-tool initialization) was missing `checkAndDeductCredits()`. Now deducts 5 credits (ai_research tier).

### Audited

- Full API route audit: all 59 routes verified for auth, credits, situation context, error handling
- All 35+ app pages verified for `useSituationGuard()` — 3 intentional exceptions (settings, situations list, new situation)
- All 21 chat tools verified as wired to assistant via `tacitusTools` in chat route
- Zero TODO/FIXME/HACK comments found in API layer
- Zero demo data leaks into production paths confirmed
- All environment variable usage verified — no hardcoded secrets

### Documentation

- Added `CHANGELOG.md` (this file)
- Added `TOOL_AUDIT.md` — complete tool-by-tool wiring status with API routes, pages, and recommendations
- Updated `CLAUDE.md` — reflects v3.6 state, corrected tool count, added audit findings
- Updated `README.md` — professional format with full architecture, all 59 API routes, improvement roadmap

---

## [3.5.0] — 2026-03-26

### Added

- Sources Library page (`/app/sources`) — browse ACLED, GDELT, ReliefWeb, HDX, World Bank, Wikipedia feeds
- Unified web crawler infrastructure via Firecrawl (`scrapeMultiple`, `crawlUrl`)
- 29 tool pages across Situation Room, Analysis & Drafting, Intelligence Tools, Workspace
- Persisted tool data with 24h TTL via `usePersistedToolData` hook
- Source mode picker: all / web+docs / docs-only / llm-only
- Auto-structure pipeline — auto-populates new situations with research, actors, risk scores

### Changed

- AI model tiers: Flash for chat, Pro for structured tools, Claude for deep analysis, Grounded for research
- Tool pages use `AiPopulate` pattern for automatic data generation on first visit

---

## [3.4.0] — 2026-03-20

### Added

- Advisory Council chatbot (`/app/advisory`) — multi-actor perspective analysis
- Auto-briefings system with Vercel cron jobs (05:00 UTC daily)
- Alert center with GDELT-based early warning (06:00 UTC daily)
- Compare tool for side-by-side conflict analysis
- Briefing room with speaker notes

---

## [3.3.0] — 2026-03-15

### Added

- AiPopulate pattern — auto-generates structured data on first tool visit
- 25+ AI tools with Zod schemas and structured output
- Conflict Grammar v2.0 — 14-entity ontology (8 core + 6 extended)
- INFORM Risk Index 5-dimension scoring
- Glasl 9-stage escalation tracking
- Fisher/Ury ZOPA/BATNA negotiation analysis
- Mitchell/Agle/Wood stakeholder power mapping
- CRAAP test media reliability scoring
- NATO STRATCOM info environment assessment
- UN DPPA morning brief standard
- Berghof mediation process design

---

## [3.2.0] — 2026-03-10

### Added

- Document upload & RAG pipeline (PDF, DOCX, TXT, MD)
- Knowledge graph visualization with D3.js force layout
- Report export to DOCX and PDF
- Treaty analyzer with ambiguity flagging
- Sanctions tracker with escalation scanning
- Commitment compliance monitoring

---

## [3.1.0] — 2026-03-05

### Added

- Floating "Ask PRAXIS" chat panel on all pages
- Mobile responsive layout — sidebar becomes drawer overlay
- Keyboard shortcuts: `/` opens chat, `Esc` closes
- PRAXIS super-agent mode in chat — platform-aware, can guide users to tools

---

## [3.0.0] — 2026-03-01

### Added

- Dual-app architecture: `/app/*` (authenticated) + `/demo/*` (cookie-only)
- Pre-loaded Nordalia Crisis demo with cached AI responses
- Firebase Auth (Google + email/password)
- Firestore-backed situation-driven data model
- TACITUS credit system (100 on sign-up, per-use deduction)
- Vercel deployment with iad1 region
- 35+ tool pages
- Stripe payment routes (checkout + webhook)

---

## [2.x] — Pre-release

Internal prototypes. Not publicly available.
