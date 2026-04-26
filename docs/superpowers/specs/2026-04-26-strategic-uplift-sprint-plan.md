# PRAXIS Strategic Uplift — 6-Week Sprint Plan

**Date:** 2026-04-26
**Author:** Giulio Catanzariti
**Repo:** https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work
**Workspace for execution:** `C:\Users\giuli\praxiscodexworking` (fresh clone — see `docs/CODEX_KICKOFF_PROMPT.md`)
**Status:** Ready to execute
**Layers on top of:**
- `docs/superpowers/specs/2026-04-24-praxis-completion-master-plan.md` (Phases A–D — secure-by-default, advisor v2, observability, golden-path QA)
- `docs/superpowers/specs/2026-04-21-tool-improvement-roadmap.md` (Phase 1 → 5 tool delivery)
- `docs/CONTINUATION.md` (current handoff: pricing language, onboarding persistence, `ai_deep_think` metering, no-deploy state)

This plan does **not** restart the master plan or the tool roadmap. It accelerates them, threads in UX/UI uplift, and ties every deliverable to a real persona pain.

---

## 0. Scope Snapshot — Where We Actually Are

| Surface | Today | Notes |
|---|---|---|
| Tool pages under `src/app/app/` | **48 directories** | Roadmap names 40; the codebase already includes admin, profile, settings, situations, alerts, exports, requirements, source-monitor — all real pages |
| AI routes under `src/app/api/ai/` | **49 routes** | Most wrap `withCalibration`; `audit:routes` enforces |
| Data feeds | **11 clients** + capability resolver | ACLED freemium, Crisis Group + SIPRI premium, others free |
| Onboarding | 3 steps + completion (`src/app/onboarding/`) | Persists profile + draft, resumes on refresh, 3 chip libs (mandate × 8 roles, 9 lenses, 8 red-lines) |
| Pricing tiers | Demo · Analyst $49 · Team $199 · Institution | Public language already shifted away from per-tool credits |
| AnalystProfile calibration | Live | 11-dimension audit, profile versioning, `<analyst-profile>` XML block |
| Domain taxonomy | 11 domains, Firestore-driven | Auto-classified, admin-editable at `/app/admin/domains` |
| Backend (Python) | FastAPI, ACO pipeline, OIDC auth | Cloud Run private, NetworkX + Graspologic + Genkit |
| Known blockers | Lint failing, 31 npm vulns (1 critical), graph storage fragmented, Spanner adapter unintegrated, MCP not built, GDELT poller stale, BigQuery schema mismatch | All from `CONTINUATION.md` |

---

## 1. Mission

Take PRAXIS from *"functionally complete platform with rough edges"* → *"product a UN Political Affairs Officer, a sanctions analyst, and a think-tank researcher all open daily without friction."*

Three north-star outcomes by end of Sprint 6:
1. **Cold-start to first cited brief in ≤ 10 minutes** for a brand-new free user.
2. **Every one of the 48 tool pages passes a per-tool smoke test** with a real (calibrated, persisted, sourced) output.
3. **Live ops dashboard** at `/app/admin/diagnostics` shows green for GCP, every feed, every cron, every alert policy — and an on-call channel that pages on burn.

---

## 2. Personas (10) — Pain Map

Every sprint task ties to ≥ 1 persona. Personas are derived from mandate chips, lens catalogue, and observed PRAXIS use cases.

| # | Persona | Primary domain | Acute pain today | Top fix in plan |
|---|---|---|---|---|
| 1 | **Inés — UN DPPA Political Affairs Officer** | `diplomacy-negotiation` | Cited DPPA-format briefs require manual citation cleanup; advisors don't always honour neutral-mediator red-lines | Sprint 3: Briefing Room v2 + DPPA citation enforcer; Sprint 2: Advisor council red-line audit |
| 2 | **Marcus — Senior Mediator (Berghof / Crisis Group alumnus)** | `diplomacy-negotiation` + `mediation` lens | Negotiation Prep BATNA/ZOPA outputs feel templated; Mediation Designer skips spoilers when sparse evidence | Sprint 4: Simulation wave (Negotiation, Mediation, Game Theory) with Adeyemi/Reyes voices + sparse-evidence fallback |
| 3 | **Jules — Sanctions / Treaty Lawyer (US State, FCDO, Geneva Academy)** | `economic-sanctions` + `legal_ihl` lens | Sanctions Tracker doesn't link designations to a network; Treaty Analyzer can't diff clauses | Sprint 4: Sanctions designation graph; Treaty clause-diff with parallel translation |
| 4 | **Amara — Humanitarian Coordinator (OCHA / ICRC)** | `humanitarian` | Humanitarian + Geospatial widgets break when ACLED key missing; IPC phase data stale | Sprint 1: Tier-aware empty states (already in Phase A — finish + verify); Sprint 5: HDX/IPC freshness window per tool |
| 5 | **Dr. Okafor — Think-Tank Senior Fellow (Chatham House / Brookings)** | `governance-rule-of-law` | Long-form Report Studio output can't carry footnote-style citations; Dossier sections out of order vs. salience | Sprint 3: Citation styles (Chicago/AP/UN), Dossier salience-ordered sections |
| 6 | **Karim — Conflict Researcher (academic, ACLED + UCDP heavy user)** | `armed-conflict-security` | ACO graph export not stable across refreshes; methodology panel hides pivot-actor scoring | Sprint 5: Graph storage unification (one canonical Firestore shape); methodology transparency upgrade |
| 7 | **Sara — Investigative Journalist** | `human-rights` + `information-cyber` | Info Environment cluster labels drift; Media Compass bias map jumps | Sprint 2: Info Environment label stability + provenance trail |
| 8 | **Quinn — Free-tier Prospect (no API keys, evaluating product)** | `generic` | Hits dead widgets, no clear "what does this unlock when I add a key" path | Sprint 1: Capability matrix UI everywhere widgets render; tier-honest empty states |
| 9 | **Devops Diana — Site Reliability + Admin** | n/a | No live diagnostics page; Cloud Tasks queues provisioned but unused; GDELT poller silently stale | Sprint 6: `/app/admin/diagnostics` + alert policies + GDELT poller fix + Cloud Tasks wiring |
| 10 | **Field-mobile Felipe — Analyst on iPad / hotel wifi** | any | Tool pages 200KB+ JS; AI Populate hangs without good cancel UX; sidebar 38KB serialised | Sprint 6: Bundle slim, optimistic streaming, sidebar code-split; offline-tolerant cache headers |

