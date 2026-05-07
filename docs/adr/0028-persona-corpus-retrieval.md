# ADR 0028: Persona Corpus Retrieval Pattern

## Status

Accepted

## Context

Pack 16 requires each persona to speak from grounded material. Canonical personas share curated corpora, while custom personas use user-uploaded workspace corpora.

## Decision

Represent persona corpora through versioned namespaces such as `persona:canonical:<personaId>:v1.0.0` and `persona:custom:<uid>:<personaId>:v<version>`. The local foundation stores corpus manifests in persona specs and treats live pgvector / Vertex AI Vector Search ingestion as a deployment follow-up.

## Consequences

Deliberation artifacts can record the corpus namespace used for each contribution, preserving reproducibility. The foundation remains honest about retrieval status while leaving a clear upgrade path for Pack 16 live corpus indexing.

## Alternatives Considered

- One shared unversioned corpus. Rejected because it prevents reproducible deliberations.
- Vertex AI Vector Search only in v1.1. Rejected for this pass because Pack 14 default remains pgvector until scale justifies managed vector search.
