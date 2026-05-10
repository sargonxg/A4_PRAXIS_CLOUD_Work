# Knowledge module — Situation Knowledge Core (SKC)

Holds the 4-layer Situation Knowledge Core that backs every calibrated AI
route:

- `graph-layer.ts` — Firestore canonical graph + optional Neo4j/Falkor/Spanner derived indexes.
- `vector-layer.ts` — Firestore native KNN, 768-dim COSINE distance, `text-embedding-005`.
- `feed-layer.ts` — TTL-cached data feeds (GDELT, UCDP, HDX, ReliefWeb, etc.).
- `tool-output-layer.ts` — versioned, cross-referenced tool outputs.

Entry point: `new SituationKnowledgeCore(uid, situationId)` from `@/lib/knowledge`.

**Do not bypass this surface for direct DB reads.** Routes that read the
canonical graph go through `graph-layer.ts`; routes that need vector
retrieval go through `vector-layer.ts`; etc. This boundary is what keeps
every tool's calibration contract honest under domain × ontology × user-profile
merging.

The 2026-05-08 simplified context core model treats the SKC as the substrate
under PRAXIS Core / User Core / Team Core / Situation Core / Source Core /
Document Core / Graph Core / Output Core. See
`docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md`.

Cognee remains a probabilistic optional layer alongside SKC — see
`docs/architecture/COGNEE_MEMORY_LAYER.md` and
`docs/runbooks/MEMORY_LAYER_RUNBOOK.md`. The canonical graph stays in
Firestore (Postgres in target state).
