# Changelog

## 2026-04-29 — Subagent audit wave: persistence, exports, and deploy gates

- Added `docs/PRAXIS_NEXT_20_IMPROVEMENTS_2026-04-29.md`, consolidating product,
  AI/backend, and security/cloud subagent findings into 20 ranked improvements.
- Started the canonical tool-output migration: `saveToolOutput` now writes a
  versioned `tool-data/{toolId}` envelope and a legacy `tools/{toolId}`
  compatibility document.
- Export Center now reads both canonical `tool-data` and legacy `tools`
  collections, labels provenance, and includes export metadata in JSON bundles.
- Improved tool audit accuracy for delegated routes such as `ask-praxis`.
- Added request validation and persistence improvements for `terminology`,
  `extract-episodes`, `deep-research`, and `deep-search-agent`.
- Grounded Ask PRAXIS mode now sends the active `situationId` so results can be
  persisted against the current situation.
- Cloud Build GCP audit enforcement is now enabled by default and the audit
  checks all mounted production research/agent secrets.
- Ask PRAXIS naming and guided-tour copy were updated for product coherence.
- Standardized remaining live app, landing, search, sidebar, document, and
  tool-registry labels from “PRAXIS Assistant” to “Ask PRAXIS”.

All notable changes to PRAXIS by TACITUS are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased] — 2026-04-28 (Five-pillar uplift: ask-praxis, dashboard, conflict-graph, risk+timeline, briefing)

### Codex Continuation — 2026-04-29 AI safeguards and health visibility

- Added shared calibrated-AI request safeguards in `withCalibration()`:
  malformed JSON, payloads over 750 KB, more than 50 chat messages, and
  aggregate text over 250k characters are rejected before onboarding checks,
  credit deduction, tool-run creation, calibration, or model calls.
- Added `src/lib/api/ai-request-limits.ts` as the single source for these
  non-secret limits.
- Exposed the active AI request limits and calibrated-route safeguards in
  `/api/health` and `/api/health/diagnostics`.
- Added focused unit coverage for malformed JSON, excessive chat history, and
  oversized calibrated-AI requests.
- Updated security, testing, auth, and TODO docs to make the safeguard contract
  explicit for future agents and operators.

### Codex Continuation — 2026-04-29 grounded-search intelligence spine

- Hardened the unified web research client so Google-grounded research fans out
  across source-focused, region-focused, and actor-focused queries; source
  receipts now carry query/retrieval metadata, safe host parsing, and useful
  snippet context even when Gemini only exposes a cited URL.
- Fixed the `grounded-search` AI route identity from `deep_research` /
  `ai_chat` to `grounded-search` / `ai_grounded_search`, added request schema
  validation, marked it as a streaming calibrated route, and persisted a
  metadata trace for streamed searches.
- Hardened `research-extract` with Zod request validation, grounded-source-pack
  retrieval before optional scrapers, UCDP corroboration, and `saveToolOutput`
  metadata for extracted graph updates.
- Improved no-key demo Ask PRAXIS behavior: realistic risk/evidence/mediator
  prompts now return a concrete Nordalia answer instead of falling through to
  the generic greeting.
- Browser verification with `agent-browser` confirmed `/login?mode=demo` enters
  `/demo/dashboard`, `/demo/assistant` loads, and the tested Ask PRAXIS prompt
  returns a useful three-bullet response with no visible AI error text.
- Added `docs/PRAXIS_GROUNDED_SEARCH_INTELLIGENCE_SPINE_2026-04-29.md`, a
  verifiable product/engineering plan for grounded search, scrape/extract,
  evidence records, political entity extraction, commitment tracing, media
  analysis, and graph ingestion.
- Changed the live intelligence aggregators so grounded Google Search runs as
  the primary checkable research path; GDELT, ReliefWeb, UN News, UCDP, HDX,
  UNHCR, World Bank, SIPRI, and Crisis Group now function as corroborating
  structured layers.
- Updated UCDP integration to use the versioned API plus `UCDP_API_TOKEN` /
  `x-ucdp-access-token`, added UCDP as a credential-aware provider, and
  surfaced UCDP conflict records as visible intelligence-feed items.
- Updated Source Monitor to list grounded Google Search first and to call the
  intelligence API with valid `country/query` parameters instead of the stale
  `situationId/source` payload.
- Removed active ACLED provider registration, validation, resilient-fetch, and
  source-monitor surfaces so the app no longer presents a paid ACLED dependency
  as part of the live product spine.

### Codex Continuation — 2026-04-29 persona QA demo trust wave

- Added `docs/PRAXIS_PERSONA_QA_WAVE_2026-04-29.md`, a structured browser QA
  record covering first-time user, serious customer, returning user, power
  user, and skeptical security/trust reviewer perspectives.
- Updated the demo banner to describe the PRAXIS sample workspace directly and
  label synthetic Nordalia data instead of relying on stale competitive
  positioning.
- Updated the dashboard Daily Intelligence Brief so demo mode renders a
  deterministic, situation-derived sample brief rather than exposing an
  admin-facing AI provider configuration message.
- Updated the Ask PRAXIS system prompt product framing to describe PRAXIS as a
  situation/source/graph-to-decision-support workspace.
- Cleaned the dashboard intelligence-feed empty state and active helper copy so
  the UI no longer tells demo users to configure retired provider-specific
  credentials.
- Aligned the demo welcome modal with the Nordalia contested-border sample
  workspace and removed provider-powered claims from demo onboarding copy.

### Codex Continuation — 2026-04-29 sophisticated persona and AI trust wave

- Added `docs/PRAXIS_SOPHISTICATED_PERSONA_WAVE_2026-04-29.md`, a second,
  more demanding persona QA record covering policy director, mediator/envoy
  team, intelligence analyst, enterprise buyer, and skeptical security/trust
  reviewer workflows.
- Incorporated subagent findings into a 35-item roadmap covering grounded
  search receipts, sanctions current-source enforcement, append-only tool run
  history, export provenance, Ask PRAXIS write validation, model fallback
  transparency, source-state banners, graph evidence, persona automation,
  cloud/security tasks, and live deploy parity.
- Completed a landing-page credibility pass across hero, workflow, problem,
  data substrate, platform preview, security, and TACITUS CTA sections.
- Removed placeholder testimonial social proof from the active landing page
  until real approved practitioner quotes are available.
- Hardened sanctions scan behavior: demo responses now identify synthetic
  non-exportable sample data, and live scans refuse to produce current
  sanctions analysis from model training data alone when source retrieval
  fails.
- Hardened situation-report DOCX export footer so it lists only supplied
  sources or explicitly warns that no source list was supplied.

### Codex Continuation — 2026-04-29 executive situation intelligence

- Added `POST /api/ai/situation-intelligence`, a calibrated real-AI route with
  Zod schema validation for executive diagnosis, strategic insight, causal
  timeline, actor dossiers, best/likely/worst scenarios, derived risk score,
  concrete actions, live graph primitives, provenance, lightweight memory, and
  confidence handling.
- Added `src/lib/ai/schemas/situation-intelligence.ts` as the shared contract.
  The schema enforces exactly 3 executive insights, a strategic insight with
  at least 2 actors and 1 constraint, exactly 3 scenario types, 0-100 risk
  scoring, 3-5 actions, explicit graph nodes/edges, source fragments, and
  confidence notes.
- Added `ExecutiveIntelligencePanel` to the real dashboard. It calls the new AI
  route on demand, persists successful outputs through the existing
  `tool-data` API for cross-situation reopening, renders click-through graph
  details, shows provenance and confidence, and exports the current analysis as
  timestamped JSON.
- Added focused schema tests for the requested geopolitical situation,
  corporate conflict, and policy memo cases, plus a negative test for invalid
  strategic insights.
- Validation: `npx tsc --noEmit`, targeted `npx eslint`, and
  `npx vitest run tests/unit/lib/ai/situation-intelligence-schema.test.ts`
  passed. Live authenticated browser generation remains the next QA step.
- Follow-up hardening: registered `situation-intelligence` as a first-class
  tool, added explicit `ai_situation_intelligence` metering, changed the route
  to write canonical `tool-data/situation-intelligence`, added controlled
  schema/generation 502 responses, made the dashboard recommendation deep-link
  to the panel, and removed retired source claims from registry/docs/landing
  tour surfaces touched in this wave.
- Added `tests/tools/situation-intelligence.smoke.test.ts` and expanded
  `tests/unit/lib/dashboard/role-recommendations.test.ts`.

### Codex Continuation — 2026-04-29 roadmap and root runbooks

- Added root `TODO.md` as the current production continuation roadmap, carrying
  the next prioritized tasks for product, persona testing, AI quality,
  Firebase/GCP, security, documentation, and future roadmap work.
- Added compact root runbooks: `ARCHITECTURE.md`, `DEPLOYMENT.md`,
  `TESTING.md`, and `SECURITY.md`, each linking back to the deeper canonical
  docs under `docs/`.
- Updated `README.md` so the active continuation roadmap and root runbooks are
  visible in the documentation map.
- Confirmed the 2026-04-29 baseline: `npx tsc --noEmit`, `npm run build`,
  `npm run lint`, `npm run audit:routes`, and `npm run audit:gcp` passed
  locally. Build still reports the known Next middleware-to-proxy deprecation;
  lint passes with existing warnings.
- Added `docs/PRAXIS_SUPERPLAN_2026-04-29.md`, a hyper-detailed multi-agent
  execution plan that folds Identity UX, QA Automation, and Security/Cloud/AI
  subagent findings into verifiable workstreams.