---

## 3. UX / UI Principles — Reread Before Every PR

1. **No dead widgets.** If data is unavailable (key missing, feed down, situation empty), render an explainer card with one CTA. Never an empty box, never a console error in the wild.
2. **Calibration is invisible but felt.** Every AI surface must reflect the user's lenses, red-lines, audience, citation style. Audit-tools score gates merge.
3. **Citation is a first-class object.** Every AI claim shows source pill (`[ACLED]`, `[UN SC Res.]`, `[AI Assessment]`); every report exports with citations machine-rebuildable.
4. **Mobile-first sidebar + tool pages.** All pages render on a 380-wide viewport without horizontal scroll. Tap targets ≥ 44 px.
5. **Loading is informative.** Replace spinners with phase labels ("Retrieving sources from ACLED…", "Drafting briefing in DPPA format…"). Cancel always one click away.
6. **One Settings shell, one Admin shell.** No tool ships its own settings dialog; everything lives under `/app/settings/*` or `/app/admin/*`.
7. **Onboarding is recoverable.** Skip → Resume → Edit → Re-version, all without losing prior input.
8. **Demo never lies.** Demo-mode outputs labelled `Sample data — Nordalia Crisis` in every tool surface. No demo content leaks into real-mode caches.

---

## 4. Per-Tool Strategic Treatment (48 tools)

Each tool gets one of four treatments in this plan. **G** = green (already strong, minor polish), **Y** = needs targeted upgrade, **R** = needs significant rebuild or new contract, **N** = new in this plan.

### Context (8 pages)

| Tool | Status | Action | Sprint |
|---|---|---|---|
| `dashboard` | Y | Tier-aware widgets + AI insights panel + lens-weighted "for you" rail | S1 |
| `documents` | Y | Per-document extraction quality score + reprocess CTA | S5 |
| `sources` (Sources Library) | Y | Source health badge per source + last-touched timestamp | S2 |
| `source-monitor` | Y | Wire to capability matrix; show feed × situation × last poll | S6 |
| `timeline` | Y | Episode dedupe + filter by lens + actor pin | S3 |
| `humanitarian` | Y | IPC phase legend + UN Cluster activation surface | S5 |
| `calendar` | Y | Drag-drop event creation; Cloud Scheduler-backed reminders | S5 |
| `conflict-graph` | R | Unify storage (Firestore canonical) + 500-node perf budget + Spanner Graph adapter ready | S5 |

### Analysis (7)

| Tool | Status | Action | Sprint |
|---|---|---|---|
| `risk-monitor` | Y | INFORM trend timeline + sensitivity tornado wired to live feeds, not constants | S2 |
| `early-warning` | Y | Glasl ladder interactive + indicator matrix from feed-aggregator | S2 |
| `actor-profiles` | Y | Wikipedia enrichment spike (master plan §Additional Scope) + canonical pre-check button | S4 |
| `stakeholder-map` | Y | Mendelow + Mitchell-Agle-Wood toggle; force graph perf budget | S2 |
| `power-map` | Y | Barnett-Duvall 4-faces overlay; faction merge from cluster output | S3 |
| `info-environment` | Y | Label stability via embedding clustering + provenance per cluster | S2 |
| `compare` | Y | A/B situation diff matrix; export as DOCX | S3 |

### Drafting (7)

