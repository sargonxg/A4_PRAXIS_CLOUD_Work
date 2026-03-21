# PRAXIS — Conflict Intelligence Platform by TACITUS

## What This Is
The "Bloomberg Terminal for conflict resolution." AI-native workspace for UN Political Affairs Officers, think tank analysts, diplomatic mediators. Deployed at praxis-nextjs-tacitus.vercel.app.

## Tech Stack
Next.js 16.1.6 (App Router), TypeScript 5.9, Tailwind CSS 4, Radix UI, Vercel AI SDK (ai@6.0.105 + @ai-sdk/google + @ai-sdk/anthropic), Zustand 5, D3.js 7, Framer Motion 12, Zod 4. Vercel (iad1).

## Architecture
- `src/app/(landing)/` — Public landing page (18 sections, includes Ecosystem showcase)
- `src/app/(auth)/` — Login (password auth: PRAXIS2026, plus Demo Mode bypass)
- `src/app/(app)/` — Authenticated workspace (29 pages)
- `src/app/api/` — 24 routes (13 AI, 4 data, 3 auth, 2 graph, 1 health, 1 upload)
- `src/lib/ai/` — providers.ts (Gemini/Claude dual), tools.ts (18 tools, 1720 lines), prompts/, schemas/
- `src/lib/constants/` — demo-conflict.ts (Nordalia Crisis, 1047 lines), case-registry, media-database (50+ outlets), un-terminology, templates, 5 case files, scenario-configs, briefing-data, argus-demo, concordia-demo, actor-profiles, treaty-demo, risk-regions
- `src/lib/services/` — ai-service, conflict-service, document-service, export-service, research-service
- `src/lib/api/` — with-auth.ts (auth + rate limiting wrapper)
- `src/stores/` — app-store, conflict-store (persisted), report-store, notification-store
- `src/components/` — ~90 components: ui/(12), shared/(13), landing/(18), app/(3), graph/(4), media/(6), reports/(5), onboarding/(6), assistant/(4), negotiation/(1)

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

## Key Pages (New in Upgrade)
- `/dossier` — 3-step generator with animated pipeline
- `/treaty-analyzer` — Clause annotations + compliance dashboard
- `/risk-monitor` — Heatmap grid + D3 forecast chart
- `/actors` — Registry with filtering + detail dossiers
- `/team` — Team grid + activity feed + scratchpad
- `/scenarios` — Parameter sliders + preset outcomes + Wind Tunnel integration
- `/briefing` — Builder + 7-slide presentation mode with keyboard navigation
- `/negotiation-prep` — Fisher/Ury ZOPA/BATNA analysis

## Demo Data Coverage
All new pages use pre-computed demo data from `src/lib/constants/`. The assistant chat has cached responses for greetings, key actors, ceasefire scenarios, Glasl assessment, UNSC talking points, morning briefs, and TACITUS ecosystem queries (ARGUS, CONCORDIA, Wind Tunnel). Demo mode activates when no GOOGLE_AI_API_KEY is set or ?demo=true URL param.

## Conventions
- All API routes use withAuth() from src/lib/api/with-auth.ts
- Providers centralized in src/lib/ai/providers.ts — use getModel()
- Nordalia Crisis (demo-conflict.ts) is primary demo case
- Colors: Navy #0F172A, Emerald #10B981, Gold #E8B931, Diplomatic Blue #1B3A5C
- Fonts: EB Garamond headings, Inter body, JetBrains Mono code
- Entity colors in src/lib/constants/entity-colors.ts
- PoweredByTacitus footer on ecosystem-integrated pages

## Env Vars
- GOOGLE_AI_API_KEY (required)
- ANTHROPIC_API_KEY (optional, Claude analysis)
- AI_PROVIDER ('google' default or 'vertex')

## Current Limitations
- Auth uses password (PRAXIS2026) with cookie session — Clerk planned for production
- Graph is in-memory demo, not Neo4j yet
- Document upload is mock, no extraction
- Export is client-side markdown/JSON only
- Data resets on restart
- TACITUS ecosystem products are demo mode only (cached responses, no live API connections)
