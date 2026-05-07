# ADR 0034: Composition Chain Governance

## Status

Accepted.

## Context

Marketplace value compounds when users can chain outputs across tools, but
composition can become brittle if tool ids drift or if a tool declares a
downstream target that is not registered. Pack 21 adds 30 tools and makes static
composition coverage part of the marketplace contract.

## Decision

Composition declarations remain static on each marketplace tool contract:
`composition.canChainInto`, `composition.canChainFrom`, and
`composition.contextProjection`. Static audits verify that every referenced
tool exists and that ontology-recommended tool ids are registered.

The default context projection remains
`src/lib/tools/marketplace/projections/default.ts`; specialized projections
require a later ADR or an audit extension that proves the projection exists and
preserves ContextProvider isolation.

## Consequences

- Broken composition chains fail local audit gates before merge.
- Tool authors can add depth without editing UI-specific chain code.
- The marketplace remains tolerant: chain targets are suggestions, not automatic
  graph writes or hidden promotions.
- Future richer composition semantics can be introduced only with explicit audit
  coverage.

## Alternatives Considered

- Infer chains dynamically from ontology overlap. Rejected because it hides
  author intent and makes user-facing suggestions harder to audit.
- Require reciprocal chain declarations for every pair. Rejected for v1.2
  because some chains are intentionally one-way.
- Put composition in a separate central graph file. Rejected because colocating
  composition with each tool contract keeps authoring and review simpler.
