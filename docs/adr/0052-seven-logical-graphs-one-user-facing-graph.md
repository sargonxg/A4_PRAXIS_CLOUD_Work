# ADR 0052: Seven logical graphs, one user-facing graph

Date: 2026-05-10
Status: Proposed (awaiting Giulio sign-off)

## Context

The codebase carries graph-shaped state in several places that drift apart
unless explicitly reconciled:

1. **Canonical Situation graph** — Firestore `situations/{id}/graph/main` and
   the Postgres KG target, holding ACO entities and 72 typed relationships.
2. **Source-receipt graph** — citations linking claims to sources.
3. **Document-fragment graph** — extracted chunks with `extracted_from` edges
   to documents.
4. **Episode timeline graph** — bi-temporal episodes with predecessor /
   successor edges.
5. **Tool-output graph** — outputs cross-referencing the canonical graph and
   each other.
6. **Cognee memory graph** — optional probabilistic recall graph (Kuzu / DB
   under the isolated `praxis-cognee` service).
7. **User-model versioning graph** — version → version edges for AnalystProfile
   snapshots.

Today these are physically and logically separate. The user sees one "graph"
panel; under the hood the panel renders the canonical graph and silently
stitches in citations from (2), (5), and sometimes (6).

## Decision

Recognise **seven logical graphs** as distinct concerns, but expose **one
user-facing graph** view that merges them through the SKC `graph-layer`:

1. The seven graphs each have a single owning module that mediates writes:
   - canonical → `src/lib/graph/`
   - source-receipts → `src/lib/sources/`
   - document fragments → `src/lib/documents/`
   - episodes → `src/lib/episodes/` (Phase D placeholder)
   - tool outputs → `src/lib/knowledge/tool-output-layer.ts`
   - Cognee → `src/app/api/memory/[...slug]` proxy to `praxis-cognee`
   - user-model versions → `src/lib/user-models/` (Phase D placeholder)
2. The user-facing graph view (Situation Model → Graph) reads via
   `SituationKnowledgeCore` and overlays edges from (2), (4), and (5)
   on top of (1). Cognee (6) and user-model (7) edges are not rendered in
   the user graph.
3. Writes never cross owning modules. A situation update never directly
   touches `episodes/`. Episodes become part of the canonical graph only
   through promoted graph patches via the existing `graph_updates` flow.
4. Audit invariants continue to apply per-graph (e.g., `audit:kg-drift`,
   `audit:embedding-dim`, `audit:cognee-isolation`).

## Consequences

- Clear ownership boundaries; no more "who writes the timeline edges?"
  ambiguity.
- The user-facing Graph panel becomes a deterministic merge view. Toggles
  let the analyst opt-in to source-receipt overlay, episode overlay, etc.
- Schema evolution per-graph is independent. Episode bi-temporal stamps
  don't force a canonical graph migration.
- Cognee remains explicitly disabled-first; turning it on adds a sixth
  *visible* overlay, not a write path into the canonical graph.

## Alternatives Considered

- **Single physical graph with type tags.** Rejected: forces every write to
  honour the union of all graphs' constraints.
- **No user-facing merge — show one graph at a time.** Rejected: defeats
  the value of having receipts and episodes adjacent to entities.
- **Make Cognee the substrate.** Rejected: violates the Cognee
  disabled-first posture and the canonical-vs-probabilistic distinction.

## References

- `docs/architecture/PRAXIS_ARCHITECTURE.md` — graph architecture.
- `docs/architecture/COGNEE_MEMORY_LAYER.md`.
- `src/lib/knowledge/README.md` — SKC contract.
- ADR 0049 (Cognee disabled-first).