| Tool | Status | Action | Sprint |
|---|---|---|---|
| `assistant` (PRAXIS Assistant) | Y | Memory of last 10 turns + advisor voice picker + per-claim citation pill | S3 |
| `report` (Report Studio) | Y | Citation style chooser (Chicago / AP / UN-DPPA), footnote/inline toggle | S3 |
| `dossier` | Y | Salience-ordered sections from Mitchell-Agle-Wood output | S3 |
| `talking-points` | G | Audience-tone enforcer (already wired) + length presets | S3 |
| `briefing` (Briefing Room) | Y | DPPA-format template + agenda generator + auto-attach background pack | S3 |
| `auto-briefings` (Daily Brief) | Y | Cron-backed (Cloud Scheduler) + delivery: email (Resend) and in-app | S5 |
| `policy-memo` | Y | New section: "evidence base" footer with feed coverage map | S3 |

### Simulation (5)

| Tool | Status | Action | Sprint |
|---|---|---|---|
| `scenarios` | Y | 3-horizon model + probability tree + sensitivity tornado | S4 |
| `negotiation-prep` | Y | Fisher-Ury structured + ZOPA visualizer + BATNA matrix from actor leverage | S4 |
| `game-theory` | Y | Deep Think + payoff matrix + Schelling focal points + sequential tree | S4 |
| `concordia` | Y | Multi-party agent sim — one Pub/Sub topic per round; rate-limit | S4 |
| `mediation-design` | Y | Berghof phases + spoiler analysis + UNSCR 1325 checklist | S4 |

### Intelligence (10)

| Tool | Status | Action | Sprint |
|---|---|---|---|
| `deep-search-agent` | R | Vertex ADK fallback hardening + citation rigour + session resume | S4 |
| `argus` | Y | Prioritised alert queue + dismiss/snooze per-user | S2 |
| `media-compass` | Y | Cluster ownership map + bias scoring stable | S2 |
| `media-roundup` | Y | Scheduled (Daily Brief integration) + audience tone | S5 |
| `geospatial-monitor` | Y | Hotspot clustering + heatmap; offline-tolerant tile cache | S5 |
| `sanctions` | R | Designation graph view (network of OFAC/UN/EU lists) + entity overlap | S4 |
| `commitments` | Y | Dated promise ledger + breach alerts via Pub/Sub | S4 |
| `legal-tracker` | Y | Treaty + ICC docket + UN reso linker | S4 |
| `treaty-analyzer` | R | Clause-diff + parallel translation (Gemini Pro) + version history | S4 |
| `alert-center` | Y | Source × severity × actor matrix + bulk acknowledge | S2 |

### New / Specialized (8) — already exist as page directories

| Tool | Action | Sprint |
|---|---|---|
| `economic-impact` | Wire to World Bank + ACLED-econ overlay | S5 |
| `electoral-risk` | Election-calendar overlay + actor positioning | S5 |
| `external-actors` | External-influence map (3rd-party state involvement) | S4 |
| `peacebuilding-index` | Lederach pyramid + GPI rolling window | S5 |
| `human-rights` | OHCHR + HRW + Amnesty merge with deduping | S2 |
| `requirements` | RFI / requirements-tracker — link to tool runs that satisfied them | S6 |
| `export-center` | One place for DOCX/PDF/JSON exports + audit trail | S5 |
| `global-search` | Cross-situation full-text + vector — new Firestore native KNN endpoint | S6 |

### Workspace (4)

| Tool | Action | Sprint |
|---|---|---|
| `cases` | Multi-situation bundle + cross-situation summary | S6 |
| `advisory` | 4-flagship roster (Phase B) + cross-advisor synthesis | S2 |
| `profile` | Mirrors onboarding; live preview; re-version on save | S1 |
| `settings` | Sub-pages: Profile · API Keys · Model Preferences · Graph Backend · Notifications · System Health (user-facing) | S1, S6 |

---

## 5. Onboarding Overhaul

Current state is solid (3 steps + draft persistence + completion gate). Plan upgrades it across 3 sprints.

### S1 — Honest Free-Tier Story

- Step 1 Identity: keep.
- Step 2 Perspective: add a **Domain confirm card** with the auto-classifier suggestion + 1-click override (read from `classifyDomain`).
- Step 3 Working Style: add a **Capability preview** widget — "with your current keys, you'll have ACLED ✗, GDELT ✓, Crisis Group ✗" — sourced from `resolveFeedCapabilities(uid)`.
- Step 4 Done: keep, add a "Add an API key now" deep link to `/app/settings/api-keys` for users who picked premium-leaning lenses (security/legal_ihl).

### S3 — Calibration Visibility

- Live preview panel renders the actual `<analyst-profile>` XML block that will be injected into prompts (already partly there via `LivePreview`). Make it copy-pasteable for power users.
- Add a 30-second **explainer microvideo** modal on Step 2 — "What does a lens do?" (stubbed loop animation if no video yet).
- After completion, fire a one-time toast: "We tuned 49 tools to your profile. View your <analyst-profile>." → links to `/app/settings/profile`.

### S5 — Reactive Re-Calibration

- Settings → Profile edit triggers a profile-version bump + immutable snapshot + Pub/Sub event (`profile.events`) → embedding refresh.
- Tool outputs already saved show a `Calibrated for v{n}` badge; if user is on v{n+1}, surface a "Re-run with your latest profile" CTA (cost-aware: shows credit estimate).

### Cross-cutting

