# PRAXIS — CODEX Prompt Pack 01
## Architecture Consolidation, DIALECTICA Dyad, and Live Syria Wiring

> **Author:** Strategic engineering brief for Codex (OpenAI) and Claude Code agents.
> **Repo:** `sargonxg/A4_PRAXIS_CLOUD_Work` · branch `main`
> **Companion file:** `CODEX_PROMPTS_02_FRONTEND_SHOWCASE_AND_TESTING.md` (covers UX, the diplomat showcase walkthrough, and end-to-end testing).
> **Read first, before any prompt:** `AGENTS.md`, `CLAUDE.md`, `docs/CONTEXT_INJECTION.md`, `docs/OPERATIONAL_SPINE.md`, `docs/PRAXIS_DIALECTICA_BACKBONE_ARCHITECTURE_2026-05-01.md`, and the most recent `docs/CONTINUATION.md`.
> **Hard rules carried over:** never hardcode `gemini-*` strings outside `src/lib/ai/providers.ts`; never bypass `withCalibration` on AI routes; never write canonical graph mutations without analyst approval; never silently mix demo data into authenticated user state.

---

## Why this prompt pack exists

PRAXIS today has 55 tools in the registry, 62 AI routes, a Python FastAPI ACO pipeline, a partly built LangGraph runtime, a Firestore canonical graph, and a `/app/dialectica` page that previews a *future* premium backbone. That is too much surface for a fundable, defensible product. The companion strategic memo (the "Garry-Tan-fundable" version of TACITUS) reaches the same verdict from the business side.

This pack delivers, in order:

1. **A consolidation pass** — collapse what we have into a coherent dyad (DIALECTICA neurosymbolic engine + deterministic rule layer) without breaking what already works.
2. **Live-wired Syria** — the `/app/syria-case` workspace becomes a *real* end-to-end run: real OSINT sources, real ACO extraction, real graph reasoning, real briefing output, with cached fallbacks for offline demo only.
3. **Five named DIALECTICA reasoning recipes** — `LEVERAGE-TRACE`, `COMMITMENT-CHECK`, `INTEREST-vs-POSITION`, `COUNTER-NARRATIVE`, `PATH-SEARCH` — each with deterministic Cypher/Python rules layered on top of LLM extraction.
4. **A confidence-and-provenance backbone** — every primitive node carries `confidence ∈ [0,1]`, every edge carries a `source_span`, every reasoning step records the rule it ran. This is what makes the engine defensible to a regulator, a board, or a J2.
5. **A robust test gate** — Vitest, pytest, Playwright golden-path, and a TCGC-Syria evaluation harness, all wired into `npm run audit:gate` so a Codex run can self-verify.

Each prompt below is a **standalone, drop-in CODEX work order**. They are ordered by dependency. Each prompt has: a one-line outcome, prerequisites, files to touch, an explicit Definition-of-Done, and a verification command. **Run them in order.** Do not skip the typecheck/build/audit/test gate at the end of any prompt.

---

## Pack overview

| # | Prompt ID | Outcome | Est. effort |
|---|---|---|---|
| **A1** | `consolidation/registry-collapse` | Collapse 55 tools → 12 hero tools + archive shelf, without deleting code (feature-flag the rest) | 4–6 h |
| **A2** | `dialectica/typed-schema-v1` | Publish `conflict-grammar-v1` as a versioned, exported JSON-Schema + Zod + Pydantic triple | 4 h |
| **A3** | `dialectica/confidence-and-provenance` | Make confidence and provenance first-class on every node, edge, and reasoning step | 8 h |
| **A4** | `dialectica/three-views-one-graph` | Replace 7-graph spec with one Firestore graph + 3 query views (Episodic / Semantic / Stance) | 10 h |
| **A5** | `dialectica/reasoning-recipes` | Implement 5 named reasoning recipes as LangGraph DAG nodes with deterministic post-checks | 14 h |
| **A6** | `dialectica/adapter-boundary` | Reify the `DialecticaAdapter` interface; default Firestore impl; premium HTTP impl scaffolded | 6 h |
| **A7** | `syria/live-source-ingest` | Real OSINT pull (Reuters, AP, Al-Monitor, Enab Baladi, Syria Direct, North Press, UN Geneva, OCHA, UNHCR, ReliefWeb, UCDP, GDELT) | 10 h |
| **A8** | `syria/extract-and-grow-graph` | Run real ACO extraction on Syria sources; populate the canonical graph; persist with provenance | 8 h |
| **A9** | `syria/recipe-payoffs` | Wire the five recipes against the live Syria graph with cached fallback | 6 h |
| **A10** | `eval/tcgc-syria-v0` | Build the TCGC-Syria evaluation harness (golden expected primitives + reasoning paths) | 8 h |
| **A11** | `infra/audit-gate` | Add `npm run audit:gate` that runs typecheck, build, route audit, GCP audit, vitest, pytest, and TCGC-Syria | 3 h |
| **A12** | `cleanup/dead-code-and-drift` | Resolve provider model-string drift, delete dead service files, and document the new architecture | 4 h |

Total: roughly 4–5 focused engineering days for one Codex agent or 2 days with Claude+Codex tandem.

---

## Prompt A1 — `consolidation/registry-collapse`

### Outcome
Reduce the public-facing tool surface from 55 to **12 hero tools** without deleting code. Archived tools become reachable only through `/app/tools/archive` and `?show_archive=1`. The sidebar, command palette, and home grid show only the 12.

### Why this matters
Investor/buyer due diligence opens the sidebar and counts. 55 cards reads as sprawl. 12 cards reads as opinion. The strategic memo names this explicitly.

### Prerequisites
- Read `src/lib/constants/tool-registry.ts` (1,081 lines).
- Read `docs/PRAXIS_CONSOLIDATED_TOOL_AUDIT_2026-05-01.md`.
- Read `docs/tools/INDEX.md` if present.

### The 12 hero tools (final list)
| # | Tool ID | Why it's hero |
|---|---|---|
| 1 | `dashboard` | Situation room — first thing every user sees |
| 2 | `context-builder` | Gates AI spend on context health |
| 3 | `situation-intelligence` | Executive panel, the single most-demoable tool |
| 4 | `source-scout` | Source receipts with reliability tiers |
| 5 | `conflict-graph` | The visual ACO graph |
| 6 | `graphops` | Graph health, provenance, repair |
| 7 | `brainstorming-table` | Boardroom of disagreeing experts |
| 8 | `briefing` | Decision-ready brief output |
| 9 | `policy-memo` | Editable office-ready memo |
| 10 | `scenarios` | Counterfactual / scenario fork view |
| 11 | `negotiation-prep` | Fisher-Ury, BATNA, ZOPA — the diplomat's bread and butter |
| 12 | `treaty-analyzer` | Commitment compliance and norm tracker |

