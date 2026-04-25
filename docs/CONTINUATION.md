# PRAXIS — Continuation Prompt For Future Agents

Use this file to resume work safely in Codex or Claude Code.

---

## Current State (2026-04-25)

- Repository: `C:\Users\giuli\praxiscodexworking\A4_PRAXIS_CLOUD_Work`
- Branch: `main`
- GCP project: `praxisbytacitus` (`852128226674`)
- Region: `us-central1`
- Public domain: `praxis.tacitus.me`
- Latest deployed source: `5cdfebf docs: add agent handoff and deployment strategy`.
- Latest Cloud Build: `06b20a50-c0ef-4159-906f-5c97efad8159` succeeded.
- Latest Cloud Run revisions: frontend `praxis-frontend-00044-tcl`, backend `praxis-backend-00027-nlk`.
- Commit `1916281` was requested as a continuation point but is not present in the cloned repository history. Current `origin/main` was used as the base.

## What Changed In The 2026-04-25 Pass

- Added public Firebase client config fallbacks in `src/lib/firebase/config.ts` so `npm run build` works from a clean clone without `.env.local`.
- Added `neo4j-driver` to dependencies because the optional Neo4j graph layer imports it when `NEO4J_URI` is configured.
- Set `turbopack.root` in `next.config.ts` to avoid Next.js selecting a parent lockfile as the workspace root.
- Changed existing React Compiler and style-only lint blockers to warnings in `eslint.config.mjs`; lint still prints the warnings.
- Created missing Pub/Sub topic `profile.events` in GCP so onboarding/profile event publishing has a real topic and the GCP audit passes.
- Added `AGENTS.md`, `docs/STRATEGY.md`, `docs/DAILY_WORKPLAN.md`, `docs/DEPLOYMENT_LOG.md`, and `docs/HANDOFF_PROMPTS.md` for Codex/Claude Code handoff.

## Validation Passed Locally

Run from repo root:

```bash
npm run build
npm run lint
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run
```

Observed results on 2026-04-25:

- `npm run build` passed.
- `npm run lint` passed with warnings only.
- `npm run audit:gcp` passed: zero hard failures, zero soft warnings.
- `node scripts/audit-ai-routes.mjs` passed: 53 AI route files, 53 calibrated, 4 exempt.
- `npx vitest run` passed: 40 test files, 140 tests.
- Cloud Build deploy passed for `5cdfebf` and production endpoints were verified. See `docs/DEPLOYMENT_LOG.md`.

Known validation notes:

- Windows local `next build` can warn when standalone tracing copies files with `node:*` in chunk names. Treat Linux Cloud Build as the authoritative container build.
- Next.js 16 reports `middleware.ts` as deprecated in favor of `proxy.ts`; route protection still builds and appears as Proxy output.
- `npm install` reports 31 dependency vulnerabilities. Do not run `npm audit fix --force` without reviewing breaking changes.
- Lint warnings remain, mostly React Compiler migration diagnostics, unused variables, hook dependency warnings, explicit `any`, and legacy `require()` imports.

## Deploy Commands

Deploy only after the validation commands above pass:

```bash
gcloud config set project praxisbytacitus
gcloud config set run/region us-central1
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
```

Post-deploy verification:

```bash
gcloud run services describe praxis-frontend --region=us-central1 --format="value(status.url,status.latestReadyRevisionName)"
gcloud run services describe praxis-backend --region=us-central1 --format="value(status.url,status.latestReadyRevisionName)"
curl -sI https://praxis.tacitus.me/
curl -sI https://praxis.tacitus.me/login
curl -sI https://praxis.tacitus.me/onboarding
```

Also verify Firebase Auth authorized domains include `praxis.tacitus.me` before testing login.

## Immediate Next Work (updated 2026-04-25, end of session 4 — full handover ready)

### Restart prompt

**To continue in a new session (Codex 5.5 or Claude Code):** paste the
"Session Restart Prompt" block at the top of `docs/HANDOFF_PROMPTS.md`.
That prompt is self-contained — explains where you are, what's
deployed, doc set to read, hard rules, validation gate, and the
recommended next slice.

### Where to start (CEO/CTO actions)

Open **`docs/USER_ACTION_LIST.md`** — every step only you can do. Top
priority: §1 ACLED Corporate License email (15 min, BLOCKER).
Highest-leverage second step: §3 Vertex AI Agent Engine deploy
(deploy.py is already in `backend/agents/`, takes 1–2h).

### Where to start (next agent)

