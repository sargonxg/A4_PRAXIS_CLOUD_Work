# Policy Memo

Tool id: `policy-memo`

## Product Role

Help a policy or intelligence user use Policy Memo to turn the active situation into a concrete, reviewable work product.

Policy Memo exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `drafting`
- AI route: `/api/ai/policy-memo`
- Data schema: `PolicyMemoSchema`
- Output type: `structured`
- Model tier: `pro`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Generic core / secondary / active
- Conflict analyst / secondary / active
- Country desk / primary / next
- Mediator / secondary / next
- Legal / sanctions / primary / future
- Policy research / primary / future
- Stabilization / secondary / future
- Election / governance / secondary / future

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
- `actors`
- `description`

## Required Questions

- Who is the audience and what decision must the document support?
- What stance, red lines, or policy constraints must the draft respect?

## Expected Outputs

- Policy memo (draft) - Executive summary, policy options, recommendation, implementation steps, risks, and drafting audit.

## Methods And Sources

Frameworks:
- Putnam Two-Level Game Theory
- SWOT Analysis
- Harvard Policy Analysis Framework

Primary evidence policy:
- active situation record
- analyst profile and preferences
- Google Search Grounding
- Google Search
- uploaded documents and extracted fragments

Degraded state triggers:
- missing active situation
- missing required situation fields
- no document/source evidence for key claims

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/policy-memo`
- Version history: `users/{uid}/situations/{situationId}/tool-data/policy-memo/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/policy-memo`
- Graph proposals: `users/{uid}/situations/{situationId}/graph_updates/{proposalId}`
- Sources: `users/{uid}/situations/{situationId}/sources/{sourceId}`
- Document chunks: `users/{uid}/situations/{situationId}/documents/{documentId}/chunks/{chunkId}`
- Audit trail: `users/{uid}/situations/{situationId}/tool-runs/{toolRunId}`

## Graph Backbone

- Current mode: `read`
- Future Dialectica role: Reads current ACO graph context now and should graduate to Dialectica ontology-backed retrieval, graph proposals, and analyst-approved graph mutations.

## Document Production

- LibreOffice export lane: yes
- policy memo
- options paper
- decision memo
- Produce structured sections first; export adapters can render to DOCX/PDF/LibreOffice later without re-calling the model.

## Ask PRAXIS Actions

- Rewrite for a specific audience
- Challenge the recommendation
- Add constraints or red lines

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
