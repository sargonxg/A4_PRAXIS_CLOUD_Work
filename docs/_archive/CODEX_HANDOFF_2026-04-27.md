# PRAXIS — Codex Handoff (2026-04-27, Round 6 close)

> **READ THIS FIRST.** Replaces every prior handoff doc. Contains full
> environment, repo, GCP, validation, and ownership context so a fresh
> Codex session can open this file and start a brick within 5 minutes.

## Codex continuation update — Brick #1 landed

- Implemented LangGraph runtime foundation in existing `praxis-backend`
  (not a new `praxis-agents` service): `backend/agents/langgraph/`
  checkpointer, schemas, and local smoke entry point.
- Added `GET /agents/health`; it verifies the Postgres checkpointer and
  emits `system_events` with `expiresAt` on failure.
- Added backend dependencies (`langgraph`, `langgraph-checkpoint-postgres`,
  `psycopg[binary,pool]`, Secret Manager), Firestore `agent_runs`
  collection-group indexes, and Cloud Run deploy wiring for
  `praxis-backend-sa`, direct VPC egress to the `default` subnet, and
  `LANGGRAPH_DB_PASSWORD` from Secret Manager.
- Targeted validation: `python -m pytest tests\test_langgraph_runtime.py -q`
  passes. Full backend pytest still stops on pre-existing
  `ACOEdge` import mismatch in `tests/test_aco_schemas.py`.
- Next durable-runtime brick: Brick #2, Brainstorming Table -> LangGraph
  through Cloud Tasks `praxis-agents`.

---

## 1. Environment

### Local clone

| Item | Value |
|---|---|
| Path | `C:\Users\giuli\praxiscodexworking` |
| Host OS | Windows 11 Pro (10.0.26200) |
| Shells available | Git Bash (`bash`), PowerShell 7+ (`pwsh`) |
| Working tree state | Clean against `origin/main` at session close (verify with `git status`) |

### GitHub

| Item | Value |
|---|---|
| Repo | `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work` |
| Branch | `main` (push-to-deploy via Cloud Build trigger) |
| GitHub CLI auth | `gh auth status` should report `sargonxg` logged in via keyring |
| Commit identity (REQUIRED) | `giuliocatanzariti@gmail.com` — other emails rejected by repo rules |
| Co-Authored-By trailer | **Forbidden.** Do not add. |
| Force-push to main | **Forbidden** unless Giulio explicitly asks. |

### Google Cloud

| Item | Value |
|---|---|
| Project | `praxisbytacitus` (number `852128226674`) |
| Default region | `us-central1` (Cloud Run, Cloud Build, Pub/Sub, Cloud Tasks) |
| LangGraph Cloud SQL region | `us-east4` (private-IP only — `constraints/sql.restrictPublicIp` enforced) |
| Production domain | `https://praxis.tacitus.me` |
| gcloud auth | `giulio@tacitus.me` (run `gcloud auth login` to refresh if needed) |
| Firebase CLI | `firebase login --reauth` if `firebase projects:list` fails |

### Stack

