# PRAXIS v7 Brief 03 - Context And Substrate

Status: active brief

## Goal

Keep the TACITUS/Cognee substrate powerful while making the UX simple.

The user should experience:

- context coverage
- source receipts
- extracted claims
- episode scope
- stale/weak context
- review queues

The user should not need to understand Cognee, GraphRAG, substrate tables, or backend memory internals.

## TACITUS Situation Model

Every Situation should resolve to seven chapters:

1. Stakeholders
2. Stakes
3. Episodes
4. Hypotheses
5. Tried & Failed
6. Open Threads
7. Counsel

## Episode Direction

Policy knowledge is episodic. Add app-level episode objects before ontology migrations:

- parent/child episode
- predecessor/successor
- start/end conditions
- active actor scope
- scoped claims
- source receipts
- review state

ACO/ontology changes require explicit approval and an ADR.

## Cognee Contract

Keep:

- `backend/services/cognee_memory.py`
- `/api/memory/[...slug]`
- Cognee feature flags
- pending write flows

User-facing copy should say:

- improve context
- structure sources
- extract claims
- update Situation Model
- context coverage

## Acceptance

- Cognee-disabled mode is honest and useful.
- Upload/research actions visibly update context state.
- Claims show source/trust/episode scope where available.
- No silent canonical graph promotion.
