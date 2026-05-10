# PRAXIS Phase 2 — Agentic Spine

**Status:** Ships after Phase 1 is in production. Major behavioral upgrade. Surface UX changes are minimal — Phase 3 takes those.
**Constraints:** LangGraph + Cloud SQL Postgres is the single agent runtime. Vertex AI Gemini is the only AI provider. Neo4j Aura is the only graph index.
**Audience:** Codex (orchestrator + subagents).
**Deploys to:** `praxis.tacitus.me`

---

## 0. What Phase 2 ships

The brain. Six things become true:

1. **LangGraph is the primary agent runtime.** Five flows ship: document extraction, Boardroom deliberation, deep research, symbolic firewall verification, GDELT monitoring. All checkpointed to Cloud SQL Postgres.
2. **The symbolic firewall is enforced** on every streaming AI route. No claim reaches the user unless it is `GRAPH_GROUNDED` (Cypher MATCH against the situation graph) or `INFERRED` (with a source receipt). Unsupported claims are `REJECTED` and not rendered.
3. **DIALECTICA recipes are Cypher templates.** Five recipes (`leverage-trace`, `commitment-check`, `interest-vs-position`, `counter-narrative`, `path-search`), each one parametrized Cypher plus a thin Python wrapper. The NetworkX implementations are deleted.
4. **The context loader is the single entry point** for AI verb routes. It assembles AnalystProfile + Situation + Domain + Lens + pgvector retrieval (reranked by Vertex AI ranking API) + agent memory recall + Neo4j graph summary in one call.
5. **The 62 AI routes collapse to 20 verbs** with `lens` as a first-class axis. Legacy routes return 410 with `Sunset` headers.
6. **Trust Score (0–100)** is computed for every claim and persisted to `trust_scores` for historical replay.

User-visible improvements: better answers, faster context assembly, demonstrable provenance on every output.

---

## 1. Pre-flight (must be true before any subagent fans out)

- [ ] Phase 1 tag `phase-1-foundation-shipped` exists on `main`.
- [ ] `https://praxis.tacitus.me/api/health` returns 200.
- [ ] Cloud SQL Postgres has all Phase-1 schema applied (`alembic current` shows revision 0010).
- [ ] Neo4j Aura sync is running with zero drift (run `npx tsx scripts/verify-neo4j-sync.ts --production`).
- [ ] Branch `phase/2-agentic-spine` is created from `main` and pushed.
- [ ] Codex has read this file fully.

---

## 2. Reference material Codex must load

Read-only inspection before coding:

| File | Why |
|---|---|
| `docs/PRAXIS_TECHNICAL_SPECIFICATION.md` (spec v2) | The 20-verb grammar, calibration contract, anti-patterns |
| `docs/CONTEXT_INJECTION.md` | Every AI route's calibration block is canonical here |
| `src/lib/ai/providers.ts` | Single source of model strings. Read but do not modify in this phase. |
| `src/lib/ai/situation-context.ts`, `src/lib/ai/build-context-pure.ts` | Existing context assembly — to be replaced by the new loader |
| `backend/dialectica/recipes/*.py` | Existing NetworkX recipes — to be replaced |
| `backend/agents/langgraph/` | Phase-1 scaffolding for LangGraph + Postgres |
| `src/app/api/ai/*` | The 62 routes that collapse to 20 |
| `src/lib/ai/schemas/situation-intelligence.ts` | Reference for verb output schemas |

External docs (cite when relevant):

- LangGraph StateGraph patterns: <https://langchain-ai.github.io/langgraph/concepts/low_level/>
- LangGraph human-in-the-loop: <https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/>
- Vertex AI ranking API: <https://cloud.google.com/generative-ai-app-builder/docs/ranking>
- Vertex AI Gemini structured outputs: <https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output>
- Docling (PDF parsing): <https://github.com/DS4SD/docling>
- Neo4j Cypher MATCH performance: <https://neo4j.com/docs/cypher-manual/current/planning-and-tuning/>

