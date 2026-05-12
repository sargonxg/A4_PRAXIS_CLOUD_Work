# C1 — Memory recall in `withCalibration`

## Goal

Cognee is now live (C0). But no hero tool actually consumes memory
recalls in its prompt context. This file wires `MemoryLayer.recall`
into `withCalibration`'s prompt-context build, so every calibrated
hero tool prompt includes relevant prior-case memory when
`COGNEE_ENABLED=true`.

When Cognee is off (or recall fails / returns empty), the memory
block is omitted gracefully. No regression.

## Pre-conditions

1. C0 shipped: smoke test green, `COGNEE_ENABLED=true` in production.
2. Night-pack `02_CALIBRATION_RUNTIME_AUDIT.md` shipped: every
   calibrated hero tool actually goes through `withCalibration`.

## Files Codex must read first

- `src/lib/api/with-calibration.ts`
- `src/lib/knowledge/memory-layer.ts` (now functional after C0)
- `src/lib/calibration/build-tool-context.ts` (or wherever the
  context block is assembled)
- A representative hero tool's POST handler (e.g.,
  `/api/tools/factbook/route.ts`) to confirm the call flow

## Tasks

### 1. Recall step in `buildToolContext`

In `src/lib/calibration/build-tool-context.ts`:

```typescript
import { MemoryLayer } from '@/lib/knowledge/memory-layer';

export async function buildToolContext(params: BuildToolContextParams): Promise<ToolContext> {
  // existing assembly...
  const graphContext = await retrieveForProfile(params);
  const profileContext = composeProfileBlock(params);
  const sourceContext = collectSources(params);

  // NEW: memory recall
  let memoryContext: MemoryContextBlock = { included: false, items: [] };
  if (MemoryLayer.isEnabled) {
    try {
      const t0 = Date.now();
      const recall = await new MemoryLayer().recall({
        caseId: params.caseId,
        query: params.heroToolQuery ?? params.userPrompt,
        limit: 5,
      });
      const latencyMs = Date.now() - t0;

      memoryContext = {
        included: recall.results.length > 0,
        items: recall.results.slice(0, 5).map((r) => ({
          summary: r.text.slice(0, 500),
          relevance: r.score,
          recordedAt: r.recordedAt,
        })),
        latencyMs,
        reason: recall.results.length === 0 ? recall.reason : undefined,
      };
    } catch (err) {
      console.warn('memory recall failed in buildToolContext', err);
      memoryContext = { included: false, items: [], reason: 'recall-failed' };
    }
  }

  return {
    graph: graphContext,
    profile: profileContext,
    sources: sourceContext,
    memory: memoryContext,
  };
}
```

### 2. Memory block in the system prompt

In the place where the hero-tool system prompt is composed (likely
in `withCalibration`'s `assembleSystemPrompt` step):

```typescript
function memoryBlock(ctx: MemoryContextBlock): string {
  if (!ctx.included || ctx.items.length === 0) return '';
  const lines = ctx.items.map((item, i) =>
    `[memory ${i + 1}] (relevance ${(item.relevance * 100).toFixed(0)}%, recorded ${item.recordedAt})\n${item.summary}`
  );
  return `\n\n## Prior case memory (Cognee)\n\nThe following items from this case's memory layer may be relevant:\n\n${lines.join('\n\n')}\n\nReference these where useful but rely on the GRAPH and SOURCES blocks for primary evidence.\n`;
}

const systemPrompt = `${baseInstructions}\n${profileBlock(ctx.profile)}\n${graphBlock(ctx.graph)}\n${sourcesBlock(ctx.sources)}${memoryBlock(ctx.memory)}`;
```

The memory block is **last** in the prompt — primary evidence stays
graph + sources. Memory is supplementary context.

### 3. Calibration snapshot includes memory diagnostic

In the calibration snapshot returned to the UI, add:

```typescript
// existing CalibrationSnapshot type
export interface CalibrationSnapshot {
  composite: { health: number; reasons: string[] };
  graph: { ... };
  profile: { ... };
  sources: { ... };
  // NEW
  memory: {
    enabled: boolean;
    itemsRecalled: number;
    latencyMs?: number;
    reason?: string;
  };
}
```

The UI's calibration card (Diagnostics chapter, prompt-health
breakdown) renders a small "Memory: 3 items recalled" or "Memory:
disabled" line.

### 4. Cognify on every hero-tool run

After a hero tool completes successfully, write the result back into
Cognee so the next call has it as memory:

```typescript
// in withCalibration, after the model call succeeds:
if (MemoryLayer.isEnabled && result.ok) {
  // Fire-and-forget cognify (don't await — user response shouldn't wait)
  new MemoryLayer().cognify({
    caseId: params.caseId,
    text: summarizeForMemory(result.output),
    metadata: {
      kind: 'tool-output',
      toolId: params.toolId,
      uid: params.user.uid,
      runAt: new Date().toISOString(),
    },
  }).catch((err) => {
    console.warn('cognify post-run failed', err);
    // Not fatal; not surfaced to user.
  });
}
```

`summarizeForMemory` is a small helper that takes the structured tool
output and produces a 1-2 paragraph natural-language summary. Codex
implements it as a deterministic transformation (not another LLM
call) — extract the most important fields.

### 5. Audit: `audit:memory-in-calibration`

```typescript
// scripts/audit-memory-in-calibration.ts
// Static-marker. Confirms:
//   - buildToolContext imports MemoryLayer
//   - The system prompt assembly references memoryBlock
//   - The CalibrationSnapshot type includes a memory field
```

Add to `audit:gate`.

### 6. Latency budget

Recall adds latency to every hero-tool run. Measure and budget:

- p50 recall latency target: < 200ms
- p95 recall latency target: < 800ms

If p95 exceeds the budget, the recall is wrapped in a 1.5s timeout
that falls through to no-memory-block on timeout. Codex implements
the timeout already in step 1 via `AbortSignal.timeout` in
`cogneeFetch` (5s).

For C1, tighten the recall path specifically to 1500ms:

```typescript
// in MemoryLayer.recall, allow caller to specify timeout
async recall(payload: RecallRequest, opts: { timeoutMs?: number } = {}): Promise<RecallResponse> {
  if (!ENABLED) return { results: [], reason: 'cognee disabled' };
  const res = await cogneeFetchWithTimeout('/api/v1/recall', {
    method: 'POST', body: JSON.stringify(payload),
  }, opts.timeoutMs ?? 5000);
  // ...
}
```

In `buildToolContext`, pass `{ timeoutMs: 1500 }`.

### 7. Documentation

Update `docs/architecture/MEMORY_LAYER.md`:

```markdown
## Integration with calibrated tools

