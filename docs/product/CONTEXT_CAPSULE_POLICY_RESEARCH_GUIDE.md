# ContextCapsule Policy Research Guide

Updated: 2026-09-30
Status: current user guide followed by a clearly separated product research appendix

## Purpose

PRAXIS helps policymakers, analysts and narrative researchers turn a question
and relevant sources into writing they can inspect and revise. Start with the
work you need to produce. Add saved context when the work needs the same sources,
assumptions or analytical approach again.

A **Context Capsule** saves the sources, assumptions and analytical approach
you want PRAXIS to reuse. Saving one does not independently verify its contents.
The working loop is:

```text
Ask -> attach or build context -> inspect evidence -> revise and save the work
```

The primary signed-in surfaces are **Home** and **Capsules**. Library, writing,
recent drafts and source review open within the existing workspace. They are not
additional primary applications.

The [production acceptance record](../reviews/2026-09-29-praxis-production-acceptance.md)
identifies the tested live release. The
[implementation ledger](../reviews/2026-09-30-praxis-implementation-ledger.md)
tracks this improvement wave; a planned or locally tested capability is not
automatically deployed. The May research appendix below is design context, not
a list of currently available features.

## Working loop for analysts and policymakers

1. In **Home**, ask a direct question or describe the written product you need.
   State the audience, decision and as-of date when relevant. A quick question
   can start without a capsule.
2. Attach saved context when its evidence applies. Check the visible capsule
   name and version before sending. Say whether to use only attached material
   or to collect outside sources; these are different research scopes.
3. Inspect the answer's sources, assumptions and gaps. A citation or a generated
   confidence label does not establish that the original source supports the
   claim. Follow up on a specific uncertainty or ask for a shorter/different
   audience version while retaining the evidence.
4. Save useful writing as a draft, reopen it and continue revising. Treat
   generated analysis as reviewable work rather than an approved conclusion.

Example: “Draft a one-page options brief for the council as of 30 September.
Use only the attached documents. Separate agreed commitments from completed
implementation, cite supporting passages and keep unconfirmed funding explicit.”

Deep research collects additional material and may require an approval before
the queued work proceeds. Check the proposed scope and later inspect what was
actually used. Model/provider receipts describe actual execution; configured
model choices and unavailable/fallback states must remain explicit. The new
server routing distinguishes **Economical recall and extraction**, **Balanced
analysis** and **Complex synthesis and review**. Complexity does not override
your restriction to supplied context or grant agent/web permission. Preview
models may need an explicit bounded fallback; inspect what actually ran. Local
implementation and real-provider/live access remain separately tracked in the ledger.

## Build and reuse context separately

Start in **Capsules** when you want a reusable working file independently of a
question. The builder's default path is **Purpose → Material → Review and save**;
advanced and package configuration remain separate:

1. Give it a readable name, purpose and intended product. Record the audience,
   policy scope and decision date when relevant.
2. Add documents, notes or source links. Keep instructions such as “use a
   diplomatic tone” separate from factual evidence and actor quotations.
   Uploaded TXT, text-based PDF and DOCX passed the recorded live journeys;
   scanned PDF/OCR and long-document capacity require separate proof.
3. Inspect original extracts and proposed claims. Apply or reject proposals
   with a reason. Keep rejected claims and unresolved questions visible rather
   than converting them into verified facts.
4. Choose **Save draft** to retain private working context. **Save and use in Ask**
   saves the current supported snapshot before attaching it. Check that Home
   shows the intended saved capsule before sending. After editing a saved
   snapshot, save the changes rather than attaching the older version. A package
   export/publish control has a different scope from a private save: timeline,
   causal, ontology and graph package proposals require their explicit review
   and publication path. Tool preferences do not grant execution permission;
   source-domain preferences guide prompts rather than guarantee a web filter.
5. Ask for a fact or product that depends on the saved context. Check the
   supporting passages, then reopen the capsule and conversation to reuse it.