---

## 3. Subagent lanes

```
                Lane Y — Backend wiring (LangGraph + pgvector glue)
                                │
   ┌─────────┬──────────┬───────┼────────┬──────────┬────────────┐
   A         B          C        D        E          F
   Extract   Boardroom  Deep     Firewall Cypher     Verb-grammar
   flow      flow       research flow     recipes    + Trust Score
                                │
            Lane G — Context loader + reranker + verb migration
                                │
            Lane H — Synthesis & verification
                                │
            Lane DEPLOY — Merge + Cloud Build
```

Lanes A–F run in parallel after Y. Lane G runs after F merges (it depends on the new verbs). Lane H is verification.

### Lane Y — Backend wiring

**Brief.** Wire LangGraph into the FastAPI backend. Build the shared `PostgresSaver` factory. Build the `pgvector` retrieval helper. Build the agent-memory helper. No flows in this lane — those are A–E.

**Files in scope:**
- `backend/agents/__init__.py`
- `backend/agents/registry.py` (new — registry of named graph builders)
- `backend/agents/checkpointer.py` (new — async PostgresSaver factory)
- `backend/services/pgvector.py` (new — async retrieval + write helpers)
- `backend/services/agent_memory.py` (new — recall, write, decay)
- `backend/services/rerank.py` (new — Vertex AI ranking API client)
- `backend/main.py` (extend lifespan: open shared checkpointer pool, register flows)
- `backend/agents/langsmith_config.py` (new — dev-only, no-op in prod)

**Files NOT to touch:** every flow file (those belong to A–E).

**Todo list:**

- [ ] Add `langgraph>=0.2`, `langgraph-checkpoint-postgres>=2.0`, `langchain-google-vertexai>=2.0` to `backend/pyproject.toml`.
- [ ] `backend/agents/checkpointer.py`:
  ```python
  from contextlib import asynccontextmanager
  from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
  from psycopg_pool import AsyncConnectionPool
  
  _pool: AsyncConnectionPool | None = None
  
  async def init_checkpointer(conn_str: str):
      global _pool
      _pool = AsyncConnectionPool(conn_str, kwargs={"prepare_threshold": 0})
      saver = AsyncPostgresSaver(_pool)
      await saver.setup()
      return saver
  
  async def close_checkpointer():
      if _pool: await _pool.close()
  ```
- [ ] `backend/services/pgvector.py`:
  - `async def write_chunk_embeddings(tenant_id, situation_id, doc_id, chunks)` — batch insert into `embeddings`.
  - `async def retrieve(tenant_id, situation_id, query, k, filters)` — HNSW similarity search with metadata filters.
  - Uses `gemini-embedding-2-preview` via `langchain-google-vertexai`.
- [ ] `backend/services/agent_memory.py`:
  - `async def recall(tenant_id, agent_kind, scope, scope_id, query, k)` — vector recall weighted by `importance`.
  - `async def remember(tenant_id, agent_kind, scope, scope_id, summary, payload, importance)` — write with embedding.
  - Daily decay job (separate Cloud Scheduler entry).
- [ ] `backend/services/rerank.py`:
  - `async def rerank(query, docs, top_k)` — calls Vertex AI ranking API; returns reordered docs.
- [ ] `backend/main.py` lifespan:
  ```python
  @asynccontextmanager
  async def lifespan(app):
      checkpointer = await init_checkpointer(settings.database_url)
      app.state.checkpointer = checkpointer
      app.state.flows = build_registry(checkpointer)
      yield
      await close_checkpointer()
  ```

**Acceptance:**
- [ ] Backend boots with `app.state.checkpointer` and `app.state.flows` populated.
- [ ] `pytest backend/tests/test_phase2_wiring.py -v` passes.

**Test to write** — `backend/tests/test_phase2_wiring.py`:

```python
import pytest
from agents.checkpointer import init_checkpointer
from services.pgvector import write_chunk_embeddings, retrieve
from services.agent_memory import remember, recall
from services.rerank import rerank

@pytest.mark.asyncio
async def test_checkpointer_initializes(test_pg_url):
    saver = await init_checkpointer(test_pg_url)
    assert saver is not None

@pytest.mark.asyncio
async def test_pgvector_roundtrip(seeded_embeddings):
    results = await retrieve(
        tenant_id="alice", situation_id="sit1",
        query="State A leverage", k=3, filters={}
    )
    assert len(results) <= 3
    assert all(r["similarity"] > 0 for r in results)

@pytest.mark.asyncio
async def test_agent_memory_recall_weighted_by_importance():
    await remember("alice", "boardroom_principal", "situation", "sit1",
                   "Past synthesis: De-escalation works", {}, importance=5)
    await remember("alice", "boardroom_principal", "situation", "sit1",
                   "Past synthesis: Sanctions escalate", {}, importance=1)
    results = await recall("alice", "boardroom_principal", "situation", "sit1",
                           "How do we de-escalate?", k=2)
    assert "De-escalation" in results[0]["summary"]
```

---

### Lane A — Document extraction LangGraph

**Brief.** Build the eight-node extraction flow from spec v2 §3.1. Use Docling for PDF parsing.

**Files in scope:**
- `backend/agents/extract/graph.py`
- `backend/agents/extract/state.py`
- `backend/agents/extract/nodes/{parse,chunk,extract_entities,fuzzy_match_actors,score_confidence,build_proposals,stage_to_firestore,notify_analyst}.py`
- `cloud_functions/on_document_uploaded/main.py` (modify — invoke this flow)
- `backend/agents/extract/tests/test_extract_graph.py` (new)

**Todo list:**

- [ ] Add `docling>=1.0` to `backend/pyproject.toml`.
- [ ] State TypedDict per spec v2 Context-Backbone §3.1.
- [ ] Eight nodes, each writing structured progress to `system_events`:
  - `parse` — Docling for PDF/DOCX, plain reader for `.txt`/`.md`.
  - `chunk` — semantic chunking ~500 tokens with 50-token overlap.
  - `extract_entities` — Gemini structured output → ACO entities.
  - `fuzzy_match_actors` — `pg_trgm` similarity ≥ 0.6 → suggest canonical match.
  - `score_confidence` — heuristic + Gemini self-rating averaged.
  - `build_proposals` — typed `GraphProposal[]` with provenance receipts.
  - `stage_to_firestore` — write to `users/{uid}/situations/{sit}/graph_updates/{id}`.
  - `notify_analyst` — write a notification doc; the analyst sees it on Desk.
- [ ] Compile with `checkpointer=app.state.checkpointer`.
- [ ] Cloud Function `on_document_uploaded` invokes `POST /api/v1/extract/run` on the backend with `{document_id, situation_id, tenant_id}`.

**Acceptance:**
- [ ] A 200-page PDF extraction completes within 10 minutes p95.
- [ ] Killing the Cloud Run instance mid-run and restarting resumes from the last checkpoint.
- [ ] Graph proposals appear in Firestore + analyst notified.
- [ ] `pytest backend/agents/extract/tests/test_extract_graph.py -v` passes, including a resume test.

**Test pattern to include:**

```python
@pytest.mark.asyncio
async def test_resume_from_checkpoint(test_db, sample_pdf):
    # Run partway then simulate crash
    state = {"document_id": "d1", "situation_id": "s1", "tenant_id": "alice", ...}
    config = {"configurable": {"thread_id": "test_run_1"}}
    # Crash after `extract_entities`
    await graph.ainvoke(state, config, interrupt_after=["extract_entities"])
    # Resume
    final = await graph.ainvoke(None, config)
    assert final["status"] == "completed"
    # Confirm extract_entities did not re-run
    assert final["entities_extraction_count"] == 1
```

