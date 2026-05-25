# PRAXIS Answer Quality And Agentic Depth Audit

Date: 2026-05-25
Scope: Ask PRAXIS, context readiness, source proof, AgentRun proof, memo/output handoff, Boardroom entry, and degraded-state honesty.

## Recommendation

Ship one focused quality wave inside the existing Ask PRAXIS and Tasklet workbench surfaces. The app already has the right canonical stores and receipt contracts, but answer quality proof is scattered across multiple panels instead of summarized at the answer boundary.

## Evidence Checked

- Repo state: `main` at `033b2177`, tracking `origin/main`.
- Dirty tree before this audit: untracked `docs/audits/2026-05-25-agentic-search-redflags.{md,json}`. These were not modified.
- Architecture: `ARCHITECTURE.md`, `docs/architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md`, `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`.
- Ask seams: `src/lib/ai/ask-answer-envelope.ts`, `src/lib/ai/ask-orchestrator.ts`, `src/app/api/ai/chat/route.ts`, `src/components/ask/AskStreamPanel.tsx`, `src/components/praxis/tasklet-praxis-workbench.tsx`.
- Context seams: `src/lib/context/context-health.ts`, active ContextChain strip in `TaskletPraxisWorkbench`.
- Handoff seams: `AskArtifactPreview`, `/api/memos/from-ask-pack`, `/api/output-capsules`.
- Production checks: `/`, `/login`, `/app/boardroom`, `/api/health`, `/api/health/runtime`, `/api/health/agentic-search` on `https://praxis.tacitus.me`.

## Commands Run

| Command | Result | Notes |
| --- | --- | --- |
| `npm run audit:ask-cockpit-runtime` | PASS | Current Ask cockpit static contract is intact. |
| `npm run audit:agent-runtime-proof` | PASS with WARN | Static AgentRun contract exists; this shell lacks ledger, worker target/auth, Genkit live config, and ADK env. |
| `npm run audit:context-health` | PASS | Deterministic context-health next actions remain capped at three. |
| no-write `collectAgenticSearchHealth(...)` probe | BLOCKED locally | Used instead of `npm run audit:agentic-search` because that script writes `docs/audits/2026-05-25-agentic-search-redflags.*`, which already exists untracked. |
| production route probes | PASS | Public pages and health endpoints return `200`; production agentic-search health reports `ready`. |

## Findings

### User-visible UX gaps

1. Ask answers show rich proof, but not a single compact answer-quality posture before the user reads the detailed panels.
2. Context health is visible in the active capsule strip, but its labels are product-internal (`Baseline`, `Ready`, `Grounded`, `Operational`) rather than the plain pre-Ask states requested: `ready`, `thin`, `missing sources`, `stale sources`, `needs review`.
3. Follow-up actions exist, but the most operational actions are split across review cards, follow-ups, source-check row buttons, and artifact preview controls.

### Answer-quality gaps

1. `AskAnswerEnvelope` already exposes `traceabilitySummary`, `sourceAudit`, `sourceCards`, `groundingReceipt`, `continuationActions`, and `documentPackCandidate`, but it lacks a normalized summary that UI/tests can treat as the answer-quality contract.
2. Weak-context answers can show gaps and grounding repair notes, but the envelope does not expose first-class context repair actions that can be rendered consistently.
3. Confidence posture exists in `traceabilitySummary`, but source count, unsupported claims, queued/degraded deep-run posture, and best next action are not gathered into one compact strip.

### Context-creation gaps

1. Pre-Ask source readiness is present but not expressed in the requested plain states.
2. Upload/source attachment already uses canonical document and capsule paths, so this wave should not create a parallel source store.
3. Weak context should steer users toward source repair before memo drafting.

### Agentic-runtime gaps

1. Production reports agentic-search `ready`, while the local shell reports blocked runtime env. The product should keep exposing this distinction truthfully.
2. `AskConversationOrchestrationReceipt` already queues complex/current/source-heavy prompts when routing decides a worker mode is required.
3. If queued runtime is unavailable, existing receipts can mark dispatch/ledger failure; answer UI should surface that as answer-quality posture rather than hiding it in advanced details.

### Eval and verification gaps

1. Existing unit tests cover envelope construction, source previews, orchestration events, and workbench rendering markers.
2. Missing focused tests for the proposed answer-quality summary, context repair actions, and quality-strip rendering.
3. `graphify-out/GRAPH_REPORT.md` is stale (`444201c5` vs current `033b2177`) and must be refreshed after code changes before relying on it as current evidence.

## Implementation Scope

- Add an `answerQualitySummary` to `AskAnswerEnvelope`, derived from existing source audit, traceability, grounding receipt, document pack, and orchestration receipt fields.
- Add `contextRepairActions` to `AskAnswerEnvelope`, derived from gaps, missing sources, unsupported claims, and traceability posture.
- Add an `agenticDepthRecommendation` to `AskAnswerEnvelope`, derived from existing orchestration receipts and queued-run/degraded runtime status.
- Render a compact answer-quality strip in `AskStreamPanel` and `TaskletPraxisWorkbench`.
- Tune context strip plain-state copy without adding a new route or top-level navigation item.
- Keep AgentRun, memo draft, OutputCapsule, document upload, capsule attachment, and source receipt stores canonical.

## Ship Gate

Targeted verification for this wave should include:

- Focused Vitest for `ask-answer-envelope`, Ask source preview/strip contract, Tasklet workbench contract, orchestrator if touched, and next moves if ranking changes.
- `npm run typecheck`
- `npm run build`
- `npm run verify:design`
