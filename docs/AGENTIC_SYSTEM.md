# PRAXIS Agentic System

Status: active design.
Last updated: 2026-04-28.

## Ask PRAXIS extension tools (2026-04-28)

The calibrated chat backbone (`/api/ai/chat`, aliased at
`/api/ai/ask-praxis`) attaches four tier-aware extension tools on every
request via `buildAskPraxisExtensions()` in `src/lib/ai/ask-praxis-tools.ts`:

| Tool | Description | Tier gate | Key gate |
|---|---|---|---|
| `writeToTool` | Persist a structured payload to `tools/{toolId}` under the active situation. Use to populate briefing blocks, indicator cards, timeline events. | none | none |
| `firecrawlFetch` | Scrape one URL and return clean markdown. Free users limited to 5 fetches per session. | rate-limit on `free` | optional Firecrawl key (free fallback) |
| `parallelResearch` | Multi-step research via Parallel.ai. | `analyst+` | required Parallel key |
| `runDeepResearch` | Vertex ADK Deep Research Agent directive. | `analyst+` (free returns fallback) | none |

Each tool returns a structured `requiresTier` / `requiresKey` payload
when the user lacks a plan or credentials so the UI surfaces upgrade /
settings chips inline. Tier resolver: `src/lib/api/tier.ts`.

Server-side helper `delegateToAskPraxis()` (`src/lib/ai/ask-praxis.ts`)
lets any tool route ask the calibrated backbone a sub-question with
shared corpus retrieval — used by Briefing block regeneration and risk
indicator commentary.



## Objective

PRAXIS agents should help analysts think, research, challenge assumptions, and
prepare defensible products. They should not silently mutate canonical
knowledge. Agents propose, explain, cite, and ask for approval.

Round 6 architecture decision: durable multi-step agents use LangGraph with
Cloud SQL Postgres checkpointing. Vertex AI Agent Engine remains the managed
Deep Research path. Firestore remains the source of truth for user-visible
state, tool outputs, graph proposals, jobs, events, and notifications.

## Agent Types

| Agent | Role | Inputs | Outputs | Execution path |
|---|---|---|---|---|
| Situation Analyst | Summarizes what changed and what matters | Situation corpus, recent feed alerts, profile | Daily read, next action | LangGraph after runtime foundation |
| Source Scout | Finds and ranks current sources | Keywords, source domains, region, language | Search plan, source list, citations | Grounded Google Search; LangGraph later |
| Graph Cartographer | Proposes actor/claim/edge changes | Documents, ARGUS, tool outputs | `graph_updates` proposals | LangGraph + approval queue |
| Timeline Editor | Builds evidence-backed event sequence | Feed alerts, docs, graph updates | Timeline event proposals | LangGraph + Firestore proposals |
| Media Analyst | Clusters narratives and framing | Media Roundup query plan, sources | Clusters, divergence, source diversity | AI route + BigQuery/feed cache |
| Legal Analyst | Tracks commitments and mandates | Legal Tracker, resolutions, sources | Obligations, breaches, deadlines | Calibrated AI route |
| Humanitarian Analyst | Assesses access, protection, displacement | ReliefWeb/HDX/OCHA-style sources, docs | Humanitarian snapshot | Dedicated route planned |
| Red Team Critic | Challenges assumptions and weak evidence | Any draft output + corpus trace | Critique, confidence adjustment | LangGraph review pass |
| Synthesis Chair | Consolidates expert discussion | Expert turns, critique, user mandate | Memo, options, trade-offs | Brainstorming Table / Brief Builder |

## Brainstorming Table MVP

The Brainstorming Table should show agent reasoning as a table, not as hidden
chain-of-thought. Each row is a structured contribution:

| Field | Meaning |
|---|---|
| `turnId` | Stable row identifier |
| `persona` | Expert role, e.g. mediator, humanitarian, legal, media, red team |
| `claim` | The proposed analytical point |
| `evidence` | Citations or corpus items supporting it |
| `critique` | Objections, uncertainty, missing sources |
| `recommendation` | Practical next action |
| `confidence` | high / medium / low |
| `status` | proposed / challenged / accepted / rejected |

MVP route:

- UI: `/app/brainstorming-table`
- API: `/api/ai/brainstorming-table`
- Storage: `users/{uid}/situations/{situationId}/tool-data/brainstorming-table`
- Long-running execution: Cloud Tasks queue `praxis-agents` after the first
  synchronous prototype.

## Guardrails

- Agents never write canonical graph/timeline/profile state directly.
- Agent proposals must contain provenance and confidence.
- User approvals create canonical writes and append audit events.
- Long-running work writes `background_jobs` and `system_events`.
- Any failed agent run must be visible in Activity Feed or admin diagnostics.

## Cloud Architecture

- Cloud Run frontend API routes orchestrate short synchronous work.
- Future `praxis-agents` Cloud Run service hosts long-running LangGraph work.
- Cloud SQL Postgres stores LangGraph checkpoints only.
- Cloud Tasks queues durable work:
  - `praxis-research`: web/source research and media scans.
  - `praxis-agents`: multi-agent deliberation and critique phases.
  - `praxis-embeddings`: corpus embedding refresh.
- Pub/Sub handles event fan-out such as `profile.events`, document uploads,
  and future graph/timeline proposal notifications.
- Firestore stores user-visible state, proposals, jobs, events, and tool
  outputs.
- BigQuery stores aggregate operational/feed intelligence.
- Vertex AI provides models, embeddings, grounding, and future Agent Engine
  experiments.
- Vertex AI Search / RAG Engine is the planned managed retrieval path for
  large public/situation corpora once the current SKC contracts are stable.
- Grounded Google Search stays the default real-search path for current,
  source-backed public research.

## First Implementation Queue

1. ✅ Brainstorming Table registry entry — shipped 2026-04-26 in
   `src/lib/constants/tool-registry.ts` (simulation category, 5 credits,
   48h staleness, Pro tier, related tools negotiation-prep / mediation-design
   / concordia / humanitarian / legal-tracker).
2. ✅ Structured schemas for persona turns and synthesis — shipped
   2026-04-26 as `BrainstormingTableSchema` in
   `src/app/api/ai/brainstorming-table/route.ts` (Zod). Tests live at
   `tests/services/brainstorming-table-schema.test.ts`.
3. ✅ Read-only UI with seeded personas and empty state — shipped
   2026-04-26 at `src/app/app/brainstorming-table/page.tsx` (question
   textarea, persona-coloured table, synthesis card, demo-mode banner,
   onboarding gate, situation guard).
4. ✅ Synchronous calibrated route using active situation corpus —
   shipped 2026-04-26. `withCalibration('brainstorming-table',
   'ai_brainstorming_table')`, calls `searchSituationCorpus` (Lane A),
   degrades closed when retrieval fails, runs Pro model with
   `Output.object`.
5. ✅ Persist output to `tool-data/brainstorming-table` — shipped via
   `saveToolOutput` with personas, retrievalTrace, and question metadata.
6. ✅ Add export to memo/Markdown — shipped in round 4.
7. ⏳ Move execution to LangGraph + Cloud SQL checkpoints once the runtime
   foundation is in place. The `praxis-agents` queue and Cloud SQL checkpoint
   database are provisioned. Detailed plan:
   `docs/DEEP_RESEARCH_ACTION_PLAN_2026-04-27.md`.
8. ⏳ Add red-team pass and approval statuses (deeper review loop than
   the in-table red-team turn — a separate critique pass that flags
   confidence and source-diversity issues before the synthesis chair
   composes).