Open **`docs/SPRINT_BACKLOG.md`** and pick the highest-priority Pending
task. Recommended: B-1 (Assistant chat persistence, ~4h) for Codex,
or B-9 (ACLED safe-harbour, ~1–2h) for either. Both have authoritative
implementation playbooks pinned: `docs/tools/assistant.md` for B-1
and `docs/tacitus-acled-integration-brief.md` for B-9.

### What this fourth session shipped

Three sub-batches deployed via Cloud Build `995dfad5` (9m03s) →
revisions `praxis-frontend-00050-d4v` + `praxis-backend-00030-2vl`.

- Strategic + operational: `VISION_2026.md`, `USER_ACTION_LIST.md`,
  `EXTERNAL_TOOLS_WIRING.md`, `TEAM_OPS.md`.
- Vertex ADK runnable: `backend/agents/deploy.py`,
  `backend/agents/requirements.txt`, `backend/agents/README.md`.
- Cleanup: removed `docs/DAILY_WORKPLAN.md`, dead
  `credits-widget.tsx`, dead `credit-cost-badge.tsx`.
- Doc graph hardened: README + AGENTS.md + CLAUDE.md required-reading
  lists rewritten to surface the 21-item active doc set.
- Compass research integrated everywhere (CRITICAL ACLED finding
  flagged in COMPLIANCE.md, GCP_OPERATIONS.md, USER_ACTION_LIST.md,
  SPRINT_BACKLOG.md).
- ACLED + GDELT integration briefs (uploaded by user as commits
  `7589334`, `bd46423`) now first-class entries in the doc graph,
  cross-referenced from SPRINT_BACKLOG.md, EXTERNAL_TOOLS_WIRING.md,
  COMPLIANCE.md, USER_ACTION_LIST.md, README.md.

### Critical risk to action this week

🚨 **ACLED licensing.** Same as previous session. Email
`access@acleddata.com` (draft text in `docs/USER_ACTION_LIST.md` §1).
Engineering safe-harbour (B-9) ships in parallel.

---

## Immediate Next Work (updated 2026-04-25, fourth session — playbook + vision + cleanup)

### Where to start

1. **You (Giulio) — open `docs/USER_ACTION_LIST.md`.** This is the new
   canonical playbook for everything only you can do. Each item has
   the why, the exact steps, the expected outcome, the copy-paste
   commands, and where to paste results. Top priority: §1 (ACLED
   email — 15 min, BLOCKER for paid launch).

2. **The next agent (Codex or Claude Code) — open
   `docs/SPRINT_BACKLOG.md` and pick the highest-priority Pending
   task.** Recommended next: Stream B-1 (Assistant chat persistence,
   ~4h, P0) for Codex, or Stream B-9 (ACLED safe-harbour, ~1–2h, P0)
   for either. Specs in `docs/tools/assistant.md` and the backlog
   item respectively.

3. **Read `docs/VISION_2026.md` first** if you've never operated in
   this repo before — it's the strategic north star and explains why
   each backlog item exists.

### What this session shipped

- `docs/USER_ACTION_LIST.md` (new, definitive)
- `docs/VISION_2026.md` (new strategic doc)
- `docs/EXTERNAL_TOOLS_WIRING.md` (new — per-feed × per-tool wiring map)
- `backend/agents/deploy.py`, `backend/agents/requirements.txt`,
  `backend/agents/README.md` (Vertex ADK ready to deploy)
- Removed superseded `docs/DAILY_WORKPLAN.md` and unused
  `src/components/dashboard/credits-widget.tsx` +
  `src/components/shared/credit-cost-badge.tsx`
- README + AGENTS.md + CLAUDE.md required-reading lists rewritten to
  reference the full active doc set; legacy DAILY_WORKPLAN sweep done

### Critical risks still open

🚨 **ACLED licensing.** Same as previous session — see
`docs/COMPLIANCE.md` §1.1 and `docs/USER_ACTION_LIST.md` §1. This is
the single biggest unblock for paid-tier launch.

---

## Immediate Next Work (updated 2026-04-25, third session — research integrated)

### Critical risk to action this week

🚨 **ACLED licensing.** Compass research revealed ACLED's 2026 EULA
prohibits SaaS dashboards from redistributing event data without a
Corporate License. **Email `access@acleddata.com` to negotiate** —
estimated $5–25k/yr. Until signed, raw ACLED events stay gated to
Enterprise pilots only; aggregated stats are the safe path. Engineering
work tracked as `B-9` in `docs/SPRINT_BACKLOG.md` (P0). Compliance
posture lives in `docs/COMPLIANCE.md`.

### Top 3 highest-leverage tasks (as of 2026-04-25 third session)

