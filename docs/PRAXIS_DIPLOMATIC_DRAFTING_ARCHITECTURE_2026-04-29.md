# PRAXIS Diplomatic Drafting Architecture

Date: 2026-04-29

## Purpose

PRAXIS writing tools must behave like a serious policy production system, not
like disconnected chat prompts. The target artifact family includes policy
memos, decision memos, diplomatic cables, legal briefs, non-papers, demarches,
communiques, Security Council products, talking points, treaty analysis, and
implementation trackers.

## Reference Pattern Studied

The `willchen96/mike` repository is a legal-document workspace with a useful
production pattern:

- documents and versions are first-class records;
- chat is project/document aware;
- workflows are reusable prompts with stable IDs;
- generated artifacts are persisted;
- citations and document events are structured;
- the UI renders durable events rather than assuming every AI route streams
  free text.

PRAXIS should adopt the architecture pattern, not the legal product verbatim.
For statecraft, the same production discipline applies to diplomatic cables,
policy memos, non-papers, aide-memoires, legal notes, and Council documents.

## Implemented This Wave

- Added `src/lib/ai/diplomatic-drafting-service.ts` as a shared drafting
  contract layer.
- Added a reusable diplomatic artifact mode enum covering policy, legal, and
  diplomatic document classes.
- Added shared situation resolution so routes can accept either:
  `situationId`, embedded `situation`, or legacy `situationData`.
- Added shared evidence prompt construction across web context, graph context,
  situation record, and user-provided working context.
- Added a mandatory drafting audit contract:
  source use, confidence note, limits, and follow-up research.
- Rewired `policy-memo` so the route now produces the exact structure the page
  renders, saves under the legacy-compatible `policy_memo` key, and includes
  source/confidence audit fields.
- Rewired `talking-points` so the page calls the structured route correctly,
  renders JSON output as Markdown, and stops treating the endpoint as a stream.

## Architectural Direction

1. Centralize AI route contracts.
   Every route should share validation, situation resolution, evidence context,
   calibration, model fallback, persistence, and audit metadata.

2. Treat writing outputs as artifacts.
   Each generated output needs a type, version, timestamp, input context,
   source-use record, confidence note, and export-ready payload.

3. Separate artifact production from UI rendering.
   Routes should return typed JSON. Pages should render that schema. Streaming
   should be used only where the UI is explicitly designed for streaming.

4. Build a diplomatic workflow library.
   The next layer should add reusable workflow templates for:
   policy memo, decision memo, diplomatic cable, demarche, non-paper,
   communique, legal brief, treaty clause review, implementation checklist,
   sanctions exposure note, and Council briefing.

5. Make documents and generated drafts reusable inputs.
   Generated artifacts should feed Ask PRAXIS, Export Center, Brief Builder,
   Red-Team Review, and future document versioning.

## Next High-Impact Work

- Move more AI routes to `diplomatic-drafting-service`:
  `un-toolkit`, `legal-tracker`, `treaty-analyze`, `dossier-generate`,
  `briefing-generate`, `report`, and `resolution`.
- Add a unified `/api/ai/diplomatic-artifact` route for all writing modes.
- Add generated document records for finished artifacts, not only tool output
  blobs.
- Add a citation/source fragment renderer shared by Policy Memo, Talking
  Points, UN Toolkit, and Export Center.
- Add route-contract tests that assert every page sends the schema the route
  expects.
