# Actor Profiles

Tool id: `actor-profiles`

## Product Role

Help a policy or intelligence user use Actor Profiles to turn the active situation into a concrete, reviewable work product.

Actor Profiles exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `analysis`
- AI route: `/api/ai/actor-profiles`
- Data schema: `ActorProfileSchema`
- Output type: `structured`
- Model tier: `pro`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Conflict analyst / primary / active
- Country desk / primary / next
- Mediator / secondary / next
- Humanitarian / primary / future
- Media analyst / secondary / future
- Election / governance / primary / future

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
- Mitchell-Agle-Wood Stakeholder Theory
- Fisher-Ury Principled Negotiation
- ACO Conflict Grammar

Primary evidence policy:
- active situation record
- analyst profile and preferences
- Firecrawl
- GDELT
- UCDP
- ACO graph primitives and graph proposals

Degraded state triggers:
- missing active situation
- missing required situation fields
- no graph primitives or approved graph context yet

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/actor-profiles`
- Version history: `users/{uid}/situations/{situationId}/tool-data/actor-profiles/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/actor-profiles`
- Graph proposals: `users/{uid}/situations/{situationId}/graph_updates/{proposalId}`
- Sources: `users/{uid}/situations/{situationId}/sources/{sourceId}`
- Document chunks: `users/{uid}/situations/{situationId}/documents/{documentId}/chunks/{chunkId}`
- Audit trail: `users/{uid}/situations/{situationId}/tool-runs/{toolRunId}`

## Graph Backbone

- Current mode: `read-write`
- Future Dialectica role: Reads current ACO graph context now and should graduate to Dialectica ontology-backed retrieval, graph proposals, and analyst-approved graph mutations.

## Document Production

- LibreOffice export lane: no
- Not a primary document-production tool.
- Not a document-production tool; expose structured output to Report Studio when useful.

## Ask PRAXIS Actions

- Explain what Actor Profiles is showing and what is weak or missing.
- Ask clarifying questions before regenerating Actor Profiles when required inputs are missing.
- Write a corrected structured payload back to actor-profiles when the user asks to change it.

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
