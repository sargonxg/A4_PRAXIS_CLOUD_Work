# ADR 0045: AI-First Case Creation Pattern

## Status

Accepted

## Context

Pack 28 requires a new-user path where a user can describe an objective and receive a reviewable case scaffold before entering the workbench. ADR 0038 captured the implementation slice; this ADR preserves the pack-numbered architecture contract requested by the prompt.

## Decision

AI-first case creation is an optional mode beside the manual wizard. The scaffold route returns a `CaseScaffoldProposal`, users accept or reject actors and claims, and applying a proposal emits an owner-scoped scaffold audit event. Accepted values seed the existing situation creation payload; graph promotion remains review-gated.

## Consequences

New users get a faster first useful case without bypassing symbolic-firewall or review-queue discipline. Vertex `case_scaffolder` and per-item graph commit remain backend follow-up work.

## Alternatives Considered

- Auto-write scaffolded actors and claims into the graph. Rejected because generated candidates require user review and normal graph promotion.
- Replace the manual wizard. Rejected because some users need exact manual control.
