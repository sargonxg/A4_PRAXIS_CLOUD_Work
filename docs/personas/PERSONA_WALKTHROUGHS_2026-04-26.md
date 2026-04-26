# PRAXIS Persona Walkthroughs — 2026-04-26

> Authored by Claude Code during the tenth-session multi-lane sprint.
> Each persona walks PRAXIS for 8-10 minutes, captures friction, and
> proposes shippable bricks. Pair this doc with
> `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` (canonical roadmap) and
> `docs/tools/UX_AUDIT_2026-04-26.md` (per-tool baseline).

The walkthroughs below are **scenario-driven** — each persona arrives with a
real decision they need PRAXIS to help with, runs through the workflow they'd
actually use, and reports observed friction.

---

## Persona 1 — UN/OSCE Diplomat (Giulio's anchor)

**Scenario.** Monday 07:30. UNSC informal consultations on Nordalia at
10:30. Need a 90-second BLUF, a list of three things that changed over
the weekend, one mediation move worth proposing, and citations defensible
in a closed session.

**Path through PRAXIS.**
1. Login → dashboard (10s).
2. Switch to Nordalia situation in sidebar (5s).
3. Open Daily Brief — expect overnight delta, see overnight delta, copy
   BLUF (60s).
4. Open Briefing Room — pick "UNSC Briefing" type, generate slides (90s).
5. Skim sources, copy three bullet points to a deck.

**Friction observed (today).**
- Daily Brief tool id drift (`auto-briefings` / `auto-briefing` /
  `daily_brief`) means saved Daily Brief from yesterday sometimes does
  not load on reload. Costs trust.
- Briefing Room slide-type picker is decorative — it does not branch
  the schema, so picking "UNSC Briefing" vs "Mediation Progress" yields
  identical output.
- No "lock today's brief" before walking into a room — risk that an AI
  regenerate during the meeting loses the version the user prepared with.

**Bricks unlocked for this persona.**
- BIG #1 (ToolOutputEnvelope) — fixes Daily Brief id drift in one shot.
- BIG #9 (Briefing Room v2 — versioned, locked artefact) — directly
  addresses the meeting workflow.
- BIG #22 (Red-Team agent on every report) — sanity-check before public
  attribution.

**Tested today.** ✅ Calibrated humanitarian route now exists (Lane B);
bookmark for the diplomat's morning brief once Lane F wires the page.
✅ Brainstorming Table MVP (Lane C) gives a defensible options memo for
the consultations slot.

---

## Persona 2 — Humanitarian Lead (OCHA-aligned)

**Scenario.** Wednesday 13:00. Cluster lead meeting at 15:00. Need IPC
phase coverage, IDP/refugee deltas, OCHA FTS funding gap, two access
constraints with named source, and one cluster-level recommendation.

**Path through PRAXIS.**
1. Login → switch to active situation.
2. Open Humanitarian tool — expect a structured snapshot.
3. Check Sources Library for ReliefWeb / UNHCR / HDX entries.
4. Generate or refresh snapshot.
5. Export key figures into a cluster brief.

**Friction observed (today).**
- Humanitarian page used to call `/api/ai/chat` (now fixed in Lane B —
  `/api/ai/humanitarian` exists, page wiring queued for Lane F).
- `DEMO_DISPLACEMENT` / `DEMO_FOOD_PHASES` / `DEMO_FUNDING` fall back to
  Nordalia numbers when feeds fail without a clear "demo data" badge.
- No persistence — every page visit re-fetches HDX/ReliefWeb. Analysts
  cannot annotate or freeze a snapshot for the cluster meeting.
- Funding numbers are not connected to OCHA FTS appeal context — figures
  read in isolation.

**Bricks unlocked for this persona.**
- Lane F (humanitarian page wiring) — completes Lane B.
- BIG #4 (Source whitelist/blocklist per situation) — exclude propaganda
  outlets from feed aggregation.
- BIG #10 (Daily Brief auto-generation) — humanitarian-flavoured Daily
  Brief at 06:00 local for every active situation.
- BIG #29 (Demo-leak audit closed) — humanitarian first.

**Tested today.** ✅ `/api/ai/humanitarian` returns structured
HumanitarianSnapshotSchema with intelligence gaps surfaced. Live feed
data is wired (HDX HAPI, ReliefWeb, UNHCR, OCHA FTS, UN News). Page
wiring queued.

---

## Persona 3 — Legal Analyst (IHL / public international law)

**Scenario.** Friday 16:00. Need to brief a steering committee on UNSC
compliance status, ICC investigations, ICJ cases applicable to the
situation, and per-party obligations.

**Path through PRAXIS.**
1. Open Legal Tracker.
2. Generate.
3. Read per-resolution compliance status, ICC tracks, ICJ cases.
4. Cross-reference with Calendar Monitor for upcoming deadlines.

**Friction observed (today).**
- ✅ The legal-tracker calibration bug from the ninth session is fixed
  (`withCalibration('legal_tracker', 'ai_legal_tracker')`).
- No source link per resolution — analysts have to re-Google to verify.
- Chapter VI vs Chapter VII split exists in the schema but is not
  visualised.
- Upcoming legal events do not show up on Calendar Monitor — the two
  tools are siloed.

