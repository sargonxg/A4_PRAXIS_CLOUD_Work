# Foundation Hardening — Design

**Date:** 2026-04-21
**Author:** PRAXIS platform
**Status:** Draft for review
**Scope:** Single coherent spec covering (1) canonical user+situation+preferences context contract, (2) onboarding polish, (3) profile management with Ask-Praxis mutation and delete/export, (4) Advisor Council v2 with 4 flagship advisors and upgraded infrastructure, (5) production-grade audit and fix for six flagship tools, (6) GCP access audit, and (7) a roadmap document sequencing improvement work for the remaining 34 tools.

---

## 1. Background and Motivation

PRAXIS already has a calibrated AI workspace (`withCalibration` middleware, `<analyst-profile>` + `<situation-frame>` + `<output-constraints>` + `<domain-frame>` prompt blocks, 51 AI routes, 10 advisor personas, a 3-step onboarding wizard, and a profile editor). The platform works, but the foundation layer is uneven:

- Some tools are wrapped in calibration, some are not; no enforcement.
- Some tools have graph + feed context, others rely only on the raw situation summary.
- Advisor Council has breadth (10 personas) but no depth: no session memory, no dedicated source stack, single model tier, no admin editability.
- Profile management is read-mostly: editing from chat, deleting, and exporting are absent.
- The six tools the user touches first — Dashboard, Conflict Graph, Timeline, Stakeholder Map, Early-Warning (Escalation Monitor), and Info Environment — need a pass that makes every one of them deliver a sound, production-grade experience with unambiguous purpose, methodology, inputs, outputs, empty states, error states, and persistence.
- No canonical GCP-readiness check: Vertex, BigQuery, Pub/Sub, Scheduler, Secret Manager, Functions, and Storage access is assumed rather than verified.
- No single place that tells the team what each of the other 34 tools needs, in what order, with what effort and dependencies.

This spec closes those gaps in one cycle so every downstream feature stands on rock.

## 2. Goals

1. Every AI route drinks from one canonical `ContextBlock` and is wrapped in `withCalibration`. No exceptions.
2. Onboarding reliably sets `meta.completedAt`, supports resume-on-refresh and re-run-from-settings, and reports skip telemetry back to the user.
3. Users can edit, export, and delete their analyst profile — from the settings UI and conversationally through Ask Praxis, with human-readable diffs and an explicit confirmation step for mutations.
4. The Advisor Council collapses to 4 deeply-specialised flagships, each with its own model tier, source-category whitelist, session memory, briefing prefetch, and admin-editable Firestore config.
5. Six flagship tools pass a uniform production-grade checklist and deliver analyst-worthy outputs with the methodology documented in-product.
6. A repeatable GCP audit script (`npm run audit:gcp`) returns non-zero when any required service, IAM role, env var, or resource is missing.
7. A roadmap doc sequences the remaining 34 tools into five phases with per-tool effort and dependencies.

## 3. Non-Goals

- Building the remaining 34 tools (only sequenced in the roadmap).
- Backend pipeline changes (ACO extraction, graph build, analysis) beyond what the six tools consume.
- Multi-tenant / team-workspace features (Part 4 blueprint covers those).
- New data-feed integrations beyond the existing 11 sources.
- Mobile or desktop packaging.

## 4. User / Situation / Preferences Context Contract

### 4.1 Extended `ContextBlock` schema

`ContextBlock` currently carries `profile`, `situation`, `domain`, `retrieval`. Extend to:

```ts
interface ContextBlock {
  profile: AnalystProfile;              // unchanged
  situation: SituationFrame | null;     // unchanged
  domain: MergedDomainConfig;           // unchanged
  retrieval: RetrievalHits | null;      // unchanged
  preferences: UserPreferences;         // NEW
  interaction: InteractionFrame | null; // NEW (optional)
  advisor: AdvisorFrame | null;         // NEW (optional)
  systemPromptBlock: string;            // rendered XML
  outputConstraints: OutputConstraints;
  provenance: Provenance;
}

interface UserPreferences {
  citationStyle: 'un-footnote' | 'apa' | 'author-date' | 'inline-links';
  defaultReportLength: 'brief' | 'standard' | 'deep';
  defaultLanguage: 'en' | 'fr' | 'es' | 'ar' | 'ru' | 'zh';
  confidenceLabelling: 'icd-203' | 'plain';
  defaultTimeHorizon: '30d' | '90d' | '180d' | '365d';
  preferredAdvisor: AdvisorId | null;
}

interface InteractionFrame {
  recentTools: Array<{ toolId: string; ranAt: string; summary: string }>; // last 10
  activeSituationDrafts: number;
}

interface AdvisorFrame {
  advisorId: AdvisorId;
  rollingSummary: string; // 3-sentence rolling summary of prior turns
  lastTurnAt: string;
}
```

