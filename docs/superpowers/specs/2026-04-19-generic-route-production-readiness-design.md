# PRAXIS — Generic-Route Production Readiness + Tool Categorization

**Date:** 2026-04-19
**Status:** Approved in direction (user: "let's start working")
**Owner:** @Sargonx
**Supersedes nothing. Extends:** 2026-04-19 domain-taxonomy spec, 2026-04-18 onboarding-calibration spec.

---

## 1. What ships on the generic route (baseline every user starts on)

The generic route is the PRAXIS baseline — no domain specialisation, every lens weighted equally, all 15 frameworks available, all feeds eligible. It must work end-to-end before we ship a single domain pack. Premium domain packs (armed-conflict, humanitarian, etc.) are additive on top of this baseline.

### 1.1 Generic route complete surface

```
┌─ First login ──────────────────────────────────────────────────────────────┐
│  Google / email auth → onAuthStateChanged                                  │
│  middleware sees onboarded:false → redirects /onboarding                   │
└────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─ Onboarding (3 screens, ≤3 min) ───────────────────────────────────────────┐
│  Step 1 Identity ─ role, seniority, org, team                              │
│  Step 2 Perspective ─ primary domain, secondary domains, mandate, lenses,  │
│                       regions, audience                                    │
│  Step 3 Working style ─ source categories, language, red lines, style      │
│  Completion screen ─ "Create first situation" | "Go to dashboard"          │
└────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─ Dashboard (empty state) ──────────────────────────────────────────────────┐
│  Header with profile button (top-right) → opens profile dropdown           │
│  WelcomeState card: "Create your first situation" CTA                      │
│  Sidebar: tools shown but disabled until a situation is active             │
└────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─ Situation wizard (4 steps) ───────────────────────────────────────────────┐
│  Step 1 Describe ─ name, type, region, description, status                 │
│  Step 2 Actors ─ list + roles                                              │
│  Step 3 Sources ─ URLs (paste), file uploads (drag), source categories     │
│  Step 4 Review ─ summary + auto-classified domain (one-click override)     │
│                  → POST /api/situations with domain → redirect dashboard   │
└────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─ Dashboard (situation active) ─────────────────────────────────────────────┐
│  SituationDashboard: Daily brief, situation health, recent activity,       │
│    tool semaphores (seeded / stale / researching), quick ingest            │
│  Sidebar: tools enabled — all 40 generic-route tools clickable             │
│  Floating Praxis assistant (chat overlay)                                  │
└────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─ Tool pages — 40 generic-route tools, grouped in 6 categories (§3) ────────┐
│  Every tool: useSituationGuard → ToolPageShell → calls its AI route        │
│  Every AI route: withCalibration → reads profile + situation + domain      │
│                  → persists output to users/{uid}/situations/{sid}/tools   │
└────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Edit surfaces (the user can change everything, any time)

Three editable persistence layers, accessible from the header profile dropdown:

- **User profile** at `/app/settings/profile` — full AnalystProfile editor (reuses onboarding step components).
- **Situation preferences** at `/app/situations/[id]/settings` — domain, sources, actors, region, context notes, timeline.
- **Workspace settings** at `/app/settings` — credits, API keys, model prefs, graph backend, theme, language.

Every write bumps the relevant version counter (profile.meta.version, situation.updatedAt) and refreshes calibrated context on next tool invocation.

---

## 2. Production readiness checklist (GENERIC route only)

This is the bar the generic route must clear before we ship any premium domain pack.

### 2.1 Infrastructure

- [x] Frontend + backend on Cloud Run, redeployed to include the latest commits
- [x] Firestore Native rules allow authenticated reads of `config/domains/*`
- [x] App Check reCAPTCHA Enterprise registered for praxis.tacitus.me
- [ ] App Check enabled in production (`NEXT_PUBLIC_FIREBASE_APPCHECK_ENABLED=true`)
- [ ] Domain seed run in production (`scripts/seed-domains.ts`)
- [ ] ADMIN_ALLOWLIST env var set for /app/admin/domains access
- [x] Vertex AI enabled via `AI_PROVIDER=vertex` on Cloud Run
- [ ] Sentry frontend + backend error telemetry enabled (backend already wired)
- [ ] BigQuery warehouse: `tool_outputs`, `onboarding_events`, `domain_changes` tables
- [ ] Pub/Sub topics: `praxis.profile.events`, `praxis.tool.completed`

### 2.2 Core flow polish (this spec's P1–P5 below)

- [ ] Profile edit UI at `/app/settings/profile` (P1)
- [ ] Situation settings page at `/app/situations/[id]/settings` (P2)
- [ ] Header profile dropdown: link Profile → /app/settings/profile (one-liner)
- [ ] Onboarding visual system merged into /app (graphic coherence)
- [ ] Situation wizard Step 3: drag-and-drop source ingestion with category badges (P3)
- [ ] Dashboard: "Questions your profile suggests you should ask today" card (P4)
- [ ] Every Tier 1 tool reads `withCalibration` context + persists via `saveToolOutput` (P5)

### 2.3 Data model completeness

- [x] AnalystProfile v2 with primaryDomain + secondaryDomains
- [x] Situation v4 with domain + domainConfidence + domainClassifiedAt
- [ ] Situation Episodes subcollection (v3 — timeline)
- [ ] Situation Preferences extension: sourcePreferences (category on/off + custom URLs), languagePreference override, toneOverride
- [ ] Tool output provenance: profileVersion + domainVersion on every write (half-done)

### 2.4 Security + abuse

- [x] Firestore rules owner-only with credit fields write-protected
- [x] Session cookies HMAC-signed
- [x] CSP with nonce + strict-dynamic
- [ ] App Check enforcement enabled in Firebase Console (Step 1: monitor for 48h, Step 2: enforce)
- [ ] Rate limiting on AI endpoints (per-uid token bucket)
- [ ] Audit log for admin domain edits (already writes `config/domains_history/{id}_{v}`)

---

## 3. Generic-route tool categorization (40 tools, 6 categories)

Every generic-route user sees all 40 tools. Categories are organisational, not gating. Order within each category is by user frequency estimates.

### Category A — Context (situation understanding)
Purpose: build the analyst's mental model of the situation.

| # | Tool | Route | Model tier | Calibrated? |
|---|------|-------|-----------|-------------|
| 1 | Dashboard | `/app/dashboard` | — | N/A (view) |
| 2 | Conflict Graph | `/app/conflict-graph` | Pro | pending |
| 3 | Actor Profiles | `/app/actors` | Pro | pending |
| 4 | Timeline | `/app/timeline` | Flash | pending |
| 5 | Documents | `/app/documents` | — | N/A |
| 6 | Sources Library | `/app/sources` | — | N/A |
| 7 | Calendar | `/app/calendar` | Flash | pending |
| 8 | Humanitarian | `/app/humanitarian` | Pro | pending |

### Category B — Analysis (structured assessment)
Purpose: apply frameworks to produce defensible judgments.

| # | Tool | Route | Model tier | Calibrated? |
|---|------|-------|-----------|-------------|
| 9 | Risk Monitor | `/app/risk-monitor` | Pro | pending |
| 10 | Early Warning | `/app/early-warning` | Pro | pending |
| 11 | Stakeholder Map | `/app/stakeholder-map` | Pro | pending |
| 12 | Power Map | `/app/power-map` | Pro | ✅ |
| 13 | Info Environment | `/app/info-environment` | Pro | pending |
| 14 | Compare | `/app/compare` | Pro | pending |
| 15 | Advisory | `/app/advisory` | Pro | ✅ |

### Category C — Drafting (written output)
Purpose: convert analysis into deliverables.

| # | Tool | Route | Model tier | Calibrated? |
|---|------|-------|-----------|-------------|
| 16 | Assistant (chat) | `/app/assistant` | Flash | pending |
| 17 | Report Studio | `/app/reports/new` | Pro | pending |
| 18 | Dossier | `/app/dossier` | Pro | ✅ |
| 19 | Talking Points | `/app/talking-points` | Pro | pending |
| 20 | Briefing Room | `/app/briefing` | Pro | pending |
| 21 | Daily Brief | `/app/auto-briefings` | Flash | pending |
| 22 | UN Toolkit | `/app/un-toolkit` | Pro | pending |
| 23 | Policy Memo | `/app/policy-memo` | Pro | pending |

### Category D — Simulation (what-if modelling)
Purpose: stress-test decisions before taking them.

| # | Tool | Route | Model tier | Calibrated? |
|---|------|-------|-----------|-------------|
| 24 | Scenarios | `/app/scenarios` | DeepThink | pending |
| 25 | Negotiation Prep | `/app/negotiation-prep` | Pro | pending |
| 26 | Game Theory | `/app/game-theory` | DeepThink | ✅ |
| 27 | CONCORDIA | `/app/concordia` | Pro | pending |
| 28 | Mediation Designer | `/app/mediation-design` | Pro | pending |

### Category E — Intelligence (external signals)
Purpose: pull the outside world into the analyst's workspace.

| # | Tool | Route | Model tier | Calibrated? |
|---|------|-------|-----------|-------------|
| 29 | Deep Research Agent | `/app/deep-search-agent` | Vertex ADK → Flash+Search | pending |
| 30 | ARGUS | `/app/argus` | Pro | pending |
| 31 | Media Compass | `/app/media-compass` | Pro | pending |
| 32 | Media Roundup | `/app/media-roundup` | Flash | pending |
| 33 | Geospatial | `/app/geospatial-monitor` | Pro | pending |
| 34 | Sanctions Tracker | `/app/sanctions` | Pro | pending |
| 35 | Commitments Tracker | `/app/commitments` | Pro | pending |
| 36 | Treaty Analyzer | `/app/treaty-analyzer` | Pro | pending |
| 37 | Alert Center | `/app/alerts` | Flash | pending |

### Category F — Workspace (account + collaboration)
Purpose: manage the analyst's work, not produce analysis.

| # | Tool | Route | Model tier | Calibrated? |
|---|------|-------|-----------|-------------|
| 38 | Cases | `/app/cases` | — | N/A |
| 39 | Team | `/app/team` | — | N/A |
| 40 | Settings | `/app/settings` | — | N/A |

**Calibration coverage today: 3/40 (advisory, power-map, game-theory). Target for generic-route GA: 40/40 (exempt: Cases, Team, Settings, Dashboard, Documents, Sources Library, Calendar — these don't produce AI output).** So 33 AI routes need `withCalibration` wrap.

---

## 4. Premium domain packs (post-generic-GA)

Each of the 10 specific domains adds 4–8 domain-specific tools on top of the generic 40. These are the first candidates for the premium tier.

| Domain | Candidate premium tools |
|--------|-------------------------|
| armed-conflict-security | Battle Tracker, ORBAT Builder, Ceasefire Monitor, Force Laydown, Weapons Flow Tracker |
| diplomacy-negotiation | Treaty Drafting Studio, Multilateral Vote Forecast, Speech Analyzer, Back-channel Memo |
| humanitarian | IPC Phase Monitor, Protection Cluster Dashboard, Cash Programming Modeler, Access Map |
| human-rights | Violation Documentation, Case Matrix (ICC), UPR Submission Drafter, TJ Instrument Comparator |
| governance-rule-of-law | Electoral Integrity Index, Constitutional Clause Library, Judicial Independence Monitor |
| economic-sanctions | Sanctions Impact Modeler, Trade Flow Analyzer, Commodities Tracker, Oligarch Network Map |
| development-stabilization | SDG Progress Board, Peacebuilding Index Tracker, Reconstruction Cost Estimator |
| climate-environmental-security | Water Stress Monitor, Displacement Forecaster, Resource Conflict Map |
| information-cyber | Disinformation Detection, Attribution Toolkit, Campaign Timeline, Narrative Heatmap |
| transnational-threats | OCG Network Atlas, Illicit Flow Tracker, WMD Proliferation Monitor |

Pack pricing model (suggested): each pack adds $X/mo to the Diplomat tier ($29/mo base). Ambassador tier ($99/mo) includes all packs.

---

## 5. Architecture — how context flows from user to every tool

```
┌─────────────────────────────────────────────────────────────────────────┐
│ USER PROFILE (users/{uid}/profile/analyst)                              │
│   identity.role, identity.seniority, identity.org                       │
│   perspective.primaryDomain → DomainConfig (inherited from generic)     │
│   perspective.secondaryDomains[] → weight boosts                        │
│   perspective.mandate (1-3 sentences)                                   │
│   perspective.lenses[] (ordered)                                        │
│   perspective.regions[] (8 max)                                         │
│   perspective.audience                                                  │
│   workingStyle.sourceCategories[]                                       │
│   workingStyle.language (en|fr|es|ar|ru|zh)                             │
│   workingStyle.redLines[]                                               │
│   workingStyle.analyticalStyle (rapid_brief | deep_dive)                │
│   meta.version (bumps on every edit)                                    │
│   embedding (768-d Gemini embedding of mandate + lenses)                │
└─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ SITUATION (users/{uid}/situations/{sid})                                │
│   name, type, region, description, actors[], userRole, status           │
│   domain, domainConfidence, domainOverriddenByUser, domainVersion       │
│   sourceUrls[], contextNotes, initialDocumentIds[]                      │
│   riskScore, glaslStage, escalationTrend                                │
│   documents subcollection (extractedText per document)                  │
│   episodes subcollection (chronological event cards — NEW §6)           │
│   tools subcollection (cached tool output per toolId — NEW §7)          │
│   sourcePreferences (category on/off, per-situation overrides — NEW)    │
└─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ buildCalibratedContext(uid, situationId, toolId)                        │
│   1. Read profile (falls back to neutral defaults)                      │
│   2. Read situation (if situationId)                                    │
│   3. resolveUserDomain(profile) → userDomain                            │
│   4. resolveDomain(situation.domain) → situationDomain                  │
│   5. mergeUserAndSituationDomains(userDomain, situationDomain)          │
│   6. Optionally: SKC retrieval (Firestore vector KNN, top-K chunks)     │
│   7. Render systemPromptBlock XML:                                      │
│      <analyst-profile version="N">...</analyst-profile>                 │
│      <situation-frame>...</situation-frame>                             │
│      <situation-episodes>...</situation-episodes>      [NEW §6]         │
│      <domain-frame id="..." version="N">...</domain-frame>              │
│      <retrieved-knowledge>...</retrieved-knowledge>                     │
│      <output-constraints>...</output-constraints>                       │
│   8. Return ContextBlock { systemPromptBlock, outputConstraints,        │
│                             toolContext, domain, provenance }           │
└─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ withCalibration(toolId, creditOp)(handler) wraps every AI route         │
│   → handler receives ctx.calibration automatically                       │
│   → handler prepends calibration.systemPromptBlock to its AI call        │
│   → after success: saveToolOutput(uid, situationId, toolId, output)     │
│   → Firestore write triggers onSnapshot in client → UI updates live     │
│   → Optional: publish tool.completed to Pub/Sub for BigQuery stream      │
└─────────────────────────────────────────────────────────────────────────┘
```

**Every tool is the same shape. The delta between tools is only the prompt template and the output schema.** This is the leverage the calibration contract provides — once the infrastructure is correct, all 33 AI tools can be upgraded in mechanical passes.

---

## 6. Situation Episodes — the chronology layer (NEW)

### Why

Tools produce better analysis when they know not just what a situation *is* but how it *evolved*. An analyst working on "Nordalia Crisis 2026" needs the AI to reference "the 2023 spoiler coalition" or "the 2024 ceasefire collapse" by name, not reinvent them each call.

### Data model

```
users/{uid}/situations/{sid}/episodes/{episodeId}
  id               string
  title            string                  (1-100 chars, displayable)
  date             string (ISO 8601)       (approximate ok, e.g., "2023" or "2023-06")
  dateConfidence   'exact' | 'month' | 'year' | 'approximate'
  description      string                  (2-4 sentences)
  actors           string[]                (actor ids referenced — links to Actor Profiles)
  importance       1-5                     (1=minor, 5=pivotal)
  tags             string[]                (free-form: "ceasefire", "coup", "election")
  sources          { url: string; title?: string }[]
  extractedBy      'user' | 'ai' | 'imported'
  extractedAt      Timestamp
  profileVersion   number                  (provenance)
  domainVersion    number                  (provenance)
  deletedAt        Timestamp | null        (soft delete so AI retains memory but UI hides)
```

### Extraction pipeline

On situation creation, `/api/ai/auto-structure` (migrated to `withCalibration`) also runs an episode extractor:
1. Pulls `description + contextNotes + first-3-source-url snippets` through Gemini Pro.
2. Structured output via `Output.object()` → array of 3–12 `Episode` objects.
3. Firestore batch-write into the episodes subcollection.
4. Tools can now see the timeline.

User can manually add/edit/delete episodes from the Situation Settings > Timeline tab.

### Injected into every tool

`renderSystemPromptBlock` gains a `<situation-episodes>` section:

```xml
<situation-episodes count="N">
  [1] 2023-06 "Ceasefire collapse" — actors: SAF, RSF. Importance 5/5.
    Brief description...
  [2] 2024-01 "Regional forum walkout" — actors: AU, EU. Importance 3/5.
    ...
</situation-episodes>
```

Token cost is bounded: cap to top 8 episodes by importance, description ≤ 160 chars each.

---

## 7. Tool output persistence + reuse

Every calibrated AI route writes via `saveToolOutput`:

```
users/{uid}/situations/{sid}/tools/{toolId}
  generatedAt         Timestamp
  profileVersion      number
  domainVersion       number
  domainId            string
  situationUpdatedAt  Timestamp (frozen at generation time)
  output              <tool-specific JSON>
  inputDigest         string (SHA-256 of inputs — skip regeneration if unchanged)
  outputDigest        string (SHA-256 of output)
  tokensIn            number
  tokensOut           number
  creditsSpent        number
  modelUsed           string
```

Dashboard surfaces every tool's freshness (the green/amber/red semaphore already in `SituationHealthWidget`).

`usePersistedToolData(toolId, sid)` hook is the universal client read — 1 Firestore onSnapshot per (situation, tool), shared across all mounts of the same tool page.

---

## 8. Source ingestion — structured, drag-and-drop, categorised

Today's situation wizard Step 3 has source categories as radio toggles. This becomes a richer 3-panel drag-and-drop UI:

- **Panel A: source categories** (8 categories from `SOURCE_CATEGORIES`): Foundational, Conflict & Security, Humanitarian, Diplomatic, Media & News, Academic, Legal & IHL, Economic. Each is a toggle + shows the underlying feeds it enables.
- **Panel B: drop zone** — drag files in (PDF, DOCX, TXT, CSV, geoJSON). On drop, each file is:
  1. Categorised automatically (via Gemini Flash quick classifier).
  2. Shown with a category badge the user can override.
  3. Uploaded fire-and-forget with the situationId.
- **Panel C: URL paste list** — multi-line paste, one URL per line. Same categoriser assigns a category + shows source-type icon (news site, government release, academic paper, report, video).

Result on Create: `sourceUrls[]`, `initialDocumentIds[]`, and `sourcePreferences` (category on/off map) all persist. Tools read `sourcePreferences` to filter feed results.

**Persistence** extends Situation:

```
situation.sourcePreferences: {
  categories: { [categoryId]: boolean }
  customFeeds: { id: string; url: string; categoryId: string }[]
  excludedDomains: string[]        // user-level "don't trust this site"
  languages: string[]              // filter sources to these languages
  dateRange?: { from: string; to: string }
}
```

---

## 9. Profile edit UI (P1 of build sequence)

Extract the three onboarding step components into a reusable `<AnalystProfileEditor>`. Three tabs at `/app/settings/profile`:

1. **Identity** — role, seniority, org, team (read-only from Firebase Auth for email/displayName).
2. **Perspective** — primary domain, secondary domains, mandate (with live AI chip suggestions), lenses (drag-to-reorder), regions, audience.
3. **Working style** — source categories, language, red lines, analytical style.

"Save" on any tab calls `PATCH /api/onboarding/profile` (already exists), bumps `meta.version`, writes immutable snapshot to `users/{uid}/profile_versions/v{N}`, publishes `profile.events` Pub/Sub message → Vertex Memory Bank refresh.

Header profile dropdown "Profile" menu item routes to `/app/settings/profile` (the current read-only settings page becomes `/app/settings` general).

---

## 10. Situation settings page (P2)

Route: `/app/situations/[id]/settings`. Tabbed, all tabs call `PATCH /api/situations/[id]` (already exists).

1. **Context** — name, type, region, description, userRole, status.
2. **Domain** — primary domain picker (with the current auto-classified pick highlighted), override reason.
3. **Actors** — add/remove/rename, role per actor.
4. **Sources** — same 3-panel UI from §8 (drag, categorise, edit).
5. **Timeline** — list of episodes, manual add/edit/delete.
6. **Preferences** — source categories on/off, language override, date range.
7. **Danger zone** — archive, duplicate, export, delete.

---

## 11. Build sequence

P0 (deploying now): Onboarding rock-solid (situation-creation fix + Firestore rules + App Check gate).

**P1 — Profile edit UI** (~3 hours)
- Extract onboarding steps into `<AnalystProfileEditor>` component.
- `/app/settings/profile` route.
- Header dropdown wiring.
- Acceptance test: user edits domain, saves, new tool run uses new domain.

**P2 — Situation settings page** (~4 hours)
- `/app/situations/[id]/settings` with 7 tabs.
- Drag-and-drop source ingestion (§8).
- Auto source categoriser endpoint `/api/ai/classify-source`.
- Acceptance test: user changes situation's domain, re-runs a tool, output reflects the new domain.

**P3 — Situation Episodes** (~4 hours)
- Episode type + Firestore subcollection.
- `/api/ai/extract-episodes` endpoint wrapped in `withCalibration`.
- Timeline tab in Situation Settings.
- `<situation-episodes>` injection into system prompt block.

**P4 — Tier 1 tool calibration migration** (~8 hours)
- Wrap the 10 Tier 1 tools (Dashboard, Assistant, Conflict Graph, Actor Profiles, Risk Monitor, Early Warning, Report Studio, Daily Brief, Deep Research, Scenarios) with `withCalibration` + `saveToolOutput`.
- CI guard: `scripts/audit-tool-calibration.ts` passes 11/11 on Tier 1.

**P5 — Tier 2 tool calibration migration** (~8 hours)
- Wrap the 12 Tier 2 tools (Stakeholder Map, Info Environment, Compare, Media Compass, Dossier, Talking Points, Briefing Room, Mediation Designer, CONCORDIA, Negotiation Prep, Game Theory, Power Map — last three already done).
- Ship premium-domain-pack placeholder UI in sidebar ("Upgrade to unlock Armed Conflict Pack" etc.).

**P6 — Tier 3 feed/monitor tool migration** (~6 hours)
- Wrap the 11 Tier 3 tools (ARGUS, Media Roundup, Source Monitor, Alert Center, Geospatial, Humanitarian, Sanctions, Commitments, Treaty, Timeline, Policy Memo).
- Feed-heavy; Memory Bank write (dim 9) is exempt per spec.

**P7 — Tier 4 specialised tool migration** (~4 hours)
- Wrap remaining specialised tools (Electoral Risk, Economic Impact, Peacebuilding Index, Human Rights, External Actors, UN Toolkit).
- These are already domain-adjacent; migration is mechanical.

**P8 — GCP observability completeness** (~3 hours)
- Create BigQuery tables `tool_outputs`, `onboarding_events`, `domain_changes`.
- Create Pub/Sub topics `praxis.profile.events`, `praxis.tool.completed`.
- Dataflow stream `tool.completed` → `tool_outputs` table.
- Looker Studio onboarding funnel dashboard.

Total: ~40 focused hours to ship the generic route to production-ready. Premium domain packs ship after — same infrastructure, additional per-pack tool bundles.

---

## 12. Success criteria for generic-route GA

1. **First-login → first tool output in 5 min median** (measured via `onboarding_events` BigQuery table).
2. **Zero React error #300 occurrences over 48h post-deploy** (Sentry).
3. **All 40 generic-route tools render without error for an onboarded non-demo user.**
4. **33/33 AI tools pass the calibration audit (11/11 dimensions each).**
5. **User can change any profile field from Settings in ≤3 clicks; next tool run respects the change.**
6. **User can change any situation field from Situation Settings in ≤3 clicks; next tool run respects the change.**
7. **Timeline with ≥3 episodes appears within 90s of situation creation** (auto-extraction completes).
8. **App Check enforces reCAPTCHA attestation in production; unauthorized origins rejected 100% at Firebase.**
9. **Admin UI at `/app/admin/domains` edits a domain; next tool run picks up the change within 5 min (cache TTL).**
10. **Daily AI spend per active user is within budget** (Looker Studio dashboard tracks per-uid token spend).

---

## 13. Open decisions to align on

1. **Premium pack pricing model** — per-pack addon vs all-packs-included tier. This spec assumes 10 packs, Ambassador includes all.
2. **App Check enforcement rollout window** — recommend monitor for 48h before flipping to enforce so we don't break legitimate traffic during DNS / CDN warmup.
3. **Episode auto-extraction depth** — 3-12 per situation. Beyond 12 is noise; under 3 is too sparse. Configurable per situation in Timeline tab.
4. **Tier 1 tool set** — current list is opinionated. If your analytics differ (e.g., ARGUS is more used than Deep Research), reorder.
5. **Localisation** — generic route ships English-first. Language support for AI outputs is already per-profile; UI chrome (sidebar labels, tooltips) remains English. i18n layer ships post-GA.
