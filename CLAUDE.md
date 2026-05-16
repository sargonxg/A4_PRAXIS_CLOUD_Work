# PRAXIS — Policy, Diplomacy, and Political Intelligence Platform by TACITUS

> Version 6.4.0 — Operational spine: jobs · events · notifications · semaphore
> Pure GCP Cloud Run · Dual-service: Next.js + Python FastAPI
> Project: `praxisbytacitus` (852128226674) · Region: `us-central1`
> Domain: praxis.tacitus.me

> **Current handoff:** Before continuing work, read `ARCHITECTURE.md`,
> `docs/architecture/PRAXIS_ARCHITECTURE.md`,
> `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`,
> `docs/product/README.md`,
> `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`,
> `docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`,
> `docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`, `TODO.md`,
> `docs/audits/2026-05-16-tasklet-codebase-cleanup-audit.md`, and the
> `[Unreleased]` section in `CHANGELOG.md`. The current product direction is
> the Tasklet-style ContextCapsule agent runtime coordinated through
> `docs/product/` and the execution ledger. Validate with `npx tsc --noEmit`,
> focused Vitest/pytest for touched
> areas, `npm run build`, `npm run audit:repo-shape`, and relevant audit gates
> before deploying via Cloud Build.

## What This Is

The AI-native workspace for policy, diplomacy, and political analysis. PRAXIS
helps practitioners turn sources, documents, live feeds, and graph context into
cited assessments, briefings, reports, and decision support. In TACITUS terms,
PRAXIS is the system of record for conflict: a governed data layer for human
friction centered on Actor, Claim, Interest, Constraint, Leverage, Commitment,
Event, and Narrative. Two experiences: a user-owned for prospects (`retired user-owned routes`) and a
real situation-driven workspace for authenticated users (`/app/*`). Deployed
on GCP Cloud Run.

## Agent Handoff

Before changing code, future Claude Code / Codex sessions read these in
order. Skipping items 4-10 will produce duplicate work.

1. `README.md`
2. `CLAUDE.md` (this file)
3. `AGENTS.md` — hard rules, validation gate, deploy procedure
4. `ARCHITECTURE.md` — architecture entrypoint and canonical links
5. `docs/product/README.md` — current product documentation index
6. `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md` — current app/runtime structure
7. `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md` — Tasklet-style runtime plan
8. `docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md` — active build ledger
9. `docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md` — active implementation prompts
10. `docs/architecture/PRAXIS_ARCHITECTURE.md` — architecture bible / invariants
11. `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md` — shipped vs gated state
12. `STATUS.md`
13. `TODO.md`
14. `CHANGELOG.md` — `[Unreleased]` section only

### Operational references (consult when relevant, not every session)

- `docs/CONTEXT_INJECTION.md` — calibration contract every AI route honours
- `docs/OPERATIONAL_SPINE.md` — tool_runs, background_jobs, system_events, notifications, semaphore states
- `docs/GCP_OPERATIONS.md` — gcloud / Secret Manager commands
- `docs/COMPLIANCE.md` — licensing, certs, sub-processors
- `docs/CORPUS_ARCHITECTURE.md` — corpus + retrieval design
- `docs/tools/INDEX.md` — per-tool micro-app specs


Fresh-clone start command:

