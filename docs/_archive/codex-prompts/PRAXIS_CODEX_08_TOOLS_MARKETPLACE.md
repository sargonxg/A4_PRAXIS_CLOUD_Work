# PRAXIS — Codex Pack 08: Tools Marketplace & End-to-End Validation

**Branch**: `feature/tools-marketplace`
**Depends on**: Packs 03, 04, 05, 06, 07 merged.
**Owner gate**: Do not merge to `main` without Giulio's sign-off.
**Estimated effort**: ~5 days (~50 engineering hours).

---

## 0. Why this pack exists

After packs 03-07, PRAXIS has:
- A workbench shell that holds any case (pack 03).
- A clean entry point that does not pretend the product is Syria-shaped (pack 04).
- A separation between Context (chapters 1-3) and Tools (chapters 4-5) with a Context Health gate (pack 05).
- A typed, validated, ontology-aware graph layer with four ontologies (pack 06).
- An interactive viewer where the user can read, filter, edit, and persist views of that graph (pack 07).

What it does NOT yet have is a coherent answer to the question "what can I do with this case?". The current `src/lib/constants/tool-registry.ts` is 1,203 lines listing 55 tools. Many are duplicates, many are aspirational, several are dead. The product surface that exposes them — the existing `tools` tab and the various `desk` re-exports — presents a list, not a marketplace. There is no schema-driven execution form, no result persistence, no tool chaining, and no end-to-end test that proves "user creates case → ingests documents → runs three tools → exports a brief" actually works for any persona.

This pack closes that gap. It does three things:

1. **Curates the tool registry** down to a high-quality set of ~16 tools, organized by which ontologies and Context Health they require. Every shipped tool runs end-to-end on at least one of the four sample cases.
2. **Builds the marketplace** — a card-based catalog where users browse, filter by need, and run tools. Every tool's UI is auto-generated from a single JSON-Schema declaration so adding a 17th tool is one file, not seventeen.
3. **Validates production-readiness** — four persona × ontology end-to-end Playwright suites, performance budgets enforced in CI, a diagnostics dashboard surfacing what is broken or slow, and a final production-readiness checklist.

After this pack, a Mediator can sign in for the first time, create the Northwind case, ingest the Slack export, run the "Position vs Interest" tool, run the "Trust Signal Timeline" tool, chain into "Mediation Brief Generator," and export the brief — and Playwright runs that exact sequence on every commit. Same for the Diplomat on Syria, the Analyst on Sahel, and the Researcher on Nordalia disinfo.

The product becomes usable. That is the bar this pack must clear.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | Tool registry curated to ~16 production-grade tools, each declared as a JSON-Schema spec | `src/lib/tools/registry/` has ≤ 16 entries; legacy registry archived; every entry validates against `tool.schema.json` |
| 2 | Tool marketplace UI: card-based catalog, search, filters by ontology, persona, Context Health requirement, runtime, output type | Visit `/app/workbench/<caseId>?tab=tools` → cards render, filters work |
| 3 | Schema-driven execution form: input UI generated from each tool's `inputSchema` | Adding a new tool with 5 fields requires zero UI code |
| 4 | Every tool runs end-to-end against at least one sample case | `npm run audit:tool-coverage` shows 16/16 with passing canary runs |
| 5 | Tool runs persist as artifacts under `users/{uid}/situations/{caseId}/runs/{runId}` | Run a tool → check Firestore → run record present with input, output, timing, cost |
| 6 | Tool composition / chains: a user can pipe one tool's output into another's input | E2E: Mediator chains Position-vs-Interest → Mediation Brief; output flows |
| 7 | Four persona E2E suites: Diplomat (Syria), Mediator (Northwind), Analyst (Sahel/Conflict), Researcher (Nordalia/Narrative) | All four green in CI |
| 8 | Performance budgets: every tool declares a target P95 runtime and bundle impact; CI enforces | `npm run audit:tool-perf-budgets` exits 0 |
| 9 | Lighthouse CI on landing + workbench + tools tab; budgets pinned | LH score ≥ 92 for landing, ≥ 85 for workbench |
| 10 | Diagnostics dashboard at `/app/admin/diagnostics` (owner-only) shows tool health, drift, queue depth, error rates | Dashboard renders with real data |
| 11 | Production readiness checklist completed and signed by Giulio | `docs/launch/PRODUCTION_READINESS.md` checked off |

---

## 2. Pre-work confirmation note

