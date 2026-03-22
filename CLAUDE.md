# PRAXIS — Conflict Intelligence Platform by TACITUS

## What This Is
The "Bloomberg Terminal for conflict resolution." AI-native workspace for UN Political Affairs Officers, think tank analysts, diplomatic mediators. Deployed at praxis-nextjs-tacitus.vercel.app.

## Tech Stack
Next.js 16.1.6 (App Router), TypeScript 5.9, Tailwind CSS 4, Radix UI, Vercel AI SDK (ai@6.0.105 + @ai-sdk/google + @ai-sdk/anthropic), Firebase Auth + Firestore, Firecrawl (web intelligence), Zustand 5, D3.js 7, Framer Motion 12, Zod 4. Vercel (iad1).

## Architecture
- `src/app/(landing)/` — Public landing page (18 sections, includes Ecosystem showcase)
- `src/app/(auth)/` — Login (Firebase Auth: Google + email/password + Demo Mode bypass)
- `src/app/(app)/` — Authenticated workspace (29 pages)
- `src/app/api/` — 36 routes (24 AI, 4 data, 3 auth, 2 graph, 1 settings, 1 health, 1 upload)
- `src/lib/firebase/` — config.ts (client SDK), admin.ts (server SDK), firestore.ts (user profiles, credits, AI settings, persistence)
- `src/lib/ai/` — providers.ts (Gemini/Claude dual + user prefs), tools.ts (18 tools with Firecrawl web search), firecrawl.ts (web crawling service), research-engine.ts (Firecrawl-powered research pipeline), prompts/, schemas/
- `src/lib/constants/` — demo-conflict.ts (Nordalia Crisis, 1047 lines), case-registry, media-database (50+ outlets), un-terminology, templates, 5 case files, scenario-configs, briefing-data, argus-demo, concordia-demo, actor-profiles, treaty-demo, risk-regions
- `src/lib/services/` — ai-service, conflict-service, document-service, export-service, research-service
- `src/lib/api/` — with-auth.ts (Firebase token + demo auth wrapper), with-credits.ts (TACITUS Credits deduction)
- `src/stores/` — app-store, conflict-store (persisted), report-store, notification-store
- `src/components/` — ~90 components: ui/(12), shared/(13), landing/(18), app/(3), graph/(4), media/(6), reports/(5), onboarding/(6), assistant/(4), negotiation/(1)

## Authentication (Firebase)
- Firebase Auth with Google sign-in + email/password registration
- Firebase project: `praxisbytacitus` (praxisbytacitus.firebaseapp.com)
- Auth state managed client-side via `src/lib/auth/auth-context.tsx` (AuthProvider in root layout)
- Session cookie (`tacitus-auth-session`) synced to server for middleware + API route auth
- Demo mode preserved: "Enter Demo Mode" button on login page, no account needed
- `src/lib/auth/mock-auth.ts` kept as compat layer for server components using `getSession()`

## TACITUS Credits (Billing)
- 100 TACITUS Credits awarded on sign-up (stored in Firestore `users` collection)
- Credits displayed in sidebar and header user dropdown
- AI operations deduct credits via `src/lib/api/with-credits.ts`
- Credit costs: chat=1, terminology=1, scenario=2, research/grounded-search/media/talking-points/extract/advisor=2, analysis/claude-analyze/resolution=3, dossier=4, report/deep-research=5
- Demo users have unlimited credits (shown as ∞)
- Transaction history stored in `credit_transactions` collection

## Firestore Collections
- `users` — uid, email, displayName, credits, totalCreditsUsed, role, orgId, orgName, createdAt
- `credit_transactions` — userId, amount, type, description, route, createdAt
- `conflicts` — userId + conflictId composite key, conflict data
- `reports` — userId, report data, updatedAt

## TACITUS Ecosystem Integration
PRAXIS integrates with 5 other TACITUS products (all in demo mode with cached data):
- **ARGUS** — Graph-Augmented RAG Intelligence (`/argus`, 3 tabs: KG queries, entity extraction, cross-case patterns)
- **CONCORDIA** — AI Mediation Platform (`/concordia`, session planner, live assistant preview, settlement generator)
- **WIND TUNNEL** — Psychographic Scenario Simulation (integrated into Scenario Planner via CTA)
- **CONFLICT COMPASS** — Structured Conflict Assessment (external link)
- **DIALECTICA** — Ontology Backend / ACO v2.0 engine (settings configuration)

Ecosystem status visible in Settings > TACITUS Ecosystem Connections. Landing page includes full ecosystem showcase section.

## Conflict Grammar (ACO v2.0)
8 primitives in `src/lib/ai/schemas/conflict-grammar.ts`: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative. Zod schemas with discriminated union. This is TACITUS's intellectual core. Configurable in Settings > Conflict Grammar Configuration.

## AI Tools (src/lib/ai/tools.ts)
18 tools encoding real methodology: Glasl escalation model, Fisher/Ury negotiation (ZOPA/BATNA), OCHA humanitarian standards, UN Editorial Manual, historical parallel analysis, narrative ecosystem mapping, UNSC resolution drafting.

## Key Pages
- `/dossier` — 3-step generator with animated pipeline
- `/treaty-analyzer` — Clause annotations + compliance dashboard
- `/risk-monitor` — Heatmap grid + D3 forecast chart
- `/actors` — Registry with filtering + detail dossiers
- `/team` — Team grid + activity feed + scratchpad
- `/scenarios` — Parameter sliders + preset outcomes + Wind Tunnel integration
- `/briefing` — Builder + 7-slide presentation mode with keyboard navigation
- `/negotiation-prep` — Fisher/Ury ZOPA/BATNA analysis

## Demo vs Live Mode
- **Demo mode** activates when: no GOOGLE_AI_API_KEY is set, or user clicks "Enter Demo Mode" on login
- Demo mode uses pre-computed cached responses from `src/lib/demo/cached-responses.ts`
- **Live mode** activates when: GOOGLE_AI_API_KEY is set AND user authenticates via Firebase
- Live mode uses real Gemini/Claude AI calls with TACITUS Credits deduction
- All 13 AI routes check credits before making AI calls (demo users bypass)

## Conventions
- Auth managed by Firebase Auth + AuthProvider context
- AI routes use checkAndDeductCredits() from src/lib/api/with-credits.ts
- Providers centralized in src/lib/ai/providers.ts — use getModel()
- Nordalia Crisis (demo-conflict.ts) is primary demo case
- Colors: Navy #0F172A, Emerald #10B981, Gold #E8B931, Diplomatic Blue #1B3A5C
- Fonts: EB Garamond headings, Inter body, JetBrains Mono code
- Entity colors in src/lib/constants/entity-colors.ts
- PoweredByTacitus footer on ecosystem-integrated pages

## Env Vars
- GOOGLE_AI_API_KEY (required for live AI — demo mode works without)
- ANTHROPIC_API_KEY (optional, Claude deep analysis)
- AI_PROVIDER ('google' default or 'vertex')
- FIREBASE_SERVICE_ACCOUNT_KEY (optional, for server-side admin operations)

## Current Limitations
- Graph is in-memory demo, not Neo4j yet
- Document upload is mock, no extraction
- Export is client-side markdown/JSON only
- Data resets on restart (except Firestore-persisted user profiles and credits)
- TACITUS ecosystem products are demo mode only (cached responses, no live API connections)