`UserPreferences` is stored at `users/{uid}/preferences` (single doc). `InteractionFrame` is derived at request time from the last 10 `saveToolOutput` writes. `AdvisorFrame` is injected only when the request is fired from within an advisor chat thread.

### 4.2 `<preferences>` block in system prompt

`renderSystemPromptBlock` gains a `<preferences>` child emitted after `<output-constraints>`:

```xml
<preferences>
  <citations>un-footnote</citations>
  <length>standard</length>
  <language>en</language>
  <confidence>icd-203</confidence>
  <time-horizon>90d</time-horizon>
</preferences>
```

Every tool's Zod output schema inherits length/confidence/language constraints from preferences by default; a route may override when it has its own opinion (e.g., Talking Points is always brief).

### 4.3 Audit and enforcement

A new file `scripts/audit-ai-routes.ts` walks `src/app/api/ai/**/route.ts`, asserts each exports a handler wrapped in `withCalibration(...)`, emits a report, and exits non-zero on failure. CI gate.

## 5. Onboarding Polish

### 5.1 Fixes

- **Completion write race.** Step-3 submit writes `meta.completedAt` in the same transaction as the profile snapshot, not as a follow-up write. Middleware redirect uses a single Firestore read.
- **Resume-on-refresh.** Onboarding draft is persisted to `users/{uid}/profile/onboarding_draft` on every field change (debounced 800 ms). Returning to `/onboarding` restores state.
- **Re-run from settings.** `/app/settings/profile` gains a **Review onboarding** link that routes to `/onboarding?resume=1`, loading the last completed values so the user can edit inside the wizard UI.
- **Skip nudge.** If `onboardingSkipCount ≥ 2`, a dismissible banner appears on the app shell offering a 2-minute re-take.
- **Preview parity.** Live-preview panel renders exactly the XML that will be injected into tool prompts (today it renders a stylised summary). Builds trust, surfaces bad inputs early.

### 5.2 Telemetry

`profile.events` Pub/Sub message now includes `{ action: 'created' | 'updated' | 'skipped' | 'resumed' | 'deleted' }`. Downstream subscribers (embedding refresh, analytics) branch on `action`.

## 6. Profile Management

### 6.1 Settings edit

`/app/settings/profile` retained and audited for completeness: every `AnalystProfile` field from `src/types/analyst-profile.ts` must be editable. Save path = same PATCH used by wizard. Version bump + snapshot + Pub/Sub on every save.

### 6.2 Ask-Praxis profile mutation

- **Entry point.** Floating Praxis chat. User says things like "change my role to UN mediator", "add Sahel to my regions of focus", "never write in ICD-203 probabilistic language".
- **Intent detection.** Chat route gains a side-channel call to **new endpoint** `POST /api/assistant/intent` that runs a fast classifier (Gemini 3 Flash + small Zod schema). Three top-level intents: `answer` (normal), `profile.mutation`, `situation.action`. On `profile.mutation`, the classifier emits a normalised patch `{ path: 'perspective.regions[]', op: 'add' | 'remove' | 'replace', value: ... }`.
- **Confirm card.** Chat renders an inline mutation card with the human-readable diff (before → after) and two buttons: **Apply** and **Cancel**. No silent writes.
- **Apply.** On Apply, the client PATCHes `/api/onboarding/profile` with the patch (same endpoint as settings), which version-bumps and snapshots.
- **Audit trail.** The chat turn preserves the mutation in history so the user can see what they changed and when.

### 6.3 Delete profile

- **UI.** Settings → **Danger Zone** card. Two-step confirm: (1) explain what will be removed, (2) type `delete` to confirm.
- **Export first.** Before delete is enabled, the user must either download a JSON export or explicitly acknowledge they don't want one.
- **Route.** **New endpoint** `DELETE /api/profile` authenticated by Firebase session. Server writes `meta.deletedAt`, scrubs PII (display name, organisation, chips, embedding, red-line clauses), retains `uid` and an anonymised `meta` stub so historical situation data still renders. Situations themselves are untouched (user can re-onboard later and recover).
- **Soft-delete is the default** because GDPR allows it where the user's own data remains recoverable at their request and because hard-deleting historical tool outputs is irreversible.
- **Hard-delete escape hatch.** A follow-up email workflow (out of scope for this spec) allows a true right-to-be-forgotten request that purges situations, documents, and auth account.

