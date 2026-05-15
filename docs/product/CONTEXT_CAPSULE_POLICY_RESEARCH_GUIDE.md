# ContextCapsule Policy Research Guide

Date: 2026-05-15  
Status: canonical product research and build guide

## Purpose

PRAXIS should be usable before it is complex. A user lands on the homepage, sees
the active ContextCapsule bar, describes the policy work in front of them, signs
up or logs in, then enters the app with a sidebar and an active capsule already
visible.

The deeper system can expose many tools, connectors, agents, personas, and
outputs, but the user should first experience one understandable loop:

```text
prompt -> capsule -> sources/tools -> memo/brief/handover
```

The ContextCapsule is the working policy object that makes this possible.

## Capsule Anatomy

A mature capsule should keep these cores together:

| Core | Role |
| --- | --- |
| User Core | Who is working, their mandate, audience, default style, risk posture, and red lines. |
| Situation Core | The issue, domain, jurisdiction, geography, actors, decision context, and problem frame. |
| Path Core | The working method or domain path: foreign policy, conflict resolution, HR policy, legal compliance, crisis, defence capture, public affairs, strategy, program delivery, or generic policy work. |
| Source Core | Receipts, links, datasets, uploaded files, provenance, source posture, and source gaps. |
| Document Core | Specific PDFs, DOCX, transcripts, notes, briefs, reports, policies, and extracted chunks. |
| Graph Core | Actors, claims, commitments, incentives, blockers, relationships, reviewed facts, and proposed graph changes. |
| Time Core | Validity window, episodes, deadlines, freshness checks, decision windows, and scenario horizon. |
| Tool Core | The recommended tools and allowed actions for the capsule. |
| Objective Core | What the capsule is trying to decide, produce, monitor, or hand over. |
| Product Core | The intended product family: memo, brief, map, note, board pack, run log, or handover. |
| Output Core | The exact output goal, audience, tone, format, citation posture, and export rules. |
| Memory Core | Durable tacit knowledge, caveats, reviewer preferences, decisions, open questions, and handover notes. |

The app should never force every core to be complete before work starts. It
should show completeness, gaps, and suggested next actions.

## Generic Users And Path-Bound Users

PRAXIS must support two modes:

1. Generic policy user
   - Starts with one problem, a prompt, and maybe a document.
   - The app scaffolds User, Situation, Source, Time, Tool, and Output cores.
   - The app recommends a path only after enough intent is visible.

2. Path-bound user
   - The user or workspace is associated with a policy path.
   - The path suggests default templates, tools, outputs, review gates, and
     examples.
   - The user can still override, fork, or combine paths.

The code-backed path registry lives in
`src/lib/product/context-capsules.ts` as `POLICY_PATH_PROFILES`. It currently
includes:

- generic policy worker;
- foreign policy analyst;
- conflict resolution practitioner;
- defence capture lead;
- public affairs lead;
- HR policy owner;
- legal and compliance analyst;
- crisis manager;
- strategy operator;
- program officer;
- research director.

## Personas

Personas are not just labels. A useful User Core should capture:

- role and authority;
- audience;
- writing voice;
- evidentiary threshold;
- source preferences;
- prohibited assumptions;
- allowed tools;
- escalation rules;
- recurring outputs;
- handover expectations.

Examples:

- Foreign policy analyst: prefers primary sources, diplomatic language, source
  caveats, actor/timeline framing, and options memos.
- Conflict resolution practitioner: needs actor interests, commitments,
  ripeness, spoilers, process design, and mediation risks.
- HR policy owner: needs affected groups, legal review, approval path,
  employee impact, and rollout notes.
- Legal and compliance analyst: needs source receipts, rules, exposure,
  contradictions, and review receipts.
- Crisis manager: needs fresh episodes, deadlines, escalation thresholds,
  executive updates, and handover clarity.

Users must also be able to create custom personas. A custom persona should be
stored as a user-owned User Core, not as global copy.

## Combining Capsules

Policy work often starts as one capsule and becomes a larger package. PRAXIS
should combine capsules without flattening provenance.

Combination rules:

- Preserve source receipts and document references.
- Preserve distinct timelines until aligned by review.
- Deduplicate actors, but keep aliases and unresolved conflicts.
- Keep graph changes as proposals unless reviewed.
- Separate fact, inference, recommendation, and open question.
- Keep each capsule's output goal and audience visible.
- Require human approval before external actions, sensitive exports, or
  canonical graph promotion.

The code-backed combination registry lives in
`CAPSULE_COMBINATION_RECIPES`. Current examples include HR policy plus legal
review, defence opportunity plus board brief, conflict capsule plus crisis
brief, regulatory watch plus board brief, and director handover plus crisis
brief.

## Tools And Connectors

The visible UI should not overwhelm the user with a raw tool marketplace. The
app should show many capabilities, but recommend the few that match the active
capsule.

Tool families:

- Sourceability: claim checks, citation repair, source gaps, weak evidence.
- Temporality: timeline, episodes, stale assumptions, horizon changes.
- Power dynamics: actors, approvers, blockers, incentives, influence.
- Analysis: ACH, scenario review, contradiction checks, stakeholder reads.
- Writing: memo, brief, talking points, board note, handover pack.
- Governance: review receipts, approvals, export rules, agent handover.

Connector posture:

- Live now: Library upload and grounded web search.
- Candidate: private MCP gateway and calendar/deadline monitor.
- Deferred: email digest input and browser-session fallback.

Deferred means product intent exists, but the feature should not be represented
as production-live until the runtime, approval, and audit path are implemented.

## Outputs

The app should make outputs concrete. Current output products:

- Options memo;
- Situation brief;
- Actor and power map;
- Board brief;
- Compliance note;
- Agent handover.

Each output should declare:

- audience;
- expected sections;
- citation posture;
- source requirements;
- review gates;
- export rules;
- linked capsule id;
- linked run id when generated by an agent.

## Usable App Shape

Homepage:

- show the ContextCapsule prompt bar;
- show the active bar glimpse before signup;
- show policy path examples;
- show combination examples;
- show output products and connector posture;
- route signup/login into the app with the pending prompt/template preserved.

Authenticated app:

- show sidebar with the stable spine: Home, Ask PRAXIS, Library, Memo Studio,
  Canvas, Advanced;
- show active capsule strip near the top;
- show completeness and next actions;
- let every surface read from and write to the active capsule;
- keep deeper diagnostics under Advanced.

Ask PRAXIS:

- run from the active capsule;
- recommend tools by gap;
- persist run history;
- send structured output to Memo Studio;
- never hide source gaps or review requirements.

Library:

- upload documents and source receipts;
- create Source and Document cores;
- attach them to the active capsule;
- show whether a source is attached, unattached, needs review, or demo.

Memo Studio:

- write from the capsule;
- preserve citations, caveats, and review notes;
- export only with the capsule/run provenance attached.

Canvas:

- show graph, time, sources, gaps, and relationships;
- keep extracted graph changes review-gated.

## Build Order

1. Public homepage capsule clarity
   - Active bar glimpse.
   - Signup/login path.
   - Generic and path-specific capsule examples.
   - Combination, connector, and output previews.

2. Authenticated shell
   - Sidebar visible.
   - Active capsule strip visible.
   - Home shows current capsule, gaps, and next actions.

3. Capsule registry
   - Code-backed policy paths, outputs, connectors, and combination recipes.
   - Unit tests for references and registry coherence.

4. Capsule creation
   - Create from prompt, template, upload, or copied demo.
   - Store user-owned cores.
   - Mirror active capsule into the default context stack.

5. Tool recommendation
   - Recommend tools from capsule gaps.
   - Keep raw tool marketplace available but secondary.

6. Runtime and audit
   - Persist runs, tool calls, approvals, trace ids, and outputs.
   - Stream run steps where possible.
   - Gate external actions.

## Documentation Rule

This guide is product research and build direction. The code-backed source of
truth for concrete capsule paths, outputs, connectors, and combinations is:

```text
src/lib/product/context-capsules.ts
```

When adding a new policy path, output, connector, or combination recipe, update
that file and its unit tests first, then update this guide if the product model
changes.