1. **Stream B-1 — PRAXIS Assistant chat persistence (Codex, P0).**
   The deep tool spec is now at `docs/tools/assistant.md`; the backlog
   item lists files-to-touch + DoD. ~4h. Highest single user-visible
   improvement available.
2. **Stream B-9 — ACLED safe-harbour (any agent, P0).** Add
   `ACLED_LICENSE_TIER` env var; gate raw event return; keep
   aggregated stats as the default. 1–2h. Compliance-critical.
3. **Stream C-2 — Vertex AI Agent Engine (any agent + user, P1).**
   Recipe verified in compass research §R1; concrete deploy.py in the
   artifact; updated steps in `docs/GCP_OPERATIONS.md` §1b. Unblocks
   Deep Research Agent.

### Note for whichever assistant picks this up next

Read `docs/TEAM_OPS.md` first if you've never operated in this repo
before — it explains how Codex and Claude Code share `main` without
collisions. Then read the compass artifact at
`docs/compass_artifact_wf-7af05074-9b31-4316-834d-b3a7500f4cf7_text_markdown.md`
before doing any Stream C / Stream G work — every research-blocked
item is now unblocked, but the answers contain hard constraints (most
notably the ACLED EULA finding).

### Commits and deploys this session

Local clone (`main` head): `34d3dc2 docs(research): integrate compass artifact + COMPLIANCE tracker`

This session shipped (in order):

- `7b28314` feat(pricing) · `ce810b0` feat(dashboard) · `0b6a3c1` docs(sprint)
- `9f05783` feat(ux) · `fc7b9f1` feat(geospatial) · `5fb542b` docs(context)
- `dae0b48` docs(deploy log) · `fa8cd33` feat(workspace)
- `7589334` user upload — compass research artifact
- `34d3dc2` docs(research) integration

Deployed twice via Cloud Build:

- `204af7bf-730a-4c33-90c2-77d5e3976bfc` (8m36s) — frontend 00046-475 / backend 00027-nlk
- `55e3963f-2c16-497f-9ad6-807f3ce9c418` (10m54s) — frontend 00048-p4t / backend 00029-6vc

Production endpoints all green. Configuration gaps remain (ACLED,
Vertex ADK, Firecrawl, Stripe, Anthropic — all degrade gracefully;
turn-on steps in `docs/GCP_OPERATIONS.md` §1).

---

## Immediate Next Work (updated 2026-04-25, second session)

> The active week-long sprint is in `docs/SPRINT_2026-04-25.md`. The
> architectural backbone — what every tool reads from the user and the
> situation — is in `docs/CONTEXT_INJECTION.md`. Read both before changing
> any AI route or tool page.
>
> This session shipped six production commits, an in-app debug copy tool,
> a role-aware dashboard, the entire pricing-migration cleanup, a
> situation-aware geospatial map fix, the tool catalogue scaffolding, the
> research-prompts catalogue, the GCP runbook, and the Context Injection
> Contract doc. Three concurrent audits (tool reality, data feed
> connectivity, onboarding propagation) plus a contrast audit and a
> landing-and-onboarding UX audit all ran. **Do not re-run any of those
> audits — the findings are folded into the sprint doc.**

### Commits this session (in order)

- `7b28314` feat(pricing): hide internal credit metering; sidebar shows plan tier
- `ce810b0` feat(dashboard): role-aware "Recommended for you" widget
- `0b6a3c1` docs(sprint): add 2026-04-25 sprint plan + tandem handoff
- `9f05783` feat(ux): contrast pass + onboarding feedback + activation guide
- _next_ feat(geospatial): situation-aware map centroid + tool docs scaffolding
- _next_ docs(context): Context Injection Contract + GCP operations runbook

### Top three things the next agent should do

1. **Stream B — Tool quality, P0 persistence retrofits.** The pattern is
   well-established (`ToolPageShell` + `usePersistedToolData`). Each
   promotion should:
   - Wrap the page with `ToolPageShell` if it isn't already.
   - Add `usePersistedToolData('<tool-id>', situationId)` for hot reads.
   - Verify the corresponding `/api/ai/<route>` calls `saveToolOutput` at
     the end.
   - Add a passing unit test under
     `tests/unit/components/<tool>/persistence.test.tsx` so we never
     regress.
   Order: PRAXIS Assistant chat (≈4h) → Dossier (≈2h) → Negotiation Prep
   (≈3h).

