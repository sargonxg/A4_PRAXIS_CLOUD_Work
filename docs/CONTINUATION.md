# PRAXIS — Continuation Prompt For Future Agents

> **2026-04-29 Codex continuation — grounded-search intelligence spine**
>
> Current product direction: grounded Google Search is the primary live
> research path for PRAXIS. Structured public feeds such as GDELT, ReliefWeb,
> UN News, UCDP, HDX, UNHCR, World Bank, SIPRI, and Crisis Group are
> corroborating and quantitative layers.
>
> New plan:
> `docs/PRAXIS_GROUNDED_SEARCH_INTELLIGENCE_SPINE_2026-04-29.md`.
>
> Code changed in this wave:
> - `src/lib/data-feeds/feed-aggregator.ts`: grounded search now runs in the
>   v1 and conflict-profile aggregators as the primary source path.
> - `src/lib/data-feeds/aggregator-v2.ts`: user-aware intelligence now runs
>   grounded search first.
> - `src/lib/data-feeds/ucdp-client.ts`: UCDP now uses versioned endpoints
>   and `UCDP_API_TOKEN` / `x-ucdp-access-token`; UCDP conflicts are visible
>   intelligence-feed items.
> - `src/app/app/source-monitor/page.tsx`: grounded search is listed first and
>   the page now sends valid `country/query` API payloads.
> - `src/lib/providers/registry.ts`,
>   `src/app/api/settings/api-keys/[provider]/validate/route.ts`,
>   `src/lib/data-feeds/resilient-fetch.ts`, prompts, and source-monitor copy
>   were updated to remove active ACLED dependency claims.
>
> Next required work: persist source evidence records, add source/provider
> badges, wire Firecrawl scrape-on-demand, wire Parallel.ai second-lens
> enrichment, add commitment/media extraction schemas, and connect all graph
> nodes/edges to source fragment IDs.

> **2026-04-29 Codex continuation — grounded-search route/tool hardening**
>
> Follow-up implementation completed:
> - `src/lib/ai/web-research.ts` now builds richer Google-grounded query sets
>   across source preferences, actors, region, and tool-specific time windows;
>   results carry `query`, `retrievedAt`, and summary/source-receipt metadata.
> - `src/app/api/ai/grounded-search/route.ts` now uses the correct calibrated
>   tool id and credit operation, validates requests with Zod, marks the route
>   as streaming, and writes a metadata provenance trace when `situationId` is
>   present.
> - `src/app/api/ai/research-extract/route.ts` now validates request bodies,
>   uses the live source pack instead of requiring Firecrawl search, and saves
>   extraction metadata through `saveToolOutput`.
> - `src/lib/demo/demo-mode.ts` and `src/lib/demo/cached-responses.ts` now
>   handle realistic risk/evidence/mediator Ask PRAXIS prompts in no-key demo
>   mode instead of returning the generic greeting.
>
> Verification:
> - `npx tsc --noEmit`: passed.
> - Targeted ESLint for edited AI/search/demo routes: passed.
> - `npm run audit:routes`: passed, 62 AI routes calibrated and 5 exempt.
> - `npm run audit:tools`: passed; `grounded-search` and `research-extract`
>   now both score 6/11 in `docs/audits/tools-2026-04-29.md`.
> - `agent-browser` confirmed `/login?mode=demo` reaches `/demo/dashboard`;
>   `/demo/assistant` returned a concrete three-bullet Nordalia risk/evidence/
>   mediator answer with an empty AI error region.

> **2026-04-29 Codex continuation — sophisticated persona / AI trust wave**
>
> Added
> `docs/PRAXIS_SOPHISTICATED_PERSONA_WAVE_2026-04-29.md`, a five-persona
> product QA wave with a 35-item roadmap. Personas: policy director,
> mediator/envoy analyst, intelligence analyst, enterprise buyer, and skeptical
> security/trust reviewer.
>
> Subagents were used:
> - AI/tool trust explorer found 20 high-impact provenance, grounding,
>   fallback, export, and persistence risks.
> - Landing worker completed a credibility pass across hero, workflow, problem,
>   data-substrate, platform-preview, security, and TACITUS CTA sections.
> - Browser/persona explorer may still be running if this context is resumed;
>   integrate its final report before closing the next wave.
>
> Code shipped in this wave:
> - `src/app/api/ai/sanctions-scan/route.ts`: demo responses now include
>   synthetic/non-exportable metadata, and live standard scans refuse to
>   generate from model training data alone when current source retrieval
>   fails.
> - `src/lib/services/export-engine.ts`: situation-report exports no longer
>   hardcode ACLED/GDELT/ReliefWeb/Firecrawl as sources; they list supplied
>   sources or warn when no explicit source list was supplied.
> - Landing files listed in the wave doc were tightened for source, graph,
>   methodology, and review language.
>
> Next high-priority work: grounded-search receipts, append-only tool run
> history, persistence failure surfacing, Ask PRAXIS write schema validation,
> model-fallback transparency, and demo route continuity tests.

> **2026-04-29 Codex continuation — persona QA demo trust wave**
>
> Continued the structured browser/persona testing loop with `agent-browser`
> on `http://localhost:3100`. Covered first-time user, serious customer,
> returning user, power user, and skeptical security/trust reviewer
> perspectives. Details are in
> `docs/PRAXIS_PERSONA_QA_WAVE_2026-04-29.md`.
>
> Shipped focused trust/coherence fixes:
> - demo banner now describes the PRAXIS sample workspace and labels synthetic
>   Nordalia data;
> - demo dashboard Daily Intelligence Brief now renders a deterministic
>   situation-derived sample brief instead of an admin-facing AI-provider setup
>   failure;
> - Ask PRAXIS system prompt no longer uses the stale "Bloomberg Terminal"
>   product framing.
> - dashboard intelligence-feed empty state no longer instructs demo users to
>   configure retired provider-specific credentials.
> - demo welcome modal now matches the Nordalia contested-border sample
>   workspace and avoids provider-powered claims in demo onboarding.
>
> Next required QA: re-run browser checks on `/demo/dashboard`, confirm the
> stale strings are absent, then perform authenticated live Executive
> Intelligence QA with real AI credentials.

> **2026-04-29 Codex continuation — agent-browser local smoke**
>
> `agent-browser` is now available on PATH (`agent-browser 0.26.0`). Browser
> smoke on port 3100 confirmed:
> - `/` loads with content and no framework error overlay.
> - unauthenticated `/app/dashboard` redirects to login.
> - local demo login fails closed if `COOKIE_SIGNING_SECRET` is absent.
> - restarting dev with a process-scoped `COOKIE_SIGNING_SECRET` lets
>   `/login?mode=demo` enter `/demo/dashboard`.
> - demo session then redirects `/app/dashboard` to `/demo/dashboard`.
>
> Important: real authenticated Executive Intelligence browser QA is still not
> done because no real test login/session was available. Next agent should set
> a local-only `COOKIE_SIGNING_SECRET`, authenticate with a test user, create or
> select a real situation, and exercise the Executive Intelligence panel end to
> end.

> **2026-04-29 Codex continuation — executive intelligence hardening wave**
>
> Follow-up wave completed after the first Executive Intelligence build.
> Read
> `docs/PRAXIS_ITERATION_WAVE_2026-04-29_EXEC_INTEL_HARDENING.md`
> for the 5 critical and 5 secondary items.
>
> Important changes:
> - `situation-intelligence` is now a first-class registry tool.
> - Credit operation is now explicit: `ai_situation_intelligence`.
> - `POST /api/ai/situation-intelligence` writes canonical
>   `tool-data/situation-intelligence` server-side and still records
>   `saveToolOutput`.
> - Invalid AI output now returns a controlled
>   `schema_validation_failed` 502.
> - Role recommendations surface Executive Intelligence first and link to
>   `/dashboard#executive-intelligence`.
> - User-facing ACLED claims were removed from the registry, in-app docs page,
>   and landing quadrant tour surfaces touched by this wave.
>
> Validation added/run: `tests/tools/situation-intelligence.smoke.test.ts`,
> `tests/unit/lib/ai/situation-intelligence-schema.test.ts`, and
> `tests/unit/lib/dashboard/role-recommendations.test.ts`.
> Next required step remains live authenticated browser QA with real AI
> credentials and three real situations.

> **2026-04-29 Codex continuation — executive situation intelligence**
>
> Implemented the first serious PRAXIS intelligence panel from the latest
> 12-feature request. New route:
> `src/app/api/ai/situation-intelligence/route.ts`. It uses the existing
> `withCalibration` + Vertex/Gemini provider path, requires a real active
> situation, refuses thin input, validates the model output with
> `SituationIntelligenceSchema`, and saves a `saveToolOutput` artifact.
>
> New dashboard surface:
> `src/components/dashboard/executive-intelligence-panel.tsx`, mounted in
> `src/app/app/dashboard/page.tsx`. It generates on demand, persists successful
> results via `usePersistedToolData('situation-intelligence')`, restores saved
> results on reopen, renders executive diagnosis, strategic insight, causal
> timeline, actor dossiers, scenarios, risk, actions, click-through graph
> primitives, provenance, confidence, and JSON export.
>
> New test:
> `tests/unit/lib/ai/situation-intelligence-schema.test.ts` covers geopolitical,
> corporate conflict, policy memo, and invalid strategic-insight schema cases.
> Validation run: `npx tsc --noEmit`, targeted `npx eslint`, and the focused
> Vitest file passed.
>
> Next required QA: start the app with real AI credentials, authenticate, run
> the Executive Intelligence panel on three real situations, verify graph node
> click behavior, JSON export contents, Firestore persistence/reload, and
> failure/confidence behavior for weak input.