### 6.4 Export

**New endpoint** `GET /api/profile/export` returns a JSON bundle: `profile`, `profile_versions[]`, `preferences`, `situations_metadata[]` (no documents, no tool outputs — those can be exported from the situation itself). Streams as a download; filename `praxis-profile-{uid}-{yyyymmdd}.json`.

## 7. Advisor Council v2 — Four Flagships

### 7.1 Advisor contract (Firestore, editable)

```ts
type AdvisorId = 'adeyemi' | 'reyes' | 'vanderberg' | 'takeda';

interface AdvisorConfig {
  id: AdvisorId;
  name: string;
  title: string;
  bio: string;
  headshotUrl: string | null;
  persona: string;                   // full system-prompt persona
  modelTier: 'gemini-3-flash' | 'gemini-3-pro' | 'gemini-3-pro-deepthink' | 'claude-sonnet-4';
  sourceCategories: string[];        // generic labels, not org names
  allowedTools: ('webSearch' | 'firecrawlScrape' | 'knowledgeCore')[];
  greeting: string;                  // shown as first message
  memoryPolicy: { lastTurns: number; rollingSummary: boolean };
  version: number;
  updatedAt: Timestamp;
}
```

Stored at `config/advisors/{id}`. Seed script `scripts/seed-advisors.ts` writes the initial four idempotently. Admin console at `/app/admin/advisors` gated by `ADMIN_ALLOWLIST` lets authorised uids edit live; each save snapshots to `config/advisors_history/{id}_{prevVersion}` and bumps `version`.

### 7.2 The four flagships

#### Dr. Ngozi Adeyemi — Senior Political Affairs Advisor
- **Expertise.** Governance, elections, civil society, state-building, political settlements.
- **Frameworks.** Putnam two-level game, Fearon rationalist-war, Lederach multi-level, V-Dem indicator reading.
- **Model.** Gemini 3.1 Pro with `thinkingLevel: high` — deep pattern recognition on long context.
- **Source categories.** Multilateral political reports, democracy and governance indices, peer-reviewed political science, reputable think-tank analysis, government-affairs pages.
- **Voice.** Measured, structural, historically literate. Comfortable naming regime types and political economy constraints.

#### Gen. (Ret.) Arman Reyes — Security and Operations Advisor
- **Expertise.** Military affairs, peacekeeping operations, ceasefire monitoring, DDR, SSR, force generation.
- **Frameworks.** Force ratios, sustainment calculus, rules-of-engagement feasibility, SSR sequencing.
- **Model.** Gemini 3.1 Pro — strong on spatial, temporal, and numerical reasoning.
- **Source categories.** UN mission reports, open-source conflict event databases, defence and security journals, OSCE observer materials, doctrinal publications.
- **Voice.** Direct, operational, refuses to gloss tactical realities.

#### Dr. Sigrid Vanderberg — Political Economy and Development Advisor
- **Expertise.** Sanctions, resource conflict, reconstruction finance, fiscal-political linkages.
- **Frameworks.** Follow-the-money rigour, Putnam two-level on fiscal constraints, political-economy sequencing.
- **Model.** Claude Sonnet 4 — nuanced trade-off reasoning, long-form synthesis.
- **Source categories.** Multilateral development bank publications, IMF/WB/OECD-style statistical series, central-bank bulletins, commodity markets, sanctions-watch data.
- **Voice.** Forensic, numerate, translates financial signals into political behaviour.

#### Amb. Hiroshi Takeda — Diplomatic Craft Advisor
- **Expertise.** Track I diplomacy, treaty drafting, diplomatic writing, historical parallels, protocol.
- **Frameworks.** Historical case comparison, diplomatic register, face-saving ambiguity, treaty interpretation.
- **Model.** Claude Sonnet 4 — best register + ambiguity handling.
- **Source categories.** UN Treaty Collection, diplomatic archives, historical case studies, ICJ jurisprudence, academic history.
- **Voice.** Elegant, precise, draftsman's ear; produces text you can send on headed paper.

### 7.3 Upgraded chat infrastructure

