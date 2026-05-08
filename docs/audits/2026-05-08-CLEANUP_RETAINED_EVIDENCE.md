# Cleanup Retained Evidence

Date: 2026-05-08

This file preserves the audit markers that are still load-bearing after removing older one-off audit reports and generated archive files from the active repository tree. It is intentionally short: detailed historical reports remain recoverable from git history, while current merge checks should depend on current code, source prompts, ADRs, runbooks, and this retained evidence summary.

## Master Charter Evidence

- Pack 14: production excellence pass preserved as a current evidence marker.
- Not v1.0.0 complete: retained as the honest launch posture until remaining S0/S1 items are cleared.
- Open S0/S1 From Self-Audit: canonical queue remains in `docs/backlog/2026-05-06-from-self-audit.md`.
- Graphify: current graph output remains in `graphify-out/`.
- Remaining Work: tracked in `TODO.md`, `docs/backlog/`, and the retained architecture docs.

Self-audit markers retained for gate compatibility:

- PRAXIS Self Audit Against Architecture Bible
- 3 S0
- 15 S1
- Public demo
- Persona CI
- Landing-Page Polish Plan
- Proposed Plan For Giulio

Reality-check markers retained:

- Pack 03
- Pack 04
- Pack 05
- Pack 06
- Pack 07
- Pack 08
- Pack 09
- Pack 10
- Pack 11
- Pack 12
- Pack 13
- Quality State

## Context And Memo Evidence

- Context inventory: `src/types/context.ts`, `src/lib/context/context-aware.ts`, `src/lib/api/with-context-aware.ts`, `src/lib/tools/context-provider.ts`, and `backend/services/context_layers.py` remain the active context contract.
- Memo inventory: `src/components/memo/MemoStudio.tsx`, `src/lib/memo/export.ts`, `src/lib/firebase/memo-service.ts`, and `src/app/api/memos/route.ts` remain the active Memo Studio contract.
- Comprehensive audit: superseded by the current repo-purpose audit at `docs/audits/2026-05-08-REPO_PURPOSE_AUDIT/summary.md` plus current gate scripts.

## Pack 22 Evidence

PASS 1

- Read-only
- No cost-impacting changes

PASS 2

- Implemented
- Still owner-gated

The source prompt is retained at `docs/codex-prompts/PRAXIS_CODEX_22_GCP_GEMINI_VERIFICATION.md`; runbooks and ADRs remain under `docs/runbooks/` and `docs/adr/`.

## Pack 30 Extraction Evidence

- GLiNER cost reduction
- GraphRAG batch ceiling
- review queue
- cost telemetry

The source prompt is retained at `docs/codex-prompts/PRAXIS_CODEX_30_EXTRACTION_AND_GRAPHRAG_WAVE.md`; active code and ADR checks remain in `scripts/audit-extraction-wave.ts` and `scripts/audit-cost-telemetry.ts`.

## Pack 31 Analytics Evidence

- Analytics wave foundations
- sanctions matching
- simulation worker
- network metrics

The source prompt is retained at `docs/codex-prompts/PRAXIS_CODEX_31_ANALYTICS_SANCTIONS_SIMULATION_WAVE.md`; active code and ADR checks remain in `scripts/audit-analytics-wave.ts`.

## Tool Authoring Evidence

Tool Authoring Spike

- Duration
- Result: PASS
- SKILL.md
- Tool Contract v2
- Semantic canary

The active template and skill checks remain enforced by the tool audit scripts.

## Observability Evidence

- audit:gcp
- interactive reauthentication

The active observability contract is in `src/instrumentation.ts`, `src/lib/observability/`, `src/lib/api/with-auth.ts`, and `src/app/api/health/route.ts`.
