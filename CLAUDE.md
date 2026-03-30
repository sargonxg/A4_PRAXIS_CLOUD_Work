# PRAXIS — Conflict Intelligence Platform by TACITUS

> Version 3.9.8 — 402/504/500 fixes: credit top-up endpoint, actor-profiles maxDuration 120, dossier searchWeb timeout

## What This Is
The "Bloomberg Terminal for conflict resolution." AI-native workspace for UN Political Affairs Officers, think tank analysts, diplomatic mediators. Two separate experiences in one codebase: a demo for prospects and a real situation-driven workspace for authenticated users. Deployed at praxis.tacitus.me (Vercel, iad1).

## v3.7.0 Full UX Wiring (2026-03-29)
- Real-time credit sync via Firestore `onSnapshot` listener — credits update instantly after payments/AI usage
- Pricing → login → checkout flow: `?plan=analyst` propagates through login to auto-trigger Stripe checkout
- Settings page: payment success/cancelled banners, auto-checkout redirect on `?upgrade=` param
- CSP hardened: removed `unsafe-eval`, added Stripe/HDX/WorldBank to connect-src/frame-src
- Deleted dead `subscription/tiers.ts` (zero imports, conflicting pricing definitions)
- Verified: dashboard + cases pages already properly wired (real mode reads Firestore, demo uses hardcoded)

## v3.6.2 Token Refresh & Error Boundaries (2026-03-29)
- Token refresh loop: `onIdTokenChanged()` + proactive refresh at 50 minutes (tokens expire at 60)
- Session cookie auto-updated with fresh tokens — no more 401s on long sessions
- Error boundaries: Next.js `error.tsx` at root, `/app`, `/demo` + `ErrorBoundary` in AppShell
- Tool page crashes show styled fallback with retry button instead of white screen

## v3.6.1 Auth Hardening (2026-03-28)
- Removed unsafe JWT fallback decode (admin.ts) — tokens now always verified cryptographically
- Fixed credit deduction race condition — uses `runTransaction()` for atomic check + deduct
- Removed silent credit bypass on Firestore failure — returns 503 instead of allowing free usage
- Token verified server-side before storing in session cookie
- CSRF/origin validation on session POST
- Rate limiter garbage collection to prevent memory leaks
- Firestore rules hardened: client SDK cannot modify credits/subscription fields
- Firebase client config moved to NEXT_PUBLIC_ env vars

## v3.6.0 Route Audit (2026-03-28)
- 7 route fixes: 6 API routes wrapped with `withAuth()`, 1 route added credit deduction
- All 59 API routes verified: auth, credits, situation context, error handling
- All 21 chat tools confirmed wired via `tacitusTools` in chat route
- All 42 app pages verified for `useSituationGuard()`
- See [TOOL_AUDIT.md](./TOOL_AUDIT.md) for complete route-by-route status
- See [CHANGELOG.md](./CHANGELOG.md) for version history

## Tech Stack
Next.js 16.1.6 (App Router), TypeScript 5.9, Tailwind CSS 4, Radix UI, Vercel AI SDK (ai@6.0.105 + @ai-sdk/google + @ai-sdk/anthropic), Firebase Auth + Firestore + Admin SDK, Firecrawl (web intelligence), Zustand 5, D3.js 7, Framer Motion 12, Zod 4.

## Architecture (Dual-App)

