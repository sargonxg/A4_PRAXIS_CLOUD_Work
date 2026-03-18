# PRAXIS by TACITUS — Architecture Reference

## Project Identity

PRAXIS is the **"Bloomberg Terminal for conflict resolution"** — an AI-native workspace for peace and security professionals. It provides conflict intelligence analysis, knowledge graph visualization, report generation, and scenario modeling.

- **Deployed at**: praxis-nextjs-tacitus.vercel.app (Vercel, iad1 region)
- **Built by**: TACITUS ([tacitus.me](https://tacitus.me))
- **Target users**: UN Political Affairs Officers, think tank analysts, peacebuilding organizations

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS | 4 |
| UI Primitives | Radix UI | Latest |
| AI SDK | Vercel AI SDK (`ai`) | 6.0.105 |
| AI Providers | `@ai-sdk/google`, `@ai-sdk/anthropic` | 3.x |
| State | Zustand | 5 |
| Visualization | D3.js | 7 |
| Animation | Framer Motion | 12 |
| Validation | Zod | 4 |
| Deployment | Vercel | iad1 |

## Architecture Map

```
src/
├── app/
│   ├── (landing)/          # Public marketing landing page (17 component sections)
│   ├── (auth)/             # Login page (mock auth, Clerk migration planned)
│   ├── (app)/              # Authenticated workspace (21 pages)
│   │   ├── dashboard/      # Main dashboard with conflict overview
│   │   ├── assistant/      # AI chat interface with tool invocations
│   │   ├── conflict-graph/ # D3.js force-directed knowledge graph
│   │   ├── reports/        # Report composer with UN templates
│   │   ├── documents/      # Document upload and entity extraction
│   │   ├── scenarios/      # Scenario analysis engine
│   │   ├── talking-points/ # Diplomatic talking point generator
│   │   ├── advisory/       # 10 expert advisor personas
│   │   ├── media-compass/  # Media bias analysis
│   │   ├── cases/          # Conflict case management
│   │   ├── calendar/       # Conflict timeline calendar
│   │   ├── early-warning/  # Early warning indicators
│   │   ├── negotiation-prep/ # ZOPA/BATNA analysis
│   │   ├── sanctions/      # Sanctions checking
│   │   ├── stakeholder-map/ # Actor relationship mapping
│   │   ├── un-toolkit/     # UN terminology and resolution tools
│   │   ├── compare/        # Cross-conflict comparison
│   │   └── settings/       # App configuration
│   └── api/
│       ├── ai/             # 13 AI routes (chat, research, analysis, extraction)
│       ├── auth/           # 3 auth routes (login, logout, session)
│       ├── documents/      # 2 document routes (upload, [id])
│       ├── graph/          # 2 graph routes (query, ingest)
│       └── reports/        # 3 report routes (list, [id], [id]/export)
├── components/             # 69 components
│   ├── ui/                 # 12 Radix UI primitives
│   ├── shared/             # 11 shared components (search, timeline, badges)
│   ├── landing/            # 17 landing page sections
│   ├── app/                # 3 app shell components (shell, sidebar, header)
│   ├── graph/              # 4 graph components (viewer, entity panel, matrix, slider)
│   ├── media/              # 6 media analysis components
│   ├── reports/            # 5 report components (composer, editor, export)
│   ├── onboarding/         # 6 onboarding components
│   ├── assistant/          # 4 chat interface components
│   └── negotiation/        # 1 ZOPA visualizer
├── lib/
│   ├── ai/
│   │   ├── providers.ts    # Centralized provider abstraction (Google AI / Vertex / Anthropic)
│   │   ├── tools.ts        # 18 callable AI tools (1720 lines) — product IP
│   │   ├── prompts/        # 5 prompt files (system, diplomatic, UN style, media, report)
│   │   └── schemas/        # 3 Zod schema files (conflict grammar, media, report)
│   ├── constants/          # Data layer
│   │   ├── demo-conflict.ts   # Nordalia Crisis (1047 lines) — primary demo case
│   │   ├── case-registry.ts   # Central case registry (469 lines)
│   │   ├── media-database.ts  # 50+ media outlets with bias data
│   │   ├── un-terminology.ts  # UN Editorial Manual terminology
│   │   ├── templates.ts       # Report templates (SG Reports, SC Briefings, etc.)
│   │   └── cases/             # 5 additional case files
│   ├── services/           # Business logic
│   │   ├── ai-service.ts
│   │   ├── conflict-service.ts  # In-memory conflict graph CRUD
│   │   ├── document-service.ts
│   │   ├── export-service.ts    # Client-side export (MD, JSON, CSV)
│   │   └── research-service.ts
│   ├── auth/               # Mock auth (auth-context.tsx, mock-auth.ts)
│   └── utils/              # cn, date, format, stream utilities
├── stores/                 # Zustand state management
│   ├── app-store.ts        # Sidebar, user state
│   ├── conflict-store.ts   # Conflicts, cases, alerts (persisted)
│   ├── report-store.ts     # Report composition state
│   └── notification-store.ts # Notification management
└── types/                  # TypeScript type definitions
```

## Conflict Grammar (ACO v2.0)

The intellectual core of TACITUS. Eight primitives form a structured knowledge graph for any conflict:

| Primitive | Description | Color |
|-----------|-------------|-------|
| **Actor** | State, non-state armed group, IO, civil society, etc. | Diplomatic Blue `#1B3A5C` |
| **Claim** | Territorial, sovereignty, self-determination, resource, etc. | Crimson `#A63D40` |
| **Interest** | Security, economic, political — stated, unstated, or inferred | Teal `#4A90A4` |
| **Constraint** | Legal, institutional, military, economic — binding to minor | Navy `#334155` |
| **Leverage** | Military, economic, diplomatic — with effectiveness scores | Gold `#C8961E` |
| **Commitment** | Treaties, ceasefires, resolutions — with verification mechanisms | Sage `#5B8C5A` |
| **Event** | Military, political, diplomatic events — with escalatory direction | Terracotta `#C75B39` |
| **Narrative** | Justification, victimhood, propaganda — with target audience | Purple `#7B6D8D` |

Defined as Zod schemas with a discriminated union in `src/lib/ai/schemas/conflict-grammar.ts`. All entity extraction, graph visualization, and analytical tools operate on these 8 types.

## AI Provider System

Provider creation is centralized in `src/lib/ai/providers.ts`. **Always use `getModel()`, never inline `createGoogleGenerativeAI()`.**

| Function | Returns | Use Case |
|----------|---------|----------|
| `getModel()` | `gemini-2.5-flash` | Standard routes (chat, extract, report, etc.) |
| `getProModel()` | `gemini-2.5-pro` | Complex generation tasks |
| `getGroundedModel()` | `gemini-2.5-flash` | Base model for search grounding |
| `getAnalysisModel()` | Claude Sonnet → Gemini Pro fallback | Deep analysis (bias, diplomatic, legal) |
| `google` (legacy export) | Raw provider instance | Only for `google.tools.googleSearch({})` in grounded routes |

Three routes use the raw `google` export for search grounding: `grounded-search`, `research`, `deep-research`.

## AI Tool System

The 18 tools in `src/lib/ai/tools.ts` encode real conflict analysis methodologies:

| Tool | Methodology |
|------|------------|
| `escalationAssessment` | Glasl 9-stage escalation model |
| `negotiationSpaceAnalysis` | Fisher/Ury framework (ZOPA, BATNA, red lines) |
| `humanitarianSnapshot` | OCHA humanitarian standards |
| `checkUNTerminology` | UN Editorial Manual compliance |
| `editForDiplomaticTone` | Diplomatic language register |
| `historicalParallelAnalysis` | Historical analogy with similarity scoring |
| `narrativeEcosystemMap` | Narrative mapping with misinformation risk |
| `draftResolutionLanguage` | UNSC resolution drafting (Chapter VII formulations) |
| `queryConflictGraph` | Structured conflict data retrieval |
| `webSearch` | AI-generated conflict-grounded search results |
| `analyzeDocument` | Document entity extraction |
| `draftSection` | Report section generation |
| `analyzeMediaSource` | Media outlet analysis |
| `compareMediaCoverage` | Cross-outlet coverage comparison |
| `generateTalkingPoints` | Diplomatic talking point generation |
| `generateTimeline` | Conflict timeline creation |
| `sanctionsCheck` | Sanctions regime checking |
| `compareConflicts` | Cross-conflict comparison |

## Key Conventions

- **All AI routes** use centralized providers from `src/lib/ai/providers.ts`
- **The Nordalia Crisis** (`demo-conflict.ts`) is the primary demo case — a fictional multi-party conflict used for all demo flows
- **Color system**: Navy `#0F172A` base, Emerald `#10B981` accent, Gold `#E8B931` for highlights, Diplomatic Blue `#1B3A5C` for institutions
- **Typography**: EB Garamond for headings, Inter for body, JetBrains Mono for code/data
- **Entity colors**: Defined in `src/lib/constants/entity-colors.ts`
- **State management**: Zustand stores — `conflict-store` is persisted via localStorage
- **Streaming**: AI routes use Vercel AI SDK's `streamText()` for progressive response rendering

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_AI_API_KEY` | Yes | Primary AI provider (Google AI Studio) |
| `ANTHROPIC_API_KEY` | No | Secondary analysis engine (Claude) |
| `AI_PROVIDER` | No | `'google'` (default) or `'vertex'` |
| `GOOGLE_VERTEX_PROJECT` | No | Vertex AI project ID |
| `GOOGLE_VERTEX_LOCATION` | No | Vertex AI location (default: us-central1) |

## Current Limitations

- **Auth is mock-only** — cookie-based with no real password check. Clerk migration planned.
- **Graph backend is in-memory** — demo data only, not connected to Neo4j/FalkorDB yet.
- **Document upload is a stub** — accepts files but doesn't process them (extraction pipeline TODO).
- **Export is client-side only** — markdown and JSON via blob downloads, no server-side PDF/DOCX.
- **All conflict data resets on server restart** — in-memory stores with no persistence layer.
- **Search grounding can't coexist with custom tools** — Vercel AI SDK / Gemini limitation (#8258), so `grounded-search` is a separate endpoint from `chat`.

## Development Notes

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint
```

The app uses Next.js App Router with `'use client'` directives for interactive pages. Server components handle auth checks in layout files. API routes are in `src/app/api/`.