```bash
git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git
cd A4_PRAXIS_CLOUD_Work
git status
git log --oneline -5
npm install
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16 App Router)  →  Cloud Run         │
│    src/app/app/*   (55 registered tool surfaces)        │
│    src/appretired user-owned routes  (authenticated mode, cookie auth)             │
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
- **Data Feeds**: GDELT, UCDP, HDX, ReliefWeb, UN News, World Bank, UNHCR, grounded Google Search; Firecrawl and Parallel are optional accelerators. ACLED is withdrawn for SaaS redistribution/licensing reasons.

## Current Executive Intelligence Slice

- Route: `src/app/api/ai/situation-intelligence/route.ts`.
- Schema: `src/lib/ai/schemas/situation-intelligence.ts`.
- UI: `src/components/dashboard/executive-intelligence-panel.tsx`.
- Dashboard mount: `src/app/app/dashboard/page.tsx`.
- Contract: no user-owned/static output; generation requires a real active situation,
  schema-valid AI output, source-fragment provenance, confidence notes, and
  persisted memory through the existing tool-data path.
- Focused test: `tests/unit/lib/ai/situation-intelligence-schema.test.ts`.

## Backend Trust Boundary

- `praxis-backend` is private Cloud Run. Do not expose it publicly.
- Browser users should call Next.js API routes; server routes call the backend
  through `src/lib/api/praxis-backend-server.ts` with Cloud Run OIDC.
- Backend service auth must verify both OIDC audience and trusted service
  account email before accepting `X-PRAXIS-UID`.
- Operational backend endpoints such as `/agents/health` and graph connection
  testing are service-only or admin-bridged through the frontend API.
- Keep `X-Firebase-Token` separate from `Authorization`; `Authorization` is for
  Cloud Run IAM/OIDC.

## Cognee Memory Layer

- Read `docs/architecture/COGNEE_MEMORY_LAYER.md` and
  `docs/runbooks/MEMORY_LAYER_RUNBOOK.md` before changing memory, graph recall,
  or Cognee-related code.
- Cognee is disabled by default and is a probabilistic memory layer beside the
  canonical ACO graph. It is not the graph source of truth.
- `backend/services/cognee_memory.py` is the only backend file allowed to import
  the Cognee SDK. Keep live SDK access out of routers and tool handlers.
- Browser routes call `/api/memory/*`; the route is protected with `withAuth`
  and proxies to either private FastAPI disabled-mode endpoints or the isolated
  `praxis-cognee` service.
- Keep Cognee on Vertex ADC only: `COGNEE_LLM_PROVIDER=vertex_ai`,
  `COGNEE_LLM_API_KEY=vertex-adc`, and 768-dimensional
  `text-embedding-005` embeddings.
- Validate Cognee changes with `npm run audit:cognee`,
  `npm run audit:embedding-dim`, and the focused backend Cognee pytest files.

## File Structure

```
/                            Next.js frontend (root)
├── src/app/app/             55 registered tool surfaces
├── src/app/app/            user-owned mirror pages
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
│   └── gdelt_poller/         Continuous GDELT feed ingestion worker pool
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

**Gate** — `withCalibration` returns HTTP 403 when a non-user-owned user has no `profile.meta.completedAt`. Client-side, `useSituationGuard()` returns `needsOnboarding: true` and `ToolPageShell` renders `<OnboardingRequiredState />` in place of the tool UI.

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
Login → Firebase Auth (Google redirect | email/password | user-owned cookie)
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

**Never hardcode `gemini-*` strings outside `src/lib/ai/providers.ts` and `src/lib/ai/MODEL_MATRIX.json`.** Those are the single source of truth.

**Current canonical family:** `gemini-2.5-flash` and `gemini-2.5-pro` (Vertex stable IDs). The previous `gemini-3-*-preview` family was withdrawn by Google; do not reintroduce it without flipping the model matrix and verifying Vertex availability in the target project.

**Forbidden strings anywhere in `src/` or `backend/`:**
- `gemini-2.0-*` (deprecated)
- `gemini-3-pro-preview` (discontinued by Google March 26, 2026)
- Any new `gemini-3-*` IDs unless `PRAXIS_ALLOW_GEMINI3_TARGETS=1` is set and `audit:model-matrix-coverage` is updated.

Verify with: `rg "gemini-2\.0|gemini-3-pro-preview" src/ backend/` — must return zero matches.

**Thinking levels:** prefer `thinking_level: 'low' | 'medium' | 'high'` where the SDK supports it. Defaults are encoded in `MODEL_MATRIX.json`.

## Anti-Patterns to Refuse

- "Add `'unsafe-inline'` to fix the CSP" — use a nonce instead
- "Just hardcode the model string for now" — always go through `providers.ts`
- "Skip the user-owned guard, the route's only used by paid users" — every AI route needs `isServeruser-ownedMode()`
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

## AI Model Tiers (Gemini 2.5 — current canon)

| Function | Model | Used For |
|---|---|---|
| `getModel()` | `gemini-2.5-flash` | Chat, terminology, lightweight tasks, grounded search |
| `getProModel()` | `gemini-2.5-pro` | Structured tool generation, reports, dossiers |
| `getAnalysisModel()` | `claude-sonnet-4-*` → `gemini-2.5-pro` | Deep conflict analysis, diplomatic language (falls back to Pro) |
| `getDeepThinkModel()` | `gemini-2.5-pro` + `thinking_level: 'high'` | Game Theory, Scenarios, treaty analysis |
| `getEmbeddingModel()` | `text-embedding-005` (768-dim) | SKC Vector Layer, document embedding |
| `getGroundedModel()` | `gemini-2.5-flash` + Google Search | Research tools, actor enrichment, source discovery |

The exact mapping per task kind lives in `src/lib/ai/MODEL_MATRIX.json`.
`audit:model-matrix-coverage` enforces it. Gemini 3 promotion is gated by
`PRAXIS_ALLOW_GEMINI3_TARGETS=1` and is currently OFF.
| Vertex ADK | Agent Engine | Deep Search Agent (falls back to Gemini 3 + Search) |

## Situation Knowledge Core (SKC)

4-layer hybrid GraphRAG system backing the 55 registered tool surfaces:
- **Graph Layer**: Firestore canonical graph + optional Neo4j/Falkor/Spanner derived indexes. `src/lib/knowledge/graph-layer.ts` provides the adapter; `src/lib/graph/graphops.ts` and `src/lib/graph/graphops-service.ts` provide the maintenance/readiness contract.
- **Vector Layer**: `src/lib/knowledge/vector-layer.ts` — Firestore native KNN (768-dim, COSINE distance)
- **Feed Layer**: `src/lib/knowledge/feed-layer.ts` — TTL-cached data feeds (ACLED, GDELT, HDX, etc.)
- **Tool Output Layer**: `src/lib/knowledge/tool-output-layer.ts` — cross-referenced versioned tool outputs

Entry point: `new SituationKnowledgeCore(uid, situationId)` from `@/lib/knowledge`

Zero-config fallback: Everything works with just GOOGLE_AI_API_KEY. Firestore remains the canonical graph store; Neo4j is a derived index when configured. ACLED is not a required dependency; use grounded search, GDELT, UCDP, and document evidence first. See Part 3 blueprint for full fallback matrix.

GraphOps v0.1:
- API: `GET /api/graph/ops?situationId=...`
- Dashboard: Situation Launchpad GraphOps panel.
- Reports: approved/proposed counts, provenance coverage, temporal coverage, low-confidence items, orphan nodes, node/edge distribution, latest snapshot, and next graph-maintenance action.
- Future rule: Ask PRAXIS and extraction agents should propose graph patches into `graph_updates`; approved changes update `graph/main` and then mirror to Neo4j/Falkor/Spanner if configured.

## TACITUS Credits

5,000 on signup. Costs: 1 (chat) → 10 (deep search agent). user-owned: unlimited.
Authoritative source: `src/lib/api/with-credits.ts`
Deducted atomically via Firestore transactions. Real-time sync via onSnapshot.

## GCP Services Used

| Service | Purpose | Config |
|---|---|---|
| Cloud Run | Frontend + Backend containers | 0-10 instances, 300s timeout |
| Artifact Registry | Docker images | us-central1-docker.pkg.dev/praxisbytacitus/praxis |
| Cloud Build | CI/CD pipeline | cloudbuild.yaml, E2_HIGHCPU_8 |
| Firestore | Auth, data, real-time sync | Native mode, owner-only rules |
| Firebase Auth | Google + email/password + user-owned | Session cookies (httpOnly) |
| Vertex AI | ADK Deep Research Agent | us-central1, Reasoning Engine |
| BigQuery | Pipeline analytics | praxis_analytics dataset |
| Cloud Storage | Document uploads | gs://praxisbytacitus-praxis-uploads |
| Pub/Sub | Async event messaging | 5 topics (pipeline, extract, ingest, alert, profile.events) |
| Cloud Functions | Event triggers | 3 functions (situation, document, GDELT) |
| Cloud Scheduler | Cron jobs | GDELT (15min), alerts (6am), briefing (5am) |
| Secret Manager | Sensitive config | Runtime secrets for Firebase Admin, AI, Firecrawl, Parallel, UCDP, cron/session signing, and user-key encryption; `ADMIN_ALLOWLIST` / `ADMIN_EMAIL_ALLOWLIST` gate admin access |

## Tool Categories (55 registered surfaces)

| Category | Tools |
|---|---|
| **Hero loop** | The 12 primary working surfaces in `src/lib/tools/tool-path-taxonomy.ts`, shown first in `/app/tools`. |
| **Archive / specialist** | The remaining 43 registry surfaces remain linked, auditable, and available behind `show_archive=1`. |
| **Source of truth** | `src/lib/constants/tool-registry.ts`, `src/lib/tools/tool-navigation.ts`, and `src/lib/tools/tool-path-taxonomy.ts`. Expanded generated specs are local audit artifacts; refresh them with `npm run generate:tool-docs` when needed. |

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
- `NEO4J_URI`, `NEO4J_USER` or `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE` — optional graph database derived index
- `VERTEX_AGENT_ENGINE_ID` — Deep Research Agent engine
- `CRON_SECRET` — Cron + admin auth
- `COOKIE_SIGNING_SECRET` — Session cookie HMAC (primary; read first by `cookie-signer.ts`)
- `SESSION_SECRET` — Alias for `COOKIE_SIGNING_SECRET`; Cloud Build mounts both from the same Secret Manager secret (`praxis-cookie-secret`) for backward compatibility
- `UCDP_API_TOKEN` — Optional but recommended UCDP API token mounted from Secret Manager `praxis-ucdp-api-token`

The `NEXT_PUBLIC_FIREBASE_*` client config values are public and have defaults in `src/lib/firebase/config.ts` for the `praxisbytacitus` project. This is intentional so clean-clone builds pass without `.env.local`; still use `.env.local` when pointing a local build at a different Firebase project.

## Conventions

- `PraxisLink` / `usePraxisRoute()` for all navigation (auto-prefixes /app or /app)
- `useSituationGuard()` at top of every tool page
- `withAuth()` wraps all protected API routes
- `checkAndDeductCredits()` before AI calls
- `usePersistedToolData()` for tool output caching
- `src/proxy.ts` for route protection in Next.js 16; do not reintroduce the old `middleware.ts` convention.
- All AI routes: `generateText + Output.object()` with Zod schemas (AI SDK v6)
- Entity extraction: `extractEntities()` from `@/lib/services/entity-extraction`
- Graph operations: `getGraph/saveGraph/saveSnapshot` from `@/lib/firebase/graph-service`
- Trustworthiness: `computeTrustworthiness()` from `@/lib/analytics/trustworthiness-engine`
- Canonical pre-check: `runCanonicalPreCheck()` from `@/lib/services/canonical-precheck`
- `withCalibration(toolId, creditOpType)` wraps every AI route that should use calibrated context — factory returning `(handler) => withAuth(...)` with credit deduction and profile gate
- `buildCalibratedContext({uid, situationId, toolId, retrievalQuery})` is the single module that composes profile + situation + SKC retrieval into a `ContextBlock`
- `saveToolOutput({uid, situationId, toolId, profileVersion, output})` persists tool outputs to `users/{uid}/situations/{sitId}/tools/{toolId}` with profile-version provenance
- `ToolPageShell` consumes `useSituationGuard()` which now also returns `needsOnboarding`; tools render `<OnboardingRequiredState />` when the gate triggers
- Server-side: `withCalibration` returns 403 when a non-user-owned user has no `profile.meta.completedAt`
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

## Latest Validation Checkpoint

2026-04-25 local validation:
- `npm run build` passed.
- `npm run lint` passed with warnings only. React Compiler migration findings are warnings in `eslint.config.mjs` until the UI is cleaned up route-by-route.
- `npm run audit:gcp` passed after creating Pub/Sub topic `profile.events`.
- `node scripts/audit-ai-routes.mjs` passed: 53 AI routes calibrated, 4 exempt.
- `npx vitest run` passed: 40 files, 140 tests.

Known warnings to keep visible:
- Windows local `next build` can warn while copying standalone traced files with `node:*` chunk names. Linux Cloud Build is the authoritative container build.
- Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`; current middleware still builds and is listed as Proxy output.
- Lint warning backlog includes React Compiler rules, unused variables, hook dependencies, explicit `any`, and legacy `require()` imports.

2026-04-25 production checkpoint:
- Cloud Build `06b20a50-c0ef-4159-906f-5c97efad8159` succeeded.
- Deployed commit `5cdfebf`.
- Frontend revision `praxis-frontend-00044-tcl` ready.
- Backend revision `praxis-backend-00027-nlk` ready.
- `https://praxis.tacitus.me/` and `/login` return `200 OK`.
- `/onboarding` redirects unauthenticated users to `/login`, expected behavior.
- `/api/health` reports Firestore, AI provider, and cookie secret `ok`.
- `/api/auth/test-firebase` reports Firebase reachable, Email/Password enabled, and Admin SDK `INITIALIZED_OK`.
- Firebase Auth authorized domains include `praxis.tacitus.me`.

See `docs/DEPLOYMENT_LOG.md` for daily deployment status and remaining production configuration gaps.

## Local Development

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend + Neo4j + FalkorDB
docker-compose up

# Backend health check
curl http://localhost:8080/health
```
