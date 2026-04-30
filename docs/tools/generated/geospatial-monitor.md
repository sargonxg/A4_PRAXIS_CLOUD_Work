# Geospatial Monitor

Tool id: `geospatial-monitor`

## Product Role

Help a policy or intelligence user use Geospatial Monitor to turn the active situation into a concrete, reviewable work product.

Geospatial Monitor exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `intelligence`
- AI route: `/api/data/geospatial`
- Data schema: `GeospatialSchema`
- Output type: `structured`
- Model tier: `pro`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Conflict analyst / primary / active
- Humanitarian / primary / future
- Political risk / secondary / future

## Required Context

- `analyst-profile`
- `user-preferences`
- `situation-record`
- `source-library`
- `live-web-research`

## Optional Context

- `advisor-memory`
- `graph-backbone`
- `document-corpus`
- `external-feeds`

## Situation Inputs

- `region`
- `name`

## Required Questions

- What intelligence question should collection answer?
- Which source classes should be prioritized or excluded?

## Expected Outputs

- Geospatial event map (map) - Hotspots, geographic spread, route risks, actor footprints, and uncertainty around location precision.

## Methods And Sources

Frameworks:
- UCDP-compatible Conflict Mapping
- OCHA Humanitarian GIS Standards

Primary evidence policy:
- active situation record
- analyst profile and preferences
- GDELT
- UCDP

Degraded state triggers:
- missing active situation
- missing required situation fields

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/geospatial-monitor`
- Version history: `users/{uid}/situations/{situationId}/tool-data/geospatial-monitor/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/geospatial-monitor`
- Graph proposals: `users/{uid}/situations/{situationId}/graph_updates/{proposalId}`
- Sources: `users/{uid}/situations/{situationId}/sources/{sourceId}`
- Document chunks: `users/{uid}/situations/{situationId}/documents/{documentId}/chunks/{chunkId}`
- Audit trail: `users/{uid}/situations/{situationId}/tool-runs/{toolRunId}`

## Graph Backbone

- Current mode: `read`
- Future Dialectica role: Reads current ACO graph context now and should graduate to Dialectica ontology-backed retrieval, graph proposals, and analyst-approved graph mutations.

## Document Production

- LibreOffice export lane: no
- Not a primary document-production tool.
- Not a document-production tool; expose structured output to Report Studio when useful.

## Ask PRAXIS Actions

- Explain hotspot patterns
- Flag missing geography
- Connect map points to actors and events

## Quality Bar

- Surfaces citations or source receipts
- Triangulates when possible
- Marks unverified claims clearly

## Next Implementation Tasks

- [ ] Verify the page shows the operating contract, context blueprint, confidence, provenance, and degraded state.
- [ ] Verify the route accepts active situation context and returns schema-valid, non-empty output.
- [ ] Verify saved output reloads from canonical tool-data and can be exported or reused by Ask PRAXIS.
- [ ] Add or update browser smoke coverage for a realistic first-time and power-user flow.

## Regeneration

This file is generated from the registry, operating contract, path taxonomy, and context blueprint. Run `npm run generate:tool-docs` after changing those sources.
