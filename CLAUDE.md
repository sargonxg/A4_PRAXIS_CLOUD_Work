# PRAXIS — Conflict Intelligence Platform by TACITUS

> Version 3.1 — Floating PRAXIS Chat, Mobile-Ready, Wired Tool Pages

## What This Is
The "Bloomberg Terminal for conflict resolution." AI-native workspace for UN Political Affairs Officers, think tank analysts, diplomatic mediators. Two separate experiences in one codebase: a demo for prospects and a real situation-driven workspace for authenticated users. Deployed at praxis.tacitus.me (Vercel, iad1).

## Tech Stack
Next.js 16.1.6 (App Router), TypeScript 5.9, Tailwind CSS 4, Radix UI, Vercel AI SDK (ai@6.0.105 + @ai-sdk/google + @ai-sdk/anthropic), Firebase Auth + Firestore + Admin SDK, Firecrawl (web intelligence), Zustand 5, D3.js 7, Framer Motion 12, Zod 4.

## Architecture (Dual-App)

### Route Structure
- `src/app/(landing)/` — Public landing page
- `src/app/(auth)/` — Login (Google + email/password + Demo Mode)
- `src/app/app/` — Real PRAXIS workspace (Firebase auth required, situation-driven, 30 pages at /app/*)
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
- Credit costs: chat=1, terminology=1, extract=3, scenario=3, research=5, report=5, dossier=4, briefing=3, risk=3, media=2, sanctions=2, negotiation=3, mediation=3
- Demo users: unlimited (shown as infinity)
- Deducted via `with-credits.ts` in each AI route

## Firestore Security Rules (deployed)
- `users/{uid}`: read/write only if auth.uid == uid
- `users/{uid}/situations/{sitId}/**`: read/write only if auth.uid == uid
- `credit_transactions`: read own only, write denied (server-only via Admin SDK)

## Conflict Grammar (ACO v2.0)
8 primitives: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative. Zod schemas in `src/lib/ai/schemas/conflict-grammar.ts`.

## AI Tools (18 tools in src/lib/ai/tools.ts)
Glasl escalation model, Fisher/Ury negotiation (ZOPA/BATNA), OCHA humanitarian standards, UN Editorial Manual, historical parallel analysis, narrative ecosystem mapping, UNSC resolution drafting.

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

## AiPopulate Pattern (v3.1)
- `src/components/praxis/ai-populate.tsx` — Auto-generates data on first tool visit
- Negotiation Prep, Sanctions Tracker: structured JSON via `generateText + Output.object()`
- Scenarios: streaming text via `streamText`, rendered directly (no AiPopulate)
- Data stored in component state; not yet persisted to Firestore
- Source mode picker: all / web+docs / docs-only / llm-only

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
