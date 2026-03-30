# PRAXIS by TACITUS

**The conflict operating system for peace and security professionals.**

AI-powered conflict intelligence, knowledge graphs, and automated report generation — from raw data to decisive intelligence in minutes. 42 tool pages, 59 API routes, 21 AI-powered chat tools, situation-driven data pipeline, real-time intelligence feeds.

> **v3.9.1** — Build 2026.03.30 | Deployed at [praxis.tacitus.me](https://praxis.tacitus.me)

---

## Quick Start

```bash
git clone https://github.com/sargonxg/PRAXIS_NEXTJS_TACITUS.git
cd PRAXIS_NEXTJS_TACITUS
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The demo works with zero configuration.

### Environment Setup

Copy `.env.local.example` to `.env.local` and configure:

```bash
# Required for live AI (demo works without)
GOOGLE_AI_API_KEY=your_key

# Required for server-side Firestore (auth, situations, persistence)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"praxisbytacitus",...}

# Optional — enables Claude deep analysis
ANTHROPIC_API_KEY=your_key

# Optional — enables web research crawling
FIRECRAWL_API_KEY=your_key

# Optional — Vercel cron job auth
CRON_SECRET=your_secret
```

---

## Two Experiences

| | Demo (`/demo/*`) | Real App (`/app/*`) |
|---|---|---|
| **Auth** | Cookie-only, no account needed | Firebase Google + email/password |
| **Data** | Pre-loaded Nordalia Crisis | User creates own situations |
| **AI** | Cached demo responses | Live Gemini Pro / Claude + Firecrawl |
| **Credits** | Unlimited | 100 on sign-up, deducted per use |
| **Persistence** | In-memory (Zustand) | Firestore (user-scoped) |
| **Purpose** | Investor demos, exploration | Real conflict intelligence work |

---

## Platform Architecture

```
src/
  app/
    (landing)/          Public landing page
    (auth)/             Login (Google + email/password + demo)
    app/                42 authenticated workspace pages
    demo/               30 demo pages (Nordalia Crisis)
    api/                59 API routes (auth + AI + data + system)

  components/
    ui/                 Radix UI primitives
    shared/             Cross-app reusable components
    app/                Shell, header, sidebar
    praxis/             AiPopulate, situation states, error states
    assistant/          Chat interface
    graph/              D3.js conflict graph
    reports/            Report composer & export
    negotiation/        ZOPA visualizer
    media/              Media analysis
    landing/            Landing page sections
    onboarding/         Wizards & tooltips

  lib/
    ai/                 Providers, 21 tools, prompts, schemas, Firecrawl
    firebase/           Config, admin, Firestore services (9 service files)
    api/                withAuth, withCredits, validation, error handling
    auth/               AuthProvider context
    analytics/          Risk engine, escalation scorer
    data-feeds/         ACLED, GDELT, HDX, ReliefWeb, World Bank, aggregator
    services/           AI orchestration, export, document, situation init
    constants/          Demo data, case registry, pricing, templates
    subscription/       Tier configs & feature gates
    demo/               Demo mode detection, cached responses
    utils/              Routes, formatting, streaming

  stores/              Zustand: situation, app, conflict, report, prefs
  hooks/               Situation guard, API streaming, keyboard, persisted data
  types/               Situation, conflict grammar, report, API types
```

---

## Tool Pages (42 in Real App)

### Situation Room
| Tool | Route | Description |
|------|-------|-------------|
| Dashboard | `/app/dashboard` | Overview with risk scores, Glasl stage, AI suggestions |
| Early Warning | `/app/early-warning` | Glasl escalation tracking with de-escalation windows |
| Risk Monitor | `/app/risk-monitor` | INFORM Risk Index (5 dimensions) |
| Conflict Graph | `/app/conflict-graph` | D3.js knowledge graph (actors, events, claims, edges) |
| Stakeholder Map | `/app/stakeholder-map` | Mitchell/Agle/Wood power-legitimacy-urgency mapping |
| Actor Profiles | `/app/actors` | Deep actor intelligence with Fisher/Ury framework |

### Analysis & Drafting
| Tool | Route | Description |
|------|-------|-------------|
| PRAXIS Assistant | `/app/assistant` | AI chat with 21 tools, super-agent mode |
| Report Studio | `/app/reports` | DOCX/PDF generation with UN templates |
| Dossier Generator | `/app/dossier` | AI-generated actor/event dossiers |
| Talking Points | `/app/talking-points` | UNSC briefing prep with Q&A |
| Scenario Planner | `/app/scenarios` | Streaming scenario modeling |
| Negotiation Prep | `/app/negotiation-prep` | ZOPA/BATNA analysis (Fisher/Ury) |
| CONCORDIA | `/app/concordia` | Mediation design tool |
| Mediation Designer | `/app/mediation-design` | Berghof process framework |
| Briefing Room | `/app/briefing` | Briefing with speaker notes |
| Daily Brief | `/app/auto-briefings` | Auto-generated intelligence briefs |

### Intelligence Tools
| Tool | Route | Description |
|------|-------|-------------|
| ARGUS Intelligence | `/app/argus` | Deep web research with Firecrawl |
| Media Compass | `/app/media-compass` | Source bias & reliability mapping |
| Media Roundup | `/app/media-roundup` | Daily media summary with sentiment |
| Info Environment | `/app/info-environment` | NATO STRATCOM assessment |
| Commitment Tracker | `/app/commitments` | Compliance monitoring |
| Treaty Analyzer | `/app/treaty-analyzer` | Clause analysis & ambiguity flagging |
| Sanctions Tracker | `/app/sanctions` | Sanctions exposure with escalation scan |
| Calendar Monitor | `/app/calendar` | Diplomatic event calendar |
| Alert Center | `/app/alerts` | GDELT-based early warning alerts |
| UN Toolkit | `/app/un-toolkit` | UNSC resolution builder + terminology checker |
| Compare | `/app/compare` | Comparative conflict analysis |
| Advisory Council | `/app/advisory` | Multi-actor perspective chatbot |

### Workspace
| Tool | Route | Description |
|------|-------|-------------|
| Documents | `/app/documents` | Upload PDF/DOCX/TXT/MD with RAG chunking |
| Case Library | `/app/cases` | Situation browser |
| Sources | `/app/sources` | Intelligence feed library |
| Team Hub | `/app/team` | Team collaboration (coming soon) |
| Settings | `/app/settings` | AI model, temperature, custom instructions |

---

## AI Pipeline

### Model Tiers
| Function | Model | Purpose |
|----------|-------|---------|
| `getModel()` | gemini-2.5-flash | Chat, terminology, lightweight tasks |
| `getProModel()` | gemini-2.5-pro | All structured tool generation |
| `getAnalysisModel()` | claude-sonnet-4 | Deep analysis, bias detection (falls back to Pro) |
| `getGroundedModel()` | gemini-2.5-flash + Google Search | Research with grounding |

### 21 Chat Tools
All tools use `generateObject()` with Zod schemas for structured output. Available to the AI assistant via tool-calling:

`webSearch` | `analyzeDocument` | `queryConflictGraph` | `draftSection` | `editForDiplomaticTone` | `analyzeMediaSource` | `compareMediaCoverage` | `checkUNTerminology` | `draftResolutionLanguage` | `generateTalkingPoints` | `escalationAssessment` | `negotiationSpaceAnalysis` | `narrativeEcosystemMap` | `historicalParallelAnalysis` | `generateTimeline` | `sanctionsCheck` | `humanitarianSnapshot` | `compareConflicts` | `canonicalNameLookup` | `deepSourceResearch` | `verifyAndStandardize`

### Analytical Frameworks
- **INFORM Risk Index** — 5-dimension conflict risk scoring
- **Glasl Escalation Model** — 9-stage escalation pathway
- **Fisher/Ury** — ZOPA/BATNA negotiation analysis
- **Mitchell/Agle/Wood** — Stakeholder power-legitimacy-urgency
- **CRAAP Test** — Media reliability scoring
- **NATO STRATCOM** — Information environment assessment
- **Berghof** — Mediation process design
- **UN Editorial Manual** — Diplomatic language standards
- **UN DPPA** — Morning brief format
- **OCHA** — Humanitarian standards

### Live Data Feeds
| Feed | Type | Auth |
|------|------|------|
| GDELT | Events, tone, instability index | Free |
| ReliefWeb | UN humanitarian reports | Free |
| HDX HAPI | Food security, displacement | Free |
| World Bank | GDP, inflation, military spend | Free |
| ACLED | Armed conflict events | API key |
| Firecrawl | Custom URL scraping | API key |

---

## API Routes (59 total)

### AI Generation (34 routes)
All wrapped with `withAuth()` (JWT verification + rate limiting) and `checkAndDeductCredits()`.

**Core**: `chat`, `research`, `deep-research`, `grounded-search`, `claude-analyze`
**Structured Analysis**: `risk-assessment`, `actor-profiles`, `actor-brief`, `actor-enrichment`, `power-map`, `escalation-scan`, `scenario`, `commitment-scan`, `sanctions-scan`, `treaty-analyze`, `negotiation`, `mediation`, `mediation-design`, `info-environment`
**Content Generation**: `report`, `briefing-generate`, `auto-briefing`, `dossier-generate`, `talking-points`, `resolution`, `terminology`
**Research**: `argus`, `media-scan`, `media-roundup`, `media-analyze`, `discover-sources`, `extract`, `auto-structure`, `advisor-chat`

### Data Routes (17 routes)
`situations` (CRUD) | `documents` (upload, retrieve, extract) | `graph` (ingest, query) | `reports` (CRUD, export) | `settings/ai` | `tool-data` | `sources` | `data/conflicts` | `export`

### System Routes (8 routes)
`auth/login` | `auth/session` | `auth/logout` | `health` | `stripe/checkout` | `stripe/webhook` | `cron/check-alerts` | `cron/generate-briefing`

---

## Credit System

| Operation | Credits |
|-----------|---------|
| Chat message | 1 |
| Terminology check | 1 |
| Document extraction | 3 |
| Scenario modeling | 3 |
| Risk assessment | 3 |
| Negotiation prep | 3 |
| Mediation design | 3 |
| Actor profiles | 3 |
| Power map | 3 |
| Info environment | 3 |
| Briefing generation | 3 |
| Media scan | 2 |
| Sanctions scan | 2 |
| Commitment scan | 2 |
| Auto-briefing | 2 |
| Dossier generation | 4 |
| Research query | 5 |
| Full report | 5 |

New users receive **100 credits** on sign-up. Demo users have unlimited credits.

---

## Security

- **Authentication**: Firebase Auth (Google + email/password), JWT in httpOnly secure cookie
- **API Protection**: All routes wrapped with `withAuth()` — verifies Firebase ID tokens via Admin SDK
- **Rate Limiting**: 100 requests/minute per user (in-memory)
- **Credit System**: Pre-deduction before AI calls, refund on error
- **Firestore Rules**: Owner-only access (`auth.uid == uid`), server-only credit writes
- **Demo Isolation**: Demo data never touches production Firestore
- **Session**: `tacitus-auth-session` cookie, 24h expiry, httpOnly + secure + sameSite=lax

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5.9 (strict mode) |
| Styling | Tailwind CSS 4, Radix UI |
| AI | Vercel AI SDK 6.0, Google Gemini, Anthropic Claude |
| Auth & DB | Firebase Auth + Firestore + Admin SDK |
| State | Zustand 5 (persisted) |
| Validation | Zod 4 |
| Visualization | D3.js 7 |
| Animation | Framer Motion 12 |
| Documents | pdf-parse, mammoth, docx, jspdf |
| Web Research | Firecrawl |
| Payments | Stripe |
| Analytics | Vercel Analytics |
| Testing | Vitest 4 |
| Deployment | Vercel (iad1 region) |

---

## Firebase Setup

Project: `praxisbytacitus`

1. Enable Authentication: Google + Email/Password
2. Add your domain to Firebase Auth > Authorized domains
3. Generate service account key: Firebase Console > Project Settings > Service Accounts
4. Set `FIREBASE_SERVICE_ACCOUNT_KEY` in Vercel with the JSON contents
5. Deploy Firestore rules and indexes:
   ```bash
   firebase use praxisbytacitus
   firebase deploy --only firestore:rules,firestore:indexes
   ```

---

## Deployment

Deployed on Vercel (iad1). Push to `main` triggers automatic deployment.

```bash
npm run build     # Verify build passes locally
npm run lint      # ESLint check
npx tsc --noEmit  # Type check
git push          # Auto-deploys to Vercel
```

### Vercel Configuration
- Function timeouts: AI routes 60s, document upload 300s
- Cron: alerts at 06:00 UTC, briefings at 05:00 UTC
- Node.js 24.x

---

## Documentation

| File | Purpose |
|------|---------|
| [CLAUDE.md](./CLAUDE.md) | Architecture guide for AI assistants & developers |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [TOOL_AUDIT.md](./TOOL_AUDIT.md) | Complete tool-by-tool wiring audit |
| `.env.local.example` | Environment variable template |
| `firestore.rules` | Firestore security rules |

---

## Scripts

```bash
npm run dev       # Development server (port 3000)
npm run build     # Production build
npm start         # Production server
npm run lint      # ESLint
npm test          # Vitest unit tests
```

---

Built by [TACITUS](https://tacitus.me) | Contact: giulio@tacitus.me
