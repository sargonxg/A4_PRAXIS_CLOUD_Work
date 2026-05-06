# PRAXIS — Flagship-Grade Improvement Roadmap

> Authored 2026-04-26 by Claude Code (tenth-session multi-lane sprint).
> Owner: Giulio Catanzariti (CEO/CTO, TACITUS).
> Audience: Codex, future Claude Code sessions, contributing engineers.
>
> Pair this document with:
> - `docs/STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md` — current sprint queue.
> - `docs/PRAXIS_HIGH_IMPACT_PRODUCT_PLAN_2026-04-26.md` — multi-day plan.
> - `docs/AGENTIC_SYSTEM.md` — agent execution model.
> - `docs/CORPUS_ARCHITECTURE.md` — retrieval contract (now partly shipped).
> - `docs/tools/UX_AUDIT_2026-04-26.md` — per-tool baseline.

This file is intentionally ambitious. It captures the "where PRAXIS deserves
to be in 90 days" view, with shippable bricks underneath. Every item names a
user persona, a decision it unlocks, the GCP service path, and a definition
of done so an agent can pick it up cold.

---

## North-Star User Outcomes

When PRAXIS is finished, every paying user can say:

1. **"PRAXIS told me what changed and what to do — before I asked."**
   The dashboard surfaces situation health, source-coverage gaps, stale
   tool outputs, and a single "next recommended action" derived from
   role + freshness + risk delta.
2. **"Every figure is sourced and I can defend it in a UN meeting."**
   Provenance panel under every output: tool id, profile version,
   domain version, model, retrieval trace, primary sources, confidence.
3. **"Six experts argue the call — and I pick."**
   Brainstorming Table delivers calibrated multi-persona deliberations
   with red-team critique and synthesis options.
4. **"My corpus is mine."** Documents ↔ graph ↔ tool outputs are
   cross-linked; clicking an entity shows the originating paragraph.
5. **"PRAXIS keeps watching while I sleep."** Cloud Tasks workers
   refresh feeds, embeddings, and briefings overnight; failures hit
   the activity feed and notification bell.

---

## Layered View — The 5 Working Layers

| Layer | What it owns | Today | Where it must go |
|---|---|---|---|
| **Calibration** | AnalystProfile, domain merge, system prompt block | Solid; 55/4 routes calibrated | ToolOutputEnvelope; profile-version display in every output |
| **Corpus** | argus, sources, documents, graph, tool-output, situation, profile | `searchSituationCorpus` shipped (Lane A); Ask PRAXIS still has its own context builder | Citation disclosure UI; vector search across all layers; BigQuery feed-coverage metrics |
| **Tools** | 40+ AI routes producing structured outputs | 55 calibrated; persistence vocabulary drifts | Canonical envelope; "Why this output?" panel on every tool; demo-leak audit closed |
| **Agents** | Multi-persona deliberation, source scout, graph cartographer, timeline editor | Brainstorming Table MVP shipped synchronously (Lane C) | Cloud Tasks fan-out; durable jobs; graph-delta approval queue |
| **Operations** | Spine: tool_runs, background_jobs, system_events, notifications | Operational; activity feed + operator console live | Diagnostics console v2; BigQuery sink for events; Stripe meters for usage |

---

## The 30 Big Bricks

Format: `# / Brick / Persona / Decision unlocked / GCP services / Definition of done`.
Items 1–10 mirror brick lists already in `docs/STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md`
and `docs/NEXT_BRICKS_2026-04-26.md` so this file is forward-compatible.
Items 11–30 are the bigger flagship asks.

### Calibration & Corpus (1–8)

1. **Canonical Tool Output Envelope** · all personas · "I see provenance
   for every output" · Firestore + Vertex AI metadata fields · `src/types/tool-output.ts`
   defined; one tool migrated end-to-end (Briefing Room first).
2. **`/api/intelligence/corpus-search` consumers** · all personas ·
   Ask PRAXIS, Brainstorming, Humanitarian quote with citation IDs ·
   Cloud Run frontend API routes · Ask PRAXIS chat route delegates to
   the shared retriever; in-chat citations rendered inline.
