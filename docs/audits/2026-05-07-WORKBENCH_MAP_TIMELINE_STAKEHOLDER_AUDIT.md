# Workbench Map, Timeline, And Stakeholder Audit - 2026-05-07

Scope: codebase audit for the user-facing workbench, with emphasis on how the graph tab should explain the situation through map, timeline, policy/conflict structure, stakeholder analysis, tools marketplace handoff, dashboard signals, and Cognee memory architecture.

## Executive Summary

The workbench already has the preserved four-tab/seven-chapter structure and a real graph renderer with oval, force, timeline, and map layouts. The remaining gap was interpretability: users could inspect the graph, but the app did not explain how the map should be read, how the timeline relates to the case, how stakeholders are structured, or how Cognee and marketplace tools consume the case context. This pass adds a first coded graph-intelligence layer and expands the audit gate so the new surface stays part of the workbench contract.

## Findings

| ID | Severity | Area | Finding | Status |
| --- | --- | --- | --- | --- |
| WB-GRAPH-001 | S1 | Graph tab | The graph tab rendered the visualization but lacked adjacent explanatory panels for map, timeline, stakeholder analysis, and case anatomy. | Fixed in `GraphIntelligencePanels`. |
| WB-MAP-001 | S1 | Map | The map was technically available through the layout toggle, but users were not told when points are derived schematic anchors versus evidence-grade coordinates. | Fixed with "How The Map Should Work" panel. |
| WB-TIME-001 | S1 | Timeline | Timeline data existed through `toTimelineItems`, but the graph tab did not summarize event range, key dates, or the purpose of the chronology. | Fixed with "How The Timeline Should Work" panel. |
| WB-STAKE-001 | S1 | Stakeholders | Actor lists existed in context, but the graph tab did not expose a stakeholder matrix by party, institution, mediator, external actor, public constituency, or unknown role. | Fixed with deterministic stakeholder profiling. |
| WB-ANATOMY-001 | S1 | Case structure | The app did not explain whether the situation is a policy file, conflict arena, mediation matter, or generic structured situation inside the graph workspace. | Fixed with policy/conflict anatomy panel. |
| WB-COGNEE-001 | S2 | Cognee | Cognee architecture is documented and backend-isolated, but the graph UI did not tell users that Cognee creates candidates while Postgres remains canonical. | Partially fixed in UI copy; live Cognee execution remains production work. |
| WB-MKT-001 | S2 | Tools marketplace | Marketplace tools consume context, but the graph surface did not show the handoff from graph/context into tools. | Partially fixed in UI copy; deeper run-history/dashboard linkage remains future work. |
| WB-DASH-001 | S2 | Dashboard | Dashboard health signals were not consolidated around graph readiness, stakeholder completeness, map/timeline posture, and next marketplace action. | Partially fixed with dashboard case-readiness strip; Cognee queue state remains follow-up. |

## Implemented This Pass

- Added `src/components/workbench/graph/GraphIntelligencePanels.tsx`.
- Wired the component into `WorkbenchGraphPanel` beside the existing `PraxisGraphView`.
- Added map interpretation, timeline interpretation, stakeholder analysis, policy/conflict anatomy, and Cognee/GraphRAG/marketplace handoff panels.
- Added a dashboard case-readiness strip for map posture, timeline posture, stakeholder posture, and marketplace posture.
- Updated `scripts/audit-workbench.ts` to require the new graph intelligence contract.

## Remaining Work Queue

1. Dashboard consolidation: add live Cognee queue health, source receipt freshness, and recommended marketplace action once those live endpoints are production-ready.
2. Map upgrade: promote real coordinates from source receipts and Cognee candidates into graph node proposals, with review-gated canonical writes.
3. Timeline upgrade: add user-created milestone editing and source-linked event promotion from Library/Research into Graph.
4. Stakeholder depth: let users refine lane, interests, constraints, leverage, and relationships directly from the stakeholder panel.
5. Marketplace handoff: show which tools will benefit from the current graph and which context gaps keep a tool in "Needs more sources".
6. Cognee live readiness: keep Cognee disabled-safe until the isolated service is deployed, then surface recall/cognify latency, queued writes, and candidate counts in the app dashboard.

## Verification Targets

- `npm run audit:workbench`
- `npm run audit:workspace-tabs-chapters`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `graphify update .`