> **2026-04-29 Codex continuation — 15 app-wide improvements**
>
> Added `docs/PRAXIS_15_APP_WIDE_IMPROVEMENTS_2026-04-29.md`, a second
> execution plan with 15 top-level initiatives spanning product identity,
> first-run activation, role-aware defaults, situation health, tool-output
> reliability, Ask PRAXIS, evidence discipline, browser QA, route audits,
> security rules, deploy safety, operational visibility, document/corpus trust,
> commercial readiness, and enterprise trust.
>
> First low-risk implementation pass shipped in the working tree:
> landing/metadata source claims now align with the Google/open-data posture;
> the hero explains the concrete situation-to-brief workflow; demo CTA says
> "Explore Sample Workspace"; legacy situation wizard copy now says
> "Create New Situation" and "Situation Name"; situation creation can map
> AnalystProfile role into the situation role instead of hardcoding `analyst`;
> shared generation states use workspace-limit language instead of per-action
> credit-cost copy.
>
> Validation after this pass: `npx tsc --noEmit` passed; targeted `npx eslint`
> on the touched TS/TSX files passed with warnings only; full `npm run lint`
> and `npm run build` also passed earlier in this same session, with the known
> existing lint-warning backlog and Next middleware-to-proxy deprecation.
>
> Next recommended implementation: finish Initiative 1 by cleaning the in-app
> sidebar release notes and remaining public route copy, then run
> `npm run lint`, `npx tsc --noEmit`, `npm run build`, and
> `npx playwright test tests/e2e/landing-smoke.spec.ts`.

> **2026-04-29 Codex continuation — multi-agent superplan**
>
> Created `docs/PRAXIS_SUPERPLAN_2026-04-29.md`, a hyper-detailed
> multi-agent execution plan for continuing PRAXIS across product identity,
> first-run activation, AI evidence, browser/persona testing, Firebase/GCP,
> security, platform reliability, observability, and documentation discipline.
> It incorporates read-only subagent findings from Identity UX, QA Automation,
> and Security/Cloud/AI architecture audits.
>
> Updated `TODO.md`, `README.md`, `TESTING.md`, `SECURITY.md`,
> `DEPLOYMENT.md`, `ARCHITECTURE.md`, `CLAUDE.md`, and `AGENTS.md` so future
> agents read the superplan before older historical backlogs.
>
> Recommended next loop: execute Superplan Loop 1. Assign an Identity UX worker
> to public identity/first-run copy and a QA explorer to landing/pricing/
> onboarding assertions. Validate with `npx tsc --noEmit`, `npm run build`,
> `npm run lint`, and `npx playwright test tests/e2e/landing-smoke.spec.ts`.

> **2026-04-29 Codex continuation — root production roadmap**
>
> Added `TODO.md` as the root production continuation roadmap for the next
> agentic loops. It consolidates the current high-impact work across persona
> testing, core workflow QA, AI/LLM reliability, Firebase/GCP, security,
> documentation, and future enterprise roadmap. Added root `ARCHITECTURE.md`,
> `DEPLOYMENT.md`, `TESTING.md`, and `SECURITY.md` as compact runbooks that
> point to the deeper canonical docs. Updated README, CLAUDE, AGENTS, and
> CHANGELOG so future agents see the roadmap first.
>
> Validation already run for this baseline: `npx tsc --noEmit`,
> `npm run build`, `npm run lint`, `npm run audit:routes`, and
> `npm run audit:gcp` all passed on 2026-04-29. Build still reports the known
> Next middleware-to-proxy deprecation, and lint passes with existing warnings.
> Full `npx vitest run`, Playwright, and backend pytest remain required before
> deploy or production claims.
>
> Next practical slice: start the app locally, browser-test the five recently
> uplifted tools on an authenticated Nordalia or real situation, and update
> `docs/TOOL_QUALITY_AUDIT_2026-04-28.md` with exact works/non-empty/
> provenance/saved/reload findings before fixing the highest-impact defect.

> **2026-04-28/29 Codex continuation — backend trust boundary + Core-8 coverage**
>
> Continued the TACITUS production sprint by tightening the private backend
> boundary and making ontology coverage explicit:
>
> - `backend/auth.py` now verifies service-to-service OIDC audience and trusted
>   service-account email before accepting `X-PRAXIS-UID`.
> - `/agents/health` and `/api/v1/graph/test-connection` now require trusted
>   service auth; the graph backend settings UI calls an admin-gated Next API
>   bridge at `/api/backend/graph/test-connection`.
> - Added an allowlisted authenticated `/api/backend/*` proxy and moved the
>   browser-facing `praxisBackend` facade off direct private Cloud Run URLs.
> - Removed the legacy `/backend/:path*` rewrite from `next.config.ts`.
> - Hardened `/api/admin/set-all-credits` behind admin auth plus explicit
>   confirmation; it no longer accepts only the shared cron secret.
> - Backend CORS now allows `X-Firebase-Token` / `X-PRAXIS-UID` to match the
>   documented auth split.
> - `src/lib/graph/core-primitives.ts` adds Core-8 coverage for Actor, Claim,
>   Interest, Constraint, Leverage, Commitment, Event, and Narrative; graph
>   writes now persist `corePrimitiveCoverage`, and Conflict Graph now shows it
>   in the main workflow.
> - README, CLAUDE, AGENTIC_SYSTEM, and CORPUS_ARCHITECTURE now describe the
>   TACITUS system-of-record mission, backend trust boundary, and Core-8 graph
>   coverage.
> - `docs/PRODUCTION_TODO_2026-04-28.md` is the long-form prioritized backlog
>   for continuing production hardening.
>
> Next priorities: add Core-8 coverage to corpus traces / Ask PRAXIS warnings,
> rotate local secrets, and automate GCP audit + Firestore rules deployment.

> **2026-04-28 Codex continuation — integration readiness + security hardening**
>
> Continued the production-readiness sprint after sub-agent review from
> architecture, GCP, security, and data/AI lenses.
>
> - Extended `/api/health/provider` with live, non-secret integration status
>   for Firecrawl, Parallel, Vertex AI Agent Engine, and Polar.
> - Updated `/app/settings/system-health` so the activation guide reflects
>   live provider readiness and names the exact missing env vars for optional
>   paid capabilities.
> - Locked `/api/admin/add-credits` and `/api/admin/advisor-feed` GET behind
>   the existing admin allowlist gate.
> - Removed unsafe cookie-signing fallbacks; signed sessions now require
>   `COOKIE_SIGNING_SECRET` and health/diagnostics report that directly.
> - Tightened `firestore.rules` for `users/{uid}` creation: clients can only
>   create the exact free-plan bootstrap profile and cannot seed Polar,
>   subscription, promo, or full-access fields.
> - Standardized backend Python/ADK model defaults on stable
>   `gemini-2.5-flash` / `gemini-2.5-pro`.
>
> Remaining high-priority items: rotate local `.env.local` secrets, harden
> backend OIDC audience/service-account checks, automate Firestore rules and
> GCP audit gates, and mount `VERTEX_AGENT_ENGINE_ID` only after the Agent
> Engine is deployed and smoke-tested.

> **2026-04-28 Codex continuation — Evidence envelope + SKC retrieval hardening**
>
> Continued the agentic research/information-system sprint by normalizing
> generated tool outputs into a citation-ready evidence envelope:
>
> - Added `src/lib/knowledge/evidence-envelope.ts` with canonical tool-id
>   aliases, excerpt summarization, timestamp coercion, confidence mapping,
>   profile/version metadata, and `CorpusItem` projection.
> - Updated `searchSituationCorpus()` so the `tool-output` layer reads both
>   `tool-data/{toolId}` and `tools/{toolId}`. Versioned `tool-data` wins;
>   saveToolOutput-only `tools` docs now backfill into corpus retrieval instead
>   of being invisible to Ask PRAXIS / agents.
> - Updated SKC `ToolOutputLayer` related-output lookup to fall back across
>   canonical registry ids and legacy underscore keys (`risk_assessment` ->
>   `risk-monitor`, `commitment_scan` -> `commitments`, etc.) across both
>   storage paths.
> - Added focused tests:
>   `tests/unit/lib/knowledge/evidence-envelope.test.ts`,
>   `tests/unit/lib/knowledge/tool-output-layer.test.ts`, plus existing
>   corpus-search helper coverage.
> - Fixed the dashboard upgrade-link production break: public routes are no
>   longer prefixed by `PraxisLink`, and middleware plus `/app/pricing` now
>   redirect to `/pricing` to cover cached clients before auth routing.
> - Soft-metered credits so depleted balances no longer block AI execution.
>   Credits still deduct/log when present; first-value AI, search, dashboard,
>   and situation creation flows keep working.
> - Switched the post-create `/api/ai/auto-structure` stream to the standard
>   Flash model for reliability; the Pro model remains available through
>   `callProModel()` routes with fallback.
>
> Validation run: `npx tsc --noEmit` clean; focused Vitest for evidence,
> routes, evidence, tool-output layer, corpus-search helpers, and
> with-calibration passed; strict lint passed on touched files; `npm run build`
> passed and produced `/app/pricing` in the route table.
>
> Next sprint slice: add analyst notes and explicit research-run artifacts to
> the same envelope, then expose a corpus health panel showing source age,
> citation coverage, extraction failures, and retrieval latency.