---

### Lane B — Boardroom deliberation LangGraph

**Brief.** Five Gemini advisors at varying `thinking_level`, structured-turn schema, symbolic firewall verification, human-in-the-loop interrupt before final synthesis. Spec v2 Context-Backbone §3.2.

**Files in scope:**
- `backend/agents/boardroom/graph.py`
- `backend/agents/boardroom/state.py`
- `backend/agents/boardroom/advisors/{principal,skeptic,advocate,devils_advocate,legal}.py`
- `src/lib/ai/schemas/boardroom.ts` (Zod schema for the structured turn)
- `src/app/api/ai/boardroom/route.ts` (modify — calls backend)
- `backend/agents/boardroom/tests/test_boardroom_graph.py`

**Todo list:**

- [ ] Structured-turn schema:
  ```ts
  const AdvisorTurn = z.object({
    advisor: z.enum(['principal', 'skeptic', 'advocate', 'devils_advocate', 'legal']),
    position: z.string(),
    evidence_refs: z.array(z.object({
      type: z.enum(['graph_node', 'graph_path', 'source_receipt']),
      ref: z.string(),
      snippet: z.string().optional(),
    })).min(1),
    counter_points: z.array(z.string()).optional(),
    thinking_level: z.enum(['low', 'medium', 'high']),
  });
  ```
- [ ] Per advisor, a Gemini call constrained by:
  - System prompt with mandate.
  - Tools available: `read_graph(cypher_match)`, `fetch_source_receipt(id)`.
  - Output schema = `AdvisorTurn`.
  - Firewall middleware on every claim in `position` and `counter_points`.
- [ ] `interrupt_before("principal_close")` — lets the analyst inject a guidance note via `POST /api/v1/boardroom/{sessionId}/resume`.
- [ ] Final synthesis written to `users/{uid}/situations/{sit}/boardroom/{sessionId}` with `bootstrap_outline_for_draft` set.

**Acceptance:**
- [ ] A boardroom session produces synthesis with ≥1 graph-anchored claim per advisor.
- [ ] Replay `GET /api/v1/boardroom/{sessionId}/replay` returns turn-by-turn state from checkpoints.
- [ ] Resume after interrupt works.
- [ ] `pytest backend/agents/boardroom/tests/test_boardroom_graph.py -v` passes.

---

### Lane C — Deep research LangGraph

**Brief.** Plan → multi-step search (grounded Google Search + pgvector + Neo4j) → cross-reference against `agent_memory` → propose graph updates → summarize → persist memory. Spec v2 Context-Backbone §3.3.

**Files in scope:**
- `backend/agents/deep_research/graph.py`, `state.py`, `nodes/*.py`
- `src/app/api/ai/research/deep/route.ts` (modify)
- `backend/agents/deep_research/tests/test_deep_research_graph.py`

**Todo list:**

- [ ] Planner node decomposes the question into 3–7 search steps; `gemini-3.1-pro-preview` at `thinking_level='medium'`.
- [ ] Per search step: parallel-fan-out across grounded Google Search, `pgvector.retrieve(subject_type='doc_chunk')`, and Neo4j path search.
- [ ] Findings get source receipts with URL, retrieval timestamp, snippet hash.
- [ ] Cross-reference node compares against `recall(agent_kind='deep_research', scope='situation')`; flags contradictions.
- [ ] Persist summary to `agent_memory` with `importance` derived from research depth.
- [ ] Idempotency key `sha256(uid:situation:question:lens)` so re-issuing the same question short-circuits to the cached summary.

**Acceptance:**
- [ ] A research run completes within 15 minutes p95.
- [ ] Subsequent question with similar wording recalls the prior summary.
- [ ] `pytest backend/agents/deep_research/tests/test_deep_research_graph.py -v` passes.

---

### Lane D — Symbolic firewall LangGraph + streaming integration