Everything else stays in the registry but with `surface: 'archive'` and `visible: false`.

### Files to touch
- `src/lib/constants/tool-registry.ts` — add `surface: 'hero' | 'archive' | 'admin'` to the `ToolDefinition` type and to every entry.
- `src/types/situation.ts` — extend `ToolDefinition`.
- `src/components/app/AppSidebar.tsx` (or current sidebar component — find via `grep -rn "tool-registry" src/components/`) — filter to `surface === 'hero'`.
- `src/app/app/tools/page.tsx` — accept `?show_archive=1` to surface the rest.
- `src/lib/constants/tool-registry.ts` — add a comment block at top documenting the 12 hero list and the rationale.

### Definition of Done
1. `grep -c "surface:" src/lib/constants/tool-registry.ts` returns ≥ 55 (every entry has the field).
2. `npm run verify-tools` passes (the script at `scripts/verify-tools.ts` already validates the registry — extend it to assert exactly 12 heroes).
3. The sidebar in dev shows 12 entries by default.
4. Visiting `/app/tools?show_archive=1` shows all 55.
5. No tool's `aiRoute` is removed; routes still respond.
6. `docs/CHANGELOG.md` updated under `[Unreleased]` with `feat(consolidation): collapse public tool surface to 12 hero tools (#A1)`.

### Verification
```bash
npx tsc --noEmit
npm run lint
npm run verify-tools
npx vitest run tests/unit/lib/constants
npm run build
```

### Rollback
The change is additive (new field, new filter). Reverting = remove the filter from the sidebar; surface field remains.

---

## Prompt A2 — `dialectica/typed-schema-v1`

### Outcome
Publish `conflict-grammar-v1` — a single, versioned JSON-Schema document describing the 8 ACO primitives, their typed metadata, the 42-edge relationship vocabulary, and the four confidence levels. Generate the **Zod TS types** and the **Pydantic models** from that single source so frontend and backend cannot drift.

### Why this matters
Today the schema lives in three places: `src/lib/ai/schemas/conflict-grammar.ts` (Zod), `backend/graphify_tacitus/schemas/` (Pydantic), `src/lib/services/entity-extraction.ts` (a third partial copy with 14 entity types). Drift is already happening (8 vs 14 primitives, different edge vocabularies). One schema, two generators.

### Files to touch
- New: `schemas/conflict-grammar-v1.json` (top-level repo dir).
- New: `schemas/conflict-grammar-v1.md` (human-readable spec).
- New: `scripts/codegen-schema.ts` — runs `json-schema-to-zod` and `datamodel-code-generator` to emit Zod + Pydantic.
- Modify: `src/lib/ai/schemas/conflict-grammar.ts` — replace by codegen output, mark as generated.
- Modify: `backend/graphify_tacitus/schemas/aco.py` — replace by codegen output, mark as generated.
- Modify: `src/lib/services/entity-extraction.ts` — drop the local `ACO_ENTITY_TYPES` triple-source and import from `@/lib/ai/schemas/conflict-grammar`.
- Modify: `package.json` — add `"schema:gen": "tsx scripts/codegen-schema.ts"`.

### Strategic decision: 8 primitives, not 14
The codebase has crept from 8 → 14 (added Institution, Norm, Resource, Risk, Policy, Grievance). For DIALECTICA v1 we lock to **8 primitives**. The other 6 become **typed sub-classifications** carried as metadata on the right primitive (e.g., `Institution` becomes `Actor.subtype = 'institution'`; `Norm` becomes `Constraint.subtype = 'norm'`; `Risk` becomes a derived score, not a node type; `Policy` becomes `Commitment.subtype = 'policy_commitment'`; `Grievance` becomes `Claim.subtype = 'grievance'`). This is the correct call: extra node types make extraction brittle without adding analytical power.

### Confidence levels (locked)
```
EXTRACTED  : directly stated in the source text
INFERRED   : reasonable deduction from explicit text
AMBIGUOUS  : multiple interpretations possible — flag for analyst
ASSESSED   : analyst or AI judgment based on pattern recognition
```

Each primitive *also* carries a numeric `confidence: number` in `[0,1]` (independent of the categorical level). Categorical level is for UI; numeric is for reasoning recipes (multiplied along paths).

