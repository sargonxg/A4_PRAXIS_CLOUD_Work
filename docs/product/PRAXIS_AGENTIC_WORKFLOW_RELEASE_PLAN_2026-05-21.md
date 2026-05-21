# PRAXIS Agentic Workflow Release Plan

Date: 2026-05-21
Status: Release plan for Ask PRAXIS, ContextCapsules, multi-agent workflows, sourceable generation, and policy-work outputs

## Product Thesis

PRAXIS should feel like one serious policy companion, not an agent playground.
The user types into the Ask bar. PRAXIS reads the active ContextCapsule, decides
whether the request is simple, research-heavy, output-heavy, or review-heavy,
then shows a truthful process rail: what context was read, which agents/tools
were selected, what sources were used, what remains unsupported, and where the
output was saved.

The visible shell stays simple:

```text
User prompt
  -> Ask PRAXIS
  -> ContextCapsule read
  -> routed agent workflow
  -> sourceable answer / memo / PDF / handover
  -> receipts and reusable capsule/output artifacts
```

The power lives underneath in ContextCapsules, the AgentRun ledger, capsule
tools, source receipts, approval gates, output capsules, and evals.

## Research Basis

Repo-grounded sources:

- `docs/architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md`
- `docs/product/PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md`
- `docs/product/PRAXIS_AGENTIC_SEARCH_DIAGNOSTIC_2026-05-19.md`
- `docs/architecture/DEEP_RESEARCH.md`
- `src/lib/ai/ask-orchestrator.ts`
- `src/lib/product/policy-agents.ts`
- `src/lib/agent-runtime/tool-registry.ts`
- `src/lib/agent-runtime/worker.ts`
- `src/lib/agent-runtime/evidence-pack.ts`
- `src/lib/agent-runtime/grounding-adapter.ts`

External primary-source checks:

- Google Search grounding is the right current public-web grounding lane when
  up-to-date public web evidence is needed. Google Search Suggestions must be
  enabled/displayed when returned with a grounded result:
  https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-google-search
- Vertex AI Search/private data grounding can be combined with Google Search
  grounding and supports up to 10 data stores per request:
  https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-vertex-ai-search
- Google now points agent runtime, sessions, memory, and managed agent scale
  toward Gemini Enterprise Agent Platform. PRAXIS should treat this as
  substrate, not product truth:
  https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale
- Genkit is positioned for typed models, structured outputs, tool calling, and
  agentic workflows:
  https://genkit.dev/docs/js/overview/

## Non-Negotiables

- Do not add a new top-level agent app.
- Keep Ask PRAXIS as the main cockpit.
- Keep Firestore ContextCapsules canonical.
- Keep Cloud SQL AgentRun ledger canonical for agent status, events, tool
  calls, approvals, receipts, and artifact pointers.
- Treat ADK, Vertex Agent Runtime, Gemini Enterprise Agent Platform, Genkit,
  Google Search grounding, and Memory Bank as substrates unless a later plan
  explicitly promotes one to product state.
- Never claim live Google grounding, source retrieval, graph writes, capsule
  mutation, PDF export, or external publication unless a receipt proves it.
- Every output must carry source posture: sourced, partially sourced,
  model-prior/background, assumption, or unsupported.

## Ask Bar Release Slice

Implemented in this pass:

- Main Ask composer starts empty instead of prefilled.
- The placeholder rotates through light-gray examples that teach what the bar
  can do:
  - cited policy brief from the active capsule;
  - source-gap check;
  - multi-agent review;
  - capsule tools before PDF or memo production;
  - decision-readiness evidence check;
  - briefing with receipts.

Next UI additions should remain in the current workbench:

- Show "PRAXIS will read" under the bar: active capsule, applied capsules,
  attached docs, source receipts, output target.
- Show "PRAXIS may use" before send: model knowledge, capsule evidence,
  uploaded docs, Google Search grounding, deep-search agent, formatter,
  sourceability reviewer.