3. **Firestore vector search pilot** · researcher / analyst · "I can
   ask 'what's changed since Tuesday' and get the right chunks" ·
   Firestore vector indexes + Vertex AI text-embedding-004 · Pilot
   index on `documents/{id}/chunks` with KNN; benchmark vs current
   hybrid scoring; ship behind feature flag.
4. **Source whitelist / blocklist per situation** · researcher,
   humanitarian · "Media Roundup excludes propaganda outlets" ·
   Firestore situation settings · UI in Sources Library + plumbing
   into Media Roundup query plan.
5. **Document → graph cross-link** · all personas · "I can prove this
   actor came from that paragraph" · Backend extraction + frontend
   Conflict Graph hover · Provenance write in extraction; hover-to-
   peek panel; deep-link from graph node to Documents page.
6. **Domain-aware tool overrides** · sector specialist · "Humanitarian
   tools surface IPC + protection by default; Legal tools surface
   Chapter VI/VII split" · Firestore domain configs (already wired)
   plus per-tool prompt overrides · Each calibrated route reads
   `ContextBlock.domain.promptOverrides` and branches its system prompt.
7. **Profile-version snapshot diff** · admin · "I can replay a tool
   run against an older profile" · Firestore `profile_versions/{vN}` ·
   Admin diff UI showing which tool outputs were produced under
   which profile version.
8. **Personal corpus export** · power user · "I can take my analysis
   off-platform" · Cloud Storage signed URLs · Export tool outputs +
   documents + graph + timeline as a versioned ZIP/JSON bundle.

### Tools & Workflows (9–17)

9. **Briefing Room v2 — versioned, locked artefact** · UN officer ·
   "I can lock today's brief and walk into a meeting" · Firestore
   `briefings/{id}/versions/{n}` · Version timeline + lock + diff vs
   prior; one-click PDF export via headless Chromium on Cloud Run.
10. **Daily Brief auto-generation 06:00 local** · diplomat · "PRAXIS
    has briefed me before my coffee" · Cloud Scheduler + Cloud Tasks
    + Cloud Run worker · Per-situation cron, writes Daily Brief,
    notification with deep-link.
11. **Negotiation Prep — positions and interests editor** · mediator ·
    "I can edit each party's cells; AI fills blanks and challenges
    weak entries" · Firestore situation actors + tool-data ·
    Cell-grid editor; AI mode = critique not generate.
12. **CONCORDIA — situation-grounded mediation simulation** ·
    mediator · "I can practice tomorrow's session against this
    situation's actors with their actual interests/constraints" ·
    Gemini Live API · Auto-prime CONCORDIA from
    `tools/{actor_profiles, conflict_graph, negotiation_prep}`.
13. **Game Theory — Schelling diagram + UNSC veto branch** · policy
    advisor · "I can see which veto patterns close which option
    spaces" · `withCalibration('game_theory', ...)` already wired ·
    SVG diagram component + UNSC branch in schema.
14. **Risk Monitor — 90-day sparkline from version history** · early
    warning analyst · "I see if my risk read is trending up" ·
    Firestore version history · Sparkline computed from
    `tools/risk_assessment/versions/*`.
15. **Early Warning — stage-transition notifications** · early
    warning analyst · "PRAXIS pages me when Glasl shifts" · Cloud
    Functions on `tools/escalation_scan` write · Notification +
    activity feed entry on stage delta.
16. **Conflict Graph — split surfaces (structure / timeline /
    entities)** · all personas · "Pages don't blow up at 1,800 lines" ·
    Frontend refactor only · Three child routes sharing a graph
    store; URL-encoded selection.
17. **Documents — triple-pane (paragraph / entity / graph)** · all
    personas · "Documents become the explainability spine" · Frontend
    + extraction provenance · Three-column view, hover-highlight
    across columns.

### Agents & Long-Running Jobs (18–24)