### Edge vocabulary (locked at 42)
Keep the existing 42-edge vocabulary in `backend/graphify_tacitus/schemas/relationships.py`. Generate a JSON-Schema enum from it. Any edge type not in the enum is rejected at extraction time with a typed validation error (don't silently drop).

### Definition of Done
1. `schemas/conflict-grammar-v1.json` validates with `npx ajv validate -s schemas/conflict-grammar-v1.json -d backend/tests/fixtures/syria_aco_sample.json` (you will create that fixture in A8).
2. `npm run schema:gen` produces TS and Python files identical to what's in the repo (commit-clean diff after running).
3. `src/lib/services/entity-extraction.ts` no longer declares `ACO_ENTITY_TYPES` locally.
4. Backend: `python -m pytest backend/tests/test_aco_schemas.py -v` passes.
5. Frontend: `npx vitest run tests/unit/lib/ai/schemas` passes.
6. `schemas/conflict-grammar-v1.md` documents primitives, edges, confidence, and version semantics. Add `version: "1.0.0"` and a SemVer policy.

### Verification
```bash
npm run schema:gen          # idempotent
git diff --exit-code        # must be clean after regen
npx tsc --noEmit
cd backend && python -m pytest tests/test_aco_schemas.py -v
```

### Open-source angle (do this in A12, not now)
The strategic memo recommends open-sourcing the schema as a standalone repo (`tacitus-conflict-grammar`). That's a Phase-2 GTM move; for now we just need a single internal source of truth.

---

## Prompt A3 — `dialectica/confidence-and-provenance`

### Outcome
Every primitive node carries `{ confidence: number ∈ [0,1], extractor_version: string, source_span: SourceSpan }`. Every edge carries the same. Every reasoning recipe records `{ ruleId, inputNodeIds, modelVersion, confidence, ts }` to a sibling **provenance graph**. The UI surfaces these — confidence badges, source-span hover, "why?" click-through.

### Why this matters
This is the single most important moat we can build. "The LLM said so" is a weak answer to a J2, a GC, or an EU AI Act auditor. "This recommendation traces to nodes X, Y, Z; X was extracted from UN Geneva 2026-02-13 paragraph 4 with confidence 0.91; rule R7 (LEVERAGE-TRACE) ran on it; output confidence is 0.74" is unfalsifiable.

### Files to touch
- `schemas/conflict-grammar-v1.json` — add `confidence` (numeric) and `provenance` block to every node and edge schema.
- `src/lib/services/entity-extraction.ts` — extraction must emit `confidence` and `source_span` for every node and edge.
- `backend/graphify_tacitus/extract.py` — same on the Python side.
- New: `src/lib/knowledge/provenance-graph.ts` — typed CRUD over `users/{uid}/situations/{sid}/provenance/{stepId}`.
- New: `firestore.rules` — extend rules to allow owner-only read/write of `provenance/*` (mirror the `graph/*` pattern).
- New: `firestore.indexes.json` — composite indexes for provenance queries by `ruleId` and `ts`.
- `src/components/praxis/confidence-badge.tsx` — already exists; bind to numeric confidence (currently categorical-only).
- `src/components/praxis/citation.tsx` — wire to `source_span` lookup.
- `src/components/praxis/output-provenance-panel.tsx` — already exists; extend to read from the provenance graph.

### `SourceSpan` shape (lock now)
```typescript
export interface SourceSpan {
  documentId: string;          // Firestore doc id or external URL hash
  charStart: number;           // 0-based inclusive
  charEnd: number;             // 0-based exclusive
  excerpt: string;             // ≤ 500 chars, for fast UI render
  retrievedAt: string;         // ISO 8601
  retrievalMethod: 'grounded_search' | 'firecrawl' | 'feed' | 'upload' | 'manual';
}
```

### Confidence propagation rule (lock now)
For a reasoning path through nodes `n1 → n2 → ... → nk` along edges `e1 ... e(k-1)`:
```
path_confidence = min(node_confidences) * Π(edge_confidences)
```
This is a **conservative lower bound**. Use it in PATH-SEARCH ranking. Document the choice in `schemas/conflict-grammar-v1.md`.

### Definition of Done
1. Every node and edge in the Syria fixture (created in A8) has `confidence` and `source_span` populated.
2. The conflict-graph UI hover shows confidence + click-through to source span.
3. Firestore rules block cross-user reads of provenance (test in `tests/unit/lib/firebase/provenance.rules.test.ts`).
4. `OutputProvenancePanel` renders the rule chain for any tool output that has a `provenance.runId`.
5. A unit test in `tests/unit/lib/knowledge/provenance-graph.test.ts` verifies confidence-propagation math.

### Verification
```bash
npx tsc --noEmit
npm run lint
npx vitest run tests/unit/lib/knowledge tests/unit/lib/firebase
firebase emulators:exec --only firestore "npx vitest run tests/unit/lib/firebase/provenance.rules.test.ts"
npm run build
```

---

## Prompt A4 — `dialectica/three-views-one-graph`

### Outcome
Replace the previously-spec'd 7 logical graphs with **one canonical graph + three computed views** over it. Views are pure functions of the graph (no separate stores). The three views are:

| View | Filter | Used by |
|---|---|---|
| **Episodic** | All `Event` nodes + edges incident on them, ordered by `event_time` | Timeline tool, scenario tool, COMMITMENT-CHECK |
| **Semantic** | Actor / Claim / Interest / Constraint / Commitment / Leverage subgraph (no Events, no Narratives) | LEVERAGE-TRACE, INTEREST-vs-POSITION, Conflict Graph default render |
| **Stance** | Narratives + the Actors that propagate them + the Claims they justify | COUNTER-NARRATIVE, Media Compass, Info-Environment |

### Why this matters
The DIALECTICA backbone architecture doc lists 7 graphs (Facts, Provenance, Retrieval Trace, Hypotheses, Contradictions, Advisor Reasoning, Scenario Forks). Some of those are real *additional graphs* (Provenance, Hypotheses, Scenario Forks). Others are *views* (Retrieval Trace, Contradictions, Advisor Reasoning). Collapse the views; keep the additional graphs. Net result: 4 stores (Facts, Provenance, Hypotheses, Scenario Forks) + 3 computed views over Facts. That's the architecture.

### Files to touch
- New: `src/lib/knowledge/graph-views.ts` — pure functions `episodicView(graph)`, `semanticView(graph)`, `stanceView(graph)` returning a typed `GraphView` (subset of nodes + edges).
- Modify: `src/app/app/conflict-graph/page.tsx` — add a view selector (Episodic / Semantic / Stance / All).
- Modify: `src/lib/knowledge/firestore-graph-analytics.ts` — pre-compute view materializations as Firestore subcollections for fast read (write on graph-mutation event).
- New: `src/lib/knowledge/hypotheses-graph.ts` — sibling Firestore collection at `users/{uid}/situations/{sid}/hypotheses/{hid}`.
- New: `src/lib/knowledge/scenario-forks.ts` — fork-and-merge with branch-id'd graph snapshots; use copy-on-write semantics keyed by `forkId`.

### Hypotheses graph (new)
Until promoted to Facts, an extracted entity goes to Hypotheses. Promotion requires analyst approval (which already exists as `graph-updates-service`). Tighten the existing flow so *all* extraction lands in Hypotheses by default.

### Scenario forks (new but light)
A "scenario" is a named copy-on-write delta over the Facts graph. Implement as a `forkId` field on a slim mutation log — never a full graph copy. Render in scenarios tool.

### Definition of Done
1. The ConflictGraph page renders the same Syria graph in 4 modes (3 views + All).
2. Switching views is < 100ms client-side once the materialization is cached.
3. New hypothesis flow: extracting from Syria sources puts entities in `hypotheses/`, not `graph/`. Approving in GraphOps moves them.
4. Scenario fork "What if SDF withdraws from January agreement?" creates a forkId; original facts unchanged; view shows delta-marked nodes/edges.
5. Tests: `tests/unit/lib/knowledge/graph-views.test.ts` validates each view returns the right node-type subset.

### Verification
```bash
npx tsc --noEmit
npx vitest run tests/unit/lib/knowledge
npm run build
# Manual smoke (with dev server up):
curl -sX POST http://localhost:3000/api/situations/syria-transition-2026/hypotheses \
  -H 'Content-Type: application/json' \
  -d '{"node":{"type":"actor","label":"Test Actor","confidence":0.5}}'
```

---

## Prompt A5 — `dialectica/reasoning-recipes`

### Outcome
Implement the five named DIALECTICA reasoning recipes as deterministic LangGraph DAGs in the Python backend, exposed through a single endpoint `POST /api/v1/reason/{recipe}`. Each recipe takes a graph view + parameters and returns ranked typed answers with confidence and provenance.

### The five recipes (locked)

#### 1. `LEVERAGE-TRACE`
**Question:** *Given two actors A and B, what concrete leverage paths exist from A → B?*
**Inputs:** `actor_a_id`, `actor_b_id`, optional `domain` filter.
**View:** Semantic.
**Pipeline:**
1. Cypher-style traversal in NetworkX/FalkorDB: paths from A to B passing through `Leverage` nodes (max depth 3).
2. Score each path: `path_confidence` (formula in A3) × `leverage.effectiveness` × `(1 - target_constraint_severity)`.
3. Group by leverage type (military / economic / diplomatic / informational / moral).
4. Return top 5 paths per type.

**Output schema:**
```typescript
type LeverageTraceResult = {
  paths: Array<{
    actor_a: string;
    actor_b: string;
    leverage_type: string;
    chain: Array<{ node_id: string; type: string; label: string }>;
    confidence: number;
    rationale: string;             // one-line natural language
    counter_leverage: string[];    // node ids of B's reciprocal leverage
  }>;
};
```

#### 2. `COMMITMENT-CHECK`
**Question:** *Which commitments in scope are currently fragile or violated, and what is the fallout chain?*
**Inputs:** `situation_id`, optional `time_window`.
**View:** Episodic + Semantic union.
**Pipeline:**
1. Enumerate all `Commitment` nodes; cross-check with `Event` nodes via `violated_by_event` edge.
2. For each violated/fragile commitment, walk forward via `addresses_claim` and `made_commitment` edges to identify downstream commitments at risk.
3. Return ranked list keyed by **commitment fragility score** = `(1 - status_active) * importance * downstream_count`.
4. For Syria: this is what catches "the 30 January agreement says X about Kurdish rights, but UN reporting says implementation is thin — the commitment is at risk."

#### 3. `INTEREST-vs-POSITION`
**Question:** *Where do stated positions diverge from inferred interests, and where are negotiation openings?*
**Inputs:** `actor_ids` (typically 2 to 6).
**View:** Semantic.
**Pipeline:**
1. For each actor, gather `claims` (positions) and `interests` (objectives + salience + negotiable bool).
2. Identify mismatches: high-salience non-negotiable interests with low-confidence claim coverage = hidden opening.
3. Cross-actor pair scoring: where Actor A's position contradicts Actor B's position but their *interests* don't conflict → ZOPA candidate.
4. Output ranked ZOPA candidates.

#### 4. `COUNTER-NARRATIVE`
**Question:** *What does each actor's preferred narrative say about a contested event, and where do they citation-conflict?*
**Inputs:** `event_id` or `claim_id`.
**View:** Stance.
**Pipeline:**
1. For the input node, find all `Narrative` nodes that frame it (`frames_event` / `justifies_claim`).
2. For each narrative, return the actor that propagates it, the citation set used, and the explicit claim it makes.
3. Compute citation overlap and divergence (Jaccard over `source_span.documentId`).
4. Output two-column "both sides" view + a divergence score.

#### 5. `PATH-SEARCH`
**Question:** *What sequence of actions has the highest probability of resolving the situation?*
**Inputs:** `situation_id`, `goal_state` (free-text narrative or typed `target_glasl_stage`).
**View:** Episodic + Semantic.
**Pipeline:**
1. Generate 3–8 candidate intervention chains using LLM proposal grounded in the graph.
2. For each chain, score: `joint_confidence × constraint_compatibility × leverage_availability`.
3. Validate chain doesn't violate any active hard `Constraint`.
4. Return ranked paths with cost / risk / probability triples.

### Files to touch (Python backend)
- New: `backend/dialectica/__init__.py`
- New: `backend/dialectica/recipes/leverage_trace.py`
- New: `backend/dialectica/recipes/commitment_check.py`
- New: `backend/dialectica/recipes/interest_vs_position.py`
- New: `backend/dialectica/recipes/counter_narrative.py`
- New: `backend/dialectica/recipes/path_search.py`
- New: `backend/dialectica/runner.py` — LangGraph DAG that composes the recipes; cached in Cloud SQL via existing checkpointer.
- New: `backend/routers/reason.py` — FastAPI endpoint `POST /api/v1/reason/{recipe}`.
- Modify: `backend/main.py` — register the new router.
- New: `backend/tests/test_recipes_leverage_trace.py`, `_commitment_check.py`, `_interest_vs_position.py`, `_counter_narrative.py`, `_path_search.py`.

### Files to touch (Frontend)
- New: `src/app/api/dialectica/reason/[recipe]/route.ts` — proxy with `withCalibration` to the backend OIDC call.
- New: `src/lib/dialectica/client.ts` — typed client for the five recipes.
- Modify: `src/app/app/conflict-graph/page.tsx` — "Run recipe" button: opens a side panel; user picks recipe + params; results render with provenance.
- New: `src/components/dialectica/recipe-result-panel.tsx` — generic renderer with recipe-specific subcomponents.

### Definition of Done
1. `POST /api/v1/reason/leverage-trace` with Syria fixture inputs (actor-syrian-government, actor-sdf) returns 3+ paths with confidence ≥ 0.5.
2. `POST /api/v1/reason/commitment-check` flags the 30 January agreement as fragile *because of* specific event references.
3. Each recipe runs end-to-end in < 6s on the Syria fixture.
4. Each recipe persists a provenance record (rule_id = recipe name, inputs, output, confidence).
5. UI: clicking a recipe result row scrolls the graph to the relevant subgraph and highlights provenance.
6. All five `pytest` files pass with deterministic fixtures.

### Verification
```bash
cd backend && python -m pytest tests/test_recipes_*.py -v
cd backend && python -m dialectica.runner --recipe leverage-trace --fixture syria  # CLI smoke
npx tsc --noEmit
npx vitest run tests/unit/lib/dialectica
npm run build
```

### Critical engineering note: do NOT build CozoDB / Datalog
The DIALECTICA architecture doc mentions Datalog. **Skip it.** Datalog is elegant; the talent pool to maintain it is microscopic. Implement every recipe as Cypher-style traversal in NetworkX (Python) over a Firestore-loaded graph, *plus* a small (≤300 LOC) Python rule layer for invariants. We get every analytical capability we wanted from Datalog with one less language and one less DB.

---

## Prompt A6 — `dialectica/adapter-boundary`

### Outcome
Reify the `DialecticaAdapter` interface (already specified in `docs/PRAXIS_DIALECTICA_BACKBONE_ARCHITECTURE_2026-05-01.md`) as a single TypeScript interface. Provide two implementations: a **default Firestore impl** that uses everything we built in A1–A5, and a **stubbed HTTP impl** that calls `https://dialectica.tacitus.me` (which is the future premium SaaS). The HTTP impl is feature-flagged off.

### Why this matters
Without the boundary, the rest of the app is coupled to Firestore and to our internal LangGraph runner. With the boundary, swapping in a remote DIALECTICA service later (or licensing the engine to a defense prime) is a one-config change.

### The interface (lock now)
```typescript
// src/lib/dialectica/adapter.ts
export interface DialecticaAdapter {
  resolveOntology(situation: SituationFrame): Promise<OntologyVersion>;
  extract(input: ExtractInput): Promise<GraphProposal>;
  proposeMutations(proposals: GraphProposal): Promise<MutationProposalResult>;
  approveMutations(approvalSet: ApprovalSet): Promise<MutationApplyResult>;
  contextPack(query: ContextPackQuery): Promise<DialecticaContextPack>;
  reason<R extends RecipeId>(recipe: R, params: RecipeParams<R>): Promise<RecipeResult<R>>;
  graphHealth(situationId: string): Promise<GraphHealthReport>;
  capabilities(): AdapterCapabilities;
}
```

### Files to touch
- New: `src/lib/dialectica/adapter.ts` — interface + types.
- New: `src/lib/dialectica/firestore-adapter.ts` — default impl wrapping our Firestore graph + the new `/api/dialectica/reason` route.
- New: `src/lib/dialectica/http-adapter.ts` — premium impl, HTTP-only, feature-flagged.
- New: `src/lib/dialectica/index.ts` — `getAdapter()` factory based on `DIALECTICA_ENABLED` and user tier.
- Modify: every place currently doing direct Firestore graph reads for AI-tool context (`src/lib/ai/situation-context.ts`, `src/lib/knowledge/situation-knowledge-core.ts`) — go through `getAdapter().contextPack(...)`.
- Modify: `src/lib/constants/dialectica-backbone.ts` — flip readiness states for items now actually built (provenance, retrieval trace, advisor reasoning).
- Modify: `src/app/app/dialectica/page.tsx` — replace future-tense copy with present-tense for everything in `available` / `standard` state.

### Definition of Done
1. `getAdapter()` returns Firestore adapter by default; flipping `DIALECTICA_ENABLED=true` returns HTTP adapter (which throws "not configured" until the SaaS is up — that's fine).
2. Every AI route still works exactly as before (regression: no behavior change in default mode).
3. `/app/dialectica` page now correctly says "Live now" for typed grammar, source-grounded retrieval, analyst-approved mutations, retrieval traces, advisor reasoning. Premium-target items (recursive Datalog reasoning, time-validity forks, link prediction) remain `premium` / `planned`.

### Verification
```bash
npx tsc --noEmit
npx vitest run tests/unit/lib/dialectica
npm run audit:routes
npm run build
```

---

## Prompt A7 — `syria/live-source-ingest`

### Outcome
The Syria workspace becomes truly live. A new endpoint `POST /api/situations/[id]/syria-ingest` pulls fresh sources across the Syria source library (defined below), normalizes them, attaches provenance, and writes them as Documents under the situation. Cron scheduler triggers a daily refresh. **Cached fallback** for offline demo so the recording never breaks.

### Source library (lock now — this is the "real sources" the user asked for)

| Tier | Source | URL | Why |
|---|---|---|---|
| **Primary (UN)** | UN Geneva press briefings (Syria) | https://www.ungeneva.org/en/news-media (filter: syria) | First-party UN reporting |
| **Primary (UN)** | UN Special Envoy office | https://specialenvoysyria.unmissions.org/ | SRSG statements, briefings |
| **Primary (UN)** | OCHA Syria | https://www.unocha.org/syrian-arab-republic | Humanitarian sitreps |
| **Primary (UN)** | UNHCR Syria | https://www.unhcr.org/sy/ | Returns, displacement |
| **Primary (UN)** | UNFPA Arab States | https://arabstates.unfpa.org/en/syria | Northeast / Aleppo focus |
| **Primary (UN)** | UN Common Country Analysis | https://syria.un.org/en/312773-common-country-analysis-syria | Annual integrated transition analysis |
| **Humanitarian** | ReliefWeb (Syria) | https://reliefweb.int/country/syr | Aggregator of NGO sitreps |
| **Conflict data** | UCDP GED (Syria) | https://ucdp.uu.se/country/652 | Georeferenced conflict events |
| **Conflict data** | GDELT (Syria) | BigQuery `gdelt-bq.gdeltv2.events` filtered to `ActionGeo_CountryCode='SY'` | Media-event volume |
| **Local independent** | Enab Baladi | https://english.enabbaladi.org/ | Syrian diaspora newsroom, strong local sources |
| **Local independent** | Syria Direct | https://syriadirect.org/ | Independent investigative reporting |
| **Local independent** | North Press Agency | https://npasyria.com/en/ | Northeast Syria specialist |
| **Local independent** | The Syria Report | https://syria-report.com/ | Economy, HLP, governance |
| **Regional analysis** | Al-Monitor (Syria) | https://www.al-monitor.com/section/syria | Regional dynamics |
| **Wire** | Reuters (Syria) | grounded search keyword filter | Daily wire |
| **Wire** | Associated Press (Syria) | grounded search keyword filter | Daily wire |
| **Think tank** | Crisis Group (Syria) | https://www.crisisgroup.org/middle-east-north-africa/syria | Long-form analysis (CC-allowed excerpts) |
| **Think tank** | Carnegie MEC | https://carnegie-mec.org/regions/?lang=en (syria filter) | Regional policy analysis |

### Files to touch
- New: `src/lib/syria/source-library.ts` — typed list (mirror table above).
- New: `src/lib/syria/ingest.ts` — orchestrates per-source pulls.
- New: `src/lib/syria/clients/un-geneva.ts`, `oh-cha.ts` (sic), `unhcr-sy.ts`, `unfpa-arab.ts`, `enab-baladi.ts`, `syria-direct.ts`, `north-press.ts`, `syria-report.ts`, `al-monitor.ts` — thin RSS / sitemap clients with politeness (rate limits, User-Agent identifying PRAXIS, robots.txt respect).
- Reuse: `src/lib/data-feeds/reliefweb-client.ts`, `ucdp-client.ts`, `gdelt-client.ts`, `unnews-client.ts`, `grounded-search-client.ts` — wrap with Syria-specific query templates.
- New: `src/app/api/situations/[id]/syria-ingest/route.ts` — orchestrator.
- New: `cloud_functions/syria_daily_refresh/` — Cloud Scheduler-triggered Cloud Function (daily 06:00 UTC).
- Modify: `src/lib/constants/syria-demo-case.ts` — add a `SYRIA_LIVE_INGEST_ENABLED` flag and a `cachedFallback` block populated from the existing constants (so the recording never breaks).
- New: `tests/integration/syria-ingest.spec.ts` — Vitest integration that mocks all external HTTP and verifies orchestrator produces ≥ 8 documents with proper provenance.

### Politeness & legal
- All clients respect `robots.txt` and emit `User-Agent: PRAXIS/6.5 (https://praxis.tacitus.me; contact@tacitus.me)`.
- Headers carry an `X-Praxis-Purpose: research` token.
- Each client has a per-source rate limit (default: 1 req / 2s, configurable).
- For sources that publish RSS/Atom, prefer it over scraping. Where no RSS exists, use Firecrawl or Parallel.ai if configured; else `grounded-search` as fallback.
- For Crisis Group / Carnegie / Al-Monitor: pull only metadata + a 2-sentence excerpt; never reproduce the article body. Defer to `web-research.ts` patterns.
- ACLED is **out**. Keep it out; the codebase already removed it.
- Document the licensing posture in `docs/COMPLIANCE.md` under a new "Syria source library" section.

### Definition of Done
1. `POST /api/situations/syria-transition-2026/syria-ingest` (with the Syria demo workspace bound) creates ≥ 8 new Document records under the situation, each with `provenance.retrievalMethod` set correctly, `provenance.retrievedAt` ISO timestamp, and a normalized `text` field.
2. The daily Cloud Function deploys and shows up in Cloud Scheduler (`gcloud scheduler jobs list`).
3. With `SYRIA_LIVE_INGEST_ENABLED=false`, the cached fallback path returns the existing pre-baked data (recording-safe).
4. Integration test passes against mocked HTTP.
5. Each source has a "last 7 days" filter; we never ingest unbounded backlogs.

### Verification
```bash
npx vitest run tests/integration/syria-ingest.spec.ts
npx tsc --noEmit
# Live smoke (with creds):
curl -X POST http://localhost:3000/api/situations/syria-transition-2026/syria-ingest \
  -H "Cookie: $PRAXIS_DEMO_COOKIE"
gcloud scheduler jobs list --location=us-central1 | grep syria_daily_refresh
```

### Cost control
Daily ingest at full library size will cost roughly $0.20–$0.80/day in grounded-search + token spend. Cache aggressively in Firestore (`syria-source-cache/{sourceId}/{contentHash}`) with 24h TTL. Re-extraction is free if hash unchanged.

---

## Prompt A8 — `syria/extract-and-grow-graph`

### Outcome
The documents ingested in A7 are run through the ACO extractor (Python backend, A2 schema). Extractions land in the **hypotheses** subgraph (A4). A new `/api/situations/[id]/syria-promote` endpoint lets the analyst (or, in demo mode, an automatic tour) promote a curated subset to canonical Facts. The Syria workspace ends up with a real, growing, dated graph that *demonstrably* came from real reporting.

### Files to touch
- New: `src/lib/syria/extract.ts` — orchestrates extraction across all Syria documents using the existing `entity-extraction.ts` service.
- Modify: `backend/graphify_tacitus/extract.py` — accept the new schema fields (confidence, source_span, extractor_version).
- New: `src/app/api/situations/[id]/syria-extract/route.ts` — orchestrator endpoint, idempotent.
- New: `src/app/api/situations/[id]/syria-promote/route.ts` — promotes hypotheses → facts in batch (analyst-approved).
- New: `tests/integration/syria-extract.spec.ts` — verifies extraction yields ≥ 30 actor mentions, ≥ 20 events, ≥ 10 commitments across the source library, with no schema violations.
- New: `backend/tests/fixtures/syria_aco_sample.json` — golden expected output for A2 schema validation.
- Modify: `src/lib/constants/syria-demo-case.ts` — `SYRIA_DEMO_CONFLICT_GRAPH` becomes a *seed* used only when live extraction returns < 10 entities (fallback). The default state is "live extraction has run and graph is grown."

### Provenance requirement (non-negotiable)
For every extracted node and edge, `source_span.documentId` must point to a real Document under the situation, and `source_span.charStart/charEnd` must isolate the supporting text. The hover tooltip in conflict-graph (A3) must work for every node.

### Definition of Done
1. Running A7 ingest then A8 extract on a clean situation yields a graph with ≥ 60 nodes (across all 8 primitives) and ≥ 80 edges, all with valid provenance.
2. Promotion endpoint is gated by `withCalibration` and writes to the canonical graph, *not* the hypotheses graph.
3. The `Conflict Graph` page on the Syria workspace renders the live graph with view-mode toggle (A4).
4. Pytest fixture matches schema strictly (`ajv` validation passes with no warnings).
5. There is *zero* hardcoded actor or event in the live path; only extracted content.

### Verification
```bash
npx vitest run tests/integration/syria-extract.spec.ts
cd backend && python -m pytest tests/test_extraction.py -v
# Manual smoke after A7 ran:
curl -X POST http://localhost:3000/api/situations/syria-transition-2026/syria-extract \
  -H "Cookie: $PRAXIS_DEMO_COOKIE" -d '{}'
# Inspect:
curl http://localhost:3000/api/situations/syria-transition-2026/graph | jq '.nodes | length'
```

### Failure mode handling
If a source returns 0 extractable entities (e.g., Reuters article paywalled and only headline retrievable), the orchestrator must record the failure as a `system_event` with `severity: 'low'` and continue. Never fail the whole extract on one source.

---

## Prompt A9 — `syria/recipe-payoffs`

### Outcome
Wire the five DIALECTICA recipes (A5) against the live Syria graph (A8) and surface the results in the Syria workspace UI. Each recipe returns a *real* answer rooted in the live graph. Cached fallback exists for the recording.

### The five payoff demos for Syria

| Recipe | Syria question | Expected answer shape (real, not staged) |
|---|---|---|
| `LEVERAGE-TRACE` | What leverage does Damascus hold over the SDF, and vice versa? | Damascus: revenue centralization, currency, regional recognition. SDF: territorial control, prison custody (ISIL detainees), Western counter-ISIL relationship. |
| `COMMITMENT-CHECK` | Which provisions of the 30 January integration agreement are at risk? | Rights guarantees (mentioned in UN reporting but not yet enacted), military integration timeline (delayed), revenue-sharing. |
| `INTEREST-vs-POSITION` | Where do Damascus's stated positions diverge from likely interests? | State authority (position) vs. revenue + foreign legitimacy (interest); centralized command (position) vs. SDF's continued counter-ISIL utility (interest). |
| `COUNTER-NARRATIVE` | How do Damascus, SDF, and Israel narrate the southern Syria flashpoints? | Three narratives, divergent citation sets. |
| `PATH-SEARCH` | What sequence of UN actions over the next 60 days has the highest probability of preserving the agreement? | Ranked: technical verification mission → quiet diplomacy with Damascus + SDF → Security Council reporting cadence → contingent humanitarian access guarantees. |

### Files to touch
- New: `src/components/syria/recipe-card.tsx` — generic card that wraps a recipe call and renders the typed result.
- Modify: `src/app/app/syria-case/page.tsx` — add a "DIALECTICA reasoning" section with the 5 cards.
- New: `src/lib/syria/cached-recipe-results.ts` — recording-safe fallback if backend recipe runner times out (> 8s).
- New: `tests/integration/syria-recipes.spec.ts` — runs each recipe against the seeded Syria graph; asserts shape of results.

### Definition of Done
1. The Syria workspace page has a clearly-labeled DIALECTICA section with five cards.
2. Each card runs the recipe live in < 6s and shows results with confidence + provenance click-through.
3. If the backend errors or times out, the card swaps to the cached recipe result (with a small "cached" badge — never silent).
4. Each cached result is *internally consistent* with the live graph fixture (so the demo doesn't lie).
5. Tests pass.

### Verification
```bash
npx vitest run tests/integration/syria-recipes.spec.ts
npm run build
# Manual: visit /app/syria-case after A7+A8 have run; click each recipe card.
```

---

## Prompt A10 — `eval/tcgc-syria-v0`

### Outcome
A first version of the TACITUS Conflict Grammar Corpus, scoped to Syria. A reproducible eval harness with golden expected primitives, expected reasoning paths, and 5 scoring metrics. Output runs in CI as part of `npm run audit:gate` (A11).

### Why this matters
The strategic memo identifies TCGC as one of the "five defensible advantages" — almost no early-stage AI company has its own private benchmark. We make ours reproducible, public-source-grounded (Syria), and CI-gated.

### The five metrics
| Metric | Definition |
|---|---|
| `extraction_f1` | Token-level F1 of extracted primitives vs. golden, per primitive type |
| `edge_precision` | Of edges produced, fraction that are valid (vocabulary + endpoints exist + supported by source) |
| `confidence_calibration` | Expected Calibration Error (ECE) on numeric confidence scores against analyst gold-standard |
| `recipe_path_accuracy` | For each of the 5 recipes, fraction of expected paths recovered (set-overlap) |
| `provenance_validity` | Fraction of nodes/edges with valid, in-document `source_span` |

### Files to touch
- New: `eval/tcgc/syria/v0/`
  - `golden_primitives.json` — 60 nodes + 80 edges hand-curated with confidence and source_span, drawn from the Syria source library.
  - `golden_recipe_paths.json` — expected outputs for each of the 5 recipes.
  - `run.py` — runs extract + recipes; computes metrics; writes `results.csv` + `report.md`.
- New: `scripts/eval-syria.mjs` — Node wrapper that calls `run.py` and exits non-zero if any metric falls below thresholds.
- New: thresholds in `eval/tcgc/syria/v0/thresholds.json`:
  - `extraction_f1 ≥ 0.65`
  - `edge_precision ≥ 0.75`
  - `confidence_calibration ≤ 0.20` (ECE)
  - `recipe_path_accuracy ≥ 0.50`
  - `provenance_validity = 1.00`
- Modify: `package.json` — `"eval:syria": "node scripts/eval-syria.mjs"`.
- New: `docs/EVAL_TCGC_SYRIA.md` — describes the harness, threshold rationale, how to refresh golden data.

### Curating the golden data
This is the most labor-intensive step. Approach:
1. Run A7 + A8 against Syria sources for a fixed snapshot date (lock to `2026-05-01`).
2. The author (Giulio) reviews the extracted graph, edits primitives in GraphOps, and exports the approved subset as `golden_primitives.json`.
3. Author also writes `golden_recipe_paths.json` by running each recipe and editing its output to the "correct" answer.
4. Re-running the eval harness against the original snapshot must reproduce ≥ 80% of golden output (or thresholds are too tight — back off).

### Definition of Done
1. `npm run eval:syria` runs end-to-end and produces `eval/tcgc/syria/v0/results.csv` and `report.md`.
2. All metrics meet thresholds on the locked 2026-05-01 snapshot.
3. The harness is deterministic given the same model temperature and snapshot (re-run produces byte-identical results.csv).
4. CI integration: a new GitHub Actions workflow `.github/workflows/eval-syria.yml` runs the harness on a recurring schedule (weekly) and posts to a Slack/Discord webhook.

### Verification
```bash
npm run eval:syria
cat eval/tcgc/syria/v0/results.csv
cat eval/tcgc/syria/v0/report.md
```

### Future scope (do not include in v0)
- TCGC for HR disputes (Alex-vs-Maya canonical case from the strategic memo).
- TCGC for M&A disputes.
- arXiv preprint write-up. (Strategic memo plan; not engineering.)

---

## Prompt A11 — `infra/audit-gate`

### Outcome
A single command — `npm run audit:gate` — runs every check that must pass before merging. Codex (and any future agent) can self-verify with one call.

### What it runs (in order, fail-fast)
1. `npx tsc --noEmit` (TS clean)
2. `npm run lint` (ESLint clean)
3. `cd backend && python -m pytest tests/ -q` (pytest clean)
4. `npx vitest run` (frontend unit + integration)
5. `npm run build` (Next.js production build)
6. `node scripts/audit-ai-routes.mjs` (every AI route uses `withCalibration` or is documented exempt)
7. `npm run audit:gcp` (GCP resources reachable)
8. `npm run verify-tools` (registry sanity, includes A1's "exactly 12 hero" check)
9. `rg "gemini-2\.0|gemini-2\.5|gemini-3-pro-preview" src/ backend/` returns zero matches (model-string discipline)
10. `npm run eval:syria` (TCGC-Syria thresholds met)

### Files to touch
- Modify: `package.json` — add `"audit:gate"` script that runs the chain via `npm-run-all` or shell.
- New: `scripts/audit-gate.sh` — shell driver that prints a summary table at the end.
- Modify: `AGENTS.md` — replace the existing "Validation" block with: *Run `npm run audit:gate` before any push or deploy. It runs the full chain. The individual commands listed below remain available for incremental iteration.*

### Definition of Done
1. `npm run audit:gate` completes successfully on a clean main branch.
2. The summary table at the end shows every check + duration + pass/fail.
3. Total runtime is < 12 minutes on a typical Cloud Build machine.

### Verification
```bash
npm run audit:gate
echo $?    # must be 0
```

---

## Prompt A12 — `cleanup/dead-code-and-drift`

### Outcome
Resolve three lingering forms of drift, document the new architecture in human-readable form, and update the changelog.

### Drift to resolve
1. **Provider model strings.** `src/lib/ai/providers.ts` currently hardcodes `gemini-2.5-flash` and `gemini-2.5-pro`. The auto-loaded `praxis-conventions` skill says these are *forbidden* and that the right helpers return `gemini-3-flash` and `gemini-3.1-pro-preview`. Update `providers.ts` to use 3-family strings; preserve the auto-fallback chain (3.1-pro → 3-flash → google-ai 3.1-pro → google-ai 3-flash). Update the comment block at the top of the file to match the helper return values.
2. **Dead service files.** Sweep `src/lib/services/` for files imported by zero call sites. The previous P2B pass deleted some; verify with `npx ts-prune` and remove anything still orphaned. Be conservative: if a file is imported only by tests, keep it.
3. **The 14-vs-8 primitives drift.** A2 already locked 8 primitives. Make sure `entity-extraction.ts`, `tool-registry.ts`, and the dialectica page no longer reference 14.

### Documentation to write
- New: `docs/PRAXIS_DIALECTICA_V1_ARCHITECTURE.md` — a single canonical doc (~12 pages) describing what we built in A1–A10. Replaces the older `PRAXIS_DIALECTICA_BACKBONE_ARCHITECTURE_2026-05-01.md` (mark that one as superseded with a header pointer).
- Modify: `README.md` — top of the "Architecture" section should mention the four stores (Facts, Provenance, Hypotheses, Scenario Forks), the three computed views (Episodic, Semantic, Stance), the five reasoning recipes, and the adapter boundary.
- Modify: `CLAUDE.md` — add a "DIALECTICA dyad" section pointing to the new architecture doc, and note the "8 primitives, no Datalog" decisions.
- Modify: `CHANGELOG.md` — write a substantive `[Unreleased]` entry covering A1–A10.

### Definition of Done
1. `rg "gemini-2\.0|gemini-2\.5|gemini-3-pro-preview" src/ backend/` returns zero matches.
2. `npx ts-prune` reports zero unused exports under `src/lib/services/`.
3. `rg "14 entity types|14-primitive|extended ACO" src/ backend/ docs/` either has zero matches or each match is in a doc explicitly marked as historical.
4. `docs/PRAXIS_DIALECTICA_V1_ARCHITECTURE.md` exists and reads cleanly to a non-Codex human reader.
5. `npm run audit:gate` passes.

### Verification
```bash
rg "gemini-2\.0|gemini-2\.5|gemini-3-pro-preview" src/ backend/
npx ts-prune | head -50
npm run audit:gate
```

---

## After this pack

The repo is now in a state where:
- 12 hero tools (consolidation done).
- One graph + three views + four stores (architecture done).
- Five named reasoning recipes, each backed by deterministic rules + LLM extraction (DIALECTICA done).
- Confidence and provenance on every node/edge/reasoning step (defensibility done).
- Adapter boundary in place; remote DIALECTICA service or defense-prime API can be plugged later (optionality done).
- Live Syria ingest + extraction + recipe payoffs against real OSINT sources (showcase done — proceed to companion pack 02 for UX).
- TCGC-Syria evaluation harness on CI (proof done).
- A single `npm run audit:gate` self-verifies the whole chain (workflow done).

**Companion pack 02 (`CODEX_PROMPTS_02_FRONTEND_SHOWCASE_AND_TESTING.md`)** turns this into the diplomat-and-analyst showcase walkthrough: the UX, the talk-track, the 8-minute live demo flow, and the persona testing harness.

---

## Appendix — Anti-pattern reminders for the agent

These are non-negotiable. Codex must refuse work orders that conflict with them.

- **Never hardcode `gemini-*` strings outside `src/lib/ai/providers.ts`.** Use `getModel()`, `getProModel()`, `callProModel()`, `getDeepThinkModel()`, `getAnalysisModel()`, `getEmbeddingModel()`, `getGroundedModel()`.
- **Never bypass `withCalibration` on AI routes** unless the route has a documented exemption registered in `scripts/audit-ai-routes.mjs`.
- **Never write to canonical graph without passing through the analyst-approval flow.** Hypotheses graph is the landing zone.
- **Never silently mix demo data into authenticated user state.** The Syria cached fallback must always be visibly labeled and gated by an explicit flag.
- **Never weaken Firestore rules to allow cross-user reads.** Provenance, hypotheses, and scenario-fork collections all owner-only.
- **Never ship without `npm run audit:gate` green.** If a check fails, fix it; don't disable it.
- **Never reach for Datalog or CozoDB.** Cypher in Python over NetworkX + small rule layer is the answer.

---

*End of Prompt Pack 01.*