**Brief.** Implement the firewall flow (spec v2 Context-Backbone §3.4) and wrap the four streaming AI verb routes (`brief`, `memo`, `talking-points`, `boardroom`) so every claim is verified inline.

**Files in scope:**
- `backend/agents/firewall/graph.py`, `state.py`
- `backend/agents/firewall/cypher_validator.py` (new — static analysis)
- `src/lib/ai/symbolic-firewall.ts` (new — frontend client + stream transform)
- The four streaming routes under `src/app/api/ai/`
- `backend/agents/firewall/tests/test_firewall.py`

**Todo list:**

- [ ] `derive_cypher` node: Gemini produces a parametrized read-only Cypher MATCH for the claim.
- [ ] `validate_cypher`:
  - AST parse via `cypher-shell --explain` or a Python Cypher parser.
  - Reject any token in `{DELETE, CREATE, MERGE, SET, REMOVE, DETACH, CALL apoc.period}`.
  - Reject any string literal that does not appear in the parameters object.
  - Inject `WHERE n.tenantId = $tenantId` into every MATCH if not present.
- [ ] `run_cypher`: open a read-only Neo4j session (`access_mode=READ`), execute, capture rows.
- [ ] `check_source_receipts`: pgvector recall on `subject_type='doc_chunk'` with similarity ≥ 0.7 to the claim.
- [ ] `score`: composite Trust Score:
  ```
  graph (50) = 50 if rows ≥ 1 else 0
  source (20) = 20 if max(receipt.recencyDays ≤ 30) else 10 if ≤ 365 else 5 else 0
  reliability (20) = mean(receipt.reliabilityScore) ∈ [0,20]
  consensus (10) = boardroom advisor agreement on the claim, default 0
  ```
- [ ] `decide`: status from rows + receipts.
- [ ] Stream transform in `symbolic-firewall.ts` annotates each claim inline with chips.

**Acceptance:**
- [ ] An adversarial test ("State A controls Mars") returns `REJECTED` and is not rendered.
- [ ] Cypher injection planted via prompt is blocked by `validate_cypher`.
- [ ] Trust Score appears in JSON-LD provenance manifest of every export.
- [ ] `pytest backend/agents/firewall/tests/test_firewall.py -v` passes including adversarial cases.

---

### Lane E — DIALECTICA recipes as Cypher templates

**Brief.** Replace `backend/dialectica/recipes/*.py` (NetworkX) with parametrized Cypher templates plus thin Python wrappers. Drop NetworkX from the recipe path.

**Files in scope:**
- `backend/dialectica/recipes/{leverage_trace,commitment_check,interest_vs_position,counter_narrative,path_search}.cypher` (new)
- `backend/dialectica/recipes/{leverage_trace,commitment_check,interest_vs_position,counter_narrative,path_search}.py` (rewrite as thin wrappers)
- `backend/dialectica/runner.py` (extend — load `.cypher` files at startup)
- `backend/routers/reason.py` (already exists, extend if needed)
- `src/app/api/ai/dialectica/route.ts` (new — single verb route, forwards to backend)
- `backend/dialectica/tests/test_recipes.py`

**Todo list:**

- [ ] Five `.cypher` files, parametrized, tenant-scoped. Examples in spec v2 §5.3.
- [ ] Python wrapper template:
  ```python
  from pathlib import Path
  TEMPLATE = (Path(__file__).parent / "leverage_trace.cypher").read_text()
  
  async def run(client: Neo4jClient, params: dict, tenant_id: str) -> dict:
      rows = await client.query(TEMPLATE, {**params, "tenantId": tenant_id}, tenant_id)
      return {"recipe": "leverage-trace", "rows": rows, "count": len(rows)}
  ```
