# ADR 0050: Context Capsule Unified Schema

Date: 2026-05-28
Status: Accepted

## Context

PRAXIS had overlapping ContextCapsule v1, v2, and v3 shapes. New capsules were
still stored as older envelopes while v3 held governance, tacit knowledge,
memory posture, marketplace readiness, and evaluation semantics.

## Decision

All capsule reads normalize to the v3 in-memory contract. Firestore remains the
canonical owner-scoped store; lazy normalization avoids a forced production
rewrite. Review-card patches are schema-validated allow-list patches, and
approved mutations are applied transactionally with version snapshots.

Readiness is derived from the unified quality path. v3 source spine, tacit
knowledge, agent operability, marketplace readiness, and read-receipt usage
signals fold into the existing readiness surface rather than adding a second
public score.

Capsule+ and Cognee are derived planes. Capsule+ exports materialize v3 claims,
sources, memory facts, and output contracts as reviewable graph proposals.
Cognee recall remains advisory-only, confidence-capped at `0.600`, and can
promote only capsule-scoped `memoryPosture.canonicalCapsuleFacts[]` through a
review card.

## Consequences

- New and read capsules expose schemaVersion 3 and a `v3` sectioned contract.
- Bulk migration is optional and dry-run-first via `scripts/migrate-capsules-to-v3.ts`.
- The isolated `praxis-cognee` service owns live Cognee execution; the monolith
  only defines the HTTP client contract and disabled-safe shapes.
- Agent read receipts now feed capsule usage rollups so readiness reflects
  actual degraded runtime behavior.