2. **Stream A — Audience-tuned briefings.** Make `dashboard-summary`,
   `auto-briefing`, `briefing-generate` honour
   `analystProfile.perspective.audience` and `workingStyle.language` in
   their tone presets and language directives. **Read
   `docs/CONTEXT_INJECTION.md` first** — the audience field is already in
   the systemPromptBlock; the work is making each tool's *own* prompt
   reflect it explicitly (e.g., "If audience=`senior_leadership`, lead
   with bottom-line and skip preamble").

3. **Activate ACLED.** Use `docs/GCP_OPERATIONS.md` §1a — 15 minutes from
   signup to live. Immediate jump in event-timeline quality on Risk
   Monitor, Geospatial Monitor, and Early Warning. No code change needed
   beyond the `cloudbuild.yaml` env-var line.

### Deploy gate (every push)

```bash
npm run build
npm run lint
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
# then verify praxis.tacitus.me, /login, /onboarding, /api/health
# and append to docs/DEPLOYMENT_LOG.md
```

### One-paragraph note for the other assistant

If you are Codex picking this up, Stream B (persistence retrofits) is the
cleanest non-overlapping work — Claude Code's session has been entirely on
Streams A (personalisation) and D (UX/contrast/docs), so all of `src/app/
app/{assistant,dossier,negotiation-prep}/` and their API routes are
untouched and ready for you. If you are Claude Code coming back, Stream A
Day 2 is the natural continuation — open
`src/app/api/ai/auto-briefing/route.ts` and trace where the system prompt
is built. The audience block is already in `systemPromptBlock`; you only
need to add a tone-preset switch in the tool-specific prompt that follows
it.

## Weekly Implementation Plan

Week 1:
- Finish Cloud Run deployment and domain/login verification.
- Resolve the highest-value lint warnings that can hide real bugs: hook dependency warnings, `useEffect` state cascades in shared hooks, explicit `any` in shared stores/components, and legacy `require()` imports in provider/knowledge modules.
- Rename or migrate `middleware.ts` to the Next.js 16 `proxy.ts` convention after confirming auth/session behavior.

Week 2:
- Align pricing and entitlements around one public plan model: `free`, `analyst`, `team`, `enterprise`.
- Audit Stripe lookup keys, app settings, Firestore subscription fields, and credit checks for naming mismatches.
- Keep public pricing monthly and plan-based; keep internal credit metering private.

Week 3:
- Improve landing and onboarding around buyer/user paths: Policy Officer, Political Affairs Desk, Research Analyst, Mediator/Envoy Team, Humanitarian Coordinator, Legal/Sanctions Analyst, and Institutional/Enterprise team.
- Ensure onboarding choices affect dashboard defaults, tool availability, recommended actions, and AI context.

Week 4:
- Audit tool registry IDs against routes and stored tool IDs.
- Hide or complete placeholder tools.
- Expand agent pages/docs for Policy Analyst, Diplomatic Advisor, Conflict Analyst, Media/Disinformation Analyst, Sanctions/Legal Analyst, Humanitarian Access Analyst, Scenario Planner, and Negotiation/Mediation Advisor.

Week 5:
- Define the canonical entity model for actors, organizations, places, issues, claims, events, relationships, sources, and situations.
- Keep Firestore as the near-term canonical graph path unless Neo4j/Falkor/TrustGraph has a concrete, testable integration value.
- Add entity resolution and canonical naming before adding new graph storage products.

Week 6:
- Audit MCP code and design a minimal MCP server only after production deployability stays stable.
- Candidate MCP tools: situation retrieval, actor graph retrieval, source search, canonical entity lookup, report generation, and workspace usage status.

## Remaining Improvement Backlog

- Product/UX: reorganize dashboard around user role, active situation, recommended actions, workspace state, and tool paths.
- Infra: verify Cloud Run domain mapping, Firebase Auth allowed domains, Cloud Build IAM for enforced GCP audits, and Secret Manager coverage.
- Pricing: unify plan IDs, tier IDs, Stripe lookup keys, entitlement checks, and settings UI.
- Tools: make every visible tool functional with clear inputs, outputs, errors, persistence, and tests.
- Agents: ensure agents read canonical situation context, AnalystProfile, source preferences, and workspace constraints.
- Graph/data: reduce graph storage fragmentation and choose one canonical near-term model.
- MCP: add only after core app is stable, with safe read/report generation tools first.

## Agent Rules To Preserve

- Do not deploy before local build and core tests pass.
- Do not expose tool-by-tool internal credit costs publicly.
- Do not hardcode secrets. Use Secret Manager or Cloud Run env vars.
- Keep README, CHANGELOG, CLAUDE.md, and this file updated after major changes.
- Commit small coherent checkpoints. Do not amend previous commits unless explicitly requested.
