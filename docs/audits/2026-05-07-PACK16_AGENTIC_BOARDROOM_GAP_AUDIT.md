# Pack 16 Agentic Boardroom Gap Audit

Date: 2026-05-07
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Source prompt: `C:\Users\giuli\Downloads\PRAXIS_CODEX_16_AGENTIC_BOARDROOM.md`

## Summary

Pack 16 has a strong local foundation: schemas, canonical personas, deterministic deliberation, workbench pages, lifecycle APIs, SSE fallback, export, review-queue promotion, custom-persona UI, ADRs, and audits are present. It is **not yet production-grade Pack 16 complete** under the source prompt. The missing work is concentrated in live Agent Engine orchestration, real persona corpus infrastructure, richer eval/cost evidence, and one broken routed synthesis e2e path.

## Verification Run

| Check | Result | Evidence |
|---|---|---|
| `npm run audit:boardroom` | PASS | 10 personas, deterministic sample, lifecycle/API/UI files present. |
| `npm run audit:persona-corpora-fresh` | PASS | Manifest-level version/citation/namespace audit passes. |
| Boardroom Vitest target | PASS | 4 files, 6 tests passed. |
| Backend Pack 16 pytest target | PASS | 7 tests passed. |
| Playwright Pack 16 e2e on dev server | PASS | `boardroom-flow`, `boardroom-abort-and-cost-guard`, and `custom-persona-creation` all pass after adding an explicit deliberation segment layout and dynamic route flags. |
| Playwright Pack 16 e2e on local `next start` HTTP | DEGRADED/HARNESS | Direct API calls return 401 because production-mode session cookies are `secure` and local HTTP does not retain them. Use dev server, HTTPS, or a signed-cookie test helper for local production e2e. |

## Missing Against Pack 16

| ID | Severity | Area | Missing / weak item | Evidence | Recommended next action |
|---|---:|---|---|---|---|
| P16-01 | RESOLVED | Synthesis route | Boardroom synthesis page exists and the e2e flow now reaches it. | `tests/e2e/workbench/boardroom-flow.spec.ts` passes on local dev server after adding `src/app/app/workbench/[caseId]/boardroom/[deliberationId]/layout.tsx` and dynamic flags. | Keep covered by Pack 16 e2e. |
| P16-02 | S1 | Agent Engine | `analyst_persona` and `moderator` are scaffolds, not deployed managed Vertex AI Agent Engine runtimes. | `backend/agents/analyst_persona/runner.py` says live Agent Engine execution is a follow-up; `backend/agents/*/graph.py` reports `foundation-scaffold`. | Add Agent Engine deployment wiring, staging smoke, Cloud Trace evidence, and `audit:subagent-deployment-fresh` coverage for both. |
| P16-03 | S1 | Persona corpus | Real pgvector/Vector Search persona corpus storage is not implemented. | `backend/personas/canonical/`, `0005_persona_corpus_chunks.py`, `scripts/ingest-persona-corpus.sh`, and `scripts/refresh-all-canonical-corpora.sh` are absent; `retriever.py` is deterministic fallback. | Add corpus tables/migration, canonical manifests on disk, ingestion scripts, chunk/embed pipeline, and retrieval relevance tests. |
| P16-04 | S1 | Custom corpus upload | Custom persona authoring captures corpus manifest entries but does not upload/chunk/index binary corpora. | `CorpusUploader`/API support manifest metadata; no workspace bucket upload/index path exists for 50MB corpora. | Implement upload, citation/license capture, storage path, chunking, embeddings, namespace isolation, and delete/update lifecycle. |
| P16-05 | S2 | Eval depth | Eval coverage is smoke-level, not Pack 16's 8-12 cases per persona plus character-conformity rubric. | `backend/agents/analyst_persona/eval/` has only `run_eval.py`; no `eval/personas/<id>/cases.json` tree or `character_conformity_rubric.py`. | Add per-persona eval sets, rubric, CI freshness audit, and pass-rate ledger. |
| P16-06 | S2 | Moderator eval depth | Moderator eval is smoke-level, not the 12-case orchestration eval required by the prompt. | `backend/agents/moderator/eval/run_eval.py` checks cost and turns only. | Add 12 orchestration cases covering 5/7 persona rooms, strong dissent, early close, and cost guard. |
| P16-07 | S2 | Tool invocation | Tool-use indicators exist visually, but persona tool invocation during deliberation is deterministic/static rather than live marketplace execution that informs later turns. | Boardroom runner builds deterministic contributions; no live marketplace tool invocation path inside `analyst_persona`. | Wire a tool-call adapter with cost guard, inline result cards, and tests for 3 personas. |
| P16-08 | S2 | Cost telemetry | Cost ceiling is estimated locally but not provider-backed P95 cost telemetry from 50 staging deliberations. | `estimatedUsd` is deterministic; no token/cost audit collection evidence for boardroom runs. | Persist per-deliberation token/cost metrics and add cost-dashboard panel evidence. |
| P16-09 | S2 | Trace/observability | Cloud Trace child span proof for moderator → analyst_persona invocations is missing. | No live Agent Engine deployment or trace sampler for Pack 16 subagents. | Add tracing in runtime and audit latest staging invocations. |
| P16-10 | S2 | Final Pack 16 gate | Prompt references `audit:subagent-deployment-fresh` and `audit:subagent-eval-fresh`, but package scripts do not include Pack 16-specific deployment/eval freshness gates. | `package.json` has `audit:persona-corpora-fresh` and `audit:boardroom`, not these final gates. | Add freshness scripts once live Agent Engine/eval artifacts exist. |

## What Is Solid

- Ten canonical persona specs are present and schema-valid.
- Boardroom types have Zod and Pydantic mirrors.
- Workbench boardroom index/new/live/synthesis source files exist.
- Lifecycle APIs exist for create/list/detail/start/abort/stream/export/promote.
- Synthesis claims are deterministic, cited, synthesized, and capped at confidence <= 0.6.
- Review-queue promotion is gated and demo-safe.
- ADRs 0026, 0027, and 0028 are present.

## Next Implementation Order

1. Add a local-production e2e auth helper or HTTPS test profile so secure-cookie behavior does not hide boardroom regressions.
2. Replace persona corpus fallback with real pgvector-backed canonical corpus ingestion.
3. Add per-persona eval sets and moderator orchestration evals.
4. Deploy `analyst_persona` and `moderator` to Vertex AI Agent Engine and add trace/cost evidence.
5. Wire live persona tool invocation inside deliberations.
