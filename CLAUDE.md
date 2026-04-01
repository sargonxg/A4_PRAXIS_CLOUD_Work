# PRAXIS — Conflict Intelligence Platform by TACITUS

> Version 5.1.0 — Tool Methodology Panels, Auth Hardening, Sidebar Changelog, Landing Footer, Login Credits

## v5.1.0 Tool Methodology Panels & Auth Hardening (2026-04-01)

### New Components
- **`src/components/praxis/tool-info-panel.tsx`** — Reusable collapsible methodology panel for tool pages. Renders framework name, academic citation, description, and structured components. Accepts `toolId` prop and looks up entry from `TOOL_REGISTRY`. Used on 10 tool pages.

### Updated Files (Phase 6)
- **10 tool pages enriched with ToolInfoPanel** — Each page now renders a `<ToolInfoPanel toolId="..." />` collapsible methodology section, surfacing the academic frameworks and data sources behind the AI output. Pages updated: `risk-monitor`, `early-warning`, `actor-profiles`, `stakeholder-map`, `negotiation-prep`, `mediation-design`, `game-theory`, `scenarios`, `info-environment`, `power-map`.
- **Auth hardening** (`src/lib/auth/auth-context.tsx`) — `syncTokenCookie` now includes retry logic (up to 3 attempts with exponential backoff), response status check, and removed `router.refresh()` call that caused double-renders on token sync.
- **App sidebar** (`src/components/app/app-sidebar.tsx`) — Changelog section at the bottom of the sidebar showing v4.0→v5.0 release history with date and summary. Collapsed by default, expandable.
- **Landing footer** (`src/components/landing/footer.tsx`) — PRAXIS v5.0.0 version badge added to bottom-right security badges row.
- **Login page** (`src/app/(auth)/login/page.tsx`) — Credits copy corrected from "100 TACITUS Credits" to "5,000 TACITUS Credits" to match actual sign-up grant (v3.10.0).

---

## v5.0.0 AI Tools, Assistant & Advisory System Overhaul (2026-03-31)

### New AI Tools (tools.ts — tools 22-27)
- **`stakeholderInfluenceMap`** (tool 22) — Mendelow Power-Interest Matrix + Mitchell-Agle-Wood stakeholder salience. Quadrant assignments, influence vectors, engagement strategies.
- **`ceasefireMonitor`** (tool 23) — Ceasefire robustness scoring: mechanism, verification, sanctions, political will. PA-X + ACLED sourced.
- **`peaceAgreementAnalyzer`** (tool 24) — PA-X coding: power-sharing, security arrangements, transitional justice, civil society, gender. Implementation pathway + spoiler risk.
- **`earlyWarningBrief`** (tool 25) — IGAD/CEWARN format: situation summary, indicator trends, Base/Escalation/De-escalation scenarios, triggers, preventive actions.
- **`gameTheoryAnalysis`** (tool 26) — Nash equilibrium, Prisoner's Dilemma, Stag Hunt, Chicken. Payoff matrices, Schelling focal points, diplomatic leverage.
- **`protectionOfCiviliansAssessment`** (tool 27) — OCHA PoC Three-Tier Framework. UN Atrocity Prevention Framework scoring. R2P trigger assessment.

### System Prompt v5.0 (src/lib/ai/prompts/system.ts)
- **Chain of Analysis** — 5-step reasoning chain before every substantive response (Grounding → Data → Tools → Uncertainty → Calibration)
- **Source Hierarchy** — 5 tiers with explicit citation labels: [UN SC Res.], [ACLED], [Reuters], [PRAXIS Graph], [AI Assessment]
- **27 tool descriptions** — All tools with proactive usage triggers and chaining guidance
- **Output Quality Checklist** — 6-point pre-delivery gate: Grounded, Calibrated, Complete, Actionable, UN-standard, Sourced

### Updated Files
- **`src/components/assistant/chat-interface.tsx`** — `getContextualPrompts()` (phase-aware suggestions), Standard/Deep Analysis mode selector, Export Chat button (.txt download)
- **`src/components/assistant/tool-invocation.tsx`** — Framework badges (Glasl/Nash/PA-X/Mendelow/OCHA/Zartman), loading timers, rich per-tool rendering
- **`src/app/app/advisory/page.tsx`** — Panel Discussion mode (parallel advisor calls + consensus synthesis), Advisory Brief, enhanced profiles (databases/blindSpots/disagreements), star ratings
- **`src/components/app/floating-praxis.tsx`** — `getContextGreeting()` per page, `getQuickActions()` per page, per-situation localStorage key

### Credits (with-credits.ts — new keys)
- `ai_stakeholder_influence: 3`, `ai_ceasefire_monitor: 3`, `ai_peace_agreement: 4`
- `ai_early_warning_brief: 3`, `ai_game_theory_analysis: 3`, `ai_poc_assessment: 4`
- `ai_advisor_panel: 8` (parallel panel discussion)

---

## v4.3.0 Visualizations & Dashboard Overhaul (2026-03-31)

