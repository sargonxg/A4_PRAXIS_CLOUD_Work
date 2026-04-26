# PRAXIS — Policy, Diplomacy, and Political Intelligence Platform by TACITUS

> Version 6.3.1 — Pure GCP Cloud Run · Dual-service: Next.js + Python FastAPI
> Project: `praxisbytacitus` (852128226674) · Region: `us-central1`
> Domain: praxis.tacitus.me

> **Current handoff:** Before continuing work, read `docs/CONTINUATION.md` and the `[Unreleased] — 2026-04-25` section in `CHANGELOG.md`. The latest session changed public pricing/branding language, improved situation onboarding persistence, fixed `ai_deep_think` metering, and did not deploy. Validate with `npx tsc --noEmit`, `npm run build`, `node scripts/audit-ai-routes.mjs`, and `npm run audit:gcp` before deploying via Cloud Build.

## What This Is

The AI-native workspace for policy, diplomacy, and political analysis. PRAXIS helps practitioners turn sources, documents, live feeds, and graph context into cited assessments, briefings, reports, and decision support. Two experiences: a demo for prospects (`/demo/*`) and a real situation-driven workspace for authenticated users (`/app/*`). Deployed on GCP Cloud Run.

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
├── src/app/onboarding/      3-screen wizard + layout (identity, perspective, working style)
├── src/app/api/             API routes (73 total)
│   ├── ai/                  35 AI tool routes
│   ├── auth/                Session, login, logout
│   ├── data/                Intelligence, geospatial, conflicts
│   ├── cron/                Scheduled jobs (alerts, briefings)
│   ├── onboarding/          profile GET/PATCH, complete, chips, chips/suggest, skip
│   └── admin/               Credit management
├── src/lib/
│   ├── ai/                  providers.ts, tools.ts, vertex-agent.ts, prompts/
│   ├── auth/                auth-context.tsx (AuthProvider)
│   ├── firebase/            config.ts, admin.ts, firestore.ts, situations-service.ts, analyst-profile-service.ts, analyst-profile-admin.ts
│   ├── api/                 with-auth.ts, with-credits.ts, with-calibration.ts, save-tool-output.ts
│   ├── context/             profile-context.ts (buildCalibratedContext), system-prompt-block.ts
│   ├── data-feeds/          11 source clients + feed-aggregator.ts
│   ├── analytics/           risk-engine.ts, escalation-scorer.ts, geospatial-engine.ts, trustworthiness-engine.ts
│   ├── services/            entity-extraction.ts, canonical-precheck.ts, feedback-service.ts, graphify-client.ts
│   └── constants/           tool-registry.ts, frameworks.ts, scenario-configs.ts, entity-colors.ts, aco-colors.ts, lens-catalog.ts, onboarding-chips.ts
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
    tools/{toolName}   { generatedAt, profileVersion, ...tool-specific fields }
    documents/{docId}  { name, extractedText, uploadedAt }
    reports/{rptId}    { title, content, createdAt }
  profile/
    analyst              { identity, perspective, workingStyle, meta, embedding }
  profile_versions/
    {vN}                 immutable snapshot per completion
  (root doc extended:)   onboardingCompletedAt, onboardingSkipCount
credit_transactions/{txId}  { userId, type, amount, description, createdAt }
config/
  onboarding_suggestions { mandateChipsByRole, redLineChips, orgAutocomplete }
