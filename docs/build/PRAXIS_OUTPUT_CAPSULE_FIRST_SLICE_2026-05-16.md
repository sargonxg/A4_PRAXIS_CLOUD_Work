# PRAXIS OutputCapsule First Slice

Date: 2026-05-16

Status: first product slice implemented; persistence from live agent/tool runs is still planned.

## What Is Live

- `src/lib/output-capsules/` is now the code-backed OutputCapsule registry.
- Records carry `schemaId` and `schemaVersion`; Firestore-facing records do not store Zod schema objects.
- The initial template catalog covers:
  - `daily-read`
  - `morning-brief`
  - `country-one-pager`
  - `country-risk-card`
  - `actor-dossier`
  - `media-roundup`
  - `narrative-monitor`
  - `humanitarian-one-pager`
  - `risk-monitor-card`
  - `electoral-risk-card`
  - `governance-index`
  - `options-memo`
  - `diplomatic-cable`
  - `talking-points`
  - `country-pack`
- `planOutputCapsuleRun()` deterministically reports missing required cores,
  suggested tool/agent steps, compose steps, approval gates, destination,
  `canRun`, and explanation.
- `evaluateOutputCapsuleQuality()` reports citation coverage, sourceability
  posture, unsupported/gap counts, blockers, and transition readiness.
- `composeOutputCapsules()` supports the first composite:
  `country-pack = country-one-pager + media-roundup + country-risk-card +
  humanitarian-one-pager`.
- The shared public/auth cockpit exposes a compact Produce selector from the
  registry with selected output type, active capsule, missing inputs, and
  suggested producer steps.

## Hidden Tool Bindings

The adapter `getOutputTemplatesForTool(toolId)` maps existing hidden or
secondary tool ids into durable output templates:

| Tool id | Output template |
| --- | --- |
| `media-roundup` | `media-roundup` |
| `info-environment` | `narrative-monitor` |
| `electoral-risk` | `electoral-risk-card` |
| `peacebuilding-index` | `governance-index` |
| `scenarios` | `risk-monitor-card` |
| `humanitarian` | `humanitarian-one-pager` |
| `policy-memo` | `options-memo` |
| `talking-points` | `talking-points` |

This is an adapter layer only. Existing tool routes remain intact.

## Why OutputCapsule Is Separate From ContextCapsule

ContextCapsules hold reusable context: user posture, situation framing,
sources, documents, graph/time state, tools, objectives, and memory.
OutputCapsules hold generated or assembled policy products: a memo, card,
brief, cable, table, pack, or other exportable artifact.

Keeping them separate avoids turning context into prose too early. A user can
reuse the same ContextCapsule to produce several OutputCapsules, and a
composite OutputCapsule can preserve the provenance of multiple input outputs
without flattening citations, gaps, or contradictions.

## Still Planned

- Persist real generated OutputCapsule records from agent/tool execution into
  Memo Studio, Library, Canvas, or Handover.
- Attach run-ledger ids and approval receipts to generated OutputCapsules.
- Wire selected text Sourceability checks in Memo Studio directly into output
  quality updates.
- Add export implementations for DOCX, PDF, PPTX, and HTML once persistence is
  stable.
- Add richer contradiction representation for composite packs instead of only
  preserving gaps and input provenance.

## Validation Evidence

Validated on 2026-05-16:

```bash
npx tsc --noEmit
# passed

npx vitest run tests/unit/lib/output-capsules
# passed: 1 file, 7 tests

npx vitest run tests/unit/lib/product/context-capsules.test.ts tests/unit/lib/product/policy-agents.test.ts
# passed: 2 files, 10 tests

npm run lint
# passed with existing warnings

graphify update .
# passed; graph.json and GRAPH_REPORT.md refreshed, graph.html skipped because the graph exceeds the HTML node limit

npm run build
# passed; Turbopack reported the existing NFT tracing warning for next.config.ts -> semantica rust runtime
```
