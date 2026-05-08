# Peacebuilding Index

Tool id: `peacebuilding-index`

## Product Role

Help a policy or intelligence user use Peacebuilding Index to turn the active situation into a concrete, reviewable work product.

Peacebuilding Index exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `analysis`
- AI route: `/api/ai/peacebuilding-index`
- Data schema: `PeacebuildingIndexSchema`
- Output type: `structured`
- Model tier: `pro`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Generic core / hidden-default / active
- Conflict analyst / hidden-default / active
- Stabilization / primary / future

## Required Context

- `analyst-profile`
- `user-preferences`
- `situation-record`
- `prior-tool-outputs`
- `graph-backbone`

## Optional Context

- `advisor-memory`
- `live-web-research`
- `document-corpus`
- `source-library`
- `external-feeds`

## Situation Inputs

- `name`
- `region`
- `actors`
- `description`

## Required Questions

- What decision or assessment will this analysis support?
- What time horizon should the analysis use?

## Expected Outputs

- Schema-validated data (table) - Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.
- Structured analytical assessment (scorecard) - A scored, cited, or framework-based output that can be compared across tool runs.

## Methods And Sources

Frameworks:
- Peacebuilding Assessment Methodology
- World Bank FCV Framework
- IEP Global Peace Index

Primary evidence policy:
- active situation record
- analyst profile and preferences
- Google Search Grounding
- World Bank

Degraded state triggers:
- missing active situation
- missing required situation fields

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/peacebuilding-index`
- Version history: `users/{uid}/situations/{situationId}/tool-data/peacebuilding-index/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/peacebuilding-index`
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

- Explain what Peacebuilding Index is showing and what is weak or missing.
- Ask clarifying questions before regenerating Peacebuilding Index when required inputs are missing.
- Write a corrected structured payload back to peacebuilding-index when the user asks to change it.

## Quality Bar

- Applies named methodology
- Explains drivers, not just labels
- Separates fact, inference, and uncertainty

## Next Implementation Tasks

- [ ] Verify the page shows the operating contract, context blueprint, confidence, provenance, and degraded state.
- [ ] Verify the route accepts active situation context and returns schema-valid, non-empty output.
- [ ] Verify saved output reloads from canonical tool-data and can be exported or reused by Ask PRAXIS.
- [ ] Add or update browser smoke coverage for a realistic first-time and power-user flow.

## Regeneration

This file is generated from the registry, operating contract, path taxonomy, and context blueprint. Run `npm run generate:tool-docs` after changing those sources.