- Every onboarding API route covered by `tests/onboarding/*.test.ts` (already partial — finish coverage).
- Playwright `tests/e2e/onboarding-resume.spec.ts` — start, refresh mid-step 2, resume, complete.

---

## 6. APIs, Databases, Integrations to Add or Finish

| Surface | What | Why | Sprint |
|---|---|---|---|
| **Wikipedia REST** | Read-only enrichment client `src/lib/data-feeds/wikipedia-client.ts` | Stable entity backbone for actor profiles + canonical pre-check | S4 |
| **OpenSanctions** | Read-only client (`api.opensanctions.org`) | Designation graph for Sanctions Tracker | S4 |
| **ICC + ICJ docket** | Scraper via Firecrawl | Legal Tracker | S4 |
| **UN OHCHR API** | Read-only treaty-body output | Human Rights tool | S2 |
| **Spanner Graph** | Wire backend `graph_adapter` to Spanner Graph as production-recommended path | Replace fragmented Firestore graph shapes | S5 |
| **Cloud Tasks** | Wire `praxis-pipeline-queue` for async ACO runs (today: provisioned, unused) | Decouple long-running pipeline from request lifecycle | S5 |
| **Pub/Sub** | Confirm `profile.events` subscriber + add `commitments.breach`, `alerts.high-severity`, `concordia.round` topics | Reactive UX | S2, S4 |
| **Resend** | Wire daily-brief delivery + alert digest | Out-of-product touchpoints | S5 |
| **Stripe** | Finish webhook plan-name normalization + entitlement model split from internal credits | Billing reliability | S6 |
| **Firestore native KNN** | Add `embedding` field to `users/{uid}/situations/{sid}/documents/{doc}` and `tools/{tool}` | Powers Global Search | S6 |
| **BigQuery `tool_invocations`** | Finish schema reconcile + sampling decision (master plan §C8) | Diagnostics + cost insight | S6 |
| **Cloud Monitoring** | Apply `infrastructure/monitoring-alerts.sh` policies + add Notification Channel | On-call | S6 |
| **MCP server** | New: `backend-mcp/` exposing `list_situations`, `get_situation_context`, `query_conflict_graph`, `canonicalize_entity`, `run_praxis_tool`, `trace_claim`, `generate_brief` | Agentic operations from Claude Code / Codex | S6 |
| **Vertex AI Reasoning Engine** | Confirm Engine ID set for prod; fallback path tested for staging | Deep Search Agent reliability | S4 |
| **gitleaks pre-commit** | Add `.pre-commit-config.yaml` + CI step | Block secret leaks | S1 |

---

## 7. Six Weekly Sprints

Each sprint is **5 working days**. Friday end-of-week: ship to staging + golden-path run + update `CHANGELOG.md` + post a one-page progress note in `docs/CONTINUATION.md`.

Working folder for codex: `C:\Users\giuli\praxiscodexworking` (fresh clone each sprint Monday — see kickoff prompt).
Working dir for codex commands: `C:\Users\giuli\praxiscodexworking`.
Codex invocation: `codex -a never -s danger-full-access`.

---

### 🟢 Sprint 1 — Free-Tier Foundation + Onboarding Honesty (Week 2026-04-27 → 2026-05-01)

**Personas:** Quinn (free prospect), Amara (humanitarian), all (settings polish)
**Layers on:** Master plan Phase A1–A9 + Phase B1
**Goal:** A new signup with zero keys lands in a workspace where every widget has a meaningful state.

| Day | Deliverable | Files | Acceptance |
|---|---|---|---|
| Mon | Finish Phase A6 — Settings → API Keys v2 (server-only writes; per-provider validation) | `src/app/app/settings/api-keys/page.tsx`, `src/app/api/settings/api-keys/{route,validate,status}.ts`, `src/lib/crypto/envelope.ts` | Zero-state card visible; live-validate ACLED returns success/failure within 5 s; old plaintext keys migrated by `npm run migrate:user-api-keys -- --commit` |
| Tue | Tier-aware empty states across every dashboard widget + 3 humanitarian tools | `src/components/app/dashboard-widgets/*.tsx`, `src/app/app/{humanitarian,geospatial-monitor,risk-monitor}/page.tsx` | New user (no keys) sees no error widgets; configure-key CTA links to anchor in Settings |
| Wed | Onboarding S1 enhancements (domain confirm card on Step 2, capability preview on Step 3, premium-key deep link on Step 4) | `src/app/onboarding/{step-perspective,step-working-style,completion-success}.tsx`, `src/lib/data-feeds/capabilities.ts` | Playwright `tests/e2e/onboarding-newuser.spec.ts` passes (signup → onboard → 4 widgets render → land in dashboard) |
| Thu | gitleaks pre-commit + secret-scan CI step + npm audit safe upgrades for the critical vuln | `.pre-commit-config.yaml`, `.github/workflows/ci.yml`, `package.json` | `npm audit --omit=dev` reports 0 critical; pre-commit blocks a fixture secret |
| Fri | Profile / Settings shell consolidation (Sub-pages: Profile · API Keys · Model Preferences · Graph Backend · Notifications) + ship to staging | `src/app/app/settings/{layout,page}.tsx`, sub-pages | All settings reachable via one shell; no tool-local settings dialogs left; staging deploy URL recorded in `docs/CONTINUATION.md` |