- [ ] Drop `networkx` and `graspologic` from the recipe code path; keep them only if Phase-1 backfill scripts still need them, otherwise prune.
- [ ] Frontend route `/api/ai/dialectica`:
  ```ts
  POST /api/ai/dialectica
  { situationId, recipe: 'leverage-trace' | ..., params, lens }
  → forwards to backend POST /api/v1/reason/{recipe}
  ```
  Wrapped with `withAuth → withCredits → withCalibration → handler`.

**Acceptance:**
- [ ] Each recipe returns identical structure to its previous NetworkX implementation against fixture graphs.
- [ ] Recipe code shrinks ≥80% (line count comparison in PR description).
- [ ] `pytest backend/dialectica/tests/test_recipes.py -v` passes.

---

### Lane F — 20-verb grammar + Trust Score persistence

**Brief.** Migrate every `/api/ai/*` route to one of the 20 verbs (spec v2 §8). Legacy routes return 410 with `Sunset` and `Deprecation` headers. `lens` becomes a required body param. Trust Score persists to `trust_scores` Postgres table.

**Files in scope:**
- `src/app/api/ai/{verb}/route.ts` for each of the 20 verbs (new or rewrite)
- `src/lib/ai/executors/{verb}.ts` (new — handlers)
- `src/lib/api/with-calibration.ts` (extend — read `lens`, log on `tool_run`)
- Legacy routes: replace handler bodies with `return new Response(null, { status: 410, headers: { Sunset, Deprecation } })`.
- `docs/AI_VERB_MIGRATION.md` (new — mapping table from old to new)
- `backend/services/trust_scores.py` (new — write/read)

**Todo list:**

- [ ] Build the 20 verb routes from spec v2 §8.2. Each route delegates to `src/lib/ai/executors/{verb}.ts`.
- [ ] Map every legacy route to a verb in `AI_VERB_MIGRATION.md`. Drop unmapped legacy routes.
- [ ] `withCalibration` extension:
  ```ts
  const lens = body.lens ?? 'generic';
  ctx.calibration.lens = lens;
  await writeToolRun({ ..., lens });
  ```
- [ ] On every claim emitted by streaming verbs, persist Trust Score via `backend/services/trust_scores.py`.

**Acceptance:**
- [ ] Every legacy route either delegates to a verb or returns 410.
- [ ] Frontend hooks updated to call verbs (this is finished in Phase 3).
- [ ] `npm run audit:routes` scores every verb 11/11.
- [ ] `pytest backend/tests/test_trust_scores_persistence.py -v` passes.

---

### Lane G — Context loader + reranker (final integration step)

**Brief.** Build `src/lib/context/context-loader.ts` as the single entry point. Wire Vertex AI ranking API as the rerank pass. Migrate three high-traffic verbs (`brief`, `memo`, `dialectica`) to use it.

**Files in scope:**
- `src/lib/context/context-loader.ts` (new)
- `src/lib/context/pgvector-retrieve.ts` (new)
- `src/lib/context/agent-memory.ts` (new)
- `src/lib/context/rerank.ts` (new — calls backend reranker)
- The three migrated verb routes
- `src/lib/context/tests/context-loader.test.ts`

**Todo list:**

- [ ] Implement the loader per spec v2 Context-Backbone §8.
- [ ] All five sub-loaders run in parallel via `Promise.all`. Total p95 ≤ 800ms.
- [ ] Reranker improves recall@8 by ≥15% on a fixture set (record in PR).
- [ ] Three migrated verbs pass `npm run audit:routes` 11/11.

**Acceptance:**
- [ ] `vitest run src/lib/context/tests/` passes.
- [ ] Latency budget met on a 100-iteration smoke.

---

### Lane H — Synthesis & verification

**Brief.** No code changes unless something failed. Run the full verification suite.

