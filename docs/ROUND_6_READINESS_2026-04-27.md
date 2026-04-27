# PRAXIS Round 6 Readiness

> Date: 2026-04-27
> Workspace: `C:\Users\giuli\praxiscodexworking`
> Source docs consolidated: `PRAXIS_DEEP_RESEARCH_MEMO_2026-04-26.md`,
> `CODEX_HANDOFF_2026-04-27.md`, `CONTINUATION.md`, and the round-5
> roadmap docs.

This is the short operational version of what the next agent should do.
Keep the long research memo as reference, but start here when choosing work.

## Current Baseline

- Fresh clone from `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work`.
- Dependencies installed with `npm install`.
- `npm install` completed, but reported 22 vulnerabilities
  (2 low, 17 moderate, 3 high). Do not run `npm audit fix --force`
  without a targeted dependency review.
- Active handoff: `docs/CODEX_HANDOFF_2026-04-27.md`.
- Canonical architecture docs remain:
  - `docs/CONTEXT_INJECTION.md`
  - `docs/OPERATIONAL_SPINE.md`
  - `docs/CORPUS_ARCHITECTURE.md`
  - `docs/AGENTIC_SYSTEM.md`

## What The Deep Research Memo Changes

The memo's highest-leverage recommendation is correct: the next big PRAXIS
upgrade is not more tool pages. It is durable, auditable agent execution.

Priority order:

1. Structured backend extraction: replace raw JSON parsing in
   `backend/graphify_tacitus/extract.py` with schema-enforced output.
2. Document AI ingestion for scanned PDFs and layout-aware chunks.
3. LangGraph-backed durable agent runtime for multi-step workflows.
4. Evaluation harness for extraction, retrieval, and prompt regressions.
5. Sigma.js / Graphology graph canvas for large conflict graphs.

## LangGraph Readiness

LangGraph fits PRAXIS because the product needs exactly the things it is
designed around: stateful graph execution, checkpointing, human review,
resume, time travel/debugging, and long-running multi-agent workflows.

Verified package availability on 2026-04-27:

- Python: `langgraph` latest on PyPI is `1.1.9`.
- JavaScript: `@langchain/langgraph` latest on npm is `1.2.9`.

Official docs checked:

- Python persistence:
  `https://docs.langchain.com/oss/python/langgraph/persistence`
- JavaScript persistence:
  `https://docs.langchain.com/oss/javascript/langgraph/persistence`
- Human-in-the-loop:
  `https://docs.langchain.com/oss/python/langchain/human-in-the-loop`

Important implementation detail: production human-in-the-loop requires a
persistent checkpointer. The official docs recommend persistent savers such
as Postgres for production; in-memory checkpointing is only for prototypes.

Recommended PRAXIS direction:

- Use Python LangGraph in a new backend/agent runtime, not the Next.js API
  layer, because PRAXIS agents need Cloud Run/worker durability and Pydantic
  schemas close to the existing FastAPI pipeline.
- Keep the existing synchronous Next.js AI routes while migrating one workflow
  at a time.
- First LangGraph candidate: Brainstorming Table, because it already has
  persona rows, synthesis, provenance, and a natural pause/edit/resume shape.
- Do not let LangGraph agents mutate canonical graph state directly. They
  should write proposals to `graph_updates` / approval queues first.

## Storage Decision Needed For LangGraph

Choose one before implementation:

1. **Postgres checkpointer via Cloud SQL / AlloyDB**
   - Most aligned with current official production guidance.
   - Adds a new GCP database service and operational surface.
   - Best if many long-running concurrent agent sessions are expected soon.

2. **Firestore custom checkpointer**
   - Keeps PRAXIS on the existing Firestore-first architecture.
   - Requires implementing and testing LangGraph's checkpointer interface.
   - Best if avoiding a new database is more important than using a
     battle-tested saver immediately.

Default recommendation: start with Postgres checkpointer for production
durability unless Giulio wants to keep the stack Firestore-only.

## What I Need From Giulio

Before a full LangGraph implementation:

1. Approve the checkpoint storage choice: Cloud SQL/AlloyDB Postgres or a
   custom Firestore checkpointer.
2. Confirm whether adding a new `praxis-agents` Cloud Run service is acceptable
   now, or whether the first graph should run inside the existing backend.
3. Confirm the first workflow to migrate. Recommended: Brainstorming Table.
4. Confirm whether the eval harness should live at repo root `evals/` or under
   `backend/evals/`.
5. Confirm whether Document AI budget is approved for scanned PDFs.

## Clean Next Implementation Lane

If no further answer is available, do this:

1. Implement structured extraction first.
2. Add tests around invalid/malformed model output.
3. Document the LangGraph storage decision as pending.
4. Leave Brainstorming Table synchronous until durable checkpointing is chosen.

That keeps the repo improving without committing to a partially durable agent
runtime.