**Tests gate (must be green before Friday push):**
```bash
cd C:\Users\giuli\praxiscodexworking
npx tsc --noEmit
npm run build
node scripts/audit-ai-routes.mjs
npm run audit:gcp
npx vitest run
npm run smoke:public
```

---

### 🟡 Sprint 2 — Analysis Wave + Advisor Council v2 (Week 2026-05-04 → 2026-05-08)

**Personas:** Sara (journalist), Inés (UN officer), Marcus (mediator)
**Layers on:** Master plan Phase B + Tool Roadmap Phase 1
**Goal:** Analysis-category tools all calibrated, sourced, and stable. Four-flagship advisor council shipped on landing + inside app.

| Day | Deliverable | Files | Acceptance |
|---|---|---|---|
| Mon | Risk Monitor v2 + Early Warning v2 wired to feed-aggregator (no constants) | `src/app/app/{risk-monitor,early-warning}/page.tsx`, `src/lib/analytics/{risk-engine,escalation-scorer}.ts`, `src/app/api/ai/{risk-assessment,escalation-scan}/route.ts` | Live feed contributions visible per dimension; "no data" never blank, always sourced reason |
| Tue | Stakeholder Map (MAW + Mendelow toggle) + Info Environment label stability | `src/app/app/{stakeholder-map,info-environment}/page.tsx`, `src/components/visualizations/force-graph.tsx`, embedding cluster module | Force graph stays under 16 ms/frame at 500 nodes; same situation × same time = identical labels twice |
| Wed | Advisor Council v2 — 4 flagships (Takeda · Adeyemi · Reyes · Vanderberg) seeded; admin editor live | `scripts/seed-advisors.ts`, `src/app/app/admin/advisors/page.tsx`, `src/components/landing/advisory-council.tsx`, `src/lib/ai/providers.ts::resolveAdvisorModel` | Landing renders 4; "Ask [name]" deep-links; per-advisor model tier honoured; red-line audit script passes |
| Thu | ARGUS (alert queue), Alert Center (matrix view), Sources Library (health badges), Human Rights (OHCHR + HRW + Amnesty merge) | `src/app/app/{argus,alert-center,sources,human-rights}/page.tsx`, `src/lib/data-feeds/{ohchr,reliefweb}-client.ts` | Alerts dismiss/snooze persist per-user; bulk-ack works; HR merge dedupes by URL |
| Fri | Pub/Sub topics: `alerts.high-severity` + `commitments.breach` (publisher only) + ship | `infrastructure/setup-gcp.sh`, `src/lib/pubsub/publishers.ts` | `gcloud pubsub topics list` shows them; staging deploy green; smoke:golden-path passes |

---

### 🟠 Sprint 3 — Drafting Wave + Citation System (Week 2026-05-11 → 2026-05-15)

**Personas:** Inés (UN), Dr. Okafor (think-tank), Sara (journalist)
**Layers on:** Tool Roadmap Phase 2
**Goal:** Drafting tools produce DPPA-ready, citation-rigorous, audience-tuned outputs.

| Day | Deliverable | Files | Acceptance |
|---|---|---|---|
| Mon | **Citation engine** — every AI route attaches a `citations[]` array; viewer renders inline `[N]` pills with hover provenance | `src/lib/ai/citations.ts`, `src/components/praxis/citation-pill.tsx`, every drafting AI route | A briefing renders ≥ 5 citations with working source pills; copy/paste preserves Markdown footnotes |
| Tue | Briefing Room v2 (DPPA template + agenda + background pack) + Talking Points length presets + audience tone | `src/app/app/{briefing,talking-points}/page.tsx`, `src/app/api/ai/{briefing-generate,talking-points}/route.ts` | DPPA template renders correct sections (Headline, Situation, Analysis, Recommendations, Annex); Inés persona passes user-test rubric |
| Wed | Report Studio citation styles (Chicago / AP / UN-DPPA), Dossier salience-ordered sections | `src/app/app/{report,dossier}/page.tsx`, `src/lib/ai/prompts/citation-styles.ts` | Switching style re-renders without re-generation; Dossier section order matches MAW salience output |
| Thu | PRAXIS Assistant memory (last 10 turns + advisor voice picker + claim citations) + Policy Memo evidence-base footer | `src/app/app/{assistant,policy-memo}/page.tsx`, `src/lib/ai/memory.ts` | Memory persists across reload; advisor voice swap mid-thread works; evidence-base footer renders feed coverage map |
| Fri | Compare tool (A/B situation diff matrix) + Power Map (Barnett-Duvall overlay) + ship | `src/app/app/{compare,power-map}/page.tsx`, `src/lib/ai/prompts/comparison.ts` | Compare exports DOCX with clean diff table; Power Map shows 4-faces overlay toggleable |

---

### 🔴 Sprint 4 — Simulation + Intelligence Wave (Week 2026-05-18 → 2026-05-22)