> **2026-04-28 (PM) Claude handover — Five-pillar uplift shipped**
>
> Five-phase pass landed across Ask PRAXIS, Dashboard, Conflict Graph,
> Risk Monitor + Timeline, and Briefing. Spec lives at
> `docs/superpowers/specs/2026-04-28-five-pillar-uplift-design.md` and
> `CHANGELOG.md` lists every file with commit hashes.
>
> Highlights:
> - Ask PRAXIS now ships four tier-aware extension tools (`writeToTool`,
>   `firecrawlFetch`, `parallelResearch`, `runDeepResearch`) attached to
>   the calibrated chat backbone. Each returns structured
>   `requiresTier` / `requiresKey` payloads instead of failing — UI
>   surfaces upgrade / settings chips inline. Server-side
>   `delegateToAskPraxis()` helper lets every tool route ask the
>   backbone a calibrated sub-question. Tier resolver lives in
>   `src/lib/api/tier.ts`.
> - Dashboard recap is rebuilt: situation status strip, onboarding
>   recap widget, account status card with credits + premium-key
>   effective state. Light-grey surfaces replaced with white-on-navy +
>   slate-200 borders.
> - Conflict Graph has a stage-then-approve auto-populate flow.
>   `populateSituationGraph({ mode: 'staged' })` writes to
>   `graph/staged`; the user reviews a sample-by-type diff and clicks
>   Approve or Discard. New endpoint:
>   `/api/graph/approve-staged`.
> - Risk Monitor mounts a `LiveIndicatorsPanel` calling new
>   `/api/ai/risk-indicators` (Zod-validated, domain-specific catalog,
>   severity + source per indicator). Timeline mounts a
>   `LiveEventsPanel` calling new `/api/ai/timeline-events` (filterable,
>   expandable, configurable window).
> - Briefing has a drag-drop block builder
>   (`BriefBlocksPanel`) on top of `/api/ai/brief-builder`, with
>   per-block regenerate, inline edit, freeform insertion, missing-keys
>   banner, free-tier upgrade chip, markdown export.
>
> Next agent should:
> 1. Smoke-test the five tools end-to-end on a real situation
>    (recommend Nordalia) before promoting any further branding/UX
>    changes.
> 2. Wire `parallelResearch` results into a follow-up persisted state
>    so the LLM can cite a Parallel run in subsequent answers.
> 3. Hook `writeToTool` calls from the Briefing builder so the
>    assistant can populate freeform blocks directly.
> 4. Reconcile `subscription` literal — landing page uses "Institution"
>    while client/server type uses `enterprise`. Pick one and align
>    pricing copy.
>
> Run the full validation gate before any deploy:
> ```
> npx tsc --noEmit && npm run build && \
>   node scripts/audit-ai-routes.mjs && node scripts/audit-gcp.mjs && \
>   npx vitest run
> ```

> **2026-04-28 Codex handover — Core MVP tools + receipts baseline**
>
> Strategic priority remains **"every tool produces something"**. This pass
> hardened the shared path rather than hand-editing 40+ pages:
>
> - `src/components/praxis/ai-populate.tsx` now rejects successful-but-empty
>   AI responses before saving them and shows a visible generation error
>   instead of a blank tool.
> - The same shared generator now renders `OutputProvenancePanel` above
>   generated/persisted output with analyst profile version, domain version,
>   framework chips, source pills, and feed receipts where the output carries
>   them.
> - `src/components/praxis/output-provenance-panel.tsx` and
>   `tool-output-frame.tsx` now support `<analyst-profile>` style calibration
>   labels, framework chips, and feed-name + timestamp source receipts.
> - `src/lib/constants/tool-groups.ts` defines the first ten Core MVP tools:
>   Dashboard, Early Warning, Risk Monitor, Actor Profiles, Stakeholder Map,
>   Briefing, Talking Points, Negotiation Prep, Commitments, Sanctions.
> - `src/components/dashboard/core-tools-widget.tsx` surfaces those ten tools
>   on the dashboard with readiness indicators.
> - `docs/TOOL_QUALITY_AUDIT_2026-04-28.md` is the active audit table. Continue
>   by running each tool on Nordalia, clicking Regenerate, and filling
>   works/non-empty/provenance/saved/category.
>
> Next agents: prioritize real browser verification and persistence mismatches.
> The explorer found ID drift between hyphenated registry ids, underscored
> `withCalibration()` ids, `/tools/{toolId}`, and `/tool-data/{toolId}`. That
> is the likely cause when a route saves but the page renders empty.

