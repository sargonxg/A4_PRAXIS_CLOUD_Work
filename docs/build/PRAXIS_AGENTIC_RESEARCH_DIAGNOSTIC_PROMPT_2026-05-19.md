# PRAXIS Agentic Research Diagnostic Prompt

Date: 2026-05-19
Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
Live app: `https://praxis.tacitus.me`

Use this prompt with a hybrid repo-and-web research agent. The task is read-only by default: inspect, test, benchmark, and report. Do not make code changes unless Giulio explicitly starts a follow-up implementation session.

```md
You are auditing PRAXIS as a serious agentic research system.

Repo:
`C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`

Live app:
`https://praxis.tacitus.me`

Current canonical research route:
`/api/ai/deep-search-agent`

Important adjacent routes and surfaces:
- `/api/ai/deep-research`
- `/api/research/run`
- `/api/ai/grounded-search`
- `/api/ai/source-scout`
- `/api/health/agentic-search`
- `/api/agents/runs`
- `/api/agents/runs/[runId]`
- `/api/agents/runs/[runId]/stream`
- `/api/context/capsules`
- `/api/context/resolve`
- `/api/memos/from-ask`
- `/api/graph/proposals`
- Ask PRAXIS
- Capsule Factory / Capsules
- Repository / source library
- Settings / Advanced health surfaces

Your job is to produce a decision-grade diagnostic and improvement plan. Do not make code changes. Read the repo, run safe diagnostics, inspect live behavior when credentials are available, and research current best practices online.

Treat PRAXIS as a ContextCapsule-first research product, not a generic chatbot. The core question is whether PRAXIS can reliably move from:

`question -> research plan -> source discovery -> extraction -> cited synthesis -> capsule/memo/graph update -> reviewable audit trail`

## Operating Rules

1. Start with repo reality, not assumptions.
2. Keep Firestore and ContextCapsules canonical for user-facing context.
3. Treat Cloud SQL/Postgres as the durable AgentRun execution ledger.
4. Treat Cognee/graph enrichment as reviewable and non-authoritative unless explicitly promoted.
5. Prefer Google/Vertex/Gemini grounding as the PRAXIS-aligned primary path, but benchmark OpenAI, Anthropic, Exa, Firecrawl, Tavily, and Perplexity-style research APIs objectively.
6. Be explicit about fallback, scaffold, mock, degraded, and unconfigured behavior.
7. Do not propose a new primary database, generic automation platform, or broad architecture reset unless the current PRAXIS stack demonstrably cannot support the use case.
8. Do not hide blockers behind "works locally" or "should work." If live grounded search, ADK, Cloud Tasks, Cloud SQL, Genkit, or worker dispatch is not really configured, say exactly what is missing.
9. If authenticated/live tests are blocked by missing credentials or env vars, record the exact blocker and continue with repo-backed and unauthenticated checks.
10. Do not expose secrets. Do not print secret values. Report only whether required variables/config are present or missing.

## Start Here

Run this preflight:

```powershell
cd C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work
git status --short
git log --oneline -5
npm install
```

If the tree is dirty, inspect enough to avoid misattributing another agent's edits. Do not reset, checkout, or overwrite uncommitted work.

Read these files first:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `ARCHITECTURE.md`
4. `docs/product/README.md`
5. `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`
6. `docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`
7. `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`
8. `docs/product/TASKLET_RESEARCH_INTAKE_2026-05-15.md`
9. `docs/product/PRAXIS_AGENTIC_SEARCH_DIAGNOSTIC_2026-05-19.md`
10. `docs/architecture/DEEP_RESEARCH.md`
11. `docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`
12. `docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`
13. `STATUS.md`
14. `TODO.md`
15. `CHANGELOG.md` `[Unreleased]` only

If `graphify-out/GRAPH_REPORT.md` exists, read it before broad architecture claims. Use graphify queries for cross-module questions when useful.

## Safe Diagnostics To Run

Run the narrowest useful audits first:

```powershell
npm run audit:agentic-search
npm run audit:agent-runtime-proof
npm run audit:deep-preship
npm run audit:tool-contracts
npm run audit:ask-cockpit-runtime
```