- After send, show a compact routing rail:
  `Reading capsule -> Planning workflow -> Collecting sources -> Reviewing
  claims -> Producing output -> Saving receipts`.

## Canonical Agent Structure

The agent system should be a supervised workflow, not a free-form swarm.

### 1. Ask Supervisor

Owner: `src/lib/ai/ask-orchestrator.ts` and TACITUS routing policy.

Responsibilities:

- classify user intent and complexity;
- choose synchronous answer vs queued AgentRun;
- select policy agent, tools, output destination, and model task kind;
- attach routing receipt to the answer;
- never perform product writes directly.

### 2. Capsule Reader

This is the first material agent step for every non-trivial request.

Responsibilities:

- call `context-resolve`;
- call `capsule-evidence-pack`;
- inspect active ContextCapsule, selected core refs, associated capsules,
  memories, source receipts, uploaded documents, output history, gaps,
  thinking devices, and approval gates;
- produce a `CapsuleReadReceipt` with:
  - capsule id/version;
  - context health;
  - source/document counts;
  - available tools;
  - relevant thinking devices;
  - missing context;
  - output target;
  - constraints.

Why this matters: no downstream agent should guess what context exists.

### 3. Workflow Planner

Responsibilities:

- turn the prompt and `CapsuleReadReceipt` into a bounded plan;
- choose agents and tools from registries only;
- decide whether live Google grounding is required;
- decide whether a sourceability pass is required before output;
- create approval gates for risky writes/export/graph/capsule mutation;
- emit a user-visible plan summary.

### 4. Research Scout

Responsibilities:

- use capsule source receipts and uploaded documents first;
- use Google Search grounding only when recency/public-web evidence is needed
  and configured;
- use Vertex AI Search/private datastore later when PRAXIS has approved
  enterprise data stores;
- produce source receipts with URL/title/date/publisher/snippet/confidence;
- mark stale or weak sources.

### 5. Evidence Curator / Sourceability Reviewer

Responsibilities:

- map claims to source receipts and document paragraphs;
- label every important claim as supported, weakly supported, contradicted,
  background/model-prior, assumption, or unsupported;
- identify what source would change confidence;
- block or flag output export when key claims are unsupported.

This should become the mandatory gate before PDF, DOCX, memo export, handover,
or leadership brief.

### 6. Domain Lens Agents

These are bounded review lenses, not separate chat personalities.

Recommended lanes:

- Mediation and negotiation lens;
- Humanitarian access lens;
- Security/conflict trend lens;
- Legal/mandate/IHL lens;
- Political economy and incentives lens;
- Red-team/alternative hypothesis lens.

Each lens reads the same `CapsuleReadReceipt` and claim ledger, then returns
structured observations with source pointers and disagreements.

### 7. Synthesis / Briefing Agent

Responsibilities:

- produce the final policy answer, memo outline, decision brief, options memo,
  talking points, or briefing structure;
- preserve claim/source ids;
- surface confidence, gaps, assumptions, and decision implications;
- keep output ready for Memo Studio, Canvas, Library, or handover.

### 8. Output Formatter

Responsibilities:

- turn reviewed content into Markdown, Memo Studio draft, DOCX/PDF-ready
  structure, or handover package;
- preserve citations and unsupported-claim labels;
- call sourceability review after formatting to ensure citations survived;
- save output pointers through PRAXIS stores, not opaque runtime state.

### 9. Handover / Memory Agent

Responsibilities:

- package capsule state, run receipts, generated output, unresolved gaps,
  next actions, and caveats for another user or future agent;
- update OutputCapsule or handover artifacts only through review-gated PRAXIS
  writes.

## Workflow Patterns

### Pattern A: Direct Policy Answer

Use when: prompt is simple, context is adequate, no live current-source work is
required.

Flow:

```text
Ask Supervisor -> Capsule Reader -> Synchronous answer -> Source/gap receipt
```

### Pattern B: Current Research Brief