> **2026-04-27 Round 7 (late session) — Landing refresh + Statecraft positioning + Cloud Build pending verification**
>
> ## What just shipped (commits on `origin/main`)
>
> All four are landing-page only — Codex-owned files (sidebar, dashboard,
> backend, infra) untouched.
>
> - `c6afdd4` — Hero quadrant tour panels filled with real Sahel/Mali
>   content. 14 ACO entities, 16 typed edges, real source mix in Media
>   Monitor (Reuters · AFP · Le Monde · Al Jazeera · RFI · Crisis Group
>   · ACLED · TASS · Anadolu · Africa Confidential), senior-analyst
>   exchange in Ask PRAXIS with inline OCHA/ICG/ACLED citations, EU FAC
>   briefing skeleton with ICD-203 badge in Drafting Studio, full
>   `<analyst-profile>` + `<situation-frame>` render in the Calibration
>   spine.
> - `5a1929a` — Hero headline repositioned to **"AI Built for
>   Statecraft. Calibrated to You."** Audience row replaced with seven
>   explicit roles (Diplomats · Conflict Analysts · Mediators ·
>   Humanitarian Leads · Policy Officers · Foreign-Policy Researchers ·
>   Sanctions & Compliance Teams). CTAs sharpened to outcome-led. AI
>   companion section retitled "Generic AI guesses. PRAXIS knows your
>   mandate." Pricing rebalanced: Demo (free, read-only) · Analyst
>   single licence **\$49 → \$100/mo** · Team **\$199 → \$499/mo** ·
>   Institution custom.
> - `0548c78` — Waitlist replaced with a "Talk to TACITUS" section:
>   `hello@tacitus.me` + `tacitus.me` CTAs and a three-card "What
>   TACITUS is building" block (Today · PRAXIS, Next · Calibrated
>   agents, Building · Institutional graph). Component export name
>   preserved.
> - `b088e8f` — Share-metadata + SEO refresh. New OG image with portal
>   ring + "AI Built for Statecraft" headline + source pills.
>   Root-layout metadata expanded (title template, applicationName,
>   keywords, og/twitter, robots `max-image-preview: large`,
>   appleWebApp). Landing JSON-LD split into SoftwareApplication +
>   Organization (with `hello@tacitus.me`) + WebSite nodes.
>
> ## Validation gate run (all green)
>
> - `npx tsc --noEmit` — clean.
> - `npm run build` — `Errors: 0 | Warnings: 0`.
> - `node scripts/audit-ai-routes.mjs` — `58 calibrated · 4 exempt`.
> - `node scripts/audit-gcp.mjs` — `0 hard / 0 soft`.
>
> ## Deploy state — LIVE on praxis.tacitus.me
>
> Cloud Build `b2287473-897e-49be-92c5-33a051932420` reached `SUCCESS`
> while the Claude session was idle. Curl smoke-test from the
> non-authenticated session confirms the new revision is serving:
>
> - `/`, `/login`, `/pricing`, `/api/health` all 200.
> - `/api/health` reports firestore + ai_provider + cookie_secret OK.
> - `/opengraph-image` returns `200 image/png` with `x-nextjs-cache: HIT`.
> - HTML `<title>` is now `PRAXIS by TACITUS — AI Built for Statecraft`
>   and `og:title` is `… AI Built for Statecraft. Calibrated to You.`.
>
> Still owed but non-blocking — Codex, please pick up after `gcloud
> auth login`:
>
> ```bash
> gcloud builds describe b2287473-897e-49be-92c5-33a051932420 --format='value(status,startTime,finishTime)'
> gcloud run services describe praxis-frontend --region=us-central1 --format='value(status.latestReadyRevisionName)'
> gcloud run services describe praxis-backend  --region=us-central1 --format='value(status.latestReadyRevisionName)'
> ```
>
> Drop the revision names into `docs/DEPLOYMENT_LOG.md` (top stanza),
> and run the WhatsApp / LinkedIn / Twitter / Slack / Facebook share
> debuggers against `https://praxis.tacitus.me` to bust their OG
> caches so the new portal-ring image picks up everywhere.
>
> ## Strategic priority going forward — "every tool produces something"
>
> Giulio's emphasis at handover: **make sure every tool actually works
> and produces something useful**. The landing page now claims "40+
> agentic tools" prominently; that promise has to land when a visitor
> signs in. Suggested order of attack:
>
> 1. **Tool output audit (do this first).**
>    - Scope: every page under `src/app/app/` that ends in a tool name
>      (40+ surfaces). Open each on a real authenticated session
>      bound to the demo "Nordalia" situation, click Regenerate, and
>      record what happens (UI, network call, AI route response,
>      Firestore write).
>    - Output: a punch list at `docs/TOOL_QUALITY_AUDIT_2026-04-28.md`
>      with one row per tool: `tool · works? · output non-empty? ·
>      cited? · saved? · regression`.
>    - Categorise findings into: (a) silently empty, (b) stale demo
>      content leaking on real situations, (c) AI route returns but
>      UI doesn't render, (d) credit-deducted but no output, (e) ok.
>    - Reference: `src/lib/api/with-calibration.ts` is the contract;
>      `src/lib/api/save-tool-output.ts` is the persistence helper.
>      Pattern is already established in `src/app/api/ai/*`.
> 2. **Demo-leak sweep continuation.** Bricks #56 (Humanitarian) and
>    #57 (Dossier) closed two leaks in round 6. Audit the remaining
>    tools for hard-coded `DEMO_*` constants leaking into real
>    situations. Same pattern as the dossier fix: thread `isDemo` from
>    `useSituationGuard()` through to the rendering component.
> 3. **Calibration receipts in the UI.** The hero now markets the
>    `<analyst-profile>` + `<situation-frame>` calibration spine.
>    Surface a small "calibrated to: profile v3 · domain ·
>    frameworks" chip on every tool output so the marketing claim is
>    visibly true. `src/components/praxis/output-provenance-panel.tsx`
>    already has scaffolding.
> 4. **Source provenance discipline.** The hero advertises 11 named
>    feeds. Make sure every tool that uses live data renders source
>    pills with the feed name and timestamp; for tools that don't yet
>    use feeds, route them through the SKC Feed Layer
>    (`src/lib/knowledge/feed-layer.ts`).
> 5. **Pricing/Polar integration.** Pricing page now reads \$99
>    Analyst / \$499 Team with a 14-day free trial. Checkout now points
>    at Polar (`/api/polar/checkout`), while webhooks mirror
>    `users/{uid}.subscription`, `polarCustomerId`, `polarSubscriptionId`,
>    trial end, and period end into Firestore. A fresh Polar OAT and product
>    IDs are still required before live checkout can succeed.
> 6. **Share-image + OG verification.** Send the production URL
>    through <https://www.opengraph.xyz/> and the LinkedIn /
>    WhatsApp / Twitter / Slack debuggers. Confirm
>    `praxis.tacitus.me/opengraph-image` renders the new portal-ring
>    design and that all four platforms pick up the new title and
>    description. Bust caches as needed.
>
> ## Files Claude touched this round (so Codex doesn't double-edit)
>
> - `src/components/landing/hero.tsx`
> - `src/components/landing/hero-visual.tsx`
> - `src/components/landing/hero-quadrant-tour.tsx`
> - `src/components/landing/ai-companion-section.tsx`
> - `src/components/landing/waitlist-form.tsx` (now "Talk to TACITUS")
> - `src/lib/constants/pricing.ts`
> - `src/app/(landing)/page.tsx`
> - `src/app/layout.tsx`
> - `src/app/opengraph-image.tsx`
> - `CHANGELOG.md`
> - `docs/DEPLOYMENT_LOG.md`
> - `docs/CONTINUATION.md` (this file)
>
> Codex-owned files were not edited. The stale debug string in
> `src/components/app/app-sidebar.tsx` line 87 still mentions the
> pre-rebalance prices (\$49 / \$199); leaving that for Codex since
> the file is in the Codex-owned list.

---

