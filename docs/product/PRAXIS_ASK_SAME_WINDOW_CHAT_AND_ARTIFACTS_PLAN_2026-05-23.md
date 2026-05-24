# PRAXIS Ask Same-Window Chat And Artifacts Plan

Date: 2026-05-23
Status: proposal
Scope: Ask PRAXIS, saved conversations, ContextCapsules, agent activity, sources, and output artifacts

## Executive Decision

Ask PRAXIS should behave like a simple ChatGPT-style chat for the user, while
retaining the deeper PRAXIS context, capsule, sourceability, agent, and output
system behind the scenes.

The recommended product shape is a single Ask window:

```text
Ask bar -> same conversation thread -> answer message -> inline receipts/sources/actions
        -> optional right-side work panel for artifacts, source previews, and agent activity
```

Do not make answers open a new app page by default. Do not send the user to Memo
Studio automatically after an answer. Memo Studio, repository, output capsules,
and agent runs should be reachable from the same Ask window as review targets,
not as forced route changes.

The visible promise:

```text
Ask PRAXIS like a normal chat.
PRAXIS quietly reads the active ContextCapsule, uses tools when useful, shows
source posture and agent activity when it matters, and lets the user turn any
answer into a reviewable artifact without leaving the conversation.
```

## Current Diagnosis

### What already exists

- `src/components/praxis/tasklet-praxis-workbench.tsx` is already the strongest
  Ask cockpit. It uses `/api/conversations/[conversationId]/turns`, saves
  conversation records, streams answers, displays answer envelopes, source
  previews, follow-ups, routing receipts, traceability, and text-span actions.
- `src/components/praxis/tasklet-workbench-conversation.ts` already has the
  conversation URL helpers, saved turn normalization, legacy history loading,
  and safe markdown link handling.
- `src/app/app/conversations/[conversationId]/page.tsx` already reloads a saved
  conversation by mounting `TaskletPraxisWorkbench` with `initialPanel="ask"`.
- `src/app/api/conversations/[conversationId]/turns/route.ts` is the canonical
  saved-turn route. It validates auth/tier/capsule context, upserts the
  conversation, and delegates to `/api/ai/ask-praxis`.
- `src/lib/ai/ask-answer-envelope.ts` already defines the useful answer sidecars:
  source cards, claim grounding, source audit, traceability, continuation
  actions, capsule suggestions, research graph receipts, follow-ups, and a
  document pack candidate.
- `src/lib/output-capsules/*` already gives PRAXIS durable output templates for
  memos, briefs, annexes, dashboards, and handover-style products.

### What is hurting the experience

- `src/components/ask/AskStreamPanel.tsx` still streams directly to
  `/api/ai/ask-praxis`. That bypasses the canonical saved-turn contract used by
  the workbench. It creates a second Ask behavior and should be retired or
  converted into the same conversation client.
- `AskStreamPanel` uses `window.location.assign('/app/write')` after saving a
  document pack. That breaks the single-window promise. The default should be to
  create an artifact card/panel in the current conversation, with an optional
  "Open in Memo Studio" action.
- The workbench has a separate `PraxisGuideChat` portal. It is useful, but it
  can teach users that PRAXIS has multiple chat boxes. For the primary product,
  the guide should become a lightweight mode, suggestion row, or help thread
  inside the main Ask conversation instead of a separate assistant window.
- Agent runs currently have separate routes such as `/agents/[runId]`. Those
  can remain deep links, but normal users should see the agent run as a message
  part and side-panel card first.
- The same answer sidecars are rendered in two places with similar code:
  `AskStreamPanel` and `TaskletPraxisWorkbench`. This increases drift in source
  previews, receipts, artifacts, and follow-up behavior.

## Research Signals

These external patterns support the plan:

- Vercel AI SDK UI recommends message persistence around `UIMessage` format and
  `toUIMessageStreamResponse`/`onFinish`, so the display shape and storage shape
  stay aligned instead of persisting only raw text.
  Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
- Vercel AI SDK UI custom data parts are designed for status, references,
  progressive data, and interactive components alongside model text. Data parts
  with stable IDs reconcile in place, which maps cleanly to PRAXIS agent
  activity, source previews, artifact drafts, and output-capsule status.
  Source: https://www.mintlify.com/vercel/ai/ai-sdk-ui/streaming-data