### Route Structure
- `src/app/(landing)/` — Public landing page
- `src/app/(auth)/` — Login (Google + email/password + Demo Mode)
- `src/app/app/` — Real PRAXIS workspace (Firebase auth required, situation-driven, 35+ pages at /app/*)
- `src/app/demo/` — Demo workspace (cookie auth, pre-loaded Nordalia data, 30 pages at /demo/*)
- `src/app/api/` — API routes (auth-protected via withAuth + Admin SDK)

### Key Directories
- `src/lib/firebase/` — config.ts (client SDK), admin.ts (Admin SDK + verifyIdToken), firestore.ts (profiles/credits), situations-service.ts, graph-service.ts, reports-service.ts, scenarios-service.ts, chat-service.ts
- `src/lib/ai/` — providers.ts, tools.ts (18 tools), firecrawl.ts, prompts/, schemas/
- `src/lib/api/` — with-auth.ts (Admin SDK token verification + rate limiting), with-credits.ts
- `src/lib/utils/` — routes.ts (useRoutePrefix, usePraxisRoute), cn.ts, format.ts
- `src/stores/` — app-store.ts, situation-store.ts (Zustand + persist), conflict-store.ts, report-store.ts
- `src/hooks/` — use-situation-guard.ts, use-praxis-api.ts, use-keyboard-shortcuts.ts
- `src/components/shared/` — praxis-link.tsx (auto-prefixes /app or /demo)
- `src/components/praxis/` — no-situation-state.tsx, no-data-state.tsx, error-states.tsx, loading-states.tsx

### Navigation
All internal links use `PraxisLink` or `usePraxisRoute()` which auto-prefix with `/app` or `/demo` based on current context. Old bare paths (e.g., `/dashboard`) redirect to `/app/dashboard` via next.config.ts.

## Authentication
- **Real app** (`/app/*`): Firebase Auth (Google sign-in + email/password). Middleware checks JWT in session cookie. API routes verify tokens via Firebase Admin SDK with fallback JWT decode.
- **Demo** (`/demo/*`): Cookie-only (`{demo: true}`). No account needed. Pre-loaded Nordalia Crisis data.
- Auth state: `src/lib/auth/auth-context.tsx` (AuthProvider in root layout)
- Session cookie: `tacitus-auth-session` (httpOnly, secure, sameSite=lax)
- Rate limiting: 100 req/min per user on API routes

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
- 100 credits on sign-up (Firestore `users` collection)
- Credit costs: chat=1, terminology=1, extract=3, scenario=3, research=5, report=5, dossier=4, briefing=3, risk=3, media=2, sanctions=2, negotiation=3, mediation=3, commitments=2, info_environment=3, actor_profiles=3, auto_briefing=2, power_map=3
- Demo users: unlimited (shown as infinity)
- Deducted via `with-credits.ts` in each AI route

## Firestore Security Rules (deployed)
- `users/{uid}`: read/write only if auth.uid == uid
- `users/{uid}/situations/{sitId}/**`: read/write only if auth.uid == uid
- `credit_transactions`: read own only, write denied (server-only via Admin SDK)

## Conflict Grammar (ACO v2.0)
8 primitives: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative. Zod schemas in `src/lib/ai/schemas/conflict-grammar.ts`.

## AI Tools (21 chat tools in tools.ts + 34 API routes)
Glasl escalation model, Fisher/Ury negotiation (ZOPA/BATNA), OCHA humanitarian standards, UN Editorial Manual, historical parallel analysis, narrative ecosystem mapping, UNSC resolution drafting, INFORM Risk Index, Mitchell/Agle/Wood stakeholder analysis, CRAAP test media analysis, NATO STRATCOM info-environment, UN DPPA morning brief, Berghof process design, commitment compliance monitoring.

## Cron Jobs (vercel.json)
- `/api/cron/check-alerts` — 06:00 UTC daily, GDELT-based alert generation
- `/api/cron/generate-briefing` — 05:00 UTC daily, auto-generates daily intelligence briefs for all active situations

## Demo vs Live Mode
- **Demo** (`/demo/*`): Pre-loaded Nordalia Crisis, cached AI responses, no API keys needed, unlimited credits
- **Real** (`/app/*`): User creates situations, live AI (Gemini/Claude), Firecrawl web research, credits deducted, data persisted in Firestore

## Floating Ask PRAXIS (v3.1)
- `src/components/app/floating-praxis.tsx` — Slide-over chat panel, dark navy theme
- Available on all /app/* and /demo/* pages except /assistant
- Header "Ask PRAXIS" button + `/` keyboard shortcut opens it, `Esc` closes
- Messages persist to localStorage (last 50 messages, keyed `praxis-floating-chat`)
- Streaming markdown rendering with custom dark CSS (`.floating-praxis-md` in globals.css)
- Connected via `window.dispatchEvent(new CustomEvent('open-praxis-chat'))`

## Mobile Responsive (v3.1)
- AppShell detects mobile via `matchMedia('(max-width: 768px)')`
- Sidebar becomes a fixed drawer overlay on mobile with backdrop
- Hamburger menu button in header (visible only on mobile)
- Sidebar auto-closes on route navigation
- Content padding reduced on mobile (`px-4 py-4` vs `px-6 py-6`)

## AiPopulate Pattern (v3.3)
- `src/components/praxis/ai-populate.tsx` — Auto-generates data on first tool visit
- All structured tools: `generateText + Output.object()` with Zod schemas via `getProModel()` (gemini-2.5-pro)
- Scenarios: streaming text via `streamText`, rendered directly (no AiPopulate)
- Data persisted to Firestore via `usePersistedToolData` hook (24h TTL, auto-restore)
- Source mode picker: all / web+docs / docs-only / llm-only
- **CRITICAL**: Real mode (`/app/*`) NEVER shows hardcoded demo data — all content is AI-generated from the user's active situation context via `buildToolContext(situation)`
- Demo mode (`/demo/*`) uses hardcoded Nordalia crisis constants scoped to demo components only

## Tool Pages (v3.3)
### Situation Room
- Dashboard, Early Warning, Risk Monitor, Conflict Graph, Stakeholder Map, Actor Profiles

### Analysis & Drafting
- PRAXIS Assistant, Report Studio, Dossier Generator, Talking Points, Scenario Planner, Negotiation Prep, CONCORDIA Mediation, Mediation Designer, Briefing Room, Daily Brief

### Intelligence Tools
- ARGUS Intelligence, Media Compass, Media Roundup, Info Environment, Commitment Tracker, Treaty Analyzer, Sanctions Tracker, Calendar Monitor, Alert Center, UN Toolkit

### Workspace
- Documents, Case Library, Team Hub

## AI Model Tiers
- `getModel()` → gemini-2.5-flash — Chat, terminology, lightweight tasks
- `getProModel()` → gemini-2.5-pro — All structured tool generation (risk, power-map, commitments, negotiation, mediation, scenarios, sanctions, escalation, actor profiles, briefings, info-environment, media-scan)
- `getAnalysisModel()` → claude-sonnet-4 (falls back to pro if no ANTHROPIC_API_KEY) — Deep analysis, bias detection
- `getGroundedModel()` → gemini-2.5-flash + Google Search grounding — Research tasks

## Conventions
- `PraxisLink` for all internal navigation (auto-prefixes /app or /demo)
- `useSituationGuard()` at top of every tool page
- `usePraxisRoute()` for programmatic navigation (router.push)
- API routes use `withAuth()` wrapper (Admin SDK verification + rate limiting)
- AI routes use `checkAndDeductCredits()` before AI calls (rejects unauthenticated)
- Colors: Navy #0F172A, Emerald #10B981, Gold #E8B931, Diplomatic Blue #1B3A5C
- Fonts: EB Garamond headings, Inter body, JetBrains Mono code
- OG image: Dynamic via `src/app/opengraph-image.tsx` (no static file needed)

## Env Vars
- `GOOGLE_AI_API_KEY` — Required for live AI (demo works without)
- `ANTHROPIC_API_KEY` — Optional, Claude deep analysis
- `AI_PROVIDER` — 'google' (default) or 'vertex'
- `FIREBASE_SERVICE_ACCOUNT_KEY` — Required for server-side Firestore operations (situation CRUD, token verification). JSON string from Firebase Console > Service Accounts.
- `FIRECRAWL_API_KEY` — Optional, web research
