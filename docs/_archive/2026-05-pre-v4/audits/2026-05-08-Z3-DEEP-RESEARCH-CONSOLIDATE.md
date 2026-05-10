# 2026-05-08 Z3 Deep Research Consolidation

## Scope

Implemented `PRAXIS_V2_Z3_DEEP_RESEARCH_CONSOLIDATE.md`.

## Consumer Audit

Current active-code consumers were checked with:

```bash
rg "/api/ai/deep-research|/api/ai/deep-search-agent" src/ -l
```

Findings:

- `src/app/api/ai/deep-search-agent/route.ts` is the canonical route implementation.
- `src/app/api/ai/deep-research/route.ts` remains as the deprecated compatibility route.
- `src/lib/constants/tool-registry.ts` now points both the canonical `deep-search-agent` tool and the legacy `deep-research` tool entry at `/api/ai/deep-search-agent`.
- `scripts/verify-tools.ts` now verifies `/api/ai/deep-search-agent` instead of the deprecated route.
- No live UI component had a direct fetch to `/api/ai/deep-research`.

## Decision

Canonical route: `/api/ai/deep-search-agent`.

Deprecated route: `/api/ai/deep-research`, soft-deprecated as a local research-engine fallback with the same SSE event envelope.

## Runtime Metrics

D1 BigQuery production metrics were not available from this local pass, so p50/p95/cost/failure-rate remain unmeasured in production. The architecture decision is based on the code path: Agent Engine/session support plus explicit research-engine fallback is the stronger canonical contract.

## Guardrail

Added `audit:deep-research-canonical` and wired it into `audit:gate`.
