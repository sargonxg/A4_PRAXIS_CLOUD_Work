# Slice Template · v7

> **Path:** `docs/v7/SLICES/<NN>_<short-name>.md`
> Copy this file when opening a new slice. Fill the bracketed fields. Open
> as a GitHub issue with this body. Codex picks up from `STATUS.md` →
> this file.

---

# Slice [NN] — [short name]

**State:** proposed | in-progress | shipped | reverted
**Brief:** [00..04]
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** [list earlier slice IDs, or "none"]
**Blocks:** [list later slice IDs, or "none"]
**Estimated size:** S (≤ 200 LOC) | M (200–600) | L (600–1500). Anything > L splits.

---

## Goal in one sentence

[What changes for the user / for the system after this slice ships.]

---

## In scope (what Codex must do)

- [ ] [Concrete change 1, with file paths if known]
- [ ] [Concrete change 2]
- [ ] [Concrete change 3]
- [ ] Update `STATUS.md`, `CHANGELOG.md`, the brief.
- [ ] Add or extend audits if a new contract is introduced.
- [ ] Add tests for new code.

## Out of scope (what Codex must NOT touch)

- [Anything you want explicitly fenced off. Be specific.]
- Anything in `docs/v7/OPEN_QUESTIONS.md` not marked APPROVED.

## Acceptance criteria (Codex's done-checklist)

- [ ] All "in scope" boxes ticked.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run lint` clean.
- [ ] `npm run build` clean.
- [ ] `npm run audit:gate` green.
- [ ] `npx vitest run` green.
- [ ] [Slice-specific check 1, e.g., "new endpoint reachable, returns 200 with auth"]
- [ ] [Slice-specific check 2, e.g., "Lighthouse Performance ≥ 85 on landing"]
- [ ] PR body uses the template from `AGENTS.md` §9.
- [ ] Self-review (3 passes from `AGENTS.md` §4) signed off in the PR.

## Rollback

[How to undo this slice in one paragraph. Be specific: feature flag flip,
migration downgrade, route revert, etc. If there is no clean rollback, say
so and we'll redesign the slice.]

## Open questions (Codex MAY ask before starting; otherwise ship)

- [ ] [Question 1] — default: [Codex's default if no answer]
- [ ] [Question 2] — default: [...]

## Notes for Codex

[Free-form. Anything the brief doesn't already cover. References to specific
files, prior PRs, gotchas, "watch out for X". Keep this section short — if
it's getting long, the slice is too big.]