- **Frontend**: Next.js 16.2.4 App Router, TypeScript 5.9, React 19, Tailwind CSS 4, Radix UI, Zustand 5, D3.js 7, Framer Motion 12, AI SDK v6
- **Backend**: Python 3.11 FastAPI, Pydantic v2, NetworkX, Graspologic
- **Auth + DB**: Firebase Auth + Firestore (single source of truth); Cloud Storage for uploads; Neo4j/FalkorDB optional graph fallback
- **AI**: Vertex AI ADK Deep Research Agent, Gemini 3 family via `src/lib/ai/providers.ts` (NEVER hardcode `gemini-*` strings outside that module)
- **LangGraph durable runtime**: Cloud SQL `praxisbytacitus-instance` (Postgres 16, `us-east4`, private IP `10.101.0.3`, db `praxis_langgraph`, user `praxis_langgraph`, password secret `praxis-langgraph-db-password`, SA `praxis-agents-sa`) — **provisioned, not yet wired into runtime code** (Brick #1)
- **Cloud Tasks queues**: `praxis-research`, `praxis-agents`, `praxis-embeddings`
- **Operational spine**: Firestore collections `tool_runs`, `background_jobs`, `system_events`, `users/{uid}/notifications`, `audit_logs`, `dev_backlog` — all with TTL policies

### Repo layout

```
C:\Users\giuli\praxiscodexworking\
├── src/                          Next.js frontend (Claude territory)
│   ├── app/app/                  Tool pages (52 tools, authenticated)
│   ├── app/demo/                 Demo mirror pages (cookie auth, /demo/*)
│   ├── app/onboarding/           3-screen wizard (Identity / Perspective / Working Style)
│   ├── app/api/                  73 API routes (35 AI tool routes, auth, data, cron, admin)
│   ├── components/praxis/        Trust-layer primitives (ConfidenceBadge, Citation, OutputProvenancePanel, DegradedDataChip, ToolOutputFrame)
│   ├── components/landing/       Hero, AI-companion section, problem/solution
│   ├── lib/agents/               run-agent.ts, registry.ts, clarifying-questions.ts
│   ├── lib/api/                  with-auth, with-credits, with-calibration, save-tool-output
│   ├── lib/billing/              stripe-meters.ts, get-stripe-customer.ts
│   ├── lib/context/              profile-context.ts (buildCalibratedContext)
│   ├── lib/firebase/             admin.ts, situations-service.ts, analyst-profile-admin.ts
│   ├── lib/intelligence/         corpus-search.ts, dev-backlog/
│   ├── lib/knowledge/            Situation Knowledge Core layers (graph, vector, feed, tool-output)
│   └── types/                    analyst-profile.ts, corpus.ts
├── backend/                      Python FastAPI (Codex territory)
│   ├── graphify_tacitus/         ACO pipeline (extract → build → cluster → analyze → report → export)
│   ├── ai/                       genkit_app.py, flows.py
│   ├── routers/                  pipeline.py, graph.py, analyze.py
│   ├── services/                 firestore_sync, graph_adapter, bigquery_client
│   ├── agents/                   deep_research/   (LangGraph subdir to be created — Brick #1)
│   ├── auth.py                   Firebase token verification
│   └── main.py                   FastAPI entry
├── cloud_functions/              GCP Cloud Functions (Codex territory)
│   ├── on_situation_created/     Auto-trigger pipeline on new situation
│   ├── on_document_uploaded/     Extract text + run pipeline
│   ├── gdelt_poller/             Scheduled GDELT feed ingestion (every 15 min)
│   └── _shared/                  Vendored at deploy time — never edit standalone
├── infrastructure/               GCP setup scripts (Codex territory)
│   ├── setup-gcp.sh              One-time project setup
│   ├── deploy.sh / deploy-*.sh   Cloud Build trigger wrappers
│   ├── setup-langgraph-cloudsql.sh
│   └── setup-ttl.sh              Firestore TTL policies
├── tests/                        Vitest (frontend), pytest (backend)
├── docs/                         Architecture, specs, audits, persona walkthroughs
├── firestore.rules               Codex-owned
├── firestore.indexes.json        Codex-owned
├── cloudbuild.yaml               Codex-owned (CI/CD)
├── package.json                  v6.4.0
├── pyproject.toml                Backend deps
├── CLAUDE.md                     Architecture overview
├── AGENTS.md                     Hard rules + validation gate
└── README.md
```

---

## 2. Validation gate (BEFORE EVERY PUSH)

Run from repo root. Order matters — typecheck first because every later step assumes a clean tree.

```bash
npx tsc --noEmit          # 0 errors required
npm run build             # 0 errors required (warnings tracked debt)
npm run lint              # warnings OK; errors fail
npm run audit:gcp         # 0 hard / 0 soft required
node scripts/audit-ai-routes.mjs   # ≥58 calibrated / 4 exempt
npx vitest run            # 366 PASS / 0 FAIL (as of round 6 close)
```

Gate state at round-6 close: **all green** (lint warnings are tracked debt — React Compiler migration, unused vars, hook deps).

**NEVER** push or trigger Cloud Build if any of the four hard gates (tsc, build, audit:gcp, audit-ai-routes, vitest) fail. Lint warnings only are acceptable.

---

## 3. File ownership (DO NOT BLINDLY EDIT)

### Codex-owned (Claude does not touch unless lane explicitly requires)

```
backend/*                                           Python FastAPI
cloud_functions/*                                   GCP Cloud Functions
infrastructure/*                                    Setup + deploy scripts
cloudbuild.yaml                                     CI/CD pipeline
firestore.rules                                     Rules-as-code
firestore.indexes.json                              Composite indexes
src/components/app/app-sidebar.tsx                  Live profile sync sidebar
src/lib/auth/auth-context.tsx                       Live profile sync provider
src/components/dashboard/recommended-tools-widget.tsx  (color-only Lane BB exception)
src/components/dashboard/operational-status-panel.tsx
src/lib/navigation/tool-preferences.ts
src/lib/dashboard/tool-status-summary.ts
src/lib/dashboard/role-recommendations.ts          (round-6 mediator-role addition was forced by TS exhaustiveness)
src/types/preferences.ts
src/hooks/use-user-preferences.ts
```

### Claude-owned (Codex does not touch unless lane explicitly requires)

```
src/types/corpus.ts
src/lib/intelligence/*
src/app/api/intelligence/corpus-search/route.ts
src/lib/intelligence/dev-backlog/*
src/app/api/intelligence/dev-backlog/route.ts
src/app/api/ai/{humanitarian,brainstorming-table,source-scout,red-team-review,brief-builder}/route.ts
src/app/app/{brainstorming-table,source-scout}/*
src/components/praxis/{confidence-badge,citation,output-provenance-panel,
                      ai-error-toast,degraded-data-chip,clarifying-questions-modal,
                      tool-output-frame}.tsx
src/components/landing/{ai-companion-section,hero-quadrant-tour,hero-visual,hero}.tsx
src/components/dashboard/widget-shell.tsx
src/lib/agents/{registry,run-agent,clarifying-questions}.ts
src/lib/exports/brainstorming-markdown.ts
src/lib/chat/citation-parser.ts
src/lib/enrichment/wikipedia.ts
src/lib/knowledge/analyst-notes.ts
src/lib/services/tool-data-service.ts          (ToolName union — coordinate when adding)
src/lib/api/with-credits.ts                    (credit ops table)
src/lib/api/with-calibration.ts                (round-6 Stripe Meters wiring)
src/lib/billing/{stripe-meters,get-stripe-customer}.ts
src/lib/constants/tool-registry.ts
src/types/analyst-profile.ts
src/lib/constants/onboarding-chips.ts
src/app/onboarding/*
docs/* (except specs Codex creates)
```

When a lane spans both territories (e.g. adding a new role requires both `analyst-profile.ts` and `role-recommendations.ts`), document the cross-cut in the commit body — round 6 mediator-role addition is the template.

---

## 4. Hard rules (do not break)

1. **NEVER** hardcode `gemini-*` strings outside `src/lib/ai/providers.ts`. Forbidden: `gemini-2.0-*`, `gemini-2.5-*`, `gemini-3-pro-preview`. Verify with `rg "gemini-2\.0|gemini-2\.5|gemini-3-pro-preview" src/ backend/` — must return zero matches.
2. **NEVER** bypass `withCalibration` on AI routes. Audit script must keep ≥58 calibrated / 4 exempt.
3. **NEVER** reference retired vendors in user-facing copy: ACLED, Firecrawl, Tavily, Parallel.ai. Type-name imports like `MinimalACLEDEvent` are OK.
4. **NEVER** add a Firestore collection without rules + indexes in the same commit.
5. **NEVER** mutate canonical graph/timeline/profile state from agents — use `graph_updates` proposal queues.
6. **NEVER** call `os.environ[...]` in Cloud Functions / workers — always `os.getenv(...)` with explicit validation. See `cloud_functions/gdelt_poller/worker.py` for pattern.
7. **NEVER** add an Eventarc trigger without an idempotency key.
8. **NEVER** invoke a Cloud Run service without granting `roles/run.invoker` to the calling SA on the specific service.
9. **NEVER** skip hooks (`--no-verify`) or signing (`--no-gpg-sign`) on commits.
10. **ALWAYS** vendor `cloud_functions/_shared/` next to a function source dir at deploy time. `cloudbuild.yaml` does this; ad-hoc `gcloud functions deploy` must copy `_shared` first.
11. **ALWAYS** include `expiresAt` when writing to spine collections (TTL policies require it).
12. **ALWAYS** commit as `giuliocatanzariti@gmail.com`, no Co-Authored-By trailer.
13. **ALWAYS** follow conventional-commit format (`feat(area): subject`, `fix(area): subject`, `docs(area): subject`).

---

## 5. What round 6 just shipped (commits already on `main`)

```
6c7720f docs(round-6): LangGraph runtime spec for Codex + compact handover
8399fb7 feat(praxis): ToolOutputFrame trust-layer wrapper + org autocomplete expansion
44386c6 feat(billing): wire Stripe Meters into withCalibration on success
355e333 docs(round-6): MONSTER TODO + CHANGELOG + TODO board + CONTINUATION
0080f39 fix(demo): close Nordalia leak in humanitarian and dossier (Brick #29 P0)
518a83a feat(onboarding): add mediator role with chips and tool recommendations
```

### High-impact additions Codex should know about

- **`docs/MONSTER_TODO_2026-04-27.md`** — 22-item production-grade execution plan grouped by tier (T0 durable runtime → T11 close-out). Single-pane queue.
- **`docs/HANDOVER_2026-04-27.md`** — round-6 close-out summary. Read after this file if you need the long history.
- **`docs/specs/2026-04-27-langgraph-runtime/README.md`** — drop-in spec for **YOU (Codex)** to land Brick #1. Names files, lists deps, defines API, lists Firestore schema, calls out the open `praxis-backend` vs `praxis-agents` decision.
- **`mediator` role** added to `src/types/analyst-profile.ts` `ROLES` enum + chips + tool recommendations. Closes the Persona 4 onboarding P0.
- **Demo-leak P0 closed** in Humanitarian (`isNordalia` → `isDemo` + `<DegradedDataChip />`) and Dossier (`ViewStep` gates `DEMO_DOSSIER_CONTENT` behind `isDemo`).
- **Stripe Meters wired** into `withCalibration` success path. Free users + missing `STRIPE_SECRET_KEY` no-op cleanly. Token-dimension meters need AI SDK `usage` capture (follow-up brick).
- **`<ToolOutputFrame />`** new wrapper at `src/components/praxis/tool-output-frame.tsx` bundles ConfidenceBadge + DegradedDataChip + OutputProvenancePanel. Drop-in, opt-in, no layout impact when consumers pass nothing. The 48-tool unblocker.
- **Org autocomplete** expanded from 26 → ~85 entries (UN HQ, regional, agencies, IGOs, ICRC, NGOs, think tanks, ministries, missions, universities, private sector).

---

## 6. What's queued for Codex (drop-in specs ready)

Pick ONE lane and own it end-to-end. Validate per the gate, commit as conventional-commit, push.

### Brick #1 — LangGraph runtime foundation (Lane 7) — DONE by Codex continuation

**Spec**: `docs/specs/2026-04-27-langgraph-runtime/README.md`. Cloud SQL `praxisbytacitus-instance` is provisioned and verified by `npm run audit:gcp`.

**Decision used**: host first graph in existing `praxis-backend` (simpler IAM, fewer deploys).

**Deliverables** (per spec):
- `backend/agents/langgraph/{checkpointing.py, schemas.py, _smoke.py}`
- `backend/agents/requirements-langgraph.txt` adding `langgraph`, `langgraph-checkpoint-postgres`, `psycopg[binary,pool]`
- `GET /agents/health` route on the chosen service
- Firestore `agent_runs/{runId}` schema with collection-group indexes
- Local Postgres integration test
- VPC egress wired for Cloud SQL connector (private IP `10.101.0.3`)

### Brick #2 — Brainstorming Table → LangGraph (Lane 8)

Depends on #1. Migrate `src/app/api/ai/brainstorming-table/route.ts` to enqueue work into Cloud Tasks `praxis-agents`, persist via LangGraph checkpoint, allow human-in-the-loop interrupt before synthesis.

### Brick #3 — Structured backend extraction (Lane 3)

`backend/graphify_tacitus/extract.py` Pydantic enforcement. Tests for malformed JSON, schema-invalid nodes, empty extraction.

### Brick #4 — Document AI ingestion (Lane 4 / Brick 31)

Layout Parser fallback when `pdf-parse` returns < 500 chars. Chunk metadata (page, heading, table/list hint). Cost/degrade chip in document detail UI.

### Brick #12 — Cloud Tasks dispatcher (Brick #23)

Drain `background_jobs` into `praxis-research|agents|embeddings`. CAS lock on `lockedBy/lockedUntil`. Per-job retry policy.

### Brick #14 — Email notification path (Brick #28)

Cloud Function on `notifications.create` where `semaphore in [red,yellow]` and `kind in [action.required, data.ingest_failed, tool.warning]`. Use **Resend** (already in `package.json` deps). Env: `RESEND_API_KEY` in Secret Manager. Dedupe by `notificationId`.

### Brick #19 — BigQuery system_events sink (Brick #26)

Firestore `onCreate('system_events/{id}')` Cloud Function streams to `praxis_analytics.system_events`. Schema mirrors the doc.

### Brick #21 — Postgres cleanup cron (Lane 14)

Depends on #1. Nightly cron reads expired `agent_runs`, calls LangGraph checkpointer `delete_thread(thread_id)` (never raw SQL), marks Firestore `checkpointDeletedAt`, emits `system_events`.

### Brick #38 — IAP admin gating (was queued for Codex)

Identity-Aware Proxy on `/app/admin/*`. Allowlist `ADMIN_ALLOWLIST` users.

---

## 7. What Claude is doing in parallel (don't collide)

- `<ToolOutputFrame />` adoption across top 10 tools (Risk Monitor, Briefing Room, Negotiation Prep, Daily Brief, Source Scout, Brainstorming Table, Mediation Design, Game Theory, Compare, Dossier).
- Brick #6 user creation + auth flow audit (Playwright matrix).
- Brick #9 landing page production polish.
- Brick #11 Deep Search Agent multi-session migration.
- Brick #15 App Check phase-1 logging-only rollout (logs `appCheckPresent` to `system_events` for 7-day burn-in before enforcement).
- Brick #20 tool-output store unification (canonical `saveToolOutput` + `toolKey()` helper).

If your lane touches any file in the Claude-owned list above, document the cross-cut in your commit body.

---

## 8. Session-start checklist (cold start, < 5 minutes)

```bash
# 1. Sync
cd C:\Users\giuli\praxiscodexworking
git pull origin main
git status            # tree must be clean
git log --oneline -10 # confirm round-6 commits present

# 2. Read in order (don't read older docs unless you need history)
#    - CLAUDE.md
#    - AGENTS.md
#    - docs/CODEX_HANDOFF_2026-04-27.md   <- THIS FILE
#    - docs/MONSTER_TODO_2026-04-27.md
#    - docs/specs/2026-04-27-langgraph-runtime/README.md  (if doing Brick #1)

# 3. Install deps if /node_modules is missing
npm install

# 4. Verify the gate is green BEFORE you start changing things
npx tsc --noEmit
npm run build
node scripts/audit-ai-routes.mjs
npx vitest run
npm run audit:gcp

# 5. Pick a brick from §6 above and own it
```

---

## 9. Useful one-liners

```bash
# Targeted vitest for the new lanes only (~30s)
npx vitest run tests/services/

# Search for any remaining demo-leaks in /app/* (target: ≤30 hits)
grep -RIn "DEMO_\|NORDALIA_\|isClientDemoMode" src/app/app/ | wc -l

# Confirm calibration coverage
node scripts/audit-ai-routes.mjs

# Verify Cloud SQL + IAM
npm run audit:gcp

# Pull recent backlog entries (auto-published on every 4xx/5xx)
gcloud firestore documents list dev_backlog \
  --filter='status="open"' --limit=20 --order-by="-updatedAt" \
  --project=praxisbytacitus

# Check which Cloud Run revision serves prod
gcloud run services describe praxis-frontend --region=us-central1 \
  --project=praxisbytacitus --format='value(status.latestReadyRevisionName)'

# Trigger production deploy (round 6 commits not yet deployed)
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus

# Smoke after deploy
for path in '/' '/login' '/api/health'; do
  curl -s -o /dev/null -w "$path %{http_code}\n" "https://praxis.tacitus.me$path"
done

# Append the new revision to the deployment log
echo "<paste build id + revisions>" >> docs/DEPLOYMENT_LOG.md
```

---

## 10. Open questions for Giulio (defer to defaults if he's not online)

| # | Question | Default if no answer |
|---|----------|----------------------|
| 1 | LangGraph host — new `praxis-agents` Cloud Run service or inside existing `praxis-backend`? | Inside `praxis-backend` |
| 2 | Stripe Meters integration — Vercel Marketplace integration or direct Stripe? | Direct Stripe (already wired) |
| 3 | Daily Brief 06:00 cron — analyst's local timezone or UTC? | Analyst local; UTC if no tz on profile |
| 4 | Brief Builder lock — irreversible or admin-overridable? | Admin-overridable with audit row |
| 5 | Email path provider — Resend or SendGrid? | Resend (already in deps) |
| 6 | App Check rollout — log-only burn-in length? | 7 days, then enforce on mutating AI routes |
| 7 | Vertex AI Vector Search migration trigger — chunk count or query latency? | p99 latency > 800ms on documents layer |
| 8 | Eval harness location — repo root `evals/` or `backend/evals/`? | Repo root `evals/` (covers frontend + backend) |
| 9 | Document AI budget approved? | Assume yes (already in deep-research memo) |
| 10 | Audit-log retention — 365d (current) or 7y for SOC 2? | 365d until SOC 2 path activates |

---

## 11. When you finish a brick

1. Validation gate green (§2).
2. Conventional-commit message; commit as `giuliocatanzariti@gmail.com`; no Co-Authored-By.
3. Push to `origin main` once tests pass.
4. Update `CHANGELOG.md` Unreleased section with a Brick / Lane entry.
5. Flip the row in `docs/TODO_BOARD_2026-04-26.md`.
6. Append a block at the top of this file (`docs/CODEX_HANDOFF_2026-04-27.md`) summarising what shipped and what's queued next, OR create `docs/CODEX_HANDOFF_<next-date>.md`.
7. Trigger Cloud Build (`gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus`) when ready.
8. Smoke test (`/`, `/login`, `/api/health`) and append revision to `docs/DEPLOYMENT_LOG.md`.

---

## 12. Where to find the long story (skip unless needed)

| Doc | Why you'd open it |
|---|---|
| `docs/CONTINUATION.md` | Multi-round chronological history (rounds 1-5 + tenth-session) |
| `docs/ROUND_6_READINESS_2026-04-27.md` | Round-6 short plan written before Claude's round-6 work |
| `docs/DEEP_RESEARCH_ACTION_PLAN_2026-04-27.md` | 16-lane execution plan from the deep-research memo |
| `docs/LANGGRAPH_CLOUDSQL_CHECKPOINTING.md` | Provisioned infrastructure spec for Brick #1 |
| `docs/OPERATIONAL_SPINE.md` | tool_runs / background_jobs / system_events / notifications contract |
| `docs/CONTEXT_INJECTION.md` | Calibration system-prompt injection contract — the most important architectural doc |
| `docs/CORPUS_ARCHITECTURE.md` | SKC retrieval contract |
| `docs/AGENT_REGISTRY.md` | 6 active personas + synthesis-chair + 3 stubs |
| `docs/AGENTIC_SYSTEM.md` | Agent execution model |
| `docs/COMPLIANCE.md` | Licensing, sub-processors, certs |
| `docs/COLOR_SYSTEM_AUDIT_2026-04-26.md` | Color-token swap rules |
| `docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md` | 5-persona walkthroughs (UN diplomat, humanitarian, legal, mediator, researcher) |
| `docs/tools/UX_AUDIT_2026-04-26.md` | Per-tool UX findings |
| `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` | Canonical 90-day roadmap (54 named bricks) |
| `docs/HANDOVER_2026-04-27.md` | Compact human-style handover written same day as this file |

Welcome to round 6. Pick a brick.
