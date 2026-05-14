# PRAXIS — Genkit + Neo4j Integration Plan

**Date:** 2026-05-14
**Status:** Design doc — not yet approved for execution
**Owner:** Giulio Catanzariti
**Scope:** Adopt Google Genkit as the AI orchestration layer for PRAXIS and wire Neo4j (via `genkitx-neo4j`) as the hot GraphRAG index over the canonical Firestore graph.

---

## Source Material

- https://neo4j.com/blog/genai/integrating-neo4j-with-google-genkit-a-practical-guide/
- https://github.com/neo4j-labs/genkitx-neo4j (v0.5.17, Apr 2025)
- https://genkit.dev/docs/js/get-started/
- https://github.com/genkit-ai/genkit (v1.34, May 2026)

## Read-out

**Genkit** (v1.34, May 2026): production framework. JS/TS prod-ready, Python beta, Go prod-ready. Pattern: `ai.defineFlow(zodSchema → zodSchema)` + plugins. Dev UI at `:4000`. Deploys to Cloud Run / Cloud Functions. Built-in tracing, evals, structured output, tool calling, RAG.

**genkitx-neo4j** (v0.5.17, Apr 2025): Neo4j Labs plugin. Surface = `neo4j([{indexId, embedder}])` plugin + `neo4jIndexerRef`/`neo4jRetrieverRef`. Supports vector indexes, hybrid search (vector + full-text), metadata filters, custom Cypher, parent-child chunking, HyDE, `Neo4jSessionStore` for chat memory. Maps to existing schemas via `label/textProperty/embeddingProperty/idProperty` — no rigid schema lock-in.

**Neo4j blog pattern**: GraphRAG = embed → MERGE into Neo4j nodes with vector property → retrieve via vector sim + optional Cypher multi-hop traversal → feed Gemini.

**Current PRAXIS state**:
- Backend (`backend/ai/genkit_app.py`, `flows.py`): Python Genkit beta wired with Google GenAI. Flows: `extract_aco_entities`, `situation_brief`. Falls back to raw `google-genai` if Genkit unavailable.
- Frontend: zero Genkit. Uses AI SDK v6 (`@ai-sdk/google`, `@ai-sdk/anthropic`) inside 73 API routes wrapped by `withCalibration`.
- Neo4j: optional derived index per `CLAUDE.md`. Firestore canonical. SKC vector layer uses Firestore native KNN (768-dim, COSINE).

**Strategic opening**: replace ad-hoc AI SDK glue with Genkit flows on the JS side, adopt `genkitx-neo4j` as the SKC graph retriever, keep Firestore canonical, treat Neo4j as the hot GraphRAG index Genkit reads/writes through.

---

## Plan — 12 phases, ordered for safe rollout

### Phase 0 — Decision gates (1 day)
- Lock Genkit as the AI orchestration layer for **new** AI routes. Existing AI SDK v6 routes coexist; no big-bang rewrite.
- Lock Neo4j as **mandatory** for GraphRAG retrieval going forward. Firestore stays canonical for writes; Neo4j gets the projection.
- Embedder = `textEmbedding004` via Vertex/Google GenAI (768-dim — already aligned with SKC vector layer).
- Trace export = Cloud Trace (Genkit native).

### Phase 1 — Install + dev UI (1 day)
```bash
npm i genkit @genkit-ai/google-genai genkit-cli@dev genkitx-neo4j zod
```
- `src/lib/genkit/index.ts` exports a singleton `ai = genkit({ plugins: [googleAI(), neo4j([...])] })`.
- Add `npm run genkit:dev` → `genkit start -- tsx src/lib/genkit/dev-runner.ts`.
- Cloud Build: skip dev UI; production routes import `ai` directly.

### Phase 2 — Neo4j schema for GraphRAG (2 days)
Map existing ACO ontology (14 entity types, 72 rels) to Neo4j labels matching `genkitx-neo4j` config. New vector indexes per situation-scoped namespace:

```cypher
CREATE VECTOR INDEX praxis_actor_vec FOR (n:Actor) ON n.embedding
  OPTIONS { indexConfig: { `vector.dimensions`: 768, `vector.similarity_function`: 'cosine' }};
CREATE VECTOR INDEX praxis_claim_vec FOR (n:Claim) ON n.embedding ...;
-- + Event, Source, MemoChunk, SourceChunk, etc.
```
- One `indexId` per ACO type (`actor-vec`, `claim-vec`, `event-vec`, `source-chunk-vec`, `memo-chunk-vec`).
- `idProperty` = `praxis_id` (mirrors Firestore doc id for round-trip).
- Migration script `scripts/seed-neo4j-vector-indexes.ts`, idempotent.