Run `npm run audit:gate` only if the local environment is ready and the runtime cost is acceptable. If it is blocked, record why and run the smaller audits above.

Also inspect or test these areas when feasible:

- `src/app/api/ai/deep-search-agent/route.ts`
- `src/app/api/ai/deep-research/route.ts`
- `src/app/api/research/run/route.ts`
- `src/app/api/ai/grounded-search/route.ts`
- `src/app/api/ai/source-scout/route.ts`
- `src/app/api/health/agentic-search/route.ts`
- `src/app/api/agents/runs/**`
- `src/lib/agent-runtime/**`
- `src/lib/ai/ask-orchestrator.ts`
- `src/lib/ai/providers.ts`
- `src/lib/ai/MODEL_MATRIX.json`
- `src/lib/context/**`
- `src/components/ask/**`
- `src/components/app/**`
- relevant tests under `tests/unit`, `tests/e2e`, and `src/__tests__`

## Investigation Area 1: Current PRAXIS Reality

Answer with repo-backed evidence:

- What research and agentic capabilities are actually implemented?
- Which routes are canonical, deprecated, compatibility-only, fallback-only, or scaffolded?
- Which tools can discover sources, extract claims, synthesize reports, save outputs, update capsules, create graph proposals, or create memos?
- Which capabilities are visible in Capsule Factory, Ask PRAXIS, Repository/source library, Settings health, Advanced health, and tool surfaces?
- Which capabilities exist only as backend/runtime plumbing with no usable product surface?
- Which route or component owns the current user-visible research experience?
- Which claims in docs or UI overstate what the runtime can actually do?

Produce a route/tool/UI/runtime matrix. Minimum columns:

| Area | File/route/surface | Current role | Canonical status | Persists output? | Emits receipt? | User-visible? | Live-ready? | Evidence |
|---|---|---|---|---|---|---|---|---|

Use dispositions such as:

- canonical
- compatibility wrapper
- deprecated
- fallback-only
- scaffold
- internal helper
- UI-only
- backend-only
- missing

## Investigation Area 2: Runtime And Infrastructure Readiness

Check and report:

- AgentRun durability
- Cloud SQL ledger readiness
- Cloud Tasks queue readiness
- worker route auth and dispatch
- ADK / Agent Engine config
- Vertex / Gemini provider config
- Google Search grounding config
- Genkit typed flow readiness
- source persistence
- capsule persistence and writeback
- memo persistence and handoff
- graph proposal persistence and approval
- health endpoint precision
- telemetry and traceability

Separate:

- P0 hard blockers: the loop cannot run or cannot be trusted.
- Degraded but usable paths: the product can run with reduced capability.
- Honest fallbacks: implemented, surfaced, and acceptable for now.
- Hidden fallbacks: implemented but not visible enough to users/operators.
- Scaffolds: named capability exists but is not real yet.

For every missing env/config blocker, include the exact missing variable or config name if the repo exposes it. Do not print secret values.

## Investigation Area 3: Research Quality Diagnostic

Test at least five fixed scenarios. Use live app/API only when credentials and env are available. Otherwise use local route tests, mocks, or dry-run evidence and mark the limitation clearly.

Scenarios:

1. Fast current-events question
   - Example: "What changed in the last 72 hours in the Israel-Hamas ceasefire negotiations, and which sources disagree?"
2. Conflict or policy research question
   - Example: "What are the main humanitarian access constraints in Sudan right now, and which actors are responsible for each?"
3. Source discovery for a claim
   - Example: "Find authoritative sources for the claim that sanctions enforcement changed shipping behavior in the Red Sea."
4. Contradiction or uncertainty check
   - Example: "Compare reported casualty figures for a recent conflict event and explain what is known, disputed, and uncertain."
5. Capsule-grounded research question
   - Use an existing ContextCapsule or test capsule. Ask a question that requires applying capsule context to online/current sources.

For each scenario, evaluate:

