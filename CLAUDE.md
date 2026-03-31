# PRAXIS — Conflict Intelligence Platform by TACITUS

> Version 3.10.0 — Deep Research Agent (Vertex AI ADK), Credits 5000, full tool audit

## What This Is
The "Bloomberg Terminal for conflict resolution." AI-native workspace for UN Political Affairs Officers, think tank analysts, diplomatic mediators. Two separate experiences in one codebase: a demo for prospects and a real situation-driven workspace for authenticated users. Deployed at praxis.tacitus.me (Vercel, iad1).

## v3.10.0 Deep Research Agent + Credits Overhaul (2026-03-30)
- **Deep Research Agent** — New tool at `/app/deep-search-agent` powered by Google ADK Multi-Agent System on Vertex AI Agent Engine (project: `praxisbytacitus`). Three-phase pipeline: Planning → Research (parallel web agents) → Synthesis (report composer). Live agent activity feed. Session persistence for multi-turn queries. Requires `VERTEX_AGENT_ENGINE_ID`.
- **`src/lib/ai/vertex-agent.ts`** — Full Vertex AI Agent Engine client: auth via `FIREBASE_SERVICE_ACCOUNT_KEY`, session create/stream, SSE parsing (5 formats), phase inference from ADK agent author names.
- **`POST /api/ai/deep-search-agent`** — Streaming API, 10 credits, 120s max, situation-enriched queries, session reuse.
- **`POST /api/admin/set-all-credits`** — Batch reset all users to 5000 credits (protected by CRON_SECRET).
- **Credits**: New users start at 5000 (was 100). Debug Panel top-up: +1000 (was 500). `ai_deep_search_agent: 10`.
- Sidebar: Deep Research Agent at top of Intelligence section with `TACITUS ADK` badge.

## v3.9.8 402/504/500 fixes (2026-03-30)
- Self-service credit top-up at `/api/admin/add-credits` (+1000 credits, wired to Debug Panel)
- actor-profiles `maxDuration` 60→120s (Gemini Pro + complex schema hit Vercel limit)
- dossier-generate `searchWeb` wrapped in 8s `Promise.race` (non-blocking timeout)
- 8 missing credit keys now explicit: `ai_actor_profiles`, `ai_commitment_scan`, `ai_info_environment`, `ai_mediation_design`, `ai_power_map`, `ai_media_roundup`, `media-roundup`, `research`

## v3.9.7 Debug Panel + AiPopulate fixes (2026-03-30)
- Debug Panel (`Ctrl+Shift+D`) — Floating console: API call log, elapsed times, HTTP status, service health
- AiPopulate: AbortController 90s timeout (no more infinite hangs), live elapsed counter, cancel button
- CSP: Google Analytics `connect-src` unblocked

## v3.9.6 Context Quality (2026-03-30)
- `buildToolContext()` expanded from 5 → 25 lines: risk label, Glasl stage, ACO 14-entity grammar, analytical standards. Propagates to all 34 AI routes.
- `situation-initializer.ts` fixed: `generateObject` → `generateText + Output.object()` (AI SDK v6)

## v3.7.0 Full UX Wiring (2026-03-29)
- Real-time credit sync via Firestore `onSnapshot` listener
- Pricing → login → checkout flow with `?plan=analyst` propagation
- CSP hardened, Stripe/HDX/WorldBank added
- See [CHANGELOG.md](./CHANGELOG.md) for full version history

## Tech Stack
Next.js 16.1.6 (App Router), TypeScript 5.9, Tailwind CSS 4, Radix UI, Vercel AI SDK (ai@6.0.105 + @ai-sdk/google + @ai-sdk/anthropic), Firebase Auth + Firestore + Admin SDK, Firecrawl (web intelligence), Google ADK (Vertex AI Agent Engine), google-auth-library, Zustand 5, D3.js 7, Framer Motion 12, Zod 4.

## Architecture (Dual-App)