### New Files
- **`src/components/visualizations/risk-gauge.tsx`** — SVG arc gauge (270° sweep, 0-100, animated stroke-dashoffset). Props: `score`, `label?`, `size?` (sm/md/lg), `showValue?`. Color zones: emerald/amber/orange/red.
- **`src/components/visualizations/radar-chart.tsx`** — SVG spider/radar chart. Props: `dimensions[]` ({label, value, maxValue?}), `size?`, `showLabels?`, `color?`. Animated polygon on mount.
- **`src/components/visualizations/escalation-ladder.tsx`** — Glasl 9-stage visual ladder. Props: `currentStage` (1-9), `orientation?` (vertical/horizontal), `interactive?`, `onStageClick?`. Pulse ring on active stage, zone colors.
- **`src/components/visualizations/probability-tree.tsx`** — SVG BFS decision tree. Props: `nodes[]` ({id, label, probability, children?, type?}), `width?`, `height?`. Probability-colored nodes, bezier edges.
- **`src/components/visualizations/tornado-chart.tsx`** — Horizontal sensitivity/uncertainty chart. Props: `items[]` ({label, low, high, baseline?}), `title?`, `unit?`. Sorted by range width (most sensitive first).
- **`src/components/visualizations/sankey-flow.tsx`** — Flow diagram (layered column layout). Props: `nodes[]`, `links[]`, `width?`, `height?`. Curved fill paths proportional to value.
- **`src/components/visualizations/time-series-chart.tsx`** — SVG multi-series line chart. Props: `series[]` ({label, data: [{date, value}], color?}), `title?`, `height?`, `showArea?`. ResizeObserver responsive, hover crosshair.
- **`src/components/visualizations/heatmap-grid.tsx`** — Grid heatmap. Props: `rows`, `cols`, `data` (number[][]), `colorScale?` (risk/blue/diverging), `showValues?`. RGB lerp color interpolation.
- **`src/components/visualizations/force-graph.tsx`** — D3 v7 force-directed network. Props: `nodes[]` ({id, label, type?, size?, color?, data?}), `edges[]` ({source, target, label?, type?, weight?}), `onNodeClick?`, `selectedNodeId?`, `colorByType?`. D3 drag + zoom, arrow markers, hover tooltip.
- **`src/components/visualizations/compliance-tracker.tsx`** — Checklist tracker. Props: `items[]` ({id, label, status: compliant/partial/non-compliant/pending, category?, notes?}), `groupByCategory?`. Progress bar, collapsible categories.
- **`src/components/visualizations/index.ts`** — Barrel export for all 10 components.
- **`src/app/app/geospatial-monitor/page.tsx`** — Full geospatial monitor. `react-leaflet` (all imports via `dynamic(..., {ssr: false})`). CartoDB Dark Matter tiles. ACLED event markers by type (battles/explosions/VAC/protests/riots/strategic). Top-5 hotspot sidebar (cluster name, event count, fatalities, dominant type, risk badge). Timeline slider for date filtering. Stats bar (Events, Fatalities, Active Actors, Intensity Index). Fetches from `POST /api/data/geospatial`. Demo fallback: 50 Sudan events.
- **`src/app/demo/geospatial-monitor/page.tsx`** — Re-exports from `app/geospatial-monitor/page`.
- **`src/app/api/data/geospatial/route.ts`** — `POST` + `withAuth`. Demo: 50 hardcoded Sudan/Darfur events. Real: calls `getSituationIntelligence()` + `clusterEvents()`, extracts lat/lng events, 15-min cache, 200-event cap. Returns `{ events: GeospatialEvent[], hotspots: HotspotCluster[], fetchedAt }`.

### Updated Files
- **`src/app/app/dashboard/page.tsx`** — New `KpiCardsRow` (RiskGauge sm, Glasl stage badge, actor count, graph entities, data completeness ring). New `RiskRadarSection` (RadarChart 6 dimensions + bar list). New `EscalationStageSection` (horizontal EscalationLadder). New `AiInsightsPanel` (collapsible, streams `/api/ai/brief` on expand). All inserted after ActiveConflictSnapshot.
- **`src/app/app/risk-monitor/page.tsx`** — Overall Risk Gauge (lg, mean of monitored regions). 90-day TimeSeriesChart (Risk Score with area fill from RISK_TIMELINE_DATA). Risk Factor Sensitivity TornadoChart (5 factors, baseline=overallRisk). Multi-Dimensional RadarChart (5 dimensions averaged from regions).
- **`src/app/app/early-warning/page.tsx`** — Static Glasl stages replaced with interactive `<EscalationLadder currentStage={activeStage} interactive onStageClick>`. 60-day Indicator Trend TimeSeriesChart (2 series). Indicator Matrix HeatmapGrid (5 categories × 8 weeks, risk scale).
- **`src/app/app/stakeholder-map/page.tsx`** — New "Network Graph" tab with ForceGraph (D3 v7), type-colored nodes (government/armed/civil/international), search/filter bar, edge type legend, NodeDetailsPanel on click.
- **`src/app/app/conflict-graph/page.tsx`** — Internal GraphViewer replaced with ForceGraph. Entity type toggles + search filter. "AI Analyze Graph" button (POST `/api/ai/graph-analysis`). SelectedEntityPanel on node click.
- **`src/components/app/app-sidebar.tsx`** — Geospatial Monitor added to Intelligence section (Map icon). `'/geospatial-monitor': 'geospatial-monitor'` in HREF_TO_TOOL_ID.