- search planning quality
- source diversity
- source authority
- source recency
- citation fidelity
- source receipt fidelity
- extraction quality
- distinction between fact, inference, and uncertainty
- contradiction handling
- capsule grounding behavior
- whether output can be saved or reused in capsules
- whether output can create a memo
- whether output can create graph proposals
- whether output can populate the source library
- latency
- failure mode
- user-visible state during the run
- operator-visible audit trail after the run

Use this scorecard:

| Scenario | Path tested | Planning 0-5 | Sources 0-5 | Citations 0-5 | Recency 0-5 | Uncertainty 0-5 | Capsule reuse 0-5 | Persistence 0-5 | Audit trail 0-5 | Latency | Failure mode | Evidence |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|

Include raw evidence snippets:

- request shape, with secrets redacted
- response shape
- event stream or run timeline if available
- source/citation receipt sample
- saved artifact ids or proof that none were saved
- screenshots only if browser verification was possible and useful

## Investigation Area 4: Online Benchmark Research

Use current primary documentation and credible product references. Include access dates because this is time-sensitive.

Minimum reference anchors:

- Google Vertex Grounding with Google Search: `https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-google-search`
- Google ADK Vertex AI Search grounding: `https://adk.dev/grounding/vertex_ai_search_grounding/`
- OpenAI Agents SDK web search tool: `https://openai.github.io/openai-agents-js/openai/agents-openai/functions/websearchtool/`
- Anthropic web search tool: `https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool`

Also benchmark, where relevant:

- Exa
- Firecrawl
- Tavily
- Perplexity-style research APIs
- Google Vertex AI Search / enterprise datastore patterns
- source licensing and attribution obligations
- tool orchestration and agent step logging
- enterprise auditability
- privacy and data retention
- cost controls
- rate limits
- human approval gates
- provenance and citation UX

Required benchmark table:

| Provider/pattern | Best use in PRAXIS | Strengths | Weaknesses | Citation/provenance support | Cost/rate-limit posture | Privacy/licensing notes | Should be canonical? | Source/date |
|---|---|---|---|---|---|---|---|---|

Compare research-agent UX patterns:

- source matrix
- query trace
- confidence and uncertainty display
- gaps and follow-up collection tasks
- contradiction surfacing
- approval gates before writes
- save-to-capsule and save-to-memo affordances
- run receipts and replayable audits

## Required Questions To Answer

Answer each directly:

1. What should PRAXIS research agents be used for first: source discovery, deep memo research, watchlists, claim checking, or capsule enrichment?
2. What is the minimum serious research-agent loop PRAXIS should ship next?
3. Which existing routes should be consolidated, wrapped, or retired?
4. Which source providers should be canonical for PRAXIS, and which should be optional?
5. What must be stored as a durable research receipt?
6. What belongs in Firestore capsules versus Cloud SQL AgentRun ledger versus graph proposals?
7. What should users see during a research run: plan, sources, tool calls, uncertainty, cost, elapsed time, review gates?
8. What should be blocked without human approval?
9. What eval set proves research quality is improving?
10. What production telemetry is missing?
11. Which claims should PRAXIS stop making until live proof exists?
12. What is the smallest patch that makes the product more honest and useful within 48 hours?

## Data Contract Proposal

Propose TypeScript-shaped contracts for:

- `ResearchReceipt`
- `ResearchPlan`
- `ResearchStep`
- `SourceMatrixEntry`
- `SourceReceipt`
- `ClaimExtraction`
- `ContradictionRecord`
- `UncertaintyRecord`
- `CapsuleWritebackProposal`
- `MemoDraftProposal`
- `GraphProposalLink`
- `AgentRunResearchMetadata`
- `ResearchQualityEvalResult`

For each contract, state where it belongs:

- Firestore user/capsule state
- Cloud SQL AgentRun ledger
- graph proposals/review queue
- memo/work product store
- ephemeral UI state only

Do not propose storing full copyrighted source bodies unless the repo already has a compliant, explicit ingestion policy. Prefer metadata, excerpts within policy, hashes, pointers, source ids, and short claim-linked snippets.

