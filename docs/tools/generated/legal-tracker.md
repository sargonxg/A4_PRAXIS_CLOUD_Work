# Legal & Resolution Tracker

Tool id: `legal-tracker`

## Product Role

Help a policy or intelligence user use Legal & Resolution Tracker to turn the active situation into a concrete, reviewable work product.

Legal & Resolution Tracker exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.

- Category: `intelligence`
- AI route: `/api/ai/legal-tracker`
- Data schema: `LegalTrackerSchema`
- Output type: `structured`
- Model tier: `pro`
- Active path focus: Yes - active generic/conflict-political sprint focus.

## Workflow Paths

- Generic core / hidden-default / active
- Conflict analyst / hidden-default / active
- Country desk / secondary / next
- Legal / sanctions / primary / future
- Election / governance / secondary / future

## Required Context

- `analyst-profile`
- `user-preferences`
- `situation-record`
- `document-corpus`
- `drafting-constraints`
- `source-library`
- `live-web-research`

## Optional Context

- `advisor-memory`
- `graph-backbone`
- `external-feeds`

## Situation Inputs

- `name`
- `region`
- `actors`
- `description`

## Required Questions

- What intelligence question should collection answer?
- Which source classes should be prioritized or excluded?

## Expected Outputs

- Schema-validated data (table) - Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.
- Source-grounded intelligence product (feed) - A checkable research output with provenance, confidence, and collection gaps.

## Methods And Sources

Frameworks:
- UN Charter (Chapter VI/VII)
- ICJ Statute
- Rome Statute
- Vienna Convention (VCLT)

Primary evidence policy:
- active situation record
- analyst profile and preferences
- Google Search Grounding
- Firecrawl
- grounded web search receipts
- uploaded documents and extracted fragments

Degraded state triggers:
- missing active situation
- missing required situation fields
- no checkable web/source receipts
- no document/source evidence for key claims

## Database Contract

- Canonical output: `users/{uid}/situations/{situationId}/tool-data/legal-tracker`
- Version history: `users/{uid}/situations/{situationId}/tool-data/legal-tracker/versions/{version}`
- Legacy compatibility: `users/{uid}/situations/{situationId}/tools/legal-tracker`
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

- Add a legal milestone
- Explain legal authority limits
- Flag missing official documents

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
