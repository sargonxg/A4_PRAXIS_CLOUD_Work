# PRAXIS Agentic Workflow, Capsule, Conversation, And Account Audit

Date: 2026-05-17

## What Is Implemented In This Pass

- The canonical saved-turn submit path now exists at `POST /api/conversations/[conversationId]/turns`.
- The one-bar composer posts to that conversation endpoint instead of calling `/api/ai/ask-praxis` directly.
- Free-tier users are gated server-side to one new saved conversation per ISO week; paid tiers can start more conversations.
- Existing conversations can continue after the weekly free allowance is used.
- Conversation records store the current applied capsule snapshot before turns run and whenever the active capsule strip changes.
- Conversation turn receipts now include intent, selected skill, applied capsule ids, context package id, tools considered, tools used, output destination, and approval posture.
- Remaining pre-baked action rows above the main bar were removed from the default surface.
- Account settings now include live billing actions backed by `/api/billing/checkout` and `/api/billing/portal`, with safe unconfigured fallbacks.

## AI-Callable Tool Inventory

Ask PRAXIS currently receives two direct tool groups in `src/app/api/ai/chat/route.ts`:

- Situation-bound tools from `createSituationBoundTools(...)`, including graph query, escalation assessment, talking points, drafting, negotiation analysis, narrative mapping, historical parallels, timeline, sanctions, humanitarian snapshot, and conflict comparison.
- Ask PRAXIS extension tools from `buildAskPraxisExtensions(...)`, including write-to-tool, grounded search fetch, deep research routing, and capsule/source proposal behavior.

The durable agent runtime has a separate approval-aware registry in `src/lib/agent-runtime/tool-registry.ts`:

- `context-resolve`
- `capsule-evidence-pack`
- `sourceability-reviewer`
- `policy-memo`
- `output-capsule-save`
- `graph-mutation`
- `external-export`
- `browser-mcp-write`
- `unsupported-claim-acceptance`

Capsule recommendations come from `src/lib/tools/recommend.ts` and should remain recommendations unless attached to a capsule or selected by the router. The default cockpit should not expose these as manual agent dropdowns.

## Remaining Verification Gate

This audit confirms the local implementation shape. Production still needs a deployment and live smoke because the earlier live check showed the new routes were not yet present on `praxis.tacitus.me`.

Required live checks after deploy:

- `/` and `/app` render the same one-bar cockpit.
- `/app/capsules` and the below-bar gallery use the same capsule API/source for authenticated users.
- `/app/settings` exposes one top-right account path, usage, billing, and security settings.
- `/app/conversations/[conversationId]` restores the saved conversation.
- `POST /api/conversations/[conversationId]/turns` streams a response and persists a turn receipt.
- `POST /api/billing/checkout` and `POST /api/billing/portal` either redirect through Polar when configured or return an explicit unconfigured status.