> I have read pack 08. I understand:
> 1. The 1,203-line tool registry will be archived to `src/lib/constants/tool-registry.legacy.ts` and replaced with `src/lib/tools/registry/` containing one TS file per tool. The new registry caps at 16 tools at v1.
> 2. Every tool has a JSON-Schema `inputSchema`, an `outputSchema`, an `ontologyRequirements: OntologyId[]` field, a `minContextHealth: number` field, an `estimatedRuntimeMs` field, and a `costClass: 'cheap' | 'standard' | 'expensive'` field.
> 3. Tool execution flows through `withCalibration` + `withContextHealthGate` (pack 05). Tools that take more than 8 seconds run async and stream progress via Server-Sent Events.
> 4. Every tool run persists as a Firestore artifact and writes to the case's audit trail.
> 5. The four persona E2E suites are the production readiness bar. Any one of them failing in CI blocks merges to `main`.
> 6. Lighthouse, axe, perf budgets, and the diagnostics dashboard are not optional — they are the operating instruments of the running product.
>
> Open questions:
> - **Q1**: The 16 v1 tools — proposed list in §5 below. Confirm or amend.
> - **Q2**: Tool composition v1 — manual chains only (user picks tool 2 with tool 1's output as input). Auto-recommend chains is a later pack. Acceptable?
> - **Q3**: Persona corpus — the four personas (Diplomat, Mediator, Analyst, Researcher) from `docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md` and the four sample cases from packs 06-07. Confirm 1:1 mapping: Diplomat→Syria, Mediator→Northwind, Analyst→Sahel-conflict, Researcher→Nordalia-disinfo.
> - **Q4**: Production readiness threshold — propose: 4 persona suites green, perf budgets met, Lighthouse ≥ 85 workbench / ≥ 92 landing, no Sev-1 audit issues open. Acceptable as merge-to-main bar?

Wait for answers.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| G1 | Curate registry to 16 tools, archive legacy, define `Tool` schema | 6 |
| G2 | Tool marketplace UI: catalog, search, filters | 6 |
| G3 | Schema-driven execution form (JSON-Schema → React form) | 5 |
| G4 | Tool execution surface: sync + async + SSE streaming, error handling | 6 |
| G5 | Tool runs as artifacts: persistence, retrieval, sharing within case | 4 |
| G6 | Tool composition / chains | 5 |
| G7 | Four persona E2E suites | 8 |
| G8 | Performance budgets + Lighthouse CI | 5 |
| G9 | Diagnostics dashboard + production readiness checklist | 5 |
| **Total** | | **~50** |

---

## 4. Hard rules

- The legacy registry at `src/lib/constants/tool-registry.ts` is moved to `tool-registry.legacy.ts` and is no longer imported by app code. A linter rule forbids any `import` from the legacy file outside an explicit allowlist.
- A "tool" is a single file at `src/lib/tools/registry/<id>.ts` exporting a `Tool` object that satisfies the `Tool` Zod schema. Adding a tool means adding one file. No edits to a central registry list.
- Every tool has both `inputSchema` and `outputSchema` as JSON Schema 2020-12. Both are validated at runtime on every call.
- Every tool runs through `withCalibration`. Analysis tools also run through `withContextHealthGate`. Ingestion-style tools (which raise Context Health) only run `withCalibration`.
- Tool runs over 8 seconds are async. The client opens an SSE connection to `/v1/tool-runs/{runId}/events`; the backend pushes status events; the run record updates progressively.
- Every tool declares its `ontologyRequirements` and `minContextHealth`. The marketplace dims tools that the active case does not satisfy and shows a one-line explanation.
- Persona E2E tests are not a one-time exercise. They run on every PR. A flake budget of < 1% applies; flakes are root-caused, not retry-quarantined.
- Performance budgets are enforced in CI and surfaced in the diagnostics dashboard. Drift triggers an alert, not a quiet log line.
- Costs (LLM tokens, latency, dollars) are recorded per run and aggregated in the diagnostics dashboard. Budget overruns surface to the owner.
- All new code is TS strict / Python typed. No `any`, no `# type: ignore` without comment.

---

## 5. Prompt G1 — Curate registry to 16 tools

### Persona
You are a product manager who has watched too many products die from feature sprawl. You know that a focused 16-tool registry beats a 55-tool registry where 35 tools are half-broken. You curate ruthlessly.

### Outcome
The 1,203-line legacy registry is replaced by 16 production-grade tool definitions. Each is a single TS file. Every tool has a complete schema, a canary test, and an ownership annotation.

### Proposed v1 tool set

**Per-ontology core tools** (4 × 3 = 12)

| Ontology | Tool ID | What it does |
|---|---|---|
| Conflict | `conflict.leverage-trace` | Map an Actor's Leverage edges with paths and rebuttals |
| Conflict | `conflict.commitment-check` | List Commitments + verifiability + breach evidence |
| Conflict | `conflict.escalation-timeline` | Order Events on a time-axis with escalation/de-escalation labeling |
| Mediation | `mediation.position-vs-interest` | For each Party, surface declared Positions vs inferred Interests |
| Mediation | `mediation.zopa-finder` | Compute a candidate ZOPA from BATNAs and Interests |
| Mediation | `mediation.mediation-brief` | One-page mediator brief with positions, interests, BATNAs, options |
| Governance | `governance.veto-probability` | For a pending Decision, compute Veto Player probabilities |
| Governance | `governance.mandate-traceback` | Trace a Decision back through binding Mandates and Procedures |
| Governance | `governance.coalition-map` | Visualize voting coalitions for a Decision |
| Narrative | `narrative.frame-cascade` | Show how a Frame propagates across Outlets and Audiences |
| Narrative | `narrative.counter-narrative-finder` | For a Frame, identify Counter-Narratives in the corpus |
| Narrative | `narrative.fact-check-traceback` | For an Assertion, trace its provenance through Sources |

**Cross-ontology tools** (4)

| Tool ID | What it does |
|---|---|
| `cross.contradiction-finder` | Surface contradictions in the active graph (any ontology) |
| `cross.context-health-explainer` | Explain the current Context Health Score and what to add to raise it |
| `cross.brief-exporter` | Export a structured brief (PDF/DOCX) of the case so far |
| `cross.scenario-projector` | Generate 3 plausible forward scenarios with confidence and indicators |

### Files to create
- `src/lib/tools/types.ts` — Zod schema for `Tool`:
  ```ts
  Tool = {
    id: string,                              // 'mediation.position-vs-interest'
    title: string,
    description: string,                     // ≤ 200 chars
    category: 'analysis' | 'export' | 'reasoning' | 'projection',
    ontologyRequirements: OntologyId[],      // empty = works on any ontology
    minContextHealth: number,                // 0-100
    inputSchema: JSONSchema,                 // 2020-12
    outputSchema: JSONSchema,
    estimatedRuntimeMs: number,              // P95 target
    costClass: 'cheap' | 'standard' | 'expensive',
    streaming: boolean,
    ownerEmail: string,                      // who maintains this tool
    introducedInVersion: SemVer,
    handler: ToolHandler,                    // server-side function ref
    canary: { caseId: string, expectedFields: string[] },
  }
  ```
- `src/lib/tools/registry/<id>.ts` — one file per tool. Sixteen files.
- `src/lib/tools/index.ts` — auto-collects every file in `registry/` via `import.meta.glob` (or static imports). Exports `listTools()`, `getTool(id)`.
- `src/lib/tools/__tests__/registry.test.ts` — assert every tool validates the Tool schema; assert ids are unique; assert canary `caseId` exists.
- `scripts/audit-tool-registry.ts` — for every tool, assert ontologyRequirements ⊆ {known ontology ids}; assert canary case exists; assert estimatedRuntimeMs ≤ 30000.
- `scripts/audit-tool-coverage.ts` — runs every tool's canary against a test backend; asserts pass.
- `backend/tools/__init__.py`, `backend/tools/<id>.py` — Python handlers for each tool. Each handler is a thin wrapper that:
  1. Validates input against the same JSON Schema (Pydantic generated from JSON Schema).
  2. Calls the relevant DIALECTICA recipe or graph query.
  3. Returns output validated against the output schema.
- `backend/tools/registry.py` — loads handlers, exposes them via `backend/routers/tools.py`.
- `backend/routers/tools.py` — `GET /v1/tools` → catalog, `POST /v1/tools/{id}/run` → start run, `GET /v1/tools/{id}/runs/{runId}` → status.

### Files to edit
- `src/lib/constants/tool-registry.ts` → renamed to `tool-registry.legacy.ts`. Add a top comment marking it deprecated.
- `eslint.config.mjs` — forbid imports from `tool-registry.legacy.ts` outside `src/migrations/`.
- `package.json` — `audit:tool-registry`, `audit:tool-coverage` scripts. Append both to `audit:gate`.

### Hard rules
- A tool that fails its canary is not allowed in v1. Either the canary is fixed or the tool is dropped.
- DIALECTICA recipes (the existing 5 in `backend/dialectica/`) are the substrate for many of the conflict/mediation/governance tools. New tools that are wrappers over a DIALECTICA recipe should be one ~50 line file, not a copy of the recipe.

### Definition of Done
- 16 files in `src/lib/tools/registry/`.
- 16 files in `backend/tools/`.
- All schemas validate.
- All canaries pass.
- Legacy file moved; no live imports from it.

### Verification commands
```bash
npm run audit:tool-registry
npm run audit:tool-coverage
npm run test -- src/lib/tools
pytest backend/tests/test_tools_registry.py -q
```

---

## 6. Prompt G2 — Tool marketplace UI

### Persona
You are a product designer who knows that the difference between a "tool list" and a "tool marketplace" is that the marketplace makes it obvious what to do next. You design for a user who has just hit Context Health 70 and is ready to analyze.

### Outcome
The workbench `?tab=tools` becomes a card-based marketplace. Users see only tools their case can run. They search, filter, and click into a tool's run page.

### Files to create
- `src/components/tools/ToolMarketplace.tsx` — main view at `?tab=tools`.
- `src/components/tools/ToolCard.tsx` — card with: icon, title, description, ontology fit indicator, Context Health requirement chip, runtime estimate, cost class chip, "Open" button.
- `src/components/tools/ToolMarketplaceFilters.tsx` — filters:
  - Ontology fit (4 chips, default = active ontology pre-selected)
  - Category (analysis / reasoning / projection / export)
  - Context Health required (slider; default = current Context Health)
  - Cost class (3 chips)
  - Search (free text on title + description)
- `src/components/tools/ToolFitBadge.tsx` — small badge: "Ready" (green), "Needs more sources" (amber, with link to Context Studio), "Not for this ontology" (grey).
- `src/lib/tools/marketplace/filter-engine.ts` — pure function `filterTools(tools, filters, caseState)`.
- Tests for components and filter engine.
- `e2e/workbench/tools-marketplace.spec.ts`.

### Files to edit
- The workbench tabs (pack 03) — register the new Tools tab.
- `src/lib/cases/case-state.ts` (or equivalent) — expose `currentContextHealth`, `activeOntologyId`.

### Hard rules
- A tool that does not fit the current case (ontology mismatch OR Context Health too low) is shown but DIMMED with the explanation. Never hidden, so the user understands what's possible.
- Click on a dimmed tool opens an explainer modal: "This tool needs Context Health ≥ 60. You're at 42. Add at least 2 more sourced documents to your case." The modal links to the Context Studio (pack 05).
- Search is client-side fuzzy (Fuse.js or similar) over the catalog (≤ 16 entries; trivial scale).
- The marketplace remembers filter state per case in URL params.

### Definition of Done
- Marketplace renders for all four sample cases.
- Filters work; URL round-trip preserves state.
- Dimmed tools' explainer modal accurate.
- Component tests + E2E green.

### Verification commands
```bash
npm run test -- src/components/tools
npx playwright test e2e/workbench/tools-marketplace.spec.ts
```

---

## 7. Prompt G3 — Schema-driven execution form

### Persona
You are a forms specialist who has built admin UIs from JSON Schema before. You know the painful subset where JSON Schema is silent (UI hints, ordering, conditional visibility) and you handle it with a small `uiSchema` extension rather than reinventing.

### Outcome
Clicking a tool card opens its run page. The input form is generated from `tool.inputSchema` plus an optional `uiSchema` annotation. Required fields, types, validation messages all wired automatically. Adding a new tool with a new field shape requires zero new UI code.

### Files to create
- `src/lib/tools/forms/json-schema-form.tsx` — the form generator. Uses `@rjsf/core` (React JSON Schema Form) or a hand-rolled subset; pick `@rjsf/core` with PRAXIS-themed widgets.
- `src/lib/tools/forms/widgets/` — themed widgets matching PRAXIS design tokens: text, textarea, number, slider, multi-select, date-range, node-picker (special — picks a node from the active graph), edge-picker, ontology-subtype-picker.
- `src/lib/tools/forms/ui-schema.ts` — types + small DSL for ordering, grouping, conditional visibility (`when: { field: 'mode', equals: 'advanced' }`).
- `src/components/tools/ToolRunPage.tsx` — `/app/workbench/<caseId>/tools/<toolId>` route. Composes: form + run button + result viewer (G4 fills in result viewer).
- Tests, including a form-fuzzing test that generates 20 random valid inputs per tool and asserts the form renders.

### Files to edit
- Add the `tools/[toolId]` route inside the workbench shell.

### Hard rules
- Custom widgets respect keyboard navigation, focus rings, error states, screen reader labels.
- Node-picker widget queries the active case's graph (via the F2 case-graph-loader from pack 07) and filters by allowed primitives/subtypes per the schema.
- Submit button is disabled while inputs are invalid; validation messages are inline, not toast.
- The form does NOT hit the network on every keystroke; it batches validation.

### Definition of Done
- For each of the 16 tools, the form renders with no missing fields.
- Form-fuzzing test green.
- A11y scan on the form clean.
- Adding a fictitious 17th tool with a 6-field input takes ≤ 10 minutes (manual demo, recorded in PR description).

### Verification commands
```bash
npm run test -- src/lib/tools/forms
npx playwright test e2e/workbench/tool-run-form.spec.ts
```

---

## 8. Prompt G4 — Tool execution: sync + async + SSE streaming, error handling

### Persona
You are a backend engineer who has shipped streaming endpoints before. You know that SSE > WebSocket for one-way server→client and that the hard part is connection lifecycle, not the protocol. You design for cancellation and reconnection from the start.

### Outcome
Tools run end-to-end. Short tools run synchronously and return JSON. Long tools (`tool.streaming === true` or `estimatedRuntimeMs > 8000`) run async with SSE progress. Errors are typed; the user sees actionable messages.

### Files to create
- `backend/routers/tool_runs.py` — refactor the run endpoint into:
  - `POST /v1/cases/{caseId}/tools/{toolId}/run` → returns `{ runId, mode: 'sync'|'async', result?: any }`. Sync if runtime predicted < 8s; otherwise mode=async and the run kicks off as a background task.
  - `GET /v1/cases/{caseId}/tool-runs/{runId}/events` → SSE stream of `{ phase, progress, partialOutput?, error? }` events.
  - `POST /v1/cases/{caseId}/tool-runs/{runId}/cancel` → cancellation.
- `backend/services/tool_runner.py` — async runner with checkpointing (uses the existing langgraph-checkpoint-postgres for tools that internally use LangGraph).
- `src/lib/tools/run-client.ts` — TS client. Exports `runTool(caseId, toolId, input): AsyncIterable<RunEvent>` so callers can `for await`.
- `src/components/tools/RunStatus.tsx` — visualizes phases and progress; renders partial output if the tool emits any.
- `src/components/tools/ResultViewer.tsx` — switches on `outputSchema` shape (table / list / brief / JSON / chart) and renders accordingly. Reuses the chart components in `src/components/charts/` if relevant.
- `src/lib/tools/errors.ts` — typed error union: `ContextHealthBlocked`, `OntologyMismatch`, `ValidationFailed`, `BackendUnreachable`, `RateLimited`, `Timeout`, `InternalError`. Each renders a distinct UI message.
- Tests including:
  - Cancellation mid-stream cleans up server state.
  - Reconnection: client drops connection, reconnects, resumes from last event id (SSE Last-Event-ID).
  - Timeout: a tool that exceeds 2 × estimatedRuntimeMs is forcibly terminated and surfaces a Timeout error.

### Files to edit
- `withCalibration` middleware — confirm it propagates correctly through SSE responses.
- `withContextHealthGate` middleware — confirm it short-circuits with the typed `ContextHealthBlocked` error code.

### Hard rules
- SSE protocol uses Last-Event-ID for resume support.
- Cancellation is a hard guarantee: backend stops billing token spend within 1 second of cancel signal.
- All run state writes (input, output, errors, timing, costs) go to `users/{uid}/situations/{caseId}/runs/{runId}` (atomic write at terminal state, plus best-effort phase updates during run).
- No tool runs over 60 seconds without breaking; absolute hard cap.

### Definition of Done
- Sync path: a cheap tool returns in < 1s.
- Async path: a streaming tool surfaces progress visibly.
- Cancellation, reconnection, timeout tests all green.
- Errors render their typed messages.

### Verification commands
```bash
pytest backend/tests/test_tool_runner.py -q
npm run test -- src/lib/tools/run-client
npx playwright test e2e/workbench/tool-execution.spec.ts
```

---

## 9. Prompt G5 — Tool runs as artifacts

### Persona
You are an audit-conscious engineer who knows that an analysis without provenance is hearsay. You make every tool run a first-class, retrievable, sharable artifact.

### Outcome
Every tool run, success or failure, persists at `users/{uid}/situations/{caseId}/runs/{runId}` with full input, output, timing, cost, ontology snapshot, Context Health snapshot. The workbench has a Runs tab listing recent runs per case.

### Files to create
- `src/types/tool-run.ts` — Zod schema for `ToolRun`: `id`, `caseId`, `ownerUid`, `toolId`, `toolVersion`, `status` (`'running'|'succeeded'|'failed'|'cancelled'`), `input`, `output`, `error`, `startedAt`, `endedAt`, `durationMs`, `tokensIn`, `tokensOut`, `usdCost`, `ontologyId`, `ontologyVersion`, `contextHealthAtStart`, `contextHealthAtEnd`.
- Pydantic mirror in `backend/types/tool_run.py`.
- `backend/services/tool_run_persistence.py` — atomic write at terminal state.
- `src/components/runs/RunsTab.tsx` — the Runs tab in the workbench. Lists recent runs with status, tool, timestamp, cost, "Open" button.
- `src/components/runs/RunDetail.tsx` — clicking a run opens its detail page with input, output, timing, cost, "Re-run" button.
- `src/lib/tools/share-run.ts` — generates a stable URL `/app/workbench/<caseId>/runs/<runId>` that any case-collaborator can open.
- Tests.

### Files to edit
- `firestore.rules` — rules for `users/{uid}/situations/{caseId}/runs/{runId}`. Owner read/write; case collaborators read.
- `firestore.indexes.json` — composite index `(caseId, startedAt desc)`.
- The workbench tabs — add the Runs tab.

### Hard rules
- Output payloads larger than 1 MB are written to Cloud Storage with the run record holding a signed URL; this prevents Firestore document-size violations on big briefs.
- Cost computation is from a single source: `backend/ai/cost_table.py`. Token counts come from the LLM provider response, not estimated.
- Re-run reuses the same input; produces a new `runId` (no in-place mutation).

### Definition of Done
- Run any tool → record persisted with all fields.
- Runs tab lists ≥ 1 run per sample case.
- Re-run works.
- Big-output handling tested with a fixture > 2 MB.

### Verification commands
```bash
npm run test -- src/components/runs src/lib/tools
pytest backend/tests/test_tool_run_persistence.py -q
npx playwright test e2e/workbench/tool-runs-tab.spec.ts
```

---

## 10. Prompt G6 — Tool composition / chains

### Persona
You are an interaction designer who knows that the value of a marketplace is not the tools individually but the chains users compose. You make composition visible without forcing the user to learn a graph editor.

### Outcome
A user can take the output of one tool run, pick a compatible next tool, and run it with that output as input. Compatibility is determined by JSON-Schema compatibility between Tool A's `outputSchema` and Tool B's `inputSchema` (with type coercion only for trivial cases).

### Files to create
- `src/lib/tools/composition/compatibility.ts` — pure function `findCompatibleNextTools(runOutput, runOutputSchema, allTools): Tool[]`. Checks structural compatibility.
- `src/components/runs/RunDetail.tsx` (extend) — adds a "Continue with…" section listing compatible next tools as cards.
- `src/components/tools/ChainRunPage.tsx` — pre-fills the next tool's form with the prior run's output mapped into matching fields.
- `src/lib/tools/composition/__tests__/compatibility.test.ts` — table-driven tests across the 16-tool cartesian product (or a curated subset).
- E2E: Mediator chains `position-vs-interest` → `mediation-brief`.

### Hard rules
- v1 chains are explicit: user sees Tool A's output, picks Tool B, edits the pre-filled form, clicks Run. No silent piping.
- Chain history is persisted: the new run record carries `parentRunId` and the chain is visible in the Runs tab as a tree.
- Compatibility is conservative: when uncertain, the tool is not suggested. False negatives are OK; false positives lead to user frustration.

### Definition of Done
- Mediator chain test green.
- Diplomat chain test green: `commitment-check` → `brief-exporter`.
- Chain tree renders correctly.

### Verification commands
```bash
npm run test -- src/lib/tools/composition
npx playwright test e2e/workbench/tool-chains.spec.ts
```

---

## 11. Prompt G7 — Four persona end-to-end suites

### Persona
You are a QA lead who knows that "the unit tests are green" is not the same as "the product works." You design the persona suites as the canonical "does the product work?" answer.

### Outcome
Four Playwright suites, one per persona, each running the full case-creation → ingestion → analysis → export flow on a real (test-environment) backend. They are the production-readiness contract.

### Files to create
- `e2e/personas/diplomat-syria.spec.ts` (12 min flow, full Syria case path):
  1. Sign in as `diplomat@test.praxis`.
  2. Land on `/app/workbench` → see existing Syria case in case picker.
  3. Open Syria case.
  4. Verify Context Health ≥ 70.
  5. Switch to graph tab → switch to Layered-by-truth-layer → verify Verdict band populated.
  6. Open node detail panel for a Verdict → verify provenance present.
  7. Run `conflict.commitment-check` → success → result has ≥ 3 Commitments listed.
  8. Run `conflict.escalation-timeline` → success → timeline rendered.
  9. Chain into `cross.brief-exporter` → DOCX downloaded.
  10. Verify Runs tab shows 3 runs.
  11. Sign out.
- `e2e/personas/mediator-northwind.spec.ts` (10 min flow):
  1. Sign in as `mediator@test.praxis`.
  2. Create a new case "Alex / Maya" using the Mediation ontology.
  3. Upload all 5 fixture documents from `src/lib/cases/northwind-mediation/fixtures/`.
  4. Run ingestion → review proposals → accept → Context Health rises to ≥ 70.
  5. Open graph tab → see Parties, Positions, Interests.
  6. Run `mediation.position-vs-interest` → result distinguishes positions and interests.
  7. Run `mediation.zopa-finder` → result includes ZOPA when BATNAs known.
  8. Chain into `mediation.mediation-brief` → DOCX downloaded.
  9. Sign out.
- `e2e/personas/analyst-sahel.spec.ts` (12 min flow): an Analyst running Conflict ontology on a Sahel-style case (sample case `src/lib/cases/sahel-2026/` to be created in this prompt if not yet present).
- `e2e/personas/researcher-nordalia.spec.ts` (10 min flow): Researcher running Narrative ontology on Nordalia disinfo case.
- `playwright.config.ts` — register the persona-tests project; allocate longer timeouts; isolate via test-user accounts.
- `e2e/_fixtures/test-users.ts` — four test accounts seeded via Firebase Auth admin SDK during CI setup.
- `scripts/seed-test-environment.ts` — wipes and seeds the test Firestore + Neo4j + Auth before persona suites run.

### Files to edit
- `package.json` — `test:e2e:personas` script that runs only the four persona suites.
- CI config — adds the persona suites as a required check on every PR.

### Hard rules
- Persona suites run against a dedicated `test` GCP project, never production. Project id is `praxis-test-<env>` and is hardcoded in test config.
- Test users are real Firebase Auth users seeded by `scripts/seed-test-environment.ts`. The script is idempotent.
- Each suite cleans up after itself: deletes its created case at the end of `afterAll`. Suite never leaves a 200th case in the test environment.
- Flake budget: a flaky persona test fails the build until root-caused. No retries hide flakes.
- Each suite logs its total wall-clock time; we monitor for regressions.

### Definition of Done
- All four suites green on a clean run.
- Total runtime ≤ 25 minutes serial / ≤ 10 minutes parallel.
- CI required-check status configured.
- Flake rate ≤ 1% over 50 most recent runs.

### Verification commands
```bash
npx tsx scripts/seed-test-environment.ts
npm run test:e2e:personas
```

---

## 12. Prompt G8 — Performance budgets + Lighthouse CI

### Persona
You are a performance engineer who knows that "we'll measure later" is how products become slow. You set budgets, you instrument, you fail the build on regression.

### Outcome
- Every tool has a P95 runtime budget enforced in CI.
- Bundle budgets per route enforced.
- Lighthouse runs on landing, workbench (Syria case), and tools tab in CI.
- Real User Monitoring instrumentation feeds the diagnostics dashboard (G9).

### Files to create
- `lighthouserc.json` — Lighthouse CI config: assertions for Performance, Best Practices, A11y, SEO. Thresholds:
  - Landing: Perf ≥ 92, A11y ≥ 95, SEO ≥ 95, BP ≥ 95.
  - Workbench (Syria): Perf ≥ 85, A11y ≥ 95, BP ≥ 95.
  - Tools tab: Perf ≥ 85, A11y ≥ 95, BP ≥ 95.
- `scripts/audit-tool-perf-budgets.ts` — runs every tool's canary, asserts P95 (over 5 runs) ≤ `estimatedRuntimeMs`. Exits 1 on regression.
- `scripts/audit-bundle-budgets.ts` — runs `next build`, parses bundle stats, asserts each route's first-load JS under route-specific limits (landing: 180kb, workbench: 280kb, tools: 220kb).
- `src/lib/observability/rum.ts` — Real User Monitoring: TTFB, FCP, LCP, INP, CLS sent to `/v1/rum` for aggregation.
- `backend/routers/rum.py` — receives RUM events, writes to BigQuery (or Firestore as v1).
- CI workflow `.github/workflows/perf.yml` (or GCP Cloud Build equivalent) — runs LH + perf budget audits.

### Files to edit
- `package.json` — `lh:ci`, `audit:tool-perf-budgets`, `audit:bundle-budgets` scripts. All three appended to `audit:gate`.
- `next.config.ts` — confirm route-level bundling settings.

### Hard rules
- Budget violations fail the build, period. No "informational only" mode.
- Lighthouse runs against a deployed preview URL, not localhost (mobile throttling is consistent only on the LH-CI runner).
- RUM is opt-in per the existing privacy notice; do not collect from EU users without consent banner check.

### Definition of Done
- All three audits exit 0 on the current build.
- Lighthouse scores at thresholds.
- RUM events flowing to backend.

### Verification commands
```bash
npm run lh:ci
npm run audit:tool-perf-budgets
npm run audit:bundle-budgets
```

---

## 13. Prompt G9 — Diagnostics dashboard + production readiness checklist

### Persona
You are an operator who has run software in production. You know that the difference between a working product and a fragile one is whether the team can see what is happening at any moment. You build the operator's view.

### Outcome
- An owner-only diagnostics dashboard at `/app/admin/diagnostics`.
- A production readiness checklist that Giulio signs off before launch.

### Diagnostics dashboard panels

1. **Tool health** — per tool: P95 runtime over 24h, error rate, queue depth, cost. Red if budget violated.
2. **Ingestion pipeline** — runs in flight, runs awaiting review, runs failed in 24h, P95 ingestion duration.
3. **Drift verifier** — Firestore↔Neo4j sync status, last run timestamp, drift count.
4. **Context Health distribution** — histogram of Context Health Scores across all cases.
5. **Symbolic firewall** — rejections per ontology in 24h.
6. **Auth & abuse signals** — failed sign-ins, rate-limit hits, suspicious traffic.
7. **Cost dashboard** — token spend per ontology, per tool, daily; budget alerting.

### Files to create
- `src/app/app/admin/diagnostics/page.tsx` — owner-only via auth check.
- `src/components/diagnostics/ToolHealthPanel.tsx`, `IngestionHealthPanel.tsx`, `DriftPanel.tsx`, `ContextHealthDistribution.tsx`, `FirewallPanel.tsx`, `AuthAbusePanel.tsx`, `CostDashboard.tsx`.
- `backend/routers/diagnostics.py` — server-side aggregations. All endpoints role-gated to admin.
- `backend/services/diagnostics_aggregator.py` — pre-computed daily aggregates persisted to `metrics/{date}` to avoid heavy queries on each visit.
- `docs/launch/PRODUCTION_READINESS.md` — checklist (see below).
- `docs/operations/RUNBOOK.md` — what to do when a panel goes red.

### Production readiness checklist

```
[ ] All 4 persona E2E suites green for 5 consecutive CI runs.
[ ] All audit:* scripts exit 0 on main: ontology-mapping, ontology-versions,
    ontology-classifier-accuracy, graph-viewer-uniqueness, graph-perf-budget,
    tool-registry, tool-coverage, tool-perf-budgets, bundle-budgets.
[ ] Lighthouse CI thresholds met for 7 consecutive runs.
[ ] Firestore↔Neo4j drift verifier reports zero drift for 72 hours.
[ ] Symbolic firewall rejection rate < 5% for 24 hours (high rejection rates indicate
    extraction prompts are drifting).
[ ] Context Health distribution shows ≥ 1 case at ≥ 80 across all 4 sample cases.
[ ] Tool cost budgets within 80% of monthly target.
[ ] Sentry / error tracking shows zero unresolved Sev-1 in 72 hours.
[ ] Diagnostics dashboard reviewed by Giulio, no red panels.
[ ] firestore.rules audit confirms no recent regressions.
[ ] All sample cases load with no console errors in production build.
[ ] Backup + restore drill executed for Firestore + Neo4j.
[ ] Incident response runbook reviewed.
[ ] Privacy & data-handling note up to date for new ingestion + tool-run paths.
[ ] All tool maintainers (per `tool.ownerEmail`) have acknowledged ownership.
[ ] Giulio signs off below.

------------------------------------------
Signed: ______________________  Date: ____
------------------------------------------
```

### Files to edit
- `firestore.rules` — diagnostics route is admin-only via custom claim.
- `audit:gate` chain — final wiring of all checks.

### Hard rules
- The dashboard is owner-only at v1. There is no "team admin" role yet.
- Diagnostics aggregations write to `metrics/{date}`, never query live data on each pageview (would cost too much and be too slow).
- The runbook for each red panel is concrete: "if Tool Health is red on tool X, run `scripts/replay-tool-canary.ts X` and check the output. If it still fails, page the tool's owner."

### Definition of Done
- Dashboard loads, all panels populated.
- Owner-only access enforced.
- Runbook reviewed.
- Production readiness checklist 100% checked off.
- Giulio's signed copy committed at `docs/launch/PRODUCTION_READINESS.signed.md` (or stored as a digital signature).

### Verification commands
```bash
npm run typecheck
npm run lint
npm run test
npm run audit:gate
pytest backend/ -q
```

---

## 14. Final verification gate

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# Audits
npm run audit:gate

# Persona suites (the production bar)
npm run test:e2e:personas

# Performance
npm run lh:ci
npm run audit:tool-perf-budgets
npm run audit:bundle-budgets

# Drift
npx tsx scripts/verify-firestore-neo4j-sync.ts

# Tool canaries
npm run audit:tool-coverage
```

All commands exit 0. Diagnostics dashboard reviewed. PRODUCTION_READINESS.md fully checked. Giulio signs off.

---

## 15. Out of scope

- User-authored tools (third-party tool installation, marketplace plugins).
- Multi-tenant org/team accounts (`teams/{teamId}/...` schema). v1 is per-user only.
- Auto-recommended tool chains (LLM proposes the next tool). Manual chains only at v1.
- A11y beyond the contract in this pack: voice control, dwell click, etc.
- Mobile-optimized workbench (the workbench is desktop-first; mobile is read-only views).
- White-label / OEM versions (that is the ARGUS product, separate codebase).
- Real-time collaborative editing on graph nodes.
- Internationalization beyond English.

---

## 16. Closing note for the agent

Pack 08 is the bridge from "good architecture" to "shipping product." The earlier packs built the foundations; this pack proves that what was built actually works, end-to-end, for the four personas the product targets, and then locks that proof into CI so it stays true.

The four persona suites are the most important deliverable in the pack. Everything else (the marketplace, the form generator, the run persistence, the diagnostics) is in service of "the Diplomat / Mediator / Analyst / Researcher can each, today, in under fifteen minutes, complete a meaningful task in PRAXIS." If the persona suites are flaky or the persona experiences are clumsy, the rest of the polish is wasted.

You will know this pack is done when Giulio signs the production readiness checklist. Not before.

Branch: `feature/tools-marketplace`. Commit prefix `tools(<area>): <prompt-id> <description>` (e.g., `tools(persona): G7 add Mediator-Northwind suite`). PR titled `Pack 08 — Tools Marketplace & End-to-End Validation`.

Do not merge to `main` without Giulio's sign-off.
