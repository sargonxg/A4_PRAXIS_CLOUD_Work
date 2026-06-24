# Capsule and Agentic Workflow Review - 2026-06-24

Scope: read-only review of the just-shipped ontology-first capsule workbench, Agent Context Graph Packet v1, Ask orchestration, Cloud Tasks worker path, capsule dock, Ladybug import posture, and visible agent-context panel. Source was not edited. Verification was limited by local cloud auth and authenticated UI access.

## Verdict

The agentic workflow is verified at the code and focused-test level, but not fully verified as live end-to-end in this shell.

What is verified:
- Ask builds an augmented capsule prompt, including Agent Context Graph Packet v1, before model generation.
- Ask orchestration performs triage, model routing, budget selection, tool routing, workflow planning, and supervisor selection.
- The direct-answer branch stays synchronous; the queued branch creates an AgentRun, dispatches through Cloud Tasks, and the worker executes concrete policy-agent modes.
- Fresh and legacy profile hardening exists for calibrated routes: missing legacy profile falls through to neutral calibration, while partial new profiles still get the onboarding 403.
- Focused unit and provider-isolation checks passed.

What is not verified:
- A live authenticated `/app/capsules` browser session showing the panel.
- Live Cloud Tasks enqueue/worker execution against production from this shell.
- Real new-user and legacy-user browser journeys with a capsule attached.

## Verification Run

- `git status --short --branch`: dirty before review; no source files were touched.
- `git rev-parse HEAD`: `dabfcb68a3b8ae9eb4d9d81df6265d2a9ee142a9`.
- `& "$HOME\.codex\scripts\codex-ready.ps1" -Repo . -Mode quick`: toolchain present, but timed out during cloud checks. GCloud/Firebase CLI checks failed because this sandbox could not write/read gcloud credential/configstore files. The script also reported a dirty tree.
- Firebase MCP read-only check succeeded: active project `praxisbytacitus`; Firestore `(default)` exists in `nam5`, native mode, created `2026-03-22T15:19:16Z`.
- `npx vitest run tests/unit/lib/ai/ask-orchestrator.test.ts tests/unit/lib/context/agent-context-packet.test.ts tests/unit/lib/agent-runtime/workflow-plan.test.ts tests/unit/lib/agent-runtime/worker.test.ts tests/unit/lib/api/with-calibration.test.ts tests/unit/lib/context/profile-context.test.ts tests/unit/app/api/context-capsule-agent-packet-route.test.ts tests/unit/app/api/boardroom-runs-route.test.ts tests/unit/components/ask-context-bar-contract.test.ts`: 9 files, 70 tests passed.
- `npm run audit:ai-provider-isolation`: passed.
- Playwright MCP navigation was attempted but cancelled before execution; not counted as evidence. A frontend QA browser pass against the live app found protected-route redirects and no console errors in reachable unauthenticated states, but could not verify the authenticated target panel.

## What Works

### 1. Agent Context Packet v1 is injected into the Ask prompt

`buildTurnCapsule()` resolves injectable capsule context, then calls `appendAgentContextPacketToPromptBlock()` and replaces `injectableContext.promptBlock` with the augmented prompt block (`src/lib/ai/context-kernel.ts:249-267`). The packet helper is default-on unless `PRAXIS_AGENT_CONTEXT_PACKET` is set to `0`, `false`, `off`, `disabled`, or `no` (`src/lib/context/agent-context-packet.ts:52-58`). It wraps the rendered packet in `<praxis-agent-context-graph-packet>` tags (`src/lib/context/agent-context-packet.ts:78-95`).

The packet itself declares `## PRAXIS Agent Context Graph Packet v1`, capsule id/version, query, budget, canonical store, advisory policy, task lens, ontology contract, salience ledger, sources, claims, incident neighborhoods, reasoning paths, temporal frame, causal chains, and agent instructions (`src/lib/context/agent-context-packet.ts:105-125`). Incident neighborhoods and reasoning paths are explicit packet sections (`src/lib/context/agent-context-packet.ts:267-305`).

Ask then builds the system prompt with `buildAskPrompt(... injectableContext: capsuleContext ...)` and appends the retrieval plan before model generation (`src/app/api/ai/chat/route.ts:282-291`). This means the before/after prompt delta is:
- Before: calibrated analyst/situation prompt + `<praxis-context-capsule>` + retrieval plan.
- After: the same governed capsule prompt plus `<praxis-agent-context-graph-packet>` containing selected graph facts, citations, omissions, risk, and agent-use rules.

### 2. Ask orchestration is real and tested

