# PRAXIS Phase 1 Topic D - Symbolic Firewall Self-Audit

Date: 2026-05-06
Worktree: `C:\Users\giuli\praxis-audit-symbolic-firewall`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Scope: audit only. No app fixes, no push, no deploy.

## Scope Boundary

Owner write scope was limited to:

- `docs/audits/2026-05-06-symbolic-firewall.json`
- `docs/audits/2026-05-06-symbolic-firewall.md`

Synthetic write tests are marked `BLOCKED/static-only`. There was no emulator or isolated fixture in scope, and exercising graph or Firestore writes could mutate shared state.

## Source Documents

- `docs/architecture/PRAXIS_ARCHITECTURE.md` section 6 and related invariants.
- `docs/codex-prompts/PRAXIS_CODEX_05_CONTEXT_VS_TOOLS_SEPARATION.md`
- `docs/codex-prompts/PRAXIS_CODEX_06_ONTOLOGY_SYSTEM.md`
- `docs/codex-prompts/PRAXIS_CODEX_12_CONTEXT_ARCHITECTURE.md`
- `docs/codex-prompts/PRAXIS_CODEX_13_TOOL_CONTEXT_INTEROP.md`
- `docs/audits/2026-05-06-COMPREHENSIVE.md`

## Validation Run

| Command | Status | Notes |
| --- | --- | --- |
| `npm run audit:firewall-coverage` | ENV_FAIL | This sibling worktree has no `node_modules`; `tsx` was not on PATH. |
| `C:\Users\giuli\praxiscodexworking\node_modules\.bin\tsx.cmd scripts/audit-firewall-coverage.ts` | PASS | `Firewall coverage audit passed.` |
| `C:\Users\giuli\praxiscodexworking\node_modules\.bin\tsx.cmd scripts/audit-context-vs-tools.ts` | PASS | `audit-context-vs-tools: ok` |
| `C:\Users\giuli\praxiscodexworking\node_modules\.bin\tsx.cmd scripts/audit-context-aware-coverage.ts` | PASS | `Context-aware coverage audit passed.` |
| `pytest backend\agents\firewall\tests\test_firewall.py -v` | ENV_FAIL | Initial path/import shape was wrong for backend pytest. |
| `PYTHONPATH=. pytest agents\firewall\tests\test_firewall.py -v` | PASS | 4 passed: graph-grounded, source-receipt inferred, unsupported rejected, Cypher injection blocked. |
| sibling `vitest.cmd run tests/unit/lib/api/with-firewall.test.ts tests/unit/lib/api/with-calibration.test.ts` | BLOCKED_ENV | `vitest/config` could not resolve without local `node_modules`; no install performed. |

## Per-Rule Status

