# PRAXIS Syria Graph-Grounded Research Handoff - 2026-05-03

## Purpose

This handoff records the May 3 Syria case pass so the next large update session
can start from the correct product premise:

PRAXIS should be able to conduct the same kind of specific, current,
source-backed research that an agent performs manually, but inside the app,
against a situation graph, with structured outputs that remain reusable.

The Syria workspace now presents this as a real-app capability, not a separate
demo route.

## Main Product Claim

PRAXIS is not a chat wrapper. It is a graph-grounded policy workbench.

LLMs read, search, compare, and draft. The graph stores durable structure:
actors, claims, events, commitments, source receipts, dates, contradictions,
omissions, evidence gaps, ontology tracks, and analyst-approved updates.

That separation matters because policy users need answers that can be audited,
updated, challenged, and turned into memos or briefings.

## Shipped User-Facing Surfaces

- `/app/syria-case?recording=1&case=syria`
  - Syria operating-room page.
  - Shows research receipts, neuro-symbolic architecture, live research modes,
    graph grounding pipeline, structured response contract, local media, think
    tank discrepancy workflows, commitment monitoring, and recording path.

- `/app/source-scout?recording=1&case=syria`
  - Shows available Syria live research modes.
  - Supports prompt-prefilled links with `prompt=...`.
  - Displays graph writes and the structured answer contract before a user
    spends live AI/search budget.

- `/app/deep-search-agent?case=syria`
  - Loads the Syria case context instead of falling into the no-situation state.
  - Shows the graph-grounded research contract, Syria research modes, and
    graph-memory pipeline.

- Landing page grounding section
  - Presents the neuro-symbolic moat: LLM drafting plus graph memory,
    validation, discrepancy detection, commitments, and scenario reasoning.

## Research Modes Now Modeled

The constants in `src/lib/constants/syria-demo-workspace.ts` define six
research modes that should eventually become first-class live run presets:

1. Latest-source sweep
2. Think-tank discrepancy review
3. Commitment and communique monitor
4. Local media and narrative divergence
5. Graph-grounded policy question
6. Economic and HLP scenario research

Each mode defines:

- the prompt shape;
- the source families to search;
- the graph node or edge candidates it may produce;
- the expected product output.

## Structured Response Contract

Deep research outputs should return reusable structure, not just prose:

1. Question and scope
2. Source receipts
3. Findings by confidence
4. Discrepancy table
5. Graph grounding
6. Policy implications
7. Next searches

This contract should be used when improving:

- `Source Scout`;
- `Deep Research Agent`;
- `Ask PRAXIS Live Research`;
- `Media Roundup`;
- `Commitment Monitor`;
- `Policy Memo`;
- `Briefing Studio`.

## Graph Grounding Pipeline

The app now describes the pipeline as:

1. Search
2. Extract
3. Validate
4. Stage
5. Reason
6. Draft

The implementation should converge on the same pattern:

- Search finds source receipts.
- Extraction creates candidate graph nodes and edges.
- Validation checks temporal anchors, source tiers, ontology constraints, and
  contradictions.
- GraphOps stages updates with provenance before durable graph writes.
- Tools retrieve by graph path and ontology track.
- Drafting carries source receipts, assumptions, dissent, and gaps forward.

## Why The Graph Matters

The graph is the cost and trust discipline:

- It prevents every tool from re-searching the whole world.
- It lets PRAXIS refresh only missing or stale edges.
- It separates observed facts from inferred links.
- It keeps exact statement wording and source provenance.
- It makes multi-hop policy questions possible.
- It gives analysts a review queue before graph claims become memory.
- It lets briefings cite graph paths, not only document chunks.

## Research Backbone

The app now cites a research base for the architecture:

- Microsoft GraphRAG local-to-global sensemaking.
- GraphRAG survey work on graph-guided indexing, retrieval, and generation.
- Domain-specific GraphRAG work for complex customized domains.
- Neuro-symbolic LLM reasoning surveys.
- LLM and knowledge-graph roadmap work.
- Ontology and knowledge-graph explanation work.

Do not overclaim that the production system has every research feature fully
implemented. The correct phrasing is:

- "modeled";
- "wired into the product story";
- "available as a run preset";
- "structured for live implementation";
- "staged through GraphOps before durable graph writes."

## Next Massive Session Priorities

1. Convert the research modes into a reusable `ResearchMode` type and registry.
2. Make `Source Scout` run one selected mode and return the structured contract.
3. Make `Deep Research Agent` stream phase events that map to Search, Extract,
   Validate, Stage, Reason, Draft.
4. Add graph proposal payloads to deep research outputs.
5. Add a GraphOps review card for research-generated candidate graph updates.
6. Wire `Ask PRAXIS Live Research` to optionally use the same response contract.
7. Persist source receipts and discrepancy tables as tool outputs.
8. Let Policy Memo and Briefing import a completed research run.
9. Add tests for Syria shared-case routing and no-situation fallback behavior.
10. Keep cloud spend controlled: live search only on explicit user action;
    local fixtures render without provider calls.

## Validation Already Run

For the last shipped code pass:

- `npx tsc --noEmit` passed.
- `npm run build` passed.
- Browser verification confirmed:
  - Syria case page shows neuro-symbolic and research-mode sections.
  - Source Scout shows live research modes and structured contract.
  - Deep Research Agent with `case=syria` shows the Syria research contract
    instead of the no-situation state.