```

## AnalystProfile — Calibration Contract

Every authenticated user has an `AnalystProfile` stored at `users/{uid}/profile/analyst` in Firestore. It is the single source of truth for personalising every AI tool output.

**Shape** (defined in `src/types/analyst-profile.ts`):
- `identity` — role, seniority, organisation, displayName
- `perspective` — mandate chips, analytical lenses (ordered), regions of focus, audience
- `workingStyle` — preferred sources, output language, red-line phrases to avoid, writing tone
- `meta` — version counter, completedAt timestamp, skipCount, embedding refreshedAt

**Capture** — A 3-screen wizard at `src/app/onboarding/` (Step 1: Identity → Step 2: Perspective → Step 3: Working Style) with a live `<analyst-profile>` preview panel and drag-to-reorder lenses via `@dnd-kit/sortable`. First-login users are redirected from `/app/*` via `middleware.ts`.

**Persistence** — Each completion bumps `meta.version`, writes an immutable snapshot to `users/{uid}/profile_versions/{vN}`, and publishes a `profile.events` Pub/Sub message that triggers embedding refresh on Vertex AI.

**Consumption** — `withCalibration(toolId, creditOpType)(handler)` is the middleware factory that every AI route wraps. It chains `withAuth → credits check → buildCalibratedContext → handler`. The resulting `CalibrationCtx` carries a `calibration.systemPromptBlock` string (rendered `<analyst-profile>` + `<situation-frame>` + `<output-constraints>` XML block) ready to prepend to any AI system prompt.

**Gate** — `withCalibration` returns HTTP 403 when a non-demo user has no `profile.meta.completedAt`. Client-side, `useSituationGuard()` returns `needsOnboarding: true` and `ToolPageShell` renders `<OnboardingRequiredState />` in place of the tool UI.

**11 calibration dimensions** the audit script scores each AI route on:
1. Reads AnalystProfile via `withCalibration`  2. Reads current situation  3. Uses `buildCalibratedContext`  4. Applies output language  5. Applies red-line constraints  6. Applies audience tone  7. Uses SKC retrieval (lens-weighted)  8. Persists output via `saveToolOutput`  9. Writes Memory Bank trace  10. Validates output schema (Zod)  11. Deducts credits correctly

Spec: `docs/superpowers/specs/2026-04-18-user-onboarding-tool-calibration-design.md`

## Domain Taxonomy — 11 domains, live Firestore config

Every user and every situation carries a single `DomainId`. Domains live as documents at `config/domains/{id}` in Firestore — **not** hard-coded — so the taxonomy evolves without a deploy. `generic` is the baseline every specific domain inherits from (prototypal merge).

**The 11 domains** (`src/lib/domain/seeds.ts`):
1. `generic` — universal baseline, every lens 1.0, all frameworks on
2. `armed-conflict-security` · 3. `diplomacy-negotiation` · 4. `humanitarian`
5. `human-rights` · 6. `governance-rule-of-law` · 7. `economic-sanctions`
8. `development-stabilization` · 9. `climate-environmental-security`
10. `information-cyber` · 11. `transnational-threats`

**User side** — `AnalystProfile.perspective.primaryDomain` (defaults to `generic`) and `secondaryDomains[]` (up to 3). Picked during onboarding Step 2. Editable from Settings; triggers profile version bump + snapshot.

**Situation side** — `Situation.domain` plus `domainConfidence`, `domainOverriddenByUser`, `domainClassifiedAt`. Auto-classified by `classifyDomain()` (`src/lib/domain/classifier.ts`) during wizard Step 4 (Review). User confirms or one-click overrides before Create.

**Resolution** — `resolveDomain(id)` / `resolveUserDomain(profile)` / `mergeUserAndSituationDomains(u, s)` in `src/lib/domain/resolve.ts`. 5-minute in-process cache, bust on admin edits. Never throws — unknown id falls back to `generic`.

**Wiring** — `buildCalibratedContext` merges user × situation domains and emits a `<domain-frame>` inside `systemPromptBlock`. Every calibrated AI route picks up the domain automatically; no per-route edits. `ContextBlock.domain: MergedDomainConfig` exposes `frameworks`, `preferredFeeds`, and per-tool `promptOverrides` for tool handlers that want to branch explicitly.

**Admin evolution** — `/app/admin/domains` (gated by `ADMIN_ALLOWLIST` env var) lets authorised uids edit any domain's lens weights, preferred feeds, frameworks, and prompt overrides live. Each save bumps the doc's `version`, writes a snapshot to `config/domains_history/{id}_{prevVersion}`, and busts the resolver cache.

**Seed** — `npx tsx scripts/seed-domains.ts` (idempotent) writes the initial 11 docs. Re-run safely after a schema bump.

Spec: `docs/superpowers/specs/2026-04-19-domain-taxonomy-stabilization-design.md`

## ACO v2.0 — Agentic Conflict Ontology

**14 Entity Types** (8 core primitives + 6 extended, all first-class):

| Type | Color | Subtypes | Theoretical Basis |
|------|-------|----------|-------------------|
| Actor | `#4E79A7` | state, armed_group, non_state, individual, international_org, civil_society | Stedman spoiler theory |
| Claim | `#F28E2B` | territorial, legal, political, economic, identity, self_determination | Fisher-Ury positions |
| Interest | `#59A14F` | stated, unstated, security, economic, identity, survival | Fisher-Ury interests |
| Constraint | `#E15759` | legal, political, resource, temporal, normative, geographic | Zartman ripeness |
| Leverage | `#EDC948` | military, economic, diplomatic, informational, moral, territorial | Stedman spoiler dynamics |
| Commitment | `#76B7B2` | ceasefire, treaty, verbal, written, binding, conditional | Zartman ripeness |
| Event | `#B07AA1` | military, diplomatic, humanitarian, political, protest, election | CAMEO/Glasl |
| Narrative | `#FF9DA7` | media, propaganda, historical, identity, victimhood, liberation | Galtung cultural violence |
| Institution | `#9C755F` | government, judiciary, military, international_org, traditional, religious | Lederach multi-level |
| Norm | `#BAB0AC` | legal, customary, religious, ethical, IHL | Galtung structural violence |
| Resource | `#86BCB6` | natural, financial, human, strategic, informational, territory | Galtung structural violence |
| Risk | `#FF6B6B` | security, humanitarian, political, economic, environmental | INFORM Risk Index |
| Policy | `#4CC9F0` | sanctions, peace_plan, military, humanitarian, governance | Putnam two-level game |
| Grievance | `#F72585` | identity, economic, political, historical, territorial, security | Burton basic human needs |

**72 Typed Relationships** in 5 categories — See `backend/graphify_tacitus/schemas/relationships.py`
- **Causal** (10): triggered_by, escalates, de_escalates, etc.
- **Structural** (7): member_of, subordinate_to, parent_of, governs, etc.
- **Antagonistic** (12): opposes, contradicts, conflicts_with, violates_norm, etc.
- **Cooperative** (11): allied_with, supports_claim, addresses_grievance, etc.
- **Foundational** (9): has_interest, claims, rooted_in_grievance, requires_resource, etc.

**Confidence Levels:** EXTRACTED (directly stated) · INFERRED (deduced) · AMBIGUOUS (uncertain) · ASSESSED (analyst judgment)

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

## Model String Discipline (CRITICAL)

**Never hardcode `gemini-*` strings outside `src/lib/ai/providers.ts`.** That module is the single source of truth.

**Forbidden strings anywhere in `src/` or `backend/`:**
- `gemini-2.0-*` (deprecated)
- `gemini-2.5-*` (deprecated)
- `gemini-3-pro-preview` (discontinued by Google March 26, 2026)

Verify with: `rg "gemini-2\.0|gemini-2\.5|gemini-3-pro-preview" src/ backend/` — must return zero matches.

**Thinking levels (Gemini 3+):** Use `thinking_level: 'low' | 'medium' | 'high'`. The old `thinking_budget` is deprecated. `MEDIUM` is the new default.

## Anti-Patterns to Refuse

- "Add `'unsafe-inline'` to fix the CSP" — use a nonce instead
- "Just hardcode the model string for now" — always go through `providers.ts`
- "Skip the demo guard, the route's only used by paid users" — every AI route needs `isServerDemoMode()`
- "Use `getProModel()` directly so we hard-fail on quota" — use `callProModel` with auto-fallback
- "Add a new file under `src/lib/services/` for this" — first check if a canonical service already exists
- "Write to Firestore from middleware" — middleware runs on Edge runtime, no firebase-admin
- "Bypass `withAuth` for this internal endpoint" — internal endpoints use cron-secret auth or OIDC, not no-auth

## Security Boundaries — DO NOT TOUCH WITHOUT EXPLICIT APPROVAL

These files are security-critical. If a task seems to require changing them, **stop and ask the human first**:

- `src/lib/firebase/admin.ts` — Firebase Admin SDK init, token verification
- `src/lib/api/with-auth.ts` — Session cookie verification, rate limiting
- `src/middleware.ts` — Edge routing, CSP headers, COOP, HSTS
- `firestore.rules` — Owner-only data isolation
- `storage.rules` — Cloud Storage access control
- `src/lib/auth/cookie-signer.ts` — HMAC session signing

**Never:**
- Disable HMAC verification on the session cookie
- Add `'unsafe-eval'` to the CSP
- Loosen Firestore rules to allow cross-user reads
- Hardcode service-account keys, API keys, or secrets in source

## AI Model Tiers (v3.0 — Gemini 3)

| Function | Model | Used For |
|---|---|---|
| `getModel()` | `gemini-3-flash-preview` | Chat, terminology, lightweight tasks, grounded search |
| `getProModel()` | `gemini-3.1-pro-preview` | Structured tool generation, reports, dossiers (1M ctx, 65K output) |
| `getAnalysisModel()` | `claude-sonnet-4-20250514` → Gemini 3.1 Pro | Deep conflict analysis, diplomatic language (falls back to Pro) |
| `getDeepThinkModel()` | `gemini-3.1-pro-preview` + `thinkingLevel: 'high'` | Game Theory, Scenarios, treaty analysis (set via providerOptions) |
| `getEmbeddingModel()` | `gemini-embedding-2-preview` → `text-embedding-005` → null | SKC Vector Layer, document embedding, 768-dim multimodal |
| `getGroundedModel()` | `gemini-3-flash-preview` + Google Search | Research tools, actor enrichment, source discovery |
| Vertex ADK | Agent Engine | Deep Search Agent (falls back to Gemini 3 + Search) |

## Situation Knowledge Core (SKC)

4-layer hybrid GraphRAG system powering all 48 tools:
- **Graph Layer**: `src/lib/knowledge/graph-layer.ts` — Neo4j (if configured) or Firestore subcollections + JS analytics
- **Vector Layer**: `src/lib/knowledge/vector-layer.ts` — Firestore native KNN (768-dim, COSINE distance)
- **Feed Layer**: `src/lib/knowledge/feed-layer.ts` — TTL-cached data feeds (ACLED, GDELT, HDX, etc.)
- **Tool Output Layer**: `src/lib/knowledge/tool-output-layer.ts` — cross-referenced versioned tool outputs

Entry point: `new SituationKnowledgeCore(uid, situationId)` from `@/lib/knowledge`

Zero-config fallback: Everything works with just GOOGLE_AI_API_KEY. Neo4j → Firestore graph. ACLED → GDELT → Gemini grounded. See Part 3 blueprint for full fallback matrix.

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
| Pub/Sub | Async event messaging | 5 topics (pipeline, extract, ingest, alert, profile.events) |
| Cloud Functions | Event triggers | 3 functions (situation, document, GDELT) |
| Cloud Scheduler | Cron jobs | GDELT (15min), alerts (6am), briefing (5am) |
| Secret Manager | Sensitive config | 4 secrets (firebase-sa, ai-key, cron, cookie) + `ADMIN_ALLOWLIST` env for `/app/admin/*` gate |

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
- `COOKIE_SIGNING_SECRET` — Session cookie HMAC (primary; read first by `cookie-signer.ts`)
- `SESSION_SECRET` — Alias for `COOKIE_SIGNING_SECRET`; Cloud Build mounts both from the same Secret Manager secret (`praxis-cookie-secret`) for backward compatibility

## Conventions

- `PraxisLink` / `usePraxisRoute()` for all navigation (auto-prefixes /app or /demo)
- `useSituationGuard()` at top of every tool page
- `withAuth()` wraps all protected API routes
- `checkAndDeductCredits()` before AI calls
- `usePersistedToolData()` for tool output caching
- `middleware.ts` for route protection (NOT proxy.ts)
- All AI routes: `generateText + Output.object()` with Zod schemas (AI SDK v6)
- Entity extraction: `extractEntities()` from `@/lib/services/entity-extraction`
- Graph operations: `getGraph/saveGraph/saveSnapshot` from `@/lib/firebase/graph-service`
- Trustworthiness: `computeTrustworthiness()` from `@/lib/analytics/trustworthiness-engine`
- Canonical pre-check: `runCanonicalPreCheck()` from `@/lib/services/canonical-precheck`
- `withCalibration(toolId, creditOpType)` wraps every AI route that should use calibrated context — factory returning `(handler) => withAuth(...)` with credit deduction and profile gate
- `buildCalibratedContext({uid, situationId, toolId, retrievalQuery})` is the single module that composes profile + situation + SKC retrieval into a `ContextBlock`
- `saveToolOutput({uid, situationId, toolId, profileVersion, output})` persists tool outputs to `users/{uid}/situations/{sitId}/tools/{toolId}` with profile-version provenance
- `ToolPageShell` consumes `useSituationGuard()` which now also returns `needsOnboarding`; tools render `<OnboardingRequiredState />` when the gate triggers
- Server-side: `withCalibration` returns 403 when a non-demo user has no `profile.meta.completedAt`
- `renderSystemPromptBlock()` from `@/lib/context/system-prompt-block` renders the `<analyst-profile>` + `<situation-frame>` + `<output-constraints>` XML block injected into AI system prompts

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