18. **Brainstorming Table on Cloud Tasks** · all personas ·
    "Deliberation feels alive — turns stream in" · Cloud Tasks
    `praxis-agents` queue · Per-turn task delivery; UI polls the
    table doc; red-team turn enqueued only after 3+ turns exist.
19. **Source Scout agent** · researcher · "Surface 5 fresh sources
    on this question I haven't seen yet" · Vertex Agent Engine + ADK ·
    Returns ranked sources with grounded-search citations; user
    promotes to Sources Library.
20. **Graph Cartographer + delta approval queue** · all personas ·
    "Extraction proposes graph changes; I approve" · Backend ACO
    extraction + Firestore `graph_updates` · Banner on situation
    page; side panel with Approve/Reject; canonical write only on
    approve.
21. **Timeline Editor agent** · diplomat · "Timeline reflects only
    evidence-backed events, no decorative content" · Cloud Tasks +
    Firestore · Pull events from documents/feeds/tool outputs;
    propose to `timeline_updates` for analyst confirmation.
22. **Red-Team agent on every report** · UN officer · "I never ship a
    brief that hasn't been adversarially reviewed" · Calibrated AI
    route · Auto-runs on every Briefing Room generation; output
    appended as red-team appendix.
23. **Cloud Tasks dispatcher migrating off worker pool** · ops · "I
    can run 10× the throughput without touching a worker pool" ·
    Cloud Tasks + Cloud Run HTTP target · Three queues fan-out
    `background_jobs`; per-job retry config.
24. **Multi-session Vertex Agent storage** · power user · "Two
    parallel Deep Research calls don't clobber each other" ·
    Firestore subcollection · Migrate `agentSessions/active` →
    `agentSessions/{sessionId}` keyed by `(uid, situationId)`.

### Operational Excellence & Trust (25–30)

25. **Operator Console v2** · ops · "Cloud Tasks queue depth, GDELT
    last success, scheduler last run all on one screen" · Firestore
    + Cloud Monitoring · Drill-down panels; retry button per job.
26. **BigQuery `praxis_analytics.system_events` sink** · ops · "I can
    query failure rates by tool" · Firestore-onCreate Cloud
    Function streaming to BigQuery · Schema mirrors event doc.
27. **Stripe Meters for usage billing** · ops + finance · "I bill on
    real GCP cost, not just internal credits" · Stripe Meters API ·
    Emit `vertex.input_tokens / output_tokens / thinking_tokens`,
    `gdelt.queries`, `firecrawl.pages` (legacy) at every `complete_tool_run`.
28. **Email notification path** · all personas · "I get an email when
    something blows up at 3 a.m." · Cloud Function on notifications
    create + SendGrid (Vercel Marketplace) · Templates per `kind`;
    dedupe by notificationId.
29. **Demo-leak audit closed** · diplomat (and trust) · "I never see
    Nordalia data unless I'm in demo mode" · Frontend audit · 5+
    pages migrated per `docs/tools/UX_AUDIT_2026-04-26.md`.
30. **SOC 2 / DPA path documented** · enterprise customer · "I can
    sign a DPA tomorrow" · Documentation · `docs/COMPLIANCE.md`
    expanded; Sub-processor list; Audit log retention 7 years.

---

## Persona Test Matrix

Every brick should be reviewed against five user personas before merging.
Walk-through ≤ 10 minutes per persona. Capture friction in a brick-specific
sub-doc under `docs/personas/`.

