# Info Environment

Tool id: `info-environment`

## Product Role

Help a policy or intelligence user use Info Environment to turn the active situation into a concrete, reviewable work product.

Info Environment exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `analysis`
- AI route: `/api/ai/info-environment`
- Data schema: `InfoEnvironmentSchema`
- Output type: `structured`
- Model tier: `pro`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Conflict analyst / primary / active
- Media analyst / primary / future
- Election / governance / secondary / future

## Required Context

- `analyst-profile`
- `user-preferences`
- `situation-record`
- `prior-tool-outputs`
- `source-library`
- `live-web-research`
- `graph-backbone`

## Optional Context

- `advisor-memory`
- `document-corpus`
- `external-feeds`

## Situation Inputs

- `actors`
- `region`
- `description`

## Required Questions

- What decision or assessment will this analysis support?
- What time horizon should the analysis use?

## Expected Outputs

- Schema-validated data (table) - Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.
- Structured analytical assessment (scorecard) - A scored, cited, or framework-based output that can be compared across tool runs.

## Methods And Sources

Frameworks:
- NATO STRATCOM Taxonomy
- Ben Nimmo IO Detection (4D Framework)
- GDELT GCAM Sentiment Analysis

Primary evidence policy:
- active situation record
- analyst profile and preferences
- GDELT
- Firecrawl
- grounded web search receipts

Degraded state triggers:
- missing active situation
- missing required situation fields
- no checkable web/source receipts

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/info-environment`
- Version history: `users/{uid}/situations/{situationId}/tool-data/info-environment/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/info-environment`
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

- Explain what Info Environment is showing and what is weak or missing.
- Ask clarifying questions before regenerating Info Environment when required inputs are missing.
- Write a corrected structured payload back to info-environment when the user asks to change it.

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
