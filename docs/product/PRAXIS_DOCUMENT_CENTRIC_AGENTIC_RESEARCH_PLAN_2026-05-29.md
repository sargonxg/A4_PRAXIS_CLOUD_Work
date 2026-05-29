# PRAXIS Document-Centric Agentic Research Plan

Date: 2026-05-29  
Repo: `C:\Users\giuli\A4_PRAXIS_CLOUD_Work`  
GitHub: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`  
Status: planning artifact after fresh clone, graph refresh, repo source review, GitHub scan, and external legal-tech research

## Executive Read

PRAXIS should not become a generic legal AI clone. The stronger path is a
policy and legal-grade document workbench where Ask PRAXIS stays the cockpit,
ContextCapsules remain the hidden operating object, and Memo Studio becomes the
place where evidence-backed work product is written, checked, repaired, and
exported.

The product loop should be:

```text
Matter/Capsule
  -> Evidence Pack
  -> Sourceable Answer
  -> Claim Ledger
  -> Memo / brief / handover draft
  -> Sourceability repair
  -> Export or schedule monitoring
```

This is already directionally aligned with the repo. The next work should
tighten the loop so users can reliably ask policy questions, inspect the exact
source basis, draft documents, and repair weak claims without leaving the
existing Ask/Capsule/Memo cockpit.

## What I Reviewed

Repo source-of-truth and implementation seams:

- `docs/product/README.md`
- `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`
- `docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`
- `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`
- `docs/architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md`
- `docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`
- `TODO.md`
- `STATUS.md`
- `src/lib/ai/ask-orchestrator.ts`
- `src/components/ask/AskStreamPanel.tsx`
- `src/components/memo/memo-desk.tsx`
- `src/lib/agent-runtime/evidence-pack.ts`
- `src/lib/agent-runtime/sourceability-ledger.ts`
- `src/lib/agent-runtime/worker.ts`
- `src/lib/documents/spatial-source-binding.ts`
- `src/lib/documents/evidence-review.ts`
- `src/lib/context/capsule-v3.ts`
- `src/lib/context/capsule-quality.ts`
- `src/lib/product/context-capsules.ts`
- sourceability, Ask, worker, and e2e contract tests under `tests/`

Graphify was refreshed against the current clone:

- `graphify update .`
- Current graph commit: `32257251`
- Corpus: 1396 files, 6342 nodes, 12127 edges, 718 communities
- Top graph hubs: `withAuth()`, `getAdminDbOrThrow()`, `handleRouteError()`
- Graphify skipped the large HTML render because the graph is over the 5000 node
  threshold, which matches the repo guidance.

External references reviewed:

- Harvey Assistant, Vault, and product help: source-backed answers, knowledge
  vaults, workflow agents, exact answer sources, internal documents plus legal
  databases and web search.
  - https://www.harvey.ai/platform/assistant
  - https://www.harvey.ai/platform/vault
  - https://help.harvey.ai/articles/getting-started-with-harvey
- Thomson Reuters CoCounsel: unified legal research, document analysis,
  drafting, Microsoft 365/DMS integrations, and authoritative Westlaw/Practical
  Law grounding.
  - https://legal.thomsonreuters.com/en/products/cocounsel-legal
  - https://www.thomsonreuters.com/en/artificial-intelligence
- vLex Vincent: legal research and workflows over a large legal database with
  citations and jurisdiction comparison.
  - https://support.vlex.com/vincent-by-vlex/vincent/getting-started-with-vincent/understanding-what-vincent-is
- Legora: assistant embedded across document review, drafting, Word add-in, and
  cited legal answers.
  - https://legora.com/product
- Everlaw AI: evidence review to drafting, arguments grounded in the record, and
  source attribution.
  - https://www.everlaw.com/product/everlaw-ai/
- OpenAI File Search and Google Vertex grounding as implementation-pattern
  references for retrieval-backed answers and citation metadata.
  - https://developers.openai.com/api/docs/guides/tools-file-search
  - https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-google-search
- Open-source and benchmark references:
  - Docling for document parsing and unified document representation:
    https://github.com/docling-project/docling
  - RAGFlow for deep document understanding, chunk visualization, citations,
    reranking, and agentic workflow: https://github.com/infiniflow/ragflow
  - LegalBench-RAG for exact-span legal retrieval evaluation:
    https://arxiv.org/abs/2408.10343 and
    https://github.com/zeroentropy-ai/legalbenchrag
  - Microsoft GraphRAG for graph-shaped retrieval patterns:
    https://github.com/microsoft/graphrag
  - LangGraph and Deep Agents for durable agent-state, sub-agent, human review,
    checkpoint, and trace concepts:
    https://github.com/langchain-ai/langgraph and
    https://github.com/langchain-ai/deepagents

## Diagnosis

PRAXIS already has the important pieces:

- Ask PRAXIS orchestration with receipts, tool routing, and queued AgentRun
  posture.
- ContextCapsule v3 concepts: SourceSpine, ClaimLedger, review cards, output
  contracts, forbidden actions, and human-gated capsule changes.
- Evidence Pack construction from capsules, uploaded docs, output capsules,
  memories, and source receipts.
- Sourceability Ledger labels for supported, weak, unsupported, contradicted,
  model prior, and assumption.
- Memo Studio with TipTap, source insertion, claim checking, evidence gaps, and
  Ask-to-memo handoff.
- Document AI and fallback text chunking hooks for spatial citations.
- Agent runtime ledger, worker, sourceability reviewer, red-team, handover, and
  memo draft paths.
- Evals and tests proving pieces of the sourceability and runtime contract.

The missing product strength is not another page or agent launcher. The missing
strength is making the existing loop feel inevitable:

- User asks a policy/legal question.
- PRAXIS shows the matter/capsule and evidence basis.
- Each answer carries a compact claim ledger.
- Weak claims produce explicit evidence tasks.
- A draft document inherits the ledger.
- Memo Studio can check, cite, repair, and export.
- Capsule improvements are review cards, not silent AI mutations.

## Recommended Product Shape

Keep the visible product spine:

```text
Home
Capsules
```

Inside that spine, present the user-facing object as a "matter file" or "policy
file" where appropriate, while preserving `ContextCapsule` internally. This lets
legal/policy users understand the workflow without diluting the capsule model.

Suggested user vocabulary:

- "Active file" for the selected capsule/matter.
- "Evidence pack" for resolved documents, source receipts, chunks, gaps, and
  digest claims.
- "Claim ledger" for support status on answer or memo claims.
- "Review card" for proposed capsule/graph/source changes.
- "Sourceability check" for bounded claim-to-evidence review.

Avoid exposing a raw tool marketplace, raw graph mutations, model/provider
costs, or a new top-level "Legal AI" app.

## Agentic Structure

Use the existing AgentRun ledger and worker, but make the internal roles more
explicit in events and UI receipts:

1. Planner
   - Classifies the work intent and policy/legal context.
   - Builds a retrieval plan from active capsule, documents, known receipts,
     and permitted live sources.

2. Source Scout
   - Searches only allowed sources.
   - Separates internal docs, uploaded files, grounded web, and premium/manual
     connectors.
   - Emits source receipts and retrieval gaps.

3. Document Analyst
   - Extracts claims, dates, actors, definitions, obligations, and quoted
     spans from uploaded or selected documents.
   - Preserves page, paragraph, and spatial citation refs where available.

4. Claim Ledger
   - Classifies each material claim as supported, weak, unsupported,
     contradicted, assumption, model prior, or date-check-needed.
   - Never upgrades support without a source receipt.

5. Writer
   - Produces a memo, brief, talking points, evidence annex, or handover from
     the evidence pack and claim ledger.
   - Keeps citations and caveats in the draft body.

6. Red Team
   - Checks missing authority, stale dates, unsupported claims, conflicting
     evidence, and overconfident language.

7. Handover Builder
   - Creates the final work product, capsule update proposal, monitoring task,
     or review packet.

These should be roles inside the current worker loop, not separate primary
agents with their own app surface.

## Priority Build Lanes

### Lane 1 - Memo Studio Sourceability Action

Goal: A user selects a paragraph in Memo Studio and runs Sourceability against
the currently attached snippets, document chunks, and source receipts.

Scope:

- Wire selected text from `src/components/memo/memo-desk.tsx` to the existing
  `sourceabilityFlow`.
- Enforce the bounded rule from `TODO.md`: evaluate provided snippets only;
  retrieval is a separate explicit action.
- Return claim rows, status labels, citation warnings, cautious rewrite, and
  next evidence actions.
- Persist the result into memo metadata and source receipts when available.

Validation:

- Extend `tests/genkit/sourceability-flow.test.ts`.
- Add a focused Memo Studio unit/contract test for selected text to source check.
- Add an e2e fixture only after the UI action is stable.

Why first:

- It is the closest high-value gap.
- It differentiates PRAXIS from generic chat immediately.
- It strengthens policy answers and document drafting without new navigation.

### Lane 2 - Evidence Pack v2

Goal: Make evidence packs paragraph-level and document-grade.

Scope:

- Extend `src/lib/agent-runtime/evidence-pack.ts` so `sourcedParagraphs`,
  `documentDigests`, and `keyClaims` carry stable span ids, page refs, paragraph
  refs, source receipt ids, and freshness posture.
- Use `src/lib/documents/spatial-source-binding.ts` refs where available.
- Normalize evidence cards for Ask, AgentRun receipts, and Memo Studio.
- Emit explicit gaps for no receipt, stale source, weak span, missing date, and
  jurisdiction mismatch.

Validation:

- Unit tests for evidence pack shape.
- Contract test that Memo Studio and Ask can render the same evidence card DTO.
- Regression for existing source-rich conversation pack behavior.

### Lane 3 - Live Research Memo Agent Dry Run

Goal: Replace the deterministic memo scaffold with a real but controlled
capsule-aware research memo pipeline.

Scope:

- In `src/lib/agent-runtime/worker.ts`, route Research Memo through:
  - intent/context classification;
  - Evidence Pack v2;
  - retrieval plan;
  - allowed internal docs and grounded search;
  - Claim Ledger;
  - draft memo;
  - Red Team;
  - Memo Studio artifact.
- Keep the worker behind existing calibration, approval, and env gates.
- Preserve deterministic fallback for tests and degraded local runs.

Validation:

- Extend `src/lib/agent-runtime/research-eval.ts`.
- Add fixture cases for policy memo, legal-policy context, current source
  freshness, contradiction, and unsupported-claim abstention.
- Browser-auth canary after local tests pass.

### Lane 4 - Ask Traceability Panel

Goal: Every serious policy answer exposes its evidence posture in the same Ask
thread.

Scope:

- In `AskStreamPanel`, show detected intent, policy context, active file/capsule,
  sources used, unsupported claims, assumptions, date-checks, and best next
  action.
- Link to "Send to Memo Studio", "Run sourceability", "Find sources", and
  "Create review card".
- Hide raw prompts, secrets, provider internals, and unhelpful cost details.

Validation:

- Contract tests around answer envelope and claim ledger rendering.
- E2E same-thread receipt check with queued agent run.

### Lane 5 - Capsule Review Cards for Context Improvement

Goal: AI can propose context improvements, but only humans promote them.

Scope:

- Persist source-pack gaps, discovered claims, trigger/blocker updates,
  jurisdiction notes, and output requirements as structured review cards.
- Never mutate canonical capsule facts directly from Ask or worker output.
- Add approve/reject/apply history into capsule v3 snapshots.

Validation:

- Unit tests for review-card schemas.
- Audit that graph/capsule promotions remain review-gated.

### Lane 6 - Legal/Policy Context Source Hierarchies

Goal: Policy answers should understand authority, jurisdiction, and freshness.

Scope:

- Expand `src/lib/ai/work-intent-router.ts` and the policy context registry.
- Add source expectation ladders:
  - primary law or official policy;
  - agency guidance and regulator materials;
  - parliamentary/congressional materials;
  - court or tribunal materials;
  - trusted institutional analysis;
  - news/current monitoring;
  - user-provided record.
- Add jurisdiction and date posture to sourceability and answer envelopes.

Validation:

- Unit tests for prompts such as "from a U.S. federal AI governance perspective",
  "EU AI Act compliance memo", and "compare current agency guidance".
- Evals that penalize answers that use generic web sources where primary
  authority is expected.

### Lane 7 - Retrieval and Evaluation Bar

Goal: Make PRAXIS measurably better than a generic LLM on policy/legal document
work.

Scope:

- Use LegalBench-RAG-style exact-span retrieval tests as a model.
- Add PRAXIS-specific fixtures:
  - precise snippet retrieval;
  - abstain when source missing;
  - date freshness;
  - contradiction handling;
  - paragraph citation fidelity;
  - memo export provenance;
  - review-gated capsule update.
- Keep GraphRAG/Cognee-style graph enrichment advisory unless explicitly
  promoted by review.

Validation:

- `npm run eval:agentic-research` or the repo equivalent.
- Store eval artifacts in `docs/audits/agentic-research-evals/`.

## Near-Term Implementation Sequence

1. Ship Lane 1: Memo Studio selected-paragraph Sourceability.
2. Ship Lane 2 enough to give every selected paragraph stable evidence cards.
3. Ship Lane 4 traceability panel for Ask answers using the same DTO.
4. Ship Lane 3 Research Memo Agent dry run behind existing worker gates.
5. Add Lane 5 review-card persistence for source gaps and capsule improvements.
6. Expand Lane 6 context hierarchy presets for legal and policy answers.
7. Add Lane 7 eval scenarios and compare against generic baseline.

## No-Go Rules

- Do not add a new primary app page or top-level nav item for this work.
- Do not make graph or capsule mutations without review cards.
- Do not claim a source supports a statement without a receipt/span.
- Do not conflate internal uploaded documents, grounded web, and model memory.
- Do not replace Firestore ContextCapsules, Cloud SQL AgentRun ledger, or the
  current GCP production posture.
- Do not surface fake-live connectors or premium legal databases unless they are
  actually integrated and permissioned.
- Do not run external actions, publish, push, or credentialed browser actions
  without explicit approval.

## Concrete Next Ticket

Title: Memo Studio selected-paragraph Sourceability MVP

Files likely involved:

- `src/components/memo/memo-desk.tsx`
- `src/lib/genkit/flows/sourceability.ts`
- `src/app/api/ai/sourceability/route.ts`
- `src/lib/documents/evidence-review.ts`
- `src/lib/agent-runtime/sourceability-ledger.ts`
- `tests/genkit/sourceability-flow.test.ts`
- a new focused Memo Studio contract test

Acceptance criteria:

- A user can select memo text and run Sourceability without leaving Memo Studio.
- The check only uses provided snippets/source receipts.
- The result shows supported, weak, unsupported, assumption, and date-check
  statuses.
- The result offers a cautious rewrite and next evidence actions.
- The memo stores the sourceability result with capsule/run/source provenance.
- Existing Ask/Memo/sourceability tests continue to pass.

