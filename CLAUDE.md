# PRAXIS — Conflict Intelligence Platform by TACITUS

## What This Is
The "Bloomberg Terminal for conflict resolution." AI-native workspace for UN Political Affairs Officers, think tank analysts, diplomatic mediators. Deployed at praxis-nextjs-tacitus.vercel.app.

## Tech Stack
Next.js 16.1.6 (App Router), TypeScript 5.9, Tailwind CSS 4, Radix UI, Vercel AI SDK (ai@6.0.105 + @ai-sdk/google + @ai-sdk/anthropic), Zustand 5, D3.js 7, Framer Motion 12, Zod 4. Vercel (iad1).

## Architecture
- `src/app/(landing)/` — Public landing page (17 sections)
- `src/app/(auth)/` — Login (mock auth)
- `src/app/(app)/` — Authenticated workspace (21 pages)
- `src/app/api/` — 24 routes (13 AI, 4 data, 3 auth, 2 graph, 1 health, 1 upload)
- `src/lib/ai/` — providers.ts (Gemini/Claude dual), tools.ts (18 tools, 1720 lines), prompts/, schemas/
- `src/lib/constants/` — demo-conflict.ts (Nordalia Crisis, 1047 lines), case-registry, media-database (50+ outlets), un-terminology, templates, 5 case files
- `src/lib/services/` — ai-service, conflict-service, document-service, export-service, research-service
- `src/lib/api/` — with-auth.ts (auth + rate limiting wrapper)
- `src/stores/` — app-store, conflict-store (persisted), report-store, notification-store
- `src/components/` — 69 components: ui/(12), shared/(11), landing/(17), app/(3), graph/(4), media/(6), reports/(5), onboarding/(6), assistant/(4), negotiation/(1)

## Conflict Grammar (ACO v2.0)
8 primitives in `src/lib/ai/schemas/conflict-grammar.ts`: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative. Zod schemas with discriminated union. This is TACITUS's intellectual core.

## AI Tools (src/lib/ai/tools.ts)
18 tools encoding real methodology: Glasl escalation model, Fisher/Ury negotiation (ZOPA/BATNA), OCHA humanitarian standards, UN Editorial Manual, historical parallel analysis, narrative ecosystem mapping, UNSC resolution drafting.

## Conventions
- All API routes use withAuth() from src/lib/api/with-auth.ts
- Providers centralized in src/lib/ai/providers.ts — use getModel()
- Nordalia Crisis (demo-conflict.ts) is primary demo case
- Colors: Navy #0F172A, Emerald #10B981, Gold #E8B931, Diplomatic Blue #1B3A5C
- Fonts: EB Garamond headings, Inter body, JetBrains Mono code
- Entity colors in src/lib/constants/entity-colors.ts

## Env Vars
- GOOGLE_AI_API_KEY (required)
- ANTHROPIC_API_KEY (optional, Claude analysis)
- AI_PROVIDER ('google' default or 'vertex')

## Current Limitations
- Auth is mock (cookie, no password) — Clerk planned
- Graph is in-memory demo, not Neo4j yet
- Document upload is mock, no extraction
- Export is client-side markdown/JSON only
- Data resets on restart