### Sidebar Update (v4.3.0)
**Intelligence (11 items)**
Deep Research Agent · ARGUS Deep Research · ARGUS Grounded · Media Compass · Media Roundup · **Geospatial Monitor** (NEW) · Sanctions Tracker · Commitment Tracker · Treaty Analyzer · Alert Center · Deep Research

### Visualization Component Usage
Import individual components (not barrel) for tree-shaking:
```tsx
import { RiskGauge } from '@/components/visualizations/risk-gauge';
import { ForceGraph } from '@/components/visualizations/force-graph';
```
Or import from barrel for convenience: `import { RiskGauge, ForceGraph } from '@/components/visualizations'`

### Leaflet Notes
- Leaflet CSS: loaded via `useEffect(() => { import('leaflet/dist/leaflet.css') })` to avoid SSR
- All react-leaflet components: `dynamic(() => import('react-leaflet').then(m => m.Component), { ssr: false })`
- Icon path: `L.Icon.Default.imagePath = '/_next/static/...'` fixed in ConflictMap's useEffect

## v4.2.0 Simulation Engine: Game Theory tool, Scenario Planner overhaul, Negotiation Prep upgrades, Mediation Design additions

## What This Is
The "Bloomberg Terminal for conflict resolution." AI-native workspace for UN Political Affairs Officers, think tank analysts, diplomatic mediators. Two separate experiences in one codebase: a demo for prospects and a real situation-driven workspace for authenticated users. Deployed at praxis.tacitus.me (Vercel, iad1).

## v4.2.0 Simulation Engine & Analytical Tools (2026-03-31)

### New Files
- **`src/app/app/game-theory/page.tsx`** — Game Theory tool. 3-column layout: Setup (actor selector, strategy inputs) / Visualizations (Payoff Matrix SVG, Sequential Tree SVG, Archetype cards) / AI Analysis (6 collapsible sections). Demo mode: pre-computed Nordalia Prisoner's Dilemma. Real mode: situation actors auto-loaded, calls `/api/ai/game-theory`.
- **`src/app/demo/game-theory/page.tsx`** — Re-exports from `app/game-theory/page`.
- **`src/app/api/ai/game-theory/route.ts`** — Game theory AI route. `generateText + Output.object({ schema: GameTheoryOutputSchema })`. Returns actors, payoffMatrix, equilibria, gameArchetype, sequentialTree, analysis. 3 credits.

### Updated Files
- **`src/lib/constants/scenario-configs.ts`** — New `ScenarioParams` (8 numeric 0–100), `DEFAULT_PARAMS`, `PARAM_METADATA`. 10 presets (5 migrated + 5 new).
- **`src/app/app/scenarios/page.tsx`** — 8-slider panel, 10 preset cards, 3 methodology tabs, Theory Grounding Panel.
- **`src/app/api/ai/scenario/route.ts`** — Structured 6-section output, Glasl staging, probability estimates, 3 policy recommendations.
- **`src/app/app/negotiation-prep/page.tsx`** — ZOPAVisualizer wired, BATNA Matrix, Strategy Advisory, Historical Precedents, Theoretical Frameworks.
- **`src/app/app/mediation-design/page.tsx`** — Process Architecture Timeline, CBMs Designer, Spoiler Analysis, Ripeness Assessment, UNSCR 1325 Checklist.
- **`src/app/app/concordia/page.tsx`** — Hero section, Launch button, Feature Comparison Table, Integration Status.
- **`src/components/app/app-sidebar.tsx`** — Game Theory under Simulation (Σ icon), HREF mapping added.
- **`src/lib/api/with-credits.ts`** — `ai_game_theory: 3` added.

### Sidebar Update (v4.2.0)
**Simulation (5 items)**
Scenario Planner · Negotiation Prep · **Game Theory** (NEW) · CONCORDIA (TACITUS badge) · Mediation Designer

## v4.1.0 Data Layer & Intelligence Feeds (2026-03-31)

### New Files
- **`src/lib/data-feeds/unhcr-client.ts`** — UNHCR Refugee Data Finder (no API key). `getDisplacementStats()`, `getDisplacementTimeSeries()`, `getDisplacedToCountries()`. 1h cache.
- **`src/lib/data-feeds/ucdp-client.ts`** — UCDP Georeferenced Event Dataset (no API key). `getEvents()`, `getConflicts()`, `getBattleDeaths()`. 2h cache.
- **`src/lib/data-feeds/crisisgroup-client.ts`** — CrisisWatch scraper via Firecrawl (requires `FIRECRAWL_API_KEY`). `getCrisisWatch()` → `CrisisWatchEntry` with status/summary. 6h cache.
- **`src/lib/data-feeds/sipri-client.ts`** — SIPRI arms transfer scraper via Firecrawl. `getArmsTransfers()` → `SIPRIArmsSnapshot`. 12h cache.
- **`src/lib/analytics/geospatial-engine.ts`** — Geospatial analytics: `haversineDistance()`, `clusterEvents()` (iterative DBSCAN, stack-safe for 15k events), `geographicSpreadIndex()` (bounding box, 0–100), `detectMovement()` (N/S/E/W direction from centroid shift). Exports `HotspotCluster` and `MovementDetection`.

