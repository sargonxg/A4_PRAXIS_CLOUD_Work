# Capsule Database Audit

Catalog version: 2026-07-02-canonical-four-category-v19
Generated at: 2026-10-05T20:32:42.400Z
Result: pass
Canonical store: Firestore ContextCapsules
Audited scope: local starter catalog definitions and seedable GraphLite advisory projection metadata
Remote Firestore queried: false
Remote Firestore mutation: false

## Totals

- Capsules/records: 221
- Source records: 978
- Excerpt records: 826
- Named GraphLite graph records: 221
- Graph node templates: 31761
- Graph edge templates: 33920

## Types

- situation: 89
- tool: 78
- output: 38
- user: 16

## Domains

- output-brief: 35
- audit-review: 23
- diplomacy: 22
- options-mapping: 20
- analyst-role: 16
- finance: 16
- humanitarian-rights: 15
- policy-review: 14
- source-intake: 9
- cyber-resilience: 8
- exposure-mapping: 8
- ai-governance: 7
- critical-minerals: 7
- public-health: 7
- sustainability: 5
- election-integrity: 4
- migration-displacement: 4
- hr: 1

## Graph Stats

- Nodes: min 115, max 173, average 143.71, unique counts 56
- Edges: min 123, max 187, average 153.48, unique counts 63
- Same node/edge count records: 2
- Density bands: 130-plus 163, 115-129 58

## Source Stats

- Unique source IDs: 220
- Sources per capsule: min 4, max 6, average 4.43
- Capsules with four or more sources: 221
- Source tier records: tier-1 642, tier-2 279, tier-3 57

## Multilateral Syria Flagship Records

- starter-user-us-based-multilateral-desk-officer: found, user, analyst-role, nodes 151, edges 139, sources 6
- starter-situation-syria-political-security-humanitarian-watch: found, situation, diplomacy, nodes 124, edges 174, sources 6
- starter-tool-multilateral-source-trust-ledger: found, tool, source-intake, nodes 131, edges 144, sources 6
- starter-tool-media-source-prioritization-docket: found, tool, source-intake, nodes 148, edges 142, sources 6
- starter-tool-briefing-synthesis-sourceability-protocol: found, tool, audit-review, nodes 147, edges 169, sources 6
- starter-output-two-page-syria-media-roundup: found, output, output-brief, nodes 164, edges 186, sources 6

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