Use when: prompt asks for latest/current/recent, multiple sources, or a
decision brief.

Flow:

```text
Ask Supervisor
  -> Capsule Reader
  -> Workflow Planner
  -> Research Scout
  -> Evidence Curator
  -> Domain Lens Agents as needed
  -> Synthesis / Briefing Agent
  -> Sourceability final pass
  -> Memo/Library output receipt
```

### Pattern C: Produce PDF / Memo / DOCX

Use when: user asks to produce a briefing pack, memo, PDF, report, or handover.

Flow:

```text
Capsule Reader
  -> Sourceability preflight
  -> Synthesis / Briefing Agent
  -> Output Formatter
  -> Sourceability post-format check
  -> Save output artifact
  -> Export only after approval if external/download action is risky
```

PDF must not be just a rendered answer. It should be an artifact with attached
run id, capsule id/version, source receipt ids, claim ledger, unsupported
claims, generation timestamp, and output target.

### Pattern D: Additional Research / Gap Fill

Use when: user asks "incorporate additional research", "find missing sources",
or "what do we not know?"

Flow:

```text
Capsule Reader -> Evidence Curator -> Research Scout -> Capsule diff proposal
```

Result: reviewable capsule improvement proposals, not silent capsule mutation.

### Pattern E: Multi-Agent Review

Use when: user asks for a robust analysis, red team, competing views, or
leadership-ready briefing.

Flow:

```text
Capsule Reader
  -> Workflow Planner
  -> parallel domain lens reviews
  -> Evidence Curator disagreement map
  -> Synthesis / Briefing Agent
```

The UI should show disagreements, not hide them inside prose.

## Capsule Tool Surface

Promote the tool registry around capsule-aware tools:

| Tool | Purpose | Approval |
|---|---|---|
| `context-resolve` | Read active capsule and selected core refs | auto |
| `capsule-evidence-pack` | Build model-ready evidence object from capsule, docs, receipts, memories, output history | auto |
| `document-retrieve` | Retrieve uploaded document chunks and digests | auto |
| `grounded-search` | Current source collection through approved grounding | auto with receipt |
| `deep-search-agent` | Long current/source-heavy research | auto with receipt |
| `sourceability-reviewer` | Claim/source/gap audit | auto |
| `policy-memo` | Draft memo from reviewed evidence | auto |
| `memo-formatter` | Format into memo/DOCX/PDF-ready structure | auto, post-check required |
| `output-capsule-save` | Persist reviewed output capsule | auto with receipt |
| `handover-package` | Package state, output, gaps, next actions | confirm |
| `capsule-diff-proposer` | Propose capsule improvements | confirm before apply |
| `graph-mutation` | Promote graph changes | approval required |
| `external-export` | Publish/send/export outside PRAXIS | approval required |

## Sourceability Contract

Every non-trivial generation should create a claim ledger:

```text
claim_id
claim_text
claim_type: fact | assessment | forecast | recommendation | assumption
support_status: supported | weak | contradicted | model_prior | assumption | unsupported
source_receipt_ids
document_paragraph_ids
grounding_modes
freshness_status
confidence
what_would_change_confidence
```

Final output rules:

- Supported factual claims can cite source receipts.
- Forecasts and recommendations must cite evidence and label judgment.
- Model knowledge can provide background, but must not masquerade as current
  sourced evidence.
- Unsupported claims must appear in gaps/assumptions, not in confident prose.
- Google Search grounded responses must preserve required Search Suggestions
  display posture when returned.

## Release Lanes

### Lane 0: Ask Bar And Visible Routing

Status: started.

- Empty composer with rotating guidance placeholders.
- Add "what PRAXIS will read/use" preview under the composer.
- Add routing plan preview before queued AgentRun.
- Keep all changes inside `TaskletPraxisWorkbench`.

Validation:

- `npm run test -- tests/unit/components/tasklet-workbench-contract.test.ts`
- Playwright smoke for homepage/app Ask composer.

### Lane 1: Capsule Reader Agent