```bash
# Type / lint / build
npx tsc --noEmit && npm run lint && npm run build

# Forbidden patterns (zero matches)
rg "MemorySaver|InMemorySaver" backend/agents/ --type py | grep -v tests/
rg "set_session_authorization|RESET ROLE|DISABLE ROW LEVEL" backend/

# Schema + migrations
cd backend && alembic upgrade head && alembic check

# Backend tests
cd backend && pytest tests/ agents/ dialectica/ -v

# Frontend tests
npx vitest run

# Audits
npm run audit:routes
npx tsx scripts/audit-spine.ts

# Adversarial firewall test
cd backend && pytest agents/firewall/tests/test_firewall.py::test_adversarial_claims -v

# Smoke
npm run smoke:public
```

All must pass.

---

## 4. Commit + deploy to `praxis.tacitus.me`

**Step 1 — Subagent merges into `phase/2-agentic-spine`:**

Conventional-commit scopes:

```
feat(backend):  Lane Y, A, B, C, D, E
feat(frontend): Lane F, G
test:           any new test files
docs:           AI_VERB_MIGRATION.md
```

**Step 2 — Phase synthesis:**

```bash
git checkout phase/2-agentic-spine
git pull
# Run Lane H verification — all green
git tag phase-2-agentic-spine-rc1
git push origin phase-2-agentic-spine-rc1
```

**Step 3 — Merge to main:**

```bash
# PR phase/2-agentic-spine → main with this file linked
git checkout main && git pull
git merge --no-ff phase/2-agentic-spine
git push origin main
```

**Step 4 — Cloud Build deploy (automatic on push to main):**

The pipeline:

1. Lint + typecheck + audit gates + build (Phase-1 gates apply).
2. Backend image built with new agent code + LangGraph deps → Artifact Registry → Cloud Run.
3. **Run agent-checkpointer setup** as a Cloud Run job before serving traffic:
   ```yaml
   - id: langgraph-setup
     name: gcr.io/cloud-builders/gcloud
     entrypoint: bash
     args:
       - '-c'
       - |
         gcloud run jobs execute praxis-langgraph-setup \
           --region us-central1 --wait --project praxisbytacitus
   ```
   This runs `python -c "from agents.checkpointer import init_checkpointer; ..."` against production Postgres so `checkpoints` table exists before traffic hits.
4. Frontend image built → Cloud Run.
5. Smoke against `https://praxis.tacitus.me/api/health` and `https://praxis.tacitus.me/api/ai/dialectica` (idempotency check).

**Step 5 — Post-deploy verification:**

```bash
# Health
curl -fsSL https://praxis.tacitus.me/api/health | jq .

# A real verb call (use a test account JWT)
curl -fsSL -X POST https://praxis.tacitus.me/api/ai/dialectica \
  -H "Authorization: Bearer $TEST_JWT" \
  -H "Content-Type: application/json" \
  -d '{"situationId":"test_situation","recipe":"path-search","lens":"generic","params":{"x":"n1","y":"n2"}}'

# LangGraph checkpoints table populated
gcloud sql connect praxis-pg --user=praxis_app --database=praxis -- \
  -c "SELECT count(*) FROM checkpoints;"

# Trust Score persisted
gcloud sql connect praxis-pg --user=praxis_app --database=praxis -- \
  -c "SELECT count(*) FROM trust_scores WHERE created_at > now() - interval '1 hour';"
```

**Roll back** if anything fails:

```bash
gcloud run services update-traffic praxis-frontend --to-revisions=PREVIOUS=100 --region us-central1
gcloud run services update-traffic praxis-backend --to-revisions=PREVIOUS=100 --region us-central1
```

---

## 5. Definition of done

- [ ] All seven lanes (Y + A–F + G) merged into `main`.
- [ ] Cloud Build green on the merge commit.
- [ ] `https://praxis.tacitus.me/api/ai/dialectica` returns 200 on a valid request.
- [ ] `npm run audit:routes` — every verb 11/11.
- [ ] Adversarial firewall test passes in production.
- [ ] LangGraph `checkpoints` table populated.
- [ ] Tag `phase-2-agentic-spine-shipped` pushed.

