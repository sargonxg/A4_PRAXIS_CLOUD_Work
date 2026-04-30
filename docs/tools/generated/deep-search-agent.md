# Deep Research Agent

Tool id: `deep-search-agent`

## Product Role

Help a policy or intelligence user use Deep Research Agent to turn the active situation into a concrete, reviewable work product.

Deep Research Agent exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `intelligence`
- AI route: `/api/ai/deep-search-agent`
- Data schema: `DeepSearchSchema`
- Output type: `streaming`
- Model tier: `pro`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Generic core / core / active
- Generic core / secondary / active
- Generic core / premium-future / active
- Conflict analyst / core / active
- Conflict analyst / primary / active
- Conflict analyst / premium-future / active
- Country desk / core / next
- Country desk / premium-future / next
- Mediator / core / next
- Mediator / premium-future / next
- Humanitarian / core / future
- Humanitarian / premium-future / future
- Legal / sanctions / core / future
- Legal / sanctions / secondary / future
- Legal / sanctions / premium-future / future
- Political risk / core / future
- Political risk / premium-future / future
- Policy research / core / future
- Policy research / primary / future
- Policy research / premium-future / future
- Media analyst / core / future
- Media analyst / premium-future / future
- Stabilization / core / future
- Stabilization / premium-future / future
- Election / governance / core / future
- Election / governance / premium-future / future

## Required Context

- `analyst-profile`
- `user-preferences`
- `situation-record`
- `source-library`
- `live-web-research`
- `graph-backbone`

## Optional Context

- `advisor-memory`
- `document-corpus`
- `external-feeds`

## Situation Inputs

- `name`
- `region`

## Required Questions

- What intelligence question should collection answer?
- Which source classes should be prioritized or excluded?

## Expected Outputs

- Interactive answer (brief) - Conversational output that can ask clarifying questions and route the user to the right tool.
- Source-grounded intelligence product (feed) - A checkable research output with provenance, confidence, and collection gaps.

## Methods And Sources

Frameworks:
- Structured Analytic Techniques (SATs)
- Intelligence Cycle

Primary evidence policy:
- active situation record
- analyst profile and preferences
- Vertex AI Agent Engine
- Google Search
- grounded web search receipts
- ACO graph primitives and graph proposals

Degraded state triggers:
- missing active situation
- missing required situation fields
- no checkable web/source receipts
- no graph primitives or approved graph context yet

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/deep-search-agent`
- Version history: `users/{uid}/situations/{situationId}/tool-data/deep-search-agent/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/deep-search-agent`
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

- Turn a question into a research plan
- Save findings to sources or graph
- Identify follow-up collection tasks

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
