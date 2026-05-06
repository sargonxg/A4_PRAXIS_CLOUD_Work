# PRAXIS Tool Sprint Subagent Synthesis - 2026-04-30

This synthesis folds the existing six-agent audit pool into the new
tool-by-tool sprint backlog. The session could not spawn additional agents
because the subagent limit was already reached, so the active work reused the
completed agent findings from the existing pool.

## Agent Lanes Used

| Lane | Focus | How it shapes the backlog |
|---|---|---|
| UX / live browser QA | Demo flows, assistant/report failures, modal friction, system-health copy, export empty states | Prioritizes Ask PRAXIS, Report Studio, Dashboard, Export Center, Sources, and demo trust issues |
| Product / workflow strategy | First-run activation, situation health, assistant notebook, durable research, provenance exports | Adds cross-tool requirements for purpose, required questions, saved artifacts, and role/domain-aware empty states |
| AI/backend reliability | Canonical persistence, route validation before credits, grounded search receipts, stream lifecycle, Vertex agent ownership | Drives the >=10/12 AI-route baseline and persistence/source-receipt tasks |
| Security/cloud/deploy | Firebase rules drift, admin hardening, service-account keys, upload guards, cron auth, proxy identity | Adds trust-control and operator tasks for legal/research/high-cost tools |
| Trust/provenance review | False grounding claims, training-data fallbacks, arbitrary Ask PRAXIS writes, weak export provenance | Pushes ToolOutputFrame, degraded states, schema-validated writeback, and no-fake-current-claims rules |
| Landing/product credibility | Clearer promise, workflow/provenance language, security-roadmap distinction | Keeps page copy and tool purpose statements concrete and professionally defensible |

## Cross-Agent Critical Themes

1. **Every tool needs a purpose contract.**
   Users need to know why the tool exists, what decision it supports, and what
   professional artifact it produces.

2. **Every generative tool needs required-question preflight.**
   Tools should ask for missing audience, decision, time horizon, actors,
   sources, or assumptions instead of silently guessing.

3. **Every output needs provenance and confidence.**
   Tool outputs should show evidence, inference, confidence, limits, model/data
   degradation, source receipts, and export eligibility.

4. **Ask PRAXIS must become a structured editor, not only a chat layer.**
   If the user says "this stakeholder is wrong" or "move this event", Ask
   PRAXIS needs a typed writeback path with validation and confirmation.

5. **Grounded/current claims must be genuinely grounded.**
   Legal, sanctions, current-events, and research tools should never fallback
   to training-data claims while presenting them as live intelligence.

6. **Persistence must be canonical and durable.**
   Tool output should save as versioned canonical envelopes and remain
   reloadable/exportable with lineage.

7. **Visual outputs must be analytical.**
   Graphs, maps, timelines, scorecards, feeds, and drafts must reveal real
   data, uncertainty, interactions, and next actions. They cannot be decorative.

## Immediate Tool Priorities

The generated backlog ranks the first implementation queue as:

1. Conflict Graph
2. Deep Search Agent
3. Policy Memo
4. Talking Points
5. Dashboard
6. Ask PRAXIS
7. Sources Library
8. ARGUS
9. Dossier
10. Human Rights
11. Legal Tracker
12. Sanctions
13. Treaty Analyzer
14. UN Toolkit

Policy Memo and Sources Library have now started the page-surface upgrade with
registry/operating-contract visibility. Policy Memo also has the shared
confidence/provenance output frame.

## Sprint Definition Of Done

For each tool in the queue:

- page header says exactly what the tool helps the user do;
- operating contract and methodology are visible;
- loading, empty, error, degraded, and generated states are coherent;
- visualization/draft/feed/scorecard has a real analytical output;
- route accepts situation/user context and validates input;
- output saves to canonical tool data and reloads;
- Ask PRAXIS can explain and propose a structured correction;
- browser smoke covers one serious persona workflow;
- docs and backlog regenerate cleanly.

Canonical backlog:
`docs/PRAXIS_TOOL_BY_TOOL_SPRINT_BACKLOG_2026-04-30.md`