**Personas:** Marcus (mediator), Jules (sanctions/treaty), Karim (researcher)
**Layers on:** Tool Roadmap Phase 3 + 4
**Goal:** High-stakes, deep-think tools shippable. Sanctions/Treaty/Legal trio gets real graph + clause-diff power.

| Day | Deliverable | Files | Acceptance |
|---|---|---|---|
| Mon | Scenarios v2 (3-horizon, probability tree, sensitivity tornado) + Negotiation Prep (Fisher-Ury structured + ZOPA viz + BATNA matrix) | `src/app/app/{scenarios,negotiation-prep}/page.tsx`, AI routes, `src/components/visualizations/{probability-tree,tornado-chart}.tsx` | Both use `getDeepThinkModel()`; outputs validate against Zod schema; UI renders all three viz primitives |
| Tue | Game Theory (payoff matrix + Schelling + sequential tree) + Mediation Designer (Berghof phases + spoiler analysis + 1325 checklist) | `src/app/app/{game-theory,mediation-design}/page.tsx`, AI routes | Game Theory deep-think runs ≤ 60 s; Mediation Designer surfaces spoilers even on sparse evidence (with caveat) |
| Wed | CONCORDIA (multi-party agent sim) + Pub/Sub `concordia.round` topic + per-round rate limit | `src/app/app/concordia/page.tsx`, `src/lib/concordia/round-runner.ts`, infra | Pub/Sub topic active; UI streams round-by-round results; rate limit holds at 1 round / 5 s / user |
| Thu | **Sanctions designation graph** + **Treaty Analyzer clause-diff** + **Legal Tracker** + **External Actors** | `src/app/app/{sanctions,treaty-analyzer,legal-tracker,external-actors}/page.tsx`, `src/lib/data-feeds/{opensanctions,icc,icj}-client.ts` | Sanctions graph renders OFAC × UN × EU overlap; Treaty diff highlights clause-level deltas with translation toggle |
| Fri | Deep Search Agent fallback hardening + actor-profiles Wikipedia enrichment + commitments breach alerts wiring + ship | `src/lib/ai/vertex-agent.ts`, `src/app/app/actor-profiles/page.tsx`, `src/lib/data-feeds/wikipedia-client.ts`, `src/lib/pubsub/handlers/commitments-breach.ts` | Agent works when Engine ID unset (graceful Gemini-grounded fallback); Wikipedia enrichment adds pre-check button; breach event emits + appears in Alert Center |

---

### 🟣 Sprint 5 — Graph Unification + Async Pipeline + Drafting Cron (Week 2026-05-25 → 2026-05-29)

**Personas:** Karim (researcher — graph), Devops Diana (ops), Inés (auto-briefings)
**Layers on:** CONTINUATION.md "Day 6 — Graph Architecture" + Cloud Tasks + Daily Brief
**Goal:** One canonical graph storage shape. Pipelines move off the request thread. Daily Brief emails real users.

| Day | Deliverable | Files | Acceptance |
|---|---|---|---|
| Mon | **Graph unification** — pick canonical Firestore shape (`users/{uid}/situations/{sid}/graph/main` with `nodes` + `edges` arrays); migration script for snapshot/subcollection variants | `src/lib/firebase/graph-service.ts`, `scripts/migrate-graph-shape.mjs`, `backend/services/firestore_sync.py` | Migration script dry-run reports diff; `--commit` migrates a fixture; readers/writers all hit one shape |
| Tue | Spanner Graph adapter wired into backend `graph_adapter.py`; settings UI exposes Spanner option safely | `backend/services/graph_adapter.py`, `src/app/app/settings/graph-backend/page.tsx` | Local docker compose still works (Falkor); Cloud Run can switch to Spanner via env; query latency p95 ≤ 200 ms on fixture |
| Wed | **Cloud Tasks pipeline** — replace synchronous pipeline call from `on_situation_created` with task enqueue; UI polls status via Firestore `pipeline_status` doc | `cloud_functions/on_situation_created/main.py`, `backend/routers/pipeline.py`, `src/hooks/usePipelineStatus.ts` | Situation create returns in < 1 s; pipeline progress visible in real-time on dashboard |
| Thu | Daily Brief cron wired to Cloud Scheduler + Resend delivery + audience tone applied | `cloud_functions/daily_brief/main.py`, `infrastructure/setup-gcp.sh`, `src/app/api/cron/generate-briefing/route.ts` | Test user receives a real email; brief honours profile preferences (length, tone, language) |
| Fri | Humanitarian + Documents + Geospatial polish; HDX freshness window per tool + IPC legend; Calendar drag-drop; ship | `src/app/app/{humanitarian,documents,geospatial-monitor,calendar}/page.tsx` | Tool freshness badge shows source × last-fetched; calendar drag persists; staging green |

---

### 🔵 Sprint 6 — Observability + MCP + Performance + Entitlements (Week 2026-06-01 → 2026-06-05)

**Personas:** Devops Diana, Felipe (mobile), all (entitlements/billing)
**Layers on:** Master plan Phase C + Phase D + CONTINUATION.md "Day 3 — Pricing" + "Day 7 — MCP"
**Goal:** Production-grade ops, agentic operations, mobile budget, billing reliability. Final golden-path passes from cold signup to brief in ≤ 10 minutes.

