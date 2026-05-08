# Deep Research Route Consolidation

Status: accepted on 2026-05-08.

## Deep research vs deep search agent

| dimension | deep-research | deep-search-agent |
|---|---|---|
| backend | Local PRAXIS research engine using grounded search, scraping fallbacks, and `streamText` synthesis. | Canonical Vertex Agent Engine / ADK route with managed session support and local research-engine fallback. |
| latency p50 | Not measured from D1 BigQuery in this local pass. Expected lower startup latency when only the local fallback runs. | Not measured from D1 BigQuery in this local pass. Expected higher startup latency when Agent Engine session creation is required. |
| latency p95 | Not measured; no live KPI sample was available in this shell. | Not measured; no live KPI sample was available in this shell. |
| cost per call | Bounded by one local grounded-search synthesis call; historical registry cost is 5 credits. | Canonical budgeted route; registry cost is 10 credits, with fallback using the local research engine when Agent Engine is unavailable. |
| output shape | Now emits the canonical `text/event-stream` envelope: `planning`, `research`, `synthesis`, `done`, and `error` events. | Canonical `text/event-stream` envelope: `status/session`, `planning`, `research`, `synthesis`, `done`, and `error` events. |
| failure rate | Not measured from D1 BigQuery in this local pass. | Not measured from D1 BigQuery in this local pass. |
| consumer | Soft-deprecated compatibility route only. Tool registry and verification scripts must not point new consumers here. | Canonical API for Deep Research Agent and all registry/tool consumers. |
| capabilities | Single local research-engine pass with grounded search/source scraping where configured. | Managed multi-turn Agent Engine session when configured; falls back to local research-engine envelope when not configured or unavailable. |

## Decision

`/api/ai/deep-search-agent` is canonical.

Reasoning: it already carries the stronger product contract: managed sessions, Agent Engine integration, persisted session continuity, canonical tool id persistence, and an explicit fallback path. The D1 production KPI stream is not yet live enough from this shell to prove p50/p95/failure-rate differences, so the decision is based on code-path capability and existing product positioning rather than unverified production metrics.

## Deprecation Strategy

`/api/ai/deep-research` is **soft-deprecated**.

It remains available as a compatibility fallback for older callers, but it now:

- returns the same SSE envelope as `/api/ai/deep-search-agent`;
- persists under `deep-search-agent` with metadata noting `sourceRoute: /api/ai/deep-research`;
- sends explicit headers:
  - `X-PRAXIS-Deprecated-Route: /api/ai/deep-research`
  - `X-PRAXIS-Canonical-Route: /api/ai/deep-search-agent`
  - `X-PRAXIS-Fallback-Strategy: soft-deprecated-research-engine-fallback`

Hard removal is deferred because archived docs and possible external scripts may still reference the old route. No active UI consumer should call it.

## Guardrail

`npm run audit:deep-research-canonical` enforces:

- Z3 prompt preservation;
- this architecture decision exists;
- registry and verification scripts point to `/api/ai/deep-search-agent`;
- the deprecated route declares the canonical route and deprecation headers;
- both routes use the shared `deep-research-agent` SSE envelope helpers.
