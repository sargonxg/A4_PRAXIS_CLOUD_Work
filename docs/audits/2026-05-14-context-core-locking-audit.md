# Context Core Locking Audit - 2026-05-14

## Verdict

The app now has the right simple product shape: one visible Core Library,
one active capsule, drag/swap interactions, and Ask PRAXIS receiving one
injectable context block. The main remaining engineering risk was not UI
complexity. It was whether the backend treated a built capsule as a durable
object rather than a temporary visual state.

## What Was Working

- `/app/contexts` exposes the active capsule board and unified core library.
- `/api/cores/library` returns user, situation, tool, objective, product,
  source, graph, time, output, and memory cores from a canonical registry.
- `/api/context/capsules/[capsuleId]/swap` persists swaps into capsule
  `coreRefs`.
- Ask PRAXIS resolves the active capsule through
  `resolveInjectableContext()` and injects a `<praxis-context-capsule>` block.
- Capsule swap and injection are now covered by `audit:capsule-contract`.

## Gaps Found

1. Capsule mutation was not append-only enough.
   - `bumpCapsuleVersion()` updated the current capsule but did not write
     immutable version snapshots for lineage/diff/history consumers.

2. Built context could not be locked.
   - The UI and backend let users swap any core at any time. That is useful
     during assembly but risky after the capsule has become the basis for a
     memo, briefing, or team handoff.

3. Lock state was not part of the prompt contract.
   - Even if a lock existed, Ask PRAXIS needed to see it so it would treat
     fixed cores as stable context rather than proposing unnecessary swaps.

## Fixes Applied

- Added `lockedCoreKinds` to the capsule contract.
- Added `setCapsuleCoreLock()` in `src/lib/context/capsule-service.ts`.
- Made capsule version changes write `users/{uid}/capsules/{capsuleId}/versions/vN`.
- Made the swap route reject changes to locked core slots with HTTP `409`.
- Added visible lock/unlock controls on each capsule slot and blocked locked
  slots from click-swap and drag/drop swap.
- Added `locked_cores` and a lock-respecting rule to the injected context block.
- Extended focused tests to cover richer core refs, version snapshots, and lock
  injection.
- Extended `audit:capsule-contract` so these guarantees are checked.

## Remaining Work

- Add a signed-in browser test for: create capsule, swap tool/objective/product,
  lock situation core, attempt blocked swap, reload, Ask PRAXIS sees the locked
  capsule.
- Decide whether multi-core slots should append by default for sources/tools or
  replace by default. Current swap behavior replaces the slot's primary list.