| Day | Deliverable | Files | Acceptance |
|---|---|---|---|
| Mon | `/app/admin/diagnostics` page (GCP strip · feed matrix · credits ledger · tool error rate · route latency) | `src/app/app/admin/diagnostics/page.tsx`, `src/lib/diagnostics/probes.ts` | All 5 panels render real data; admin-only via `ADMIN_ALLOWLIST`; refresh ≤ 5 s |
| Tue | Cloud Monitoring policies applied + Notification Channel (PagerDuty or webhook); BigQuery `tool_invocations` schema reconciled + 100% sampling | `infrastructure/monitoring-alerts.sh`, `backend/services/bigquery_client.py`, `src/lib/api/with-calibration.ts` | Test alert reaches channel; BigQuery shows last 24h tool_invocations rows |
| Wed | **MCP server** skeleton (`backend-mcp/`) with auth + situation-permission checks + 7 tools | `backend-mcp/{main.py,tools/*.py,auth.py}`, infra deploy | Codex/Claude Code can call `list_situations` and `get_situation_context` against staging |
| Thu | **Bundle slim + mobile** — sidebar code-split (38 KB → ≤ 15 KB), tool pages lazy-load viz components, optimistic streaming for AI Populate, sidebar collapses < 768 px | `src/components/app/app-sidebar.tsx`, `src/components/visualizations/index.ts`, `src/components/praxis/ai-populate.tsx` | Lighthouse mobile ≥ 85; first contentful paint ≤ 2 s on simulated 3G |
| Fri | **Entitlements** model split from internal credits (Stripe webhook plan-name normalize); **Global Search** (Firestore native KNN over situations + documents + tool outputs); **golden-path final** + production deploy | `src/lib/billing/entitlements.ts`, `src/app/api/stripe/webhook/route.ts`, `src/app/app/global-search/page.tsx`, `tests/e2e/golden-path.spec.ts` | golden-path Playwright passes end-to-end on staging; cold signup → brief in ≤ 10 min; production deploy via Cloud Build |

---

## 8. Master TODO List (ticket-ready)

> Copy each line into Linear / GitHub Issues. Format: `[sprint-day] tag: title — acceptance`

### Sprint 1
- [ ] `[1-Mon] settings:` Server-only API key writes + envelope crypto wired — old plaintext doc empty post-migration
- [ ] `[1-Mon] settings:` Per-provider live validate endpoints — ACLED success ≤ 5 s
- [ ] `[1-Tue] ux:` Tier-aware empty states across dashboard widgets + humanitarian + geospatial + risk-monitor — zero error widgets for keyless user
- [ ] `[1-Wed] onboarding:` Step 2 domain confirm card from `classifyDomain` — auto-suggests + override
- [ ] `[1-Wed] onboarding:` Step 3 capability preview pulled from `resolveFeedCapabilities`
- [ ] `[1-Wed] onboarding:` Step 4 deep-link to API keys for premium-leaning lenses
- [ ] `[1-Wed] tests:` `tests/e2e/onboarding-newuser.spec.ts` green
- [ ] `[1-Thu] sec:` gitleaks pre-commit + CI step + critical npm vuln resolved
- [ ] `[1-Fri] settings:` Single Settings shell with 5 sub-pages

### Sprint 2
- [ ] `[2-Mon] tools:` Risk Monitor v2 + Early Warning v2 wired to feed-aggregator
- [ ] `[2-Tue] tools:` Stakeholder Map MAW/Mendelow toggle + Info Env label stability
- [ ] `[2-Wed] advisors:` 4 flagships seeded + admin editor + landing rewrite + per-advisor model
- [ ] `[2-Thu] tools:` ARGUS queue + Alert Center matrix + Sources Library health + Human Rights merge
- [ ] `[2-Fri] infra:` `alerts.high-severity` + `commitments.breach` topics published

### Sprint 3
- [ ] `[3-Mon] platform:` Citation engine — every AI route returns `citations[]`; viewer renders pills
- [ ] `[3-Tue] tools:` Briefing Room DPPA template + agenda + background pack
- [ ] `[3-Tue] tools:` Talking Points length presets + audience tone
- [ ] `[3-Wed] tools:` Report Studio citation styles + Dossier salience ordering
- [ ] `[3-Thu] tools:` PRAXIS Assistant memory + advisor voice + Policy Memo evidence footer
- [ ] `[3-Fri] tools:` Compare A/B diff DOCX + Power Map Barnett-Duvall overlay

### Sprint 4
- [ ] `[4-Mon] simulation:` Scenarios 3-horizon + Negotiation Prep ZOPA/BATNA
- [ ] `[4-Tue] simulation:` Game Theory deep-think + Mediation Designer Berghof + 1325
- [ ] `[4-Wed] simulation:` CONCORDIA agent sim + concordia.round Pub/Sub + rate limit
- [ ] `[4-Thu] intel:` Sanctions designation graph + Treaty Analyzer clause-diff + Legal Tracker + External Actors
- [ ] `[4-Fri] intel:` Deep Search Agent fallback hardening + actor-profiles Wikipedia enrichment + commitments breach alerts