A capsule built from a conversation can preserve working notes and supplied
material, but extracted claims still need review. Adding the same source as TXT,
PDF and DOCX preserves formats; it does not create three independent witnesses.

For another policy situation, preserve the original evidence and deliberately
create or revise context with a new scope/as-of date. Do not carry an old
assessment into a new case without reviewing what still applies.

Library search and facets describe the loaded inventory. Use **Load more** for
further saved-capsule pages and **Show more** for additional visible cards; a
loaded count is not necessarily the total library size. Starter templates,
private saved context and archived records have separate filters. A copied
capsule is private working context; archived attachments need to be detached
before archiving. Structure completeness is not factual quality, and an
unperformed support assessment should remain **Not assessed**.

The new ingestion path enforces a 20 MiB file limit, a 600 KiB extracted UTF-8
text limit and a 512-chunk limit. A file within its byte limit can still exceed
the extracted-text/chunk limit. Empty text/OCR-needed and indexing failure are
different outcomes; keyword-only retrieval is not a completed embedding claim.
Check deployment and real-service proof for these new controls in the ledger.

## Inspect evidence and uncertainty

For each material assertion, identify the source, the exact supporting passage,
its date and whether the assertion is supplied fact, actor claim or your own
interpretation. An attributed web grounding summary is generated text; it is
not a verified quotation from the original page. If the original source cannot
be inspected, leave that limitation explicit.

Use the right kind of source for the claim. An institution's general guidance
can support a definition; it cannot establish facts about a private case. An
independent news article is not automatically an institutional audit standard.
When you request two institutional sources, two links or two generated summaries
do not by themselves fulfil that requirement.

Keep these distinctions in the written product:

- A commitment or an authorization does not establish implementation.
- A budget allocation or funding approval does not establish actual spending.
- Unconfirmed funding does not prove no spending occurred.
- A future deadline does not establish whether a review has started or finished.
- Missing evidence remains unknown; it is not proof that an event did not happen.
- Operational implementation does not by itself establish the intended outcome.

## Review and revise a written product

Open the saved memo, review the primary body and inspect source material for
important claims. Apply corrections to the body, save, then reopen to confirm
the intended text persisted. Feedback labeled “not applied” has not changed the
body. A supported selected claim does not approve the whole memo; editing makes
the earlier body review outdated.

Whole-draft approval identifies the exact saved version/body, reviewer, intended
use and remaining limitations. The new local implementation binds approval to
that saved body, clears it on edits and checks it again before reviewed Markdown
or Word export. Internal analysis, external sharing and publication are distinct
uses. Export retains the use and limitations, and records an owner review rather
than independent verification. Word currently preserves body text in paragraphs;
native Markdown heading/table/link formatting remains separate acceptance work.
Check the ledger for deployment and live proof before relying on this new path.

Before using a brief, check its audience, decision question, options/tradeoffs,
evidence, assumptions, uncertainty and next action. Before using a narrative
analysis, check the exact actor wording and source/corpus limitations.

## Allowance and account control

New accounts receive a finite one-time starter allowance, equivalent to up to
100 Ask turns if used only for Ask. Other metered work shares it; the account
remaining is the relevant figure. The beta does not promise an automatic monthly
refill, and proposed paid plans do not establish active entitlements. Exhausted
allowance needs a funded plan/support resolution; repeatedly retrying does not
restore it. A transient datastore failure is a different, retryable outcome.

