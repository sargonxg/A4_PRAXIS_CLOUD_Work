# Spec #12 — Brainstorming Table on Cloud Tasks

## Problem
The synchronous prototype shipped in round 1 (Lane C) generates 5–7
turns + synthesis in one Pro-model call that takes 30–60 seconds. The
analyst stares at a spinner. Cloud Tasks fan-out turns each persona
turn into its own task so the UI streams rows as they land.

## Persona impact
- Every persona, especially mediator and diplomat (deliberation feels
  alive instead of static).

## Files
- `backend/routers/agents.py` (NEW) — dispatcher endpoint that the
  Cloud Tasks worker calls per turn.
- `src/app/api/ai/brainstorming-table/route.ts` (EDIT) — refactor:
  the synchronous path becomes the fallback; the new path enqueues
  one task per persona, writes a `tools/brainstorming-table` shell
  doc immediately so the UI can subscribe.
- `cloud_functions/run_persona_turn/` (NEW) — worker invoked per task.
  Reads the shell doc, runs `runAgent` for the assigned persona, writes
  the turn back to the shell doc.
- `cloud_functions/run_synthesis/` (NEW) — invoked after all persona
  turns complete; runs the synthesis chair persona and writes
  `tools/brainstorming-table.synthesis`.
- `src/app/app/brainstorming-table/page.tsx` (EDIT) — the page
  subscribes via `onSnapshot` to render rows as they land; loading
  spinner becomes a per-persona placeholder.

## Schema additions
`tools/brainstorming-table` doc gains:
```ts
status: 'pending' | 'running' | 'synthesis-pending' | 'completed' | 'failed';
turns: BrainstormingTurn[];          // populated incrementally
synthesis?: BrainstormingSynthesis;  // populated last
plannedPersonas: string[];
```

## Implementation order
1. Add `praxis.brainstorming` Cloud Tasks queue (`infrastructure/setup-gcp.sh`).
2. Author the shell-doc write helper.
3. Author `run_persona_turn` worker (HTTP target). Idempotent on
   `(brainstormingId, personaId)` via Firestore CAS.
4. Author `run_synthesis` worker. Triggered by an Eventarc filter on
   `tools/brainstorming-table.turns` reaching the planned count.
5. Refactor the chat-page subscription to render incrementally.
6. Add a "synchronous fallback" feature flag for backward compat
   (defaults off when the queue is healthy).

## Definition of done
- A 6-persona deliberation streams turns in <15 seconds total wall
  time (compared with ~45s sync).
- Failures on a single persona's task yield a "this persona failed —
  click to retry" row, not a blanket failure.
- `tool_runs/{id}` reflects per-turn lifecycle (started / completed /
  failed at the persona level).

## Validation gate
- `npm run audit:gcp` (queue + Eventarc + IAM bindings).
- Backend integration test against the dev project.

## Risks / open questions
- Cost: more API calls per deliberation (one Pro call per persona
  versus one combined call). Worth it for UX; but track per-tool
  cost in Stripe Meters (BIG #27).
- Idempotency: if the same task fires twice we must not double-write
  a turn — Firestore CAS on `(brainstormingId, personaId)`.
