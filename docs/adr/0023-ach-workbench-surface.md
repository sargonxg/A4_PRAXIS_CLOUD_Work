# 0023 - ACH Workbench Surface

## Status
Accepted for v1.1 foundation.

## Context
Analysis of Competing Hypotheses is centered on a hypothesis x evidence matrix. Analysts revisit and rescore the matrix as new evidence arrives, so it does not fit a one-shot marketplace run.

## Decision
ACH gets dedicated routes under `/app/workbench/[caseId]/ach` and `/app/workbench/[caseId]/ach/[achId]`, plus a workbench tab entry. The ranking algorithm is implemented in `src/lib/sats/ach-ranking.ts` and ranks by inconsistency count and weighted diagnosticity.

## Consequences
ACH can become a persistent multi-session artifact without overloading the tools tab. The current implementation is a foundation surface with sample data and deterministic ranking; Firestore persistence, DOCX export, graph evidence pulling, and review-queue promotion remain follow-up work.

## Alternatives Considered
A single marketplace run was rejected because it would flatten the matrix into prose. A fully custom backend before UI was rejected because the core ranking and analyst-facing shape can be validated independently first.
