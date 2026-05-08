# Brief Builder

Tool id: `brief-builder`

## Product Role

Help a policy or intelligence user use Brief Builder to turn the active situation into a concrete, reviewable work product.

Brief Builder exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `drafting`
- AI route: `/api/ai/brief-builder`
- Data schema: `BriefBuilderSchema`
- Output type: `structured`
- Model tier: `pro`
- Active path focus: No - documented for later path activation.

## Workflow Paths

- No path membership yet.

## Required Context

- `analyst-profile`
- `user-preferences`
- `situation-record`
- `prior-tool-outputs`
- `document-corpus`
- `drafting-constraints`

## Optional Context

- `advisor-memory`
- `live-web-research`
- `graph-backbone`
- `source-library`
- `external-feeds`

## Situation Inputs

- `name`
- `region`

## Required Questions

- Who is the audience and what decision must the document support?
- What stance, red lines, or policy constraints must the draft respect?

## Expected Outputs

- Schema-validated data (table) - Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.
- Editable diplomatic artifact (draft) - A structured memo, brief, dossier, cable-style text, or talking-points package with audit notes.

## Methods And Sources

Frameworks:
- Diplomatic Brief Writing
- ICD 203 Probability Language
- BLUF Method

Primary evidence policy:
- active situation record
- analyst profile and preferences
- Situation corpus (ARGUS, Sources Library, Documents, Graph, Tool Outputs, Analyst Notes)

Degraded state triggers:
- missing active situation
- missing required situation fields

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/brief-builder`
- Version history: `users/{uid}/situations/{situationId}/tool-data/brief-builder/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/brief-builder`
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

- Explain what Brief Builder is showing and what is weak or missing.
- Ask clarifying questions before regenerating Brief Builder when required inputs are missing.
- Write a corrected structured payload back to brief-builder when the user asks to change it.

## Quality Bar

- Uses professional diplomatic structure
- Includes confidence and limits
- Can be edited or regenerated section by section

## Next Implementation Tasks

- [ ] Verify the page shows the operating contract, context blueprint, confidence, provenance, and degraded state.
- [ ] Verify the route accepts active situation context and returns schema-valid, non-empty output.
- [ ] Verify saved output reloads from canonical tool-data and can be exported or reused by Ask PRAXIS.
- [ ] Add or update browser smoke coverage for a realistic first-time and power-user flow.

## Regeneration

This file is generated from the registry, operating contract, path taxonomy, and context blueprint. Run `npm run generate:tool-docs` after changing those sources.