- **Route.** `/api/ai/advisor-chat` refactored to read advisor config from Firestore (not hard-coded), inject `AdvisorFrame` into `ContextBlock`, prefetch persona-specific intelligence before first token.
- **Memory.** Every turn writes to `users/{uid}/situations/{sitId}/advisors/{advisorId}/history/{msgId}`. On new turn the route reads the last `memoryPolicy.lastTurns` messages; if the history exceeds that, it synthesises a 3-sentence rolling summary (cheap Flash call) and prepends it as `<prior-thread-summary>`.
- **Briefing prefetch.** First turn on a new (user, situation, advisor) triple runs persona queries against grounded search + reads graph/feed/tool-output layers, emits an `<advisor-briefing>` block.
- **Source whitelist.** `sourceCategories` pass through to `webSearch` as `domainCategories` hints.
- **Calibration.** `withCalibration('advisor', 'ai_chat')` wraps the route, so profile + situation + preferences + domain + interaction + advisor frames all compose.
- **Panel mode.** Existing `panelSummary` and `devilsAdvocacy` actions retained and updated to read the Firestore advisor config.
- **Session picker.** `/app/advisory` page gains a 4-card picker; selecting an advisor opens a dedicated chat pane with history restored.

## 8. Six Flagship Tools — Uniform Checklist

Every one of the six tools must pass this checklist in one pass. Checklist lives alongside the code in `src/app/app/{tool}/README.md` so future contributors see what "done" means.

1. Page wrapped in `ToolPageShell` and gated by `useSituationGuard()`; `<NoSituationState />` renders when absent.
2. API route wrapped in `withCalibration(toolId, creditOp)`.
3. Route reads graph context via `buildGraphContext` when relevant; reads feed context via `buildWebGroundedContext` when relevant.
4. Output persisted via `saveToolOutput` with `profileVersion`; page reads via `usePersistedToolData(toolId, sitId)` for cached load + stale badge.
5. Zod output schema exported; any render branch on a missing field shows a typed empty slot, not a blank.
6. Errors routed through `handleRouteError`; client surfaces friendly copy plus a **Retry** button.
7. Empty state: explains what the tool does and what the user must do first (ingest sources, build graph, assign actors).
8. Regenerate control + last-generated timestamp + stale badge after 6 hours.
9. Methodology drawer: a **How this works** disclosure explaining frameworks, sources, limits.
10. Smoke test: one happy-path integration test per tool under `tests/tools/{tool}.smoke.test.ts`.

### 8.1 Dashboard

- **Purpose.** First-touch situation overview — tells an analyst in 10 seconds where a situation stands and what to do next.
- **Inputs.** Active situation, user profile, user preferences.
- **Methodology.** Six widgets composed from cached SKC reads. No blocking AI call on mount. One optional AI paragraph at the top labelled *Daily read* generated on demand (1 credit).
- **Widgets.**
  1. Risk gauge — INFORM-style composite from `risk-engine.ts`; click opens Risk Monitor.
  2. Escalation stage — Glasl stage badge + one-line trend; click opens Early-Warning.
  3. Advisors — 4 cards showing last interaction per advisor; click opens advisor chat.
  4. Recent tool outputs — last 5 `saveToolOutput` writes in this situation; click opens the tool.
  5. Feed alerts — top 3 high-salience feed events in last 24 h; click opens Alert Center.
  6. Credits — remaining balance + 7-day burn rate; click opens Settings → Billing.
- **Outputs.** Read-only widgets + optional *Daily read* paragraph stored at `tools/dashboard`.
- **UX notes.** Widgets lazy-load and degrade independently; any single widget failing does not break the page.
- **Empty state.** If situation has no graph + no feeds, dashboard shows a 3-step onboarding: ingest sources → build graph → run risk scan.

### 8.2 Conflict Graph

- **Purpose.** Make the full ACO v2.0 ontology navigable and legible.
- **Inputs.** Situation graph from `users/{uid}/situations/{sitId}/graph/main`.
- **Methodology.** D3 force-directed layout with community-aware clustering (Leiden communities passed in from pipeline). Entity colour from `entity-colors.ts`; edge style from relationship category.
- **Interactions.**
  - Entity click → side panel with attributes, confidence level, trust score, evidence links.
  - Entity-type filter (14 types, multi-select).
  - Relationship-category filter (5 categories).
  - Time cursor (if `event.timestamp` present on entities).
  - Search by entity name.
  - Export as SVG or JSON.
