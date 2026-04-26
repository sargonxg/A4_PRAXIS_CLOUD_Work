# PRAXIS Corpus Architecture

Status: active design, first slices shipped.
Last updated: 2026-04-26.

## Objective

Every answer in PRAXIS should be grounded in the user's working context, not a
generic chat prompt. The corpus is the per-user, per-situation body of evidence
that Ask PRAXIS, tools, dashboards, and future agents can retrieve from.

## Corpus Sources

| Layer | Current store | Purpose | Next improvement |
|---|---|---|---|
| Analyst profile | `users/{uid}/profile/analyst` and `profile_versions` | Role, mandate, audience, language, lenses, red lines | Add profile-version display to output provenance panels. |
| Situation record | `users/{uid}/situations/{situationId}` | Name, region, actors, source URLs, notes, status | Add situation-health score. |
| Sources Library | `tool-data/sources-library` | User-approved source list, reliability notes, source preferences | Add source whitelist/blocklist to Media Roundup and ARGUS. |
| ARGUS | `tool-data/argus` | Alerts, watch items, claims, suspicious narratives | Persist extracted sources and claims as reusable corpus artifacts. |
| Documents | uploaded files + extracted chunks | Grounded citations and local evidence | Add Firestore vector-search pilot over chunks. |
| Graph | conflict graph nodes/edges | Actors, interests, claims, constraints, relationships | Add graph-delta approval queue with provenance. |
| Timeline | generated/approved events | Chronology and escalation sequence | Generate from evidence-backed events only; no live-mode demo fallback. |
| Tool outputs | `tool-data/{toolId}` and legacy `tools/{toolId}` | Derived analysis, assumptions, recommendations | Migrate to canonical `ToolOutputEnvelope`. |
| Operational spine | `tool_runs`, `background_jobs`, `system_events`, notifications | Freshness, failures, provenance, auditability | Surface in Situation Health and admin diagnostics. |

## Retrieval Contract

Every corpus retrieval should return:

- `sourceType`: profile, situation, document, source, argus, graph, timeline,
  tool-output, or event.
- `sourceId`: stable Firestore/document identifier.
- `title`: concise human-readable label.
- `excerpt`: short text inserted into the prompt.
- `citation`: source URL, document chunk ID, graph node ID, or tool-run ID.
- `confidence`: high, medium, low, or unknown.
- `freshness`: generated/observed timestamp.
- `reason`: why this item was selected.

## Current Implementation

`src/lib/argus/corpus-context.ts` already injects a first version of the User
Situation Corpus into Ask PRAXIS:

- ARGUS alerts/watch items from `tool-data/argus`
- Sources Library entries from `tool-data/sources-library`
- relevant uploaded document chunks via `retrieveRelevantChunks`

This is intentionally prompt-level today. The next step is a structured API:
`/api/intelligence/corpus-search`.

## Target API

```http
POST /api/intelligence/corpus-search
```

Request:

```json
{
  "situationId": "sit_123",
  "query": "What changed in the last 24 hours around humanitarian access?",
  "layers": ["argus", "documents", "sources", "graph", "tool-output"],
  "limit": 12
}
```

Response:

```json
{
  "items": [
    {
      "sourceType": "document",
      "sourceId": "doc_abc#chunk_7",
      "title": "OCHA access note",
      "excerpt": "Convoy access remained blocked...",
      "citation": "documents/doc_abc/chunks/chunk_7",
      "confidence": "high",
      "freshness": "2026-04-26T12:00:00Z",
      "reason": "Matches humanitarian access query and active situation region"
    }
  ],
  "trace": {
    "query": "humanitarian access",
    "layersSearched": ["argus", "documents", "sources", "graph", "tool-output"],
    "ranking": "keyword + recency now; vector search pilot next"
  }
}
```

## Google Cloud Path

- Firestore remains the source of truth for user-owned state and operational
  state.
- Cloud Storage stores uploaded source files and generated export artifacts.
- Vertex AI embeddings generate vectors for document chunks and eventually
  tool-output summaries.
- Firestore vector search can pilot nearest-neighbor retrieval close to the
  operational data plane. Current Google documentation states embeddings must
  be generated separately and vector queries do not support real-time snapshot
  listeners.
- BigQuery stores analytics and feed/tool-run marts, not private working notes
  unless explicitly anonymized/hashed.
- Cloud Tasks queues long retrieval/embedding refresh work.

## Implementation Order

1. Normalize corpus result type in `src/types/corpus.ts`.
2. Extract current ARGUS corpus ranking from `src/lib/argus/corpus-context.ts`
   into reusable `searchSituationCorpus`.
3. Add `/api/intelligence/corpus-search` with `withAuth`.
4. Update Ask PRAXIS to call the shared function instead of manually building
   context.
5. Add citation disclosure in the chat UI.
6. Add Firestore vector-search pilot for document chunks after index planning.
7. Add BigQuery aggregate metrics for coverage/freshness, never raw sensitive
   text by default.

