# Ask PRAXIS

Tool id: `assistant`

## Product Role

Help a policy or intelligence user use Ask PRAXIS to turn the active situation into a concrete, reviewable work product.

Ask PRAXIS exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `drafting`
- AI route: `/api/ai/chat`
- Data schema: `ChatMessageSchema`
- Output type: `streaming`
- Model tier: `provider-default`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Generic core / core / active
- Generic core / primary / active
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

- None declared.

## Required Questions

- Who is the audience and what decision must the document support?
- What stance, red lines, or policy constraints must the draft respect?

## Expected Outputs

- Cross-tool assistant response (brief) - Situation-aware answer that can research, route, and write structured payloads into tools.

## Methods And Sources

Frameworks:
- UN Editorial Manual
- Fisher-Ury Principled Negotiation
- Glasl Escalation Model

Primary evidence policy:
- active situation record
- analyst profile and preferences
- GDELT
- UCDP
- Firecrawl

Degraded state triggers:
- missing active situation
- missing required situation fields

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/assistant`
- Version history: `users/{uid}/situations/{situationId}/tool-data/assistant/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/assistant`
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

- Answer with citations
- Run or recommend tools
- Write structured updates to tool outputs

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