- AI SDK UI message streams expose text, tool calls, tool results, and resume
  behavior as message parts, which is the right shape for PRAXIS to stop
  treating tool/agent activity as a separate UI surface.
  Source: https://ai-sdk.dev/docs/ai-sdk-ui/reading-ui-message-streams
- Next.js App Router supports keeping multiple route-backed UI slots visible in
  one layout through parallel routes, and supports shallow URL updates with
  `window.history.pushState`. PRAXIS already uses `pushState` for conversation
  links; this should become intentional URL state, not a route-change escape
  hatch.
  Source: https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes
  Source: https://nextjs.org/docs/app/guides/single-page-applications
- OpenAI Canvas and Claude Artifacts both show the same product lesson: plain
  chat stays simple, while long-form or reusable outputs move into a more
  editable work area. PRAXIS should adapt that pattern, but keep the work area
  inside the Ask window rather than forcing a new app page.
  Source: https://openai.com/index/introducing-canvas/
  Source: https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them
- Vercel AI Elements provides prebuilt chat/message/tool/reasoning/source/action
  components. PRAXIS should selectively adopt or mirror those primitives for
  message rendering and response actions rather than expanding custom chat UI
  code in multiple components.
  Source: https://vercel.com/changelog/introducing-ai-elements

## Target UX

### 1. One Ask PRAXIS Window

Default authenticated screen:

```text
Top: active context strip
Middle: conversation thread
Right: collapsible work panel
Bottom: prompt bar
```

The user sees one prompt bar and one conversation. The right work panel is not a
separate app. It is a detail view for the selected conversation message.

Suggested panel tabs:

- `Answer`: rendered artifact or selected answer detail
- `Sources`: source cards, source receipts, weak claims, missing evidence
- `Agent`: routing receipt, tool calls, durable AgentRun status, approvals
- `Capsule`: active capsule stack, context health, applied suggestions
- `Artifact`: current memo/draft/annex/output capsule with versions

On mobile, the right panel becomes a bottom sheet launched from message action
buttons.

### 2. Chat First, Receipts Progressive

Each assistant message should start with the answer. Receipts should not crowd
the first read. Use a compact rail under the answer:

```text
Sources 5 | Tools 2 | Capsule ready | Agent queued | Artifact draft
```

Clicking a chip opens the side panel to the relevant tab. The full receipts
remain available for serious analyst work.

### 3. Artifacts Are Message Parts

Artifact creation should not navigate away. A PRAXIS artifact is a sidecar on a
conversation turn:

```ts
type PraxisConversationArtifact = {
  artifactId: string;
  conversationId: string;
  turnId: string;
  kind: 'text' | 'memo' | 'evidence_annex' | 'source_table' | 'briefing' | 'output_capsule';
  title: string;
  status: 'draft' | 'review' | 'approved' | 'shipped';
  version: number;
  markdown?: string;
  blocks?: unknown[];
  sourceCardIds: string[];
  capsuleIds: string[];
  outputCapsuleId?: string | null;
  memoId?: string | null;
  createdAt: string;
  updatedAt: string;
};
```

The message can say "I drafted an options memo" while the panel shows the memo.
The user can edit, copy, save to Memo Studio, save as Output Capsule, attach a
selected span to a capsule, or ask PRAXIS to revise it, all without leaving the
conversation.

### 4. One Canonical Ask Client

Create one shared client contract for Ask messages and stream parts:

```text
src/components/ask/ask-conversation-client.tsx
src/components/ask/ask-message-parts.tsx
src/components/ask/ask-artifact-panel.tsx
src/components/ask/ask-composer.tsx
```

`TaskletPraxisWorkbench` should consume those components. `AskStreamPanel`
should either be removed or refactored into a wrapper around the same client.

### 5. One Canonical Ask Route

Normal authenticated Ask should use:

```text
POST /api/conversations/[conversationId]/turns
GET  /api/conversations/[conversationId]
GET  /api/conversations
```

`/api/ai/ask-praxis` remains the internal generation/orchestration delegate, not
the UI's primary endpoint.

