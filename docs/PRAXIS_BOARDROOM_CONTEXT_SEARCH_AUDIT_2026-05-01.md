# PRAXIS Boardroom, Context, and Search Audit

Date: 2026-05-01  
Branch: `main`  
Repository: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

## Objective

Make PRAXIS work as a real user app, not a demo shell. The immediate product
bar is:

1. New users can create a situation, understand what context is missing, and
   get useful AI output without seeing demo content.
2. Returning users can resume an old situation with preserved context,
   source receipts, graph state, saved tool outputs, and advisor memory.
3. The four flagship experts are visible as real, differentiated agents with
   distinct methods, source diets, tool access, memory, and future graph layers.
4. The architecture remains ready for a premium Dialectica backbone at
   `dialectica.tacitus.me`.

## Research Inputs

Current agent and graph-RAG practice supports the direction PRAXIS is already
taking:

- Anthropic's agent architecture guidance emphasizes modular agents, explicit
  tool contracts, memory, observability, and multi-agent systems when a task
  requires specialized expertise or parallel analytical directions.
  Source: https://resources.anthropic.com/hubfs/Building%20Effective%20AI%20Agents-%20Architecture%20Patterns%20and%20Implementation%20Frameworks.pdf
- Microsoft AutoGen frames multi-agent systems as composable agents that can
  converse, use tools, include human input, and follow flexible conversation
  patterns.
  Source: https://www.microsoft.com/en-us/research/publication/autogen-enabling-next-gen-llm-applications-via-multi-agent-conversation-framework/
- Microsoft GraphRAG combines text extraction, graph construction, network
  analysis, prompting, and summarization so private corpora can support
  questions beyond simple document lookup.
  Sources:
  https://www.microsoft.com/en-us/research/project/graphrag/
  https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/
- Google ADK describes multi-agent systems around hierarchies, workflow
  orchestrators, shared session state, delegation, explicit invocation,
  parallel fan-out/gather, review/critique, and human-in-the-loop patterns.
  Source: https://adk.dev/agents/multi-agents/

Implication for PRAXIS: the app should keep simple tasks cheap and direct, but
make strategic boardroom work explicit, observable, source-grounded, and
graph-ready.

## Local Graphify Context

The existing `graphify-out/GRAPH_REPORT.md` was also reviewed. The latest local
graph reports 909 files, roughly 986k words, 3,170 nodes, 3,896 edges, and 110
communities. That confirms the repository is already large enough that future
work should keep relying on graph navigation and architecture docs rather than
ad hoc file browsing alone.

## Shipped In This Round

### Four Expert Capability Contract

`src/lib/constants/advisors.ts` now exposes safe public capability metadata for
each flagship expert:

- practical reasoning method
- boardroom role
- visible tool access
- visible data diet
- Dialectica-ready graph layer

The Firestore advisor config remains authoritative for persona, model tier,
source categories, server-side tool allowlist, and memory policy. The public
registry is intentionally a product-facing explanation layer, not a trust
boundary.

### Landing Page Alignment

`src/components/landing/advisory-council.tsx` now presents each advisor as a
working agent: role, method, tool access, data access, and graph layer are shown
in the modal. The landing section also names the future Dialectica dynamic
ontology connection rather than describing the graph as a generic memory
feature.

### Authenticated App Alignment

`src/components/advisory/advisor-picker.tsx` now reuses the same public
capability registry beside the live Firestore advisor config. Authenticated
users see:

- the advisor's boardroom role
- tools the advisor is designed to use
- source categories from the live server config
- the future graph ontology layer
- the actual model tier and server-allowed tools

This closes a credibility gap: the real app now substantiates the landing-page
claim that the experts are differentiated, structured agents.

### Regression Coverage

`tests/unit/lib/constants/advisors.test.ts` now verifies that the four public
advisors stay aligned with `ADVISOR_IDS` and each has non-trivial capability
metadata.

## Audit: What Works Now

### New User Path

Strengths:

- Real users without an active situation now receive neutral setup/context
  prompts, not Nordalia demo prompts.
- Situation creation collects richer context: description, sources, notes,
  custom source hints, workflow path, language, and date preferences.
- The dashboard and tools workspace show missing context and readiness gaps.

Remaining gaps:

- The user still needs a stronger first-run "build my context" flow that asks
  for the minimum viable case file and then runs Source Scout, graph extraction,
  and first advisor setup as a guided sequence.
- The app should show a clear separation between "profile context", "situation
  context", "source context", "graph context", "tool outputs", and "advisor
  memory" in one place.
- First-run AI should explain what it can and cannot know from the current
  situation rather than only answering the prompt.

