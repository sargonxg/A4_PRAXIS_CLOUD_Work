# Media Roundup

Tool id: `media-roundup`

## Product Role

Help a policy or intelligence user use Media Roundup to turn the active situation into a concrete, reviewable work product.

Media Roundup exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `intelligence`
- AI route: `/api/ai/media-roundup`
- Data schema: `MediaRoundupSchema`
- Output type: `structured`
- Model tier: `flash`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Conflict analyst / specialized / active
- Country desk / secondary / next
- Humanitarian / secondary / future
- Political risk / secondary / future
- Media analyst / primary / future
- Election / governance / secondary / future

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

- `name`
- `region`

## Required Questions

- What intelligence question should collection answer?
- Which source classes should be prioritized or excluded?

## Expected Outputs

- Schema-validated data (table) - Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.
- Source-grounded intelligence product (feed) - A checkable research output with provenance, confidence, and collection gaps.

## Methods And Sources

Frameworks:
- GDELT GCAM Sentiment Analysis
- Framing Analysis (Entman)
- Agenda-Setting Theory

Primary evidence policy:
- active situation record
- analyst profile and preferences
- GDELT
- Google Grounding
- grounded web search receipts

Degraded state triggers:
- missing active situation
- missing required situation fields
- no checkable web/source receipts

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/media-roundup`
- Version history: `users/{uid}/situations/{situationId}/tool-data/media-roundup/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/media-roundup`
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

- Explain what Media Roundup is showing and what is weak or missing.
- Ask clarifying questions before regenerating Media Roundup when required inputs are missing.
- Write a corrected structured payload back to media-roundup when the user asks to change it.

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