### Phase 3 — Firestore → Neo4j projector (3 days)
- `backend/services/neo4j_projector.py` (Python, Pub/Sub triggered): on situation graph save, project nodes + edges to Neo4j, compute embeddings, MERGE into vector indexes.
- Triggered by existing `on_situation_created` + new Firestore listener on `situations/{id}/graph/main`.
- Idempotent via `praxis_id` + version field. Tombstones honored.
- Audit gate: `npm run audit:neo4j-projection` confirms node counts match Firestore.

### Phase 4 — Genkit flows for the 6 hottest AI routes (5 days)

| Route | New Genkit flow | Schema |
|---|---|---|
| `/api/ai/situation-intelligence` | `situationIntelligenceFlow` | existing Zod schema |
| `/api/ai/ask-praxis` | `askPraxisFlow` | streams steps |
| `/api/ai/situation-brief` | `situationBriefFlow` | brief schema |
| `/api/ai/actor-map` | `actorMapFlow` | ACO actor graph |
| `/api/ai/scenario-tree` | `scenarioTreeFlow` | scenarios array |
| `/api/ai/escalation-monitor` | `escalationFlow` | Glasl stage + signals |

Pattern:
```ts
export const situationIntelligenceFlow = ai.defineFlow(
  { name: 'situationIntelligence', inputSchema, outputSchema },
  async (input) => {
    const ctx = await buildCalibratedContext({ ... });
    const retrieved = await ai.retrieve({
      retriever: neo4jRetrieverRef({ indexId: 'claim-vec' }),
      query: input.question,
      options: { k: 12, situationId: input.situationId },
    });
    const { output } = await ai.generate({
      model: gemini25Pro,
      system: ctx.systemPromptBlock,
      prompt: renderPrompt({ retrieved, input }),
      output: { schema: outputSchema },
    });
    return output!;
  }
);
```
Routes shrink to: `withCalibration(toolId)(async (ctx, req) => flow.run(input))`.

### Phase 5 — Ask PRAXIS as a multi-step Genkit flow (4 days)
Highest leverage. Replace `src/lib/ai/ask-praxis.ts` orchestrator with one Genkit flow that:
1. Retrieves from `claim-vec` + `actor-vec` + `event-vec` (parallel).
2. Optional Cypher multi-hop driven by path's `frameworkPath` (e.g., conflict-path → `MATCH (a:Actor)-[:OPPOSES*1..2]-(b:Actor)`).
3. Streams reasoning steps per framework using `ai.generateStream`.
4. Tool calls into existing PRAXIS tools as Genkit tools (`ai.defineTool`).
5. Persists tool receipts + `Neo4jSessionStore`-backed chat memory per `{uid, sitId}`.

### Phase 6 — Sources + memos indexed in Neo4j (3 days)
- Source upload → chunk → embed → MERGE `(:SourceChunk { praxis_id, text, embedding, sourceId, situationId })` with `[:FROM]→(:Source)`.
- Memo save → same for `(:MemoChunk)` linked to `(:Memo)`.
- @source picker + Gap Filler use `neo4jRetrieverRef({ indexId: 'source-chunk-vec' })` with situation filter.
- Slash command `/grounded` becomes a Genkit flow: retrieve top-k chunks → generate paragraph → return with receipt refs.

### Phase 7 — Calibration × Genkit (2 days)
- `buildCalibratedContext` returns a `GenkitPromptBlock { system, retrieverHints, toolWhitelist }`.
- `enrichCalibrationWithToolBackbone` injects path-aware retriever hints (which indexIds, which Cypher template).
- New: `appendNeo4jProvenance(output)` reads Neo4j node ids from retrieved docs, attaches `<source-ledger>` to output for the receipt system.

### Phase 8 — Tool-calling: PRAXIS tools as Genkit tools (3 days)
Wrap tool registry surfaces (escalation-monitor, actor-map, scenario-tree, leverage-map, etc.) as `ai.defineTool`:
```ts
export const escalationTool = ai.defineTool(
  { name: 'escalation_monitor', inputSchema, outputSchema, description: '...' },
  async (input) => escalationFlow(input)
);
```
Path Core's `toolBundle[]` filters which tools each flow can call.