Files:

- `src/lib/agent-runtime/evidence-pack.ts`
- `src/lib/agent-runtime/tool-registry.ts`
- `src/lib/agent-runtime/reasoning-loop.ts`
- `src/lib/ai/ask-orchestrator.ts`
- `tests/unit/lib/agent-runtime/evidence-pack.test.ts`
- `tests/unit/lib/agent-runtime/reasoning-loop.test.ts`

Deliverables:

- `CapsuleReadReceipt` type;
- first-step requirement for queued runs;
- UI receipt showing capsule id/version, counts, gaps, output target, and tools.

### Lane 2: Workflow Planner And Agent Registry

Files:

- `src/lib/product/policy-agents.ts`
- `src/lib/agent-runtime/tool-registry.ts`
- `src/lib/agent-runtime/reasoning-loop.ts`
- `src/lib/ai/tacitus-routing-policy.ts`
- `tests/unit/lib/product/policy-agents.test.ts`
- `tests/unit/lib/ai/ask-orchestrator.test.ts`

Deliverables:

- structured workflow plans for direct answer, current research brief, PDF/memo,
  gap fill, multi-agent review, and handover;
- bounded domain lens agent definitions;
- no route-local agent invention.

### Lane 3: Sourceability Claim Ledger

Files:

- `src/lib/agent-runtime/sourceability-ledger.ts` (new)
- `src/lib/genkit/flows/sourceability.ts`
- `src/lib/sources/source-receipt-normalizer.ts`
- `src/lib/ai/ask-answer-envelope.ts`
- `tests/unit/lib/sources/source-receipt-normalizer.test.ts`
- `tests/genkit/sourceability-flow.test.ts`

Deliverables:

- claim ledger schema;
- claim-to-source mapping;
- final output gate for unsupported claims;
- receipt rendering in Ask answer/source preview panel.

### Lane 4: Output/PDF Workflow

Files:

- `src/lib/agent-runtime/worker.ts`
- `src/lib/output-capsules/*`
- `src/lib/memo/from-ask.ts`
- Memo Studio formatter/export surfaces.

Deliverables:

- formatter reads claim ledger;
- PDF/DOCX-ready output carries capsule id, run id, source ids, unsupported
  claims, and generated timestamp;
- post-format sourceability check.

### Lane 5: Research Grounding Upgrade

Files:

- `src/lib/agent-runtime/grounding-adapter.ts`
- `src/lib/ai/grounded-research.ts`
- `src/lib/ai/vertex-agent.ts`
- `/api/ai/deep-search-agent` compatibility path;
- `/api/agents/runs/[runId]/execute` canonical worker path.

Deliverables:

- Google Search grounding metadata attached to PRAXIS receipts;
- explicit absent/degraded posture when grounding is unavailable;
- eventual Vertex AI Search/private datastore support behind approved config.

### Lane 6: Evals And Proof

Files:

- `src/lib/agent-runtime/research-eval.ts`
- `scripts/eval-agentic-research.ts`
- `docs/audits/agentic-research-evals/`

Deliverables:

- expand deterministic scenarios from 5 to at least 12;
- add output/PDF, sourceability, handover, and degraded-runtime cases;
- authenticated canary for Ask -> AgentRun -> stream -> output -> receipt.

## Definition Of Done

PRAXIS should be able to answer this user prompt:

> "Produce a short PDF briefing on the latest humanitarian access constraints
> using my active Syria capsule, add any missing research, and red-team the
> recommendations."

With visible proof:

- active capsule read with id/version;
- source/document counts;
- Google/current-source grounding posture;
- selected workflow agents;
- claim ledger;
- sourceability pass;
- red-team disagreements;
- generated output pointer;
- PDF-ready artifact with citations and gaps;
- run id and receipts;
- approval gates for any risky export or capsule mutation.

That is the policy-work companion bar: ask once, PRAXIS handles context,
research, reasoning, review, production, and proof without turning the product
into a confusing agent control panel.