## UX Recommendations

Keep PRAXIS simple on the surface and stronger under the hood.

For Ask PRAXIS, recommend:

- what the user sees before the run starts
- what the user sees while planning/searching/extracting/synthesizing
- how sources and uncertainty appear without overwhelming the chat
- how to save as capsule update, memo, source record, or graph proposal
- how review gates appear
- where advanced receipts live

For Capsule Factory / Capsules, recommend:

- how research enriches a ContextCapsule
- how proposed updates are reviewed before becoming canonical
- how contradiction and uncertainty records are attached
- how source receipts remain inspectable
- how capsule-grounded research differs from generic web search

For Settings / Advanced health, recommend:

- what runtime status should be plain-language
- what should be machine-readable
- what blockers should show exact missing env/config names
- what should remain operator-only

## Required Deliverable Structure

Produce one Markdown report with these sections:

1. Executive diagnosis
   - what is real
   - what is weak
   - what is missing
   - what is overstated
2. Current capability map
   - route/tool/UI/runtime matrix
3. Runtime and infrastructure readiness
   - hard blockers
   - degraded usable paths
   - fallback/scaffold inventory
4. Research quality test results
   - five scenarios
   - scorecard
   - raw evidence snippets
5. Online benchmark summary
   - citations
   - dated source notes
6. Recommended next architecture
   - minimum serious research loop
   - route consolidation plan
   - provider posture
7. Data contract proposal
   - receipt, source matrix, agent steps, capsule writeback
8. UX recommendations
   - Ask PRAXIS
   - Capsule Factory / Capsules
   - Settings / Advanced health
9. Implementation roadmap
   - 48-hour patch
   - 1-week MVP
   - 1-month serious research platform
10. Acceptance tests
   - unit
   - route/API
   - authenticated E2E
   - live production smoke
   - research-quality evals
11. Exact follow-up prompts
   - backend/runtime implementation agent
   - frontend/UX implementation agent
   - eval/QA implementation agent
   - docs/product alignment agent

## Implementation Roadmap Format

Use this roadmap table:

| Horizon | Goal | User-visible change | Backend/runtime change | Data contract change | Tests | Risks | Owner lane |
|---|---|---|---|---|---|---|---|

Required horizons:

- 48-hour patch
- 1-week MVP
- 1-month serious research platform

## Acceptance Test Plan

Include exact proposed tests:

- Unit tests for route classification, source receipt normalization, research receipt contracts, uncertainty/contradiction records, and capsule writeback proposals.
- Route/API tests for `/api/ai/deep-search-agent`, `/api/research/run`, `/api/ai/grounded-search`, `/api/ai/source-scout`, `/api/agents/runs`, run detail, run stream, and health endpoint behavior.
- Authenticated E2E tests for Ask PRAXIS queuing a deep research run, displaying the plan/source matrix, polling run events, saving a memo, proposing a capsule update, and showing an audit receipt.
- Live production smoke tests for `https://praxis.tacitus.me` that mark auth/env blockers explicitly.
- Research-quality evals covering recency, citation fidelity, source authority, contradiction handling, uncertainty language, capsule grounding, and reusable output creation.

## Follow-Up Prompt Requirements

The final report must include copy-paste prompts for implementation agents. Each prompt must include:

- repo path
- files to read first
- files owned by that agent
- files not to touch
- concrete goal
- implementation constraints
- validation commands
- expected evidence
- no-reset/no-overwrite warning

Use these lanes:

1. Backend/runtime: research receipt contracts, route consolidation, AgentRun source receipts, health precision.
2. Frontend/UX: Ask PRAXIS run rail, source matrix, save/review affordances, Capsule Factory writeback review.
3. Eval/QA: fixed research scenarios, source quality scoring, route tests, authenticated E2E, live smoke.
4. Docs/product: update current docs to match what is real, remove overclaims, preserve ContextCapsule-first framing.

## Final Judgment Rules

End with a clear recommendation:

- Ship now
- Ship with known degraded paths
- Do not ship until P0 blockers are fixed

Then state the next three implementation moves in order.
```