| Rule | Status | Evidence | Finding |
| --- | --- | --- | --- |
| D-SF-01 Architecture bible section 6 is explicit | PASS | `docs/architecture/PRAXIS_ARCHITECTURE.md:215`, `:223`, `:225-263` | The three-tier target is clear. |
| D-SF-02 Hard-tier violations reject | PARTIAL_FAIL | `backend/agents/firewall/graph.py:43-96`; `backend/agents/firewall/tests/test_firewall.py:41-50`; `src/lib/api/with-firewall.ts:171-212` | Python claim verifier rejects unsupported claims. The shared Next firewall warns but does not reject, and documented structural validators are absent. |
| D-SF-03 Soft-tier advisories are nonblocking | PASS | `src/lib/context/context-aware.ts:49-55`, `:163-177`; `src/lib/api/with-calibration.ts:163-174`, `:228-236`; context audits passed | Low context health and similar soft-tier issues are attached as advisories/headers and do not block handler execution. |
| D-SF-04 Synthesized labels/caps/provenance | PARTIAL_STATIC_ONLY | `src/types/context.ts:144-150`; `src/lib/tools/context-provider.ts:34-43`; `skills/subagents/context-preparer/SKILL.md:9-10`, `:27-28` | Types and skill docs carry the contract, but runtime output schemas and `backend/firewall/synthesis_gate.py` were not found. |
| D-SF-05 Review queue for synthesized structural changes | FAIL | Architecture expects `users/{uid}/situations/{caseId}/review-queue/`; `src/lib/services/graph-populate.ts:272-281`, `:304-329` only implements graph staging/approval | `graph/staged` is review-like, but not the specified review queue and not firewall-mediated promotion. |
| D-SF-06 Every graph write path goes through firewall | FAIL_STATIC_ONLY | `scripts/audit-firewall-coverage.ts:9-18`; `src/lib/services/graph-populate.ts:84-95`, `:272-281`, `:325-329`; `backend/routers/pipeline.py:151-164`, `:233-235`; `backend/services/neo4j_client.py:25-42`, `:103-140` | Marker audits pass, but multiple graph mutation paths do not call a structural firewall. |
| D-SF-07 Streaming/generated claims are covered | PARTIAL | `src/lib/api/with-firewall.ts:110-115`, `:148-155`; stream routes exist under `src/app/api/ai/*` | Streaming responses get a route boundary/header posture, but no token-level claim annotation or inline rejection was found. |
| D-SF-08 Read-only graph query rejects write tokens | PASS | `src/lib/graph/cypher.ts:6-21`; `src/app/api/graph/cypher/route.ts:5-24`; backend firewall tests pass | Read-only Cypher posture is deterministic and tested. |

## Findings

### SF-HIGH-001 - Hard-tier structural firewall is not universal

The backend `verify_claim` flow can return `REJECTED`, and the backend tests prove the unsupported-claim path. That does not satisfy the architecture bible's broader hard-tier requirement. The documented files `src/lib/firewall/structural.ts`, `backend/firewall/structural.py`, `backend/firewall/synthesis_gate.py`, and backend ontology validators were not found, and direct graph write paths do not invoke a structural firewall.

### SF-HIGH-002 - Review queue is missing

The architecture specifies `users/{uid}/situations/{caseId}/review-queue/` for synthesized structural assertions. Static search found no such implementation. `graph/staged` and `approveStagedGraph()` provide a review-like flow, but approval writes to `graph/main` without a firewall gate.

### SF-MED-001 - Synthesized runtime enforcement is incomplete

`ContextExtraction` includes `synthesized` and `confidence`, and subagent skill files warn against graph mutation. That is a contract layer, not runtime enforcement. I found no backend subagent output schemas enforcing `synthesized: true`, Claim-layer caps, confidence <= 0.6, or provenance on emitted assertions.

### SF-MED-002 - `audit:firewall-coverage` is too shallow

The audit script checks for marker strings in the shared route wrapper and claim persistence service. It does not enumerate graph write paths, so it can pass while `graph-populate`, backend pipeline sync, Neo4j merge, and in-memory graph ingestion remain outside hard-tier enforcement.

### SF-LOW-001 - Tooling environment is incomplete in this sibling worktree

`npm run` fails because `tsx` is not installed locally in this worktree. The installed sibling binary in `C:\Users\giuli\praxiscodexworking\node_modules\.bin` works for `tsx` audits. Vitest remained blocked because its config imports resolve relative to this worktree.

## Overall

Status: `PARTIAL_FAIL`

Soft-tier advisory/nonblocking behavior is implemented at the shared context/calibration boundary. Backend claim rejection and read-only Cypher rejection are real and tested. The hard-tier structural firewall, synthesized assertion runtime enforcement, review queue, and write-path coverage do not meet the architecture bible section 6 target.

Recommended next audit targets:

- Add a static write-path audit that enumerates every graph mutation function/route and requires a structural firewall call.
- Add emulator-backed synthetic tests for hard reject, soft advise, review-queue routing, and promotion.
- Implement or explicitly defer `src/lib/firewall/structural.ts`, `backend/firewall/structural.py`, `backend/firewall/synthesis_gate.py`, ontology relation validators, and review-queue routes.