The chat route builds an orchestration receipt after context/evidence assembly (`src/app/api/ai/chat/route.ts:586-604`), applies its model choice to the runtime receipt (`src/app/api/ai/chat/route.ts:605-611`), potentially queues an AgentRun (`src/app/api/ai/chat/route.ts:612-623`), and appends work-intent guidance to the system prompt (`src/app/api/ai/chat/route.ts:624-630`).

The orchestrator classifies complexity, gets the routing decision, selects tools, determines whether to queue, builds grounding and generation-budget receipts, creates the workflow plan, and returns the supervisor action (`src/lib/ai/ask-orchestrator.ts:190-330`). Workflow plans include the process rail and source-check lane when needed (`src/lib/agent-runtime/workflow-plan.ts:54-110`, `src/lib/agent-runtime/workflow-plan.ts:130-153`).

The status rail is explicit: context, triage, agent, documents, tools, language-policy, and worker events are built from the orchestration receipt (`src/lib/ai/ask-orchestrator.ts:398-500`).

### 3. Direct and queued branches both exist

For direct answers, `maybeQueueAskAgentRun()` returns unless the supervisor action is `queue_agent_run` (`src/app/api/ai/chat/route.ts:1249-1253`). For queued runs, the route creates an AgentRun with capsule pointers, context package id, selected core ids, workflow plan, triage decision, selected tools, grounding plan, and capsule-agent execution context (`src/app/api/ai/chat/route.ts:1298-1355`). It emits a triage event (`src/app/api/ai/chat/route.ts:1357-1373`) and calls `enqueueAgentRunDispatch()` (`src/app/api/ai/chat/route.ts:1381-1427`).

Cloud Tasks defaults to `projects/praxisbytacitus/locations/us-central1/queues/agent-runs`, targets `/api/agents/runs/{runId}/execute`, builds a base64 JSON task body, and supports OIDC (`src/lib/agent-runtime/cloud-tasks.ts:58-116`). The enqueue function claims dispatch idempotently, creates the task, marks dispatch metadata, appends a dispatch event, and publishes a PRAXIS event (`src/lib/agent-runtime/cloud-tasks.ts:126-245`).

The execute route is worker-only, rejects browser auth by design, verifies HMAC/shared-secret or Cloud Tasks OIDC auth, validates the payload, and calls `executeAgentRun()` (`src/app/api/agents/runs/[runId]/execute/route.ts:1-33`; `src/lib/agent-runtime/worker-auth.ts:5-43`). The worker dispatches concrete modes by policy agent: research memo, source-gap scout, capsule quality review, daily brief, boardroom discussion, output formatter, review agents, multi-agent supervisor, and no-op fallback (`src/lib/agent-runtime/worker.ts:196-235`).

### 4. Capsule context is hardened for missing and legacy profiles

`withCalibration()` now treats a null analyst profile as acceptable legacy/default calibration, but still rejects genuinely partial new profiles with 403 onboarding (`src/lib/api/with-calibration.ts:84-92`, `src/lib/api/with-calibration.ts:186-199`). It then passes `capsuleId` and `activeContextStack` into `buildCalibratedContext()` (`src/lib/api/with-calibration.ts:300-310`).

`buildCalibratedContext()` wraps each read so a profile read failure does not abort context construction (`src/lib/context/profile-context.ts:141-150`). It returns neutral output constraints when profile is null (`src/lib/context/profile-context.ts:266-276`). Unit tests cover missing profile/missing situation neutral context and Firestore profile-read failure (`tests/unit/lib/context/profile-context.test.ts:26-34`, `tests/unit/lib/context/profile-context.test.ts:62-65`).

The legacy migration path lazily mirrors `users/{uid}.onboardingCompletedAt` into `profile/analyst.meta.completedAt` and deletes legacy fields after successful migration (`src/lib/firebase/analyst-profile-admin.ts:120-161`). The migration fills sane defaults through `legacyOnboardingProfile()` (`src/lib/firebase/analyst-profile-admin.ts:174-212`).

### 5. The `/app/capsules` agent-context panel exists in code

`/app/capsules` renders `TaskletPraxisWorkbench` (`src/app/app/capsules/page.tsx:13-18`). `CapsuleWorkbenchPanel` has a proof-surface toggle between human graph and agent context; selecting agent renders `CapsuleAgentView` (`src/components/capsules/CapsuleWorkbenchPanel.tsx:57-82`, `src/components/capsules/CapsuleWorkbenchPanel.tsx:102-123`).

