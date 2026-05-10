# PRAXIS Vision v4 - Architecture Direction

Status: canonical architecture direction for the v5 MVP build
Date adopted: 2026-05-10
Source: `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`

This document records the v4 architecture direction required by the v5 build
pack. The authoritative invariant source remains
`docs/architecture/PRAXIS_ARCHITECTURE.md`; this file narrows that target state
to the MVP build direction.

## Core Model

PRAXIS keeps the eight ACO primitives as the graph substrate:

- Actor
- Claim
- Interest
- Constraint
- Leverage
- Commitment
- Event
- Narrative

Domain ontologies and work ontologies map their richer subtypes onto these
primitives. No ninth primitive is introduced by the MVP.

## Two Ontology Categories

The v5 MVP adopts two ontology categories:

| Category | Purpose | MVP Scope |
|---|---|---|
| Domain ontologies | Describe what is happening in the world | Conflict, Mediation, Humanitarian active; other existing lenses deferred |
| Work ontologies | Describe the analyst's job, audience, constraints, and work process | Foreign Policy Research, Domestic Policy Analysis, Corporate Strategic Analysis |

## Non-Negotiables

The MVP inherits the five operating constraints from the build pack:

1. Owner scoping is enforced through types, Firestore rules, and Postgres
   constraints.
2. Model strings remain centralized in `src/lib/ai/MODEL_MATRIX.json`, with SDK
   imports isolated in provider modules.
3. Methods read context only through ContextProvider and receive prepared
   ContextSnapshots.
4. Cross-store operations use the two-phase commit protocol.
5. Graph operations carry bi-temporal validity fields.

## Runtime Posture

Production remains Google Cloud/Firebase/Vertex aligned:

- Next.js on Cloud Run.
- Private backend services on Cloud Run.
- Firebase Auth and Firestore for user/session/application metadata.
- Cloud SQL/Postgres for the knowledge graph path as it reaches production
  proof.
- Cloud Storage for uploads and exports.
- Vertex AI/Gemini as the production model runtime.

Deferred systems must not be represented as live production capability until
their runtime gates pass and the live-app alignment document is updated.