Every calibrated hero tool runs through `withCalibration`, which
calls `buildToolContext`. The build step performs:
1. Graph retrieval (graph_nodes / graph_edges)
2. Vector search (graph_embeddings)
3. **Memory recall (Cognee)** ← C1
4. Profile composition
5. Source collection

The memory block is appended to the system prompt LAST, so primary
evidence (graph + sources) drives reasoning. Memory provides
contextual continuity across runs in the same case.

Latency budget: 1500ms. Recall failures degrade gracefully — the
prompt is assembled without the memory block.

After a successful hero-tool run, the output is summarized and
cognified back to memory (fire-and-forget).
```

## Acceptance criteria

1. `buildToolContext` calls `MemoryLayer.recall` when enabled.
2. Memory block appears in the system prompt (when items returned).
3. Recall has 1500ms timeout with graceful fallthrough.
4. Tool output cognified after successful run (fire-and-forget).
5. `CalibrationSnapshot.memory` exposed to the UI.
6. UI renders memory line in calibration card.
7. `audit:memory-in-calibration` passes.
8. Manual smoke: run a hero tool twice on the same case. Confirm
   the second run's calibration snapshot shows recalled items > 0.

## Diagnostics

```bash
grep -q "MemoryLayer" src/lib/calibration/build-tool-context.ts && echo OK
grep -q "memoryBlock" src/lib/api/with-calibration.ts && echo OK
grep -q "cognify" src/lib/api/with-calibration.ts && echo OK
npm run audit:memory-in-calibration && echo OK
npm run build && echo OK

# Manual: run a hero tool, observe /api/memory/recall network call.
# Latency should be < 1500ms p95.
```

## If Codex stops short

**Failure mode A**: Recall blocks the response when Cognee is slow.
Re-prompt:

> "The 1500ms timeout must be hard. Confirm `AbortSignal.timeout`
> fires and the catch falls through to `memoryContext = { included:
> false, ... }`. Test by setting COGNEE_BACKEND_URL to an unreachable
> host — the tool run should still complete in < 5s."

**Failure mode B**: Memory block appears at the top of the prompt
and overrides primary evidence. Re-prompt:

> "Memory must be the LAST block. Order:
>   base instructions → profile → graph → sources → memory.
> Confirm the concat order and that the memory header instructs the
> model: 'rely on GRAPH and SOURCES for primary evidence.'"

**Failure mode C**: Cognify-after-run blocks the user. Re-prompt:

> "Cognify after the tool run is fire-and-forget. Confirm there's no
> `await` and the catch is silent. Cognify failures must not bubble
> to the user."

**Failure mode D**: `summarizeForMemory` calls an LLM, doubling cost.
Re-prompt:

> "summarizeForMemory must be deterministic — extract the most
> important fields from the structured output (titles, headlines,
> first paragraphs of memos, etc). No additional LLM call. The point
> of memory is to be cheap and durable."

## Commit

```
feat(C1): memory recall in withCalibration

buildToolContext now performs MemoryLayer.recall before assembling
the system prompt. Recalled items appear as a "Prior case memory"
block at the END of the prompt (graph + sources remain primary
evidence). 1500ms timeout with graceful fallthrough.

After every successful hero-tool run, the output is summarized
deterministically and cognified back to memory (fire-and-forget).

CalibrationSnapshot exposes memory diagnostic to the UI.

audit:memory-in-calibration enforces the integration.

Refs: V2_WORK_PACK/C1_MEMORY_RECALL_IN_CALIBRATION.md
```
