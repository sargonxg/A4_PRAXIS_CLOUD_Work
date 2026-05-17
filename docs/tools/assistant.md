# PRAXIS Assistant

**ID:** `assistant`  ·  **Category:** drafting  ·  **Status:** PARTIAL

> Multi-tool conversational interface backed by 27 AI chat tools. Drafts,
> researches, analyses, queries the conflict graph, and runs grounded web
> search — all inside the active situation's context.

## Route

- **Page:** `src/app/app/assistant/page.tsx` (thin wrapper around
  `<ChatInterface />`)
- **Component:** `src/components/assistant/chat-interface.tsx` (~750 lines)
- **APIs:**
  - `POST /api/ai/chat` — tool-calling mode (Vercel AI SDK `useChat`)
  - `POST /api/ai/grounded-search` — Google Search-grounded mode
- **Sidebar:** Workspace

## Inputs (read)

### From `AnalystProfile` (via `withCalibration`)

| Field | Usage |
|---|---|
| `identity.role` | Tone calibration; tool selection bias (e.g., diplomats lean on `draftSection` more) |
| `perspective.lenses` | Influences `queryConflictGraph` and `compareConflicts` weighting |
| `perspective.audience` | Output tone per response |
| `workingStyle.language` | Response language |
| `workingStyle.redLines` | Hard constraints — model declines requests that would violate |

### From the active `Situation`

| Field | Usage |
|---|---|
| `id` | Used as the chat's deduplication key (currently *not* used as a useChat `id`, which is part of the Stream B retrofit) |
| `name`, `region`, `actors` | System prompt context |
| `domain` | Domain-specific tool routing inside `tools.ts` |

### Live feeds (per tool)

The 27 chat tools each pull their own data — `webSearch` hits Firecrawl,
`humanitarianSnapshot` hits humanitarian data, `sanctionsCheck` queries OFAC/EU/UN
designation lists, etc. See `src/lib/ai/tools.ts` for the registry.

## Outputs (persist)

- **Firestore (intended, not yet wired):** `users/{uid}/situations/{sitId}/tools/chat`
- **Schema:** Vercel AI SDK message format
  `{ id, role, parts: [{type,text} | {type,toolCall,...}] }`
- **Pub/Sub:** none.

> **PARTIAL gap.** Today the chat starts blank every session because
> nothing is persisted. Stream B P0 (`docs/SPRINT_BACKLOG.md` §B-1)
> closes this — see that entry for the exact files to touch.

## Frameworks

- All 15 PRAXIS frameworks are reachable through the 27 tools.
  Frequently invoked: Glasl escalation (via `escalationAssessment`),
  Fisher-Ury (via `negotiationSpaceAnalysis`), OCHA (via
  `humanitarianSnapshot`).

## Data sources

- Inherits whichever the called tool needs — full SKC + feed-aggregator
  reach.

## AI model

- **Tier:** `getProModel()` for tool-calling chat;
  `getGroundedModel()` for grounded-search mode.
- **Why:** Tool-calling needs Pro for reliable JSON schema adherence;
  grounded mode uses Flash + Search for speed.
- **Fallback chain:** Anthropic Claude → Gemini Pro (per
  `getAnalysisModel`).

## UX behaviour

- `useSituationGuard()` at the top of the page; missing situation →
  `<NoSituationState />`.
- Two modes via toggle: **Standard** (tool-calling) and **Grounded**
  (web search).
- Quick-action bar (Research / Draft / Analyze / Terminology) prefixes
  the user's message with intent boilerplate.
- Suggested prompts vary by situation phase (`intake`, `mapping`,
  `assessment`, `monitoring`, `reporting`).
- Export chat as Markdown (client-side, no server round-trip).
- `RotateCcw` reload button replays the conversation against the
  latest message list.

## Extension surface

- **Add a new chat tool:** add an entry to `src/lib/ai/tools.ts` —
  follow the existing pattern (description, parameters Zod schema,
  execute fn). The model picks it up automatically on next deploy.
- **Add a new mode (e.g., "Sanctions only"):** add a third `useChat`
  instance pointing at a new `/api/ai/<mode>` route that filters its
  tool registry.
- **Per-domain tool routing:** edit `withCalibration`'s domain frame
  resolution so `chat` route hides irrelevant tools — e.g., a user in
  the `humanitarian` domain doesn't need `sanctionsCheck` on the top
  shelf.

## Operations

- **Required env vars:** `GOOGLE_AI_API_KEY` (or Vertex AI ADC).
- **Optional env vars:** `ANTHROPIC_API_KEY` (for `analyzeMediaSource`
  and other deep-analysis tools), `FIRECRAWL_API_KEY` (for
  `deepSourceResearch`).
- **Stale-after:** N/A (live conversation; no cache).
- **Cost characteristics:** 1 credit per chat message; tool calls
  inside a message inherit their own pricing (e.g.,
  `deepSourceResearch` is 4 credits).
- **Common failure modes:** model timeouts on long tool chains
  (`maxDuration` is 60s in the route — chains that exceed it return
  partial output).

## Open questions / TODO

- **B-1 retrofit (P0):** persist message history per situation. See
  `docs/SPRINT_BACKLOG.md`.
- Conversation memory inside SKC (Stream F-1): once persistence ships,
  index past messages so future tool calls can retrieve relevant prior
  exchanges.
- Streaming tool-call rendering — currently we wait for the whole
  message before showing the tool invocation card.
- Mobile layout: the input bar is cramped on narrow viewports.
