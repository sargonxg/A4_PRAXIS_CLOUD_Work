# PRAXIS Grounded Search Intelligence Spine

Status: active implementation plan.
Date: 2026-04-29.

## Product Direction

PRAXIS should treat grounded, checkable web research as the primary live
intelligence path. Public structured feeds such as GDELT, ReliefWeb, UN News,
UCDP, HDX, UNHCR, World Bank, SIPRI, and Crisis Group are corroborating and
quantitative layers. They are valuable, but they should not be presented as the
main way the user understands a fast-moving political situation.

The user-facing promise is:

1. Search the open web with visible, checkable sources.
2. Scrape or extract source text where allowed.
3. Convert political information into structured Conflict Grammar entities.
4. Preserve provenance at the fragment level.
5. Build an evolving situation graph.
6. Generate analysis only from the graph plus source-linked evidence.

## Primary Architecture

### 1. Query Planning

Input: active situation, actors, region, user role, tool objective, prior graph
coverage, and source preferences.

Output:
- primary query;
- actor-specific queries;
- claim/commitment queries;
- narrative/media framing queries;
- official-document queries;
- local/regional media queries;
- time-windowed monitoring queries.

Acceptance criteria:
- every AI tool that needs current facts calls the query-planning layer or
  receives its output through `buildWebGroundedContext`;
- query plans include why each query exists;
- query plans can be rendered in a debug/provenance panel.

### 2. Search Providers

Primary:
- Google Search grounding through Gemini/Vertex.

Optional enrichment:
- Parallel.ai for long-form LLM-ready source discovery and second-lens search;
- Firecrawl for scrape/crawl/map/extract on pages where deeper text is needed;
- Tavily as another research lens if configured.

Acceptance criteria:
- grounded Google Search runs first for live intelligence;
- optional providers are clearly marked as enrichment, not hidden magic;
- provider failures degrade visibly without blocking all analysis;
- source cards show provider, URL, title, date if known, and source domain.

### 3. Source Understanding

Each source result should become a typed evidence record:

- `sourceId`
- `url`
- `title`
- `domain`
- `provider`
- `publishedAt`
- `retrievedAt`
- `sourceType`: official, wire, local-media, think-tank, humanitarian,
  academic, legal, social, unknown
- `reliabilityScore`
- `biasOrPositioning`
- `excerpt`
- `fullTextHash`
- `language`
- `translationStatus`
- `licenseOrAccessNote`

Acceptance criteria:
- no export or AI answer cites a source that cannot be opened or identified;
- undated search results are labeled undated rather than assigned today's date;
- source confidence distinguishes page existence from claim verification.

### 4. Political Information Extraction

For each source fragment, extract Conflict Grammar primitives:

- Actor
- Claim
- Interest
- Constraint
- Leverage
- Commitment
- Event
- Narrative
- Institution
- Norm
- Resource
- Risk
- Policy
- Grievance

Additional extraction categories for political users:
- media frame;
- bias/positioning;
- audience;
- quoted speaker;
- commitment made;
- deadline or trigger date;
- sanction/legal instrument;
- disputed factual claim;
- confidence and contradiction markers.

Acceptance criteria:
- extraction output has schema validation;
- every extracted primitive links to `sourceFragmentIds`;
- the UI can show "derived from paragraph/source X";
- failed extraction produces a retryable error, not silent absence.

### 5. Commitment Tracer

Purpose: track what actors promised, threatened, denied, accepted, or violated.

Data model:
- actor;
- commitment text;
- commitment type: promise, threat, concession, red line, ceasefire term,
  legal obligation, public pledge;
- source fragment;
- date made;
- deadline;
- counterparty;
- verification status;
- later evidence that supports, updates, or contradicts it.

Acceptance criteria:
- users can ask "what changed since last week?";
- Ask PRAXIS can cite the chain of commitment evidence;
- violations are never inferred without an explicit source chain.

### 6. Media Analysis

Purpose: help users understand narratives, not just events.

Capabilities:
- compare coverage across official, wire, local, and partisan sources;
- identify frame, emphasis, omissions, and loaded terms;
- detect actor-aligned narratives;
- separate fact claims from interpretation;
- surface contradiction clusters.

Acceptance criteria:
- media analysis always shows the source set used;
- frame labels are explanations, not unsupported accusations;
- the UI distinguishes "source says" from "PRAXIS assesses".

### 7. Situation Graph Ingestion

Target graph spine:

`Source -> Fragment -> Primitive -> Relationship -> Tool Output -> Decision`

Near-term storage:
- Firestore evidence envelopes and tool-data documents.

Future storage:
- graph database or hybrid relational/vector/graph layer;
- LangGraph-style agent orchestration for durable research workflows;
- graph-native conflict ontology with versioned extraction runs.

Acceptance criteria:
- graph nodes and edges carry provenance;
- repeated analyses update existing entities instead of duplicating them blindly;
- graph coverage metrics report missing actors, claims, interests,
  constraints, commitments, events, and narratives.

## High-Priority Implementation Queue

1. Make grounded Google Search run by default in live intelligence feeds.
2. Show grounded search as the first source in Source Monitor.
3. Add provider/source badges to intelligence items.
4. Store source evidence records separately from AI outputs.
5. Add source-fragment IDs to all Executive Intelligence graph nodes and edges.
6. Build a Source/Provenance panel shared by Ask PRAXIS and flagship tools.
7. Add extraction schema for media frames and commitments.
8. Build Commitment Tracer as a first-class tool.
9. Add append-only tool run history with prompt/source/model metadata.
10. Add "weak input / weak source" confidence warnings to every generated
    output.
11. Add Firecrawl scrape-on-demand for selected source cards.
12. Add Parallel.ai second-lens source discovery when configured.
13. Add conflict-ontology ingestion jobs for source fragments.
14. Add source contradiction detection.
15. Add graph coverage health to the dashboard.

## Verification Matrix

Use three real situations:

- geopolitical crisis;
- corporate/policy conflict;
- legislative or regulatory battle.

For each:

- create situation;
- run grounded search;
- open at least five source URLs;
- scrape/extract at least one source if provider configured;
- generate Executive Intelligence;
- ask Ask PRAXIS about one actor, one commitment, one risk, and one media
  narrative;
- verify answers cite source fragments or explicitly state the gap;
- export the report and confirm source/provenance sections are real.

## Current Code Changes Started

- `src/lib/data-feeds/feed-aggregator.ts`: grounded Google Search now runs as
  the primary live intelligence path in the v1 and conflict-profile aggregators.
- `src/lib/data-feeds/ucdp-client.ts`: UCDP now uses versioned API endpoints
  and the `UCDP_API_TOKEN` / `x-ucdp-access-token` header when configured.
- UCDP conflicts are now emitted as visible intelligence feed items rather than
  only hidden profile-scoring context.
- `src/lib/data-feeds/aggregator-v2.ts`: user-aware intelligence now runs
  grounded search first and treats structured feeds as corroboration.
- `src/lib/data-feeds/grounded-search-client.ts`: documentation now describes
  the client as the primary live-research path.
- `src/app/app/source-monitor/page.tsx`: Source Monitor now lists grounded
  search first and sends a valid country/query request to the intelligence API.
- ACLED active provider/runtime paths have been removed or relabeled away from
  paid-data dependency claims.