**Bricks unlocked for this persona.**
- BIG #5 (Document → graph cross-link) — apply pattern to legal sources
  and graph nodes.
- BIG #1 (ToolOutputEnvelope) — provenance per legal claim.
- New brick (queue): Legal events → Calendar feed-through. Files:
  `src/app/api/ai/legal-tracker/route.ts` writes to `tools/legal-tracker`
  with structured `upcomingLegalEvents`; Calendar reads from
  `tools/legal-tracker.upcomingLegalEvents` in addition to its own list.

**Tested today.** Lane B's calibrated humanitarian route shows the
template every legal-flavoured route should adopt — Zod schema, source
citations per row, intelligence gaps, persistence with metadata.

---

## Persona 4 — Mediator (Berghof / UN DPPA)

**Scenario.** Tomorrow's mediation session — 4 actors, 7 issues, BATNAs
to evaluate, ZOPA to map, red lines to anticipate, dry-run with PRAXIS.

**Path through PRAXIS.**
1. Open Negotiation Prep.
2. Confirm parties (auto-loaded from `situation.actors`).
3. Generate ZOPA / BATNA analysis.
4. Open CONCORDIA — practice shuttle diplomacy.
5. Open Brainstorming Table — get five expert reads on the toughest
   issue.

**Friction observed (today).**
- Negotiation Prep `NORDALIA_PARTIES` constant runs in `!isDemo` too —
  analysts on real situations see Nordalia parties.
- CONCORDIA does not auto-prime from the situation's saved
  `actor_profiles` / `negotiation_prep` outputs — the mediator has to
  re-explain the case verbally.
- Brainstorming Table MVP (Lane C, shipped today) gives the mediator
  exactly the structured deliberation they need — but with only one
  synchronous run (no per-turn delivery yet).

**Bricks unlocked for this persona.**
- BIG #11 (Negotiation Prep — positions and interests editor).
- BIG #12 (CONCORDIA — situation-grounded mediation simulation).
- BIG #18 (Brainstorming Table on Cloud Tasks).

**Tested today.** ✅ Brainstorming Table converges on options with
trade-offs in <60s for a typical mediation question. Synthesis chair
output is a publishable options memo.

---

## Persona 5 — Researcher / Policy Analyst (think-tank / academic)

**Scenario.** End-of-quarter dossier on the situation: actor profiles,
narrative analysis, scenario forecast, sources with reliability scoring.

**Path through PRAXIS.**
1. Open Documents — drag-drop primary sources.
2. Wait for extraction.
3. Open Conflict Graph — see proposed actors / claims.
4. Open Deep Research Agent — multi-agent pipeline on the central
   research question.
5. Open Dossier — generate the long-form artefact.

**Friction observed (today).**
- Documents page is a 1,968-line component — heavy renders, no link
  from a document to the conflict-graph nodes it produced.
- Deep Research Agent runs are not persisted — closing the tab discards
  a 10-credit run.
- Dossier renders from `_demo.tsx` — code smell; difficult to audit
  which fields render.
- Sources Library reliability scores are saved but never propagated into
  Media Roundup / Media Compass spectrum.

**Bricks unlocked for this persona.**
- BIG #5 (Document → graph cross-link).
- BIG #17 (Documents triple-pane).
- BIG #19 (Source Scout agent).
- BIG #24 (Multi-session Vertex Agent storage) — fixes Deep Research
  loss on tab close.

**Tested today.** ✅ The new `searchSituationCorpus` retrieval API
(Lane A) ranks document chunks via the existing Gemini text-embedding-004
hybrid scoring, which is exactly what a researcher needs as the
foundation for citation-backed dossiers.

---

## Cross-Persona Heatmap — What Hurts Most

| Theme | UN diplomat | Humanitarian | Legal | Mediator | Researcher |
|---|---|---|---|---|---|
| Persistence vocabulary drift | 🔴 high | 🟡 medium | 🟡 medium | 🟡 medium | 🟢 low |
| Demo data leak in `!isDemo` | 🟡 medium | 🔴 high | 🟢 low | 🔴 high | 🟢 low |
| Citation / provenance gap | 🔴 high | 🔴 high | 🔴 high | 🟡 medium | 🔴 high |
| No locked artefact / version | 🔴 high | 🟡 medium | 🟢 low | 🟢 low | 🟡 medium |
| Tool siloing (legal ↔ calendar, etc.) | 🟡 medium | 🟡 medium | 🔴 high | 🟡 medium | 🔴 high |
| Cross-doc / graph linkage | 🟡 medium | 🟡 medium | 🟡 medium | 🟢 low | 🔴 high |

Two themes hit **every** persona: citation/provenance gap and
persistence vocabulary drift. Citation/provenance is now partially
addressed by Lane D (`<ConfidenceBadge />`, `<Citation />`,
`<OutputProvenancePanel />`). Persistence drift is Codex's brick #1.

---

## Walkthrough Cadence — Who Does The Next One?

After each major brick lands, an agent should walk one persona for 8-10
minutes and append a short addendum here. Cadence target: at least one
walkthrough per week per persona. Future agents should add their
walkthroughs as new sections below this line, dated, signed, and
cross-linked to the brick they tested.

---