### Route Structure
- `src/app/(landing)/` — Public landing page
- `src/app/(auth)/` — Login (Google + email/password + Demo Mode)
- `src/app/app/` — Real PRAXIS workspace (Firebase auth required, situation-driven, 38+ pages at /app/*)
- `src/app/demo/` — Demo workspace (cookie auth, pre-loaded Nordalia data, 38 pages at /demo/*)
- `src/app/api/` — API routes (68 total: 35 AI routes + auth, docs, data, admin, cron)

### Key Directories
- `src/lib/firebase/` — config.ts (client SDK), admin.ts (Admin SDK + verifyIdToken), firestore.ts (profiles/credits), situations-service.ts, graph-service.ts, reports-service.ts, scenarios-service.ts, chat-service.ts
- `src/lib/ai/` — providers.ts, tools.ts (21 tools), firecrawl.ts, vertex-agent.ts (ADK client), prompts/, schemas/
- `src/lib/api/` — with-auth.ts (Admin SDK token verification + rate limiting), with-credits.ts
- `src/lib/utils/` — routes.ts (useRoutePrefix, usePraxisRoute), cn.ts, format.ts
- `src/stores/` — app-store.ts, situation-store.ts (Zustand + persist), conflict-store.ts, report-store.ts, debug-store.ts, notification-store.ts, preferences-store.ts
- `src/hooks/` — use-situation-guard.ts, use-praxis-api.ts, use-keyboard-shortcuts.ts, use-conflict-data.ts, use-persisted-tool-data.ts
- `src/components/shared/` — praxis-link.tsx (auto-prefixes /app or /demo)
- `src/components/praxis/` — no-situation-state.tsx, no-data-state.tsx, error-states.tsx, loading-states.tsx, ai-populate.tsx
- `src/components/app/` — app-shell.tsx, app-sidebar.tsx, debug-panel.tsx, floating-praxis.tsx, header.tsx

### Navigation
All internal links use `PraxisLink` or `usePraxisRoute()` which auto-prefix with `/app` or `/demo` based on current context. Old bare paths (e.g., `/dashboard`) redirect to `/app/dashboard` via next.config.ts.

## Authentication
- **Real app** (`/app/*`): Firebase Auth (Google sign-in redirect + email/password). Middleware checks JWT in session cookie. API routes verify tokens via Firebase Admin SDK.
- **Demo** (`/demo/*`): Cookie-only (`{demo: true}`). No account needed. Pre-loaded Nordalia Crisis data.
- Auth state: `src/lib/auth/auth-context.tsx` (AuthProvider in root layout). Token refresh via `onIdTokenChanged()` + proactive 50-min refresh.
- Session cookie: `tacitus-auth-session` (httpOnly, secure, sameSite=lax)
- Rate limiting: 100 req/min per user on API routes
- IMPORTANT: Uses `middleware.ts` (NOT `proxy.ts` — proxy.ts broke Google Sign-In in v3.9.1, reverted in v3.9.2)

## Situation-Driven Data Model (Real App)
Every piece of data belongs to a situation. Users must create a situation first.

```
Firestore: users/{uid}/situations/{situationId}/
  ├── metadata (name, type, region, actors, status, riskScore)
  ├── conflict-grammar (extracted ACO entities)
  ├── graph/main (nodes + edges)
  ├── documents/{docId}
  ├── reports/{reportId}
  ├── scenarios/{scenarioId}
  ├── chats/{chatId}
  ├── briefings, dossiers, talking-points, risk-assessments...
```

All tool pages use `useSituationGuard()` hook — if no situation selected, shows NoSituationState.

## TACITUS Credits
- **5,000 credits on sign-up** (Firestore `users` collection — new in v3.10.0, was 100)
- Credit costs (authoritative in `src/lib/api/with-credits.ts`):
  - 1 credit: chat, terminology
  - 2 credits: scenario, extract, media, talking_points, grounded_search, advisor_chat, commitment_scan, media_roundup, morning_digest
  - 3 credits: analysis, research, resolution, media_scan, actor_enrichment, escalation_scan, argus, actor_brief, info_environment, mediation, negotiation, mediation_design, power_map, web_crawl
  - 4 credits: claude_analyze, dossier, actor_profiles, briefing_generate, risk_assessment, treaty_analyze, sanctions_scan
  - 5 credits: dossier_generate, report, deep_research
  - 10 credits: deep_search_agent (Vertex AI ADK)
- Demo users: unlimited (shown as ∞)
- Deducted via `with-credits.ts` in each AI route (atomic Firestore transaction)
- Self-service top-up: Debug Panel → "+1000 credits" → `POST /api/admin/add-credits`
- Bulk reset for all users: `POST /api/admin/set-all-credits` (CRON_SECRET required)

## Firestore Security Rules (deployed)
- `users/{uid}`: read/write only if auth.uid == uid
- `users/{uid}/situations/{sitId}/**`: read/write only if auth.uid == uid
- `credit_transactions`: read own only, write denied (server-only via Admin SDK)

## Conflict Grammar (ACO v2.0)
Core 8: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative
Extended 6: Institutions, Norms, Resources, Risks, Policies, Grievances
Zod schemas in `src/lib/ai/schemas/conflict-grammar.ts`.

## AI Tools — Complete List (38 tools + 68 API routes)

### Situation Room
- Dashboard, Early Warning, Risk Monitor, Conflict Graph, Stakeholder Map, Actor Profiles, Timeline, Humanitarian

### Analysis & Drafting
- PRAXIS Assistant, Report Studio, Dossier Generator, Talking Points, Scenario Planner, Negotiation Prep, CONCORDIA Mediation, Mediation Designer, Briefing Room, Daily Brief, UN Toolkit

### Intelligence Tools
- **Deep Research Agent** (NEW — Vertex AI ADK), ARGUS Deep Research, Media Compass, Media Roundup, Info Environment, Commitment Tracker, Treaty Analyzer, Sanctions Tracker, Calendar Monitor, Alert Center, Sources Library

### Workspace
- Documents, Case Library, Team Hub, Settings, Advisory Council

## Cron Jobs (vercel.json)
- `/api/cron/check-alerts` — 06:00 UTC daily, GDELT-based alert generation
- `/api/cron/generate-briefing` — 05:00 UTC daily, auto-generates daily intelligence briefs for all active situations

## Deep Research Agent (Vertex AI ADK) — v3.10.0
- **Required env var**: `VERTEX_AGENT_ENGINE_ID` — Numeric ID of the Reasoning Engine on Vertex AI
- **Optional**: `VERTEX_AGENT_LOCATION` — Region (default: us-central1), `GOOGLE_CLOUD_PROJECT` (default: praxisbytacitus)
- **Auth**: Reuses `FIREBASE_SERVICE_ACCOUNT_KEY` service account (must have "Vertex AI User" IAM role)
- **Client library**: `src/lib/ai/vertex-agent.ts` — `getVertexAgentConfig()`, `createSession()`, `streamAgentTurn()`, `streamAgentQuery()`, `parseAgentEvent()`, `inferPhase()`
- **API route**: `POST /api/ai/deep-search-agent` — enriches query with situation context, creates/reuses session, re-streams ADK SSE, 10 credits, 120s maxDuration
- **Tool page**: `/app/deep-search-agent` — 3-phase UI (Planning/Research/Synthesis), live event feed, streaming report, copy button, 6 suggested queries, session persistence
- **Returns 503** if `VERTEX_AGENT_ENGINE_ID` not configured (graceful degradation)

## Demo vs Live Mode
- **Demo** (`/demo/*`): Pre-loaded Nordalia Crisis, cached AI responses, no API keys needed, unlimited credits
- **Real** (`/app/*`): User creates situations, live AI (Gemini/Claude), Firecrawl web research, credits deducted, data persisted in Firestore

## Floating Ask PRAXIS (v3.1)
- `src/components/app/floating-praxis.tsx` — Slide-over chat panel, dark navy theme
- Available on all /app/* and /demo/* pages except /assistant
- Header "Ask PRAXIS" button + `/` keyboard shortcut opens it, `Esc` closes
- Messages persist to localStorage (last 50 messages, keyed `praxis-floating-chat`)

## Debug Panel (v3.9.7)
- `src/components/app/debug-panel.tsx` — Floating bug icon bottom-left, `Ctrl+Shift+D` to toggle
- Shows: live credit counter, "+1000 credits" self-service top-up, service health dots, API event log (last 50 events)
- Red badge on error count, spinning on in-flight requests
- Available on all `/app/*` pages via `<DebugPanel />` in AppShell
- Connects to Zustand `debug-store.ts` — all AI routes log via `useDebugStore().log()`

## Mobile Responsive (v3.1)
- AppShell detects mobile via `matchMedia('(max-width: 768px)')`
- Sidebar becomes a fixed drawer overlay on mobile with backdrop
- Hamburger menu button in header (visible only on mobile)

## AiPopulate Pattern (v3.3 + improved v3.9.7)
- `src/components/praxis/ai-populate.tsx` — Auto-generates data on first tool visit
- 90-second AbortController timeout with elapsed timer and cancel button
- All structured tools: `generateText + Output.object()` with Zod schemas via `getProModel()` (gemini-2.5-pro)
- Data persisted to Firestore via `usePersistedToolData` hook (24h TTL, auto-restore)
- Source mode picker: all / web+docs / docs-only / llm-only
- **CRITICAL**: Real mode NEVER shows hardcoded demo data — all content is AI-generated from the user's active situation context via `buildToolContext(situation)`

## AI Model Tiers
- `getModel()` → gemini-2.5-flash — Chat, terminology, lightweight tasks
- `getProModel()` → gemini-2.5-pro — All structured tool generation
- `getAnalysisModel()` → claude-sonnet-4 (falls back to pro if no ANTHROPIC_API_KEY)
- `getGroundedModel()` → gemini-2.5-flash + Google Search grounding
- Vertex AI ADK — `streamAgentTurn()` in vertex-agent.ts — Deep Research Agent only

## Conventions
- `PraxisLink` for all internal navigation (auto-prefixes /app or /demo)
- `useSituationGuard()` at top of every tool page
- `usePraxisRoute()` for programmatic navigation (router.push)
- API routes use `withAuth()` wrapper (Admin SDK verification + rate limiting)
- AI routes use `checkAndDeductCredits()` before AI calls (rejects unauthenticated)
- Colors: Navy #0F172A, Emerald #10B981, Gold #E8B931, Diplomatic Blue #1B3A5C
- Fonts: EB Garamond headings, Inter body, JetBrains Mono code
- OG image: Dynamic via `src/app/opengraph-image.tsx`

## Env Vars
- `GOOGLE_AI_API_KEY` — Required for live AI (demo works without)
- `ANTHROPIC_API_KEY` — Optional, Claude deep analysis
- `AI_PROVIDER` — 'google' (default) or 'vertex'
- `FIREBASE_SERVICE_ACCOUNT_KEY` — Required for server-side Firestore + Vertex AI auth. JSON string from Firebase Console > Service Accounts.
- `FIRECRAWL_API_KEY` — Optional, web research
- `VERTEX_AGENT_ENGINE_ID` — Required for Deep Research Agent. Numeric Reasoning Engine ID from Vertex AI Agent Engine.
- `VERTEX_AGENT_LOCATION` — Optional, default: us-central1
- `GOOGLE_CLOUD_PROJECT` — Optional, default: praxisbytacitus
- `CRON_SECRET` — Required for cron job auth + `/api/admin/set-all-credits`
- `RESEND_API_KEY` — Optional, transactional email
- `NEXT_PUBLIC_SENTRY_DSN` — Optional, Sentry error monitoring
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe payments

## Sidebar Tool Sections (v3.10.0)
### Context (6 items)
Dashboard · Documents · Sources Library · Timeline (NEW) · Humanitarian (NEW) · Calendar

### Analysis (6 items)
Risk Monitor · Early Warning · Actor Profiles · Conflict Graph · Stakeholder Map · Compare

### Drafting (7 items)
PRAXIS Assistant · Report Studio · Dossier Generator · Talking Points · Briefing Room · Daily Brief · UN Toolkit

### Simulation (4 items)
Scenario Planner · Negotiation Prep · CONCORDIA (TACITUS badge) · Mediation Designer

### Intelligence (9 items)
**Deep Research Agent (TACITUS ADK)** · ARGUS Deep Research (TACITUS) · Media Compass · Media Roundup · Info Environment · Sanctions Tracker · Commitment Tracker · Treaty Analyzer · Alert Center

### Workspace (2 items)
Case Library · Team Hub

### Special
Advisory Council (gold theme) · Settings

## Tool Status Indicators (sidebar)
- Green dot: Tool has AI-generated data for the active situation
- Grey dot: Tool awaiting first generation
- Reads from `dashboard-snapshot` persisted tool data via `useToolStatuses()` in app-sidebar.tsx
- Applies to 21 mapped tools in `HREF_TO_TOOL_ID`
