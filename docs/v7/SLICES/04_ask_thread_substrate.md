# Slice 04 - Ask Thread Substrate

**State:** in-progress
**Brief:** 01, 02, 04
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** Slice 00, Slice 01, Slice 02, Slice 03
**Blocks:** Ask end-to-end, Cores attachment, Outputs promotion
**Estimated size:** M (200-600)

---

## Goal in one sentence

Give Ask PRAXIS a real v7 substrate contract: owner-scoped thread/message/citation tables, matching TypeScript/Pydantic types, a specific audit, and a flagged Ask surface that uses existing assistant primitives.

---

## In scope

- [x] Add migration `0022_ask_threads.py` for `ask_threads`, `ask_messages`, and `ask_message_citations`.
- [x] Add TypeScript Ask contracts under `src/lib/ask/types.ts`.
- [x] Add Pydantic mirrors under `backend/services/ask/types/`.
- [x] Add `scripts/audit-ask-thread-substrate.ts`.
- [x] Wire `audit:ask-thread-substrate` into `package.json` and `audit:gate`.
- [x] Render a real `/app/ask` preview through `V7AskSurface`.
- [x] Reuse `ChatInterface` instead of inventing a new chat primitive.
- [x] Extend the v7 Playwright smoke.
- [x] Update v7 status, execution TODO, changelog, and fix log.

## Out of scope

- FastAPI `backend/routers/ask.py`.
- Runtime persistence into the new Ask tables.
- Streaming SSE contract changes.
- Core drag-and-drop attachment persistence.
- Promotion from Ask message to memo/research/graph candidate.
- Production migration application.

## Acceptance criteria

- [x] Migration is reversible by code inspection and has explicit downgrade.
- [x] New Ask tables have `owner_uid text NOT NULL`.
- [x] RLS policies use `current_tenant()`.
- [x] TS/Pydantic Ask modes, route actions, message roles, and citation kinds match.
- [x] `/app/ask` renders a v7 Ask surface behind the v7 flag.
- [x] Existing calibrated `ChatInterface` remains the chat primitive.
- [x] `npm run audit:ask-thread-substrate` passes.
- [x] `npm run audit:v7-shell-skeleton` passes.
- [x] `npx tsc --noEmit` passes.
- [x] `npm run build` passes.
- [x] `npx vitest run` passes.
- [x] Flag-on Playwright smoke passes.

## Rollback

Delete `0022_ask_threads.py`, `src/lib/ask/types.ts`, `backend/services/ask/types/`, `scripts/audit-ask-thread-substrate.ts`, and `tests/unit/lib/ask/types.test.ts`; restore `/app/ask` to the generic `V7DestinationPage`; remove `audit:ask-thread-substrate` from `package.json`, `audit:gate`, and `audit-architecture-chain`.

## Open questions

- [ ] Should Ask persistence live in Next.js route handlers first or FastAPI first? Default: FastAPI router per brief 02, with Next proxy only.
- [ ] Should `0021_cores_backfill` land before runtime writes to `0022_ask_threads`? Default: yes for production, no for local schema scaffolding.

## Notes for Codex

The current Ask page still streams through the existing `ChatInterface` and `/api/ai/chat`. This slice makes the substrate explicit but does not claim Ask persistence is live.
