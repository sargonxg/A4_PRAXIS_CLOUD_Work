# UN Toolkit

Tool id: `un-toolkit`

## Product Role

Help a policy or intelligence user use UN Toolkit to turn the active situation into a concrete, reviewable work product.

UN Toolkit exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `drafting`
- AI route: `/api/ai/un-toolkit`
- Data schema: `UNToolkitSchema`
- Output type: `structured`
- Model tier: `provider-default`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Conflict analyst / secondary / active
- Legal / sanctions / secondary / future

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

## Situation Inputs

- None declared.

## Required Questions

- Who is the audience and what decision must the document support?
- What stance, red lines, or policy constraints must the draft respect?

## Expected Outputs

- Schema-validated data (table) - Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.
- Editable diplomatic artifact (draft) - A structured memo, brief, dossier, cable-style text, or talking-points package with audit notes.

## Methods And Sources

Frameworks:
- UN Editorial Manual (8th ed.)
- UNSC Resolution Drafting Conventions
- UN Canonical Name Registry

Primary evidence policy:
- active situation record
- analyst profile and preferences
- uploaded documents and extracted fragments

Degraded state triggers:
- missing active situation
- missing required situation fields
- no document/source evidence for key claims

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/un-toolkit`
- Version history: `users/{uid}/situations/{situationId}/tool-data/un-toolkit/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/un-toolkit`
- Graph proposals: `users/{uid}/situations/{situationId}/graph_updates/{proposalId}`
- Sources: `users/{uid}/situations/{situationId}/sources/{sourceId}`
- Document chunks: `users/{uid}/situations/{situationId}/documents/{documentId}/chunks/{chunkId}`
- Audit trail: `users/{uid}/situations/{situationId}/tool-runs/{toolRunId}`

## Graph Backbone

- Current mode: `read`
- Future Dialectica role: Reads current ACO graph context now and should graduate to Dialectica ontology-backed retrieval, graph proposals, and analyst-approved graph mutations.

## Document Production

- LibreOffice export lane: yes
- draft clauses
- mandate language
- UN note
- Produce structured sections first; export adapters can render to DOCX/PDF/LibreOffice later without re-calling the model.

## Ask PRAXIS Actions

- Draft Council language
- Convert memo points into operative clauses
- Check terminology and mandate language

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
