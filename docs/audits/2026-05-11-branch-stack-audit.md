# PRAXIS Branch Stack Audit - 2026-05-11

## Scope

Read-only audit of the current repository branch state after production deploy
`praxis-frontend-00318-hvb`.

Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

Current checkout:

- Branch: `main`
- Head: `b5e4a609 test(core-stack): stabilize production smoke`
- Worktree status: clean
- Registered worktrees: only `C:/Users/giuli/ANTIGRAVITY/PRAXISMAY2026/A4_PRAXIS_CLOUD_Work`
- Nearby PRAXIS checkout scan under `C:/Users/giuli/ANTIGRAVITY/PRAXISMAY2026`: no other git checkout found

## Main Finding

There is no uncommitted code in the active checkout. The large amount of
unintegrated work is remote branch and PR stack debt from the v7 experiment.
Most of the open PRs are stacked against each other instead of current `main`,
and every active v7 branch is about 68 commits behind `origin/main`.

Do not merge the stale v7 stack directly into `main`. Salvage intentionally.

## Remote Branch Inventory

| Branch | Ahead of main | Behind main | Status | Diff against main |
| --- | ---: | ---: | --- | --- |
| `origin/claude/review-praxis-setup-0GOaI` | 0 | 60 | merged into main | no remaining diff |
| `origin/v7/loop-a-foundations` | 2 | 68 | stale open PR | 33 files, 4,900 insertions, 157 deletions |
| `origin/v7/bootstrap-current-state-audit` | 4 | 68 | stale draft PR | 125 files, 14,708 insertions, 266 deletions |
| `origin/docs/v7-generic-home-multicore` | 5 | 68 | stacked PR | 125 files, 14,780 insertions, 267 deletions |
| `origin/inspect/v7-block1-ground-truth` | 6 | 68 | stacked PR | 127 files, 14,983 insertions, 267 deletions |
| `origin/inspect/v7-block2-generic-home` | 7 | 68 | stacked PR | 134 files, 15,263 insertions, 267 deletions |
| `origin/inspect/v7-block3-cores-picker` | 8 | 68 | stacked PR | 141 files, 15,547 insertions, 267 deletions |
| `origin/inspect/v7-block5-cores-postgres` | 9 | 68 | stacked PR | 147 files, 15,791 insertions, 267 deletions |
| `origin/inspect/v7-block6-provider-isolation` | 10 | 68 | tip of stack | 153 files, 27,467 insertions, 6,464 deletions |

## GitHub PR Inventory

| PR | Branch | Base | State | Recommendation |
| ---: | --- | --- | --- | --- |
| #19 | `claude/review-praxis-setup-0GOaI` | `main` | merged | delete remote branch |
| #18 | `inspect/v7-block6-provider-isolation` | `inspect/v7-block5-cores-postgres` | open | preserve as stack tip for salvage review |
| #17 | `inspect/v7-block5-cores-postgres` | `inspect/v7-block3-cores-picker` | open | intermediate stack; do not merge directly |
| #16 | `inspect/v7-block3-cores-picker` | `inspect/v7-block2-generic-home` | open | intermediate stack; extract core picker ideas |
| #15 | `inspect/v7-block2-generic-home` | `inspect/v7-block1-ground-truth` | open | intermediate stack; extract only if still needed |
| #14 | `inspect/v7-block1-ground-truth` | `docs/v7-generic-home-multicore` | open | docs/audit evidence only |
| #10 | `docs/v7-generic-home-multicore` | `v7/bootstrap-current-state-audit` | open | docs-only delta; likely archive after extraction |
| #9 | `v7/bootstrap-current-state-audit` | `main` | open draft | stale base; superseded by current main work |
| #8 | `v7/loop-a-foundations` | `main` | open | old foundation pass; review before closing |

## Stack Shape

The active stacked sequence is:

`v7/bootstrap-current-state-audit`
-> `docs/v7-generic-home-multicore`
-> `inspect/v7-block1-ground-truth`
-> `inspect/v7-block2-generic-home`
-> `inspect/v7-block3-cores-picker`
-> `inspect/v7-block5-cores-postgres`
-> `inspect/v7-block6-provider-isolation`

Each branch after `v7/bootstrap-current-state-audit` is an ancestor-based
incremental stack. `v7/loop-a-foundations` is not an ancestor of
`v7/bootstrap-current-state-audit`; treat it as a separate old foundation PR.

## Useful Salvage Targets

High-value items to inspect and selectively port:

- `src/components/v7/v7-core-picker.tsx`
- `src/components/v7/v7-home-surface.tsx`
- `src/components/v7/v7-ask-surface.tsx`
- `src/components/v7/v7-core-drawer.tsx`
- `src/components/v7/v7-user-core-editor.tsx`
- `backend/routers/cores.py`
- `backend/routers/ask.py`
- `backend/services/cores/*`
- `backend/services/ask/*`
- `backend/tests/test_cores_owner_scoping_contract.py`
- `scripts/audit-cores-owner-scoping.ts`
- `scripts/audit-cores-picker-coverage.ts`
- `scripts/audit-v7-inline-cores.ts`
- `docs/v7/AUDIT_2026-05-09_BLOCK*.md`

## Risk Flags

1. The branch stack is stale against current `main` and overlaps with newer
   landing, dashboard, context creation, and active core-stack work.
2. The tip branch includes graphify artifact churn, which inflates the diff and
   should not drive product decisions.
3. Backend migrations and routers from the old stack need schema review before
   any direct port into the current app.
4. Some public UI work in the stack is likely superseded by the current landing
   and dashboard implementation.
5. Leaving all stacked PRs open makes GitHub look like there is a large amount
   of unfinished product work, even though much of it is historical or
   superseded.

## Recommended Cleanup Plan

1. Delete the already-merged remote branch
   `claude/review-praxis-setup-0GOaI`.
2. Keep `inspect/v7-block6-provider-isolation` as the only branch worth using
   for deep salvage review.
3. Create a fresh branch from current `main` for any salvage work.
4. Cherry-pick or manually port only focused, validated pieces from the stack.
5. Close PRs #10, #14, #15, #16, #17, and #18 after the salvage branch records
   which pieces were kept or rejected.
6. Close or archive PR #8 and draft PR #9 after confirming no unique foundation
   item is still needed.
7. Do not merge old v7 home or landing surfaces wholesale into current `main`.

## Immediate Next Work Queue

1. Compare the current dashboard `ActiveCoreStack` against
   `v7-core-picker.tsx` and port only missing drag/drop or persistence behavior.
2. Compare current context creation against `backend/routers/cores.py` and
   `backend/services/cores/*` for backend persistence gaps.
3. Decide whether Ask PRAXIS needs the old `backend/services/ask/*` substrate or
   whether the current Next/API route stack should remain the source of truth.
4. Add a current-main test that proves selected core order survives page reload
   once persistence is implemented.
5. After salvage, close the stale stacked PRs and delete their remote branches.
