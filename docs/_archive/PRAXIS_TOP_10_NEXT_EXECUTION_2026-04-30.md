# PRAXIS Top 10 Next Execution List - 2026-04-30

This is the current top-10 engineering and product list after the tool operating
contracts, workflow paths, context blueprints, generated tool docs, admin checks,
and dashboard context-backbone work.

## 1. Make Context Blueprints Automatic In Every AI Route

Status: in progress.

Why it matters: every calibrated AI tool should understand its operating
contract, required context layers, canonical data path, graph mode, provenance
policy, and document-production lane without every route author remembering to
paste those instructions.

Acceptance:

- `withCalibration()` appends the canonical tool operating contract.
- `withCalibration()` appends the canonical tool context blueprint.
- Snake-case route ids such as `policy_memo` resolve to registry ids such as
  `policy-memo`.
- Unit test proves the enrichment is present.

## 2. Finish Canonical Tool Output Migration

Status: next.

Make `saveToolOutput()` and `saveToolData()` the only persistence lanes. All
client reads, export reads, SKC reads, and Ask PRAXIS writebacks should prefer
`tool-data/{toolId}` and use `tools/{toolId}` only as temporary compatibility.

## 3. Add Typed Ask PRAXIS Writeback Adapters

Status: next.

Create adapters for graph, timeline, draft, scorecard, source, and workspace
patches. Ask PRAXIS must ask missing required questions, show the proposed
patch, then write structured updates after confirmation.

## 4. Promote The Active P0 Tool Pages

Status: next.

Apply shared page/contract/output-frame treatment to Conflict Graph, Deep Search
Agent, Situation Intelligence, Source Scout, Talking Points, Dashboard,
Assistant, Report Studio, and Sources Library.

## 5. Build The Document Export Adapter

Status: next.

Render saved structured outputs into DOCX/PDF/LibreOffice-compatible sections
without a second model call. Start with Policy Memo, Talking Points, Briefing,
Dossier, UN Toolkit, Treaty Analyzer, and Legal Tracker.

## 6. Strengthen Source-Grounded Research

Status: next.

Make grounded Google Search and crawler receipts the primary live research path.
GDELT, UCDP, ReliefWeb, HDX, World Bank, and other datasets stay as corroborating
layers, not the main trust surface.

## 7. Build The Context Certainty Model

Status: next.

Create a reusable certainty score for actors, names, stakeholder claims,
episodes, source fragments, and graph edges. Every tool should know which
entities are verified, inferred, ambiguous, or stale.

## 8. Make The Demo Situation A Showcase

Status: next.

Demo should show a full operating picture: sources, documents, actor dossiers,
timeline, graph, media narrative, policy memo, talking points, and export.
Synthetic demo content must stay clearly labelled and never leak into real user
situations.

## 9. Harden Admin/Operator Surfaces

Status: started.

Admin access now has a local check and richer `/api/admin/me`. Next: show
tool-run error rates, recent failed AI routes, data-ingestion status, and current
deployment revision in one operator console.

## 10. Prepare The Dialectica Graph Backbone

Status: planned.

Keep current ACO graph reads/writes working, but stage the future premium layer:
ontology-governed graph retrieval, contradiction tracking, graph proposals,
approval workflow, and cross-situation pattern reuse.

## Current Rule

Do not spread across all future domains yet. Make the generic core plus
Conflict / Political Analyst path excellent first, then activate the remaining
paths with the same architecture.
