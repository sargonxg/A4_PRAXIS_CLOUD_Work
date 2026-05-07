# PRAXIS Substrate Audit Report

Date: 2026-05-07

Prompt source: `C:\Users\giuli\Downloads\SUBSTRATE_AUDIT_PROMPT.md`

## TL;DR

Status: YELLOW.

The substrate has the right separation shape: Cognee access is centralized in `backend/services/cognee_memory.py`, tenant scope is encoded as `owner_uid__case_id`, frontend access is proxied through authenticated `/api/memory/*` routes, and promotion into canonical graph tables goes through candidate/review paths instead of raw Cognee writes. The important gap is operational reality: live Cognee `add`, `cognify`, `search`, `memify`, and `forget` are still disabled-safe stubs owned by the isolated `praxis-cognee` service, so this pass could not prove a live tenant-scoped ingestion/search round trip.

## What Passed

| Check | Result | Evidence |
| --- | --- | --- |
| Cognee SDK isolation | PASS | `npm run audit:cognee` passed. Direct Cognee import remains isolated to the adapter. |
| Cognee operations contract | PASS | `npm run audit:cognee-operations` passed after updating the stale tab expectation. |
| Substrate writer boundary | PASS | `npm run audit:substrate-writers` passed earlier in this audit pack. |
| Orchestrator write boundary | PASS | `npm run audit:orchestrator-writes` passed. |
| Tenant dataset naming | PASS | `MemoryScope.dataset` produces `owner_uid__case_id` and rejects missing owner/case ids. |
| Search interaction capture | PASS | `SearchAudit.save_interaction` defaults true; search rejects false. |
| Candidate promotion posture | PASS | Cognee bridge writes review metadata and `aco_cognee_link`; it does not promote canonical graph facts directly. |
| ACO OWL artifact | PASS | Added `backend/data/ontologies/praxis_aco.owl` and audit coverage for the eight ACO primitives. |

## Findings

| ID | Severity | Area | Finding | Recommendation |
| --- | --- | --- | --- | --- |
| SUB-F01 | P0 | Live memory substrate | Live Cognee calls are not implemented in the monolith and return disabled/queued shapes unless the isolated service is enabled. | Wire the isolated `praxis-cognee` service to real `add/cognify/search/memify/forget`, then add a tenant synthetic test that proves tenant A cannot read tenant B. |
| SUB-F02 | P1 | ACO ontology artifact | The prompt contract expected `backend/data/ontologies/praxis_aco.owl`; the file was missing before this pass. | Fixed in this pass. Keep `audit:cognee-operations` as the regression guard. |
| SUB-F03 | P1 | Workbench memory surface | A previous audit expected a fifth `memory` tab, conflicting with the current four-tab/seven-chapter workbench. | Fixed audit and docs to preserve Cognee behind Library/Ontology/Graph instead of adding tab sprawl. |
| SUB-F04 | P1 | Live ingest proof | Local code proves routing and disabled-safe UX, but not a real PDF upload to Cognee, temporal cognify, graph candidate review, and recall. | Add a staging-only smoke: upload fixture PDF, run Cognee pipeline, verify candidate count, recall result, and source provenance. |
| SUB-F05 | P2 | DataPoint parity | `cognee_aco_models.py` includes Situation and Position but not all ontology-lens refinements. This is acceptable for substrate safety, but incomplete for rich extraction. | Add a parity audit comparing ACO OWL classes, Pydantic DataPoints, and ontology registry subtypes. |

## Fixes Made This Pass

- Added `backend/data/ontologies/praxis_aco.owl`.
- Extended `scripts/audit-cognee-operations.ts` to require the OWL artifact and the eight ACO primitives.
- Updated `scripts/audit-cognee-operations.ts` so Cognee stays behind existing Library/Ontology/Graph surfaces rather than requiring a stale fifth Memory tab.
- Updated `docs/architecture/COGNEE_MEMORY_LAYER.md` to match the current workbench surface model.

## Verification

```text
npm run audit:cognee
npm run audit:cognee-operations
npm run audit:orchestrator-writes
```

All three passed on 2026-05-07.

## Next Implementation Queue

1. Build live isolated Cognee service calls and run tenant round-trip tests.
2. Add ACO OWL/Pydantic/ontology-registry parity audit.
3. Add staging PDF ingest smoke with candidate review and recall proof.
4. Add production readiness dashboard panel for Cognee disabled/live/degraded state.