### Phase 9 — Dev UI + traces wired into staging (2 days)
- Dev: `genkit start` shows every flow, retrieves, traces locally.
- Staging: enable Cloud Trace export. Add `/admin/genkit-traces` page listing recent flow runs with token cost, latency, retrieval recall.
- Replace ad-hoc `tool_runs` lifecycle entries with Genkit's native trace ids; cross-link.

### Phase 10 — Evals + golden tests (3 days)
- `genkit eval` on a golden dataset per path (10–20 questions each path).
- Score: faithfulness (vs retrieved Neo4j chunks), answer relevance, schema validity.
- Wire into CI as `npm run eval:genkit`; threshold gates promote a deploy.

### Phase 11 — Neo4jSessionStore for Ask PRAXIS memory (2 days)
- Replace Firestore-only chat persistence with `Neo4jSessionStore` for hot context.
- Graph-backed: each turn = `(:AskTurn)-[:USED]→(:Claim|:Actor|:Source)`; enables "which claims has this user touched in this thread" queries.
- Firestore still owns the durable transcript record; Neo4j is the queryable session graph.

### Phase 12 — Decommission AI SDK v6 for migrated routes (rolling)
- One PR per migrated route to remove `@ai-sdk/*` import + collapse to `flow.run`.
- Keep AI SDK v6 only for streaming chat UI helpers (`useChat`) until Genkit has equivalent React hook coverage; stream via Genkit + AI SDK adapter (`ai.generateStream` → SSE).

---

## Architecture target

```
┌─────────────────────────────────────────────────────────────┐
│ Next.js API route (withCalibration)                         │
│    → Genkit flow (ai.defineFlow)                            │
│         ├─ ai.retrieve (neo4jRetrieverRef × N indexes)      │
│         ├─ Cypher multi-hop (path's frameworkPath)          │
│         ├─ ai.generate({ model: gemini-2.5-pro, schema })   │
│         ├─ ai.defineTool calls (escalation, actor-map, …)   │
│         └─ Neo4jSessionStore (Ask PRAXIS memory)            │
├─────────────────────────────────────────────────────────────┤
│ Firestore (canonical writes) → projector → Neo4j (hot RAG)  │
│ Vertex AI Gemini 2.5 + textEmbedding004                     │
│ Cloud Trace ← Genkit traces                                  │
└─────────────────────────────────────────────────────────────┘
```

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Genkit JS still moving (v1.34) | Pin minor; weekly bump |
| genkitx-neo4j only 5 stars, 15 open issues | Vendor critical paths; submit PRs upstream; fork if needed |
| Neo4j becomes hard dependency | Keep Firestore-only fallback path in `with-calibration`; flag `PRAXIS_GRAPH_BACKEND=neo4j\|firestore` |
| Dual SDKs (AI SDK v6 + Genkit) confusing | Style guide: Genkit for server flows, AI SDK only for `useChat` UI helper |
| Cost: dual storage Firestore + Neo4j | Project only graph data needed for retrieval; chunks have TTL |
| Migration drift | Phase-by-phase route migration; audit gate `audit:genkit-coverage` lists routes still on AI SDK |

## Validation gates (add to existing audit suite)

- `audit:neo4j-projection` — Firestore↔Neo4j node count parity
- `audit:embedding-dim` — already exists; extend to Neo4j indexes
- `audit:genkit-coverage` — % of AI routes migrated
- `audit:genkit-flow-schemas` — Zod schemas exported per flow
- `eval:genkit` — golden dataset score per path

## Effort estimate

~30 dev-days end-to-end. Phases 0–4 unlock most value (~13 days). Phases 5–7 are the differentiator (Ask PRAXIS + path-aware GraphRAG + sources). Phases 8–12 are polish + decommission.

## Suggested split

- **Codex**: Phases 2, 3, 4 (schema, projector, route migrations), 8 (tools), 10 (evals), 12 (decom).
- **Claude Code**: Phases 1 (install/wiring), 5 (Ask PRAXIS flow + streaming UX), 6 (sources/memos pickup in UI), 7 (calibration glue), 9 (admin traces page), 11 (session store wiring).
