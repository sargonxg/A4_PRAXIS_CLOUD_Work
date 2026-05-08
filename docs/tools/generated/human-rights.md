# Human Rights Monitor

Tool id: `human-rights`

## Product Role

Help a policy or intelligence user use Human Rights Monitor to turn the active situation into a concrete, reviewable work product.

Human Rights Monitor exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `analysis`
- AI route: `/api/ai/human-rights`
- Data schema: `HumanRightsSchema`
- Output type: `structured`
- Model tier: `pro`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Generic core / hidden-default / active
- Conflict analyst / hidden-default / active
- Humanitarian / secondary / future
- Legal / sanctions / primary / future

## Required Context

- `analyst-profile`
- `user-preferences`
- `situation-record`
- `prior-tool-outputs`
- `document-corpus`
- `drafting-constraints`
- `graph-backbone`

## Optional Context

- `advisor-memory`
- `live-web-research`
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
- Geneva Conventions (IHL)
- ICCPR/ICESCR (IHRL)
- Rome Statute (ICC)
- UPR Methodology

Primary evidence policy:
- active situation record
- analyst profile and preferences
- Google Search Grounding
- Google Grounding
- uploaded documents and extracted fragments

Degraded state triggers:
- missing active situation
- missing required situation fields
- no document/source evidence for key claims

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/human-rights`
- Version history: `users/{uid}/situations/{situationId}/tool-data/human-rights/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/human-rights`
- Graph proposals: `users/{uid}/situations/{situationId}/graph_updates/{proposalId}`
- Sources: `users/{uid}/situations/{situationId}/sources/{sourceId}`
- Document chunks: `users/{uid}/situations/{situationId}/documents/{documentId}/chunks/{chunkId}`
- Audit trail: `users/{uid}/situations/{situationId}/tool-runs/{toolRunId}`

## Graph Backbone

- Current mode: `read`
- Future Dialectica role: Reads current ACO graph context now and should graduate to Dialectica ontology-backed retrieval, graph proposals, and analyst-approved graph mutations.

## Document Production

- LibreOffice export lane: yes
- legal analysis note
- compliance note
- Produce structured sections first; export adapters can render to DOCX/PDF/LibreOffice later without re-calling the model.

## Ask PRAXIS Actions

- Explain what Human Rights Monitor is showing and what is weak or missing.
- Ask clarifying questions before regenerating Human Rights Monitor when required inputs are missing.
- Write a corrected structured payload back to human-rights when the user asks to change it.

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