Public/demo Ask can still have a lighter route, but once a user is logged in,
the saved conversation route should be the default.

## Message Stream Contract

The best next technical shape is a typed stream that can carry:

- `text`: the visible answer
- `data-status`: transient routing/progress updates
- `data-source-card`: persistent source preview cards
- `data-agent-step`: persistent or reconciled agent activity
- `data-claim-ledger`: persistent sourceability/claim review summary
- `data-artifact`: persistent artifact draft or artifact update
- `data-capsule-suggestion`: persistent ContextCapsule suggestion
- `tool-*`: tool invocation and result parts when the runtime emits first-class
  tool calls

The existing `AskAnswerEnvelope` can remain the server-side synthesis object,
but the client should progressively render it as parts. This avoids "wait for
the envelope, then render everything" behavior and makes the UI feel alive.

## Implementation Plan

### Phase 1 - Stop Surface Drift

Goal: make every authenticated Ask answer stay in the same conversation window.

Changes:

- Replace `AskStreamPanel` direct calls to `/api/ai/ask-praxis` with the saved
  conversation route, or remove it from active app paths in favor of the
  workbench client.
- Replace `window.location.assign('/app/write')` in Ask answer actions with an
  in-window artifact draft panel. Keep "Open in Memo Studio" as a secondary
  explicit button.
- Make `PraxisGuideChat` a mode in the main Ask composer, not a second floating
  chat window. Example modes: `Ask`, `Guide`, `Source-check`, `Draft`,
  `Capsule improve`.
- Keep `pushConversationUrl` but make it the documented same-window URL sync
  behavior. Do not use `router.push` for normal answer creation.

Primary files:

- `src/components/praxis/tasklet-praxis-workbench.tsx`
- `src/components/praxis/tasklet-workbench-conversation.ts`
- `src/components/ask/AskStreamPanel.tsx`
- `src/app/app/conversations/[conversationId]/page.tsx`
- `src/app/api/conversations/[conversationId]/turns/route.ts`

### Phase 2 - Add The Artifact Sidecar

Goal: produce reusable policy artifacts inside the same Ask window.

Changes:

- Add a `conversationArtifacts` subcollection under the user conversation or
  mirror through existing output-capsule storage:

```text
users/{uid}/conversations/{conversationId}/artifacts/{artifactId}
```

- Create artifact records from `AskAnswerEnvelope.documentPackCandidate` and
  continuation actions.
- Render artifact cards under the assistant message and the selected artifact in
  a right panel.
- Add versioned artifact actions:
  - revise in chat
  - copy
  - save to Memo Studio
  - save as Output Capsule
  - attach selected span to ContextCapsule
  - export docx/pdf where existing routes support it

Primary files:

- `src/lib/ai/ask-answer-envelope.ts`
- `src/lib/memo/from-ask.ts`
- `src/lib/output-capsules/storage.ts`
- `src/lib/output-capsules/types.ts`
- new `src/lib/conversations/artifacts.ts`
- new `src/components/ask/AskArtifactPanel.tsx`

### Phase 3 - Convert Receipts Into Message Parts

Goal: make agentic work feel like a normal chat answer with visible but
non-intrusive proof.

Changes:

- Convert orchestration events, source cards, claim ledger, capsule suggestions,
  and artifact drafts into typed client parts.
- Add stable IDs for reconciliation so "Searching sources..." updates into
  "5 sources checked" in place.
- Render compact message chips first; show the full receipt in the side panel.
- Preserve the existing full panels for analyst power users.

Primary files:

- `src/lib/ai/ask-orchestrator.ts`
- `src/lib/ai/tasklet-stream.ts`
- `src/components/praxis/tasklet-praxis-workbench.tsx`
- new `src/components/ask/AskMessageParts.tsx`

### Phase 4 - Make Agent Runs Conversation-Native

Goal: a long-running agent should appear as part of the same Ask thread.

Changes:

- When `orchestrationReceipt.supervisor.queuedRun` exists, render it as an
  inline agent card under the answer.
- Stream or poll `/api/agents/runs/[runId]/stream` inside the same panel.
- Keep `/agents/[runId]` as a deep detail link, not the default click target.
- Approvals should open in-window confirmation cards, not a separate cockpit.