`CapsuleAgentView` calls `/api/context/capsules/{capsuleId}/agent-packet`, handles loading/error/empty states, and renders the visible label "What the agent sees" (`src/components/capsules/CapsuleAgentView.tsx:54-100`, `src/components/capsules/CapsuleAgentView.tsx:105-155`). The API route is authenticated, returns packet text, selected counts, omissions, grounding map, and risk flags (`src/app/api/context/capsules/[capsuleId]/agent-packet/route.ts:52-80`, `src/app/api/context/capsules/[capsuleId]/agent-packet/route.ts:155-192`).

## Broken or Risky

### High: Boardroom visible dock is not guaranteed to be the authoritative run binding

The Boardroom page computes `boardroomContext` from URL context plus `activeContextStack` (`src/components/boardroom/boardroom-workspace.tsx:130-139`). The run payload sends only `capsuleId`, `contextStackId`, selected documents, and selected sources (`src/components/boardroom/boardroom-workspace.tsx:236-249`). The visible dock, however, renders directly from `activeContextStack` (`src/components/boardroom/boardroom-workspace.tsx:447-472`).

The server resolves the capsule and then reconstructs prompt context from the stored stack, falling back to the default stored stack (`src/app/api/boardroom/runs/route.ts:25-44`, `src/app/api/boardroom/runs/route.ts:76-92`). Run metadata keeps only `dockCapsuleIds` as a flat list, not typed `{role, capsuleId}` bindings (`src/lib/boardroom/schema.ts:195-216`). This can make the UI appear to run one User/Situation/Tool/Output dock while the AgentRun uses another stored stack.

### High: Boardroom can truncate away the dock prompt layer

The capsule prompt puts `buildCapsuleStarterPromptBlock()` before `buildCapsuleDockPromptBlock()` (`src/lib/context/context-injection.ts:199-200`). Boardroom stores only `injectable.promptBlock.slice(0, 12_000)` (`src/app/api/boardroom/runs/route.ts:89-92`). The live runner then prepends that stored block to the boardroom evidence block (`src/lib/boardroom/live-runner.ts:80-88`, `src/lib/boardroom/live-runner.ts:263-278`). Rich starter definitions can therefore push `[capsule_dock]` past the slice boundary, causing the board agents to lose the dock contract.

### Medium: Typed dock slots are only partially structured

`AskContextBar` persists a stack containing `stackId`, `capsuleId`, and `capsuleRefs` when attaching capsules to slots (`src/components/app/ask-context-bar.tsx:122-132`). `assignCapsuleToDockSlot()` replaces the slot occupant and rebuilds refs (`src/lib/context/active-context-stack.ts:406-429`), but the review found it does not project slot semantics into all downstream structured fields. The stack can still warn `missing-output` when `outputGoal` is unset (`src/lib/context/active-context-stack.ts:335-342`), even if an Output capsule is visually docked.

### Medium: Dock prompt text is not escaped like the system prompt block

`buildCapsuleDockPromptBlock()` interpolates capsule labels and summaries directly into the prompt (`src/lib/context/context-injection.ts:245-272`). This is better than untyped context because it has role contracts and precedence rules, but it does not use the angle-bracket escaping pattern used by the system prompt block. A malicious or accidental capsule label/summary could imitate prompt tags.

### Medium: Model matrix policy needs clarification

The request described the expected routing as Gemini 2.5-family per `MODEL_MATRIX` and warned not to propose forbidden `gemini-3` or `gemini-2.0` strings. The current matrix primary task kinds are `gemini-3.5-flash`, while Ask stable fallbacks are Gemini 2.5 (`src/lib/ai/MODEL_MATRIX.json:1-45`, `src/lib/ai/MODEL_MATRIX.json:72-99`). `getAskPraxisModelRuntimePolicy()` reads primary model ids from the matrix (`src/lib/ai/model-runtime-policy.ts:45-62`). Provider isolation passed, so this is not a hardcoded-route leak, but product/model policy should be reconciled before claiming only Gemini 2.5-family routing.

### Verification gap: live authenticated panel and live Cloud Tasks

The focused source tests passed, and Firebase MCP could read project/database metadata. However, local CLI cloud checks failed on credential-file/configstore permissions, and no authenticated `/app/capsules` browser session was available. Treat live UI and Cloud Tasks proof as pending.

## Ladybug Feasibility

