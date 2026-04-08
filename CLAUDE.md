# PRAXIS — Conflict Intelligence Platform by TACITUS

> Version 6.2.0 — Pure GCP Cloud Run · Dual-service: Next.js + Python FastAPI
> Project: `praxisbytacitus` (852128226674) · Region: `us-central1`
> Domain: praxis.tacitus.me

## What This Is

The "Bloomberg Terminal for conflict resolution." AI-native workspace for UN Political Affairs Officers, think tank analysts, and diplomatic mediators. Two experiences: a demo for prospects (`/demo/*`) and a real situation-driven workspace for authenticated users (`/app/*`). Deployed on GCP Cloud Run.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16 App Router)  →  Cloud Run         │
│    src/app/app/*   (38+ tool pages, auth required)      │
│    src/app/demo/*  (demo mode, cookie auth)             │
│    src/app/api/*   (73 API routes: AI, data, auth)      │
├─────────────────────────────────────────────────────────┤
│  Backend (Python FastAPI)  →  Cloud Run                 │
│    /api/v1/pipeline/*   (extract → build → analyze)     │
│    /api/v1/graph/*      (graph queries, temporal)       │
│    /api/v1/analyze/*    (pre-computed analysis)         │
├─────────────────────────────────────────────────────────┤
│  Firebase: Auth + Firestore (single source of truth)    │
│  GCP: Vertex AI · BigQuery · Cloud Storage · Pub/Sub    │
│       Cloud Functions · Cloud Scheduler · Secret Manager │
│       Artifact Registry · Cloud Build                   │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 16.1.6, TypeScript 5.9, React 19, Tailwind CSS 4, Radix UI, Zustand 5, D3.js 7, Framer Motion 12
- **Backend**: Python 3.11, FastAPI, NetworkX, Graspologic, Pydantic v2
- **AI**: AI SDK v6 (`@ai-sdk/google`, `@ai-sdk/anthropic`), Google Genkit (backend), Vertex AI ADK
- **Database**: Firebase Auth + Firestore, Neo4j/FalkorDB (graph), BigQuery (analytics)
- **Data Feeds**: ACLED, GDELT, UNHCR, UCDP, HDX, ReliefWeb, UN News, World Bank, Crisis Group, SIPRI

## File Structure

```
/                            Next.js frontend (root)
├── src/app/app/             Tool pages (38+ authenticated)
├── src/app/demo/            Demo mirror pages
├── src/app/api/             API routes (73 total)
│   ├── ai/                  35 AI tool routes
│   ├── auth/                Session, login, logout
│   ├── data/                Intelligence, geospatial, conflicts
│   ├── cron/                Scheduled jobs (alerts, briefings)
│   └── admin/               Credit management
├── src/lib/
│   ├── ai/                  providers.ts, tools.ts, vertex-agent.ts, prompts/
│   ├── auth/                auth-context.tsx (AuthProvider)
│   ├── firebase/            config.ts, admin.ts, firestore.ts, situations-service.ts
│   ├── api/                 with-auth.ts, with-credits.ts
│   ├── data-feeds/          11 source clients + feed-aggregator.ts
│   ├── analytics/           risk-engine.ts, escalation-scorer.ts, geospatial-engine.ts
│   └── constants/           tool-registry.ts, frameworks.ts, scenario-configs.ts
├── src/components/
│   ├── app/                 app-shell, sidebar, debug-panel, floating-praxis
│   ├── praxis/              no-situation-state, ai-populate, tool-info-panel
│   ├── visualizations/      10 SVG/D3 components (force-graph, risk-gauge, etc.)
│   └── assistant/           chat-interface, tool-invocation
├── src/hooks/               use-situation-guard, use-persisted-tool-data, etc.
├── src/stores/              Zustand stores (situation, app, debug, etc.)
├── backend/                 Python FastAPI
│   ├── graphify_tacitus/    ACO pipeline (extract→build→cluster→analyze→report→export)
│   ├── ai/                  genkit_app.py, flows.py
│   ├── services/            firestore_sync, graph_adapter, bigquery_client, graphiti_client
│   ├── routers/             pipeline.py, graph.py, analyze.py
│   ├── config.py            Pydantic BaseSettings
│   ├── auth.py              Firebase token verification
│   └── main.py              FastAPI app entry
├── cloud_functions/         GCP Cloud Functions
│   ├── on_situation_created/  Auto-trigger pipeline on new situation
│   ├── on_document_uploaded/  Extract text + run pipeline
│   └── gdelt_poller/         Scheduled GDELT feed ingestion (every 15min)
├── infrastructure/
│   ├── setup-gcp.sh         One-time project setup (APIs, BigQuery, Pub/Sub, IAM)
│   ├── deploy.sh            Full deploy via Cloud Build
│   ├── deploy-backend.sh    Backend only
│   ├── deploy-frontend.sh   Frontend only
│   └── deploy-windows.ps1   Windows PowerShell deploy
└── cloudbuild.yaml          CI/CD: build backend → deploy → get URL → build frontend → deploy
```

## Firestore Data Model

```
users/{uid}/
  (profile)            { credits, email, name, role, subscription }
  settings/
    api_keys           { google_ai_key, anthropic_key, openai_key, firecrawl_key }
    model_preferences  { fast_analysis, deep_analysis, creative_drafting, research }
    graph_backend      { provider, uri, host, port, user, password }
  situations/{sitId}/
    (metadata)         { name, type, region, actors, status, riskScore, glaslStage }
    graph/
      main             { nodes[], edges[] }
      analysis         { pivotActors, factionMap, hiddenLinkages, escalation }
    tools/{toolName}   { generatedAt, ...tool-specific fields }
    documents/{docId}  { name, extractedText, uploadedAt }
    reports/{rptId}    { title, content, createdAt }
credit_transactions/{txId}  { userId, type, amount, description, createdAt }
```

## ACO — Agentic Conflict Ontology

**8 Primitive Types:** Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative
**42 Typed Relationships** — See `backend/graphify_tacitus/schemas/relationships.py`

**Colors:** Actor `#4E79A7` · Claim `#F28E2B` · Interest `#59A14F` · Constraint `#E15759` · Leverage `#EDC948` · Commitment `#76B7B2` · Event `#B07AA1` · Narrative `#FF9DA7`

## Key Flows

### Authentication
```
Login → Firebase Auth (Google redirect | email/password | demo cookie)
  → onAuthStateChanged → syncTokenCookie → POST /api/auth/session
  → ensureUserProfile() → 5,000 initial credits
  → middleware.ts checks JWT on /app/* routes
```

### Situation Creation + Pipeline
```
User creates situation (with source URLs)
  → Firestore write → on_situation_created Cloud Function triggers
  → POST /api/v1/pipeline/run
  → extract (Gemini) → build (NetworkX) → cluster (Leiden)
  → analyze (7 functions) → report → export
  → Firestore sync → BigQuery log
  → Frontend onSnapshot updates in real-time
```

### Tool Page Pattern
```
Tool page → useSituationGuard() → usePersistedToolData(toolId, sitId)
  → Firestore read (cached per situation:tool)
  → User clicks Regenerate → POST /api/ai/{tool-name}
  → withAuth → checkAndDeductCredits → buildGraphContext + buildToolContext
  → AI generates structured output → Firestore write → onSnapshot → UI updates
```

## AI Model Tiers

| Function | Model | Used For |
|---|---|---|
| `getModel()` | gemini-2.5-flash | Chat, terminology, quick tasks |
| `getProModel()` | gemini-2.5-pro | Structured tool generation |
| `getAnalysisModel()` | claude-sonnet-4 | Deep analysis (falls back to Pro) |
| `getGroundedModel()` | gemini-2.5-flash + Search | Grounded research |
| Vertex ADK | Reasoning Engine | Deep Research Agent |

## TACITUS Credits

5,000 on signup. Costs: 1 (chat) → 10 (deep search agent). Demo: unlimited.
Authoritative source: `src/lib/api/with-credits.ts`
Deducted atomically via Firestore transactions. Real-time sync via onSnapshot.

## GCP Services Used

| Service | Purpose | Config |
|---|---|---|
| Cloud Run | Frontend + Backend containers | 0-10 instances, 300s timeout |
| Artifact Registry | Docker images | us-central1-docker.pkg.dev/praxisbytacitus/praxis |
| Cloud Build | CI/CD pipeline | cloudbuild.yaml, E2_HIGHCPU_8 |
| Firestore | Auth, data, real-time sync | Native mode, owner-only rules |
| Firebase Auth | Google + email/password + demo | Session cookies (httpOnly) |
| Vertex AI | ADK Deep Research Agent | us-central1, Reasoning Engine |
| BigQuery | Pipeline analytics | praxis_analytics dataset |
| Cloud Storage | Document uploads | gs://praxisbytacitus-praxis-uploads |
| Pub/Sub | Async event messaging | 4 topics (pipeline, extract, ingest, alert) |
| Cloud Functions | Event triggers | 3 functions (situation, document, GDELT) |
| Cloud Scheduler | Cron jobs | GDELT (15min), alerts (6am), briefing (5am) |
| Secret Manager | Sensitive config | 4 secrets (firebase-sa, ai-key, cron, cookie) |

## Tool Categories (40 tools)

| Category | Tools |
|---|---|
| **Context** | Dashboard, Documents, Sources Library, Timeline, Humanitarian, Calendar, Conflict Graph |
| **Analysis** | Risk Monitor, Early Warning, Actor Profiles, Stakeholder Map, Power Map, Info Environment, Compare |
| **Drafting** | Assistant, Report Studio, Dossier, Talking Points, Briefing Room, Daily Brief, UN Toolkit |
| **Simulation** | Scenarios, Negotiation Prep, Game Theory, CONCORDIA, Mediation Designer |
| **Intelligence** | Deep Research Agent, ARGUS, Media Compass, Media Roundup, Geospatial, Sanctions, Commitments, Treaty, Alert Center, Deep Research |
| **Workspace** | Cases, Team, Advisory, Settings |

## Analytical Frameworks (15)

Glasl Escalation, Fisher-Ury, INFORM Risk Index, Barnett-Duvall Power, Zartman Ripeness, Stedman Spoilers, Mitchell-Agle-Wood Salience, OCHA Humanitarian, IPC Food Security, Lederach Pyramid, Galtung Triangle, UN DPPA Brief, Berghof Mediation, Putnam Two-Level, Fearon Rationalist War.
Source: `src/lib/constants/frameworks.ts`

## Deployment

```bash
# One-time GCP setup
./infrastructure/setup-gcp.sh

# Full deploy (Cloud Build: backend → frontend)
./infrastructure/deploy.sh

# Individual services
./infrastructure/deploy-backend.sh
./infrastructure/deploy-frontend.sh

# Windows
./infrastructure/deploy-windows.ps1
```

## Environment Variables

See `.env.example` for complete list. Critical:
- `FIREBASE_SERVICE_ACCOUNT_KEY` — Admin SDK JSON string
- `GOOGLE_AI_API_KEY` — Gemini API key
- `NEXT_PUBLIC_PRAXIS_BACKEND_URL` — Backend Cloud Run URL (auto-set by Cloud Build)
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` — Graph database
- `VERTEX_AGENT_ENGINE_ID` — Deep Research Agent engine
- `CRON_SECRET` — Cron + admin auth
- `COOKIE_SIGNING_SECRET` — Session cookie HMAC

## Conventions

- `PraxisLink` / `usePraxisRoute()` for all navigation (auto-prefixes /app or /demo)
- `useSituationGuard()` at top of every tool page
- `withAuth()` wraps all protected API routes
- `checkAndDeductCredits()` before AI calls
- `usePersistedToolData()` for tool output caching
- `middleware.ts` for route protection (NOT proxy.ts)
- All AI routes: `generateText + Output.object()` with Zod schemas

## Design System

**Colors**: Navy `#0F172A` · Emerald `#10B981` · Gold `#E8B931` · Diplomatic Blue `#1B3A5C`
**Typography**: EB Garamond (headings) · Inter (body) · JetBrains Mono (code)

## Running Tests

```bash
# Backend
cd backend && pip install -e ".[dev]" && python -m pytest tests/ -v

# Frontend type check
npx tsc --noEmit
```

## Local Development

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend + Neo4j + FalkorDB
docker-compose up

# Backend health check
curl http://localhost:8080/health
```
