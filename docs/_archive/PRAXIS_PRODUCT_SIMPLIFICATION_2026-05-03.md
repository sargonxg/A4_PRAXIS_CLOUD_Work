# PRAXIS Product Simplification - 2026-05-03

## Pitch-Deck Reading

The May 2026 pitch deck frames PRAXIS as a policy-document platform, not a collection of standalone analytical tools:

- "PRAXIS is where policy analysts write, and every paragraph cites a source."
- The workflow is six steps: Ingest, Structure, Query, Compare, Brief, Inherit.
- The moat is DIALECTICA: bi-temporal graph, causal edges, ontology-augmented generation, and a symbolic firewall.
- Existing tools fail because they stop at prose, folders, chunks, or static ontologies.

## Product Direction

The real app should lead with one surface:

1. The user is working on a policy document.
2. The document is grounded in a separated source library.
3. The context builder and graph create typed, source-bound structure.
4. AI runs inside the document workflow: what changed, where did this come from, what contradicts this paragraph, what graph path supports this recommendation.
5. The Boardroom sits between graph inspection and drafting: advisors can be summoned to deliberate, challenge assumptions, and synthesize a decision-ready view before the analyst edits the document.
6. Specialist tools remain available, but they are applied to the policy workspace instead of competing as primary navigation.

## App Shell Change

Default sidebar is consolidated to:

1. Desk
2. Context
3. Library
4. Research
5. Graph
6. Boardroom
7. Draft
8. Specialist Tools

The old default sidebar categories were too tool-centric: Core, Evidence, Graph, Analysis, Diplomacy. Those pages remain routable, but the user now sees a policy-document workflow.

## Dashboard Change

The dashboard now answers four product questions:

- What am I working on?
- What changed?
- Where did this information come from?
- What document should I brief, edit, or export?

The dashboard removes the crowded widget/tool-package first impression and centers:

- working document actions;
- document library and research actions;
- graph/trust backbone;
- boardroom deliberation and challenge before drafting;
- Ingest -> Structure -> Query -> Compare -> Brief -> Inherit workflow;
- executive intelligence as an optional generated layer;
- recent saved work/activity.

## Next Passes

- Move paragraph-level provenance into the WorkProductEditor. First pass shipped: section-level evidence review, suggested source basis, change-check questions, graph-grounding questions, and evidence coverage rollup.
- Make "what changed?" compare the active paragraph against source and corpus updates.
- Make Document Library explicitly separate source documents from work products.
- Convert Specialist Tools into applied actions inside Draft, Research, Graph, and Library.
- Add graph-path evidence chips to policy memo, briefing, and talking-points exports.