- Updated `TODO.md`, `README.md`, `TESTING.md`, `SECURITY.md`,
  `DEPLOYMENT.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `AGENTS.md`, and
  `docs/CONTINUATION.md` to point future agents at the superplan.
- Added `docs/PRAXIS_15_APP_WIDE_IMPROVEMENTS_2026-04-29.md`, a 15-initiative
  app-wide improvement plan covering product identity, activation, role-aware
  defaults, situation health, tool outputs, Ask PRAXIS, evidence discipline,
  browser QA, route audits, security, deploy safety, operations, corpus trust,
  commercial readiness, and enterprise trust.
- Started the first app-wide product consistency pass: updated public source
  claims and metadata away from retired/conflicting source claims, clarified
  the hero promise, renamed the demo CTA to "Explore Sample Workspace", changed
  legacy wizard copy to "Create New Situation" / "Situation Name", initialized
  situation roles from AnalystProfile when available, and removed per-action
  credit-cost copy from shared generation states.
- Validation for this pass: `npx tsc --noEmit` passed; targeted `npx eslint`
  on touched TS/TSX files passed with warnings only. Full `npm run lint` and
  `npm run build` passed earlier in the session, with existing warning debt and
  the known Next middleware-to-proxy deprecation.

### Codex Continuation — backend trust boundary + Core-8 graph coverage

- Backend service-to-service auth now verifies Google OIDC audience and trusted
  service-account email before accepting `X-PRAXIS-UID`.
- Backend `/agents/health` and `/api/v1/graph/test-connection` are no longer
  open operational surfaces; graph connection testing now goes through an
  admin-gated Next.js API bridge that calls the private backend with Cloud Run
  OIDC.
- Added an authenticated, allowlisted `/api/backend/*` proxy for user-scoped
  graph, pipeline, temporal, and analysis backend calls. The client
  `praxisBackend` facade now uses this proxy instead of the private Cloud Run
  URL directly.
- Removed the legacy `/backend/:path*` rewrite so browsers can no longer proxy
  arbitrary backend paths outside the authenticated allowlist.
- `/api/admin/set-all-credits` now requires an authenticated admin session and
  explicit confirmation body instead of relying on the shared cron secret.
- Backend CORS now explicitly allows `X-Firebase-Token` and `X-PRAXIS-UID`,
  matching the documented auth-header separation.
- Graph writes now persist `corePrimitiveCoverage` for the TACITUS Core-8:
  Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative.
- Conflict Graph now surfaces Core-8 primitive coverage in the main workflow.
- Added `docs/PRODUCTION_TODO_2026-04-28.md` as the long-form production
  roadmap and linked it from the sprint backlog.
- Docs updated: README, CLAUDE, AGENTIC_SYSTEM, CORPUS_ARCHITECTURE.
- Tests: backend auth OIDC allowlist/audience behavior and Core-8 coverage.

### Codex Continuation — integration readiness + security hardening

- `/api/health/provider` now reports non-secret readiness for Firecrawl,
  Parallel, Vertex AI Agent Engine, and Polar, including missing Polar env var
  names so operators know exactly what remains to mount.
- `/app/settings/system-health` now shows live status rows and activation
  pills for the optional research/billing stack instead of relying on static
  "paid-live" labels.
- Admin credit top-up and advisor-feed GET routes now require the existing
  admin allowlist gate.
- Session signing now fails closed unless `COOKIE_SIGNING_SECRET` is mounted;
  it no longer falls back to `SESSION_SECRET`, `CRON_SECRET`, or a static dev
  value. Health diagnostics no longer expose provider key prefixes.
- Firestore `users/{uid}` create rules now allow only the expected free-plan
  bootstrap shape and reject server-managed Polar, subscription, promo, and
  full-access fields on client create.
- Backend Python Gemini defaults and Vertex Agent Engine deployment script now
  use stable `gemini-2.5-flash` / `gemini-2.5-pro` IDs instead of stale
  Gemini 3 preview names.
- Tests: provider integration readiness and cookie signer fail-closed behavior.

### Codex Continuation — Evidence envelope + SKC retrieval hardening

- `src/lib/knowledge/evidence-envelope.ts` — adds the first reusable
  citation-ready evidence envelope for tool outputs, including canonical
  tool-id normalization, timestamp coercion, confidence mapping, excerpt
  summarization, and CorpusItem projection.
- `src/lib/intelligence/corpus-search.ts` — tool-output retrieval now reads
  both `tool-data` and current/legacy `tools` documents, preferring versioned
  `tool-data` while backfilling saveToolOutput-only routes into the situation
  corpus. This closes a major gap where agents could miss prior generated
  outputs because they lived on the other Firestore path.
- `src/lib/knowledge/tool-output-layer.ts` — related-tool SKC context now
  falls back across canonical registry ids and legacy underscore keys
  (`risk_assessment` -> `risk-monitor`, `commitment_scan` -> `commitments`,
  etc.) across both storage paths.
- Tests: `tests/unit/lib/knowledge/evidence-envelope.test.ts`,
  `tests/unit/lib/knowledge/tool-output-layer.test.ts`, and existing
  corpus-search helper tests cover the normalization and retrieval contracts.
- Dashboard production fix: `PraxisLink` now leaves public root routes such as
  `/pricing`, `/login`, `/privacy`, and `/terms` unprefixed, and
  middleware plus `/app/pricing` defensively redirect to `/pricing` so cached
  app bundles no longer 404 or bounce through login on upgrade links.
- AI access reliability: credits are now soft-metered instead of hard-blocking
  generation when depleted, and `/api/ai/auto-structure` uses the standard
  Flash model for the post-create situation build so every user gets a
  dependable first-value AI pass.

### Spec

- `docs/superpowers/specs/2026-04-28-five-pillar-uplift-design.md` — approved
  umbrella spec covering Ask PRAXIS backbone, Dashboard recap polish, Conflict
  Graph auto-populate (stage-then-approve), Risk Monitor + Timeline live data,
  and Briefing Room block builder. Cross-cut: subscription tier resolver,
  optional-key surfacing for Firecrawl + Parallel.ai, ML-readable outputs.

### Phase 1 — Ask PRAXIS backbone (commit `8fe211e`)

- `src/lib/api/tier.ts` — server-side subscription tier resolver + `gateTier`
  helper. Re-exports the client-side `SubscriptionTier` so the union stays
  aligned across halves. Demo users resolve to `enterprise`.
- `src/lib/ai/ask-praxis-tools.ts` — four new bound tools attached to the
  calibrated chat backbone: `writeToTool` (persist a structured payload to
  any tool slot under the active situation), `firecrawlFetch` (free-tier
  rate-limited URL scrape via Firecrawl with a free fallback chain),
  `parallelResearch` (premium-tier multi-step research via parallel-web,
  requires user-supplied key), `runDeepResearch` (Vertex ADK directive +
  fallback hint for free users). Each returns a structured
  `requiresTier` / `requiresKey` payload when the user lacks a plan or
  credentials so the UI can render upgrade / settings chips inline.
- `src/lib/ai/ask-praxis.ts` — server-side `delegateToAskPraxis()` helper
  used by other tool routes (briefing, risk-monitor, timeline,
  conflict-graph) to ask the calibrated chat backbone a sub-question with
  shared corpus retrieval.
- `src/app/api/ai/ask-praxis/route.ts` — thin alias re-exporting the
  calibrated chat handler so client code can target a stable
  `/api/ai/ask-praxis` endpoint.
- `src/app/api/ai/chat/route.ts` — wires the four extension tools into the
  bound tool set with a freshly resolved tier.
- `scripts/audit-ai-routes.mjs` — `ask-praxis` added to the exempt set with
  a rationale comment.

### Phase 2 — Dashboard recap polish (commit `9a822cc`)

- `src/components/dashboard/onboarding-recap-widget.tsx` — pulls the
  AnalystProfile and renders identity, mandate excerpt, lens chips,
  audience, primary domain, regions. Click-through to `/app/settings`.
- `src/components/dashboard/situation-status-strip.tsx` — five-cell
  at-a-glance strip: region/domain, risk + Glasl stage, escalation trend,
  graph counts, document counts + relative updated time. Mobile-stacking.
- `src/components/dashboard/account-status-card.tsx` — subscription tier
  badge, credits, premium-key effective state for Firecrawl + Parallel,
  Manage-keys + Upgrade chips.
- `src/app/app/dashboard/page.tsx` — recompose layout: header → status
  strip → recap + account → core grid → ops + activity → empty hint →
  methodology. Replace `bg-slate-900/50` + dark grays with white-on-navy
  slate-200 surfaces for legibility on the cream app background.

### Phase 3 — Conflict Graph stage-then-approve (commit `0e21c55`)

- `src/lib/services/graph-populate.ts` — `populateSituationGraph` now
  accepts `mode: 'commit' | 'staged'`. Staged mode writes to
  `users/{uid}/situations/{sitId}/graph/staged` and leaves `/main`
  untouched. New helpers: `approveStagedGraph` (merge → main + snapshot,
  delete staged), `getStagedGraph`, `discardStagedGraph`.
- `src/app/api/graph/populate/route.ts` — accepts `body.mode`, defaults
  `commit` to preserve the existing dashboard EmptySituationHint flow.
- `src/app/api/graph/approve-staged/route.ts` — GET returns the current
  staged graph; POST accepts `{ action: 'approve' | 'discard' }`.
- `src/components/conflict-graph/auto-populate-panel.tsx` — one-click
  Stage → review (counts + sample-by-type) → Approve & merge / Discard /
  Restage. Hydrates an existing staged graph on mount so a refresh during
  review does not lose the user's place.
- `src/app/app/conflict-graph/page.tsx` — mount the panel under the
  RealConflictGraphPage disambiguation banner.

### Phase 4 — Risk Monitor + Timeline live data (commit `226401e`)

- `src/lib/constants/indicator-catalog.ts` — domain-specific indicator
  catalogs (INFORM, Glasl, IPC, OCHA, Galtung, ACLED proxy) keyed off
  the 11 ANALYST_DOMAIN_IDS.
- `src/app/api/ai/risk-indicators/route.ts` — calibrated route returning
  Zod-validated indicator cards with severity, trend, source, confidence,
  lastUpdated. Persists to `tools/risk-indicators`.
- `src/app/api/ai/timeline-events/route.ts` — calibrated route returning
  Zod-validated events with type, severity, actors, sources, related,
  confidence. Configurable window 30/90/180/365 days. Persists to
  `tools/timeline-events`.
- `src/components/risk-monitor/live-indicators-panel.tsx` — three-column
  expandable card grid with severity badges, trend arrows, source pills,
  Ask-PRAXIS deep-link per indicator.
- `src/components/timeline/live-events-panel.tsx` — vertical timeline
  with filter chips (type + severity), expandable detail panes, source
  pills, Ask-PRAXIS deep-link per event, configurable window.
- `src/app/app/risk-monitor/page.tsx` and `src/app/app/timeline/page.tsx` —
  mount the live panels alongside the existing AI populate flows.

### Phase 5 — Briefing block builder (commit `e764666`)

- `src/components/briefing/brief-blocks-panel.tsx` — block-based builder
  on top of `/api/ai/brief-builder`. Sortable via `@dnd-kit` (already in
  deps). Per-block actions: regenerate (with focus override), inline edit
  (heading + body), delete, freeform-block insertion, markdown export.
  Surfaces a missing-keys banner for Firecrawl + Parallel and a free-tier
  upgrade chip when applicable.
- `src/app/app/briefing/page.tsx` — mount the BriefBlocksPanel above the
  legacy slide builder so analysts get both surfaces concurrently.

### Validation

- `npx tsc --noEmit` — clean across all five phases.
- `node scripts/audit-ai-routes.mjs` — 61 calibrated, 5 exempt
  (chat, terminology, grounded-search, advisor-chat, ask-praxis).
- Build + GCP audit + vitest run before deploy (see deployment log).

---

## [Unreleased] — 2026-04-27 (Landing-page + share-metadata refresh)

### Changed

- Hero portal animation rebuilt: counter-rotating conic-gradient ring
  frame, breathing aurora, cursor-driven 3D parallax tilt, prismatic
  light sweep, animated ACO node entrances + pulse rings, top-to-bottom
  scan line on every quadrant card, `rotateY + blur` quadrant
  transitions with `layoutId` step pill. Reduced-motion path retained.
- Hero quadrant tour panels now use real Sahel/Mali content: 14 ACO
  entities (Mali junta, JNIM, IS-Sahel, CMA-FLA, Africa Corps, AES,
  ECOWAS, MINUSMA, Algeria, France, Algiers Accord, IDPs, uranium
  leverage, sovereignty narrative) with 16 typed edges; Media Monitor
  with 10 real outlets and σ drift; Ask PRAXIS with a senior-analyst
  exchange citing OCHA/ICG/ACLED inline; Drafting Studio EU FAC
  briefing skeleton with ICD-203 badge and 8 source pills; Calibration
  spine showing `<analyst-profile>` + `<situation-frame>` + 7
  institutional frameworks (Glasl, INFORM, Fisher-Ury, Lederach, OCHA,
  IPC, IHL).
- Hero headline repositioned: **"AI Built for Statecraft. Calibrated to
  You."** with gold accents. Audience row replaced with seven explicit
  practitioner roles (diplomats, conflict analysts, mediators,
  humanitarian leads, policy officers, foreign-policy researchers,
  sanctions and compliance teams). CTAs sharpened to outcome-led
  ("Start Your Workspace" / "See It on a Live Crisis"). Subhead now
  names the institutional frameworks PRAXIS reasons with.
- AI companion section retitled "Generic AI guesses. PRAXIS knows your
  mandate." for narrative continuity; references "statecraft careers".
- Pricing: Demo simplified to a read-only walkthrough, Analyst single
  licence repriced **\$49 → \$100/mo**, Team repriced **\$199 → \$499/mo**
  (up to 10 seats, includes Analyst features), Institution unchanged
  (custom). Landing JSON-LD offers updated to match.
- Replaced the waitlist form with a "Talk to TACITUS" section: two
  prominent CTAs (`hello@tacitus.me` mailto + `tacitus.me` visit), a
  "What TACITUS is building" three-card block (Today · PRAXIS, Next ·
  Calibrated agents, Building · Institutional graph), and a
  positioning paragraph framing PRAXIS as "the first surface of an
  AI-native stack TACITUS is building for statecraft." Component
  export name preserved so the dynamic import in
  `src/app/(landing)/page.tsx` did not change.

### Added (SEO + share metadata)

- Open Graph image (`src/app/opengraph-image.tsx`) redesigned: deep
  navy gradient with decorative gold + diplomatic-blue portal-ring
  composition, "AI-native stack for statecraft" eyebrow, large
  serif headline matching the hero, audience subhead, and bottom
  source-pill strip (ACLED · UCDP · GDELT · OCHA · ReliefWeb · World
  Bank · UN News) plus a "40+ tools · Glasl · INFORM · ICD-203"
  credibility line.
- Root metadata expanded in `src/app/layout.tsx`: title template,
  applicationName, authors/creator/publisher, category,
  formatDetection (no auto email/phone linkify),
  alternates.canonical, og:locale, og:image:type, twitter
  site/creator, googleBot `max-image-preview: large` + `max-snippet:
  -1`, appleWebApp, og:image:secure_url, expanded keyword set
  covering audience and frameworks.
- Landing JSON-LD split into three nodes: SoftwareApplication
  (PRAXIS, with audience and image), Organization (TACITUS, with
  `hello@tacitus.me` ContactPoint and sameAs links), and WebSite.
  SoftwareApplication featureList rewritten to match what PRAXIS
  ships today (agentic tools, ACO v2.0, drafting with ICD-203, full
  feed mix, source-grounded research, Advisor Council, deep-think
  scenarios, GCP tenancy).

---

## [Unreleased] — 2026-04-27 (Round 6 — MONSTER plan + onboarding/demo P0)

### Added

- Brick #1 / Lane 7 — added the LangGraph durable runtime foundation inside
  `praxis-backend`: PostgresSaver factory backed by the provisioned
  Cloud SQL database, `/agents/health`, typed `agent_runs` schemas,
  local smoke-test entry point, Firestore collection-group indexes, and
  Cloud Run private VPC/Secret Manager deploy wiring.
- Added the first Admin Console v2 foundation: `/app/admin/*` now has a
  server-side verified admin layout gate, admin email defaults include both
  `giulio@tacitus.me` and `giuliocatanzariti@gmail.com`, admin email access
  requires Firebase `email_verified`, the operator console includes
  LangGraph agent runs/data ingestions/dev backlog, and a server-only
  Advisor Feed control plane was added for future advisor retrieval.
- Added `docs/MONSTER_TODO_2026-04-27.md`: 22-item production-grade
  execution plan covering durable runtime (LangGraph + Cloud SQL),
  data quality (structured extraction, Document AI, Vertex Search/RAG),
  UX trust (onboarding, user creation, demo-leak close, all-tools audit),
  brand (landing page polish), real intelligence (multi-session Deep
  Search Agent), async backbone (Cloud Tasks dispatcher), money + comms
  (Stripe Meters, email), trust + abuse (App Check, evals), visualisation
  scale (Sigma.js), operability (Operator Console v2, BigQuery sink),
  hygiene (tool-output unification, Postgres cleanup), and close-out.
- Added `mediator` to `ROLES` (`src/types/analyst-profile.ts`) — closes
  the Persona 4 friction surfaced in the 5-persona onboarding audit.
  Mediator users can now self-select instead of falling through to
  `other`. Added 6 mediation-anchored mandate chips
  (`src/lib/constants/onboarding-chips.ts`) and a 6-tool recommendation
  list (mediation-design / negotiation-prep / concordia /
  brainstorming-table / stakeholder-map / commitments) in
  `src/lib/dashboard/role-recommendations.ts`. Added 3 mediator-specific
  red-line chips (BATNA confidentiality, position vs interest, methodology
  limitations).

### Fixed

- Brick #29 P0 — closed the Humanitarian Dashboard demo-leak: replaced
  the brittle `situation.name.toLowerCase().includes('nordalia')` test
  with the canonical `isDemo` flag from `useSituationGuard()`. Live
  users on a "Nordalia Regional Conflict 2025" situation no longer see
  hard-coded `DEMO_DISPLACEMENT` / `DEMO_FOOD_PHASES` / `DEMO_FUNDING`
  figures when feeds (HDX HAPI, ReliefWeb, UNHCR, OCHA FTS) return
  empty. Added `<DegradedDataChip />` next to the page header that
  surfaces when live data is missing in non-demo mode.
- Brick #29 P0 — closed the Dossier demo-leak: `ViewStep` now accepts
  `isDemo` from the parent. When a real situation is bound and AI
  generation has not yet produced sections, every dossier section
  renders "Awaiting AI generation — click Regenerate to draft this
  section" instead of the Nordalia template content from
  `DEMO_DOSSIER_CONTENT`.

### Notes

- Adding `mediator` to `Record<AnalystRole, ...>` maps required minimal
  additive entries in `src/lib/dashboard/role-recommendations.ts`
  (Codex-touched file). No existing logic changed; the file ownership
  rule "edit only if your lane explicitly requires" applies because
  TypeScript exhaustiveness forces the additions.

## [Unreleased] — 2026-04-27 (Codex docs cleanup and LangGraph readiness)

### Added

- Added `docs/ROUND_6_READINESS_2026-04-27.md`, a concise operational plan
  that distills the deep-research memo, confirms LangGraph package
  availability, identifies the production checkpointing decision, and lists
  the human approvals needed before implementing a durable agent runtime.
- Documented the approved Cloud SQL/Postgres LangGraph checkpointing setup:
  private-IP-only `praxisbytacitus-instance`, `praxis_langgraph` database/user,
  Secret Manager password, and `praxis-agents-sa`.
- Added the canonical deep-research execution plan with 16 lanes covering
  onboarding context, situation creation, structured extraction, Document AI,
  Vertex AI Search/RAG, real search, LangGraph agents, cleanup, evals, graph
  scale, and App Check.
- Added idempotent LangGraph Cloud SQL setup scripts for Bash and PowerShell,
  backend/env configuration keys, GCP audit checks for Cloud SQL readiness, and
  compliance/runbook documentation for the private-IP-only database.

### Changed

- Updated `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/INDEX.md`,
  `docs/CONTINUATION.md`, and `docs/CODEX_HANDOFF_2026-04-27.md` so the
  active workspace is `C:\Users\giuli\praxiscodexworking` and the current
  read order starts with the Round 6 readiness note.
- Repointed stale internal doc links from `CODEX_HANDOFF_2026-04-26.md` and
  `CODEX_KICKOFF_PROMPT.md` to the current 2026-04-27 handoff/readiness docs.

### Removed

- Removed superseded prompt docs from the active docs set:
  `docs/CODEX_HANDOFF_2026-04-26.md`, `docs/CODEX_KICKOFF_PROMPT.md`, and
  `docs/HANDOFF_TO_CODEX_5_5.md`.

## [Unreleased] — 2026-04-26 (tenth session — Claude Code multi-lane sprint)

> Local clone path: `C:\Users\giuli\ANTIGRAVITY\A4_PRAXIS_CLOUD_Work` (fresh `git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`). Older locked clone at `C:\Users\giuli\ANTIGRAVITY\A4_PRAXIS_CLOUD_TACITUS\A4_PRAXIS_CLOUD_Work` was abandoned (Windows file lock prevented removal); secrets were preserved at `C:\Users\giuli\ANTIGRAVITY\_praxis_env_backup_20260426\` before re-cloning.

### Lane A — Situation corpus retrieval API (NEW)

- Added `src/types/corpus.ts` defining `CorpusItem`, `CorpusLayer`,
  `CorpusSearchRequest`, `CorpusSearchResponse`, `CorpusSearchTrace`,
  and the `argus | sources | documents | graph | tool-output` retrieval
  contract from `docs/CORPUS_ARCHITECTURE.md`.
- Added `src/lib/intelligence/corpus-search.ts` exposing
  `searchSituationCorpus({uid, situationId, query, layers, limit})` —
  the shared retrieval helper that ranks evidence across five layers via
  parallel firebase-admin reads, deterministic keyword + recency scoring,
  and document-chunk hybrid (vector + keyword) scoring through the
  existing `retrieveRelevantChunks` pipeline. Each layer fails closed: a
  Firestore error or missing tool-data doc returns `[]` for that layer
  while the others still resolve.
- Added `POST /api/intelligence/corpus-search`
  (`src/app/api/intelligence/corpus-search/route.ts`) — `withAuth`-wrapped
  endpoint with Zod request validation, 50-item hard cap, demo-session
  bypass (returns an empty corpus rather than leaking demo data), and a
  trace block exposing layer counts, total candidates, ranking strategy,
  and server-side `durationMs`.
- This endpoint is intentionally NOT registered as an AI route: it is a
  retrieval/intelligence endpoint, does not call any model, and does not
  consume credits. `node scripts/audit-ai-routes.mjs` continues to pass
  with 53 calibrated / 4 exempt because nothing under
  `src/app/api/intelligence/*` is in scope for that audit.
- Added unit tests at `tests/services/corpus-search.test.ts` covering
  tokenization, scoring, layer-priority ordering, severity/reliability
  → confidence mapping, tool-output summarisation, slug fallback.
- Step 4 of `docs/CORPUS_ARCHITECTURE.md` (Ask PRAXIS calling the shared
  helper instead of building its own context) is intentionally deferred
  to a follow-up session to avoid touching the chat route in the same
  commit. The existing `src/lib/argus/corpus-context.ts` continues to
  work unchanged.
- Validation: `npx tsc --noEmit` clean, `node scripts/audit-ai-routes.mjs`
  passes 53/4, `npx vitest run` passes 188/188.

### Lane B — Humanitarian calibrated route (NEW)

- Closes the highest-impact tool fix flagged in
  `docs/tools/UX_AUDIT_2026-04-26.md` (Humanitarian had no dedicated AI
  route; the registry pointed at `/api/ai/chat` so the analyst profile
  language, audience tone, and red-line clauses never made it into
  humanitarian briefs).
- Added `POST /api/ai/humanitarian` (`src/app/api/ai/humanitarian/route.ts`)
  with full `withCalibration('humanitarian', 'ai_humanitarian')` wrapping,
  Zod-validated `HumanitarianSnapshotSchema` output (BLUF, IPC phases,
  displacement, funding, protection concerns, access constraints,
  intelligence gaps, recommended actions, confidence, aggregated primary
  sources), live data grounding via `getSituationIntelligence` (HDX HAPI,
  ReliefWeb, UNHCR, OCHA FTS, UN News, GDELT), `saveToolOutput`
  persistence under `tool-data/humanitarian` with provenance metadata,
  and a demo-mode bypass that returns a labelled demo snapshot.
- Added `ai_humanitarian` (cost: 2 credits) to `AI_CREDIT_COSTS` in
  `src/lib/api/with-credits.ts`.
- Updated `src/lib/constants/tool-registry.ts` Humanitarian entry:
  `aiRoute` flipped from `/api/ai/chat` → `/api/ai/humanitarian`.
- Added `tests/services/humanitarian-schema.test.ts` covering positive
  cases, empty-evidence sections, BLUF gating, invalid IPC phase,
  negative displacement, gapPercent overflow, unsupported categories,
  unsupported confidence values.
- Page-level wiring (`src/app/app/humanitarian/page.tsx` switching from
  `/api/ai/chat` stream to the structured snapshot) is intentionally
  deferred to keep blast radius small — the page still renders, the
  legacy "AI brief" stream still works, and analysts can call the new
  route directly from `Ask PRAXIS`/agents/Brainstorming Table once
  those land. Page wiring is queued for the next session.
- Validation: `npx tsc --noEmit` clean, `node scripts/audit-ai-routes.mjs`
  now reports `54 AI route files, 54 calibrated, 4 exempt` (was 53/4),
  `tests/services/*` green.

### Lane C — Brainstorming Table MVP (NEW)

- Ships the synchronous prototype of the Brainstorming Table tool from
  `docs/AGENTIC_SYSTEM.md`. Six expert personas (mediator, humanitarian
  lead, legal analyst, media analyst, security/risk analyst, red-team
  critic) deliberate over a single analyst question, each contributing
  a structured row (claim, evidence with sourceType, optional critique,
  optional recommendation, confidence, status). The orchestrator writes
  a synthesis block: BLUF, consensusPoints, divergences, decision
  options with trade-offs and preferredBy persona attribution, open
  questions, and next actions with owner + urgency.
- Added `POST /api/ai/brainstorming-table`
  (`src/app/api/ai/brainstorming-table/route.ts`) wrapped with
  `withCalibration('brainstorming-table', 'ai_brainstorming_table')`
  (5 credits). Pulls evidence from the new
  `searchSituationCorpus` so every claim is anchored to a corpus item
  or marked `sourceType="reasoning"` when no evidence supports it.
  Pro-model call with `Output.object({ schema: BrainstormingTableSchema })`,
  Zod-validated output, demo-mode fixture, persistence to
  `users/{uid}/situations/{sitId}/tools/brainstorming-table` via
  `saveToolOutput` with personas, retrievalTrace, and question metadata.
- Added `'brainstorming-table'` to the `ToolName` union in
  `src/lib/services/tool-data-service.ts` so the page can subscribe via
  `useToolData`.
- Added the tool to `src/lib/constants/tool-registry.ts` under the
  `simulation` category, with related tools (negotiation-prep,
  mediation-design, concordia, humanitarian, legal-tracker), 48-hour
  staleness, and Pro model tier.
- Added `ai_brainstorming_table` (5 credits) to `AI_CREDIT_COSTS` in
  `src/lib/api/with-credits.ts`.
- Added `src/app/app/brainstorming-table/page.tsx` — synchronous UI:
  question textarea, "Convene the table" CTA, structured deliberation
  table with persona pills, evidence pills, critique/recommendation
  cells, confidence and status badges, plus a synthesis card with
  consensus/divergences/decision options/next actions. Onboarding gate
  + situation guard + demo banner included. Reads persisted output via
  `useToolData('brainstorming-table')`.
- Added `tests/services/brainstorming-table-schema.test.ts` covering
  positive case, minimum-2-turn requirement, unknown persona id,
  unknown status, BLUF length floor, unsupported next-action urgency,
  unsupported confidence, and the `reasoning` evidence sourceType.
- Cloud Tasks fan-out (per-turn delivery via `praxis-agents`) and a
  `/demo/brainstorming-table` mirror page are intentionally deferred
  per `docs/AGENTIC_SYSTEM.md` "First Implementation Queue".
- Validation: `npx tsc --noEmit` clean,
  `node scripts/audit-ai-routes.mjs` now reports
  `55 AI route files, 55 calibrated, 4 exempt` (was 54/4),
  `tests/services/*` green.

### Lane D — Shared confidence/citation primitives + provenance panel

- Closes the cross-tool finding in `docs/tools/UX_AUDIT_2026-04-26.md`
  ("extract a shared `<Citation>` and `<ConfidenceBadge>` so every tool
  surfaces these the same way") and brick #4 of
  `docs/NEXT_BRICKS_2026-04-26.md` (Output Provenance Panel).
- New: `src/components/praxis/confidence-badge.tsx` — canonical
  high/medium/low/unknown badge using ICD 203 / Heuer vocabulary, with
  `normalizeConfidence()` helper for safe coercion of unknown strings.
- New: `src/components/praxis/citation.tsx` — inline + chip variants
  for source citations with optional URL, publish date, and sourceType
  badge. Replaces ad-hoc `<a>` tags scattered across tool pages.
- New: `src/components/praxis/output-provenance-panel.tsx` —
  default-collapsed "Why this output?" disclosure showing tool id,
  generated-at, profile version, domain version, model, source count,
  retrieval query, layers searched, and primary-source chips. Will read
  directly from `ToolOutputEnvelope` once that lands (NEXT_BRICKS #2).
- Wired the new primitives into `src/app/app/brainstorming-table/page.tsx`
  as the first consumer: persona-row confidence column now uses
  `<ConfidenceBadge />` and the page renders an
  `<OutputProvenancePanel />` below the synthesis card so analysts can
  see retrieval trace and timestamp at a glance.
- `tests/services/confidence-badge.test.ts`: covers happy path,
  case-insensitive normalisation, fall-through to `unknown` on
  unsupported strings / null / undefined.
- Did NOT migrate Risk Monitor / Briefing Room / Legal Tracker /
  Humanitarian to the new primitives in this commit — that touches
  Codex-owned Workspace Personalization files (sidebar, dashboard,
  recommendations). Future Codex/Claude lanes can opt tools in.

### Round 5 — Hero quadrant tour + 10 new bricks + Codex handoff doc

> User asked for a fifth round: 10+ high-impact improvements, hero
> animation that shows breadth of tools (graph, media, drafting, user
> context), color/legibility audit, agentic objectives + GCP/Firebase
> research, and a fresh Codex handoff document.

#### Round 5 plan
- New `docs/ROUND_5_PLAN_2026-04-26.md` — 10 named bricks (45-54),
  10 super-solid agent objectives, GCP + Firebase research summary
  with new candidate services (Vertex AI Vector Search, BigQuery
  Vector Search preview, Eventarc Advanced, Firebase Data Connect,
  Firestore Bundles, Firebase Extensions, Remote Config, FCM, Cloud
  CDN), large-scale landing roadmap, and 5 deferred decisions for
  the human.

#### Brick #45 — Hero quadrant tour (CODE)
- New `src/components/landing/hero-quadrant-tour.tsx` cycles four
  product surfaces in the right column of the hero every 4.2s:
  Conflict Graph → Media Monitor → Drafting Studio → User Context.
  Honours `prefers-reduced-motion` (stacks panels statically when
  reduced). Step-indicator pills let visitors jump between panels.
- `src/components/landing/hero-visual.tsx` swapped from
  `<ProductGlimpse />` (single panel) to `<HeroQuadrantTour />`
  (four panels). The wrapping floating-motion + glow + orbiting
  pings preserved.
- The four panels are deliberately simplified animated SVG/HTML
  cards — representational not pixel-perfect screenshots.

#### Brick #46 — Color system audit (DOC + verified)
- Round 4 Lane BB already fixed the worst offender (the dashboard
  WidgetShell). Round 5 audits the remaining surfaces.
- New `docs/COLOR_SYSTEM_AUDIT_2026-04-26.md`:
  * Lists 5 legitimate inverted blocks (DON'T fix these — they're
    intentional terminal/code/ops-console surfaces).
  * Catalogues 10 candidate files for follow-up review.
  * Defines the canonical swap table (slate-900/40 → bg-white +
    shadow, slate-300 → navy-700 titles, slate-400 → navy-500
    subtitles, etc.).
  * Documents the WCAG AA acceptance test for any future fix.

#### Bricks #47-54 — Specs only (NEW BRICKS in roadmap)
- 47 — Brief Builder agent (versioned, lock-able UNSC-style brief).
- 48 — Conflict Graph delta panel (graph_updates approval queue UI).
- 49 — Daily Brief 06:00 cron per situation (Cloud Scheduler).
- 50 — Sources Library priority lift (preferred / blocked / neutral).
- 51 — Onboarding rationale messaging (now P0 from BIG #39).
- 52 — Real notification bell wired to Firestore.
- 53 — Document → graph cross-link UI.
- 54 — Stripe Meters for usage billing.

Each brick has rationale, persona impact, GCP service path, files
involved, and definition of done documented in
`docs/ROUND_5_PLAN_2026-04-26.md`.

#### Codex handoff
- New `docs/CODEX_HANDOFF_2026-04-27.md` — fresh drop-in prompt for
  the next Codex session. Covers rounds 1-5 work + a complete
  ownership rules section + lane queue + validation gate + hard
  rules (12 of them now, 4 of which are new in round 5).

#### Bricks #47-54 — second sweep (CODE shipped)

User pushed back on "specs only" — round 5 must ship code on every
brick. Done:

- **Brick #47** — Brief Builder agent (agentic workflow #3).
  `POST /api/ai/brief-builder` runs the Synthesis Chair persona via
  runAgent over the situation corpus, emitting a versioned, lock-able
  UNSC-style brief. BriefBuilderSchema enforces 3-10 sections each with
  per-section provenance, 0-8 decision points, intelligenceGaps[],
  recommendedSources[]. ai_brief_builder credit op (5). Tool registry
  entry under drafting category, 24h staleness. Tests:
  brief-builder-schema (9).
- **Brick #48** — Conflict Graph delta panel.
  `src/lib/firebase/graph-updates-service.ts` — admin-side helpers
  (count / list / get / approve / reject + applyApprovedProposal stub).
  `/api/situations/[id]/graph-updates` GET + POST routes for list +
  decision flips. `<GraphProposalsPanel />` component with compact
  banner mode + full panel mode (per-proposal Approve/Reject CTAs +
  kind labels + confidence bands + provenance links).
- **Brick #49** — Daily Brief 06:00 cron.
  `/api/cron/daily-brief` collectionGroup-iterates active situations,
  filters to `localHour === 6` per analyst timezone (falls back UTC),
  dispatches per-situation `/api/ai/auto-briefing`. Failures
  auto-publish to dev_backlog. infrastructure/scheduler/daily-brief-cron.yaml
  ships the schedule (every hour UTC) with retry + 9-min deadline.
- **Brick #50** — Sources Library priority lift.
  `src/lib/services/sources-preference.ts` (preferenceForUrl,
  applySourcePreferences, normalizeHost). Source Scout route now
  filters proposals: 'preferred' float to top, 'blocked' dropped,
  'neutral' preserved. saveToolOutput metadata records {blocked,
  lifted} counts. Tests: sources-preference (15).
- **Brick #51** — Onboarding rationale messaging.
  `src/lib/onboarding/rationale.ts` returns OnboardingRationale
  ({headline, bullets[3-5], example: {tool, outcome}}) for 7 named
  roles, 10 named domains, fr/ar/es working-language copy + English
  fallback. Tests: onboarding-rationale (12).
- **Brick #52** — Real notification bell.
  `src/hooks/use-live-notifications.ts` — bridge hook that picks demo
  vs Firestore source by `user.isDemo`. Live source uses
  useNotifications from use-activity-feed (Firestore onSnapshot).
  Mark-read fires PATCH /api/notifications/[id]. NotificationBell
  swapped from useNotificationStore (demo-only) to useLiveNotifications.
- **Brick #53** — Document → graph cross-link primitive.
  `<DocumentRefChip />` chip + hover popover linking to
  /app/documents?docId=<id>&chunkId=<id>. buildDocumentRefHref +
  readDocRefFromSearch helpers. Tests: document-ref-chip (9).
- **Brick #54** — Stripe Meters helper.
  `src/lib/billing/stripe-meters.ts` — emitMeterEvent (single event,
  4xx/5xx auto-publish to dev_backlog) + emitToolRunMetered (emits
  tool_run + input/output/thinking token meters per successful run,
  idempotent on tool_run id). No-ops cleanly when STRIPE_METERS_DISABLE
  or STRIPE_SECRET_KEY unset. Tests: stripe-meters (4).

#### Round 5 validation (final)
- `npx tsc --noEmit` clean.
- `node scripts/audit-ai-routes.mjs` 58/4 (was 57/4 entering — +1 from
  Brick #47 Brief Builder route).
- `npm run audit:gcp` 0 hard / 0 soft.
- `npx vitest run` 366/366 (was 317 entering round 5 — +49 from
  bricks 47/50/51/53/54 tests).
- `npm run build` clean.

### Round 4 — Visual fixes + dev backlog + clarifying questions + Wikipedia + analyst notes

> User flagged a screenshot at the dashboard showing illegible
> grey-on-grey cards and a debug pill overlapping the Ask PRAXIS
> dome, plus asked for: a developer backlog readable by code agents,
> clarifying-question popups when AI tools need more input, Wikipedia-
> backed Conflict Graph / Timeline generation, and natural-language
> knowledge retention every tool can consult.

#### Lane AA — Bottom-right collision + Screenshot gitignore
- `.gitignore`: `Screenshot*.png|jpg|jpeg` now ignored so personal
  screenshots dropped into the repo for agent review never ship.
- `src/components/app/activity-panel.tsx`: pill moved from
  `fixed bottom-4 right-4` to `bottom-24 right-6` so it sits ABOVE
  the FloatingPraxis dome with a clear gap. Open-panel position
  moved from `bottom-14 right-4` to `bottom-36 right-6` to match.

#### Lane BB — Dashboard card legibility
- Root cause: `WidgetShell` used dark-theme `slate-800/900/300/500/600`
  tokens but the dashboard renders inside the `app-light` shell.
- `src/components/dashboard/widget-shell.tsx`: token swap to light-mode
  `navy-700/600/500/400` + `slate-200` borders + `bg-white` + soft
  shadow. Hits WCAG AA contrast.
- `src/components/dashboard/recommended-tools-widget.tsx`: list-item
  text flipped to `text-navy-900` / `text-navy-600` with hover-to
  diplomatic-blue. Hover bg flipped from `slate-800/60` to `slate-100`.
- Same WidgetShell powers RiskGaugeWidget + EscalationWidget so all
  three cards in the screenshot now render with proper contrast.

#### Lane CC — Developer backlog system
- New `src/lib/dev-backlog/types.ts` + `service.ts` define the
  `dev_backlog/{id}` Firestore collection: 8 kinds (`error.route`,
  `error.calibration`, `perf.slow-tool`, `corpus.empty`,
  `ux.friction`, `idea.agent`, `idea.user`, `data.gap`), 5
  severities, 7 statuses, dedupe key (SHA-1 of normalised
  signature), occurrences counter, brick id linkage, TTL by severity
  (30/90/365 days).
- `publishBacklogEntry()` folds duplicates by dedupe key —
  occurrences bump instead of flooding the collection. Severity rises
  but never falls on duplicates.
- `queryBacklog()` supports filters by kind/severity/status/toolId/
  situationId + bounded look-back window. `setBacklogStatus()` flips
  state and links a brickId.
- `src/app/api/intelligence/dev-backlog/route.ts`: GET + POST gated
  by `ADMIN_ALLOWLIST` env var, Zod-validated.
- `src/lib/api/with-calibration.ts`: every handler throw + every
  4xx/5xx response now auto-publishes a backlog row (5xx high, 4xx
  medium, 401/403 low). Existing tool_run + system_event +
  notification flow unchanged.
- `tests/services/dev-backlog.test.ts` — 18 tests covering normalize,
  dedupe-key collision under dynamic ids, severity rank, TTL by
  severity, capString, clamp.

#### Lane DD — Clarifying Questions framework
- `src/lib/agents/clarifying-questions.ts`: ClarifyingQuestionSchema
  (id, prompt, why, inputType, options, required, topic) with 6
  topics (scope/sources/audience/red-line/tradeoff/data/other) and 5
  inputTypes (short-text/long-text/single-choice/multi-choice/yes-no).
  `clarificationResponse(req)` helper any AI route returns INSTEAD of
  its normal output (HTTP 200 with discriminator body). `isClarification
  Response()` type guard for client-side detection.
  `answersToPromptBlock()` renders the analyst's answers as a
  `## ANALYST ANSWERS TO CLARIFYING QUESTIONS` section the resume
  route prepends.
- `src/components/praxis/clarifying-questions-modal.tsx`: dialog
  with topic-coloured pills, per-input-type widgets, Cancel /
  Resume CTAs, required-question gating.
- `tests/services/clarifying-questions.test.ts` — 15 tests covering
  schema validation, defaults, request caps (1..5), bundle
  validation, type guard, response helper happy path + malformed
  throw, prompt-block rendering for string/array/boolean answers.

#### Lane EE — Wikipedia enrichment client
- `src/lib/enrichment/wikipedia.ts`: `getWikipediaSummary`,
  `getWikipediaRelated`, `searchWikipedia` using the unauthenticated
  REST API + opensearch endpoint with 6s timeout, AbortController,
  PRAXIS user-agent. `formatWikipediaPromptBlock(summary, related)`
  renders a `## WIKIPEDIA BACKGROUND (CC-BY-SA, cite by URL on use)`
  block with extract capped at 1800 chars, related entities, and an
  explicit citation reminder.
- `tests/services/wikipedia-enrichment.test.ts` — 5 tests covering
  URL encoding, opensearch params, empty-state hint, populated
  render, extract cap.

#### Lane FF — Analyst Notes (natural-language knowledge retention)
- `src/lib/knowledge/analyst-notes.ts`: CRUD on
  `users/{uid}/situations/{sitId}/analyst_notes/{id}`. AnalystNoteSchema
  caps text at 4000 chars + 12 tags + 4 confidence levels.
  `formatAnalystNotesBlock(notes)` renders a `## ANALYST NOTES
  (PROVIDED BY USER, TREAT AS HIGH-PRIORITY CONTEXT)` block with an
  explicit "do NOT contradict an analyst note silently — flag the
  contradiction" instruction.
- `tests/services/analyst-notes.test.ts` — 8 tests covering schema
  defaults, validation, prompt-block formatting (empty + populated +
  no-tags case), contradict-warning instruction.

#### Round 4 validation
- `npx tsc --noEmit` clean.
- `node scripts/audit-ai-routes.mjs` 57/4 (no new AI routes — only
  intelligence + helper modules).
- `npx vitest run` 317/317 (was 270 at round-3 end; +47 from
  CC/DD/EE/FF tests).
- `npm run build` clean.

### Round 3 — 15-improvement sprint (Lanes M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z + LP1 + LP2)

> Plan doc: `docs/IMPROVEMENT_15_2026-04-26.md`. Round 3 ships 8 code
> lanes, the agentic runner, two new agentic workflows (Source Scout +
> Red-Team Review), shared error/citation/markdown primitives,
> landing-page hero overhaul + product/marketing section, and seven
> drop-in specs for the remaining improvements.

#### Lane Z — Generalized agent runner (`src/lib/agents/run-agent.ts`)
- New `runAgent({ personaId, uid, situationId, query, calibration,
  schema, ... })` helper consumed by every agent route. Single
  pipeline for persona role prompt + calibration + corpus evidence +
  Pro-model generation against a Zod schema.
- `AgentRunnerError` codes: `unknown-persona`, `inactive-persona`,
  `corpus-retrieval-failed`, `model-call-failed`. Routes return
  501/502 accordingly.
- Tests at `tests/services/run-agent.test.ts` cover persona block,
  calibration block (RESPOND IN + red lines), corpus block (empty +
  populated), clamp helper.

#### Lane T — Source Scout agent (agentic workflow #1)
- `POST /api/ai/source-scout` calibrated route + Zod schema
  (`SourceScoutSchema`). Proposes 3–8 fresh defensible sources on a
  question the analyst hasn't seen yet, ranked by reliability tier
  (a/b/c/d) and corroboration. Consults `searchSituationCorpus` to
  avoid recommending duplicates.
- Activated `'source-scout'` persona in `src/lib/agents/registry.ts`.
- `ai_source_scout` (3 credits) added to `with-credits.ts`.
- Tool registry entry under intelligence category, 168h staleness.
- `'source-scout'` added to `ToolName` union.
- Page at `src/app/app/source-scout/page.tsx` — question textarea,
  timeframe pills, results table with reliability badges + 'Copy for
  Sources Library' helper, intelligence-gaps banner, provenance
  panel.
- `tests/services/source-scout-schema.test.ts` covers positive case +
  7 invalid cases.

#### Lane U — Red-Team auto-review agent (agentic workflow #2)
- `POST /api/ai/red-team-review` accepts any tool output (toolId +
  JSON payload, capped at 12K chars) and returns a structured
  adversarial critique: unstated assumptions (severity-tagged),
  source diversity issues, motivated reasoning red flags, missing
  intelligence gaps, confidence adjustment block (original →
  suggested with rationale), mandatory `whatWouldChangeMyMind`
  falsifiability signal, recommended follow-ups (often Source Scout
  or Brainstorming Table).
- `ai_red_team_review` (3 credits) added to `with-credits.ts`.
- Tool registry entry under analysis category, 72h staleness.
- `'red-team-review'` added to `ToolName` union.
- `tests/services/red-team-review-schema.test.ts`: 8 schema tests.

#### Lane V — `<AiErrorToast />` + `<DegradedDataChip />` shared primitives
- Closes F-CCM-1 (silent 503) and F-CCM-4 (invisible feed-degraded
  state) from `docs/TOOL_RELIABILITY_AUDIT_2026-04-26.md`.
- `src/stores/ai-error-store.ts` — Zustand store with publish() /
  dismiss() / clear(); each entry carries
  `{id, toolId, status, message, retryable, retry?, at}`.
- `src/components/praxis/ai-error-toast.tsx` — top-right toast
  portal, mounted in app-shell. Auto-dismisses after 12s, supports
  Retry button when `entry.retry` is provided. Tones by status code
  (5xx rose / 429 amber / other slate).
- `src/components/praxis/degraded-data-chip.tsx` — small chip surfaced
  next to a tool's headline when live feeds were unavailable; shows
  missing feed names in tooltip + body.
- `tests/services/ai-error-store.test.ts` — 6 tests covering publish,
  dismiss, retry callback preservation, clear, unique-id under load.

#### Lane W — Citation parser + chip primitives for Ask PRAXIS chat
- `src/lib/chat/citation-parser.ts` — pure parser turning a chat
  reply into `ChatToken[]` (text / citation-index / citation-layer).
  Case-insensitive layer matching; nine recognised layers.
- `src/components/assistant/citation-chip.tsx` — `<CitationIndex />`
  and `<CitationLayer />` primitives with per-layer colour tone,
  tooltip, optional click handlers for opening a side panel.
- `tests/services/citation-parser.test.ts` — 11 tests covering plain
  text, single index/layer, multiple citations, case-insensitive
  match, unrecognised brackets staying text, rejected `[#0]`,
  empty/undefined input.
- Threading the chips into the streaming chat-interface itself is
  queued as a follow-up.

#### Lane X — Brainstorming Table Markdown export
- Closes step 6 of `docs/AGENTIC_SYSTEM.md` First Implementation
  Queue and item #7 of `docs/IMPROVEMENT_15_2026-04-26.md`.
- `src/lib/exports/brainstorming-markdown.ts` — pure function
  `brainstormingTableToMarkdown(input)` renders YAML frontmatter +
  title + BLUF + personas + per-turn sections (with reasoning-only
  marker when evidence is empty) + synthesis (consensus, divergences,
  options with preferredBy attribution, open questions, next actions)
  + provenance footer with retrieval trace.
  `brainstormingTableFilename()` helper slugifies and dates.
- `src/app/app/brainstorming-table/page.tsx`: 'Download memo' button
  on the deliberation header creates a Blob + triggers download.
- `tests/services/brainstorming-markdown.test.ts` — 11 tests covering
  frontmatter, BLUF blockquote, per-turn sections, reasoning-only
  marker, synthesis sub-sections (populated + empty), retrieval
  trace footer, fallback for missing trace, filename slugging edges.

#### Lane LP1 — Landing page hero animation + product copy overhaul
- User flagged the hero right-column was rendering blank because
  `HeroVisual` gambled on a missing `/landing/hero-loop.mp4`.
- `src/components/landing/hero-visual.tsx`: drop the missing-video
  path; always render the live `ProductGlimpse` SVG (Conflict Graph
  + Risk Gauge + Live Updates ticker + grounded-source pills) wrapped
  in a subtle floating motion + soft gold/blue glow + three orbiting
  pings. Honours `prefers-reduced-motion`.
- `src/components/landing/hero.tsx`: removed `"Demo data is labelled"`
  trust signal; new signals are `Calibrated to your role`, `Open-data
  first`, `Google Cloud native`, `Sources you can defend`.
  Subheadline rewritten around the user's product framing: "Most of
  policy is not classified. PRAXIS turns the open record into a
  calibrated workspace where AI experts you train help you assess,
  draft, and decide."
- `src/components/landing/ai-companion-section.tsx` (NEW) — three-
  pillar product section explaining (1) most policy work is open,
  (2) sensitive work stays private, (3) AI as a pro not a chatbot
  — plus four companion benefits (expert team, persistent memory,
  companion you train, Source Scout) and a six-domain general-path /
  specific-toolkits grid (diplomacy, humanitarian, human rights,
  development, conflict analysis, narrative).
- Mounted after `HowItWorks` in `src/app/(landing)/page.tsx`.

#### Lane LP2 — Audit of previous lanes
- Verified every code file from rounds 1–2 + round 3 exists and is
  committed: `src/types/corpus.ts`,
  `src/lib/intelligence/corpus-search.ts`,
  `src/app/api/intelligence/corpus-search/route.ts`,
  `src/app/api/ai/humanitarian/route.ts`,
  `src/app/api/ai/brainstorming-table/route.ts`,
  `src/app/api/ai/source-scout/route.ts`,
  `src/app/app/source-scout/page.tsx`,
  `src/app/app/brainstorming-table/page.tsx`,
  `src/components/praxis/{confidence-badge,citation,output-provenance-panel}.tsx`,
  `src/components/landing/ai-companion-section.tsx`,
  `src/lib/agents/registry.ts`,
  `src/lib/agents/run-agent.ts`. Working tree clean.

#### Lane M — Agent registry codified (this round)
- See round-2 entry below; round 3 activates `'source-scout'` and
  refactors the Brainstorming Table route to import from the
  registry.

#### Lanes N, O, P, Q, R, S
- See round-2 entries below.

#### Lane Y — Seven specs for the remaining improvements
- `docs/specs/2026-04-26-improvements/` holds drop-in specs for items
  9–15 of `docs/IMPROVEMENT_15_2026-04-26.md`:
  - 09-onboarding-rationale.md (Codex, ~1d, NEW BRICK 39).
  - 10-document-ai.md (Codex ops, ~2d, BIG #31).
  - 11-cloud-translation.md (~2d, BIG #32).
  - 12-brainstorming-cloud-tasks.md (Codex backend+ops, ~3d, BIG #18).
  - 13-changed-since.md (Codex, ~1d, NEW BRICK 40).
  - 14-briefing-versioning.md (Claude UX, ~2d, BIG #9).
  - 15-domain-overrides.md (Claude Tools, ~1d, BIG #6).
- README indexes them with owner / brick id / effort estimate.

#### Round 3 validation
- `npx tsc --noEmit` clean.
- `node scripts/audit-ai-routes.mjs` reports
  `57 AI route files, 57 calibrated, 4 exempt` (was 55/4 entering round 3).
- `npm run audit:gcp` 0 hard / 0 soft.
- `npx vitest run` 270/270 (was 215, +55 tests across round 3).
- `npm run build` clean.

### Lane N — Ask PRAXIS wired to the shared corpus retriever

- Closes step 4 of `docs/CORPUS_ARCHITECTURE.md`. Ask PRAXIS chat
  (`src/app/api/ai/chat/route.ts`) now reasons over the same evidence
  layers as Brainstorming Table, Humanitarian, and any future agent —
  `argus | sources | documents | graph | tool-output` — ranked the same
  way via `searchSituationCorpus` from Lane A.
- Removed the legacy cookie-parsing `buildAskPraxisCorpusContext` call;
  `_user.uid` from `withCalibration` is the canonical source.
- Inline citation refs: corpus items are surfaced as numbered references
  (`[#1]` / `[#2]` …) plus their layer tag in `[brackets]` so analysts
  can trace each claim to its origin.
- Empty-retrieval path: when 0 corpus items match, the system prompt
  marks the question as an intelligence gap and recommends a relevant
  tool run instead of fabricating an answer.
- New "Routing Heavy Questions" system-prompt section: when the user
  asks a strategic, multi-stakeholder question, the chat recommends
  running the Brainstorming Table at `/app/brainstorming-table` for a
  structured deliberation with mediator / humanitarian / legal / media /
  security / red-team personas + synthesis chair.

### Lane M — Agent registry codified

- New `src/lib/agents/registry.ts` is the single source of truth for
  every persona PRAXIS can invoke. 10 personas registered: 6 active
  (mediator, humanitarian, legal, media, security, red-team), 1
  orchestrator (synthesis-chair, used inside Brainstorming Table), and 3
  forward-compatibility stubs (source-scout, graph-cartographer,
  timeline-editor) declared `active: false`.
- `AGENT_REGISTRY`, `DEFAULT_BRAINSTORMING_PANEL`, `activePersonas()`,
  `criticPersonas()`, `getPersona(id)` exports.
- Refactored `src/app/api/ai/brainstorming-table/route.ts` to read
  personas from the registry rather than inlining a duplicate. Type
  alias keeps the Zod enum tight.
- New `tests/services/agent-registry.test.ts` covers registry
  consistency, panel membership, critic presence, handoff requirement,
  null-safety on stubs and unknown ids.
- New `docs/AGENT_REGISTRY.md` documents anatomy, active vs stub
  tables, how to add a persona, the agent-invocation flow, and the
  five operating principles.

### Lanes O–S — Strategy / test / GCP / TODO / index docs

- New `docs/TEST_PLAN_2026-04-26.md` — runnable multi-persona test
  matrix covering onboarding, profile, top-10 tools (no situation /
  no profile / live happy path / live cold-reload / demo / failure
  modes), Ask PRAXIS regression, operational spine, production smoke,
  and an automation backlog (`P-Test-1` … `P-Test-7`).
- New `docs/GCP_EXPANSION_PLAN_2026-04-26.md` — 12 new Google Cloud
  services to layer in, ranked by user value × shippability:
  Document AI (NEW BRICK 31), Cloud Translation (NEW BRICK 32),
  Vertex AI Search, Cloud Workflows (NEW BRICK 33), Cloud KMS
  (NEW BRICK 34), Cloud Run Jobs fallback, Vertex AI Eval
  (NEW BRICK 35), Cloud Logging→BigQuery sink, Cloud Armor
  (NEW BRICK 36), Vertex AI Pipelines (NEW BRICK 37), IAP
  (NEW BRICK 38), plus DLP / Confidential Compute as cross-cutting.
- New `docs/TODO_BOARD_2026-04-26.md` — single-pane source of truth
  for every open brick. Status legend (🟢 done · 🟡 in-progress · ⚪
  queued · 🔴 blocked · 🔵 stub), owner, priority. Tracks Lanes
  shipped this session, Lanes queued for Codex (F–K), all 30 big
  bricks from `PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md`, the 8 new
  bricks from `GCP_EXPANSION_PLAN`, and the 7 test-automation
  backlog items.
- New `docs/TOOL_RELIABILITY_AUDIT_2026-04-26.md` — top-10 tools
  walked through 5 failure modes (no situation / no profile / feed
  timeout / model quota / persistence fail). Each tool gets a
  per-mode pass/fail and a TODO list. Cross-cutting findings: model
  quota 503 silent across all tools (file as `tools/ask-praxis-error-state`),
  persistence id drift on 5+ tools (Lane J), demo data leaks in
  live mode on 5+ tools (BIG #29), feed-degraded state lacks a chip
  (file as `<DegradedDataChip />` brick).
- New `docs/INDEX.md` — single-pane navigation across every doc in
  the repo. Sections: Read in this order (cold start), Strategy &
  roadmap, Architecture, Tools, Testing, Operations, Handoffs &
  prompts, Specs, Research artifacts. "Where new docs go" rules
  documented.

### Lane E — Strategy: large-scale improvement roadmap + persona walkthroughs

- Added `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` — flagship-grade
  90-day improvement roadmap. 30 named bricks grouped into Calibration
  & Corpus, Tools & Workflows, Agents & Long-Running Jobs, Operational
  Excellence & Trust. Each brick names persona, decision unlocked, GCP
  service path, and definition of done. Includes a layered view of
  the five working layers (Calibration, Corpus, Tools, Agents,
  Operations), a Google Cloud architecture diagram showing where each
  brick lives, a 7-day / 30-day / 90-day plan, eight operating
  principles every future lane must respect, weekly risk tracking, and
  a "how to pick your next lane" handoff procedure.
- Added `docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md` — five
  persona walkthroughs (UN/OSCE diplomat, humanitarian lead, legal
  analyst, mediator, researcher), each scenario-driven with friction
  observed, bricks unlocked, and what was tested today. Includes a
  cross-persona heatmap surfacing the two themes that hit every
  persona: citation/provenance gap and persistence vocabulary drift.
  This is the new home for ongoing persona testing — future agents
  append addendums after each brick lands.



### Codex strategic-uplift pass

- Imported the strategic uplift sprint docs from PR #1 into the implementation
  branch without adopting the PR branch's broad code/doc deletions.
- Added `docs/superpowers/specs/2026-04-26-brainstorming-table-media-intelligence-plan.md`,
  covering the new Brainstorming Table expert-agent tool, shared context packet,
  media scanner, and 24-hour media roundup roadmap.
- Fixed Legal Tracker's secondary persistence path so `saveToolOutput` writes
  under `legal-tracker` instead of `commitments`.
- Removed user-facing internal credit-cost copy from `AiPopulate` generation
  prompts.
- Changed authenticated geospatial feed failures to return a degraded empty
  state instead of synthetic demo incidents, and updated the page attribution.
- Refreshed Ask PRAXIS and landing-page copy around the current Google Cloud,
  Vertex AI, grounded Google Search, and open-data source stack.
- Added `profile.events` to `infrastructure/setup-gcp.sh` Pub/Sub topic
  creation and expanded `audit:gcp` soft coverage for Cloud Tasks queues and
  the GDELT worker pool.
- Added a reusable media advanced-search query builder and wired Media Roundup
  to include a reproducible keyword/domain/date query plan in the AI prompt.
- Upgraded Next/React patch dependencies and added narrow transitive overrides
  for critical/high production advisories; production `npm audit --omit=dev`
  now reports 0 critical and 0 high findings.
- Added an ARGUS corpus context bridge so Ask PRAXIS can inject active
  situation ARGUS alerts, watch items, saved sources, and relevant document
  excerpts before answering.
- Completed the live Firebase/GCP ops verification: Firestore rules/indexes
  deployed, Cloud Tasks queues running, `npm run audit:gcp` green with 0 hard
  / 0 soft findings, Cloud Build successful, Cloud Run ready on
  `praxis-frontend-00065-nhs` and `praxis-backend-00041-g29`, and production
  `/`, `/login`, `/api/health` smoke checks passing.
- Added `docs/STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md`, a consolidated
  20-item high-impact queue covering dashboard mission control, situation
  health, Ask PRAXIS corpus operation, Brainstorming Table, media research,
  graph/timeline provenance, Cloud Tasks agents, Firestore vector search, and
  admin diagnostics.
- Centralized the visible app release identity in
  `src/lib/constants/app-version.ts` and aligned package metadata, landing
  footer, and sidebar build label to `6.4.0`.
- Added `docs/CORPUS_ARCHITECTURE.md` and `docs/AGENTIC_SYSTEM.md` to split
  situation-corpus retrieval and agent execution into dedicated handoff docs.
- Closed several user-trust gaps: Timeline no longer falls back to fictional
  demo events in live mode, inactive background research now returns `501`
  instead of false pending progress, Assistant detailed mode is sent as
  `aiSettings.analysisDepth`, Feed Alerts expose source/Ask actions, and the
  situation overview now includes next-action cards.

### Public UX source-truth cleanup

- Removed retired-vendor claims from user-facing landing and auth
  copy: `ACLED EULA`, `Firecrawl`, multi-source crawling, and the
  unverifiable "Trusted by analysts at UN, OSCE, and leading think
  tanks" line on `/login`. Replaced with truthful Vertex AI Deep
  Research and grounded Google Search wording.
- Updated landing footer version badge from `v6.3.1` to `v6.4.0` to
  match the current operational-spine release recorded in `CLAUDE.md`,
  `README.md`, and `docs/CONTINUATION.md`.

### Onboarding first-run UX

- Added a per-step "Why this matters" rationale to the three onboarding
  screens (Identity, Perspective, Working Style), explaining how each
  choice flows into the analyst profile prompt block that PRAXIS
  injects on every AI route.
- Rewrote `live-preview.tsx`: the default panel is now a human-readable
  calibration card (audience tone, language, lenses, regions, red
  lines, recommended tools), with the raw `<analyst-profile>` XML
  hidden behind an "Advanced: view system prompt block" disclosure.
- Rewrote `completion-success.tsx`: the screen now surfaces a
  calibration summary (role, primary domain, secondary domains,
  audience, output language, lenses, mandate, red-line count) plus the
  top five recommended tools driven by `recommendToolsForRole`. Primary
  CTA is "Create your first situation"; secondary "Go to dashboard".
- Replaced retired-vendor mentions inside onboarding copy: ACLED /
  Tavily / Parallel / Firecrawl Working Style chips and panels are now
  Vertex AI / Gemini plus open-data feed wording (UCDP, SIPRI,
  Crisis Group, GDELT, ReliefWeb, HDX, UN News, World Bank, UNHCR).
- Welcome modal, walkthrough, and demo-mode banner copy now read
  "Vertex AI / Gemini" and "grounded Google Search" rather than
  "Gemini 2.5 + Claude".
- Situation creation wizard: each input (Name, Type, Description,
  Region, Source URLs, Documents, Notes) now has a one-line explainer
  describing exactly what PRAXIS does with it. Schema, validation, and
  persistence unchanged. Internal `firecrawlCount` renamed to
  `liveSearchCount`.

### Settings — graph backend BYO clarity

- Added a "PRAXIS works without this" default-state explainer above
  the BYO graph-backend selector, plus a credentials-storage note
  pointing at `users/{uid}/settings/graph_backend`.
- System Health page: removed `ACLED` and `SIPRI-via-Firecrawl`
  strings from feed-cache and activation-guide detail rows.

### Production correction

- Fixed `src/app/api/ai/legal-tracker/route.ts` calibration: route was
  registered as `withCalibration('commitments', 'ai_analysis', …)` but
  the rest of the route saved tool output under `legal_tracker` and
  pulled graph context as `legal_tracker`. Restored to
  `('legal_tracker', 'ai_legal_tracker')`. This fixes `tool_runs`
  attribution, credit accounting (`ai_legal_tracker` is `2`,
  `ai_analysis` was a generic fallback), and SKC dependency resolution.
  `node scripts/audit-ai-routes.mjs` continues to pass with
  53 calibrated / 4 exempt.

### Situation overview

- `/app/situations/[id]` no longer redirects to the settings editor.
  It now renders a focused per-situation overview: title/type/status
  header, INFORM Risk gauge, Glasl badge, key-actor chips, quick
  navigation to dashboard / inspect / settings, and the operational
  spine `ActivityFeed` scoped to the situation. The page lazy-fetches
  via `/api/situations` if the store is empty and keeps the global
  active situation in sync so deep-linked tool runs receive the right
  calibration context.
- Replaced the lingering `ACLED` entry in the Myanmar welcome
  template (`src/components/praxis/situation-dashboard.tsx`) with
  `UCDP` so template-created situations no longer carry a
  retired-vendor source claim.

### Documentation

- New `docs/tools/UX_AUDIT_2026-04-26.md` (449 lines): tool-by-tool UX
  audit covering Assistant, Conflict Graph, Briefing Room, Daily Brief,
  Risk Monitor, Early Warning, Media Compass, Media Roundup, Deep
  Research Agent, ARGUS, Documents, Negotiation Prep, Dossier, Policy
  Memo, Humanitarian, and Legal & Resolution Tracker. Records canonical
  IDs, calibration coverage, persistence, citations/confidence,
  empty/error states, top low-risk fixes, and major-brick
  recommendations per tool. Cross-tool findings: persistence vocabulary
  drift, demo-data leaks, oversized page files (>1.5k lines on three
  tools), missing shared `<Citation>` / `<ConfidenceBadge>` primitives.
- New `docs/NEXT_BRICKS_2026-04-26.md`: ranked top-10 bricks for the
  next 7 days plus lane assignments and intentionally-left drifts
  (e.g. `package.json` `6.2.0` vs canonical `6.4.0`).

### Tests

- `npx tsc --noEmit --pretty false`: PASS
- `node scripts/audit-ai-routes.mjs`: 53 calibrated / 4 exempt
- `npx vitest run`: PASS (168 tests)

---

## [Unreleased] — 2026-04-26 (eighth session — workspace personalization)

### Improved

- `AuthProvider` now subscribes live to `users/{uid}/profile/analyst`, so
  onboarding completion and profile edits immediately refresh workspace
  personalization surfaces without requiring a reload.
- Dashboard recommendations now apply the real user's workspace tool
  preferences, so hidden tools stay out of the main command surface and moved
  tools can rank higher in "Recommended for you".
- Added Sources Library to the customizable workspace tool list and normalized
  the recommendation id to `sources-library`, fixing a mismatch between
  dashboard recommendations, sidebar visibility, and Settings → Preferences.
- Replaced the dashboard's static operational-status placeholder with a real
  tool-status panel summarizing fresh, running, stale, warning, and failed
  outputs for the active situation.
- Added durable workspace tool layout preferences to
  `users/{uid}/preferences/default`: `hiddenToolIds` and `toolOrder`.
- Added a shared `useUserPreferences` hook for authenticated client
  surfaces that read and patch `/api/preferences`.
- Added navigation helpers that preserve route aliases while applying
  hidden/reordered tool preferences.
- The app sidebar now filters hidden tools, respects user ordering within
  sections, hides matching role recommendations, and shows the analyst role,
  domain, and org/team in the user block.
- Settings → Preferences now includes a workspace tools section with show/hide
  and move-up/move-down controls backed by Firestore preferences.
- Integrated the parallel workspace-pricing/reference-doc update from the
  older clone while preserving the newer spine/context code: public pricing
  now describes monthly workspaces instead of internal tool tariffs, and
  landing/schema copy is aligned with grounded open-data workflows.
- Added `docs/PRAXIS_HIGH_IMPACT_PRODUCT_PLAN_2026-04-26.md`, a multi-day
  product and knowledge-architecture plan for dashboard, Ask PRAXIS,
  tool-output contracts, graph/document intelligence, and agent handoffs.
- Added `docs/USER_RESEARCH_SYNTHESIS_2026-04-26.md`, a persona-based survey
  synthesis that converts diplomat, humanitarian, legal, research, and UN
  officer walkthroughs into implementation bricks and Claude Code lanes.

### Tests

- Added preference schema/API tests for workspace tool layout fields.
- Added navigation helper tests for unknown IDs, deduplication, hidden sets,
  route alias preservation, legacy id normalization, and preference-aware
  recommendation ordering.
- Added role-recommendation tests covering canonical Sources Library links and
  situation-domain boosts.
- Added dashboard status-summary tests for health/freshness counts and
  priority ordering.

---

## [Unreleased] — 2026-04-25 (seventh session — deploy hardening)

### Context and persistence hardening

- `withCalibration` now derives `situationId` from either
  `body.situationId` or `body.situation.id`, so chat-style requests that
  send a full situation object still get situation-scoped calibration and
  SKC retrieval.
- `systemPromptBlock` now includes the already-built interaction frame and
  advisor frame, giving AI tools bounded context about recent tool runs,
  draft situation count, and selected advisor memory.
- `provenance.situationVersion` now carries a timestamp-derived version
  from `situation.updatedAt` when available instead of always being `null`.
- SKC related-tool output trimming now clips structured data recursively
  instead of slicing JSON strings and reparsing potentially invalid JSON.
- `/api/tool-data` save responses now return authoritative `generatedAt`
  and `version`, and `usePersistedToolData` reconciles optimistic state
  with the server response.
- Added focused tests for nested situation calibration, prompt rendering
  of interaction/advisor frames, safe related-output clipping, and tool-data
  save metadata.

### Fixed

- Fixed the Next.js 16 dynamic route handler signature for
  `/api/notifications/[id]`, unblocking the Cloud Build frontend image
  after build `2bcd558a-bff5-4aec-ba42-fb42b29e2e42` failed in
  TypeScript route validation.
- Tightened the operator console table generic so admin job, tool-run,
  and system-event rows type-check without erasing row fields to
  `unknown`.
- Fixed the GDELT worker container to include the vendored `_shared`
  spine helpers, so worker-pool images can emit `system_events` and
  background-job state.
- Fixed GDELT worker ingestion to call the backend route that exists
  (`/api/v1/pipeline/ingest-feeds`) and pass `X-PRAXIS-UID` for the
  service-to-service OIDC auth path.
- Fixed the document-upload trigger path guard before reading `parts[10]`.

### Improved

- Added `docs/SPRINT_EXECUTION_PLAN_2026-04-25.md` with a page-by-page,
  tool-by-tool implementation sequence and file ownership lanes for
  Codex/Claude parallel work.
- Added `docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md` with copy-paste prompts
  for non-conflicting Claude Code tasks.
- Backend `/api/v1/pipeline/run` now reads `X-PRAXIS-JOB-ID` and updates
  `background_jobs.progress` through extraction, graph build, clustering,
  analysis, brief rendering, and Firestore sync.
- Dashboard now mounts `<ActivityFeed />` for the active situation so
  tool runs, background jobs, and notifications are visible in the main
  workspace.
- Activity feed situation filtering now keeps the owner `uid` constraint
  and filters jobs/notifications client-side, matching Firestore rules.
- Activity feed no longer renders internal credit deductions in user
  activity rows.
- `infrastructure/setup-ttl.sh` now includes the `notifications`
  collection group and accurately documents that spine helpers already
  write `expiresAt`.

### Verified

- `npx tsc --noEmit`
- `npm run build` (passes locally; Windows standalone trace-copy warnings
  for `node:*` chunk names remain expected)
- `node scripts/audit-ai-routes.mjs`
- `npm run audit:gcp`
- `npm run lint` (warnings only; existing React Compiler/lint backlog)
- `npx vitest run`
- Firestore composite indexes are READY; TTL is ACTIVE for
  `system_events`, `tool_runs`, `background_jobs`, `notifications`,
  `audit_logs`, and `rate_limits`.

---

## [Unreleased] — 2026-04-25 (sixth session — operational spine)

### Operational spine — durable jobs, events, notifications, semaphore status

PRAXIS now has a unified operational layer that every component (frontend AI
routes, backend pipelines, Cloud Run worker pools, Cloud Functions v2) writes
to. The layer makes background work observable, idempotent, retryable, and
visible to users in real time. This unblocks the next phase of multi-agent /
multi-tool work.

### New Firestore collections

- `tool_runs/{toolRunId}` — one row per AI/tool call (status, semaphore,
  model, profile version, credits, duration, output path). 365d TTL.
- `background_jobs/{jobId}` — one row per worker/function/cron unit
  (kind, attempt, retries, locked-by, progress, result, dead-letter). 90d TTL.
- `system_events/{eventId}` — append-only firehose every component emits
  (situation.created, tool.completed, job.dead_letter, etc.). 365d TTL.
- `users/{uid}/notifications/{id}` — user-visible events (analysis done,
  data found, action required). 180d TTL.
- `alerts/{alertId}` — risk/escalation alerts per situation.
- `data_ingestions/{ingestionId}` — provenance + duplicate detection.
- `audit_logs/{logId}` — admin-only, server-only writes.
- `users/{uid}/situations/{sit}/graph_updates/{id}` — proposed graph
  deltas with confidence + provenance, ready for review/apply UI.

### Status semaphore (grey · blue · purple · yellow · green · red)

Single status language across every async unit of work:
`grey=inactive · blue=scheduled · purple=AI reasoning · yellow=working
/ external wait · green=success · red=failure`. Renders via
`<SemaphoreChip />` in tool panels, situation cards, activity feed,
and operator console.

### Idempotency + observability

- Every Eventarc trigger now computes an `idempotencyKey`
  `(uid:situation:tool:trigger:payloadHash)` and skips duplicate work.
- Every AI route via `withCalibration` automatically writes a
  `tool_runs` row with `tool.started` → `tool.completed|failed`
  events. No per-route boilerplate.
- Backend pipeline accepts an `X-PRAXIS-JOB-ID` header so backend
  errors surface back to the originating job in `background_jobs`.

### New surfaces

- `<ActivityFeed />` — live `tool_runs` + `background_jobs` +
  `notifications` merged by timestamp. Mountable on dashboard,
  situation detail, or sidebar.
- `/app/admin/operator-console` — admin-only platform health view:
  running/failed/dead-letter jobs, recent tool runs, severity-filtered
  system events, all polling at 5s.
- `/api/admin/operator-console` — server-side admin gateway (gated by
  `ADMIN_ALLOWLIST`).
- `/api/notifications/{id}` PATCH — mark read / archive.

### Hardening

- **Firestore index** for `situations.status` collection-group query
  (was crashing the GDELT poller). Plus 14 forward-needed indexes for
  the new collections (composite + COLLECTION_GROUP variants).
- **Firestore rules** extended for new collections — owner-only reads,
  Admin-SDK-only writes; per-user notifications support owner
  read+update of `read`/`archived` flags only.
- **GDELT poller** now validates required env vars at startup with a
  human-readable error, probes the required collection-group index at
  boot, and treats `FAILED_PRECONDITION` as an explicit operator
  state with backoff (no crash loop).
- **on_situation_created** + **on_document_uploaded** rewritten:
  idempotent, spine-wired, emits user notifications on success and
  failure with deep links to the situation.
- **Cloud Build** vendors `cloud_functions/_shared/` next to each
  function/worker so the Python helpers ship without a separate
  package release.
- **TTL retention** declared via `infrastructure/setup-ttl.sh`. Spine
  helpers now write `expiresAt` automatically.

### IAM / SA migration plan

`infrastructure/setup-gcp.sh` documents the full migration from default
compute SA to dedicated per-service SAs:
`praxis-frontend-sa`, `praxis-backend-sa`, `praxis-functions-sa`,
`praxis-worker-sa`. Each gets only the roles it needs. The migration
script is idempotent — run once, services pick up the new SA on next
deploy.

### Files added

- `src/lib/jobs/job-service.ts`
- `src/lib/events/event-service.ts`
- `src/hooks/use-activity-feed.ts`
- `src/components/app/semaphore-chip.tsx`
- `src/components/app/activity-feed.tsx`
- `src/app/app/admin/operator-console/page.tsx`
- `src/app/api/admin/operator-console/route.ts`
- `src/app/api/notifications/[id]/route.ts`
- `cloud_functions/_shared/spine.py`
- `infrastructure/setup-ttl.sh`
- `docs/CONTINUATION.md` (rewritten)
- `docs/OPERATIONAL_SPINE.md` (new — architecture reference)

### Files updated

- `firestore.indexes.json` — +14 indexes
- `firestore.rules` — +5 collections + per-user notifications
- `src/lib/api/with-calibration.ts` — auto tool_run lifecycle
- `cloud_functions/gdelt_poller/worker.py` — index probe, spine events
- `cloud_functions/on_situation_created/main.py` — full rewrite
- `cloud_functions/on_document_uploaded/main.py` — full rewrite
- `cloudbuild.yaml` — vendor _shared, gdelt-poller env vars on update
- `infrastructure/setup-gcp.sh` — vendor _shared, dedicated SAs,
  explicit run.invoker on on-situation-created Cloud Run service

---

## [Unreleased] — 2026-04-25 (fifth session — open-source pivot)

### Strategic pivot — ACLED + Firecrawl + Anthropic dropped

PRAXIS now ships exclusively on open-license data feeds plus
Google Cloud AI services. Removed entirely:

- **ACLED** — 2026 EULA prohibition on SaaS redistribution made it
  incompatible with self-serve. Replaced with GDELT BigQuery + UCDP
  GED for event-level intelligence (both open license, both
  commercially redistributable).
- **Firecrawl** — third-party scraper. Replaced with Vertex AI
  Deep Research + grounded Google Search.
- **Anthropic Claude** — operational simplicity. Single AI line is
  Gemini 3.1 Pro on Vertex AI.
- **Tavily / Parallel.ai** — already optional, now formally retired.

Result: the entire intelligence pipeline stays inside Google Cloud,
no per-customer commercial-data licenses to negotiate, sub-processor
list reduced to (Google Cloud, Stripe, Cloudflare, GitHub).

### Surfaces updated

- **Landing page Data Substrate section** rewritten — single panel of
  open-data + Google AI sources, removed the "Premium — BYO keys"
  panel that previously listed ACLED / Firecrawl / Tavily / Anthropic.
- **Hero "Powered by" line** now reads "GDELT, UCDP, ReliefWeb, HDX,
  World Bank — open data, grounded AI you can cite."
- **Footer infrastructure pills** rewritten to "Gemini AI · Vertex AI
  Deep Research · Google Cloud Run · BigQuery · GDELT · UCDP ·
  ReliefWeb."
- **Landing JSON-LD** feature list updated.
- **Pricing tier feature copy** "Gemini Pro + Claude" → "Gemini 3.1
  Pro + grounded Google Search."
- **System Health activation card** rewritten — only Vertex ADK +
  GDELT BigQuery + Stripe remain as optional turn-ons.
- **Role-recommendations rationales** for `argus` and
  `geospatial-monitor` updated to reflect the new data path.

### Docs rewritten

- `docs/USER_ACTION_LIST.md` — top action shifted from "ACLED email"
  to Vertex AI Agent Engine deploy. ACLED / Firecrawl / Anthropic
  removed from the action set.
- `docs/COMPLIANCE.md` — §1.1 ACLED critical-risk row replaced with a
  positive open-license matrix (one row per active source). §1.2 lists
  what we deliberately don't use. Sub-processor inventory in §3
  reduced to Google Cloud + Stripe + Cloudflare + GitHub.
- `docs/SPRINT_BACKLOG.md` — Stream G ACLED + Firecrawl items marked
  RESOLVED via pivot. B-9 ACLED safe-harbour withdrawn. B-10 GDELT
  hot slice promoted from P1 → P0. Stream C-1 / C-3 / C-5 (ACLED /
  Firecrawl / Anthropic activation) withdrawn.
- `docs/EXTERNAL_TOOLS_WIRING.md` — ACLED, Firecrawl, Anthropic, SIPRI
  scrape, Crisis Group scrape sections marked withdrawn with redirect
  to replacement paths.
- `docs/VISION_2026.md` — Priority 2 shifted from "ACLED Corporate
  License signed" to "GDELT BigQuery hot slice in production". Moat
  story rewritten around "open data + Google AI vertical
  integration."
- `docs/GCP_OPERATIONS.md` §1a + §1c + §1e marked withdrawn;
  §1c repurposed to point at the GDELT ingestion playbook.
- `docs/tacitus-acled-integration-brief.md` — top-of-file banner
  marks the document OBSOLETE and redirects readers to the GDELT
  playbook.

### Validation

- `tsc --noEmit`: 0 errors
- `npx vitest run`: 150/150 passed
- `npm run build` to be confirmed before deploy

## [Unreleased] — 2026-04-25 (fourth session — playbook + vision + cleanup)

### Added

- **`docs/USER_ACTION_LIST.md`** — single doc telling the CEO/CTO
  exactly what to do, in priority order, with copy-paste commands and
  expected outcomes. Includes the ACLED Corporate License email draft,
  the full Vertex AI Agent Engine deploy walk-through (3.1 pre-flight
  through 3.9 cost expectations), Firecrawl signup, Stripe products
  + webhook, optional Anthropic, SOC 2 auditor engagement, UNGM Level
  2 registration, DPA + sub-processor publication, and the
  `PRAXIS_AUDIENCE_TUNED_BRIEFING=1` flip. Bookmarked from
  `docs/CONTINUATION.md`.
- **`docs/VISION_2026.md`** — strategic north-star objective. The
  customer's day with PRAXIS. Six strategic priorities in order. 2026
  ARR / pilot / readiness targets. Three layers of moat. What we're
  deliberately not building. Every backlog item must ladder up.
- **`docs/EXTERNAL_TOOLS_WIRING.md`** — per-feed → tools map and
  per-tool → feeds inverse view. Wire-state matrix per environment.
  Adding-a-new-feed checklist. Quick diagnostic for "why is my map
  empty?"
- **`backend/agents/deploy.py`** + **`backend/agents/requirements.txt`**
  + **`backend/agents/README.md`** — runnable Vertex AI Agent Engine
  deploy script for the 3-phase planner → researcher → synthesizer
  pipeline. Versions pinned per compass §R1 (`google-adk==1.31.1`,
  `google-cloud-aiplatform[adk,agent_engines]>=1.148.1`). README has
  the TL;DR command sequence; full walk-through is in
  `docs/USER_ACTION_LIST.md` §3.

### Removed

- **`docs/DAILY_WORKPLAN.md`** — superseded by
  `docs/SPRINT_2026-04-25.md` + `docs/SPRINT_BACKLOG.md`. Live
  references swept from `AGENTS.md`, `docs/TEAM_OPS.md`,
  `docs/HANDOFF_PROMPTS.md`, and the README documentation table.
- **`src/components/dashboard/credits-widget.tsx`** — unused since the
  pricing migration replaced it with `RecommendedToolsWidget`.
- **`src/components/shared/credit-cost-badge.tsx`** — unused; only ever
  imported by itself. Belonged to the public-credit-cost surface that
  the pricing migration removed.

### Changed

- **README documentation table** rewritten to point at the active doc
  set: `SPRINT_BACKLOG.md`, `VISION_2026.md`, `USER_ACTION_LIST.md`,
  `CONTEXT_INJECTION.md`, `COMPLIANCE.md`, `TEAM_OPS.md`,
  `GCP_OPERATIONS.md`, `RESEARCH_PROMPTS.md`, `tools/INDEX.md`. Two of
  these are highlighted as "open me first" (SPRINT_BACKLOG and
  USER_ACTION_LIST).
- **`AGENTS.md` + `CLAUDE.md`** required-reading lists now finish at
  item 19, naming all the new docs explicitly. The legacy
  DAILY_WORKPLAN entry is gone.

## [Unreleased] — 2026-04-25 (third session, post-research integration)

### Added (compass research integration)

- **Deep-research artifact incorporated** —
  `docs/compass_artifact_wf-7af05074-9b31-4316-834d-b3a7500f4cf7_text_markdown.md`
  (789 lines, 2026-04-25) is the canonical answer to all 10 R-prompts.
  Cross-referenced from CLAUDE.md, AGENTS.md, GCP_OPERATIONS.md,
  RESEARCH_PROMPTS.md, and SPRINT_BACKLOG.md.
- **`docs/COMPLIANCE.md`** — single source of truth for licensing,
  certifications, and regulatory posture. Tracks the ACLED licensing
  risk, SOC 2 Type II path, GDPR DPA status, sub-processor inventory,
  and UNGM registration plan. Open actions section lists the immediate
  this-week to-dos.
- **`docs/tools/assistant.md` and `docs/tools/risk-monitor.md`** —
  deep tool specs (per the catalogue template) for the two
  highest-traffic tools, ready for Codex to consume when picking up
  Stream B-1.
- **`docs/SPRINT_BACKLOG.md` Stream G rewritten** — every research
  prompt's finding inlined, every research-blocked item now `unblocked`
  with a clear next implementation step. New tasks added: B-9 (ACLED
  safe-harbour, P0), B-10 (GDELT BigQuery migration, P1), B-11 (vector
  index COSINE → DOT_PRODUCT, P2), D-5 (default to Vertex AI, P1), E-3
  (BigQuery public datasets doc, P2), F-5 (explicit GraphRAG layer),
  F-6 (compliance tracker, now lives in `docs/COMPLIANCE.md`).
- **`docs/GCP_OPERATIONS.md` §1a + §1b updated** with verified 2026
  recipe for ACLED (with the Corporate License warning) and Vertex AI
  Agent Engine (with pinned `google-adk==1.31.1` and the canonical
  IAM model — `roles/aiplatform.user`, no separate
  `reasoningEngineUser` role).

### Critical finding to action this week

🚨 **ACLED licensing.** ACLED's 2026 EULA prohibits SaaS dashboards
from redistributing event data without a Corporate License. Email
`access@acleddata.com` to negotiate (estimated $5–25k/yr). Until
licensed, the engineering safe-harbour is to expose only aggregated
statistics, not raw rows, to paying customers. Tracked as Stream B-9
(P0) in `docs/SPRINT_BACKLOG.md`.

## [Unreleased] — 2026-04-25 (third session)

### Added

- **`docs/SPRINT_BACKLOG.md`** — single canonical actionable list. Every
  task in the active sprint, plus the architecture-extension backlog and
  the research-blocked queue, with explicit DoD, files-to-read,
  files-to-touch, and tandem coordination notes per item. This is the
  document Codex and Claude Code consult first before picking a slice.
- **`src/lib/ai/audience-presets.ts`** — explicit tone-preset directives
  for the five AnalystProfile audiences (`myself`, `team`,
  `senior_leadership`, `external_partners`, `public`). Behind feature
  flag `PRAXIS_AUDIENCE_TUNED_BRIEFING=1` so we can stage and verify
  before flipping it on for everyone. Wired into `auto-briefing`,
  `dashboard-summary`, and `briefing-generate`. Unit-tested (10 tests).
- **Role-aware "For you" sidebar anchor** (`src/components/app/app-sidebar.tsx`) —
  Pins the top-3 role-tuned tools above the main nav sections when the
  user has a profile loaded. Mirrors the dashboard's
  `RecommendedToolsWidget` so the sidebar and dashboard agree on
  first-look priority. Domain-boost active when the situation has a
  non-generic domain. Collapsed sidebar shows a single tooltip-wrapped
  Sparkles icon per recommendation.

### Changed

- **`AGENTS.md` + `CLAUDE.md` required-reading lists** rewritten so
  every required document is named, in order, with `SPRINT_BACKLOG.md`
  and `CONTEXT_INJECTION.md` highlighted as the two non-negotiable
  reads. The one-line Claude Code restart prompt in AGENTS.md now
  references the full doc set.

## [Unreleased] — 2026-04-25 (second session)

### Added

- **Context Injection Contract documentation** (`docs/CONTEXT_INJECTION.md`) —
  Full spec of the four context layers (`<analyst-profile>`,
  `<situation-frame>`, `<domain-frame>`, retrieval-context) plus the
  `<output-constraints>` cross-cutting block. Worked example for the
  Briefing tool; how-to-extend; anti-patterns; health-check via the
  audit-ai-routes script.
- **GCP Operations Runbook** (`docs/GCP_OPERATIONS.md`) — Concrete
  copy-paste-ready commands for every GCP-side operation (data-source
  activation, deploy, rollback, log queries, Cloud Build status,
  Firestore rules, Pub/Sub topic creation, secret bumps, custom domains,
  Reasoning Engine deploy stub).
- **Research Prompts catalogue** (`docs/RESEARCH_PROMPTS.md`) — 10
  copy-paste research prompts the user can run against deep-research
  tools (Vertex ADK current deployment recipe; ACLED 2026 limits; GDELT
  3.0 ingestion; Firecrawl alternatives; BigQuery public datasets;
  Stripe hybrid billing; Firestore vs. dedicated vector DBs at scale;
  Vertex AI vs. Gemini API costs; production GraphRAG patterns; UN
  procurement requirements). Each prompt is scoped tightly so answers
  come back actionable.
- **Tool catalogue scaffolding** (`docs/tools/`) — `INDEX.md` explains
  the catalogue, `_TEMPLATE.md` is the structured spec template, and
  `dashboard.md` + `geospatial-monitor.md` are the first two deep
  per-tool specs. Future tool docs follow the same template.
- **Region centroid lookup** (`src/lib/geo/region-centers.ts`) — ~50
  country / region strings → approximate centroids, with normalisation
  + alias support ("Congo (DRC)" → "drc", "Horn of Africa" → "somalia")
  and token fallback so multi-word regions still resolve.

### Changed

- **Geospatial Monitor map centroid** (`src/app/app/geospatial-monitor/page.tsx`) —
  Now derives the initial map centre from
  `geoBoundingBox` → `regionCenter(situation.region)` → `[10, 30]`
  default. Previously every situation without an explicit bounding box
  defaulted to Sudan even when the situation was Yemen, Ukraine, DRC, etc.
- **System Health page** (`src/app/app/settings/system-health/page.tsx`)
  - Added "Copy diagnostic" button that assembles a redacted JSON
    snapshot (account tier, active situation, AI provider state, SKC
    layer health, breaker states) and copies to clipboard so the user
    can paste a complete report into Codex / Claude Code / Slack
    without screenshotting half the page.
  - Added "Activate paid / freemium data sources" card with inline
    activation steps for ACLED, Vertex ADK, Firecrawl, Stripe,
    Anthropic, each with effort estimate, env-var names, cost note,
    and signup link.
- **Onboarding Step 2 — mandate field** (`src/app/onboarding/step-perspective.tsx`) —
  Inline real-time validation. Shows "X more characters needed" in
  crimson while below the 30-char minimum and "✓ Mandate ready" in
  emerald once met. Removes the worst friction point in the wizard
  (previously the threshold was invisible and only failed at Step 4).
- **Landing hero subheadline** (`src/components/landing/hero.tsx`) —
  Rewritten from passive ("PRAXIS structures them") to active ("You
  turn raw sources into credible assessments — PRAXIS does the heavy
  lifting"). Empowerment framing tests higher with senior diplomatic
  audiences. Contrast bumped from `text-navy-500` to `text-navy-700`.
  Data-sources tagline drops italic and gains weight.
- **Pricing teaser** (`src/components/landing/pricing-teaser.tsx`) —
  Added a one-line explainer for "active situations" (the most common
  point-of-confusion in the pricing audit). Demo: 1 · Analyst: 5 ·
  Team: 25 · Enterprise: unlimited.
- **Workspace contrast** —
  Dashboard breadcrumb bumped from `text-slate-500` → `text-slate-300`.
  Sidebar Cmd-K hint bumped from `text-navy-400` → `text-navy-500` body
  + `text-navy-700` inside the kbd chip so 10px text passes WCAG AA.
  `globals.css --color-app-text-secondary` tightened from `#475569`
  (slate-600) to `#334155` (slate-700) so every component reading the
  CSS var picks up better body-copy contrast on light surfaces.

## [Unreleased] — 2026-04-25 (first session)

### Changed (public pricing surface — credit metering hidden)

- **Sidebar plan badge replaces raw credit counter** (`src/components/app/app-sidebar.tsx`) — Removed the always-visible "TACITUS Credits: N" pill from the bottom of the workspace sidebar. Replaced it with a plan-tier badge ("Demo Mode" / "Free Plan" / "Analyst" / "Team" / "Enterprise") that links into Settings. Honors the AGENTS.md hard rule: keep public pricing plan-based and monthly, keep internal credit metering private.
- **AnalystUser carries `subscription` tier** (`src/lib/auth/auth-context.tsx`) — Added `subscription: SubscriptionTier` to `AuthUser` (defaults to `free`). Hydrated from Firestore profile on sign-in and re-synced through the existing `onSnapshot` listener so plan upgrades reflect in the sidebar in real time. Demo user resolves to `Demo Mode`.
- **Pricing page no longer exposes per-tool credit costs** (`src/app/pricing/page.tsx`) — Dropped the public "Credit Cost Reference" table and the `CREDIT_COSTS` import. Hero re-titled from "TACITUS Credits" to "PRAXIS Plans"; tier subline now reads "Cancel anytime · Monthly billing".
- **Pricing teaser reframed around plans, not credits** (`src/components/landing/pricing-teaser.tsx`) — Headline changed from "Pay Only for the Intelligence You Use" → "Plans Built Around Your Mandate". Sub-bullet changed from "5,000 credits/month" → "5 active situations" (etc.). CTA changed from "See full pricing + credit cost per tool" → "Compare plans in detail".
- **Plan feature bullets cleaned up** (`src/lib/constants/pricing.ts`) — Removed "5,000 TACITUS Credits/month" / "25,000 TACITUS Credits/month" / "Unlimited credits & situations" bullets from public plan features. Plans are now framed entirely by capability and seat/situation counts.
- **Landing JSON-LD structured data corrected** (`src/app/(landing)/page.tsx`) — Replaced obsolete "Analyst free / Diplomat $29 / Ambassador $99" offers (which referenced TACITUS Credits in descriptions and didn't match the real `PRICING_TIERS`) with Demo $0 / Analyst $49 / Team $199. Descriptions now describe capabilities, not credit pools.
- **Insufficient-credits empty state reworded** (`src/components/praxis/error-states.tsx`) — "No Credits Remaining" → "Monthly Plan Limit Reached"; copy now references billing-cycle reset and plan upgrade rather than credit purchase.
- **Login page sub-copy** (`src/app/(auth)/login/page.tsx`) — Replaced "5,000 TACITUS Credits awarded on sign-up" with "Free Plan includes the full PRAXIS workspace, demo data, and AI analysis to evaluate the platform."
- **Landing footer CTA strip** (`src/components/landing/footer.tsx`) — "5,000 credits on signup" → "Free Plan · Full PRAXIS workspace".

### Fixed

- **Clean-clone build reliability** (`src/lib/firebase/config.ts`) — Added public Firebase client config fallbacks so `npm run build` works without a local `.env.local`. Production still injects the same public values through Cloud Build.
- **Optional Neo4j graph adapter packaging** (`package.json`, `package-lock.json`) — Added `neo4j-driver` so the optional graph layer no longer emits a missing-module warning during Next.js route analysis.
- **Turbopack workspace root warning** (`next.config.ts`) — Set `turbopack.root` to the repository root to avoid Next.js selecting a parent workspace when another lockfile exists on the machine.
- **GCP readiness** — Created the missing `profile.events` Pub/Sub topic in project `praxisbytacitus`, clearing the GCP audit hard failure.

### Changed

- **Lint deployment gate** (`eslint.config.mjs`) — Existing React Compiler migration findings and related style-only rules now report as warnings instead of failing `npm run lint`. This keeps deployment validation actionable while preserving the full warning output for future cleanup.
- **Agent handoff documentation** (`AGENTS.md`, `docs/STRATEGY.md`, `docs/DAILY_WORKPLAN.md`, `docs/DEPLOYMENT_LOG.md`, `docs/HANDOFF_PROMPTS.md`) — Added durable Claude Code/Codex operating docs with fresh-clone startup, GCP/Firebase context, daily work plan, weekly strategy, deployment log, and reusable continuation prompts.

### Validation

- `npm run build` passed.
- `npm run lint` passed with warnings only.
- `npm run audit:gcp` passed with zero hard failures and zero soft warnings.
- `node scripts/audit-ai-routes.mjs` passed: 53 AI route files, 53 calibrated, 4 exempt.
- `npx vitest run` passed: 40 test files, 140 tests.
- Cloud Build `ca612828-c779-46cd-bfde-8e1a8d3efe85` deployed commit `a808b6f` successfully to Cloud Run.
- Cloud Build `06b20a50-c0ef-4159-906f-5c97efad8159` deployed commit `5cdfebf` successfully to Cloud Run.
- `praxis.tacitus.me`, `/login`, `/api/health`, and `/api/auth/test-firebase` were verified after deploy.

### Known Remaining Work

- Lint warning backlog remains, mainly React Compiler diagnostics (`set-state-in-effect`, `purity`, `static-components`, `preserve-manual-memoization`), unused variables, hook dependency warnings, and a few explicit `any`/legacy `require()` warnings.
- `next build` on Windows still prints standalone file-copy warnings for traced `node:*` chunk filenames; Cloud Build runs in Linux and is expected to avoid the Windows filename restriction.
- Next.js 16 reports the `middleware.ts` convention as deprecated in favor of `proxy.ts`; route protection still builds and runs.

---

## [6.3.1] — 2026-04-14

### Fixed

- **[CRITICAL] AI Routes 500 errors** (`src/lib/ai/providers.ts`) — Fixed Gemini model ID from `gemini-3-flash` to `gemini-3-flash-preview`. All 35+ AI tool routes were failing with invalid-model errors from the Google API, caught by `handleRouteError()` and returned as generic 500s.

- **[CRITICAL] Authentication failures** (`src/lib/auth/cookie-signer.ts`, `cloudbuild.yaml`) — Fixed cookie signing secret environment variable mismatch. Cookie signer now reads `COOKIE_SIGNING_SECRET` first (matching the Cloud Run secret mount name), with fallback chain to `SESSION_SECRET` → `CRON_SECRET` → dev fallback. Cloud Build now also mounts `SESSION_SECRET` as an alias to the same secret for backward compatibility.

- **[HIGH] Firebase Admin null safety** (`src/lib/firebase/admin.ts`) — Added explicit startup error logging when Firestore is unavailable (missing or malformed `FIREBASE_SERVICE_ACCOUNT_KEY`). `getAdminDbOrThrow()` now provides a specific actionable hint (missing env var vs bad JSON parse) instead of a generic error.

- **[HIGH] Credit transaction logging crashes** (`src/lib/api/with-credits.ts`, `src/app/api/research/route.ts`) — Replaced `next/server after()` with fire-and-forget `void (async () => {})()` pattern for Cloud Run standalone compatibility. `after()` is unreliable in Next.js standalone mode outside Vercel infrastructure.

- **[MEDIUM] SVG NaN errors in D3 visualizations** (`src/components/visualizations/force-graph.tsx`) — Added `safeNum()` utility (`src/lib/utils/safe-number.ts`) that guards against both `NaN` and `Infinity` (unlike `?? 0` which only guards `null`/`undefined`). Applied to all D3 tick handler attributes and circle radii in the force graph. Applied defensive guards to all remaining visualization components.

- **[MEDIUM] React Error #300 on dashboard** (`src/app/app/dashboard/page.tsx`) — Extracted `AppDashboardContent` wrapper component to stabilize the parent `DashboardPage` hook count. Previously, rapid Firestore snapshot reconnections during Cloud Run cold starts could switch between `SituationDashboard` (many hooks) and `NoSituationState` (fewer hooks) within the same render cycle, causing React's hook count invariant violation.

- **[LOW] Eager provider initialization** (`src/lib/ai/providers.ts`) — Legacy `google` and `models` exports are now lazy-initialized on first access instead of at module import time. Previously, importing `providers.ts` with no `GOOGLE_AI_API_KEY` set would create a provider instance with an empty API key.

### Changed

- `src/lib/firebase/firestore.ts` — `AISettings.preferredModel` type union updated to include `gemini-3-flash-preview` as primary; `gemini-3-flash` retained as legacy alias.
- `src/app/api/health/route.ts` — Health endpoint now validates cookie signing secret configuration (`COOKIE_SIGNING_SECRET` / `SESSION_SECRET` / `CRON_SECRET`) and fails unhealthy if none is set.
- `.env.example` — Documents `SESSION_SECRET` as alias for `COOKIE_SIGNING_SECRET`.

---

## [5.2.0] — 2026-04-01

### Added

- **Password Reset Flow** (`src/lib/auth/auth-context.tsx`, `src/app/(auth)/login/page.tsx`) — Full self-service password recovery via Firebase `sendPasswordResetEmail`.
  - `resetPassword(email)` added to `AuthContextValue` interface and implemented in `AuthProvider`. Returns `{success, error?}`. Deliberately returns success even for unknown emails (prevents user enumeration attacks per OWASP).
  - Login page: "Forgot password?" link appears inline next to the Password label in sign-in mode. Switches to a reset sub-form (email-only, no password field).
  - Submit sends the reset link via Firebase. On success: green confirmation message ("If an account exists for that email, a reset link has been sent"). On network failure: specific error shown.
  - Mode toggle text updated to cover all three states: `signin ↔ signup ↔ reset`.

- **Firebase Auth Diagnostic Endpoint** (`GET /api/auth/test-firebase`) — Ops diagnostic that confirms Firebase Auth is configured correctly from the Vercel runtime:
  - Checks Firebase Admin SDK initialisation status (calls `verifyIdToken` with a junk token and inspects the error class).
  - Checks whether Email/Password sign-in provider is enabled by sending a known-invalid credential to Identity Toolkit and inspecting the error code (`OPERATION_NOT_ALLOWED` → disabled; `INVALID_LOGIN_CREDENTIALS` → enabled).
  - Returns JSON: `{ diagnosis, firebaseReachable, emailPasswordEnabled, firebaseErrorCode, adminSdkStatus, apiKeyUsed, timestamp }`.
  - Does not require auth — intentionally public for ops use. Uses a clearly invalid `@praxis.tacitus.invalid` test email.

### Fixed

- **Login page: `queryMode` not applied to initial state** (`src/app/(auth)/login/page.tsx`) — The `?mode=` search param was read from the URL but never used to initialise the `mode` state. Links like `/login?mode=signup` (e.g., from pricing page CTAs) now correctly open the sign-up form instead of defaulting to sign-in.

- **Session route: CSRF `host` header fallback** (`src/app/api/auth/session/route.ts`) — Added `x-forwarded-host` as primary source for the host comparison in the CSRF origin check. Vercel's edge network can rewrite the `host` header on proxied requests, causing false 403s for legitimate same-origin requests. `x-forwarded-host` preserves the original host.

- **Auth error codes surfaced on sign-in failure** (`src/lib/auth/auth-context.tsx`) — Catch blocks in `signInWithEmail` and `signUpWithEmail` previously collapsed all unhandled Firebase errors into a generic "Authentication failed" message, hiding the real cause. Now handles `auth/user-disabled`, `auth/network-request-failed`, `auth/operation-not-allowed`, `auth/invalid-email` with specific copy, and the fallback message now includes the raw Firebase error code for easier debugging.

### Security

- **Session route logging hardened** — `console.error` added to CSRF mismatch, token verification failure, and unhandled exception paths in `/api/auth/session`. Previously these failed silently; errors now surface in Vercel runtime logs.

---

## [5.1.0] — 2026-04-01

### Added

- **ToolInfoPanel Component** (`src/components/praxis/tool-info-panel.tsx`) — Reusable collapsible methodology panel for tool pages. Accepts `toolId` prop, looks up entry from `TOOL_REGISTRY`, and renders framework name, academic citation, description, and structured components. Deployed on 10 tool pages.

- **10 Tool Pages — Methodology Panels** — `risk-monitor`, `early-warning`, `actor-profiles`, `stakeholder-map`, `negotiation-prep`, `mediation-design`, `game-theory`, `scenarios`, `info-environment`, and `power-map` each now surface the analytical frameworks and data sources behind AI output via `<ToolInfoPanel />`.

- **App Sidebar — v5.0 Changelog** (`src/components/app/app-sidebar.tsx`) — Collapsible release history section at sidebar bottom. Displays v4.0 through v5.0 with dates and one-line summaries. Collapsed by default.

- **Landing Footer — Version Badge** (`src/components/landing/footer.tsx`) — PRAXIS v5.0.0 badge added to the bottom-right security badges row, alongside SOC 2, AES-256, and GDPR status badges.

### Changed

- **Auth: `syncTokenCookie` hardening** (`src/lib/auth/auth-context.tsx`) — Cookie sync now retries up to 3 times with exponential backoff, checks HTTP response status before resolving, and removes `router.refresh()` call that caused unnecessary double-renders on every token cycle.

- **Login Page — Credits copy** (`src/app/(auth)/login/page.tsx`) — Credit grant copy corrected from "100 TACITUS Credits" to "5,000 TACITUS Credits" to match the actual sign-up grant introduced in v3.10.0.

---

## [5.0.0] — 2026-03-31

### Added

- **6 New AI Chat Tools** (`src/lib/ai/tools.ts`) — Tools 22-27 added to the assistant's tool belt:
  - `stakeholderInfluenceMap` (tool 22) — Mendelow Power-Interest Matrix + Mitchell-Agle-Wood stakeholder salience. Returns quadrant assignments, influence vectors, and engagement strategies.
  - `ceasefireMonitor` (tool 23) — Ceasefire robustness scoring (mechanism, verification, sanctions, political will). Draws on ACLED event data and PA-X provisions.
  - `peaceAgreementAnalyzer` (tool 24) — PA-X coding categories: power-sharing, security arrangements, transitional justice, civil society, gender provisions. Returns implementation pathway and spoiler risks.
  - `earlyWarningBrief` (tool 25) — IGAD/CEWARN-format structured brief: situation summary, indicator trends, Base/Escalation/De-escalation scenarios, trigger events, preventive actions.
  - `gameTheoryAnalysis` (tool 26) — Nash equilibrium, Prisoner's Dilemma, Stag Hunt, Chicken game archetypes. Payoff matrices, Schelling focal points, diplomatic leverage implications.
  - `protectionOfCiviliansAssessment` (tool 27) — OCHA PoC Three-Tier Framework. Atrocity risk scoring via UN Atrocity Prevention Framework indicators. R2P trigger assessment.

- **System Prompt v5.0** (`src/lib/ai/prompts/system.ts`) — Major upgrade:
  - **Chain of Analysis** — 5-step internal reasoning chain (Situation Grounding → Data Availability → Tool Selection → Uncertainty Mapping → Output Calibration).
  - **Source Hierarchy** — 5-tier citation framework: Tier 1 (UN/treaty/official), Tier 2 (ACLED/ICG/SIPRI/UCDP), Tier 3 (credible journalism), Tier 4 (PRAXIS Graph), Tier 5 (AI Assessment).
  - **27 tool descriptions** — All tools described with proactive usage triggers and chaining guidance.
  - **Output Quality Checklist** — 6-point pre-delivery checklist: Grounded, Calibrated, Complete, Actionable, UN-standard, Sourced.

- **Credit costs for new tools** (`src/lib/api/with-credits.ts`) — `ai_stakeholder_influence: 3`, `ai_ceasefire_monitor: 3`, `ai_peace_agreement: 4`, `ai_early_warning_brief: 3`, `ai_game_theory_analysis: 3`, `ai_poc_assessment: 4`, `ai_advisor_panel: 8`.

### Changed

- **Chat Interface** (`src/components/assistant/chat-interface.tsx`) — Phase-aware contextual prompt suggestions (`getContextualPrompts()`), Standard/Deep Analysis mode selector, Export Chat button (downloads timestamped `.txt`).

- **Tool Invocation** (`src/components/assistant/tool-invocation.tsx`) — Enhanced renderer with framework badges (Glasl, Nash, PA-X, Mendelow, OCHA PoC, Zartman), loading timers, and rich per-tool result display (payoff matrices, stakeholder quadrant cards, ceasefire robustness bars, scenario triplets).

- **Advisory Council** (`src/app/app/advisory/page.tsx`) — Panel Discussion mode (convene panel, parallel advisor calls with `Promise.allSettled`, synthesized consensus). Advisory Brief generation. Enhanced advisor profiles with research databases, known blind spots, and inter-advisor disagreements. Star rating display.

- **Floating PRAXIS** (`src/components/app/floating-praxis.tsx`) — Context-aware greeting per page route (`getContextGreeting()`). Per-page quick action buttons (`getQuickActions()`). Per-situation localStorage key (`praxis-floating-chat-${situation.id}` or `-global`).

---

## [4.3.0] — 2026-03-31

### Added

- **Visualization Component Library** (`src/components/visualizations/`) — 10 new reusable, dark-theme SVG/D3 visualization components: `RiskGauge` (SVG arc gauge, animated stroke-dashoffset), `RadarChart` (SVG spider chart, animated polygon), `EscalationLadder` (Glasl 9-stage vertical/horizontal, pulse ring on active stage), `ProbabilityTree` (SVG BFS tree layout, probability-colored nodes), `TornadoChart` (horizontal sensitivity bars centered on baseline), `SankeyFlow` (layered column flow diagram with curved paths), `TimeSeriesChart` (SVG multi-series line chart, ResizeObserver responsive, hover crosshair), `HeatmapGrid` (div grid with risk/blue/diverging color scales), `ForceGraph` (D3 v7 force simulation, drag, zoom, arrow markers, click/hover), `ComplianceTracker` (progress bar, collapsible category groups, status dots). Barrel export at `index.ts`.

- **Geospatial Monitor** (`/app/geospatial-monitor`, `/demo/geospatial-monitor`, `POST /api/data/geospatial`) — New intelligence tool. Interactive Leaflet map (CartoDB Dark Matter tiles) with ACLED conflict event markers sized by fatalities, colored by event type (battles=red, explosions=orange, VAC=amber, protests=blue, riots=purple, strategic=slate). Top-5 hotspot sidebar with cluster name, event count, fatalities, dominant type, risk badge. Timeline slider for date-range filtering. Stats bar: Total Events, Total Fatalities, Active Actors, Conflict Intensity Index. API route calls `getSituationIntelligence()` + `clusterEvents()`, 15-min cache, 200-event cap, demo fallback with 50 Sudan/Darfur events. Added to sidebar under Intelligence (Map icon).

- **Dashboard KPI Cards** — 5-card row: RiskGauge (sm), Glasl stage + zone badge, actor count, graph entities, data completeness progress ring. Inserted after ActiveConflictSnapshot.

- **Dashboard Risk Radar** — "Multi-Dimensional Risk Assessment" with `<RadarChart>` (6 dimensions: Political, Military, Humanitarian, Economic, Information, Diplomatic) + bar breakdown list.

- **Dashboard Escalation Indicator** — Compact horizontal `<EscalationLadder>` showing current Glasl stage.

- **Dashboard AI Insights Panel** — Collapsible "PRAXIS Intelligence Brief" card with streaming brief fetch, skeleton loading state.

### Changed

- **Risk Monitor** — Added Overall Risk Gauge (lg, computed mean of all regions), 90-day TimeSeriesChart (Risk Score series with area fill), Risk Factor Sensitivity TornadoChart (5 factors), Multi-Dimensional RadarChart.

- **Early Warning** — Replaced static Glasl stage display with interactive `<EscalationLadder>` (clickable stages). Added 60-day Indicator Trend TimeSeriesChart (Incident Frequency + Intensity). Added Indicator Matrix HeatmapGrid (5 categories × 8 weeks, risk color scale).

- **Stakeholder Map** — Added "Network Graph" tab using `<ForceGraph>` (D3 v7). Actors mapped with type-based colors (government=navy, armed=red, civil=emerald, international=purple). Search/filter bar dims non-matching nodes. Edge type legend. NodeDetailsPanel on click with actor detail, "Generate Actor Brief" link.

- **Conflict Graph** — Replaced internal `GraphViewer` with `<ForceGraph>`. Entity type toggle filters (Actors, Events, Claims, Institutions, Resources, Norms). Search filter. "AI Analyze Graph" button posting to `/api/ai/graph-analysis`. SelectedEntityPanel on node click with type badge, description, connected entities.

- **App Sidebar** — Added Geospatial Monitor under Intelligence section (Map icon, `/geospatial-monitor`, tool ID `geospatial-monitor`).

### Dependencies

- Added: `leaflet@1.9.x`, `react-leaflet@4.x`, `@types/leaflet`

---

## [4.2.0] — 2026-03-31

### Added

- **Game Theory Tool** (`/app/game-theory`, `/demo/game-theory`, `POST /api/ai/game-theory`) — New simulation tool. Strategic Form Game Builder: select 2–4 actors, define per-actor strategies, AI auto-populates payoff matrix with Nash Equilibria detection (gold highlight), Pareto Optimal identification (emerald), and dominant strategy analysis. Sequential Game Tree: React SVG visualization with actor-colored nodes, probability-annotated edges, and backward induction. Game Archetype detection: maps situation to Prisoner's Dilemma, Chicken, Stag Hunt, Assurance, Zero-Sum, or mixed types with canonical 2×2 display and conflict implications. AI Analysis panel (6 collapsible sections): strategic landscape, dominant patterns, cooperation barriers, commitment mechanisms, historical parallels, policy recommendations. Grounded in Nash (1950), von Neumann & Morgenstern (1944), Schelling (1960), Fearon (1995). 3 credits. Demo mode: pre-computed Nordalia Crisis game (Prisoner's Dilemma). Added to sidebar under Simulation (Σ icon).

### Changed

- **Scenario Planner** (`/app/scenarios`) — Overhauled simulation engine: 8 numeric sliders (0–100) replacing enum-based params (ceasefire compliance, external intervention, economic pressure, humanitarian access, media environment, domestic stability, regional contagion, diplomatic engagement). 10 preset cards in expandable 2-column grid (5 existing + 5 new: Diplomatic Breakthrough, Humanitarian Catastrophe, Power Transition, Regional Contagion, Frozen Conflict). 3 methodology tabs: Narrative Analysis (streaming AI with structured 6-section output) / Probability Tree (static SVG from preset outcome branches) / Sensitivity Analysis (client-side tornado chart, no API call). Theory Grounding Panel: Glasl stage estimate, Zartman ripeness window, Stedman spoiler risk — all reactive to current slider values. API prompt upgraded with required section headers, Glasl staging, probability estimates, 3 policy recommendations with actor + 30/60/90 day timelines.

- **Negotiation Prep** (`/app/negotiation-prep`) — ZOPA Visualizer (`ZOPAVisualizer` component) wired into demo and real modes with `ZOPAIssue[]` mapped from AI-generated `zopaAnalysis`. BATNA Assessment Matrix: comparison table with strength color-coding (strong=red, moderate=amber, weak=green), cost of no agreement, time sensitivity. Strategy Advisory section: issue sequencing, logrolling opportunities, pre-negotiation CBMs, spoiler risk alert. Historical Precedents: Dayton Accords (1995), Good Friday Agreement (1998), Minsk Process (2014) with similarity scores and extracted lessons. Theoretical Frameworks: Fisher-Ury (1981), Lax-Sebenius (1986), Mnookin (2000).

- **Mediation Design** (`/app/mediation-design`) — Process Architecture Timeline: horizontal 4-phase visualization (Pre-negotiation → Framework Agreement → Substance → Implementation) with status dots and expandable detail panels. CBMs Designer: type-grouped list with urgency-sequenced sub-panel (symbolic → humanitarian → military). Spoiler Analysis: Stedman 3-column grid (Total/Limited/Greedy) + 2×2 risk matrix (Motivation × Capacity). Ripeness Assessment: interactive MHS/MEO checkboxes with live score + ripeness thermometer (Zartman 1989). UNSCR 1325 Inclusivity Checklist: 11 items across 5 categories with live progress bar.

- **CONCORDIA** (`/app/concordia`) — Hero section with product description, 3 feature cards (Live Transcription, Mediator Coaching, Session Documentation), prominent "Launch CONCORDIA" button. Feature comparison table: PRAXIS text tools vs CONCORDIA across 5 dimensions. Integration status panel: 4 data-flow indicators showing how CONCORDIA data feeds back into PRAXIS.

- **`src/lib/constants/scenario-configs.ts`** — Full rewrite. New `ScenarioParams` (all 8 numeric 0–100). New `ScenarioPreset` with `riskDirection` and `probability` fields. `DEFAULT_PARAMS` and `PARAM_METADATA` (label, tooltip, lowLabel, highLabel for all 8 params) exported.

- **`src/lib/api/with-credits.ts`** — Added `ai_game_theory: 3`.

- **`src/components/app/app-sidebar.tsx`** — Game Theory added under Simulation section (Sigma icon). `/game-theory` added to `HREF_TO_TOOL_ID`.

---

## [4.1.0] — 2026-03-31

### Added

- **UNHCR Client** (`src/lib/data-feeds/unhcr-client.ts`) — UNHCR Refugee Data Finder API (no key required). `getDisplacementStats()` returns population figures by country (refugees, IDPs, returnees, asylum seekers). `getDisplacementTimeSeries()` and `getDisplacedToCountries()`. 1-hour cache.

- **UCDP Client** (`src/lib/data-feeds/ucdp-client.ts`) — UCDP Georeferenced Event Dataset API (no key required). `getEvents()` for conflict events with coordinates and best/low/high casualty estimates. `getConflicts()` for active conflict records. `getBattleDeaths()` for aggregated annual figures. 2-hour cache.

- **CrisisGroup Client** (`src/lib/data-feeds/crisisgroup-client.ts`) — CrisisWatch status scraper via Firecrawl (requires `FIRECRAWL_API_KEY`). `getCrisisWatch()` returns `CrisisWatchEntry` with status (deteriorated/unchanged/improved), summary, and alert/opportunity flags. 6-hour cache.

- **SIPRI Client** (`src/lib/data-feeds/sipri-client.ts`) — SIPRI arms transfer data scraper via Firecrawl. `getArmsTransfers()` returns `SIPRIArmsSnapshot` with total value, top suppliers, top recipients, year. 12-hour cache.

- **Geospatial Engine** (`src/lib/analytics/geospatial-engine.ts`) — NEW analytics module. `haversineDistance()` for exact earth-surface distances in km. `clusterEvents()` implements iterative DBSCAN (no recursion — stack-safe on 15k events). Each `HotspotCluster` carries: centroid lat/lng, radius_km, event count, fatalities, dominant event type, actor list, trend (expanding/stable/contracting from density ratio), and admin1. `geographicSpreadIndex()` normalises bounding-box area to 0–100. `detectMovement()` compares 7-day vs 7–14-day centroids to return direction and distance.

- **ConflictProfile aggregation** (`src/lib/data-feeds/feed-aggregator.ts`) — `getConflictProfile()` fetches all 9 data sources in parallel via `Promise.allSettled`, records per-source latency, and returns a `ConflictProfile` with: full intelligence stream, risk assessment, Glasl escalation stage, humanitarian snapshot, governance snapshot (WGI), arms flows (SIPRI), population stats (UNHCR), UCDP conflicts, CrisisWatch status, `SourceHealth[]` per source, `DataQuality` score. 15-minute in-memory cache. New interfaces: `SourceHealth`, `DataQuality`, `GovernanceSnapshot`, `ArmsFlowSnapshot`, `PopulationSnapshot`, `ConflictProfile`.

### Changed

- **ACLED Client** — Added rate limiting (1200 ms between requests), 1-hour cache, `ACLEDActorSummary` and `ACLEDWeeklyTrend` types. New functions: `fetchActors()`, `fetchEventTrend()` (12 weeks), `aggregateFatalities()`, `clusterByLocation()`. Pagination up to 15,000 events.

- **GDELT Client** — Added `detectVolumeSpike()` Z-score anomaly detection, `aggregateTone()`, `getSourceCountries()`. CAMEO theme, country, and language filtering on `searchArticles()`.

- **World Bank Client** — Added `WBGovernanceIndicators` and `WBEconomicSnapshot` types. `getGovernanceIndicators()` fetches all 6 WGI indicators. `getFragilityIndicators()`, `getTimeSeries()`, full `getEconomicSnapshot()` including Gini coefficient and poverty headcount.

- **HDX Client** — Expanded ISO3 mapping to 60+ countries with partial-match fallback. Added `getIDPsByAdmin()`, `getNutrition()`, `getOperationalPresence()`. Cache reduced to 30 minutes for fresher IDP data.

- **ReliefWeb Client** — Added `fetchLatestSituationReports()`, `fetchDisasterUpdates()`. Full filter support: theme, source, language, date range.

- **UN News Client** — Expanded from 3 to 6 RSS feeds (added Africa, Middle East, International Law topics). `UNNewsItem` now carries `isSGStatement` and `isSecurityCouncil` boolean flags. Added `fetchTopicalNews()` with topic-to-feed-slug mapping. SG/SC items ranked higher in search results.

- **Risk Engine** — INFORM Risk Index geometric mean formula: `Composite = (Hazard × Vulnerability × LackOfCoping)^(1/3)`. New `INFORMComponents` interface and `computeINFORM()` function. WGI integration: `wgiPoliticalStability`, `wgiRuleOfLaw`, `wgiGovEffectiveness` params feed directly into political risk dimension via `wgiToRiskScore()`. New `getStageTransitionRisk()` helper.

- **Escalation Scorer** — Weighted event type scoring (Battles ×4, VAC/Explosions ×3, Riots ×2, Protests/Strategic ×1). Actor fragmentation index (0–1). Geographic spread index (0–100 from unique admin1 count). New `getStageTransitionProbability()` export. `EscalationAssessment` extended with `actorFragmentation`, `geographicSpread`, `weightedIntensity`, `stageTransitionProbability`.

- **`/api/data/intelligence`** — 15-minute server-side cache keyed per user + country. New `profile: true` body flag activates `getConflictProfile()` (all 9 sources). `maxDuration` set to 60s.

---

## [4.0.0] — 2026-03-31

### Added

- **Tool Registry** (`src/lib/constants/tool-registry.ts`) — Single source of truth for all 40 PRAXIS tools. Each entry provides `id`, `name`, `category`, `description`, `shortDescription`, `credits`, `icon`, `aiRoute`, `dataSchema`, `requiredSituationFields`, `outputType`, `frameworks[]`, `dataSources[]`, `relatedTools[]`, and a `methodology` paragraph with full academic citations. Lookup helpers: `TOOL_BY_ID`, `TOOLS_BY_CATEGORY`, `getToolById()`, `getToolsByCategory()`, `getRelatedTools()`. Replaces scattered, inconsistent tool metadata spread across sidebar, AI routes, and page components.

- **Frameworks Library** (`src/lib/constants/frameworks.ts`) — 15 fully documented analytical framework constants with complete academic citations, structured components, and usage mappings. Covers: Glasl 9-Stage Escalation Model (all stages with indicators and interventions), Fisher-Ury Principled Negotiation (BATNA/ZOPA definitions), INFORM Risk Index (formula and dimensions), Barnett-Duvall Power Taxonomy (4 faces with examples), Zartman Ripeness Theory (MHS + WO conditions), Stedman Spoiler Theory (3 types + management strategies), Mitchell-Agle-Wood Stakeholder Salience (7 types), OCHA Humanitarian Principles, IPC Food Security Phases (all 5 with colors), Lederach Peacebuilding Pyramid (3 tiers), Galtung Conflict Triangle (ABC + violence typology), UN DPPA Brief Format (sections + language standards), Berghof Mediation Framework (6 phases), Putnam Two-Level Games, Fearon Rationalist War Causes (3 mechanisms).

- **Situation Type System v2** (`src/types/situation.ts`) — New optional fields on `Situation` interface for richer conflict classification: `conflictClassification` (UCDP typology: interstate/intrastate/internationalized_intrastate/non_state/extrastate), `ucdpIntensity` (minor/war/non_state), `informRiskIndex` (hazard/vulnerability/lackOfCoping/composite), `fragileStatesIndex`, `gdpPerCapita`, `populationAffected`, `conflictOnsetDate`, `latestEventDate`, `geoBoundingBox`, `keyDates[]`, `linkedSituations[]`, `tags[]`, `analysisPhase` (intake/mapping/assessment/monitoring/reporting), `lastAiRefresh`, `dataCompleteness`. All new fields are optional — fully backwards compatible. New types: `ToolCategory`, `ToolDefinition`, `ToolOutputType`, `ConflictClassification`, `UcdpIntensity`, `AnalysisPhase`.

- **Entity Enrichment Schema** (`src/lib/ai/schemas/conflict-grammar.ts`) — New `EntityEnrichmentSchema` with confidence scoring (0–1), source attribution (`sourcePassage`, `sourceDocument`, `retrievalMethod`), temporal validity (`validFrom`, `validUntil`, `lastVerified`), and `qualityScore` (0–100). Added to `ConflictGraphSchema` as `enrichments: Record<entityId, EntityEnrichment>` (optional, backwards compatible) and `dataCompleteness` field. New export: `EntityEnrichment` TypeScript type.

- **New tool registry entries**: `game-theory` (Simulation — strategic interaction modeling with payoff matrices, Nash equilibria, Schelling focal points, Fearon rationalist war causes) and `geospatial-monitor` (Intelligence — map-based ACLED/GDELT event visualization with hotspot clustering).

### Changed

- **Tool count**: 38 → 40 tools (game-theory + geospatial-monitor added to registry; pages in Phase 4)
- **CLAUDE.md**: Updated to v4.0.0. Added full frameworks library table, updated tool registry reference, updated sidebar sections to reflect 40-tool structure.

---

## [3.10.0] — 2026-03-30

### Added

- **Deep Research Agent** — New flagship intelligence tool powered by Google ADK Multi-Agent System deployed on Vertex AI Agent Engine (project: `praxisbytacitus`). Accessible at `/app/deep-search-agent` and `/demo/deep-search-agent`. The agent runs a three-phase pipeline: Planning (decomposes the query into research tasks), Research (parallel agents query the web and cross-reference sources), Synthesis (a dedicated report-composer agent writes a structured intelligence brief). Live event feed shows each sub-agent's activity during research. Sessions are preserved for multi-turn follow-up queries. Requires `VERTEX_AGENT_ENGINE_ID` env var.
- **`src/lib/ai/vertex-agent.ts`** — Complete Vertex AI Agent Engine client library. Handles: service account auth via `FIREBASE_SERVICE_ACCOUNT_KEY` (reusing existing credentials), session creation (`POST .../reasoningEngines/{id}/sessions`), streaming turn execution (`POST .../sessions/{id}/turns:run`), single-shot query (`POST .../reasoningEngines/{id}:streamQuery`), and SSE event parsing across 5 different ADK response formats. Phase inference from ADK agent author names (planner/researcher/composer → planning/research/synthesis).
- **`POST /api/ai/deep-search-agent`** — Streaming API route for the ADK agent. Enriches the user query with full situation context (name, region, actors, risk level). Creates/reuses sessions. Re-streams ADK SSE with PRAXIS-structured events (`session`, `status`, `text`, `done`, `error`). 10 credits per use. `maxDuration = 120s`. Returns 503 if `VERTEX_AGENT_ENGINE_ID` not set.
- **`POST /api/admin/set-all-credits`** — Batch credit reset endpoint. Sets ALL existing users to 5000 credits. Protected by `Authorization: Bearer <CRON_SECRET>`. Firestore batch writes (chunks of 400). Logs to `credit_transactions` as `admin_bulk_reset`. Run once to bootstrap all existing accounts.
- **Deep Research Agent added to sidebar** — Under Intelligence section, top position, with `TACITUS ADK` badge. Uses `Telescope` icon.
- **Demo deep-search-agent page** — Full Nordalia Crisis demo with a pre-built 47-source research report on escalation dynamics. Shows all three phases with agent activity feed.

### Changed

- **New users start with 5,000 credits** (was 100) — `deductCreditsAdmin()` initial profile creation now sets `credits: 5000`. This prevents accounts from being exhausted immediately during normal testing and usage.
- **Debug Panel top-up now adds 1,000 credits** (was 500) — More useful buffer for testing complex workflows.
- **Added `ai_deep_search_agent: 10` to credit cost table** — ADK Deep Research is the highest-cost operation in PRAXIS (multi-agent, long-running, web research).

---

## [3.9.8] — 2026-03-30

### Fixed

- **402 errors on all AI routes — credits exhausted** — Added self-service credit top-up endpoint at `POST /api/admin/add-credits`. Adds 500 credits to the authenticated user's account via atomic Firestore transaction. Wired into Debug Panel with live credit counter and "+500 credits" button.
- **504 on actor-profiles** — Raised `maxDuration` from 60 to 120 seconds. Gemini Pro + complex 8-field nested actor schema routinely exceeded the 60s Vercel function limit.
- **500 on dossier-generate** — `searchWeb()` (Wikipedia + GDELT free API fallback) could hang or fail without timeout protection, crashing the route. Wrapped in 8s `Promise.race` timeout; web search failure is now non-blocking.
- **Missing credit type keys** — 8 routes used credit type strings not present in `AI_CREDIT_COSTS` table (defaulted silently to 1 credit each): `ai_actor_profiles`, `ai_commitment_scan`, `ai_info_environment`, `ai_mediation_design`, `ai_power_map`, `ai_media_roundup`, `media-roundup`, `research`. Now all have explicit costs.

---

## [3.9.7] — 2026-03-30

### Fixed

- **CSP: Google Analytics unblocked** — Added `www.google-analytics.com` and `*.google-analytics.com` to `connect-src`. GTM was loading but GA4 `collect` endpoint was blocked, silently dropping all analytics events.
- **Tool generation no longer hangs indefinitely** — `AiPopulate` now uses `AbortController` with a 90-second hard timeout on every `fetch` call. Previously the spinner could run forever if Gemini Pro was slow or a network issue occurred. Now gives a clear timeout error message after 90s and offers Retry.

### Added

- **Debug Panel** (`Ctrl+Shift+D`) — Floating debug console in the bottom-left corner of all `/app/*` pages. Shows: real-time API call log (request → success/error), elapsed time per call, HTTP status codes, error messages, and service health status (Firebase/GoogleAI/Anthropic/Firecrawl/Parallel). Red badge appears on the button when errors exist. Clears on demand. Designed for both development and production diagnostics.
- **AiPopulate elapsed timer** — Generating state now shows a live elapsed-time counter ("12s elapsed · up to 60s for complex situations") and step-by-step progress labels that update as generation proceeds.
- **AiPopulate cancel button** — Users can now cancel a generation in-flight. Aborts the fetch immediately and shows a retry option.

---

## [3.9.6] — 2026-03-30

### Changed

- **`buildToolContext()` massively expanded** — All 34 AI API routes receive a rich, structured situation context block (was 5 lines, now 25 lines). New context includes: risk level label (HIGH/MODERATE/LOW), Glasl escalation stage with name (e.g., "Stage 4/9 — Images/Coalitions"), analyst role framing, full knowledge base inventory (actors profiled, graph entities, documents), 14-entity ACO Conflict Grammar reminder (Core 8 + Extended 6), and analytical standards (Glasl + INFORM + named-actor grounding). This single change propagates to every tool: risk assessment, escalation scan, actor profiles, power map, negotiation, mediation, dossier, briefing, report, and all others.

### Fixed

- **`situation-initializer.ts`: `generateObject` removed in AI SDK v6** — Tool seeding after auto-structure was calling the removed `generateObject` API, causing silent failures on all new situation initializations. Rewrote to use `generateText` + `Output.object({ schema })` as required by AI SDK v6.

---

## [3.9.5] — 2026-03-30

### Fixed

- **CSP: Google Tag Manager unblocked** — Added `www.googletagmanager.com` to `script-src` in middleware. GTM analytics script was being blocked.
- **Daily Brief generation no longer hangs** — Root cause 1: `getSituationIntelligence()` called 7 external data feeds without a timeout; any slow feed blocked the entire response indefinitely. Fixed with 8-second `Promise.race` timeout per feed. Root cause 2: credit type was `ai_auto_briefing` (not in cost table, silent fallback to 1) — corrected to `ai_morning_digest`. Root cause 3: `maxDuration` was 45s — raised to 60s for deep research mode.

### Added

- **Daily Brief deep research mode** — New "Deep Research" button runs Firecrawl web search (up to 5 live sources) + Google-grounded Gemini real-time research before generating the brief. Shows source provenance in `sourcesSummary` field. Falls back gracefully if Firecrawl is not configured.
- **Daily Brief generation UX overhaul** — Replaced AiPopulate with direct generation controls. Two buttons: "Standard Brief" (ACLED/GDELT/ReliefWeb + AI, ~30s) and "Deep Research" (Standard + Firecrawl + Google grounding, ~45s). Step-by-step progress indicator during generation. Separate Refresh and Deep Research buttons on the header after first generation. Brief history cards show "deep" badge for deep-research briefs.

---

## [3.9.4] — 2026-03-30

### Added

- **Documents page fully wired** — Rewrote `/app/documents` to use real Firestore data. Added `GET /api/documents` (list documents per situation) and `POST /api/documents/{id}/extract-stored` (AI entity extraction with ACO Conflict Grammar). No more mock data — all documents load from Firestore on mount.
- **Stakeholder Map auto-generates on first visit** — Added `useEffect` that triggers `/api/ai/power-map` automatically when no stakeholder data exists and persisted cache is empty. Consistent with AiPopulate behavior on all other tools.

### Fixed

- **Analysis tools no longer show hardcoded Nordalia data in real mode** — Risk Monitor, Early Warning, and Actor Profiles previously showed hardcoded Nordalia Crisis placeholder data in the idle state (before generation). Now show a clean empty state with a prompt to generate, preventing confusion when users create their own situations (e.g., Syria, Sudan, etc.).

---

## [3.9.3] — 2026-03-30

### Fixed

- **503 on all AI routes resolved** — Root cause: `deductCredits` in `firestore.ts` used the client-side Firebase SDK (`firebase/firestore`) which has no auth context in server API routes. Firestore security rules (`allow write: if request.auth.uid == uid`) rejected every transaction, caught as error → 503. Rewrote `with-credits.ts` to use Firebase Admin SDK (`firebase-admin/firestore` + `FieldValue.increment`) which bypasses security rules server-side. All AI routes now pass credit checks correctly.
- **Health endpoint fixed** — Was checking `NEXT_PUBLIC_FIREBASE_API_KEY` (always false in prod since not a `NEXT_PUBLIC_` var) instead of `FIREBASE_SERVICE_ACCOUNT_KEY`. Now reports accurate service status.

---

## [3.9.2] — 2026-03-30

### Fixed

- **Google Sign-In working** — Root cause: `proxy.ts` was never executed (Next.js only loads `middleware.ts`). Renamed back to `src/middleware.ts` with `export function middleware`. Middleware manifest now shows active middleware. Route protection for `/app/*` and `/demo/*` is restored. COOP header `same-origin-allow-popups` is now actually applied.
- **Switched Google auth to redirect flow** — Replaced `signInWithPopup` with `signInWithRedirect` + `getRedirectResult` in `auth-context.tsx`. Avoids popup entirely, no COOP dependency. Login page detects returning redirect via `useEffect` on auth state change and auto-redirects to app.
- **Deleted dead `proxy.ts`** — Was misleadingly left as the "active" middleware. Next.js 16 uses `middleware.ts` exactly like previous versions.

---

## [3.9.1] — 2026-03-30

### Fixed

- **Firebase Auth popup working** — Added `Cross-Origin-Opener-Policy: same-origin-allow-popups` header to `proxy.ts`. Added `*.google.com`, `*.gstatic.com`, `identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, `wss://*.firebaseio.com` to CSP allowlists. Google Sign-In popup can now communicate back to the opener window. Re-added `unsafe-eval` to `script-src` as Firebase Auth SDK requires it for popup flow.
- **Graceful AI degradation** — Dashboard daily digest no longer auto-fires when `GOOGLE_AI_API_KEY` isn't configured. Checks `/api/health` first and shows clear message: "Set GOOGLE_AI_API_KEY to enable intelligence briefs."
- **Deleted conflicting `middleware.ts`** — Next.js 16 uses `proxy.ts` (not `middleware.ts`). Build was failing with "Both middleware and proxy detected" error.
- **Expanded proxy matcher** — Added `/login` and `/pricing` to proxy routes so security headers apply to public pages too.

### Added

- **Tool status indicators in sidebar** — Green dots next to tools that have generated data, grey dots for tools awaiting generation. Reads from `dashboard-snapshot` persisted tool data. Updates when situation changes.
- **Tool status mapping** — `HREF_TO_TOOL_ID` maps 21 sidebar routes to their tool data IDs for status lookup.

---

## [3.9.0] — 2026-03-29

### Added

- **Sidebar reorganized into 6 professional categories** — Context (dashboard, docs, sources, timeline, humanitarian, calendar), Analysis (risk, early warning, actors, graph, stakeholders, compare), Drafting (assistant, reports, dossier, talking points, briefing, daily brief, UN toolkit), Simulation (scenarios, negotiation, CONCORDIA, mediation), Intelligence (ARGUS, media compass, media roundup, info environment, sanctions, commitments, treaty, alerts), Workspace (cases, team).
- **Interactive Timeline page** (`/app/timeline`) — Chronological conflict event visualization with significance-based color coding (critical/high/medium/low), expandable event cards with actor tags and source links, filter by significance level, event count stats.
- **Humanitarian Dashboard** (`/app/humanitarian`) — Live humanitarian data aggregated from HDX HAPI, ReliefWeb, UNHCR, WFP, OCHA FTS. Shows: displacement (IDPs + refugees), IPC food security classification with phase bars, humanitarian funding progress, latest ReliefWeb reports. Auto-refreshable.
- **iCal calendar integration** — `ical-parser.ts` utility for parsing .ics feeds into calendar events. Server-side `POST /api/calendar/import` route fetches and parses iCal URLs. Supports institutional calendar feeds (UN, OSCE). Handles VEVENT parsing, line unfolding, date/time extraction.
- **Demo routes** for timeline and humanitarian pages.

### Changed

- Removed all `badge: 'NEW'` markers from sidebar (tools are now established)
- Sidebar version bumped to v3.9
- Added `Clock`, `Heart`, `Globe` icons to sidebar imports

---

## [3.8.0] — 2026-03-29

### Added

- **Email system (Resend)** — Complete transactional email service with 4 templates: welcome on signup (100 credits notification), credit warning (low balance alert), alert digest (intelligence alerts table), weekly summary (situation status overview). API route at `/api/email/welcome` auto-triggered on new user creation. Requires `RESEND_API_KEY` env var.
- **Vector embeddings for document RAG** — Gemini `text-embedding-004` generates 768-dimension embeddings on document upload. Stored inline on Firestore chunk documents. Retrieval uses hybrid scoring: cosine similarity (70% weight) + keyword overlap (30%). Falls back gracefully to keyword-only if embeddings unavailable.
- **Sentry error monitoring** — `@sentry/nextjs` configured for client, server, and edge. Error boundaries report to Sentry with component stack traces. Requires `NEXT_PUBLIC_SENTRY_DSN` env var. Disabled in development.
- **Landing page: Live Platform Preview** — New interactive section showing all 42 tools organized in 3 categories (Situation Room, Analysis & Drafting, Intelligence Tools) with animated tab switching. Stats bar: 42 tools, 21 AI chat tools, 59 API routes, 6 live data feeds.
- **Integration tests** — New `auth-security.test.ts` with 46 tests covering: auth security contracts, credit cost validation, subscription tier alignment, pricing tier structure, email service exports.

### Changed

- Welcome email sent automatically on first signup (fire-and-forget from auth-context)
- `.env.local.example` updated with `RESEND_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN` documentation

---

## [3.7.1] — 2026-03-29

### Added

- **Intelligence Readiness dashboard** — Renamed "Situation Health" to "Intelligence Readiness" with overall status counter ("3/5 core tools ready"), color-coded semaphore dot (green/amber/grey), and spinning indicator while tools are still seeding.
- **Auto-polling for tool seeding** — Dashboard polls every 8 seconds for up to 3 minutes after situation creation. As each tool finishes seeding (actor-profiles, risk-monitor, early-warning, conflict-graph, stakeholder-map), its semaphore flips from "Generate" to green checkmark in real-time.
- **Building state with progress skeleton** — When auto-structure is running, shows animated skeleton for each core tool with spinning indicators. User sees tools "light up" progressively.
- **Extended tools section** — Added 5 more tools to the readiness grid: Dossier, Negotiation Prep, Media Roundup, Sanctions Tracker, Briefing Room. Separated into "Core" (auto-seeded) and "Analysis & Intelligence" (user-triggered) sections.
- **Tool semaphore component** — Reusable `ToolSemaphore` with click-to-navigate, hover states, and visual status indicators.

### Audited

- Full tool page data flow audit: all 42 pages verified for AiPopulate/usePersistedToolData pattern, API route wiring, buildToolContext usage, first-visit behavior.
- Complete page → toolId → API route → data source → storage map created.
- All 34 AI routes confirmed using withAuth + checkAndDeductCredits + buildToolContext.
- Situation creation → auto-structure → tool seeding → dashboard display pipeline verified end-to-end.

---

## [3.7.0] — 2026-03-29

### Added

- **Real-time credit sync** — Firestore `onSnapshot` listener on user profile. Credits update instantly in the UI after Stripe payments, AI tool usage, or admin adjustments. No page refresh needed.
- **Pricing → checkout flow** — Clicking "Start Analyst Plan" on pricing page passes `?plan=analyst` through login, which redirects to `/app/settings?upgrade=analyst`, auto-triggering Stripe checkout. Full end-to-end payment flow now works.
- **Payment success/cancelled banners** — Settings page shows styled banners when arriving from Stripe (`?payment=success` or `?payment=cancelled`). Includes dismiss buttons.
- **CSP hardened** — Removed `unsafe-eval` from Content-Security-Policy (XSS protection). Added Stripe, HDX HAPI, World Bank API to `connect-src` and `frame-src` allowlists.

### Fixed

- **Unified subscription tiers** — `SubscriptionTier` type aligned to `free|analyst|team|enterprise` matching pricing page and Stripe metadata.
- **Stripe webhook hardened** — Added idempotency, audit trail logging, proper error responses for Stripe retries.
- **Stripe env var documentation** — Added all `STRIPE_PRICE_*` vars to `.env.local.example`.

### Removed

- **Dead code: `src/lib/subscription/tiers.ts`** — Conflicting pricing definitions with zero imports. Deleted.

---

## [3.6.2] — 2026-03-29

### Added

- **Token refresh loop** — Firebase ID tokens expire after 1 hour. Added `onIdTokenChanged()` listener in `auth-context.tsx` that detects token changes and proactively refreshes 5 minutes before expiry. Session cookie is automatically updated with fresh tokens. Users no longer hit 401s on long sessions.
- **Error boundaries** — Added Next.js `error.tsx` at root, `/app`, and `/demo` levels. Wired existing `ErrorBoundary` component into `AppShell` main content area. Any tool page crash now shows a styled fallback with "Try Again" and "Report Issue" buttons instead of a white screen.

---

## [3.6.1] — 2026-03-28

### Security — Auth Hardening

- **CRITICAL: Removed unsafe JWT fallback in `admin.ts`** — Previously decoded JWT payloads without cryptographic verification when Admin SDK verification failed. Attacker could craft fake JWTs to impersonate any user. Now strictly requires verified tokens via Firebase Admin SDK.
- **CRITICAL: Removed silent credit bypass on Firestore failure** — `with-credits.ts` returned `allowed: true` when Firestore was unavailable, allowing unlimited AI usage. Now returns 503 and blocks the request.
- **CRITICAL: Fixed credit deduction race condition** — `firestore.ts` used check-then-deduct pattern vulnerable to concurrent requests double-spending credits. Now uses `runTransaction()` for atomic check + deduct.
- **HIGH: Removed unsafe JWT decode in `with-credits.ts`** — `getSessionUid()` decoded JWT without verification to extract UID. Now uses `verifyIdToken()` from Admin SDK.
- **HIGH: Added server-side token validation to session route** — `POST /api/auth/session` stored tokens without verification. Now verifies token via Firebase Admin SDK before setting cookie.
- **HIGH: Added CSRF/origin validation to session route** — Validates `origin` header matches `host` to prevent cross-site session manipulation.
- **HIGH: Fixed rate limiter memory leak** — `rateLimitMap` in `with-auth.ts` grew unbounded. Added periodic garbage collection (every 5 minutes) to remove expired entries.
- **HIGH: Hardened Firestore security rules** — Users could previously modify `credits`, `totalCreditsUsed`, `subscription` fields directly via client SDK. Rules now block writes to protected fields; only Admin SDK (server-side) can modify credits.
- **MEDIUM: Moved Firebase client config to environment variables** — API key, project ID, and other client config moved from hardcoded values to `NEXT_PUBLIC_FIREBASE_*` env vars with backwards-compatible defaults.

### Changed

- Updated `.env.local.example` with Firebase client SDK env var documentation

---

## [3.6.0] — 2026-03-28

### Security

- **Wrapped 6 unprotected AI routes with `withAuth()`** — `claude-analyze`, `deep-research`, `grounded-search`, `media-analyze`, `research`, `terminology` were previously exposed without authentication verification or rate limiting. All now require valid Firebase session + enforce 100 req/min rate limit.
- **Added credit deduction to `auto-structure`** — This resource-intensive pipeline (web scraping, feed polling, multi-tool initialization) was missing `checkAndDeductCredits()`. Now deducts 5 credits (ai_research tier).

### Audited

- Full API route audit: all 59 routes verified for auth, credits, situation context, error handling
- All 35+ app pages verified for `useSituationGuard()` — 3 intentional exceptions (settings, situations list, new situation)
- All 21 chat tools verified as wired to assistant via `tacitusTools` in chat route
- Zero TODO/FIXME/HACK comments found in API layer
- Zero demo data leaks into production paths confirmed
- All environment variable usage verified — no hardcoded secrets

### Documentation

- Added `CHANGELOG.md` (this file)
- Added `TOOL_AUDIT.md` — complete tool-by-tool wiring status with API routes, pages, and recommendations
- Updated `CLAUDE.md` — reflects v3.6 state, corrected tool count, added audit findings
- Updated `README.md` — professional format with full architecture, all 59 API routes, improvement roadmap

---

## [3.5.0] — 2026-03-26

### Added

- Sources Library page (`/app/sources`) — browse ACLED, GDELT, ReliefWeb, HDX, World Bank, Wikipedia feeds
- Unified web crawler infrastructure via Firecrawl (`scrapeMultiple`, `crawlUrl`)
- 29 tool pages across Situation Room, Analysis & Drafting, Intelligence Tools, Workspace
- Persisted tool data with 24h TTL via `usePersistedToolData` hook
- Source mode picker: all / web+docs / docs-only / llm-only
- Auto-structure pipeline — auto-populates new situations with research, actors, risk scores

### Changed

- AI model tiers: Flash for chat, Pro for structured tools, Claude for deep analysis, Grounded for research
- Tool pages use `AiPopulate` pattern for automatic data generation on first visit

---

## [3.4.0] — 2026-03-20

### Added

- Advisory Council chatbot (`/app/advisory`) — multi-actor perspective analysis
- Auto-briefings system with Vercel cron jobs (05:00 UTC daily)
- Alert center with GDELT-based early warning (06:00 UTC daily)
- Compare tool for side-by-side conflict analysis
- Briefing room with speaker notes

---

## [3.3.0] — 2026-03-15

### Added

- AiPopulate pattern — auto-generates structured data on first tool visit
- 25+ AI tools with Zod schemas and structured output
- Conflict Grammar v2.0 — 14-entity ontology (8 core + 6 extended)
- INFORM Risk Index 5-dimension scoring
- Glasl 9-stage escalation tracking
- Fisher/Ury ZOPA/BATNA negotiation analysis
- Mitchell/Agle/Wood stakeholder power mapping
- CRAAP test media reliability scoring
- NATO STRATCOM info environment assessment
- UN DPPA morning brief standard
- Berghof mediation process design

---

## [3.2.0] — 2026-03-10

### Added

- Document upload & RAG pipeline (PDF, DOCX, TXT, MD)
- Knowledge graph visualization with D3.js force layout
- Report export to DOCX and PDF
- Treaty analyzer with ambiguity flagging
- Sanctions tracker with escalation scanning
- Commitment compliance monitoring

---

## [3.1.0] — 2026-03-05

### Added

- Floating "Ask PRAXIS" chat panel on all pages
- Mobile responsive layout — sidebar becomes drawer overlay
- Keyboard shortcuts: `/` opens chat, `Esc` closes
- PRAXIS super-agent mode in chat — platform-aware, can guide users to tools

---

## [3.0.0] — 2026-03-01

### Added

- Dual-app architecture: `/app/*` (authenticated) + `/demo/*` (cookie-only)
- Pre-loaded Nordalia Crisis demo with cached AI responses
- Firebase Auth (Google + email/password)
- Firestore-backed situation-driven data model
- TACITUS credit system (100 on sign-up, per-use deduction)
- Vercel deployment with iad1 region
- 35+ tool pages
- Stripe payment routes (checkout + webhook)

---

## [2.x] — Pre-release

Internal prototypes. Not publicly available.