Current import behavior intentionally skips Ladybug artifacts. DIALECTICA import marks `graph/ladybug/*` in `layersSkipped` when present and writes an import note that binary Ladybug artifacts are read-only/rebuildable and are not imported (`src/lib/context/dialectica-capsule-import.ts:191-210`). The importer maps `graph.jsonld` into an embedded graph projection instead (`src/lib/context/dialectica-capsule-import.ts:350-412`, `src/lib/context/dialectica-capsule-import.ts:601-618`). Unit tests assert the skip (`tests/unit/lib/context/dialectica-capsule-import.test.ts:112-123`; `tests/unit/lib/context/capsule-import-preview.test.ts:57-72`).

The fixture describes the `.lbug` projection as read-only embedded Cypher traversal: `graph/ladybug/capsule.lbug` is for traversal, neighborhoods, and previews, and should be rebuilt from `graph.jsonld` when the manifest digest changes (`tests/fixtures/dialectica-capsule/runtime.json:11`, `tests/fixtures/dialectica-capsule/operations.md:5`).

Feasibility:
- High for read-only import metadata: record the Ladybug manifest, digest, and rebuild command as advisory capsule metadata.
- Medium for packet backing: add a rebuild step that converts `graph.jsonld` into normalized neighborhoods/path rows and feeds the existing packet `incident-neighborhoods` and `reasoning-paths`.
- Low for direct `.lbug` embedding today: no current runtime reader is wired, binary artifacts are intentionally skipped, and direct binary import would create a second graph truth source.

Recommendation: do not import `.lbug` as canonical. Rebuild a deterministic, read-only Ladybug-derived projection from `graph.jsonld`, store only digest/version/projection metadata plus normalized path/neighborhood rows, and feed those rows into the packet as advisory graph context.

## Web Quick Wins

Ranked by impact/effort for PRAXIS capsule-to-agent context quality:

1. High impact / medium effort: add contextual retrieval at ingestion time for capsule chunks. Anthropic reports Contextual Retrieval can reduce failed retrievals by 49%, and by 67% when combined with reranking. Apply this to source/document/core chunks before embedding and BM25 indexing. Source: https://www.anthropic.com/engineering/contextual-retrieval

2. High impact / medium effort: add hybrid retrieval plus reranking before packet assembly. Anthropic's findings stack contextual embeddings, contextual BM25, and reranking; PRAXIS already has typed packet budgets, so this should be introduced as a salience-rerank stage before `buildAgentContextPacket()`. Source: https://www.anthropic.com/engineering/contextual-retrieval

3. High impact / high effort: add GraphRAG-style community summaries for global capsule questions. Microsoft GraphRAG improves global sensemaking by deriving an entity graph and community summaries, useful for "catch me up" or relationship-heavy policy questions. Use this for capsule-level overview and not as a replacement for source receipts. Sources: https://arxiv.org/abs/2404.16130 and https://www.microsoft.com/en-us/research/blog/graphrag-improving-global-search-via-dynamic-community-selection/

4. Medium impact / low-medium effort: add Trust-Score-like evals for grounded refusal and citation quality. Trust-Score evaluates whether a model answers only from documents, cites claims correctly, and refuses when context is insufficient. Add eval cases for empty/thin capsules and stale/advisory rows. Source: https://arxiv.org/abs/2409.11242

5. Medium impact / low effort: create a fixed retrieval eval set of question -> expected capsule/source rows. Run it on every packet/reranker change so context quality regressions are caught before UI proof looks green.

## Ranked Improvement Backlog

| Rank | Improvement | Impact | Effort | Acceptance criteria |
|---:|---|---|---|---|
| 1 | Make Boardroom submit and render the same resolved structured dock payload | High | Medium | Run metadata stores `{role,capsuleId,label,version}`; UI displays that exact object; test proves URL/stored-stack mismatch cannot occur. |
| 2 | Stop blind Boardroom prompt slicing | High | Medium | `[capsule_dock]` is always retained; tests cover rich starter capsules over 16k chars. |
| 3 | Add authenticated browser proof for `/app/capsules` agent panel | High | Low-medium | Playwright storage state/test account opens `/app/capsules`, toggles Agent context, sees `What the agent sees`, no console errors or overflow. |
| 4 | Add direct `/api/context/capsules/[capsuleId]/attach` route tests | Medium | Low | New/legacy user attach paths return non-403 and no null pointer with capsule signal. |
| 5 | Escape capsule label/summary text in dock prompt blocks | Medium | Low | Tag-injection test mirrors `system-prompt-block` escaping expectations. |
| 6 | Add contextual retrieval + rerank before packet salience selection | High | Medium | Retrieval eval set improves expected-source recall; packet budget still enforced. |
| 7 | Reconcile model matrix policy | Medium | Low | Docs and matrix agree on allowed primary/fallback model families; provider isolation continues to pass. |

