# Briefing Room

Tool id: `briefing`

## Product Role

Help a policy or intelligence user use Briefing Room to turn the active situation into a concrete, reviewable work product.

Briefing Room exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `drafting`
- AI route: `/api/ai/briefing-generate`
- Data schema: `BriefingSchema`
- Output type: `hybrid`
- Model tier: `pro`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Generic core / core / active
- Conflict analyst / core / active
- Country desk / core / next
- Mediator / core / next
- Humanitarian / core / future
- Legal / sanctions / core / future
- Political risk / core / future
- Policy research / core / future
- Media analyst / core / future
- Stabilization / core / future
- Election / governance / core / future

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
- `description`

## Required Questions

- Who is the audience and what decision must the document support?
- What stance, red lines, or policy constraints must the draft respect?

## Expected Outputs

- Hybrid output (brief) - A mix of narrative, structured data, and reusable state for follow-on tools.
- Editable diplomatic artifact (draft) - A structured memo, brief, dossier, cable-style text, or talking-points package with audit notes.

## Methods And Sources

Frameworks:
- Diplomatic Morning Brief Format
- Intelligence Analysis Standards (ICD 203)

Primary evidence policy:
- active situation record
- analyst profile and preferences
- GDELT
- UCDP
- ReliefWeb
- uploaded documents and extracted fragments

Degraded state triggers:
- missing active situation
- missing required situation fields
- no document/source evidence for key claims

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/briefing`
- Version history: `users/{uid}/situations/{situationId}/tool-data/briefing/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/briefing`
- Graph proposals: `users/{uid}/situations/{situationId}/graph_updates/{proposalId}`
- Sources: `users/{uid}/situations/{situationId}/sources/{sourceId}`
- Document chunks: `users/{uid}/situations/{situationId}/documents/{documentId}/chunks/{chunkId}`
- Audit trail: `users/{uid}/situations/{situationId}/tool-runs/{toolRunId}`

## Graph Backbone

- Current mode: `read`
- Future Dialectica role: Reads current ACO graph context now and should graduate to Dialectica ontology-backed retrieval, graph proposals, and analyst-approved graph mutations.

## Document Production

- LibreOffice export lane: yes
- intelligence briefing
- daily read
- situation brief
- Produce structured sections first; export adapters can render to DOCX/PDF/LibreOffice later without re-calling the model.

## Ask PRAXIS Actions

- Explain what Briefing Room is showing and what is weak or missing.
- Ask clarifying questions before regenerating Briefing Room when required inputs are missing.
- Write a corrected structured payload back to briefing when the user asks to change it.

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
