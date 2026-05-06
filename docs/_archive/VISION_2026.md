# PRAXIS Vision — 2026

> **PRAXIS is the operating system for policy professionals working on
> conflict, diplomacy, governance, and humanitarian crises.** What
> Bloomberg did for finance — turn dispersed signals into a working
> surface where decisions get made — PRAXIS does for policy.

This document fixes the strategic objective. Everything in
`docs/SPRINT_BACKLOG.md` and `docs/SPRINT_2026-04-25.md` should
ladder up to the goals here. If a backlog item doesn't, take it out.

---

## The customer's day, with PRAXIS

A UN Political Affairs Officer logs in at 07:30 in New York. Their
working life is already in the workspace:

- The dashboard shows the **right** four things. Not "all events" —
  the events that matter for *their* mandate (Yemen, peace track),
  *their* audience (the Special Representative), and *their* lens
  (mediation + humanitarian).
- The "Daily read" is a one-pager BLUF in the language and tone the
  SRSG actually uses — because PRAXIS captured that in onboarding.
- Three tools light up on the sidebar with green semaphores: the
  Briefing draft is fresh, the Sanctions tracker has a new
  designation, the Geospatial Monitor flagged an ACLED spike near
  Hodeidah overnight.
- The PAO opens the Briefing tool. The first paragraph is already
  drafted, citing the right ACLED rows (server-aggregated; we hold
  the Corporate License), the right ReliefWeb sitrep, and one line
  from CrisisWatch — sources the PAO would have spent 90 minutes
  collating manually.
- The PAO edits two sentences, the diplomatic register stays right,
  the IHL framing is intact (red lines: never call any party a
  terrorist, never imply UN endorsement). They send the brief to the
  SRSG by 08:30. They are now an hour ahead of where they would have
  been yesterday.
- After the SRSG meeting, the PAO opens the Negotiation Prep tool.
  PRAXIS already has the actor map, the BATNA / ZOPA from last
  week's session, the Hodeidah Agreement clauses, and a fresh
  Stedman spoiler analysis. The PAO refines, ports the talking points
  into the UN Toolkit, hits export.
- A weekly cycle that used to take 12 hours of manual work now takes 3.

That's what we're building. The tooling is in service of a single
outcome: **decision velocity for the policy professional.**

---

## 2026 strategic targets

| Goal | Target by EOY 2026 |
|---|---|
| ARR | $250–500k |
| Paying organisations | 8–15 (mix of think tanks, NGOs, IO desks, embassies) |
| Flagship UN-agency pilots | 2 (UN DPPA Africa or MENA desk + 1 OCHA / OHCHR / UNHCR) |
| Tools at READY status | 47 / 47 (all visible tools production-quality) |
| Languages supported in output | 6 (en, fr, es, ar, ru, zh) — already in profile schema |
| Data sources licensed for SaaS | GDELT (BigQuery, free), UCDP GED (CC-BY), ReliefWeb, HDX, UNHCR, World Bank, UN News, Wikipedia (CC-BY-SA), Vertex AI Deep Research, Google Search Grounding — all open / Google-native, no third-party licenses |
| SOC 2 Type II | In observation window (Type I signed) |
| EU data residency | Available (`europe-west1` mirror) |
| Conversation memory | Live across all situations |
| Explicit GraphRAG layer | Live (Microsoft local→global on the ACO 8 primitives) |

These are intentionally ambitious for a one-founder + AI-team operation.
The leverage comes from the multi-agent build pattern (Codex + Claude
Code + you in tandem). Hitting 6 of these 10 by year-end is success;
hitting all 10 is the moonshot.

---

## What makes PRAXIS defensible

Three layers of moat, listed in order of how hard they are to copy:

### 1. The context-injection contract

Every AI tool in PRAXIS receives `<analyst-profile>` +
`<situation-frame>` + `<domain-frame>` + retrieved-context +
`<output-constraints>` injected into its system prompt. Competitors
rebuilding this would need to:

- Capture analyst identity, mandate, lenses, regions, audience,
  language, red lines (we do this in 3 onboarding screens).
- Maintain situation-scoped knowledge graphs with ACO typing (we do
  this with 14 entity types and 72 typed relationships).
- Resolve to per-domain prompt overrides at runtime (we do this
  with 11 live-editable domain configs).
- Keep all of the above in sync as the user works (we use
  Firestore `onSnapshot` + Pub/Sub `profile.events`).

This contract is the heart of PRAXIS. **Read
`docs/CONTEXT_INJECTION.md` before any agent changes anything.**
Strategy holds it inviolate.

### 2. The open-data + Google AI vertical-integration

Anyone can call Gemini. What's hard is:

- A **single-vendor data + AI surface** (Google Cloud only) that lets
  us tell UN/EU buyers "your data never touches a third-party
  sub-processor" — a clean DPA story.
- A GDELT BigQuery hot-slice with 90-day partition-pruned tables,
  costing pennies per situation per day.
- HDX HAPI integration with per-dataset license tracking surfaced in
  the UI.
- UN News + ReliefWeb + UCDP + World Bank attribution discipline,
  done right the first time.
- An audit trail (`docs/COMPLIANCE.md`) that survives a SOC 2 Type II
  review without a single commercial-data-license redaction.

This is unsexy paperwork that nobody else wants to do. We do it once,
on open data, and we never have to re-sign per customer.

### 3. The tool catalogue at READY status

47 micro-applications, each one situation-scoped, each one
context-calibrated, each one persisting outputs back into the
shared knowledge core so future tools can read what past tools
produced. The competitive analogue is Bloomberg Terminal's
function library — once a customer has 30 tools embedded in their
workflow, they can't move.

