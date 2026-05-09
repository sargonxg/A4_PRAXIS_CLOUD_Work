# Slice 10 - Ask Runtime Persistence Seam

**State:** in-progress
**Brief:** 01, 02, 04
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** Slice 04, Slice 08, Slice 09
**Blocks:** Ask end-to-end, skill-run execution, Output promotion
**Estimated size:** S (100-300)

---

## Goal in one sentence

Make Ask PRAXIS write real owner-scoped v7 thread/message records from the UI without pretending that the full calibrated generation runtime has already moved to the new router.

---

## In scope

- [x] Add FastAPI router `backend/routers/ask.py`.
- [x] Register `/api/v1/ask` and `/v1/ask` in `backend/main.py`.
- [x] Add `POST /ask/run` to create or append to an owner-scoped Ask thread.
- [x] Add `GET /ask/threads` to list active owner-scoped Ask threads.
- [x] Route all SQL through `tenant_session(token["uid"])`.
- [x] Expose `ask/run` and `ask/threads` through the authenticated Next backend proxy.
- [x] Add local backend fallback that is visibly non-persistent.
- [x] Add `V7AskRuntimePanel` to `/app/ask`.
- [x] Add `audit:v7-ask-runtime` and wire it into `audit:gate` and `audit:architecture-chain`.

## Out of scope

- Replacing the existing calibrated chat stream.
- Full skill execution from Ask.
- SSE streaming from the new Ask router.
- Citation persistence on generated assistant answers.
- Production migration application.

## Acceptance criteria

- [x] `POST /api/backend/ask/run` is allowed by the proxy and maps to FastAPI `/api/v1/ask/run`.
- [x] Backend writes `ask_threads` and `ask_messages` with `owner_uid`.
- [x] Existing calibrated `ChatInterface` remains available below the persistence panel.
- [x] UI copy clearly says full calibrated generation still runs through the existing chat path.
- [x] `npm run audit:v7-ask-runtime` passes.
- [x] `npm run audit:v7-shell-skeleton` passes.
- [x] `npm run audit:ask-thread-substrate` passes.
- [x] `npm run audit:architecture-chain` passes.
- [x] `python -m py_compile backend\routers\ask.py backend\main.py backend\services\ask\types\models.py` passes.
- [x] `npx tsc --noEmit` passes.

## Rollback

Delete `backend/routers/ask.py`, remove Ask router registration from `backend/main.py`, remove `V7AskRuntimePanel`, remove `ask/*` proxy allowlist entries, and remove `audit:v7-ask-runtime` from `package.json` and `audit-architecture-chain`.