---

## 6. Codex orchestrator prompt (paste-ready)

```
You are the orchestrator for PRAXIS Phase 2 — Agentic Spine.
Read /docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md fully.

Pre-flight: confirm §1. If any item is false, stop and ask.

Order of execution:
  1. Lane Y (sequential).
  2. Lanes A, B, C, D, E, F in parallel.
  3. Lane G after F merges.
  4. Lane H verification.
  5. Merge to main + Cloud Build deploys to praxis.tacitus.me.

Hard rules (Phase-1 rules still apply, plus):
- Every LangGraph flow must use AsyncPostgresSaver. Never MemorySaver.
- Every Cypher query is read-only and tenant-scoped at the cypher_validator layer.
- Every claim emitted by streaming AI routes goes through the symbolic firewall.
- Every verb route uses withCalibration with lens as required body param.
- Every legacy AI route either delegates to a verb or returns 410.

Begin Lane Y. Report back when ready to fan out.
```

---

## 7. Subagent prompts (paste-ready)

### Lane Y
```
You are subagent Y. Lane Y — Backend wiring.
Read /docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md §3 Lane Y only.
Build the shared LangGraph checkpointer, pgvector helpers, agent_memory helpers,
and rerank client. No flows yet — those are A–E.
Verify: pytest backend/tests/test_phase2_wiring.py.
```

### Lane A — Document extraction
```
You are subagent A. Lane A — Document extraction LangGraph.
Read /docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md §3 Lane A only.
Eight nodes. Docling for PDF/DOCX. Resume-from-checkpoint test required.
Verify: pytest backend/agents/extract/tests/test_extract_graph.py.
```

### Lane B — Boardroom
```
You are subagent B. Lane B — Boardroom deliberation LangGraph.
Read /docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md §3 Lane B only.
Five advisors at varying thinking_level. Structured-turn schema. interrupt_before
on principal_close. Symbolic firewall on every claim.
Verify: pytest backend/agents/boardroom/tests/test_boardroom_graph.py.
```

### Lane C — Deep research
```
You are subagent C. Lane C — Deep research LangGraph.
Read /docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md §3 Lane C only.
Planner + parallel search (Google Search + pgvector + Neo4j) + cross-ref against
agent_memory + persist summary to agent_memory.
Verify: pytest backend/agents/deep_research/tests/test_deep_research_graph.py.
```

### Lane D — Symbolic firewall
```
You are subagent D. Lane D — Symbolic firewall LangGraph + stream wrap.
Read /docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md §3 Lane D only.
Read-only Cypher only. Static analyzer rejects DELETE/CREATE/MERGE/SET/REMOVE.
Trust Score per the formula in §3 Lane D.
Verify: pytest backend/agents/firewall/tests/test_firewall.py including
test_adversarial_claims.
```

### Lane E — DIALECTICA recipes
```
You are subagent E. Lane E — DIALECTICA recipes as Cypher.
Read /docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md §3 Lane E only.
Five .cypher files. Python wrappers ≤30 lines each. Drop NetworkX from
the recipe code path.
Verify: pytest backend/dialectica/tests/test_recipes.py.
```

### Lane F — Verb grammar + Trust Score
```
You are subagent F. Lane F — 20-verb grammar.
Read /docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md §3 Lane F only and
spec v2 §8.
Every legacy route either delegates or returns 410. lens is required.
audit:routes must score every verb 11/11.
Document the migration in docs/AI_VERB_MIGRATION.md.
```

### Lane G — Context loader
```
You are subagent G. Lane G — Context loader + reranker.
Read /docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md §3 Lane G only.
Run after Lane F merges.
Single Promise.all to assemble context. p95 ≤ 800ms. Migrate brief, memo,
dialectica to use it.
Verify: vitest run src/lib/context/tests/.
```

Phase 3 begins after this phase's deploy is verified green.