- **Outputs.** Graph view + entity-detail panels. No new AI generation except **AI explain** on a selected node or edge, which calls `/api/ai/claude-analyze` with a targeted prompt.
- **Empty state.** "Build graph from sources" CTA that fires `/api/v1/pipeline/run`.
- **Error state.** Graph parse error → shows raw JSON with a repair CTA.

### 8.3 Timeline

- **Purpose.** Chronological event view across all situation sources.
- **Inputs.** `situations/{sitId}/episodes` subcollection (populated by `extract-episodes` route) + document ingest timestamps + feed layer events.
- **Methodology.** Server-side aggregation by day; filter layer applied client-side.
- **Interactions.**
  - Scale: day / week / month / custom range.
  - Filter by actor, event type (CAMEO), source feed, confidence level.
  - Click event → side panel with evidence quotes and source link.
  - Jump-to-date.
- **Outputs.** Timeline view; optional **Narrate this period** AI button calls `/api/ai/briefing-generate` with the filtered event set.
- **Empty state.** "Extract episodes from sources" CTA fires `/api/ai/extract-episodes`.

### 8.4 Stakeholder Map

- **Purpose.** Apply Mitchell-Agle-Wood salience analysis (Power × Legitimacy × Urgency) to all situation actors; surface who matters and why.
- **Inputs.** Actor nodes from graph + actor-profiles tool output (if present).
- **Methodology.** Server-side scoring of each actor on three axes:
  - **Power** — leverage edges, institutional affiliations, resource control.
  - **Legitimacy** — normative standing, recognition, mandate.
  - **Urgency** — time-critical claims, pending deadlines, active threats.
  Scores 0-1 each; quadrant assignment (`definitive`, `dominant`, `dangerous`, `dependent`, `dormant`, `discretionary`, `demanding`).
- **Interactions.**
  - 2D projection with axis-pair toggle (P×L default, P×U, L×U).
  - Click stakeholder → card with scores, interests, leverage, constraints, linked graph entities.
  - Filter by quadrant.
  - **AI explain**: why this stakeholder sits here.
- **Outputs.** Map view + stakeholder cards, persisted to `tools/stakeholder_map`.
- **Empty state.** "Extract actors from sources" CTA.

### 8.5 Early-Warning (Escalation Monitor)

- **Purpose.** Classify current escalation on Glasl's 9 stages, list trigger events, show trend, and surface actor-pair dynamics.
- **Inputs.** Graph, feed layer (last 30 days), prior escalation-scan output for trend.
- **Methodology.**
  - Stage classifier (Gemini 3.1 Pro DeepThink) reads graph + recent events, emits stage 1-9 with confidence and evidence.
  - Trigger detection from feed layer: events matching predefined escalation signals (CAMEO quad-code ≥ 15, violent protest, leadership change, unilateral withdrawal).
  - 7-day trend: compare current stage to stage 7 days ago; plot sparkline.
  - Actor-pair matrix: pairwise escalation scores for top N actor pairs.
- **Interactions.**
  - Stage detail — click stage to see evidence quotes and reasoning chain.
  - Trigger click → source link.
  - Pair click → dyadic deep dive.
  - Auto-refresh every 6 hours via Cloud Scheduler for active situations.
- **Outputs.** Stage badge + trend sparkline + trigger list + actor-pair matrix, persisted to `tools/escalation_scan`.
- **Empty state.** "Run escalation scan" CTA.

### 8.6 Info Environment

- **Purpose.** Map the narrative battlefield — who is telling what story, where disinfo is coming from, where the discourse is heading.
- **Inputs.** GDELT feed (when available) + grounded search + prior info-environment output.
- **Methodology.**
  - Narrative clustering: fetch last 7 days of media mentions, embed, cluster with density-based method, name clusters via Gemini.
  - Disinfo flags: provenance checks (source reputation, repeated vs. unique, coordinated posting patterns).
  - Actor-narrative ownership: map each cluster to which actors push it.
  - Sentiment trend per cluster over time.
- **Interactions.**
  - Cluster list with size + growth rate.
  - Click cluster → sample articles, actor owners, sentiment.
  - Disinfo toggle filters clusters.
  - **AI explain**: why this cluster matters.
- **Outputs.** Cluster view + disinfo flags + trend chart, persisted to `tools/info_environment`.
- **Empty state.** "Pull media for this situation" CTA.

## 9. GCP Access Audit

`scripts/audit-gcp.ts` runs via `npm run audit:gcp`. For each row it asserts: API enabled, resource exists, IAM role present on Cloud Run service account, env var set where needed.

