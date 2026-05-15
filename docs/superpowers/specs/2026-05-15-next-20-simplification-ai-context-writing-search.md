# Next 20 Improvements After Capsule Composer

Date: 2026-05-15
Status: Planning queue
Owner: Codex with Giulio

This queue starts after the current capsule/core composer work. It does not
replace the active simplification plan. The rule for every item is the same:
keep the visible app smaller, make Ask PRAXIS more powerful, make context
creation and combination real, and move work smoothly into drafting, writing,
and search.

## Guardrails

- Do not add new primary navigation. Keep `Home`, `Ask PRAXIS`, `Library`,
  `Memo Studio`, `Canvas`, and `Advanced`.
- One dominant action per screen. Extra power belongs in `Work on this`, slash
  commands, command palette, or Advanced.
- Context is the product object. Every Ask answer, source search, memo draft,
  and handover should know which User Core, Situation Core, Source/Document
  Core, Graph Core, Time Core, and Output Core it used.
- AI should feel stronger through better routing, retrieval, provenance,
  memory, critique, and drafting loops, not through more visible buttons.

## Batch A: 10 More Improvements

| # | Improvement | User result | Hidden power | Validation |
|---|---|---|---|---|
| A1 | Context Intake Wizard inside Library | User drops files or links and gets one clean "Create context" action. | Auto-classify document type, actors, claims, dates, source tier, jurisdiction, and target core attachment. | Upload PDF/DOCX/TXT/link, verify created source receipts and attached document IDs. |
| A2 | Context Combination Engine | User can combine two or more capsules into one working capsule. | Merge core refs, dedupe sources, mark conflicts, preserve parent capsule lineage. | Unit test merge/dedupe/conflict output; UI smoke for "Combine contexts". |
| A3 | Ask PRAXIS Thread Memory per Capsule | Ask remembers prior questions for the active capsule without polluting other contexts. | Persist thread summaries, commitments, preferences, and unresolved gaps under capsule scope. | Ask twice in same capsule, switch capsule, verify memory isolation. |
| A4 | Source Search Everywhere | A single search box can search Library, active capsule sources, graph nodes, and previous memos. | Route query through corpus search, source receipts, memo index, and graph labels with ranked results. | Search known source phrase and known memo phrase from Home, Ask, and Memo Studio. |
| A5 | "Find Sources for This Claim" | User highlights a claim and gets supporting, weak, or contradicting sources. | Claim check calls `searchSituationCorpus`, active graph paths, and grounded search when local evidence is thin. | Highlight unsupported sentence, verify evidence-gap status and source suggestions. |
| A6 | Memo Studio Slash Commands v1 | Writing surface feels like a serious editor, not a form. | `/cite`, `/ground`, `/rewrite`, `/red-team`, `/summarize`, and `/next-questions` call calibrated AI routes with capsule context. | Keyboard smoke for each slash command; route audit confirms `withCalibration`. |
| A7 | Draft From Active Context | User chooses memo/talking points/brief and gets a structured first draft from the current capsule. | Output Core selects template, evidence posture, source style, and audience. | Generate all approved templates from one capsule and verify citations/gaps. |
| A8 | Context Health Next Actions | User sees only the top 3 missing context fixes. | Deterministic health rules propose the smallest fixes before AI expands them. | Regression test max 3 visible actions and correct priority order. |
| A9 | Tool Router Receipts in Ask | Ask shows small chips for tools it used, without exposing a tool marketplace. | Persist tool calls, model route, evidence pack, and latency as receipts for review. | Ask that triggers search/check-claim, verify tool receipt exists and is inspectable. |
| A10 | One-Click Handover Note | User can convert a context plus draft state into a concise handover. | Bundle capsule version, unresolved gaps, key sources, draft status, next moves, and audit receipts. | Create handover from Memo Studio and verify capsule version/source count included. |

## Batch B: 10 More After That

| # | Improvement | User result | Hidden power | Validation |
|---|---|---|---|---|
| B1 | Multi-Capsule Comparison | User compares two contexts side by side in one compact view. | Diff core refs, sources, graph claims, timeline posture, assumptions, and output goals. | Compare two capsules and verify changed sources/claims/time horizon are explicit. |
| B2 | Context Version Timeline | User can see how a context changed without learning the backend. | Immutable capsule versions with labels, author, reason, and source delta. | Lock/swap/fork capsule and verify timeline entries and version snapshots. |
| B3 | Search-To-Context Save | Search results can become source receipts or context gaps in one click. | Convert retrieval hits into Source Core attachments, gap records, or memo citations. | Search external/local result, save to active capsule, verify Library and Ask use it. |
| B4 | AI Research Plan Before Long Runs | Ask proposes a short research plan before expensive/deep work. | Planner selects search, graph, source, drafting, and critique stages with budget guardrails. | Deep query returns plan, user approves, receipts show staged execution. |
| B5 | Writing Critic Rail | Memo Studio has a collapsible reviewer for unsupported claims, tone, length, and missing audience fit. | Critic runs claim check, audience/output-core check, citation coverage, and cautious rewrite suggestions. | Draft known weak memo, verify issues and accept/reject actions. |
| B6 | Personal Writing Style Core | User can reuse preferred memo style across situations. | Output/User Core stores tone, structure, citation preference, banned phrases, and audience defaults. | Save style from one memo, generate another, verify style metadata applied. |
| B7 | Context Templates for Common Work | User starts with "UN briefing", "mediation memo", "regulatory scan", or "conflict forecast". | Template preloads needed core types, health rules, source categories, and output shape. | Start from each template and verify required core checklist differs correctly. |
| B8 | Contradiction Finder | User asks "what disagrees with this?" and gets explicit counter-evidence. | Retrieval ranks contradiction candidates across local sources, graph claims, and grounded search. | Seed conflicting source snippets, verify contradiction result cites both sides. |
| B9 | Draft Export With Evidence Annex | Exported DOCX/PDF includes the memo plus a clean evidence annex. | Exporter packages citations, source receipts, unsupported claims, capsule version, and audit trace. | Export a memo and inspect annex fields for source IDs and capsule version. |
| B10 | Advanced AI Run Console | Admins can inspect AI/search/drafting runs without exposing complexity to normal users. | Unified run log for Ask, search, claim check, draft generation, export, and handover. | Trigger Ask/search/draft, verify Advanced shows route, status, evidence pack, and errors. |

## Recommended Ship Order

1. Finish the current capsule/core composer.
2. Ship A1, A2, and A8 together: create, combine, and health-rank context.
3. Ship A4, A5, and A9 together: search, claim evidence, and Ask receipts.
4. Ship A6, A7, and A10 together: writing commands, draft generation, and
   handover.
5. Ship B1, B2, and B3: context comparison, versions, and search-to-context.
6. Ship B4 through B10 as the deep-power layer once the basic flow is stable.

## Acceptance Standard

The user should be able to do this without leaving the simple app spine:

1. Create a context from files, links, or existing cores.
2. Combine it with another context.
3. Ask PRAXIS with that exact context.
4. Search for supporting or contradicting evidence.
5. Draft a memo from the same context.
6. Export or hand over the work with citations, gaps, capsule version, and
   receipts intact.