Self-service erasure is gated until storage access controls are verified. When
enabled, a renewing subscription must be cancelled first; partial cleanup stays
pending for retry. Workspace cleanup does not imply deletion of every provider,
backup, billing or shared record. Review the [retention posture](https://praxis.tacitus.me/legal/data-retention)
and request a scoped status through support.

## Assess analytical quality

The [quality-evaluation runner](../reviews/2026-09-30-praxis-quality-evaluation.md)
retains matched baseline/context-framed prompts, model outputs and an unscored
analyst rubric. Its eight synthetic cases test important distinctions, including
allocation versus expenditure, narrative perspective versus authority and
contradictory measures. Local provider access was unavailable, so no generated
benefit or independent analyst judgment is claimed. This limited prompt
comparison is separate from a full deployed capsule journey or user study.

## Useful policy and narrative requests

| Job | Example request | What to review |
| --- | --- | --- |
| Policymaker | “Compare three options for this decision. Identify legal authority, implementing institution, resources, political constraints, affected groups and unresolved evidence. End with the decision required.” | Feasibility, tradeoffs, mandate versus implementation, and whether evidence supports the recommendation. |
| Analyst | “Build a claims/evidence table from these documents. Separate supporting and conflicting passages, assessment and confidence limitations. State what evidence would change the assessment.” | Source independence, counterevidence, timing and analyst inference. |
| Narrative researcher | “Compare how these actors frame the issue. Preserve exact quotations, speaker/date/location, intended audience when evidenced, and distinguish observed language from inferred intent. Explain missing voices and alternative readings.” | Quotation accuracy, attribution, translation/sampling limits, and whether a small corpus is being mistaken for public opinion. |

These requests are working patterns, not a claim that every template or
visualization is already deployed. Representative-user usability and measured
analytical improvement remain unproven. Structural capsule scores do not measure
whether an analyst's conclusions became more accurate.

## Availability and help

The previously tested existing-account paths work; fresh signup/recovery,
two-account switching, billing, capacity, erasure and institutional services need
their own acceptance evidence. Paid upgrades remain unavailable until configured
billing and entitlement gates pass. Use the published privacy/security/retention
pages for current declarations and the ledger for verified versus pending work.

If a save, upload or retrieval fails, inspect the reported state and retry only
after checking what was saved. Keep unresolved source/indexing gaps explicit.
Report the action, time and a redacted run reference where available; do not
include private documents implicitly in a support report.

## Product research appendix — May 2026

The remaining sections preserve research and target contracts from May 2026.
They do not override the current Home/Capsules structure or establish deployed
connectors, outputs, expert review, schedules, model access or measured benefits.
Consult the implementation ledger and exact-source acceptance before making a
capability claim. Code-backed registries describe available definitions; a
definition alone is not end-to-end acceptance.

## PRAXIS Augmented Generation Contract

Capsules are PRAXIS' answer to generic LLM context loss. A mature capsule should
make the model better because it carries a reviewed policy work file, not just a
label or saved chat. Every starter capsule should therefore expose the same
agent-facing contract:

- active-capsule identity and output goal;
- source receipts, freshness posture, and sourceability requirements;
- tacit assumptions, red lines, approval politics, and practical heuristics;
- ontology hints and embedded graph candidates for actors, institutions/rules,
  claims, evidence, risks, options, decisions, and open questions;
- clear separation between canonical Firestore capsule state and proposed
  graph, Cognee, memory, or SQL projection changes;
- human review gates before external publication, high-stakes reliance, or
  canonical graph promotion.

AI can use this structure to draft, compare, retrieve, and reason, but it should
not silently promote inferred knowledge. Unsupported claims become evidence
gaps, inferred graph items become review proposals, and advisory memory remains
non-canonical until a reviewer accepts it.

## Visible MVP: Intent, Policy Context, And Traceability

The first visible MVP keeps Ask PRAXIS as the cockpit. The user sees one
composer, the active ContextCapsule stack, source posture, and a few useful next
actions. Behind that simple surface, PRAXIS derives a structured work plan for
the turn:

- detected work intent;
- policy context preset and sub-preset when applicable;
- active and recommended capsules;
- recommended tools and methods;
- human review posture;
- traceability summary for the answer.

The code-backed work intent router lives at
`src/lib/ai/work-intent-router.ts`. Version 1 supports these modes:

- `policy_memo`;
- `pdf_report`;
- `research_brief`;
- `legal_policy_context`;
- `stakeholder_map`;
- `source_pack`;
- `intellectual_tool`;
- `expert_capsule`;
- `general_answer` fallback.

The router should integrate with existing Ask classification and orchestration.
It must not create a separate top-level workspace, broad tool chooser, or new
primary navigation item.

## Policy Context Registry

The policy context registry maps user language and capsule metadata to reviewable
context presets. Version 1 presets are:

- `us_federal`;
- `us_state`;
- `eu`;
- `un_multilateral`;
- `sector_specific`;
- `organization_specific`;
- `custom`.

Each preset exposes a label, jurisdiction, level, source expectations, default
review gate, recommended capsule/tool tags, and suggested next actions. U.S.
federal work also supports sub-presets for executive policy, agency guidance,
congressional materials, Federal Register posture, court/legal context,
procurement, national security, civil rights, data/privacy, and AI governance.

The phrase `analyze this from a U.S. federal AI governance perspective` should
resolve to `us_federal` plus `ai_governance`, recommend the U.S. federal AI
governance baseline capsule, and preserve a human AI governance review gate.

## Human-Reviewed Capsule Metadata

Human review is metadata on existing starter/runtime capsules, not a new capsule
type. A human-reviewed capsule should be able to display:

- scope;
- author or publisher;
- reviewed date;
- review status;
- jurisdiction;
- assumptions;
- limitations;
- source pack summary;
- human review gate.

AI can propose capsule improvements, but AI-generated context must remain a
review proposal until a human accepts it. Firestore ContextCapsules remain the
canonical capsule state. Starter examples for this wave include U.S. AI
governance baseline, Congressional testimony mode, UN sanctions context,
Humanitarian access analysis, and PDF policy memo style.

## Ask Traceability Panel

Ask answers should include a compact traceability panel built from the answer
envelope and orchestration receipt. It should show detected intent, selected
policy context, active capsules used, source count and posture, unsupported
claim count, assumptions count, confidence posture, human review recommendation,
and the best next action.

The panel can be expandable for details, but it must not expose raw hidden
prompts, secrets, provider internals, raw cost details, or unapproved connector
writes.

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

## Capsule Workbench

Clicking a capsule should open one coherent workbench rather than separate
debug-like panels. The workbench should show:

- overview, readiness, domain, jurisdiction, output goal, and next action;
- the 12-core anatomy with present and missing cores;
- evidence posture, unsupported claims, date checks, and source gaps;
- a readable graph/ontology lens that distinguishes canonical items from
  proposed or missing items;
- tacit knowledge from capsule memories, including assumptions, decisions,
  commitments, preferences, caveats, and open questions;
- agent workflow receipts, recent runs, suggested next actions, outputs, and
  review queue items.

The graph/ontology lens is explanatory in v1. AI-discovered graph, ontology,
source-gap, or advisory-memory items must remain review cards or evidence gaps
until a human accepts them.

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

## Historical App Shape Proposal

The navigation proposal below is retained for history. Its six-item sidebar was
superseded by **Home** and **Capsules** as primary surfaces. Ask, Library,
writing, Canvas and advanced inspection are actions/panels in that shared
workspace; they are not a request to add primary navigation.

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

## Future Improvements

These ideas are intentionally deferred from the visible MVP and should not be
represented as production-live until runtime, review, billing, and audit paths
exist:

- capsule marketplace with free and paid expert packs;
- first-class PDF/report workflow beyond the current PDF-style output capsule;
- research workspace with claim, evidence, and source matrices;
- broader intellectual-tool auto-suggestion;
- expert verification, ratings, licensing, and update SLAs.

## Documentation Rule

The appendix is product research and build direction. The current user-guide
sections above describe the working path and link to acceptance. The code-backed
source for concrete capsule paths, outputs, connectors, and combinations is:

```text
src/lib/product/context-capsules.ts
```

When adding a new policy path, output, connector, or combination recipe, update
that file and its unit tests first, then update this guide if the product model
changes.