### Sprint 5
- [ ] `[5-Mon] graph:` Canonical Firestore graph shape + migration script
- [ ] `[5-Tue] graph:` Spanner Graph adapter + settings UI option
- [ ] `[5-Wed] async:` Cloud Tasks pipeline; UI polls `pipeline_status`
- [ ] `[5-Thu] notif:` Daily Brief cron + Resend email + audience-tone applied
- [ ] `[5-Fri] tools:` Humanitarian + Documents + Geospatial + Calendar polish

### Sprint 6
- [ ] `[6-Mon] ops:` Diagnostics page (GCP · feeds · credits · errors · latency)
- [ ] `[6-Tue] ops:` Monitoring policies + notification channel + BigQuery `tool_invocations`
- [ ] `[6-Wed] mcp:` `backend-mcp/` skeleton + 7 tools + auth + situation-permission
- [ ] `[6-Thu] perf:` Bundle slim + mobile budget (Lighthouse ≥ 85, FCP ≤ 2 s)
- [ ] `[6-Fri] billing:` Entitlements model split from internal credits + Stripe webhook normalized
- [ ] `[6-Fri] search:` Global Search via Firestore native KNN
- [ ] `[6-Fri] qa:` golden-path final + production deploy

---

## 9. Definition of Done (every PR)

- ✅ `npx tsc --noEmit` clean
- ✅ `npm run build` clean
- ✅ `node scripts/audit-ai-routes.mjs` clean (every AI route has `withCalibration` + credit key + schema)
- ✅ `npm run audit:tools` shows the touched tool's calibration score did not drop
- ✅ `npm run audit:gcp` clean if infra touched
- ✅ Vitest unit tests for any new module
- ✅ Per-tool smoke test added (`tests/tools/<tool>.smoke.test.ts`) when a tool was touched
- ✅ Manual run on a real situation (or Nordalia demo)
- ✅ Mobile-friendly: 380-wide viewport renders without horizontal scroll
- ✅ `CHANGELOG.md` `[Unreleased]` section updated
- ✅ `docs/CONTINUATION.md` "What was done" section appended
- ✅ Commit follows caveman-commit format (one-line conventional, body only when "why" non-obvious)
- ✅ **No `Co-Authored-By` lines.** Author = `giuliocatanzariti@gmail.com` only
- ✅ No secrets in source (gitleaks pre-commit must pass)

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Graph migration corrupts existing situations | Dry-run script; dual-read window; backup Firestore export before `--commit` |
| Cloud Tasks introduces latency spike on cold start | Min instances = 1 on backend; warmup ping in scheduler |
| Citation engine regression on legacy tool outputs | Outputs without `citations[]` render with "(no citations attached)" caveat — non-breaking |
| Daily Brief email volume spikes credit/cost | Per-user opt-in; daily cap; BigQuery cost dashboard pages on burn |
| MCP server widens auth surface | OIDC + per-situation permission check + read-only by default; write tools gated by separate scope |
| Stripe webhook plan-name change breaks existing customers | Keep alias map (`tierId` ↔ `planId`); golden-path test covers both shapes |
| Spanner adoption stalls on cost | Spanner Graph as opt-in; FalkorDB stays default for self-hosters; doc the cutover |

---

## 11. Success Metrics — Measure End of Sprint 6

| Metric | Today | Target |
|---|---|---|
| Cold signup → first cited brief | Unknown (>30 min in dry runs) | ≤ 10 min |
| Tools with green smoke test | ~0 of 48 | 48 of 48 |
| `audit:tools` average score | Unknown | ≥ 9 / 11 across all calibrated routes |
| Lighthouse mobile (dashboard) | Unknown (suspected ≤ 60) | ≥ 85 |
| Median tool latency p95 | Unknown | ≤ 8 s |
| GCP critical alerts active | 0 | ≥ 5 (5xx burn, feed staleness, cron failure, BigQuery cost, secret leak) |
| Open critical npm vulns | 1 | 0 |
| Plaintext API keys in Firestore | Some legacy | 0 |
| Graph storage shapes in active use | 3 | 1 canonical |
| MCP tools live | 0 | 7 |

---

## 12. Stretch (Sprint 7+)

- Team workspaces + RBAC (Part 4 spec)
- Voice-first PRAXIS (whisper ASR + TTS for field use)
- Wikipedia + OpenSanctions ingestion into ACO graph as confidence-tagged nodes
- Customer-controlled data residency (EU project + Spanner regional)
- Marketplace of advisor voices (community-contributed, vetted)
- Plugin SDK for third-party tool authors
- Trustworthiness engine V2 — claim-level scoring with provenance

---

## 13. Kickoff

See **[`docs/CODEX_KICKOFF_PROMPT.md`](../../CODEX_KICKOFF_PROMPT.md)**.

Codex starts each sprint Monday morning with a fresh clone into `C:\Users\giuli\praxiscodexworking`.

Sprint 1 starts: **Monday 2026-04-27**.

— *End of plan.*
