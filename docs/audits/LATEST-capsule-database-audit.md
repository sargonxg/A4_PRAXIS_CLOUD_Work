# Capsule Database Audit

Catalog version: 2026-06-16-graphlite-advisory-projection-v18-multilateral-syria-depth
Generated at: 2026-06-17T02:54:11.168Z
Result: pass
Canonical store: Firestore ContextCapsules
Audited scope: local starter catalog definitions and seedable GraphLite advisory projection metadata
Remote Firestore queried: false
Remote Firestore mutation: false

## Totals

- Capsules/records: 211
- Source records: 935
- Excerpt records: 786
- Named GraphLite graph records: 211
- Graph node templates: 25822
- Graph edge templates: 27404

## Types

- situation: 86
- tool: 75
- output: 36
- user: 14

## Domains

- output-brief: 33
- audit-review: 21
- diplomacy: 21
- options-mapping: 19
- finance: 16
- analyst-role: 14
- humanitarian-rights: 14
- policy-review: 14
- source-intake: 9
- cyber-resilience: 8
- exposure-mapping: 8
- ai-governance: 7
- public-health: 7
- critical-minerals: 6
- sustainability: 5
- election-integrity: 4
- migration-displacement: 4
- hr: 1

## Graph Stats

- Nodes: min 99, max 143, average 122.38, unique counts 43
- Edges: min 106, max 152, average 129.88, unique counts 47
- Same node/edge count records: 2
- Density bands: 115-129 95, 130-plus 63, 100-114 52, 84-99 1

## Source Stats

- Unique source IDs: 215
- Sources per capsule: min 4, max 6, average 4.43
- Capsules with four or more sources: 211
- Source tier records: tier-1 611, tier-2 269, tier-3 55

## Multilateral Syria Flagship Records

- starter-user-us-based-multilateral-desk-officer: found, user, analyst-role, nodes 133, edges 111, sources 6
- starter-situation-syria-political-security-humanitarian-watch: found, situation, diplomacy, nodes 127, edges 150, sources 6
- starter-tool-multilateral-source-trust-ledger: found, tool, source-intake, nodes 142, edges 129, sources 6
- starter-tool-media-source-prioritization-docket: found, tool, source-intake, nodes 113, edges 127, sources 6
- starter-tool-briefing-synthesis-sourceability-protocol: found, tool, audit-review, nodes 140, edges 116, sources 6
- starter-output-two-page-syria-media-roundup: found, output, output-brief, nodes 126, edges 119, sources 6

## Findings

- None

## Architecture Suggestions

- Promote graph density, source freshness cadence, and confidence cap into an explicit graphDensityProfile field instead of inferring from templates.
- Add a Firestore seed dry-run diff that compares starter definitions with persisted user capsules before any remote write is allowed.
- Store source-refresh SLAs per capsule family so stale official reports, media items, and method sources age differently.
- Add graph visualization lens filters for structure, evidence, confidence, delimitation, and source-refresh edges.
- Create named capsule bundles for flagship policy workflows so starred packs can be installed without hardcoding UI order.
- Add per-capsule prompt-budget telemetry so large ontology overlays are summarized before they crowd out user evidence.
- Keep GraphLite projections advisory until a review card accepts a node or edge into canonical capsule state.