| Service | Resource | Env var | IAM |
|---|---|---|---|
| Vertex AI | Agent Engine | `VERTEX_AGENT_ENGINE_ID` | `roles/aiplatform.user` |
| BigQuery | dataset `praxis_analytics` | — | `roles/bigquery.dataEditor` |
| Cloud Storage | `praxisbytacitus-praxis-uploads` | — | `roles/storage.objectAdmin` |
| Firestore | native mode + KNN index on `skc.vectors.embedding` | — | `roles/datastore.user` |
| Pub/Sub | 5 topics + subs | — | `roles/pubsub.publisher`, `subscriber` |
| Cloud Functions | `on_situation_created`, `on_document_uploaded`, `gdelt_poller` | — | healthy last-invocation check |
| Cloud Scheduler | 3 jobs ENABLED | `CRON_SECRET` | — |
| Secret Manager | `firebase-sa`, `ai-key`, `cron-secret`, `cookie-secret` | — | `roles/secretmanager.secretAccessor` |
| Artifact Registry | recent push | — | `roles/artifactregistry.reader` |

Non-zero exit on any failure. Runs in `preflight` job of Cloud Build so failures block deploy.

## 10. Roadmap Document (deliverable)

`docs/superpowers/specs/2026-04-21-tool-improvement-roadmap.md` ships alongside this spec. Format: 40-row matrix per tool with columns `id | category | purpose | current-state score (1-5) | target-state | effort (S/M/L) | dependencies | risks | target phase`.

Five phases:

1. **Foundation (this spec).** Six flagships + advisors + context + onboarding + profile.
2. **Drafting.** Report Studio, Dossier, Talking Points, Briefing, Daily Brief, UN Toolkit. Leans on Takeda voice.
3. **Simulation.** Scenarios, Negotiation Prep, Game Theory, CONCORDIA, Mediation Designer. Adeyemi + Reyes voices.
4. **Intelligence.** Deep Research Agent, ARGUS, Media Compass/Roundup, Geospatial, Sanctions, Commitments, Treaty, Alert Center. Vanderberg for sanctions, all for Deep Research.
5. **Workspace.** Cases, Team, Advisory enhancements, Settings.

## 11. Rollout

1. Ship Firestore schema migrations: `advisors`, `preferences`, `advisors_history`.
2. Seed scripts: `seed-advisors.ts`, `seed-preferences-defaults.ts` (idempotent).
3. Refactor middleware and renderers for new `ContextBlock` fields — backward compatible (new fields optional).
4. Audit script gates CI.
5. Roll out the six flagship tools behind a `NEXT_PUBLIC_FOUNDATION_V1` feature flag for one staging cycle, then on by default.
6. Announce Advisor Council v2 in-app on next login after flag flip.

## 12. Testing Strategy

- **Smoke tests per tool.** Six new tests under `tests/tools/{tool}.smoke.test.ts` that run the route end-to-end against a fixture situation.
- **Calibration audit.** CI task runs `scripts/audit-ai-routes.ts`; fails build on missing wrappers.
- **Advisor config.** Unit tests verify each seeded advisor has persona, sources, model tier, greeting; property-based test that every `AdvisorConfig` round-trips through its Firestore encoder.
- **Profile mutation.** End-to-end test: Ask Praxis → intent classifier → mutation card → apply → version bumps → Pub/Sub fired.
- **Delete flow.** E2E: export → confirm → PII scrubbed → situations still render.
- **GCP audit.** Unit test with mocked client per service, integration test against a staging project.

## 13. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Advisor config drift between seed and admin edits | All edits snapshot to `advisors_history`; seed script is idempotent and won't overwrite versions > 1 |
| Ask-Praxis mutation mis-classifies an answer question as a mutation | Confirmation card is mandatory; no silent writes |
| Soft-delete leaves PII somewhere subtle | Unit test asserts every field mentioned in `AnalystProfile` is scrubbed; manual review of Firestore doc after delete |
| Six tools load too much on mount | Widgets and panels lazy-load; dashboard limits blocking reads to one cached aggregate |
| Preferences conflict with onboarding answers | Preferences override where specified; onboarding sets initial defaults only |
| GCP audit fails in dev environment where some services don't exist | Script supports `--env=dev|staging|prod` with per-env expected sets |

## 14. Open Questions

None at spec time. Any issue uncovered during planning gets resolved in the plan, not deferred.

---

**End of design.**