---

## Strategic priorities, in order

### Priority 1 — Land 1 paying flagship

A think-tank or NGO that pays $199/month for Team or $50–150k/year
for Enterprise, says publicly that they use PRAXIS, and gives us
the case study video. Until we have one, every prospect call
starts with "show me a customer". When we have one, conversations
shift to "how soon can we onboard?".

**Who agents work on next:** Stream B (Tool quality) — until every
visible tool is READY, no flagship customer will commit.

### Priority 2 — GDELT BigQuery hot slice in production

Now that ACLED is out (open-source pivot 2026-04-25), GDELT is the
event-data backbone. The hot-slice pipeline materialises 7 days of
GDELT GKG into `praxis_analytics.gdelt_situation_events`,
partition+cluster-tuned for sub-200ms per-situation reads. Free
under 1 TB/month on BigQuery public-dataset queries.

**Who agents work on next:** Stream B-10 (P0). Authoritative
playbook at `docs/implementation/gdelt-ingestion-2026-04-25.md`.

### Priority 3 — UN-agency pilot

Even if it's free for the first 90 days, get a desk inside DPPA, OCHA,
OHCHR, or UNHCR using PRAXIS daily. The procurement story (UNGM Level
2, SOC 2 in flight, EU residency) opens this door; the product
quality keeps it open.

**Who agents work on next:** Stream A (audience-tuned briefings,
role-aware empty states) — UN audience shows up in onboarding, the
output should obviously reflect it.

### Priority 4 — Vertex AI Agent Engine live

Deep Research Agent is the flagship "AI does the analyst's work"
demo. Without it, we look like a wrapper around Gemini. With it, we
look like a multi-agent intelligence pipeline.

**Who agents work on next:** Stream C-2 — the deploy.py is in
`backend/agents/`; the user runs `python deploy.py` once per
project; the engine ID gets stored as a secret; the route picks it
up on next deploy.

### Priority 5 — Conversation memory layer

Once Stream B-1 (Assistant chat persistence) ships, the SKC gains
a new layer: chat history as searchable, situation-scoped vector
memory. The next chat session's first response can already cite
what was said in the previous session. This is rare in 2026 and
will carry weight in customer demos.

**Who agents work on next:** Stream F-1 — directly downstream of
B-1.

### Priority 6 — Explicit GraphRAG layer

Compass §R9 validated the SKC architecture and recommended adding
a Microsoft-style local→global GraphRAG path on the 8 ACO
primitives. This makes multi-hop questions ("which actors who
opposed the 2020 ceasefire are now allied with the new
opposition?") solvable that vector-only RAG cannot answer.

**Who agents work on next:** Stream F-5 — once Stream B is mostly
done.

---

## How we know we're winning

These are the only metrics that matter for the next 12 months:

| Metric | Floor | Stretch |
|---|---|---|
| Weekly active analysts (paid) | 50 | 250 |
| Average time-on-task per session | 25 min | 60 min |
| Briefings generated per week | 100 | 1,000 |
| Tool runs per situation per week | 8 | 25 |
| NPS from policy professionals | 30 | 60 |
| % of analysts who edit-and-keep AI output (vs. discard) | 70% | 90% |
| Customer interview quote: *"this saved me X hours this week"* | every customer says this once | every customer says this weekly |

Vanity metrics (page views, signup count, "credits used") **do not
appear here on purpose**. They are not the goal.

---

## What we are deliberately not building

The clarity in saying no:

- **A consumer chatbot.** PRAXIS is a workspace for credentialed
  professionals. No "ask anything about politics" homepage demo.
- **A second AI provider on top of Gemini + Claude.** Both are
  enough. Adding more is operational drag.
- **Our own graph database.** Firestore + the SKC graph layer ships
  today. Neo4j / FalkorDB / TrustGraph stay optional behind capability
  flags until a tool can demonstrate concrete value Firestore can't.
- **An MCP server before the toolset is at READY.** Compass §R9 and
  prior strategy docs both warn against this. Wait.
- **Custom mobile apps.** Mobile-responsive web first; native if a
  customer pays for it.
- **Open-sourcing the core.** The context-injection contract + the
  domain configs are the IP. Anything genuinely generic (the
  region-centroid lookup, the audience-preset module) ships open.

---

## What's true today (2026-04-25)

- Production live at `https://praxis.tacitus.me`. Cloud Run
  revisions `praxis-frontend-00048-p4t` + `praxis-backend-00029-6vc`.
- 53/53 AI routes calibrated through `withCalibration`.
- 49/49 routes persisting tool outputs per situation.
- Tool readiness: 34 READY, 8 PARTIAL, 6 PLACEHOLDER (47 total).
- Data feeds: 9 of 11 working zero-config; 2 freemium / paid
  pending the user actions in `docs/USER_ACTION_LIST.md`.
- Pricing: monthly plan-based public surface, internal credit
  metering hidden everywhere.
- Onboarding: 3-screen wizard, real-time mandate validation,
  feeding the system prompt block on every AI route.
- Dashboard: role-aware "Recommended for you" widget powered by
  the same module the sidebar "For you" anchor uses.
- All 10 deep-research questions answered (compass artifact).
- Compliance posture documented in `docs/COMPLIANCE.md`.

The platform is good. The next 90 days is about distribution
(Priority 1) and about getting from 8 PARTIAL tools to 0
(Priority 3).

---

## Where this doc lives

`docs/VISION_2026.md`. Linked from `docs/STRATEGY.md` and
`docs/SPRINT_BACKLOG.md`. Re-read at every quarter end. Edit only
when the strategic priority order changes.
