# PRAXIS — Codex Pack 13: Tool-Context Interoperability & Standardized Authoring

**Branch**: `feature/tool-context-interop`
**Depends on**: Pack 12 merged (provides four-layer context substrate + Context Preparer subagent).
**Owner gate**: Do not merge to `main` without Giulio's sign-off on the v2 tool contract migration and the staging deploy.
**Estimated effort**: ~7 days (~58 engineering hours).
**Voice**: Architect + product engineer. Builds the contract that makes tools and context speak one language. Ships to praxis.tacitus.me.

---

## 0. Why this pack exists

After pack 12, PRAXIS has a four-layer context substrate (User / Workspace / Case / Conversation) and a Context Preparer subagent that can fill gaps when context is thin. What it does not yet have is a clean way for **tools to consume that context**. The 16 tools shipped in pack 08 each read context their own way: some query Firestore directly with bespoke queries, some receive a half-shaped object from the legacy `withContextHealthGate` middleware, some hard-code assumptions about the case being conflict-ontology, none of them know about the user's role or the workspace's methodology guides. This is the mess pack 12's substrate made visible. This pack cleans it up.

The problem is fivefold:

1. **No common shape for "what context does this tool need."** Each tool's prerequisites are documented in prose in its README or implicit in its handler. The Tool Suggestion Engine (the engine that should tell a Mediator opening a Northwind case "you'll probably want `mediation.position-vs-interest` next") cannot reason about fit because the contract is not declarative.
2. **No common runtime API for reading context.** Tool handlers reach into Firestore, the Postgres graph, the workspace store, and the user profile through bespoke imports. Refactoring context storage means refactoring every tool. Adding a new layer (Conversation, in pack 12) means manually rewiring every tool.
3. **No common authoring pattern.** Adding a 17th tool today means: write a TS module, register it in the tool registry, write an input schema, write a handler, write tests, hope the schema-driven UI infers reasonable widgets, write a Playwright test, commit. There is no skeleton, no template, no skill-style description that an AI agent (Codex, a future agent runtime) can read to reason about whether the tool fits a situation.
4. **No subagent pattern.** Tools that would benefit from specialized LLM assistance — refining output for user communication style, drafting memo blocks, augmenting thin sources with public references — each implement that LLM call ad hoc, with bespoke prompts and inconsistent confidence handling.
5. **Composition is fragile.** Pack 08 G6 specified tool composition (parentRunId trees), but the compatibility check is structural: does tool A's output JSON shape fit tool B's input JSON shape? It cannot reason about *context flow*: when tool A's run produces context (e.g., a list of newly-extracted ZOPA candidates), tool B should see that context, not just the raw output.

This pack closes all five with a single contract change:

- **Tool Contract v2** declares context requirements, hints, composition, side effects, and subagent dependencies as static fields on every tool. AI agents and the suggestion engine read them.
- **ContextProvider** is a runtime DI object that every tool handler receives, exposing the four context layers, the Preparer, the workspace retriever, and the named subagents — through one typed interface.
- **Skill-style authoring** gives every tool a `SKILL.md` describing when to use it, what context it needs, examples, and pitfalls. AI agents (Codex authoring new tools, runtime agents proactively suggesting tools) read these. There is a `SKILL_TEMPLATE.md` so adding a new tool is one folder copy.
- **Tool Suggestion Engine** ranks tools per user per case using the v2 contracts plus signals from User/Case/Conversation context.
- **Subagent pattern** standardizes the four LLM assistants tools need: Context Preparer (pack 12), Source Augmenter, Output Refiner, Memo Drafter. Each has a SKILL.md, a LangGraph subgraph, an eval set, and the same invocation API.
- **The 16 v1 tools are migrated** to the new contract, the new ContextProvider, the new skill files. The migration preserves the persona suites and adds richer behavior (e.g., the brief-exporter now respects the user's communication style; the mediation tools cite workspace methodology guides where relevant).

After this pack, adding a new tool to PRAXIS is a one-folder operation: copy the template, fill in the SKILL.md, fill in the contract, write the handler against `ContextProvider`. The suggestion engine picks it up automatically. The persona suites cover it via parameterized tests. The interop story across context, tools, subagents, memos, and graph is one story, in one shape.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | Tool Contract v2: every tool declares `contextSpec`, `contextHints`, `composition`, `sideEffects`, `subagentDeps`, `skill` | `npm run audit:tool-contract-v2` exits 0 (every tool conforms) |
| 2 | `ContextProvider` runtime API exposed from a single import; every tool handler receives it via DI | Tool runtime tests confirm injection; no tool reads context outside ContextProvider |
| 3 | Every tool has a `SKILL.md` at `skills/tools/<tool_id>/SKILL.md` following the canonical template | `npm run audit:tool-skills-present` exits 0 |
| 4 | Tool Suggestion Engine ranks tools per user per case; surfaces in workbench tools tab and via API | Eval set: 16 (user, case) → expected top-3; recall@3 ≥ 80% |
| 5 | Three new subagents shipped (Source Augmenter, Output Refiner, Memo Drafter) with SKILL.md, LangGraph subgraphs, eval sets | Each eval set passes its floor |
| 6 | The 16 v1 tools migrated to the v2 contract with no persona-suite regression | All four persona suites green for 10 consecutive runs |
| 7 | Tool Composition v2 supports context flow (output of tool A becomes context for tool B) | Composition compatibility audit + 4 documented composition chains green |
| 8 | Memo Studio (pack 11) integrated: memos are tool runs, memo creation/refresh use the Memo Drafter subagent, memo content respects user communication style | Persona suites include a memo creation step ending in a stylistically appropriate DOCX |
| 9 | Authoring kit at `skills/templates/` lets a new tool be added in under 60 minutes; documented in `docs/contributing/AUTHORING_A_TOOL.md` | Spike test: add a 17th tool from the template; takes < 60 min; persona suite picks it up automatically |
| 10 | Deployed to praxis.tacitus.me staging, smoke-tested, then production | Staging smoke 24h green; production deploy clean |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 13. I understand:
> 1. The v2 contract change. Every existing tool gets a v2 wrapper; the legacy v1 shape continues to deserialize for backwards compatibility during the migration window, then is removed at end of pack.
> 2. The ContextProvider is the *only* sanctioned way for tool handlers to read context after this pack. Direct Firestore, direct Postgres, direct workspace-retriever access from a tool handler is a contract violation flagged by `audit:tool-contract-v2`.
> 3. Skills are first-class artifacts. Each tool has a SKILL.md committed at `skills/tools/<tool_id>/SKILL.md`. Each subagent has one at `skills/subagents/<subagent_id>/SKILL.md`. AI agents read these. The template at `skills/templates/SKILL_TEMPLATE.md` is the canonical shape; deviation requires PR review.
> 4. The four named subagents are: **Context Preparer** (pack 12 L5, already shipped), **Source Augmenter** (new in M5), **Output Refiner** (new in M5), **Memo Drafter** (new in M5 + integrated with pack 11 in M8). No other subagents at v1.
> 5. Subagents respect the same hard rules as the Context Preparer: never write structured assertions to the graph, never bypass the symbolic firewall, label outputs as `synthesized` where appropriate, self-rate confidence, have a per-call cost ceiling.
> 6. Model strings only in `src/lib/ai/providers.ts` and `backend/ai/providers.py`. Subagent model selection lives there.
> 7. The persona suites are the production bar. Every migration commit re-runs them before merge. 10 consecutive green runs is the launch gate.
> 8. All deployment targets are praxis.tacitus.me. M9 is the final deploy.
>
> Open questions for Giulio:
> - **Q1**: Subagent invocation semantics — propose: tools invoke subagents via `ctx.subagent(id, input)`; subagent runs are first-class telemetry events (logged, costed, surfaced in the diagnostics dashboard); subagent output is type-checked against its declared output schema. Acceptable?
> - **Q2**: SKILL.md schema — propose nine canonical sections: Purpose, When to use, When NOT to use, Inputs (required/optional), Outputs, Context requirements, Composition, Examples, Pitfalls. Each section has a defined format so authors don't drift. Acceptable, or should I trim or expand?
> - **Q3**: Tool Suggestion Engine — propose three suggestion surfaces: (a) workbench tools tab banner showing top 3 with rationales; (b) per-card "recommended for you" badge on tool cards; (c) coach step in onboarding showing one starter tool. Acceptable?
> - **Q4**: Composition compatibility — propose a static check at registration time: tool A's `composition.canChainInto[B]` requires that A's `outputSchema` projects into B's `contextSpec` (declared via a `contextProjection` mapping function). The projection is data, not code, so the suggestion engine can reason about it. Acceptable, or do you want runtime checking only?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| M1 | Tool Contract v2 schema (TS + Pydantic) with full migration shim | 6 |
| M2 | ContextProvider runtime API; DI into tool handlers | 6 |
| M3 | Skills system: SKILL.md template, per-tool skill files, audit | 5 |
| M4 | Tool Suggestion Engine: ranking, surfaces, eval set | 7 |
| M5 | Three new subagents: Source Augmenter, Output Refiner, Memo Drafter | 9 |
| M6 | Migrate the 16 v1 tools to the v2 contract + ContextProvider + SKILL.md | 9 |
| M7 | Tool Composition v2: context flow, static compatibility, 4 example chains | 6 |
| M8 | Memo Studio integration: memo as tool, Memo Drafter wiring | 5 |
| M9 | Final verification, audits, docs, staging smoke, production deploy to praxis.tacitus.me | 5 |
| **Total** | | **~58** |

---

## 4. Hard rules

- The v2 Tool Contract is the only contract. After M6 completes, v1 is removed.
- Tool handlers read context exclusively through `ContextProvider`. No direct Firestore / Postgres / workspace store access. Audited statically by `audit:tool-context-isolation`.
- Every tool has a SKILL.md. PRs that add a tool without one fail CI.
- Every subagent invocation is logged, costed, and shows up in the diagnostics dashboard.
- Subagents never write to the graph. They produce outputs labeled per their schema; if the tool wants to propose graph changes from a subagent's output, that goes through the existing review queue (pack 06 E5).
- Symbolic firewall is preserved. The compatibility-checker, the suggestion engine, and the subagents all respect it.
- Model strings only in providers.
- The persona suites are the production bar. Every migration commit re-runs them.
- All staging smoke is at `praxis.tacitus.me/staging` (or equivalent); production at `praxis.tacitus.me`.

---

## 5. Prompt M1 — Tool Contract v2

### Persona
Architect. Codifies the contract that everything else depends on.

### Phase 1 — Read & report

- Inventory the v1 contract from pack 08 (`src/lib/tools/types.ts`). Diff against the v2 fields.
- Inventory the 16 v1 tools at `src/lib/tools/registry/<id>.ts`. For each: list the context they currently read, the side effects, the composition links they implicitly support.
- Output `docs/audits/2026-05-06-TOOL_CONTRACT_INVENTORY.md`.

### Phase 2 — Propose & confirm

Propose the v2 schema:

```ts
// src/lib/tools/types.ts

import { z } from 'zod';
import type { ContextSpec, ContextSnapshot } from '@/types/context';
import type { ToolId, OntologyId } from '@/types/ids';
import type { SubagentId } from '@/types/subagents';

export const ToolContractV2Schema = z.object({
  // Identity (v1 fields, unchanged)
  id: z.string(),
  version: z.string(),                  // semver, owned by tool author
  title: z.string(),
  description: z.string(),
  category: z.enum(['analysis','synthesis','export','utility','meta']),
  ontologyRequirements: z.array(z.string()).optional(),
  inputSchema: z.unknown(),             // JSON Schema
  outputSchema: z.unknown(),            // JSON Schema
  estimatedRuntimeMs: z.number(),
  costClass: z.enum(['cheap','medium','expensive']),
  streaming: z.boolean(),
  ownerEmail: z.string().email(),

  // V2 additions
  contextSpec: z.object({                      // what this tool needs
    user: z.object({ role: z.boolean().optional(), mandate: z.boolean().optional(), preferences: z.boolean().optional() }).optional(),
    workspace: z.object({ guidelines: z.boolean().optional(), glossary: z.boolean().optional() }).optional(),
    caseGraph: z.object({
      minNodeCount: z.number().optional(),
      requiredPrimitives: z.array(z.enum(['Actor','Claim','Interest','Constraint','Leverage','Commitment','Event','Narrative'])).optional(),
      requiredOntology: z.string().optional(),
    }).optional(),
    conversation: z.object({ focusedNodeRequired: z.boolean().optional() }).optional(),
    minHealthScore: z.number().min(0).max(100).optional(),  // ADVISORY, not enforced (pack 12 contract)
    graceful: z.boolean().default(true),                     // tool can run with partial context
  }),

  contextHints: z.object({ /* same shape as contextSpec, but nice-to-have */ }).optional(),

  composition: z.object({
    canChainInto: z.array(z.string()).optional(),     // tool ids whose output this tool can consume
    canChainFrom: z.array(z.string()).optional(),     // tool ids that can consume this tool's output
    contextProjection: z.string().optional(),         // path to a `contextProjection.ts` mapping
  }).optional(),

  sideEffects: z.object({
    proposesGraphChanges: z.boolean().default(false),
    writesMemoBlocks: z.boolean().default(false),
    writesAuditLogs: z.boolean().default(true),
  }).default({}),

  subagentDeps: z.array(z.string()).optional(),       // subagent ids this tool may invoke

  skill: z.object({
    file: z.string(),                                  // path to SKILL.md (relative to repo root)
  }),
});

export type ToolContractV2 = z.infer<typeof ToolContractV2Schema>;

export type ToolHandler<I, O> = (
  input: I,
  ctx: ContextProvider,
) => Promise<O>;

export interface ToolModule<I = unknown, O = unknown> {
  contract: ToolContractV2;
  handler: ToolHandler<I, O>;
}
```

Send to Giulio. Wait for sign-off.

### Phase 3 — Execute

- Author `src/lib/tools/types.ts` v2.
- Author Pydantic mirror at `backend/tools/contract.py` at parity.
- Add a v1→v2 deserialization shim so tools authored in pack 08 v1 shape continue to load (warns); shim is removed at end of M6.
- Author `scripts/audit-tool-contract-v2.ts` — every registered tool must conform to v2.
- Author `backend/tests/test_tool_contract_parity.py`.

### Phase 4 — Verify

- Parity test green.
- The audit script runs (will fail on the 16 v1 tools until M6; that's expected and tracked).
- Old persona suites still pass via the deserialization shim.

### Files to create

- `src/lib/tools/types.ts` (new v2; old moved to `types.v1.ts`).
- `backend/tools/contract.py`.
- `scripts/audit-tool-contract-v2.ts`.
- `src/lib/tools/v1-to-v2-shim.ts`.
- `docs/audits/2026-05-06-TOOL_CONTRACT_INVENTORY.md`.

### Verification commands

```bash
npm run typecheck
pytest backend/tests/test_tool_contract_parity.py -q
npm run test:e2e:personas  # passes via shim
```

---

## 6. Prompt M2 — ContextProvider runtime API

### Persona
Backend engineer. Designs the DI surface every tool will depend on, knowing that tightening it later is much harder than tightening it now.

### Outcome

A typed `ContextProvider` interface, exposed from `@/lib/context/provider`, instantiated once per tool run, injected into the handler.

### Files to create

- `src/lib/context/provider.ts` — interface + implementation (TS for client tools, e.g., utility tools that run in browser).
- `backend/context/provider.py` — Python implementation for server-side tool handlers and ingestion subagents.
- `backend/tests/test_context_provider.py` — exhaustive: every method, every error case (owner mismatch, case not found, conversation missing, etc.).

### Interface skeleton

```ts
export interface ContextProvider {
  // Layer accessors
  user(): Promise<UserContext>;
  workspace(): Promise<WorkspaceContext>;
  case(): Promise<CaseContext>;
  graph(scope?: GraphScope): Promise<CaseGraph>;
  conversation(): Promise<ConversationContext | null>;

  // Composite snapshot (what the middleware computed)
  snapshot(): Promise<ContextSnapshot>;

  // Workspace retrieval (pack 12 L3)
  retrieveWorkspace(query: string, topK?: number): Promise<WorkspaceRetrievalResult[]>;

  // Graph search (pack 10 J6)
  searchGraph(query: string, opts?: GraphSearchOpts): Promise<GraphSearchResult[]>;

  // Context Preparer (pack 12 L5)
  prepare(spec: ContextSpec): Promise<PreparedContext>;

  // Subagent invocation (M5)
  subagent<I, O>(id: SubagentId, input: I): Promise<SubagentRunResult<O>>;

  // Diagnostics
  log(event: ToolLogEvent): Promise<void>;
  cost(): Promise<{ accumulatedUsd: number }>;
}

export interface GraphScope {
  caseId?: string;                // defaults to current case
  primitives?: ACOPrimitive[];
  layer?: TruthLayer;             // pack 05 D1
  centerNodeId?: string;
  hops?: number;                  // 0 = full case, 1+ = ego subgraph
}
```

### Hard rules

- The provider instance is per-request. Cross-request sharing is a defect.
- The provider's `case()`, `graph()`, `conversation()` methods bind to the request's `caseId` and `ownerUid` automatically — no opportunity to query the wrong case.
- All methods are async and return typed errors via `ContextProviderError` subclasses (`OwnerScopeViolation`, `CaseNotFound`, `ConversationMissing`, `GraphScopeOverflow`, etc.).
- Cost accumulation is per-tool-run; surfaced in tool-run record.

### Definition of Done

- All methods tested.
- Tool handler signature `(input, ctx) => Promise<output>` is enforced by TS / mypy.
- The interim shim from pack 12 L8 is removed; ContextProvider is the only access path.

### Verification commands

```bash
npm run typecheck
pytest backend/tests/test_context_provider.py -q
mypy backend/context/provider.py --strict
```

---

## 7. Prompt M3 — Skills system

### Persona
Documentation + product engineer. Knows that the difference between a "tool with a SKILL.md" and "a tool an AI agent can use confidently" is whether the SKILL.md follows a predictable shape.

### Outcome

A canonical `SKILL_TEMPLATE.md` and a per-tool `SKILL.md` for every existing tool. Skills audited at CI; absent or non-conforming skills fail the gate.

### The canonical shape

```markdown
# Tool: <tool_id>

> **Summary**: One-sentence purpose, suitable for a tool-suggestion card.

## Purpose
What problem this tool solves. Be concrete. ~3-5 sentences.

## When to use
Bulleted list of situations where this tool helps.

## When NOT to use
Bulleted list of situations where this tool will mislead, frustrate, or
underperform. Includes pointers to the better tool for that case.

## Inputs (required)
- `<field>` (`<type>`): description.
- ...

## Inputs (optional)
- `<field>` (`<type>`, default `<value>`): description.
- ...

## Outputs
Brief description of the output shape, with a 4-6 line JSON example.

## Context requirements
The contextSpec from the contract, in human-readable form.
- "Needs a case with at least 3 Actor nodes."
- "Benefits from workspace methodology guides if available."
- "Reads user role to adjust verbosity."

## Composition
- "Pairs well with `<tool_id>` (output feeds this tool's `claims` input)."
- "Avoid chaining into `<tool_id>` (output schemas don't compose cleanly)."

## Examples
### Good case
Brief description of a good real or sample case for this tool.

```json
{
  "input": { ... },
  "output_preview": { ... }
}
```

## Pitfalls
- Common mistake 1.
- Common mistake 2.
```

### Files to create

- `skills/templates/SKILL_TEMPLATE.md` — the canonical template.
- `skills/templates/SKILL_LINTER.md` — the linter rules document.
- `scripts/audit-tool-skills-present.ts` — checks every registered tool has a SKILL.md.
- `scripts/audit-tool-skill-conforms.ts` — markdown linter that asserts the nine sections, in order.
- `skills/tools/<tool_id>/SKILL.md` — 16 of these, one per pack-08 tool, drafted in M6 but stubs created here.
- `docs/contributing/AUTHORING_A_TOOL.md` — how to add a new tool from the template.

### Hard rules

- SKILL.md sections are ordered. Linter enforces order.
- Examples must use real or sample-case-realistic IDs (i.e., not `lorem ipsum`).
- Skill files are version-controlled with the tool code; a tool version bump usually accompanies a skill file edit.

### Definition of Done

- Template + linter + skeleton skills exist.
- Audit scripts wired into `audit:gate`.
- Authoring doc reviewed.

### Verification commands

```bash
npm run audit:tool-skills-present
npm run audit:tool-skill-conforms
```

---

## 8. Prompt M4 — Tool Suggestion Engine

### Persona
Search/ranking engineer. Knows that "ranked suggestions" is a small ML problem: features, weights, eval set, monitoring. Not a place to over-engineer at v1.

### Outcome

A function `suggestTools(ctx) → SuggestionResult[]` that powers three surfaces: workbench tools tab banner, per-card recommended badge, onboarding coach starter-tool step.

### Algorithm (v1)

For every registered tool `t`, compute a fit score:

```
fit(t, ctx) =
  weights.ontologyMatch    * indicator(t.ontologyRequirements ⊇ {ctx.case.ontologyId}) +
  weights.contextHealthFit * 1 - clamp01(t.contextSpec.minHealthScore - ctx.case.contextHealth) +
  weights.userRoleAffinity * roleAffinity(t, ctx.user.identity.role) +
  weights.recencyBoost     * recencyBoost(t, ctx.recentRuns) +
  weights.userPreference   * (1 if t.id in ctx.user.preferences.suggestedTools else 0)
```

`roleAffinity` is a static table: each tool has a `recommendedRoles: Role[]` list in its skill metadata; affinity = 1 if user's role is in the list, 0 otherwise.

`recencyBoost` reduces score for tools the user just ran, so the engine doesn't keep recommending the last thing.

Top-K returned with ranked rationales. Each rationale is a one-sentence string built from the dominant factor (e.g., "Recommended because your case is conflict-ontology and you're a diplomat").

### Files to create

- `src/lib/tools/suggestion/engine.ts` — the ranker.
- `src/lib/tools/suggestion/role-affinity.ts` — static table.
- `src/lib/tools/suggestion/eval/cases.ts` — eval set: 16 (user, case) → expected top-3 tools.
- `src/lib/tools/suggestion/eval/run-eval.ts` — runs eval, asserts recall@3 ≥ 80%.
- `backend/routers/tool_suggestions.py` — `GET /v1/cases/{caseId}/tools/suggestions?top=3` returning ranked list.
- `src/components/tools/SuggestionBanner.tsx` — workbench tools-tab top banner.
- `src/components/tools/RecommendedBadge.tsx` — per-card badge.
- `e2e/workbench/tool-suggestions.spec.ts`.

### Files to edit

- Workbench tools tab (pack 08 G3) — render banner above the grid.
- Tool card component — render recommended badge.
- Onboarding coach (pack 09 I7 + pack 11 K5) — first-tool step queries suggestion engine, picks top-1.

### Hard rules

- Suggestions are personalized but not opaque. Every suggestion carries a one-sentence rationale.
- The engine is deterministic given the same context; no stochastic LLM calls.
- The engine is bounded in latency: < 50ms for any case (pure data-structure work, no LLM).
- The eval set is committed; recall@3 floor enforced in CI.

### Definition of Done

- Eval recall@3 ≥ 80%.
- Surfaces render correctly.
- Audit `audit:tool-suggestion-eval` exit 0.

### Verification commands

```bash
npm run test -- src/lib/tools/suggestion
npx playwright test e2e/workbench/tool-suggestions.spec.ts
```

---

## 9. Prompt M5 — Three new subagents (Source Augmenter, Output Refiner, Memo Drafter)

### Persona
ML/agent engineer. Following the pack-12 Context Preparer pattern: LangGraph subgraph + system prompt + Pydantic output schema + eval set. Reuse the harness; don't reinvent.

### Outcome

Three new subagents, each at `backend/agents/<id>/`, each invocable via `ctx.subagent(id, input)`. SKILL.md per subagent. Eval set per subagent.

### Subagents

#### 1. Source Augmenter (`source_augmenter`)

**Purpose.** Given a case with thin sources (e.g., 1-2 documents), suggest related authoritative public sources to ingest. Does NOT auto-ingest; produces candidates for human review.

**Inputs**: `case_summary: str, existing_sources: list[Source], domain_allowlist: list[str]`.
**Outputs**: `list[CandidateSource]` — each with title, URL, publisher, why-relevant rationale, confidence.
**System prompt** (`backend/agents/source_augmenter/prompts/system.md`):
- Cite only sources from the allowlist (UN agencies, government domains, peer-reviewed journals, well-known NGOs).
- Never produce a source URL it cannot verify against a hardcoded allowlist.
- Confidence floor: 0.7 (if you can't reach 0.7, omit the suggestion).
**Eval set**: 12 cases × top-5 expected candidates; precision-at-5 ≥ 70%.

#### 2. Output Refiner (`output_refiner`)

**Purpose.** Given a tool's raw output and the user's communication style preference (concise / thorough / narrative), produce a user-facing version. Does not change analytical content; only stylistic.

**Inputs**: `raw_output: dict, communication_style: str, output_schema: dict`.
**Outputs**: refined output conforming to the same schema; preserves all analytical fields verbatim, only edits prose.
**Hard rule**: any change that would alter a numerical value, a node ID, or a categorical label is rejected at the schema-validation step.
**Eval set**: 16 (raw_output, style) → expected refined output; semantic equivalence ≥ 95% (measured via numerical/categorical preservation; prose distance is allowed).

#### 3. Memo Drafter (`memo_drafter`)

**Purpose.** Given prepared context (from Context Preparer) + a memo template + a target memo block, draft the block content with citations to graph nodes.

**Inputs**: `prepared_context: PreparedContext, template_section: TemplateSection, target_block_kind: BlockKind`.
**Outputs**: `MemoBlock` (per pack 11 schema) with citations and labeled `synthesized: true`.
**Hard rule**: every assertion in the draft cites at least one graph node id from the case context. If the Drafter can't cite, it produces a stub block with a `needsManualInput: true` flag.
**Eval set**: 12 (prepared_context, section, block_kind) → expected block with at least 1 citation; citation-resolvability ≥ 90%.

### Files to create (per subagent)

- `backend/agents/<id>/__init__.py`.
- `backend/agents/<id>/graph.py` (LangGraph subgraph).
- `backend/agents/<id>/state.py`.
- `backend/agents/<id>/prompts/system.md`.
- `backend/agents/<id>/output_schema.py`.
- `backend/agents/<id>/runner.py`.
- `backend/agents/<id>/eval/cases.json`.
- `backend/agents/<id>/eval/run_eval.py`.
- `skills/subagents/<id>/SKILL.md`.
- `backend/tests/test_<id>.py`.

### Hard rules

- Every subagent is invocable only via `ctx.subagent(id, input)`. Never imported directly into a tool handler.
- Every subagent has a per-call cost ceiling enforced by the cost middleware (`source_augmenter`: $0.10; `output_refiner`: $0.03; `memo_drafter`: $0.08).
- Every subagent has a P95 latency target: 8s, 4s, 6s respectively.
- Subagent runs are first-class telemetry events; surfaced in the diagnostics dashboard.

### Definition of Done

- Three subagents implemented + eval'd.
- Diagnostics panel shows subagent invocation counts + cost.
- Each subagent's SKILL.md reviewed.

### Verification commands

```bash
pytest backend/tests/test_source_augmenter.py backend/tests/test_output_refiner.py backend/tests/test_memo_drafter.py -q
python -m backend.agents.source_augmenter.eval.run_eval
python -m backend.agents.output_refiner.eval.run_eval
python -m backend.agents.memo_drafter.eval.run_eval
```

---

## 10. Prompt M6 — Migrate the 16 v1 tools

### Persona
Migration engineer. The pack 08 tools work today; they need to keep working through migration. Each migration commit is small and reversible.

### Outcome

All 16 tools (12 per-ontology + 4 cross from pack 08) are now v2 contracts, use ContextProvider, have SKILL.md, and pass the persona suites unchanged.

### Migration recipe per tool

For each tool at `src/lib/tools/registry/<id>.ts`:

1. Author `skills/tools/<id>/SKILL.md` from the template.
2. Convert the v1 contract block to v2: add `contextSpec`, `contextHints`, `composition`, `sideEffects`, `subagentDeps`, `skill`. Use the v1 inventory (M1) to populate the new fields accurately.
3. Refactor the handler: `(input) → output` becomes `(input, ctx) → output`. Replace any direct context reads with `ctx.user()`, `ctx.case()`, `ctx.graph()`, `ctx.retrieveWorkspace()`, `ctx.subagent()`.
4. Where the tool would benefit from a subagent — invoke it. Examples:
   - `cross.brief-exporter` → on long outputs, invoke `output_refiner` with user's communication style.
   - `mediation.position-vs-interest` → consult workspace methodology guides via `ctx.retrieveWorkspace`.
   - `narrative.frame-cascade` → no subagent at v1; just clean migration.
5. Run the tool's canary against fixtures.
6. Run the relevant persona suite end-to-end.
7. Commit with `tools(<tool-id>): M6 migrate to v2 contract`.

### Per-tool migration table (filled in by Codex during M6)

| Tool ID | Subagents added | Workspace retrieval added | Communication-style respected | Status |
|---|---|---|---|---|
| `conflict.leverage-trace` | none | no | no | TODO |
| `conflict.commitment-check` | none | no | no | TODO |
| `conflict.escalation-timeline` | none | no | no | TODO |
| `mediation.position-vs-interest` | none | yes | yes | TODO |
| `mediation.zopa-finder` | none | yes | no | TODO |
| `mediation.mediation-brief` | `output_refiner`, `memo_drafter` | yes | yes | TODO |
| `governance.veto-probability` | none | no | no | TODO |
| `governance.mandate-traceback` | none | yes | no | TODO |
| `governance.coalition-map` | none | no | no | TODO |
| `narrative.frame-cascade` | none | no | no | TODO |
| `narrative.counter-narrative-finder` | `source_augmenter` | yes | no | TODO |
| `narrative.fact-check-traceback` | `source_augmenter` | no | no | TODO |
| `cross.contradiction-finder` | none | no | no | TODO |
| `cross.context-health-explainer` | `output_refiner` | no | yes | TODO |
| `cross.brief-exporter` | `output_refiner`, `memo_drafter` | yes | yes | TODO |
| `cross.scenario-projector` | none | yes | no | TODO |

### Hard rules

- Each migration is one commit. Reverting one tool reverts cleanly without affecting others.
- Persona suites run after every commit.
- v1 deserialization shim (M1) is removed only after the last tool migrates.

### Definition of Done

- All 16 migrated.
- v1 shim removed.
- Persona suites green for 10 consecutive runs.

### Verification commands

```bash
npm run audit:tool-contract-v2
npm run audit:tool-skills-present
npm run audit:tool-context-isolation
npm run test:e2e:personas
```

---

## 11. Prompt M7 — Tool Composition v2 with context flow

### Persona
Type-system + product engineer. Composition is where types pay rent. Static checks here prevent runtime confusion later.

### Outcome

When a user runs tool A and chains into tool B, B's `ContextProvider` returns the augmented context: A's output is projected into B's `contextSpec`-shaped slot. Composition compatibility is checked at registration time.

### How

Each tool's `composition.contextProjection` (M1) names a TS module that exports:

```ts
export const projectInto: Record<ToolId, (sourceOutput: SourceOutput) => Partial<ContextSnapshot>> = {
  'mediation.zopa-finder': (out) => ({
    case: { /* augment case with ZOPA candidates as additional context */ },
  }),
  // ...
};
```

When tool B runs with `parentRunId = A_runId`, the runtime:
1. Loads A's output.
2. Calls A's `projectInto[B.id]` (if defined).
3. Merges the projected context fragment into B's snapshot.
4. Logs the projection for traceability.

Static check at tool registration: every tool whose `composition.canChainInto` lists `B` must have a projection for B (or explicitly declare "no projection — raw output passed").

### Files to create

- `src/lib/tools/composition/runtime.ts` — projection merge logic.
- `src/lib/tools/composition/static-check.ts` — registration-time check.
- `src/lib/tools/composition/projections/<tool_id>.ts` — projection mappings, one per tool with composition links.
- `e2e/workbench/tool-composition-context-flow.spec.ts` — four documented chains exercised end-to-end.
- `docs/architecture/TOOL_COMPOSITION.md`.

### Four documented chains (one per ontology)

1. **Conflict**: `conflict.leverage-trace` → `cross.brief-exporter`. Brief exporter receives leverage paths as additional context.
2. **Mediation**: `mediation.position-vs-interest` → `mediation.zopa-finder` → `mediation.mediation-brief`. Each step's output projects into the next's context.
3. **Governance**: `governance.coalition-map` → `governance.veto-probability`. Coalitions inform veto probability calculation.
4. **Narrative**: `narrative.frame-cascade` → `narrative.counter-narrative-finder`. Active frames inform the search for counter-narratives.

### Hard rules

- Static check at registration: missing projection for a declared chain = registration failure.
- Projections are pure functions, no side effects.
- Projection failures (e.g., source output missing expected field) degrade gracefully: B runs with un-augmented context and logs a warning.

### Definition of Done

- Static check exits 0 for all 16 tools.
- Four documented chains pass E2E.

### Verification commands

```bash
npm run audit:tool-composition-static
npx playwright test e2e/workbench/tool-composition-context-flow.spec.ts
```

---

## 12. Prompt M8 — Memo Studio integration

### Persona
Product engineer. Closes the loop between memo studio (pack 11) and the new tool/context/subagent surface.

### Outcome

- Memo creation is exposed as a tool: `cross.memo-create` with full v2 contract, SKILL.md, ContextProvider-aware handler.
- Memo refresh-from-graph is a tool: `cross.memo-refresh`.
- The Memo Drafter subagent (M5) is invoked from memo block edit mode for "Suggest content" UX.
- The auto-populator from pack 11 K3 now respects user communication style and pulls workspace methodology guides where relevant (e.g., a Mediation summary memo, when generated, uses workspace's Harvard PON primer if uploaded).

### Files to edit

- `src/components/memo/MemoEditor.tsx` (pack 11 K2) — add a "Suggest content" button per block; calls `ctx.subagent('memo_drafter', ...)` via the new memo tool.
- `src/lib/memo/templates/<id>/auto-populate.ts` (pack 11 K3) — read user communication style; query workspace retriever; produce templated content with appropriate verbosity.
- `src/lib/tools/registry/cross.memo-create.ts`, `cross.memo-refresh.ts` — new tools.
- `skills/tools/cross.memo-create/SKILL.md`, `skills/tools/cross.memo-refresh/SKILL.md`.
- `e2e/workbench/memo-with-context.spec.ts` — verify a Mediator user with concise communication style and uploaded Harvard PON primer gets a Mediation summary that's concise and references the primer.

### Hard rules

- Memo blocks produced via Memo Drafter carry `synthesized: true` and link to the subagent run for auditability.
- Pack 11 invariants preserved: BATNA confidentiality, citations to graph nodes, deterministic export.

### Definition of Done

- New memo tools registered, audited, persona suites updated to use them.
- Memo studio E2E green with the new context-aware behavior.
- Manual smoke: a memo refresh respects the user's communication style.

### Verification commands

```bash
npx playwright test e2e/workbench/memo-with-context.spec.ts
npm run audit:tool-contract-v2
```

---

## 13. Prompt M9 — Final verification + production deploy to praxis.tacitus.me

### Persona
Release engineer. Closes the pack. Deploys.

### Outcome

All audits green. Persona suites green. Documentation refreshed. Staging smoke 24h green. Production deploy clean.

### Files to create

- `scripts/audit-tool-context-isolation.ts` — every tool handler reads context only via `ContextProvider`.
- `scripts/audit-subagent-eval-fresh.ts` — each subagent's eval was run within the last 7 days.
- `docs/architecture/TOOL_CONTEXT_INTEROP.md` — canonical reference for the v2 contract + ContextProvider + skills + subagents.
- `docs/contributing/AUTHORING_A_TOOL.md` — how to add a 17th tool.
- `docs/contributing/AUTHORING_A_SUBAGENT.md` — how to add a new subagent.
- `docs/adr/0015-tool-contract-v2.md`.
- `docs/adr/0016-context-provider-runtime.md`.
- `docs/adr/0017-skills-as-first-class.md`.
- `docs/adr/0018-subagent-pattern.md`.

### Files to edit

- `package.json` — add `audit:tool-context-isolation`, `audit:subagent-eval-fresh`.
- `audit:gate` chain — append.
- `docs/architecture/SYSTEM_OVERVIEW.md` — diagram updated to show ContextProvider as the runtime hub.
- `CHANGELOG.md` — entry under the 1.x line.

### Staging + production deploy

- Deploy to `staging.praxis.tacitus.me` via existing Cloud Build pipeline.
- 24h smoke checklist:
  - Sign in as a test Diplomat → workbench tools tab → Suggestion banner shows top-3 with rationales.
  - Run `mediation.mediation-brief` against Northwind → output respects user communication style → `output_refiner` invoked → telemetry captured.
  - Compose `conflict.leverage-trace → cross.brief-exporter` → context flows correctly.
  - Open memo studio → click "Suggest content" → Memo Drafter invoked → output cites graph nodes.
  - Diagnostics dashboard → Context Health + subagent panels populated.
  - Persona suites all green on staging.
- After 24h staging smoke green, deploy to production (`praxis.tacitus.me`).
- Production smoke checklist (subset of staging) recorded in PR.
- Rollback plan documented.

### Definition of Done

- Single `npm run audit:gate` exits 0.
- Persona suites green for 10 consecutive runs.
- Staging 24h smoke green.
- Production deploy clean.
- Spike test: add a 17th tool from the template; takes < 60 minutes; persona-suite-discoverable.

### Verification commands

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# Pack 13 audits
npm run audit:tool-contract-v2
npm run audit:tool-skills-present
npm run audit:tool-skill-conforms
npm run audit:tool-context-isolation
npm run audit:tool-composition-static
npm run audit:subagent-eval-fresh
npm run audit:tool-suggestion-eval

# Single gate
npm run audit:gate

# Persona suites — 10 consecutive runs
npm run test:e2e:personas

# Staging + production smoke
PRAXIS_ENV=staging npm run smoke:tools
PRAXIS_ENV=production npm run smoke:tools
```

All commands exit 0. Staging and production smokes signed.

---

## 14. Final verification gate (before merge)

```bash
# Pack 12 (context) regression
npm run audit:context-aware-coverage
npm run audit:context-types-parity
npm run audit:preparer-eval-fresh

# Pack 13 (tool-context interop) audits
npm run audit:tool-contract-v2
npm run audit:tool-skills-present
npm run audit:tool-skill-conforms
npm run audit:tool-context-isolation
npm run audit:tool-composition-static
npm run audit:subagent-eval-fresh
npm run audit:tool-suggestion-eval

# Unified gate
npm run audit:gate

# Persona suites — production bar
npm run test:e2e:personas

# Tool spike: add a 17th tool from template; verify it's picked up
bash scripts/spike-add-tool.sh test-spike-tool

# Staging 24h smoke recorded
test -f docs/launch/staging-smoke-pack-13.signed.md

# Production smoke recorded
test -f docs/launch/production-smoke-pack-13.signed.md
```

---

## 15. Out of scope

- Custom user-authored tools (sealed v1 set; users propose, owner approves).
- Tool versioning across breaking contract changes (v2 is the v1 contract).
- Subagent fine-tuning (system prompts only at v1).
- Cross-workspace tool sharing (single-tenant at v1).
- Real-time tool collaboration (single-user runs at v1).
- LLM-authored tools (the AI suggests, the human writes — at v2).
- Tool marketplace beyond the 16 v1 tools + the few added by M8 (`cross.memo-create`, `cross.memo-refresh`).

---

## 16. Closing note

After this pack, three things are true:

1. **Every tool is one shape.** v2 contract, ContextProvider-injected handler, SKILL.md, declared subagent dependencies. Adding a 17th tool is a one-folder copy. AI agents can author, suggest, and audit tools using the SKILL.md. The 16 v1 tools, the memo tools, the export tools, and any future additions all live under the same contract.

2. **Every tool reads context the same way.** Through `ContextProvider`. The four-layer substrate (User / Workspace / Case / Conversation from pack 12) is queryable through one typed interface. The Context Preparer is a method call. The workspace retriever is a method call. The graph search is a method call. There is no second way.

3. **Every subagent invocation is observable, costed, and constrained.** Source Augmenter, Output Refiner, Memo Drafter, and the Context Preparer from pack 12 follow the same pattern: SKILL.md, LangGraph subgraph, output schema, eval set, cost ceiling, latency budget, telemetry. Adding a new subagent is the same shape.

PRAXIS at the end of pack 13 is one app deployed to praxis.tacitus.me, with a context substrate that knows who the user is, what their organization's methodology is, what the current case is, and what the user is doing right now; a tool layer that consumes that context through a single API; an authoring system that lets new tools be added in under an hour with AI-readable skill descriptions; and a subagent layer that fills the gaps where context is thin and shapes output to the user's voice. The architecture is finished. The product is supported. The launch from pack 11 is materially better with this pack on top.

Branch: `feature/tool-context-interop`. Commit prefix `interop(<area>): <prompt-id> <description>` for contract/runtime/subagent work; `tools(<tool-id>): M6 migrate to v2 contract` for migrations. PR titled `Pack 13 — Tool-Context Interoperability & Standardized Authoring`.

Do not merge to `main` without:
1. All audits green.
2. Persona suites green for 10 consecutive runs.
3. Spike test (add 17th tool from template) under 60 minutes.
4. Staging smoke at praxis.tacitus.me/staging green for 24h.
5. Production deploy to praxis.tacitus.me clean.
6. ADRs 0015-0018 reviewed and merged.

After merge, PRAXIS v1 is structurally complete. v1.1 begins from the post-launch backlog (pack 11 K9 roadmap) — multi-tenant teams, custom user ontologies, real-time ingestion, Neo4j revival for graph algorithms, memo collaboration, mobile workbench. The architecture supports all of them.