### Updated Files
- **`src/lib/data-feeds/acled-client.ts`** — Rate limiting (1200ms), 1h cache, `ACLEDActorSummary`/`ACLEDWeeklyTrend`, pagination to 15k, `fetchActors()`, `fetchEventTrend()`, `aggregateFatalities()`, `clusterByLocation()`.
- **`src/lib/data-feeds/gdelt-client.ts`** — `detectVolumeSpike()` Z-score anomaly, `aggregateTone()`, `getSourceCountries()`, CAMEO filtering on `searchArticles()`.
- **`src/lib/data-feeds/worldbank-client.ts`** — `WBGovernanceIndicators`/`WBEconomicSnapshot`, `getGovernanceIndicators()` (6 WGI), `getFragilityIndicators()`, `getTimeSeries()`, `getEconomicSnapshot()` with Gini/poverty.
- **`src/lib/data-feeds/hdx-client.ts`** — 60+ ISO3 mappings, `getIDPsByAdmin()`, `getNutrition()`, `getOperationalPresence()`, 30min cache.
- **`src/lib/data-feeds/reliefweb-client.ts`** — `fetchLatestSituationReports()`, `fetchDisasterUpdates()`, theme/source/language/date filter support.
- **`src/lib/data-feeds/unnews-client.ts`** — 6 RSS feeds (added Africa, Middle East, Int'l Law), `isSGStatement`/`isSecurityCouncil` flags, `fetchTopicalNews()`, SG/SC relevance boost.
- **`src/lib/data-feeds/feed-aggregator.ts`** — New `getConflictProfile()` merging all 9 sources with `SourceHealth[]`, `DataQuality`, `GovernanceSnapshot`, `ArmsFlowSnapshot`, `PopulationSnapshot`, UCDP conflicts, CrisisWatch status. 15-minute in-memory cache. Backwards-compatible `getSituationIntelligence()` unchanged.
- **`src/lib/analytics/risk-engine.ts`** — INFORM geometric mean `(H×V×C)^(1/3)`, `INFORMComponents`, `computeINFORM()`, `wgiToRiskScore()`, `getStageTransitionRisk()`. WGI params integrated into political risk dimension.
- **`src/lib/analytics/escalation-scorer.ts`** — Weighted event types (Battles×4, VAC/Explosions×3, Riots×2), `actorFragmentation`, `geographicSpread`, `weightedIntensity`, `stageTransitionProbability` on `EscalationAssessment`. New export `getStageTransitionProbability()`.
- **`src/app/api/data/intelligence/route.ts`** — 15-min per-user cache, `profile: true` mode activates `getConflictProfile()`, `maxDuration = 60`.

## v4.0.0 Foundation & Architecture Overhaul (2026-03-31)

### New Files
- **`src/types/situation.ts`** — Situation type system v2. New optional fields: `conflictClassification` (UCDP typology), `ucdpIntensity`, `informRiskIndex` (Hazard/Vulnerability/Coping), `fragileStatesIndex`, `gdpPerCapita`, `populationAffected`, `conflictOnsetDate`, `latestEventDate`, `geoBoundingBox`, `keyDates`, `linkedSituations`, `tags`, `analysisPhase`, `lastAiRefresh`, `dataCompleteness`. New types: `ToolCategory`, `ToolDefinition`, `ToolOutputType`, `ConflictClassification`, `UcdpIntensity`, `AnalysisPhase`.
- **`src/lib/constants/tool-registry.ts`** — Single source of truth for all 40 PRAXIS tools. Each entry has: id, name, category, description (2–3 sentences), shortDescription, credits, icon (Lucide), aiRoute, dataSchema, requiredSituationFields, outputType, frameworks[], dataSources[], relatedTools[], methodology (1–2 paragraphs with academic citations). Lookup helpers: `TOOL_BY_ID`, `TOOLS_BY_CATEGORY`, `getToolById()`, `getToolsByCategory()`, `getRelatedTools()`.
- **`src/lib/constants/frameworks.ts`** — 15 fully documented analytical framework constants with academic citations: Glasl Escalation (all 9 stages + zones + interventions), Fisher-Ury (all 4 principles + BATNA/ZOPA definitions), INFORM Risk Index, Barnett-Duvall Power Taxonomy (4 faces), Zartman Ripeness Theory, Stedman Spoiler Theory (3 types + management strategies), Mitchell-Agle-Wood Stakeholder Salience (7 types), OCHA Humanitarian Principles, IPC Food Security Phases (all 5), Lederach Peacebuilding Pyramid, Galtung Conflict Triangle (ABC + violence types), UN DPPA Brief Format, Berghof Mediation Framework (6 phases), Putnam Two-Level Games, Fearon Rationalist War Causes.

### Updated Files
- **`src/lib/ai/schemas/conflict-grammar.ts`** — Added `EntityEnrichmentSchema` with: `entityId`, `confidence` (0–1), `sourcePassage`, `sourceDocument`, `retrievalMethod` (extraction/inference/manual/lookup), `validFrom`, `validUntil`, `lastVerified`, `qualityScore` (0–100). Added `enrichments` map and `dataCompleteness` to `ConflictGraphSchema`. New export: `EntityEnrichment` type.

### New Tools (registry entries only — pages in Phase 4/5)
- **Game Theory** (`game-theory`) — Strategic interaction modeling: payoff matrices, Nash equilibria, Schelling focal points, Putnam two-level games, Fearon rationalist war causes. Category: simulation.
- **Geospatial Monitor** (`geospatial-monitor`) — Map-based ACLED/GDELT event visualization with hotspot clustering and territorial control overlays. Category: intelligence.

## v3.10.0 Deep Research Agent + Credits Overhaul (2026-03-30)
- **Deep Research Agent** — New tool at `/app/deep-search-agent` powered by Google ADK Multi-Agent System on Vertex AI Agent Engine (project: `praxisbytacitus`). Three-phase pipeline: Planning → Research (parallel web agents) → Synthesis (report composer). Live agent activity feed. Session persistence for multi-turn queries. Requires `VERTEX_AGENT_ENGINE_ID`.
- **`src/lib/ai/vertex-agent.ts`** — Full Vertex AI Agent Engine client: auth via `FIREBASE_SERVICE_ACCOUNT_KEY`, session create/stream, SSE parsing (5 formats), phase inference from ADK agent author names.
- **`POST /api/ai/deep-search-agent`** — Streaming API, 10 credits, 120s max, situation-enriched queries, session reuse.
- **`POST /api/admin/set-all-credits`** — Batch reset all users to 5000 credits (protected by CRON_SECRET).
- **Credits**: New users start at 5000 (was 100). Debug Panel top-up: +1000 (was 500). `ai_deep_search_agent: 10`.
- Sidebar: Deep Research Agent at top of Intelligence section with `TACITUS ADK` badge.

## v3.9.8 402/504/500 fixes (2026-03-30)
- Self-service credit top-up at `/api/admin/add-credits` (+1000 credits, wired to Debug Panel)
- actor-profiles `maxDuration` 60→120s (Gemini Pro + complex schema hit Vercel limit)
- dossier-generate `searchWeb` wrapped in 8s `Promise.race` (non-blocking timeout)
- 8 missing credit keys now explicit: `ai_actor_profiles`, `ai_commitment_scan`, `ai_info_environment`, `ai_mediation_design`, `ai_power_map`, `ai_media_roundup`, `media-roundup`, `research`

## v3.9.7 Debug Panel + AiPopulate fixes (2026-03-30)
- Debug Panel (`Ctrl+Shift+D`) — Floating console: API call log, elapsed times, HTTP status, service health
- AiPopulate: AbortController 90s timeout (no more infinite hangs), live elapsed counter, cancel button
- CSP: Google Analytics `connect-src` unblocked

## v3.9.6 Context Quality (2026-03-30)
- `buildToolContext()` expanded from 5 → 25 lines: risk label, Glasl stage, ACO 14-entity grammar, analytical standards. Propagates to all 34 AI routes.
- `situation-initializer.ts` fixed: `generateObject` → `generateText + Output.object()` (AI SDK v6)

## v3.7.0 Full UX Wiring (2026-03-29)
- Real-time credit sync via Firestore `onSnapshot` listener
- Pricing → login → checkout flow with `?plan=analyst` propagation
- CSP hardened, Stripe/HDX/WorldBank added
- See [CHANGELOG.md](./CHANGELOG.md) for full version history

## Tech Stack
Next.js 16.1.6 (App Router), TypeScript 5.9, Tailwind CSS 4, Radix UI, Vercel AI SDK (ai@6.0.105 + @ai-sdk/google + @ai-sdk/anthropic), Firebase Auth + Firestore + Admin SDK, Firecrawl (web intelligence), Google ADK (Vertex AI Agent Engine), google-auth-library, Zustand 5, D3.js 7, Framer Motion 12, Zod 4.

## Architecture (Dual-App)

### Route Structure
- `src/app/(landing)/` — Public landing page
- `src/app/(auth)/` — Login (Google + email/password + Demo Mode)
- `src/app/app/` — Real PRAXIS workspace (Firebase auth required, situation-driven, 38+ pages at /app/*)
- `src/app/demo/` — Demo workspace (cookie auth, pre-loaded Nordalia data, 38 pages at /demo/*)
- `src/app/api/` — API routes (68 total: 35 AI routes + auth, docs, data, admin, cron)

### Key Directories
- `src/lib/firebase/` — config.ts (client SDK), admin.ts (Admin SDK + verifyIdToken), firestore.ts (profiles/credits), situations-service.ts, graph-service.ts, reports-service.ts, scenarios-service.ts, chat-service.ts
- `src/lib/ai/` — providers.ts, tools.ts (21 tools), firecrawl.ts, vertex-agent.ts (ADK client), prompts/, schemas/
- `src/lib/api/` — with-auth.ts (Admin SDK token verification + rate limiting), with-credits.ts
- `src/lib/utils/` — routes.ts (useRoutePrefix, usePraxisRoute), cn.ts, format.ts
- `src/stores/` — app-store.ts, situation-store.ts (Zustand + persist), conflict-store.ts, report-store.ts, debug-store.ts, notification-store.ts, preferences-store.ts
- `src/hooks/` — use-situation-guard.ts, use-praxis-api.ts, use-keyboard-shortcuts.ts, use-conflict-data.ts, use-persisted-tool-data.ts
- `src/components/shared/` — praxis-link.tsx (auto-prefixes /app or /demo)
- `src/components/praxis/` — no-situation-state.tsx, no-data-state.tsx, error-states.tsx, loading-states.tsx, ai-populate.tsx
- `src/components/app/` — app-shell.tsx, app-sidebar.tsx, debug-panel.tsx, floating-praxis.tsx, header.tsx

### Navigation
All internal links use `PraxisLink` or `usePraxisRoute()` which auto-prefix with `/app` or `/demo` based on current context. Old bare paths (e.g., `/dashboard`) redirect to `/app/dashboard` via next.config.ts.

## Authentication
- **Real app** (`/app/*`): Firebase Auth (Google sign-in redirect + email/password). Middleware checks JWT in session cookie. API routes verify tokens via Firebase Admin SDK.
- **Demo** (`/demo/*`): Cookie-only (`{demo: true}`). No account needed. Pre-loaded Nordalia Crisis data.
- Auth state: `src/lib/auth/auth-context.tsx` (AuthProvider in root layout). Token refresh via `onIdTokenChanged()` + proactive 50-min refresh.
- Session cookie: `tacitus-auth-session` (httpOnly, secure, sameSite=lax)
- Rate limiting: 100 req/min per user on API routes
- IMPORTANT: Uses `middleware.ts` (NOT `proxy.ts` — proxy.ts broke Google Sign-In in v3.9.1, reverted in v3.9.2)

## Situation-Driven Data Model (Real App)
Every piece of data belongs to a situation. Users must create a situation first.

```
Firestore: users/{uid}/situations/{situationId}/
  ├── metadata (name, type, region, actors, status, riskScore)
  ├── conflict-grammar (extracted ACO entities)
  ├── graph/main (nodes + edges)
  ├── documents/{docId}
  ├── reports/{reportId}
  ├── scenarios/{scenarioId}
  ├── chats/{chatId}
  ├── briefings, dossiers, talking-points, risk-assessments...
```

All tool pages use `useSituationGuard()` hook — if no situation selected, shows NoSituationState.

## TACITUS Credits
- **5,000 credits on sign-up** (Firestore `users` collection — new in v3.10.0, was 100)
- Credit costs (authoritative in `src/lib/api/with-credits.ts`):
  - 1 credit: chat, terminology
  - 2 credits: scenario, extract, media, talking_points, grounded_search, advisor_chat, commitment_scan, media_roundup, morning_digest
  - 3 credits: analysis, research, resolution, media_scan, actor_enrichment, escalation_scan, argus, actor_brief, info_environment, mediation, negotiation, mediation_design, power_map, web_crawl
  - 4 credits: claude_analyze, dossier, actor_profiles, briefing_generate, risk_assessment, treaty_analyze, sanctions_scan
  - 5 credits: dossier_generate, report, deep_research
  - 10 credits: deep_search_agent (Vertex AI ADK)
- Demo users: unlimited (shown as ∞)
- Deducted via `with-credits.ts` in each AI route (atomic Firestore transaction)
- Self-service top-up: Debug Panel → "+1000 credits" → `POST /api/admin/add-credits`
- Bulk reset for all users: `POST /api/admin/set-all-credits` (CRON_SECRET required)

## Firestore Security Rules (deployed)
- `users/{uid}`: read/write only if auth.uid == uid
- `users/{uid}/situations/{sitId}/**`: read/write only if auth.uid == uid
- `credit_transactions`: read own only, write denied (server-only via Admin SDK)

## Conflict Grammar (ACO v2.0)
Core 8: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative
Extended 6: Institutions, Norms, Resources, Risks, Policies, Grievances
Zod schemas in `src/lib/ai/schemas/conflict-grammar.ts`.

## AI Tools — Complete List (40 tools + 68 API routes)
> Authoritative source: `src/lib/constants/tool-registry.ts` — `TOOL_REGISTRY` array.
> Each tool has: id, name, category, credits, aiRoute, frameworks[], dataSources[], methodology.

### Context (7 tools)
dashboard · documents · sources-library · timeline · humanitarian · calendar · conflict-graph

### Analysis (7 tools)
risk-monitor · early-warning · actor-profiles · stakeholder-map · compare · info-environment · power-map

### Drafting (7 tools)
assistant · report-studio · dossier · talking-points · briefing · auto-briefings · un-toolkit

### Simulation (5 tools)
scenarios · negotiation-prep · concordia · mediation-design · **game-theory** (v4.0 NEW)

### Intelligence (10 tools)
deep-search-agent · argus · media-compass · media-roundup · sanctions · commitments · treaty-analyzer · alert-center · deep-research · **geospatial-monitor** (v4.0 NEW)

### Workspace (4 tools)
cases · team · advisory · settings

## Cron Jobs (vercel.json)
- `/api/cron/check-alerts` — 06:00 UTC daily, GDELT-based alert generation
- `/api/cron/generate-briefing` — 05:00 UTC daily, auto-generates daily intelligence briefs for all active situations

## Deep Research Agent (Vertex AI ADK) — v3.10.0
- **Required env var**: `VERTEX_AGENT_ENGINE_ID` — Numeric ID of the Reasoning Engine on Vertex AI
- **Optional**: `VERTEX_AGENT_LOCATION` — Region (default: us-central1), `GOOGLE_CLOUD_PROJECT` (default: praxisbytacitus)
- **Auth**: Reuses `FIREBASE_SERVICE_ACCOUNT_KEY` service account (must have "Vertex AI User" IAM role)
- **Client library**: `src/lib/ai/vertex-agent.ts` — `getVertexAgentConfig()`, `createSession()`, `streamAgentTurn()`, `streamAgentQuery()`, `parseAgentEvent()`, `inferPhase()`
- **API route**: `POST /api/ai/deep-search-agent` — enriches query with situation context, creates/reuses session, re-streams ADK SSE, 10 credits, 120s maxDuration
- **Tool page**: `/app/deep-search-agent` — 3-phase UI (Planning/Research/Synthesis), live event feed, streaming report, copy button, 6 suggested queries, session persistence
- **Returns 503** if `VERTEX_AGENT_ENGINE_ID` not configured (graceful degradation)

## Demo vs Live Mode
- **Demo** (`/demo/*`): Pre-loaded Nordalia Crisis, cached AI responses, no API keys needed, unlimited credits
- **Real** (`/app/*`): User creates situations, live AI (Gemini/Claude), Firecrawl web research, credits deducted, data persisted in Firestore

## Floating Ask PRAXIS (v3.1)
- `src/components/app/floating-praxis.tsx` — Slide-over chat panel, dark navy theme
- Available on all /app/* and /demo/* pages except /assistant
- Header "Ask PRAXIS" button + `/` keyboard shortcut opens it, `Esc` closes
- Messages persist to localStorage (last 50 messages, keyed `praxis-floating-chat`)

## Debug Panel (v3.9.7)
- `src/components/app/debug-panel.tsx` — Floating bug icon bottom-left, `Ctrl+Shift+D` to toggle
- Shows: live credit counter, "+1000 credits" self-service top-up, service health dots, API event log (last 50 events)
- Red badge on error count, spinning on in-flight requests
- Available on all `/app/*` pages via `<DebugPanel />` in AppShell
- Connects to Zustand `debug-store.ts` — all AI routes log via `useDebugStore().log()`

## Mobile Responsive (v3.1)
- AppShell detects mobile via `matchMedia('(max-width: 768px)')`
- Sidebar becomes a fixed drawer overlay on mobile with backdrop
- Hamburger menu button in header (visible only on mobile)

## AiPopulate Pattern (v3.3 + improved v3.9.7)
- `src/components/praxis/ai-populate.tsx` — Auto-generates data on first tool visit
- 90-second AbortController timeout with elapsed timer and cancel button
- All structured tools: `generateText + Output.object()` with Zod schemas via `getProModel()` (gemini-2.5-pro)
- Data persisted to Firestore via `usePersistedToolData` hook (24h TTL, auto-restore)
- Source mode picker: all / web+docs / docs-only / llm-only
- **CRITICAL**: Real mode NEVER shows hardcoded demo data — all content is AI-generated from the user's active situation context via `buildToolContext(situation)`

## AI Model Tiers
- `getModel()` → gemini-2.5-flash — Chat, terminology, lightweight tasks
- `getProModel()` → gemini-2.5-pro — All structured tool generation
- `getAnalysisModel()` → claude-sonnet-4 (falls back to pro if no ANTHROPIC_API_KEY)
- `getGroundedModel()` → gemini-2.5-flash + Google Search grounding
- Vertex AI ADK — `streamAgentTurn()` in vertex-agent.ts — Deep Research Agent only

## Conventions
- `PraxisLink` for all internal navigation (auto-prefixes /app or /demo)
- `useSituationGuard()` at top of every tool page
- `usePraxisRoute()` for programmatic navigation (router.push)
- API routes use `withAuth()` wrapper (Admin SDK verification + rate limiting)
- AI routes use `checkAndDeductCredits()` before AI calls (rejects unauthenticated)
- Colors: Navy #0F172A, Emerald #10B981, Gold #E8B931, Diplomatic Blue #1B3A5C
- Fonts: EB Garamond headings, Inter body, JetBrains Mono code
- OG image: Dynamic via `src/app/opengraph-image.tsx`

## Env Vars
- `GOOGLE_AI_API_KEY` — Required for live AI (demo works without)
- `ANTHROPIC_API_KEY` — Optional, Claude deep analysis
- `AI_PROVIDER` — 'google' (default) or 'vertex'
- `FIREBASE_SERVICE_ACCOUNT_KEY` — Required for server-side Firestore + Vertex AI auth. JSON string from Firebase Console > Service Accounts.
- `FIRECRAWL_API_KEY` — Optional, web research
- `VERTEX_AGENT_ENGINE_ID` — Required for Deep Research Agent. Numeric Reasoning Engine ID from Vertex AI Agent Engine.
- `VERTEX_AGENT_LOCATION` — Optional, default: us-central1
- `GOOGLE_CLOUD_PROJECT` — Optional, default: praxisbytacitus
- `CRON_SECRET` — Required for cron job auth + `/api/admin/set-all-credits`
- `RESEND_API_KEY` — Optional, transactional email
- `NEXT_PUBLIC_SENTRY_DSN` — Optional, Sentry error monitoring
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe payments

## Sidebar Tool Sections (v4.0.0)
### Context (7 items)
Dashboard · Documents · Sources Library · Timeline · Humanitarian · Calendar · Conflict Graph

### Analysis (7 items)
Risk Monitor · Early Warning · Actor Profiles · Stakeholder Map · Power Map · Info Environment · Compare

### Drafting (7 items)
PRAXIS Assistant · Report Studio · Dossier Generator · Talking Points · Briefing Room · Daily Brief · UN Toolkit

### Simulation (5 items)
Scenario Planner · Negotiation Prep · **Game Theory** (v4.0) · CONCORDIA (TACITUS badge) · Mediation Designer

### Intelligence (10 items)
**Deep Research Agent (TACITUS ADK)** · ARGUS Deep Research · ARGUS Grounded · Media Compass · Media Roundup · **Geospatial Monitor** (v4.0) · Sanctions Tracker · Commitment Tracker · Treaty Analyzer · Alert Center

### Workspace (4 items)
Case Library · Team Hub · Advisory Council · Settings

## Analytical Frameworks Library (v4.0)
> Source: `src/lib/constants/frameworks.ts` — `ALL_FRAMEWORKS` export.
> Each constant includes: name, full academic citation, description, and structured components.

| Constant | Framework | Used By |
|---|---|---|
| `GLASL_ESCALATION_MODEL` | Glasl 9-Stage Escalation | early-warning, dashboard, timeline, scenarios |
| `FISHER_URY_FRAMEWORK` | Fisher-Ury Principled Negotiation | negotiation-prep, talking-points, actor-profiles |
| `INFORM_RISK_INDEX` | INFORM Risk Index (IASC) | risk-monitor, dashboard, humanitarian |
| `BARNETT_DUVALL_POWER` | Barnett-Duvall 4 Faces of Power | power-map, stakeholder-map |
| `ZARTMAN_RIPENESS` | Zartman Ripeness Theory | mediation-design, calendar, scenarios |
| `STEDMAN_SPOILER_THEORY` | Stedman Spoiler Management | mediation-design, scenarios |
| `MITCHELL_AGLE_WOOD` | Mitchell-Agle-Wood Stakeholder Salience | stakeholder-map, actor-profiles |
| `OCHA_HUMANITARIAN_PRINCIPLES` | OCHA Humanitarian Principles | humanitarian, briefing |
| `IPC_FOOD_SECURITY_PHASES` | IPC Food Security Phases | humanitarian, risk-monitor |
| `LEDERACH_PEACEBUILDING_PYRAMID` | Lederach Peacebuilding Pyramid | mediation-design, stakeholder-map |
| `GALTUNG_CONFLICT_TRIANGLE` | Galtung ABC Conflict Triangle | risk-monitor, info-environment |
| `UN_DPPA_BRIEF_FORMAT` | UN DPPA Situation Report Format | auto-briefings, briefing, report-studio |
| `BERGHOF_MEDIATION_FRAMEWORK` | Berghof Mediation Process | mediation-design, concordia |
| `PUTNAM_TWO_LEVEL_GAMES` | Putnam Two-Level Games | game-theory, negotiation-prep |
| `FEARON_RATIONALIST_WAR` | Fearon Rationalist War Causes | game-theory, scenarios |

## Tool Status Indicators (sidebar)
- Green dot: Tool has AI-generated data for the active situation
- Grey dot: Tool awaiting first generation
- Reads from `dashboard-snapshot` persisted tool data via `useToolStatuses()` in app-sidebar.tsx
- Applies to 21 mapped tools in `HREF_TO_TOOL_ID`
