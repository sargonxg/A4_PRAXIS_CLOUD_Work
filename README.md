# PRAXIS by TACITUS

**The conflict operating system for peace and security professionals.**

AI-native workspace for UN Political Affairs Officers, diplomatic mediators, and conflict analysts. 40+ specialised tool pages, 68+ API routes, Python FastAPI backend with ACO conflict intelligence pipeline, and real-time intelligence feeds from ACLED, GDELT, UCDP, UNHCR, and the UN.

> **v6.0.0** — Build 2026.04.07 | Dual-service GCP architecture (Next.js + Python FastAPI on Cloud Run)

---

## Quick Start

### Local Development (dual-service)

```bash
# Terminal 1 — Next.js frontend (port 3000)
npm install
npm run dev

# Terminal 2 — Python backend + Neo4j + FalkorDB (port 8080)
docker-compose up
```

Open [http://localhost:3000](http://localhost:3000). **The demo works with zero configuration** — no API keys needed.

### Environment Setup

Copy `.env.local.example` to `.env.local`:

```bash
# Required for live AI (demo works without)
GOOGLE_AI_API_KEY=your_gemini_key

# Required for server-side Firestore + Vertex AI auth
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"praxisbytacitus",...}

# Backend URL (auto-set by Cloud Build for production)
NEXT_PUBLIC_PRAXIS_BACKEND_URL=http://localhost:8080

# Optional — enables Claude deep analysis
ANTHROPIC_API_KEY=your_key

# Optional — enables Firecrawl web research
FIRECRAWL_API_KEY=your_key

# Required for Deep Research Agent (Vertex AI ADK)
VERTEX_AGENT_ENGINE_ID=your_numeric_engine_id

# Required for cron job auth
CRON_SECRET=your_secret
```

See `.env.local.example` for the complete grouped list including Neo4j, FalkorDB, Stripe, and GCP variables.

---

## Two Experiences in One Codebase

| | Demo (`/demo/*`) | Real App (`/app/*`) |
|---|---|---|
| **Auth** | Cookie-only, no account needed | Firebase — Google + email/password |
| **Data** | Pre-loaded Nordalia Crisis | User creates situations; all data in Firestore |
| **AI** | Cached demo responses | Live Gemini Pro / Claude + Firecrawl |
| **Credits** | Unlimited (shown as ∞) | 5,000 on sign-up, deducted per use |
| **Persistence** | In-memory (Zustand + localStorage) | Firestore (user-scoped subcollections) |
| **Purpose** | Investor demos, prospect exploration | Real conflict intelligence work |

---

## Architecture (v6.0.0 — Dual-Service GCP)

```
┌─────────────────────────────────┐    ┌──────────────────────────────────┐
│   Next.js Frontend              │    │   Python FastAPI Backend          │
│   Cloud Run (us-central1)       │◄──►│   Cloud Run (us-central1)         │
│   /app/* — React workspace      │    │   /api/v1/* — Graphify pipeline   │
│   /demo/* — Nordalia demo       │    │   NetworkX + Leiden clustering    │
│   68 API routes (Next.js)       │    │   Genkit AI flows                 │
└──────────────┬──────────────────┘    └─────────────┬────────────────────┘
               │                                     │
               ▼                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│   Firebase / GCP                                                         │
│   Firestore — users/{uid}/situations/{sitId}/graph,tools,documents       │
│   Firebase Auth — Google + email/password                                │
│   Vertex AI — Gemini Pro/Flash, ADK Deep Research Agent                  │
│   BigQuery — analytics logging                                           │
│   Cloud Storage — document uploads                                       │
│   Cloud Functions — on_situation_created, on_document_uploaded, GDELT   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Graphify ACO Pipeline (Backend)

```
extract → build → cluster → analyze → report → export
```

1. **extract.py** — Gemini reads source text → structured ACO nodes + edges (8 types, 42 relationships)
2. **build.py** — Merges extractions into a NetworkX multigraph
3. **cluster.py** — Leiden community detection (graspologic) → faction assignments
4. **analyze.py** — Pivot actors (centrality), hidden linkages, Glasl escalation, ZOPA
5. **report.py** — Markdown brief + structured JSON output
6. **export.py** — Push to Neo4j/FalkorDB, HTML visualization

### ACO — Agentic Conflict Ontology

8 primitive types: `Actor` · `Claim` · `Interest` · `Constraint` · `Leverage` · `Commitment` · `Event` · `Narrative`

42 typed relationships — see `backend/graphify_tacitus/schemas/relationships.py`

Visualization colors: Actor `#4E79A7` · Claim `#F28E2B` · Interest `#59A14F` · Constraint `#E15759` · Leverage `#EDC948` · Commitment `#76B7B2` · Event `#B07AA1` · Narrative `#FF9DA7`

### Frontend source layout

```
src/
├── app/
│   ├── (landing)/          Public landing page
│   ├── (auth)/             Login — Google, email/password, demo, password reset
│   ├── app/                40+ authenticated workspace pages (/app/*)
│   ├── demo/               30 demo pages (/demo/*) — Nordalia Crisis data
│   └── api/                68 API routes (auth, AI, data, admin, cron)
│
├── components/
│   ├── ui/                 Radix UI primitives
│   ├── shared/             Cross-app reusable components
│   ├── app/                AppShell, AppSidebar, Header, DebugPanel, FloatingPRAXIS
│   ├── praxis/             AiPopulate, ToolInfoPanel, situation/error states
│   ├── assistant/          Chat interface, tool invocation renderer
│   ├── visualizations/     10 SVG/D3 components (RiskGauge, ForceGraph, etc.)
│   ├── graph/              D3.js conflict knowledge graph
│   ├── reports/            Report composer & DOCX/PDF export
│   └── landing/            Landing page sections
│
├── lib/
│   ├── ai/                 Providers, 27 chat tools, prompts, schemas, Firecrawl, Vertex AI ADK
│   ├── firebase/           Client config, Admin SDK, Firestore services (9 service files)
│   ├── api/                withAuth, withCredits, rate limiting, error handling
│   ├── auth/               AuthProvider (auth-context.tsx)
│   ├── analytics/          Risk engine (INFORM), escalation scorer (Glasl), geospatial engine
│   ├── data-feeds/         ACLED, GDELT, UCDP, UNHCR, HDX, ReliefWeb, UN News, World Bank, CrisisWatch
│   ├── constants/          Tool registry (40 tools), frameworks (15), demo data, pricing
│   └── utils/              Routes, formatting, cn, streaming helpers
│
├── stores/                 Zustand — situation, app, conflict, report, debug, notification, preferences
├── hooks/                  useSituationGuard, usePraxisApi, useKeyboardShortcuts, usePersistedToolData
└── types/                  Situation v2, conflict grammar (ACO), report, API types
```

---

## Authentication

See [`docs/AUTH.md`](./docs/AUTH.md) for the full token lifecycle, CSRF protection design, and session architecture.

**Summary:**

| Method | Provider | Notes |
|--------|----------|-------|
| Google OAuth | Firebase (redirect flow) | `signInWithRedirect` — avoids COOP popup blocking |
| Email/Password | Firebase | Full error code surface + password reset |
| Demo Mode | Cookie-only | `{demo: true}` JSON cookie, no Firebase involved |

**Password reset:** Users click "Forgot password?" on the sign-in form → enter email → Firebase sends a reset link. The response is deliberately ambiguous (no confirmation of whether the email exists) to prevent enumeration attacks.

**Diagnostic:** `GET /api/auth/test-firebase` confirms Admin SDK initialisation, Firebase reachability, and Email/Password provider status from the Vercel runtime — without requiring auth credentials.

---

## Tool Pages

### Context (7)
| Tool | Route |
|------|-------|
| Dashboard | `/app/dashboard` |
| Documents | `/app/documents` |
| Sources Library | `/app/sources` |
| Timeline | `/app/timeline` |
| Humanitarian | `/app/humanitarian` |
| Calendar | `/app/calendar` |
| Conflict Graph | `/app/conflict-graph` |

### Analysis (7)
| Tool | Route |
|------|-------|
| Risk Monitor | `/app/risk-monitor` |
| Early Warning | `/app/early-warning` |
| Actor Profiles | `/app/actors` |
| Stakeholder Map | `/app/stakeholder-map` |
| Power Map | `/app/power-map` |
| Info Environment | `/app/info-environment` |
| Compare | `/app/compare` |

### Drafting (7)
| Tool | Route |
|------|-------|
| PRAXIS Assistant | `/app/assistant` |
| Report Studio | `/app/reports` |
| Dossier Generator | `/app/dossier` |
| Talking Points | `/app/talking-points` |
| Briefing Room | `/app/briefing` |
| Daily Brief | `/app/auto-briefings` |
| UN Toolkit | `/app/un-toolkit` |

### Simulation (5)
| Tool | Route |
|------|-------|
| Scenario Planner | `/app/scenarios` |
| Negotiation Prep | `/app/negotiation-prep` |
| Game Theory | `/app/game-theory` |
| CONCORDIA | `/app/concordia` |
| Mediation Designer | `/app/mediation-design` |

### Intelligence (11)
| Tool | Route |
|------|-------|
| Deep Research Agent | `/app/deep-search-agent` |
| ARGUS Deep Research | `/app/argus` |
| ARGUS Grounded | `/app/argus-grounded` |
| Media Compass | `/app/media-compass` |
| Media Roundup | `/app/media-roundup` |
| Geospatial Monitor | `/app/geospatial-monitor` |
| Sanctions Tracker | `/app/sanctions` |
| Commitment Tracker | `/app/commitments` |
| Treaty Analyzer | `/app/treaty-analyzer` |
| Alert Center | `/app/alerts` |
| Deep Research | `/app/deep-research` |

### Workspace (4)
| Tool | Route |
|------|-------|
| Case Library | `/app/cases` |
| Team Hub | `/app/team` |
| Advisory Council | `/app/advisory` |
| Settings | `/app/settings` |

---

## AI Pipeline

### Model Tiers

| Helper | Model | Used for |
|--------|-------|----------|
| `getModel()` | `gemini-2.5-flash` | Chat, terminology, lightweight tasks |
| `getProModel()` | `gemini-2.5-pro` | All structured tool generation (Zod schemas) |
| `getAnalysisModel()` | `claude-sonnet-4` | Deep analysis, bias detection (falls back to Pro) |
| `getGroundedModel()` | `gemini-2.5-flash + Google Search` | Research with real-time grounding |
| `streamAgentTurn()` | Vertex AI Agent Engine (ADK) | Deep Research Agent — 3-phase pipeline |

### 27 AI Chat Tools

All tools call `generateText + Output.object()` with Zod schemas via `getProModel()`:

| # | Tool | Credits |
|---|------|---------|
| 1 | `webSearch` | 1 |
| 2 | `analyzeDocument` | 2 |
| 3 | `queryConflictGraph` | 1 |
| 4 | `draftSection` | 2 |
| 5 | `editForDiplomaticTone` | 1 |
| 6 | `analyzeMediaSource` | 2 |
| 7 | `compareMediaCoverage` | 2 |
| 8 | `checkUNTerminology` | 1 |
| 9 | `draftResolutionLanguage` | 2 |
| 10 | `generateTalkingPoints` | 2 |
| 11 | `escalationAssessment` | 3 |
| 12 | `negotiationSpaceAnalysis` | 3 |
| 13 | `narrativeEcosystemMap` | 3 |
| 14 | `historicalParallelAnalysis` | 3 |
| 15 | `generateTimeline` | 2 |
| 16 | `sanctionsCheck` | 2 |
| 17 | `humanitarianSnapshot` | 2 |
| 18 | `compareConflicts` | 3 |
| 19 | `canonicalNameLookup` | 1 |
| 20 | `deepSourceResearch` | 4 |
| 21 | `verifyAndStandardize` | 1 |
| 22 | `stakeholderInfluenceMap` | 3 |
| 23 | `ceasefireMonitor` | 3 |
| 24 | `peaceAgreementAnalyzer` | 4 |
| 25 | `earlyWarningBrief` | 3 |
| 26 | `gameTheoryAnalysis` | 3 |
| 27 | `protectionOfCiviliansAssessment` | 4 |

### Analytical Frameworks (15)

| Framework | Used by |
|-----------|---------|
| Glasl 9-Stage Escalation | Early Warning, Dashboard, Scenarios, Timeline |
| INFORM Risk Index (IASC) | Risk Monitor, Dashboard, Humanitarian |
| Fisher-Ury Principled Negotiation | Negotiation Prep, Talking Points, Actor Profiles |
| Mitchell-Agle-Wood Stakeholder Salience | Stakeholder Map, Actor Profiles |
| Barnett-Duvall 4 Faces of Power | Power Map, Stakeholder Map |
| Zartman Ripeness Theory | Mediation Design, Scenarios, Calendar |
| Stedman Spoiler Management | Mediation Design, Scenarios |
| OCHA Humanitarian Principles | Humanitarian, Briefing |
| IPC Food Security Phases | Humanitarian, Risk Monitor |
| Lederach Peacebuilding Pyramid | Mediation Design, Stakeholder Map |
| Galtung ABC Conflict Triangle | Risk Monitor, Info Environment |
| UN DPPA Brief Format | Auto-Briefings, Briefing, Report Studio |
| Berghof Mediation Framework | Mediation Design, CONCORDIA |
| Putnam Two-Level Games | Game Theory, Negotiation Prep |
| Fearon Rationalist War Causes | Game Theory, Scenarios |

### Live Data Feeds (9)

| Feed | Covers | Auth |
|------|--------|------|
| ACLED | Armed conflict events (pagination to 15k, 1h cache) | API key |
| GDELT | Media events, tone, instability (Z-score anomaly detection) | Free |
| UCDP GED | Georeferenced conflict event dataset | Free |
| UNHCR Refugee Data Finder | Displacement statistics, time-series | Free |
| HDX HAPI | IDP figures, nutrition, operational presence | Free |
| ReliefWeb | UN situation reports and disaster updates | Free |
| UN News RSS | 6 feeds — SG statements, Security Council, regional desks | Free |
| World Bank | GDP, governance indicators (WGI), fragility indices | Free |
| CrisisWatch (ICG) | Monthly conflict status via Firecrawl scraper | Firecrawl key |

---

## API Routes (68 total)

### Auth (4)
`POST /api/auth/session` — Set session cookie (Firebase token or demo flag). CSRF-protected.
`DELETE /api/auth/session` — Clear session cookie (logout).
`GET /api/auth/session` — Check session status.
`GET /api/auth/test-firebase` — Ops diagnostic: Admin SDK status + Email/Password provider check.

### AI Generation (35 routes, all behind `withAuth()` + `checkAndDeductCredits()`)
**Core**: `chat`, `research`, `deep-research`, `grounded-search`, `claude-analyze`, `deep-search-agent` (Vertex AI ADK)
**Structured Analysis**: `risk-assessment`, `actor-profiles`, `actor-brief`, `actor-enrichment`, `power-map`, `escalation-scan`, `scenario`, `commitment-scan`, `sanctions-scan`, `treaty-analyze`, `negotiation`, `mediation`, `mediation-design`, `info-environment`, `game-theory`
**Content Generation**: `report`, `briefing-generate`, `auto-briefing`, `dossier-generate`, `talking-points`, `resolution`, `terminology`
**Research**: `argus`, `media-scan`, `media-roundup`, `media-analyze`, `discover-sources`, `extract`, `auto-structure`, `advisor-chat`

### Data (17 routes)
`situations` (CRUD) | `documents` (upload, retrieve, extract) | `graph` (ingest, query) | `reports` (CRUD, export) | `settings/ai` | `tool-data` | `sources` | `data/conflicts` | `data/geospatial` | `export`

### System (5 routes)
`health` | `stripe/checkout` | `stripe/webhook` | `cron/check-alerts` | `cron/generate-briefing`

### Admin (3 routes)
`admin/add-credits` (self-service +1000 via Debug Panel) | `admin/set-all-credits` (bulk reset, CRON_SECRET required) | `account` (GDPR Art. 17 erasure — cascade-deletes all user data)

---

## Credit System

New users receive **5,000 credits** on sign-up. Demo users have unlimited credits (shown as ∞).

| Tier | Cost | Operations |
|------|------|------------|
| 1 credit | Basic | Chat, terminology check, canonical name lookup |
| 2 credits | Standard | Scenario, media roundup, talking points, commitment scan, morning digest |
| 3 credits | Analysis | Risk assessment, actor profiles, negotiation, mediation, power map, info environment, web crawl |
| 4 credits | Deep | Claude analysis, dossier, briefing generation, treaty analysis, sanctions scan, peace agreement analyzer, PoC assessment |
| 5 credits | Research | Report generation, deep research |
| 8 credits | Advisory | Advisor panel discussion (parallel calls + synthesis) |
| 10 credits | Agent | Deep Research Agent (Vertex AI ADK, 3-phase pipeline) |

Credits are pre-deducted before AI calls and refunded on error (atomic Firestore transaction).

---

## Security

| Layer | Mechanism |
|-------|-----------|
| **Authentication** | Firebase Auth — Google OAuth + email/password. Session in `httpOnly` `secure` `sameSite=lax` cookie |
| **Token verification** | All API routes use `withAuth()` — verifies Firebase ID token via Admin SDK (`verifyIdToken`) |
| **Session cookie** | `tacitus-auth-session` — stores raw Firebase ID token (not Firebase session cookie). 24h expiry |
| **Token refresh** | Client-side: `onIdTokenChanged` listener + proactive forced refresh at 50 min (tokens expire at 60 min) |
| **CSRF** | Origin vs `x-forwarded-host` / `host` comparison on session POST. Rejects cross-origin requests with 403 |
| **Rate limiting** | 100 req/min per user (in-memory, per Vercel function cold start) |
| **Firestore rules** | Owner-only: `auth.uid == uid`. Credit writes server-only (Admin SDK). Demo data never touches production |
| **Password reset** | Firebase `sendPasswordResetEmail`. Response is always success for unknown emails (prevents enumeration) |
| **Demo isolation** | Demo cookie never touches Firebase. Separate session branch in middleware |

---

## Situation-Driven Data Model

Every piece of data belongs to a user-created situation:

```
Firestore:
  users/{uid}/
    profile (credits, role, orgId, subscription, consent fields)
    situations/{situationId}/
      metadata         — name, type, region, actors, risk score, Glasl stage
      conflict-grammar — extracted ACO v2.0 entities (8 core + 6 extended)
      graph            — nodes + edges (ConflictGraphSchema)
      documents/{id}   — uploaded files + RAG extraction results
      reports/{id}     — generated reports
      scenarios/{id}   — what-if analyses
      chats/{id}       — conversation history (tool calls + responses)
      briefings/{id}
      dossiers/{id}
      talking-points/{id}
      risk-assessments/{id}
      timeline-events/{id}
      stakeholder-map
      negotiation-preps/{id}
      media-analyses/{id}
      treaty-analyses/{id}
      sanctions-scans/{id}
```

All tool pages call `useSituationGuard()` — if no situation is active, they render `<NoSituationState />` prompting the user to create or select one.

---

## Conflict Grammar (ACO v2.0)

The 14-entity conflict grammar is the backbone of PRAXIS's knowledge representation:

**Core 8**: Actor · Claim · Interest · Constraint · Leverage · Commitment · Event · Narrative

**Extended 6**: Institutions · Norms · Resources · Risks · Policies · Grievances

Defined as Zod schemas in `src/lib/ai/schemas/conflict-grammar.ts`. Every structured AI output is typed against these schemas.

---

## Visualization Components

10 reusable SVG/D3 dark-theme components in `src/components/visualizations/`:

| Component | Uses | Used by |
|-----------|------|---------|
| `RiskGauge` | SVG arc, animated stroke-dashoffset | Dashboard, Risk Monitor |
| `RadarChart` | SVG spider, animated polygon | Dashboard, Risk Monitor |
| `EscalationLadder` | Glasl 9-stage, interactive | Dashboard, Early Warning |
| `ProbabilityTree` | SVG BFS tree, probability-colored nodes | Scenarios |
| `TornadoChart` | Horizontal sensitivity bars | Risk Monitor |
| `SankeyFlow` | Layered column flow, curved fill paths | Scenarios |
| `TimeSeriesChart` | SVG multi-series, ResizeObserver responsive, hover crosshair | Risk Monitor, Early Warning |
| `HeatmapGrid` | RGB lerp color interpolation | Early Warning |
| `ForceGraph` | D3 v7, force simulation, drag+zoom | Stakeholder Map, Conflict Graph |
| `ComplianceTracker` | Progress bar, collapsible categories | Treaty Analyzer, Commitments |

Import individually for tree-shaking: `import { RiskGauge } from '@/components/visualizations/risk-gauge'`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5.9 (strict mode) |
| Styling | Tailwind CSS 4 (`@theme inline` CSS variables), Radix UI |
| AI SDK | Vercel AI SDK 6.0.105 |
| AI Providers | Google Gemini 2.5 Flash/Pro, Anthropic Claude Sonnet 4, Vertex AI Agent Engine (ADK) |
| Auth & DB | Firebase Auth + Firestore + Admin SDK |
| State | Zustand 5 (persisted) |
| Validation | Zod 4 |
| Visualization | D3.js 7, react-leaflet (Geospatial Monitor) |
| Animation | Framer Motion 12 |
| Documents | pdf-parse, mammoth, docx, jspdf |
| Web Research | Firecrawl |
| Payments | Stripe |
| Deployment | Vercel (iad1 region, Node.js 24.x) |

---

## Firebase Setup

**Project ID**: `praxisbytacitus`

1. Firebase Console → Authentication → Sign-in method → Enable **Google** and **Email/Password**
2. Authentication → Settings → Authorized domains → add your domain
3. Project Settings → Service Accounts → Generate new private key → set as `FIREBASE_SERVICE_ACCOUNT_KEY` in Vercel
4. Deploy security rules and indexes:

```bash
firebase use praxisbytacitus
firebase deploy --only firestore:rules,firestore:indexes
```

**Verify the setup is working:**
```
GET https://your-domain/api/auth/test-firebase
```
Expected: `{"diagnosis":"✅ Email/Password auth is ENABLED", "adminSdkStatus":"INITIALIZED_OK"}`

---

## Deployment

PRAXIS deploys to **Google Cloud Run** (no Vercel). Both services run as containers.

### One-command deploy (Cloud Build)

```bash
# First time: enable GCP APIs, create BigQuery dataset, Pub/Sub topics, etc.
bash infrastructure/setup-gcp.sh

# Deploy both services (backend first, then frontend with backend URL injected)
bash infrastructure/deploy.sh
# Equivalent: gcloud builds submit --config=cloudbuild.yaml
```

### Deploy individual services

```bash
bash infrastructure/deploy-backend.sh   # Python FastAPI on Cloud Run
bash infrastructure/deploy-frontend.sh  # Next.js on Cloud Run
```

### Custom domain

```bash
gcloud run domain-mappings create --service=praxis-frontend \
  --domain=praxis.tacitus.me --region=us-central1
```

### Local build verification

```bash
npm run build     # Production Next.js build
npx tsc --noEmit  # TypeScript check
cd backend && python -m pytest tests/ -v  # Python tests
```

---

## Documentation

| File | Purpose |
|------|---------|
| [docs/AUTH.md](./docs/AUTH.md) | Auth architecture — token lifecycle, CSRF, session design |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Dual-app architecture, route structure, data flow |
| [CHANGELOG.md](./CHANGELOG.md) | Full version history (v3.7.0 → present) |
| [CLAUDE.md](./CLAUDE.md) | AI-assistant guide — comprehensive codebase reference |
| [TOOL_AUDIT.md](./TOOL_AUDIT.md) | Tool-by-tool wiring audit |

---

## Cron Jobs

| Job | Schedule | Route |
|-----|----------|-------|
| Alert check | 06:00 UTC daily | `POST /api/cron/check-alerts` |
| Briefing generation | 05:00 UTC daily | `POST /api/cron/generate-briefing` |

Both require `Authorization: Bearer {CRON_SECRET}` header (set automatically by Vercel).

---

## Scripts

```bash
npm run dev    # Development server with Turbopack (port 3000)
npm run build  # Production build
npm start      # Production server
npm run lint   # ESLint
npm test       # Vitest unit tests
```

---

Built by [TACITUS](https://tacitus.me) · Contact: giulio@tacitus.me