> **2026-04-27 Round 6 — Claude Code MONSTER plan + Persona 4 P0 + demo-leak P0**:
> Fresh clone re-pulled at `C:\Users\giuli\praxiscodexworking`. Baseline gate
> verified green: tsc 0 errors / build 0/0 / vitest 366 PASS / audit-ai-routes
> 58 calibrated / 4 exempt / audit:gcp 0 hard / 0 soft.
>
> **Authored**: `docs/MONSTER_TODO_2026-04-27.md` — 22-item production-grade
> execution plan grouped by tier (T0 durable runtime → T11 close-out). It is
> the round-6 single-pane queue. Pair with `docs/TODO_BOARD_2026-04-26.md`
> (now extended with bricks 55-58).
>
> **Shipped this round**:
> - Brick #55 — Added `mediator` role to `ROLES` + 6 mediation-anchored
>   mandate chips + 3 mediator-specific red-line chips + 6-tool
>   recommendation list (mediation-design / negotiation-prep / concordia /
>   brainstorming-table / stakeholder-map / commitments). Closes Persona 4
>   onboarding blocker surfaced in 5-persona audit.
> - Brick #56 — Closed Humanitarian demo-leak. Replaced
>   `situation.name.toLowerCase().includes('nordalia')` fallback test with
>   the canonical `isDemo` flag from `useSituationGuard()`. Added
>   `<DegradedDataChip />` near the page header that surfaces when live
>   feeds return empty in non-demo mode. Live "Nordalia Regional Conflict
>   2025" situations no longer render demo IDP/food/funding figures.
> - Brick #57 — Closed Dossier demo-leak. `ViewStep` now receives `isDemo`
>   from the parent. When a real situation is bound and AI sections are
>   not yet generated, every section renders an "Awaiting AI generation"
>   placeholder instead of `DEMO_DOSSIER_CONTENT` Nordalia text.
>
> **Audits delivered (in `docs/MONSTER_TODO_2026-04-27.md` + via subagent
> reports)**:
> - 5-persona onboarding audit identified 10 friction points; mediator
>   role was the single P0 blocker. Remaining P1: contextual rationale
>   messaging (BIG #51 follow-through), session-cookie refresh resilience,
>   org autocomplete expansion, legal-IHL domain, humanitarian page
>   wiring (Lane F — codex).
> - Demo-leak audit confirmed 2 leaks (Humanitarian, Dossier — both
>   closed) + 37 correctly-gated tools.
> - All-tools audit revealed 52 tools (not 40); average production
>   readiness 2.5/8. Top systemic gap: zero tools render `<Citation />`
>   /`<CitationLayer />` despite the primitives existing. Top fixes
>   (T-cross-cutting): build a `<ToolPageShell>` template that wraps
>   every AI-powered tool with `<ConfidenceBadge />` +
>   `<OutputProvenancePanel />` + `<DegradedDataChip />` and standardises
>   `usePersistedToolData(toolId)` adoption. This is the next-highest
>   leverage move — unblocks ≥48 tools.
>
> **Validation gate** after round-6 edits:
> tsc 0 / build 0/0 / vitest 366 PASS / audit-ai-routes 58 calibrated /
> 4 exempt / audit:gcp 0 hard / 0 soft.
>
> **Codex compatibility note**: minimal additive entries were made to
> `src/lib/dashboard/role-recommendations.ts` (Codex-touched file)
> because `Record<AnalystRole, ...>` exhaustiveness forces them when a
> new role is added. No existing logic changed. The handoff rule
> "edit only if your lane explicitly requires" applies.
>
> **Backend (Codex-owned) work** for round 6: see
> `docs/DEEP_RESEARCH_ACTION_PLAN_2026-04-27.md` Lane 7 (LangGraph
> runtime foundation), Lane 3 (structured backend extraction), Lane 4
> (Document AI), Lane 12 (Cloud Tasks dispatcher). The Cloud SQL
> infrastructure is provisioned and verified by `npm run audit:gcp`.

> **2026-04-27 Codex cleanup/readiness update**:
> Fresh clone now lives at `C:\Users\giuli\praxiscodexworking`.
> Start with `docs/ROUND_6_READINESS_2026-04-27.md` before the longer
> handoff docs. It consolidates the deep-research memo, confirms LangGraph
> viability, and lists the human decisions needed before implementing a
> durable agent runtime. Stale Codex prompt docs from 2026-04-25/26 were
> removed from the active docs set; `docs/CODEX_HANDOFF_2026-04-27.md` is
> the only active Codex prompt.
> Cloud SQL/Postgres checkpointing is approved and provisioned:
> `praxisbytacitus-instance` (Postgres 16, private IP only, `us-east4`),
> database/user `praxis_langgraph`, password secret
> `praxis-langgraph-db-password`, and service account `praxis-agents-sa`.
> The Firebase console public-IP error was an org-policy guardrail; keep it
> and use private IP.
> The deep-research memo is now consolidated into
> `docs/DEEP_RESEARCH_ACTION_PLAN_2026-04-27.md` with 16 build lanes:
> onboarding context capture, situation creation intelligence, structured
> extraction, Document AI, Vertex AI Search/RAG, real search/Deep Search Agent,
> LangGraph runtime, Brainstorming Table migration, Brief Builder, Source
> Scout/citations, Graph Cartographer, tool-output unification, evals, Postgres
> cleanup, Sigma canvas, and App Check.

> **Last updated**: 2026-04-26 (Claude Code rounds 1–5 multi-lane sprint — corpus-search, humanitarian, brainstorming-table, citation primitives, strategic roadmap, agent runner, source-scout, red-team review, AI error toast, BT markdown export, citation chips, landing-page hero overhaul, dashboard legibility fix, debug pill relocation, dev backlog, clarifying questions, Wikipedia enrichment, analyst notes, hero quadrant tour, color system audit, 10 new bricks 45-54, Codex handoff doc — all shipped)
>
> **Codex handoff**: `docs/CODEX_HANDOFF_2026-04-27.md` is the fresh
> drop-in prompt for the next session. Read it first.
> **Local clone**: `C:\Users\giuli\praxiscodexworking` (fresh clone of `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`).
> **Next agent**: Codex 5.5 (or Claude Code)
> **Read first**: `CLAUDE.md`, `AGENTS.md`, `docs/OPERATIONAL_SPINE.md`, `CHANGELOG.md` Unreleased, `docs/NEXT_BRICKS_2026-04-26.md`.
> **Sprint execution plan**: `docs/SPRINT_EXECUTION_PLAN_2026-04-25.md`
> **Tool audit**: `docs/tools/UX_AUDIT_2026-04-26.md`
> **Claude tandem prompts**: `docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md`

> **2026-04-26 tenth-session — rounds 3 & 4 update**:
>
> **Round 3 lanes shipped (build `8bda8f5d-...` deployed
> `praxis-frontend-00075-lzv` / `praxis-backend-00046-xdp`):**
> - Lane Z — `src/lib/agents/run-agent.ts` generalized agent runner
>   (every agentic route now composes the same pipeline: persona role
>   prompt + calibration + corpus evidence + Pro-model + Zod schema).
>   AgentRunnerError codes: unknown-persona / inactive-persona /
>   corpus-retrieval-failed / model-call-failed.
> - Lane T — `POST /api/ai/source-scout` (agentic workflow #1) +
>   `/app/source-scout` page. Activated `'source-scout'` persona in
>   `src/lib/agents/registry.ts`. `ai_source_scout` (3 credits).
>   Avoids duplicates by consulting `searchSituationCorpus`. Returns
>   tier_a/b/c/d reliability + corroboration flags +
>   intelligenceGaps[].
> - Lane U — `POST /api/ai/red-team-review` (agentic workflow #2).
>   Accepts any tool output JSON, runs Heuer SAT-style adversarial
>   review. Mandatory `whatWouldChangeMyMind` + confidence adjustment.
>   `ai_red_team_review` (3 credits).
> - Lane V — `<AiErrorToast />` (Zustand store + portal mounted in
>   app-shell) + `<DegradedDataChip />`. Closes F-CCM-1 silent 503
>   and F-CCM-4 invisible feed-degraded state from the reliability
>   audit.
> - Lane W — Citation parser + chip primitives for Ask PRAXIS chat.
>   `[#n]` / `[argus]` / `[documents]` style refs become clickable
>   `<CitationIndex />` / `<CitationLayer />`. Threading into the
>   streaming chat-interface itself queued.
> - Lane X — Brainstorming Table Markdown export. "Download memo"
>   button on the deliberation page renders YAML frontmatter +
>   personas + per-turn sections + synthesis + provenance footer.
>   Slugified filename.
> - Lane LP1 — Landing-page hero animation + product copy. Removed
>   `"Demo data is labelled"` trust signal; replaced with
>   `Calibrated to your role / Open-data first / Google Cloud native /
>   Sources you can defend`. Subheadline rewritten around the user's
>   product framing. New `<AiCompanionSection />` between HowItWorks
>   and ProblemSection: 3 pillars (most policy is open / sensitive
>   stays private / AI as a pro), 4 companion benefits (expert team /
>   persistent memory / companion you train / Source Scout), 6-domain
>   general-path / specific-toolkits grid. Hero visual flipped from
>   missing-video gamble to always-on `ProductGlimpse` SVG with
>   floating motion + glow + orbiting pings.
> - Lane LP2 — Audit confirmed every code file from rounds 1–3 is on
>   `main` and the working tree is clean.
> - Lane M — Agent registry codified (10 personas, 6 active + 1
>   orchestrator + 3 stubs). `src/lib/agents/registry.ts` + tests +
>   `docs/AGENT_REGISTRY.md`. Brainstorming Table refactored to read
>   from the registry.
> - Lane N — Ask PRAXIS chat wired to `searchSituationCorpus` shared
>   retriever. Inline `[#n]` citations in replies. Heavy strategic
>   questions routed to the Brainstorming Table.
> - Lanes O-S — Test plan, GCP expansion plan, TODO board, tool
>   reliability audit, INDEX consolidation.
> - Lane Y — Seven specs at
>   `docs/specs/2026-04-26-improvements/` (onboarding rationale,
>   Document AI, Cloud Translation, Brainstorming Cloud Tasks,
>   changed-since diff, Briefing versioning, domain overrides).
>
> **Round 4 lanes shipped (build `7761707d-...` queued at session end —
> deploy details land in DEPLOYMENT_LOG when build completes):**
> - Lane AA — Activity-panel pill moved from `bottom-4 right-4` to
>   `bottom-24 right-6` so it no longer overlaps the FloatingPraxis
>   dome. `Screenshot*.png` ignored from git so screenshots dropped
>   in the repo for agent review never ship.
> - Lane BB — Dashboard widget-shell light-mode token swap. Was using
>   dark-theme `slate-800/900/300/500/600` inside the `app-light`
>   shell which read as washed-out grey. Now uses
>   `navy-700/600/500/400` + `slate-200` borders + `bg-white` (WCAG
>   AA). Same WidgetShell powers RiskGaugeWidget + EscalationWidget +
>   RecommendedToolsWidget.
> - Lane CC — Developer backlog (`dev_backlog/{id}` Firestore root
>   collection). 8 kinds, 5 severities, 7 statuses, dedupe key
>   (SHA-1 of normalised signature), TTL by severity (30/90/365 days).
>   Auto-published from `withCalibration` failure path on every 4xx /
>   5xx. `GET / POST /api/intelligence/dev-backlog` admin-gated.
> - Lane DD — Clarifying questions framework. Schema, route helper
>   `clarificationResponse(req)`, type guard `isClarificationResponse`,
>   prompt-block `answersToPromptBlock`, modal component with 5 input
>   types and 6 topics. Threading into specific routes queued.
> - Lane EE — Wikipedia enrichment client. `getWikipediaSummary`,
>   `getWikipediaRelated`, `searchWikipedia` against the
>   unauthenticated REST API. `formatWikipediaPromptBlock` renders the
>   `## WIKIPEDIA BACKGROUND (CC-BY-SA, cite by URL on use)` section
>   with explicit citation reminder. Threading into Conflict Graph +
>   Timeline routes queued.
> - Lane FF — Analyst notes natural-language knowledge retention.
>   CRUD on `users/{uid}/situations/{sitId}/analyst_notes/{id}`.
>   `formatAnalystNotesBlock(notes)` renders a `## ANALYST NOTES
>   (PROVIDED BY USER, TREAT AS HIGH-PRIORITY CONTEXT)` block with a
>   "do NOT contradict an analyst note silently" instruction.
>   Threading into specific routes + UI editor queued.
>
> **End-of-session validation (round 4):**
> `npx tsc --noEmit` clean · `audit-ai-routes` 57/4 ·
> `audit:gcp` 0/0 (round 3 verified, no infra changes round 4) ·
> `npx vitest run` 317/317 (was 168 entering the session — +149) ·
> `npm run build` clean.
>
> **Cumulative tenth-session totals (rounds 1–4):**
> - Code lanes shipped: A, B, C, D, M, N, T, U, V, W, X, Z, AA, BB,
>   CC, DD, EE, FF (18).
> - Doc lanes shipped: E, O, P, Q, R, S, Y, LP1, LP2 plus persona
>   walkthroughs, Codex handoff, agent registry doc, agentic-system
>   refresh (13).
> - Cloud Build SUCCESS deploys: 3 (`05a1e8dd`, `8bda8f5d`,
>   `0bbb5830` — round 4 build at session end is `7761707d` and
>   queued).
> - AI routes calibrated: 57 (was 53).
> - Vitest: 317/317 (was 168).
> - Open bricks tracked on `docs/TODO_BOARD_2026-04-26.md`: 38 BIG
>   bricks + 7 P-Test items + queued lanes.
>
> **2026-04-26 tenth-session update (Claude Code, multi-lane sprint — Lanes A–E shipped)**:
>
> All five lanes landed as separate commits on `main`. Cloud Build deploy
> triggered at end of session — see `docs/DEPLOYMENT_LOG.md` for the build
> ID and Cloud Run revision once the deploy completes.
>
> **Lane A — Situation Corpus Retrieval API.** `POST /api/intelligence/corpus-search`
> (auth-gated, Zod-validated, demo bypass, 50-item cap) ranks evidence
> across `argus | sources | documents | graph | tool-output` layers via
> `searchSituationCorpus({uid, situationId, query, layers, limit})` in
> `src/lib/intelligence/corpus-search.ts`. Document-chunk layer leverages the
> existing Gemini text-embedding-004 hybrid ranking. Each layer fails
> closed (returns []). `src/types/corpus.ts` is the canonical retrieval
> contract. Tests at `tests/services/corpus-search.test.ts`. Step 4 of
> `docs/CORPUS_ARCHITECTURE.md` (Ask PRAXIS chat delegating to the shared
> helper) is queued as Lane F for the next session.
>
> **Lane B — Humanitarian Calibrated Route.** `/api/ai/humanitarian/route.ts`
> with full `withCalibration('humanitarian', 'ai_humanitarian')`,
> `HumanitarianSnapshotSchema` (BLUF, IPC phases, displacement, funding,
> protection, access constraints, intelligence gaps, recommended actions,
> confidence, primarySources), live grounding via `getSituationIntelligence`
> (HDX HAPI, ReliefWeb, UNHCR, OCHA FTS, UN News, GDELT) with degraded path
> when feeds fail, `saveToolOutput` persistence to `tool-data/humanitarian`
> with primarySources/dataContextLength/focus metadata. Demo-mode returns
> a labelled fixture, no live-mode fictional fallback. `ai_humanitarian`
> credit op (2 credits) added. Tool registry `aiRoute` flipped from
> `/api/ai/chat` → `/api/ai/humanitarian`. Tests at
> `tests/services/humanitarian-schema.test.ts`. Page wiring is queued as
> Lane G for the next session.
>
> **Lane C — Brainstorming Table MVP.** Synchronous prototype of
> `docs/AGENTIC_SYSTEM.md`. `/api/ai/brainstorming-table/route.ts`
> wrapped with `withCalibration('brainstorming-table', 'ai_brainstorming_table')`
> (5 credits). Six expert personas (mediator, humanitarian, legal, media,
> security, red-team) deliberate over a single question. Pulls evidence
> from `searchSituationCorpus` so every claim cites a corpus item or
> marks `sourceType="reasoning"`. `BrainstormingTableSchema` (Zod),
> `Output.object` Pro-model generation, demo fixture, persistence to
> `tools/brainstorming-table` with personas/retrievalTrace/question
> metadata. Page at `src/app/app/brainstorming-table/page.tsx` with
> question textarea, "Convene the table" CTA, persona-coloured table,
> synthesis card. Registered under simulation category, 48h staleness,
> Pro tier. Tests at `tests/services/brainstorming-table-schema.test.ts`.
> `'brainstorming-table'` added to `ToolName` union. Cloud Tasks fan-out
> and `/demo/brainstorming-table` mirror page intentionally deferred.
>
> **Lane D — Shared confidence/citation primitives + provenance panel.**
> Closes the cross-tool finding in `docs/tools/UX_AUDIT_2026-04-26.md` and
> brick #4 of `docs/NEXT_BRICKS_2026-04-26.md`. Three new primitives:
> `src/components/praxis/confidence-badge.tsx` (high/medium/low/unknown
> ICD 203/Heuer pill + `normalizeConfidence()` helper),
> `src/components/praxis/citation.tsx` (inline + chip variants with URL,
> publish date, sourceType badge), and
> `src/components/praxis/output-provenance-panel.tsx` (default-collapsed
> "Why this output?" disclosure showing tool id, generated-at, profile
> version, domain version, model, source count, retrieval query, layers
> searched, and primary-source chips). Wired into the Brainstorming
> Table page as the first consumer. Tests at
> `tests/services/confidence-badge.test.ts`. Existing tools (Risk
> Monitor, Briefing Room, Legal Tracker, Humanitarian) intentionally NOT
> migrated in this commit — those overlap with Codex-owned files.
>
> **Lane E — Strategic roadmap + persona walkthroughs.**
> `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` is the new flagship-grade
> 90-day roadmap with 30 named bricks across Calibration & Corpus, Tools
> & Workflows, Agents & Long-Running Jobs, Operational Excellence &
> Trust. `docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md` is the new
> home for persona testing — five scenario-driven walkthroughs (UN
> diplomat, humanitarian lead, legal analyst, mediator, researcher) plus
> a cross-persona heatmap showing citation/provenance gap and persistence
> vocabulary drift hit every persona.
>
> **Codex handoff prompt:** `docs/CODEX_HANDOFF_2026-04-27.md` has the
> drop-in prompt for the next Codex session. Lanes F–K queued (Ask
> PRAXIS corpus wiring, Humanitarian page wiring, Situation Health
> Card, real notification bell, tool id canonicalization, document-graph
> cross-link). File-ownership rules included.
>
> **Validation gate at end of session:**
> - `npx tsc --noEmit` clean.
> - `npm run build` clean (Next.js 16.1.6, build standalone, all routes prerender or are dynamic as expected).
> - `npm run audit:gcp` 0 hard / 0 soft.
> - `node scripts/audit-ai-routes.mjs` 55 calibrated / 4 exempt (was 53/4 entering the session — +2 from Lanes B and C).
> - `npx vitest run` 207/207 (was 168 entering the session — +39 across the four lane test files).

> **2026-04-26 ninth-session update**: Claude Code shipped the public-UX
> source-truth lane and the first-run-UX lane, plus a tool-by-tool audit
> doc and a settings/landing polish pass. Specifically: stripped retired
> vendor claims (ACLED, Firecrawl, Anthropic, Tavily, Parallel.ai) from
> landing/auth/onboarding/system-health user copy; rewrote onboarding
> live-preview and completion screens around a human calibration summary
> with the raw XML behind an Advanced disclosure; added a
> "PRAXIS works without this" explainer to Settings → Graph Backend; and
> fixed a production calibration bug in `/api/ai/legal-tracker`
> (was attributing to `commitments` with `ai_analysis` credits — now
> `legal_tracker` with `ai_legal_tracker`). New strategy doc:
> `docs/NEXT_BRICKS_2026-04-26.md` ranks the top 10 bricks for the next
> seven days; the tool-by-tool audit lives at
> `docs/tools/UX_AUDIT_2026-04-26.md` (top 5 fixes by impact: legal-tracker
> calibration is now done; remaining four are tool-id canonicalization,
> humanitarian real route, demo-leak audit, and document → graph
> cross-link). Validation: tsc clean, route audit 53/4, vitest 168 PASS.
> Late in the same session, Claude also shipped a focused
> `/app/situations/[id]` overview page (was a redirect to settings;
> now renders header + risk/Glasl + actor chips + scoped activity
> feed + quick nav into inspect/settings/dashboard) and replaced
> the last user-facing `ACLED` source claim in the Myanmar welcome
> template with UCDP. Follow-ups for that page are tracked in
> `docs/NEXT_BRICKS_2026-04-26.md` brick #7.
> Files Claude is responsible for staying off this week:
> `src/lib/auth/auth-context.tsx`, `src/components/app/app-sidebar.tsx`,
> `src/components/dashboard/recommended-tools-widget.tsx`,
> `src/components/dashboard/operational-status-panel.tsx`,
> `src/lib/navigation/tool-preferences.ts`,
> `src/lib/dashboard/tool-status-summary.ts`,
> `src/lib/dashboard/role-recommendations.ts`,
> `src/types/preferences.ts`, `src/hooks/use-user-preferences.ts`.

> **2026-04-26 Codex strategic-uplift update**: Fresh clone was recreated from
> `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work`, implementation branch
> `codex/strategic-uplift-sprint1` tracks `origin/main`, and the remote is
> verified as the same GitHub repo for fetch/push. PR #1
> (`docs/strategic-uplift-sprint-plan`) has no checks and a dirty merge state,
> so Codex imported the two sprint docs onto the implementation branch rather
> than basing code on the PR branch's broad deletions. Low-risk shipped fixes:
> Legal Tracker now persists via `saveToolOutput` under `legal-tracker` instead
> of polluting `commitments`; `AiPopulate` no longer exposes internal credit
> costs in user-facing copy; geospatial authenticated failures now return an
> honest degraded empty state instead of generated demo events; Ask PRAXIS and
> landing copy now align with the Google Cloud / open-data stack; and
> `infrastructure/setup-gcp.sh` now creates the required `profile.events`
> Pub/Sub topic. New strategic spec:
> `docs/superpowers/specs/2026-04-26-brainstorming-table-media-intelligence-plan.md`
> defines the Brainstorming Table expert-agent product, context architecture,
> and media scanner / 24-hour roundup uplift. Live GCP verification is blocked
> locally until `gcloud auth login` refreshes the `giulio@tacitus.me` token;
> Firebase CLI is logged in but `firebase projects:list` failed and should be
> retried after auth refresh. Local validation after the Codex patch:
> `npx tsc --noEmit` clean, `npm run build` clean on Next 16.2.4, AI route
> audit clean (53 calibrated / 4 exempt), focused media query-builder tests
> pass, production `https://praxis.tacitus.me/`, `/login`, and `/api/health`
> return 200/ok. `npm audit --omit=dev` is improved to 0 critical / 0 high /
> 16 moderate / 2 low; remaining findings are mostly Google SDK / uuid chains
> that need separate dependency-risk review.
> Post-deploy continuation: GCP audit is fully green after enabling Cloud
> Tasks and creating `praxis-research`, `praxis-agents`, and
> `praxis-embeddings`. Cloud Build
> `8d9f5c8d-c96e-4fb9-be67-b6abc604af73` deployed the commit to production
> (`praxis-frontend-00063-h5k`, `praxis-backend-00040-rft`). Ask PRAXIS now
> has an ARGUS corpus bridge via `src/lib/argus/corpus-context.ts`, injecting
> ARGUS alerts/watch items, Sources Library entries, and relevant document
> chunks for the active situation. Firebase CLI still requires an interactive
> `firebase login --reauth`; `firebase projects:list` fails because the stored
> Firebase refresh token is invalid, but GCP deploy/audit are healthy.
> Follow-up ops verification completed after interactive reauth: Firebase CLI
> now lists project `praxisbytacitus`, Firestore rules/indexes deployed
> successfully, `npm run audit:gcp` is green with 0 hard / 0 soft findings,
> Cloud Tasks queues are running, and Cloud Run latest-ready revisions are
> `praxis-frontend-00065-nhs` / `praxis-backend-00041-g29`. Production smoke:
> `/`, `/login`, and `/api/health` return 200/ok. Infra `.sh` syntax checks
> pass under Git Bash; the default Windows WSL `bash.exe` is unavailable
> because no WSL distro is installed.

> **2026-04-26 update**: Codex started the workspace-personalization lane.
> User preferences now include `hiddenToolIds` and `toolOrder`, Settings →
> Preferences exposes show/hide and move controls for tools, and the sidebar
> plus dashboard recommendations apply those preferences while showing analyst
> role/domain in the user block. Sources Library is now a canonical
> `sources-library` customizable tool. Claude should avoid
> `src/components/app/app-sidebar.tsx`,
> `src/types/preferences.ts`, `src/hooks/use-user-preferences.ts`, and
> `src/lib/navigation/tool-preferences.ts` unless explicitly handed off.
> The old-clone pricing/reference-doc commits were integrated into current
> `main` after this update, with newer spine/context/sidebar behavior kept as
> authoritative.
> **Product plan**: `docs/PRAXIS_HIGH_IMPACT_PRODUCT_PLAN_2026-04-26.md`
> now defines the multi-day knowledge-management, tool-quality, dashboard,
> and agent-workflow plan. Use it with the sprint plan before starting any
> broad feature pass.
> **Strategic roadmap**:
> `docs/STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md` adds the 20-item
> high-impact queue, agentic lane ownership model, Google Cloud architecture
> notes, and a Claude Code copy-paste prompt for the next implementation
> session.
> **Corpus / agents**: `docs/CORPUS_ARCHITECTURE.md` and
> `docs/AGENTIC_SYSTEM.md` now split the shared retrieval architecture and the
> agentic execution model into dedicated handoff docs.
> **User research synthesis**:
> `docs/USER_RESEARCH_SYNTHESIS_2026-04-26.md` records persona walkthroughs,
> survey comments, implemented fixes, and next UX/product bricks.

---

## Current state

- **Project**: `praxisbytacitus` (`852128226674`), region `us-central1`, domain `praxis.tacitus.me`.
- **Repo**: fresh clone at `C:\Users\giuli\praxiscodexworking`.
- **Version**: bumped from 6.3.1 → 6.4.0 (operational spine).
- **What just shipped in code**:
  - 14 new Firestore indexes (incl. the `situations.status` collection-group index that was crashing gdelt-poller).
  - 5 new Firestore collections + rules: `tool_runs`, `background_jobs`, `system_events`, `users/{uid}/notifications`, `alerts`, `data_ingestions`, `audit_logs` (+ `graph_updates` subcollection).
  - TS spine: `src/lib/jobs/job-service.ts`, `src/lib/events/event-service.ts`.
  - Python spine: `cloud_functions/_shared/spine.py` (vendored at deploy time).
  - `withCalibration` automatically writes a `tool_runs` row + `tool.started`/`tool.completed`/`tool.failed` events for every AI route — no per-route boilerplate.
  - `gdelt-poller`, `on_situation_created`, `on_document_uploaded` rewritten: idempotent, observable, user-notified on success and failure.
  - `<SemaphoreChip />`, `<ActivityFeed />`, `/app/admin/operator-console`, `/api/admin/operator-console`, `/api/notifications/[id]`.
  - TTL retention configured (`infrastructure/setup-ttl.sh`): events 365d, tool_runs 365d, jobs 90d, notifications 180d.
  - Dedicated SAs declared in `infrastructure/setup-gcp.sh`: `praxis-frontend-sa`, `praxis-backend-sa`, `praxis-functions-sa`, `praxis-worker-sa`.

- **Deploy verification status on 2026-04-25**:
  - Firestore composite indexes, including `situations.status`
    collection-group, are READY.
  - TTL is ACTIVE for `system_events`, `tool_runs`, `background_jobs`,
    `users/{uid}/notifications`, `audit_logs`, and `rate_limits`.
  - Firebase CLI auth is expired on the Windows host; rules deployment
    still needs a `firebase login --reauth` or a Cloud Shell deploy.
  - Cloud Build `2bcd558a-bff5-4aec-ba42-fb42b29e2e42` failed during
    frontend TypeScript validation on `/api/notifications/[id]`.
    This session fixed that route-handler signature and the follow-on
    operator-console typing errors.
  - Cloud Build `c4cc3b65-7478-4c2d-9d40-114e2cf36f25` deployed commit
    `b4c88cd` successfully. Production smoke checks passed:
    `/` 200, `/login` 200, `/onboarding` 307 to `/login`, `/api/health`
    `status: ok`.
  - `gdelt-poller` had no recent `Index probe OK` logs when checked;
    this session fixed two worker issues before redeploy: missing
    `_shared` in the Docker image and a call to nonexistent
    `/api/v1/pipeline/ingest-gdelt`.
  - Dedicated service-account migration is still incomplete in production;
    use the Cloud Shell block in the session handoff to redeploy
    `on-situation-created`, `on-document-uploaded`, and `gdelt-poller`
    with the dedicated SAs.

---

## ⚡ FIRST 30 MINUTES — handoff checklist for Codex 5.5

1. **Read in order** (cold start):
   1. `CLAUDE.md`
   2. `AGENTS.md`
   3. `docs/OPERATIONAL_SPINE.md` ← new, read before touching any async code
   4. `docs/CONTEXT_INJECTION.md`
   5. This file

2. **Verify spine is deployed** (these were authored but the user is running them):
   ```bash
   # Indexes built?
   gcloud firestore indexes composite list --database='(default)' \
     --format='table(name.basename(),state)' | grep -E 'situations|tool_runs|background_jobs|system_events'
   # Expect: state=READY for all
   
   # Rules contain new collections?
   firebase firestore:rules:get --project=praxisbytacitus | grep -E 'tool_runs|background_jobs|system_events'
   # Expect: 3+ matches
   
   # TTL policies active?
   gcloud firestore fields ttls list --database='(default)' --project=praxisbytacitus
   # Expect: 6 rows: system_events, tool_runs, background_jobs,
   # notifications, audit_logs, rate_limits
   
   # Worker pool happy?
   gcloud logging read \
     'resource.type="cloud_run_worker_pool"
      AND resource.labels.worker_pool_name="gdelt-poller"
      AND textPayload:"Index probe OK"' \
     --limit=3
   ```

3. **If any of the above is empty**, run the missing deploy step. Commands live in `docs/OPERATIONAL_SPINE.md` Section "Deployment".

4. **Smoke test the spine end-to-end**:
   - Open `/app` as Giulio in a browser.
   - Trigger any AI tool (e.g. Risk Assessment, Game Theory).
   - In Firestore console, confirm a new doc landed in `tool_runs` with `status=completed semaphore=green`.
   - Confirm a `tool.started` and `tool.completed` event in `system_events`.
   - Open `/app/admin/operator-console` — should show the run + event.

---

## Spine roadmap — ordered next moves

These are the next items Codex 5.5 should tackle, in priority order. Each is scoped to be completable in one session.

### 1. Mount the activity feed in the dashboard (1-2 hours)

`<ActivityFeed uid={user.uid} />` already exists. Mount in:
- Dashboard right rail (`src/app/app/dashboard/page.tsx`)
- Situation detail bottom sheet (`src/app/app/situations/[id]/page.tsx`) — pass `situationId` to scope
- New top-bar bell dropdown (component: `src/components/app/notification-bell.tsx`) — read unread count from `useNotifications`

### 2. Wire `tool.warning` notifications for low-confidence AI output (2 hours)

Today `withCalibration` only emits notifications on terminal failure. Extend to detect `confidence < 0.6` in tool output and emit a `kind=tool.warning, semaphore=yellow` notification: "Risk Assessment confidence is low — consider providing more sources." The hook lives in the response-status switch in `with-calibration.ts`.

### 3. Backend `/api/v1/pipeline/run` accept + emit `jobId` (3 hours)

The Eventarc-triggered functions now pass `X-PRAXIS-JOB-ID` in headers. The backend (Python FastAPI) should:
1. Read the header.
2. Call `update_job_progress(jobId, percent, message)` at each pipeline stage (extract → build → cluster → analyze → report → export).
3. The frontend activity feed picks up progress via onSnapshot automatically.

File: `backend/routers/pipeline.py`. Helper: copy a Python `_shared/spine.py`-compatible client into the backend or use a shared Python package via `pyproject.toml`.

### 4. Graph delta review UI (1-2 days)

Schema is defined in `docs/OPERATIONAL_SPINE.md` (`graph_updates` subcollection). When extraction proposes new nodes/edges, write a `graph_updates` doc with `status=proposed, confidence=0.4` rather than mutating the canonical graph. Add a "Pending updates (3)" banner to the situation page that opens a side panel listing each delta with Approve / Reject buttons.

### 5. Email notification path (1 day)

Today notifications live only in Firestore. Add a Cloud Function that triggers on `notifications` create with `semaphore in ['red','yellow']` and `kind in ['action.required','data.ingest_failed']`. Send via SendGrid (Vercel Marketplace integration is fastest path). Env var: `SENDGRID_API_KEY`. Template per `kind`. Deduplicate by `notificationId`.

### 6. Multi-session Vertex Agent storage (4 hours)

Today `users/{uid}/agentSessions/active` is a single doc — two concurrent Deep Research calls clobber each other. Migrate to:
```
users/{uid}/agentSessions/{sessionId}: {
  sessionId, situationId, startedAt, lastActivityAt, expiresAt, summary
}
```
Update `src/app/api/ai/deep-search-agent/route.ts` to look up by `(uid, situationId)` and pick the most recent non-expired session, or create a new one.

### 7. Cloud Tasks dispatcher (2 days)

Move from Cloud Run worker pool single-instance polling to Cloud Tasks fan-out. Three queues already exist (`praxis-research`, `praxis-agents`, `praxis-embeddings`). Build a backend dispatcher that:
1. Reads `background_jobs.where('status','==','queued').orderBy('nextRunAt').limit(10)`.
2. Enqueues each into the appropriate Cloud Tasks queue.
3. Worker is replaced by an HTTP endpoint that consumes a Cloud Tasks delivery, claims the job (CAS on `lockedBy/lockedUntil`), runs it, and calls `complete_job`.

Benefits: per-job retry policy, parallelism, no custom lock service.

### 8. Operator console — drill-down (1 day)

Today the operator console shows a flat table. Add:
- Click a job row → side panel with full payload, full error stack, "Retry" button (calls a new `/api/admin/jobs/{id}/retry` endpoint that bumps `status=queued, nextRunAt=now`).
- Click an event with `severity=error` → linked job + linked tool_run + recent events for the same `uid`.
- Search bar filtering events by `uid` (admin only).

### 9. BigQuery sink for spine events (4 hours)

Cloud Logging sink already exports `api_calls` to BigQuery. Add a parallel sink filter:
```
resource.type="firestore.googleapis.com/Database"
  AND protoPayload.methodName="google.firestore.v1.Firestore.Write"
  AND protoPayload.resourceName=~"projects/.+/databases/.+/documents/system_events/.+"
```
Or, simpler: add a `Firestore.onCreate('system_events/{id}')` Cloud Function that streams to BigQuery `praxis_analytics.system_events`. Schema mirrors the doc.

### 10. Polar usage reconciliation for billing analytics (1 week)

Per `docs/compass_artifact_*.md`. Define meters:
- `vertex.input_tokens` (model name dimension)
- `vertex.output_tokens`
- `vertex_agent.thinking_tokens`
- `gdelt.queries`
- `firecrawl.pages` (already retired but kept for legacy users)

Emit at every `complete_tool_run` if `creditsDeducted > 0`. Internal credits remain the product-facing fair-use model; Polar should receive only the billing/entitlement events needed for customer state until usage-based pricing is explicitly turned on.

---

## Open decisions (need user input)

| # | Question | Default if no answer |
|---|----------|----------------------|
| 1 | SendGrid vs Mailgun for email notifications? | Use the Vercel Marketplace integration that auto-provisions an API key. Default: SendGrid. |
| 2 | Operator console — should non-admin support people see read-only events for users they're helping? | Defer; punt to a `/api/admin/operator-console?uid=X` query gated by a separate `SUPPORT_ALLOWLIST` env var. |
| 3 | Migrate `agentSessions/active` to subcollection now (Roadmap #6) or wait for paying users to hit the bug? | Defer to first paid user complaint. |
| 4 | TTL for `audit_logs` — 365d minimum is set, but compliance may want 7y for SOC 2. | Confirm with `docs/COMPLIANCE.md`. Today set to 365d. |
| 5 | Alert email recipient for Cloud Monitoring policies. | Currently empty. Set in console: `Monitoring → Alerting → Notification channels`. |

---

## Hard rules (do not break)

1. **NEVER** call `os.environ[...]` in workers/functions — always `os.getenv(...)` with explicit validation. See `cloud_functions/gdelt_poller/worker.py` for the pattern.
2. **NEVER** add a new Eventarc trigger without an idempotency key. Duplicate trigger replays will double-charge credits.
3. **NEVER** write a new collection without adding rules + indexes in the same commit. Rules deny by default; client-side reads silently fail.
4. **NEVER** invoke a Cloud Run service without ensuring the caller SA has `roles/run.invoker` on the *specific service* (project-level grant is unreliable for Eventarc).
5. **ALWAYS** vendor `cloud_functions/_shared/` next to a function source dir at deploy time (handled automatically by `cloudbuild.yaml` and `setup-gcp.sh`, but if you do an ad-hoc `gcloud functions deploy`, copy `_shared` first).
6. **ALWAYS** include `expiresAt` when creating documents in spine collections. The TS/Python helpers do this automatically — only relevant if you write directly.
7. **ALWAYS** commit as `giuliocatanzariti@gmail.com` (no Co-Authored-By lines).

---

## Useful one-liners

```bash
# How many failed tool runs in the last hour?
gcloud firestore documents list tool_runs --database='(default)' \
  --filter='status="failed" AND startedAt > $(date -d "1 hour ago" -Iseconds)'

# Tail the latest system events as they arrive
watch -n 2 'gcloud firestore documents list system_events --limit=10 --order-by="-createdAt"'

# Manually mark a stuck job as dead-letter
gcloud firestore documents update background_jobs/{jobId} \
  --field='status=dead_letter' --field='semaphore=red'

# Cron: list all schedulers + their target SAs
gcloud scheduler jobs list --location=us-central1 \
  --format='table(name,schedule,httpTarget.uri,httpTarget.oidcToken.serviceAccountEmail)'
```

---

## Files most-edited this session (use as anchors)

- `firestore.indexes.json`, `firestore.rules`
- `src/lib/jobs/job-service.ts`, `src/lib/events/event-service.ts`
- `src/lib/api/with-calibration.ts`
- `src/hooks/use-activity-feed.ts`
- `src/components/app/{semaphore-chip,activity-feed}.tsx`
- `src/app/app/admin/operator-console/page.tsx`
- `src/app/api/admin/operator-console/route.ts`
- `src/app/api/notifications/[id]/route.ts`
- `cloud_functions/_shared/spine.py`
- `cloud_functions/{gdelt_poller,on_situation_created,on_document_uploaded}/main.py` (and `worker.py` for gdelt)
- `infrastructure/{setup-gcp.sh,setup-ttl.sh}`
- `cloudbuild.yaml`
- `docs/OPERATIONAL_SPINE.md` (new)
- `CHANGELOG.md` (Unreleased section)
- `CLAUDE.md` (handoff checklist)

If you don't recognize a file path, grep the repo — Codex 5.5 should not assume the older repo layout from before this session.