| Persona | Primary use cases | Key tools | Definition of "PRAXIS works for me" |
|---|---|---|---|
| **UN/OSCE diplomat (Giulio's anchor persona)** | Morning brief, mediation prep, UNSC track | Daily Brief, Briefing Room, Negotiation Prep, Legal Tracker | Calibrated brief in 90 seconds, defensible citations, public-statement red-line check |
| **Humanitarian lead** | OCHA-grade snapshot, IPC monitoring, donor brief | Humanitarian, Sources Library, Daily Brief | Cluster-aligned snapshot with intelligence gaps; access constraints sourced |
| **Legal analyst** | UNSC compliance, ICC tracks, treaty obligations | Legal Tracker, UN Toolkit, Treaty Analyzer | Per-resolution compliance status with sourced citations; deadlines → Calendar |
| **Mediator** | Positions, interests, ZOPA, BATNA, simulation | Negotiation Prep, CONCORDIA, Brainstorming Table | Cell-editable parties; ZOPA computed from edits; deliberation table option-set |
| **Researcher / policy analyst** | Deep research, comparative analysis, dossiers | Deep Research Agent, ARGUS, Dossier, Documents | Cited synthesis; dossier addressable per actor; corpus search with provenance |

For each brick:
- Write the **Persona walkthrough** (2-3 paragraphs in the brick spec).
- Note the **friction observed** (e.g., "had to scroll 3 screens to find primary source").
- Capture **fixes shipped** vs **fixes deferred**.

This roadmap reserves a slot at `docs/personas/` for the persona walkthroughs
themselves so future agents have a clean place to add new ones.

---

## Google Cloud Architecture — Where Each Brick Lives

```
                                 ┌──────────────────────────────┐
                                 │  Vertex AI                    │
                                 │  - Gemini 3.1 Pro (Pro tier)  │
                                 │  - Gemini 3 Flash             │
                                 │  - text-embedding-004         │
                                 │  - Agent Engine (Deep Research)│
                                 └──────────┬───────────────────┘
                                            │
                                            ▼
┌────────────────────┐     ┌────────────────────────────────┐
│  Cloud Run         │ ─── │  Firestore (single source)     │
│  - frontend (Next) │     │  - situations / tool-data      │
│  - backend (FastAPI)│    │  - tool_runs / system_events   │
│  - workers (queues)│     │  - background_jobs / notifs    │
└──────┬─────────────┘     │  - graph_updates / approvals   │
       │                   └────────────────┬───────────────┘
       │                                    │
       ▼                                    ▼
┌────────────────────┐     ┌────────────────────────────────┐
│  Cloud Tasks       │ ──▶ │  Cloud Scheduler (cron)        │
│  - praxis-research │     │  - GDELT 15min                 │
│  - praxis-agents   │     │  - Daily Brief 06:00           │
│  - praxis-embed    │     │  - alert sweep 6am             │
└────────────────────┘     └────────────────────────────────┘
       │                                    │
       ▼                                    ▼
┌────────────────────┐     ┌────────────────────────────────┐
│  Pub/Sub topics    │     │  BigQuery praxis_analytics     │
│  - profile.events  │     │  - tool_runs (mart)            │
│  - praxis.alert    │     │  - system_events (mart)        │
│  - praxis.ingest   │     │  - data_ingestions (mart)      │
│  - praxis.extract  │     │  - feed-coverage rollups       │
│  - praxis.deadletr │     └────────────────────────────────┘
└────────────────────┘
```

---

## 7-Day / 30-Day / 90-Day Plan

### Next 7 days (this week sprint)

- [x] Lane A — `searchSituationCorpus` + `/api/intelligence/corpus-search`.
- [x] Lane B — Humanitarian calibrated route (HumanitarianSnapshotSchema).
- [x] Lane C — Brainstorming Table MVP (synchronous prototype).
- [x] Lane D — Shared `<ConfidenceBadge />`, `<Citation />`,
      `<OutputProvenancePanel />`.
- [ ] Lane E — Wire Ask PRAXIS chat to call `searchSituationCorpus`
      (step 4 of CORPUS_ARCHITECTURE).
- [ ] Lane F — Wire Humanitarian page to call `/api/ai/humanitarian`
      and remove `/api/ai/chat` fallback.
- [ ] Lane G — Real notification bell (NEXT_BRICKS #8) — Codex-owned,
      coordinate.
- [ ] Lane H — Situation Health Card library + tests
      (STRATEGIC_AGENTIC_ROADMAP brick #2).

### Next 30 days

- Brick #1 (ToolOutputEnvelope) for Briefing Room + Risk Monitor + Humanitarian.
- Brick #5 (Document → graph cross-link) end-to-end.
- Brick #18 (Brainstorming Table on Cloud Tasks).
- Brick #20 (Graph delta approval queue).
- Brick #25 (Operator Console v2).
- Brick #29 (Demo-leak audit closed for top-10 pages).
- Persona walkthrough docs filed for all five personas.

### Next 90 days

- Brick #19 (Source Scout agent).
- Brick #21 (Timeline Editor agent) + Brick #22 (Red-team auto-review).
- Brick #26 (BigQuery sink) + Brick #27 (Stripe Meters).
- Brick #28 (Email notifications).
- Brick #30 (SOC 2 / DPA path).
- Tool-by-tool migration to ToolOutputEnvelope (currently 0/40).
- Persistence-vocabulary unification (NEXT_BRICKS #1) — Codex-owned.

---

## Operating Principles For Every Future Lane

These survive any specific brick. Carry them into every future commit:

1. **No fictional data on authenticated paths.** Demo fixtures live behind
   `isClientDemoMode()` only. Live mode degrades to honest empty states.
2. **Every AI route must use `withCalibration`** with the correct toolId
   and credit op. The audit script enforces this; respect it.
3. **Every output must be defensible.** If a figure can't be cited, mark it
   as an intelligence gap. Never invent sources.
4. **Every long-running task lives in `background_jobs`** and writes to
   `system_events`. The activity feed + operator console see everything.
5. **Every Firestore write** has matching rules and indexes in the same
   commit. Reads silently fail otherwise.
6. **Every commit** must pass `npx tsc --noEmit`,
   `node scripts/audit-ai-routes.mjs`, and the relevant `tests/services/*`.
   `npm run build` if shared UI / shell components changed.
   `npm run audit:gcp` if infrastructure or GCP code changed.
7. **Every commit lands as `giuliocatanzariti@gmail.com`**, no
   Co-Authored-By trailers, push to `main`, deploy via Cloud Build.
8. **Every doc change**: `CHANGELOG.md` (Unreleased), `docs/CONTINUATION.md`,
   the relevant tool/spec doc. Make it possible for the next agent to take
   over cold.

---

## Risks To Track Weekly

- **Source provenance drift.** Tools still embed retired vendor names in
  internal type definitions (`MinimalACLEDEvent`, `useFirecrawl` flag).
  Refactor whenever a touched file already opens.
- **Cloud Run worker pool Pre-GA posture.** Have a fallback plan ready
  (Cloud Run Jobs + Scheduler) if the worker pool API changes.
- **Persistence vocabulary drift.** Three id schemes (registry, ToolName,
  withCalibration toolId) are still in flight. Codex's brick #1 owns the
  unification; until then, every new tool should use the registry id
  consistently across route + page + hook.
- **Vector index limits.** Firestore vector queries today don't support
  real-time snapshot listeners — design retrieval UIs accordingly.
- **Demo data leakage.** UX audit catalogues five tools that still render
  Nordalia constants in `!isDemo`. Ship the audit close-out before
  enterprise demos.

---

## How To Pick Your Next Lane

If you are an agent reading this with no other context, follow this order:

1. Read `docs/CONTINUATION.md` for the latest "what just shipped" summary.
2. Pull `git log --oneline -10` to see what landed today.
3. Run `node scripts/audit-ai-routes.mjs`. If it fails, fix that first.
4. Open `TaskList`. Claim the lowest-numbered pending task.
5. If no tasks, pick one of the unchecked items in the 7-day plan above.
6. Match your scope to a single owner (Codex-Architect, Codex-Product,
   Claude-UX, Claude-Tools, Data-Agent, Red-Team) per the lane table in
   `docs/STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md`.
7. Write the brick spec under `docs/superpowers/specs/<date>-<brick>.md`
   if it is non-trivial.
8. Ship. Validate. Commit. Push. Update docs. Notify next agent.

The flagship is built one brick at a time. This document is the brick list.
