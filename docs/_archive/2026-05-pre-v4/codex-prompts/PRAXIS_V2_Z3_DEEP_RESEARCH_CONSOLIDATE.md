# Z3 — Consolidate `/api/ai/deep-research` and `/api/ai/deep-search-agent`

## Goal

Today there are two near-duplicate routes:

- `/api/ai/deep-research` — uses a local engine
- `/api/ai/deep-search-agent` — uses Vertex Agent Engine

Both produce similar deliverables. Different cost profiles, different
output shapes, confusing for users. This file picks one as primary
and either deprecates the other or makes it an explicit fallback.

**Run when**: after Sessions A-D. Engineering-clarity work, not
strategic.

## Files Codex must read first

- `src/app/api/ai/deep-research/route.ts`
- `src/app/api/ai/deep-search-agent/route.ts`
- Any UI that calls either endpoint

## Tasks

### 1. Compare the two

Codex produces a diff doc:

```markdown
# Deep research vs deep search agent

| dimension | deep-research | deep-search-agent |
|---|---|---|
| backend | local LangGraph | Vertex Agent Engine |
| latency p50 | ?ms | ?ms |
| latency p95 | ?ms | ?ms |
| cost per call | ? | ? |
| output shape | { ... } | { ... } |
| failure rate | ?% | ?% |
| consumer | ?ui callsite | ?ui callsite |
| capabilities | <list> | <list> |
```

Pull p50/p95/cost from BigQuery (D1) if running. Otherwise estimate
from a sample of recent calls.

### 2. Decision

Pick one as canonical based on the comparison. Default
recommendation: `deep-search-agent` if:

- It's reliable (failure rate < 5%)
- Cost is bounded
- Output shape is the more useful one

Otherwise `deep-research` (local) is canonical.

Document in `docs/architecture/DEEP_RESEARCH.md`.

### 3. Deprecation path

For the non-canonical route:

**Option A: Hard deprecate**: route returns 410 Gone after a
2-week notice period.

**Option B: Soft deprecate**: route stays as a fallback when
canonical fails. Document this in the code.

**Option C: Removal**: delete the route entirely (only if no
external/integration consumer).

Choose based on consumer audit (task 4).

### 4. Consumer audit

```bash
rg "/api/ai/deep-research|/api/ai/deep-search-agent" src/ -l
```

For each consumer:
- Internal UI callsite: redirect to canonical.
- External (e.g., MCP, Concordia Discors, third-party): notify GC.

### 5. Unified output shape

The two routes return slightly different JSON. Pick canonical shape
and adapt the non-canonical route to match (so a fallback returns
the same shape).

### 6. Audit: `audit:deep-research-canonical`

Static-marker confirming consumers call the canonical route, not the
deprecated one.

## Acceptance criteria

1. Comparison doc exists.
2. One route picked as canonical.
3. Non-canonical: deprecated with documented strategy.
4. All UI consumers point to canonical.
5. `audit:deep-research-canonical` passes.
6. Output shape consistent.

## Diagnostics

```bash
test -f docs/architecture/DEEP_RESEARCH.md && echo OK
npm run audit:deep-research-canonical && echo OK
npm run build && echo OK
```

## Commit

```
chore(Z3): consolidate deep-research routes

Picks <route> as canonical. <other-route> deprecated to <strategy>.
Unified output shape. UI consumers updated.

audit:deep-research-canonical prevents regressions.

Refs: V2_WORK_PACK/Z3_DEEP_RESEARCH_CONSOLIDATE.md
```