### Returning User Path

Strengths:

- Advisor chat has rolling summary and recent-turn recall.
- Tool outputs are persisted with freshness/staleness warnings.
- Context health and package readiness now surface across dashboard/tools.

Remaining gaps:

- Returning users need a "what changed since last session" digest: new source
  receipts, stale outputs, graph changes, unresolved advisor questions, and
  suggested next moves.
- There is no single situation timeline that unifies user edits, uploaded
  documents, generated tool outputs, source scouts, graph mutations, and advisor
  deliberations.
- Old situations should be migratable into newer context schemas with visible
  upgrade status.

### Search And Data

Strengths:

- `buildLiveSourcePack()` normalizes source receipts and injects a source audit
  into calibrated AI prompts.
- Source Scout saves provider counts, scrape coverage, URL checkability, and
  confidence metadata.
- Tool prompts receive richer situation-specific context.

Remaining gaps:

- Search needs a visible query plan: what was searched, why those queries were
  chosen, which sources were accepted/rejected, and what remains missing.
- Source receipts should be clickable from every AI answer, not only from some
  tool surfaces.
- The app should distinguish live web search, scraped pages, uploaded
  documents, structured datasets, and graph-derived facts in the UI.
- Search should become iterative: advisor asks a source question, user approves
  or edits the search plan, source receipts are added to the situation, then
  the advisor reruns with better context.

### Dynamic Boardroom

Strengths:

- Four Firestore-backed advisors exist with distinct personas, model tiers,
  source categories, tool allowlists, and memory policies.
- `/api/ai/advisor-chat` can build advisor-specific briefings and store turns.
- Panel summary and devil's-advocacy actions exist.

Remaining gaps:

- The boardroom needs a visible deliberation mode: user chooses a question,
  each advisor produces a position, a chair synthesizes, and the user can ask
  for dissent, confidence, or next evidence.
- Expert disagreement should be structured, not blended away. Recommended
  schema: `position`, `supportingEvidence`, `assumptions`, `risks`,
  `counterargument`, `sourceNeeds`, `actionableNextStep`.
- The app should support effort levels: one advisor, quick four-advisor scan,
  full boardroom, and deep boardroom with source-refresh.
- Every boardroom run should produce a saved artifact with source receipts,
  graph references, advisor turns, and synthesis.

## High-Impact Improvement Queue

1. Build a guided "Context Builder" page that walks a user from blank situation
   to usable case file.
2. Add a Situation Memory page with profile, sources, documents, graph, tool
   outputs, advisor memory, and freshness in one place.
3. Add a Boardroom Run artifact model: question, advisors, turns, synthesis,
   dissent, source receipts, graph references, and user decisions.
4. Add a search-plan UI before expensive live research: proposed queries,
   target source classes, source whitelist, exclusions, and user edits.
5. Add source-receipt chips to all AI-generated answers and advisor messages.
6. Add "what changed since last session" for returning users.
7. Add context schema migrations for older situations.
8. Add advisor-level tool invocation visibility: what each expert used, what it
   refused to use, and what data gap remains.
9. Add Dialectica connection interfaces behind a premium feature flag:
   ontology registry, graph export/import, graph query adapter, and
   analyst-approved mutation queue.
10. Add boardroom evaluation metrics: citation coverage, evidence diversity,
    unresolved assumptions, dissent quality, and actionability.

## Dialectica Backbone Readiness

The current PRAXIS design should treat Dialectica as a premium graph substrate,
not a replacement for local Firestore context. The target integration shape is:

- PRAXIS remains the user workspace: situations, sources, tools, advisor
  interactions, and user decisions.
- Dialectica provides dynamic ontologies and graph reasoning for premium
  situations.
- Each advisor binds to a specific graph layer:
  - Adeyemi: actors, interests, constraints, legitimacy, spoilers
  - Reyes: incidents, capabilities, control, logistics, escalation
  - Vanderberg: revenue, sanctions, aid, commodities, patronage
  - Takeda: clauses, commitments, precedents, ambiguity, legal effects
- Graph mutations are proposed by tools/agents, reviewed by the analyst, then
  written to the premium graph.
- Boardroom outputs cite both ordinary source receipts and graph node/edge
  receipts.

## Acceptance Bar For The Next Round

The next major implementation should be considered successful when a new user
can:

1. create a real situation,
2. add enough context to understand what PRAXIS knows,
3. run at least one useful source-grounded tool,
4. ask at least one expert a situation-specific question,
5. save the result as part of the situation memory,
6. return later and understand what changed, what is stale, and what to do next.