Primary files:

- `src/lib/agent-runtime/schema.ts`
- `src/lib/agent-runtime/worker.ts`
- `src/lib/agent-runtime/mirror.ts`
- `src/components/praxis/tasklet-praxis-workbench.tsx`
- `src/hooks/useOrchestratorEvents.ts`

### Phase 5 - Polish The Prompt Bar

Goal: make the prompt bar feel as simple as ChatGPT but context-aware.

Recommended prompt bar behavior:

- One textarea, one send button, one attachment/source button, one mode menu.
- Context shown as removable chips above the bar, not as a large control panel.
- Slash commands remain supported, but normal language should be preferred.
- Capsule suggestions appear as small chips only after the user types enough
  meaningful text.
- The bar should preserve draft text across route/query changes.
- Enter sends, Shift+Enter creates newline.
- During streaming, the send button becomes stop.

Modes:

- `Ask`: answer directly
- `Draft`: produce a policy artifact
- `Source-check`: inspect claims and gaps
- `Research`: deeper source and graph pass
- `Capsule`: build or improve ContextCapsules

The mode should guide routing but not expose model/tool internals.

## Acceptance Criteria

- A user can ask a question from `/app`, receive the answer in the same visible
  conversation, and keep typing follow-ups without route changes.
- A user can reload `/app/conversations/[conversationId]?capsuleId=...` and see
  the same messages, sources, receipts, and artifact cards.
- "Draft document pack" creates an in-window artifact first. It does not
  redirect to `/app/write`.
- "Open in Memo Studio" remains available as an explicit secondary action.
- Agent activity is visible under the answer and in the side panel. The user
  does not need to open `/agents/[runId]` to understand what happened.
- Source cards, claim ledger, and traceability remain attached to the answer.
- Public/demo users see a simple non-persisted Ask path; authenticated users use
  the saved conversation route.
- There is only one primary Ask PRAXIS prompt bar in the app surface.

## Test And Audit Plan

Unit and contract tests:

- `tests/unit/app/api/conversations-turns-contract.test.ts`
- `tests/unit/lib/ai/ask-conversation.test.ts`
- `tests/unit/lib/ai/ask-answer-envelope.test.ts`
- `tests/unit/components/tasklet-workbench-conversation.test.ts`
- `tests/unit/components/tasklet-workbench-contract.test.ts`
- add tests for artifact sidecar creation and same-window actions

E2E and smoke:

- authenticated Ask creates conversation, streams answer, persists turn
- reload conversation URL restores messages and artifact sidecars
- draft artifact stays in same window
- source preview and follow-up chips continue conversation
- queued agent run card updates in same Ask surface
- mobile bottom-sheet artifact panel does not hide the prompt bar

Audits:

- extend `npm run audit:ask-cockpit-runtime`
- add `npm run audit:ask-same-window-contract`
- include route checks that authenticated Ask UI does not call
  `/api/ai/ask-praxis` directly

Final gates:

```bash
npm test -- tests/unit/app/api/conversations-turns-contract.test.ts
npm test -- tests/unit/lib/ai/ask-conversation.test.ts
npm test -- tests/unit/lib/ai/ask-answer-envelope.test.ts
npm test -- tests/unit/components/tasklet-workbench-conversation.test.ts
npm test -- tests/unit/components/tasklet-workbench-contract.test.ts
npm run audit:ask-cockpit-runtime
npm run audit:ask-same-window-contract
npm run typecheck
npm run build
```

## First Implementation Slice

The first slice should be narrow:

1. Make the active Ask UI always use `/api/conversations/[conversationId]/turns`.
2. Remove automatic navigation to `/app/write` from answer actions.
3. Add a local in-window `ArtifactDraftPanel` fed by
   `documentPackCandidate`.
4. Keep the current receipt/source panels, but collapse them behind compact
   chips by default.
5. Add contract tests that fail if an authenticated Ask submit calls
   `/api/ai/ask-praxis` directly from the client.

This gives users the core improvement immediately: answers stay in the same
window, artifacts are born inside the chat, and PRAXIS still has all its deeper
policy analyst machinery available.
