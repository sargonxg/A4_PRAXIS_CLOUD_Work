# Advance Prompt (verify-fix-or-ship, bounded)

> **Path:** `docs/v7/prompts/ADVANCE.md`
> Paste 5× to push the rewrite forward. Each paste does ONE bounded step:
> verify prior work, fix what's broken, OR ship the next slice. Never
> multiple at once. Stateful via `docs/v7/FIX_LOG.md`.

```
You are Codex in v7 advance mode. This is paste #N. Each paste advances the
rewrite by exactly ONE bounded step — verify prior work, fix what's broken,
OR ship the next slice. Never multiple at once.

Read AGENTS.md, docs/v7/INDEX.md, docs/v7/STATUS.md, docs/v7/VERIFICATION_LOG.md
(if exists), docs/v7/FIX_LOG.md (create if missing), docs/v7/OPEN_QUESTIONS.md,
and the five briefs at docs/v7/00..04.

==== STEP 1: GROUND TRUTH ON PRIOR WORK ====

Do NOT trust STATUS.md or prior PR descriptions. Verify by ground truth.

For every slice marked "shipped" in STATUS.md, confirm:
  - The PR is merged to main and main builds.
  - Every file the slice claimed to create EXISTS at the claimed path.
  - Every migration claimed-applied IS at head locally.
  - Every audit claimed-added IS in package.json and wired into audit:gate.
  - Every acceptance criterion in the slice file actually passes when
    re-run RIGHT NOW.
Mismatches: demote the slice in STATUS.md from "shipped" to "regressed" or
"incomplete". That becomes your top-priority item.

Run the full gate:
    npx tsc --noEmit && npm run lint && npm run build &&
    npm run audit:gate && npx vitest run

Run cross.contradiction-finder on STATUS.md vs the actual repo state, and
cross.devils-advocate on any slice claiming done. Capture findings.

==== STEP 2: PICK ONE LETTER, IN THIS ORDER ====

  A. A "shipped" slice regressed or was never actually completed
     (Step 1 found a gap). Fix it.
  B. The current "in-progress" slice is mid-flight. Continue and finish it
     per its acceptance criteria.
  C. The audit gate is red on something not tied to a current slice.
     Fix the regression.
  D. There is an open BLOCKER-tagged issue from VERIFICATION_LOG.md.
     Fix it.
  E. Everything above is clean. Start the next "proposed" slice in
     STATUS.md, mark it "in-progress", and ship it end-to-end.

State in chat which letter you picked and why. If nothing applies, say so
and stop — the rewrite is on track and waiting on me.

==== STEP 3: DO IT, BOUNDED ====

Hard limits this paste:
  - One PR maximum.
  - 600 LOC diff maximum (excluding generated files, lockfiles, snapshots).
    If more is needed, split: ship the foundation in this paste, leave a
    follow-up note in STATUS.md.
  - No scope outside the chosen letter. If you spot something else broken,
    log it in VERIFICATION_LOG.md and move on.

Use the repo's subagents and skills while working:
  - context-preparer to assemble cores + sources before complex changes
  - red-team-analyst against your own draft before pushing
  - cross.contradiction-finder on your diff vs the brief that owns the slice
  - output-refiner on any generated docs you ship

==== STEP 4: SELF-VERIFY (no shortcuts) ====

Run AGENTS.md §4 three-pass review fully. Then:
  - Re-run the full gate. Must be green or strictly less red than at start.
  - Re-run every acceptance criterion in the slice file by actually
    executing it, not by reading the code.
  - UI change → walk the flow in dev or via playwright, capture evidence.
  - Backend change → hit the endpoint with curl, confirm contract holds
    and audit log row written.
  - Migration → apply on ephemeral Postgres, run downgrade, confirm
    reversible.

If self-verify fails: revert the diff, log the failure in FIX_LOG.md under
"attempted but reverted", stop. Do NOT push broken work.

==== STEP 5: LOG AND STOP ====

Append to docs/v7/FIX_LOG.md:

  ### Paste #N — YYYY-MM-DD
  - Letter chosen: <A..E>
  - Slice/issue: <id or url>
  - PR: <url>
  - LOC diff: <number>
  - Audits added or changed: <list>
  - Acceptance criteria results: <pass/fail per criterion>
  - Skills/subagents invoked: <list>
  - Findings parked for later: <list, severity-tagged>
  - Suggested next letter for paste #N+1: <A..E with one-line reason>

Update STATUS.md to reflect the new slice state.

Comment on the merged PR (or v7 tracking issue): "Paste #N: <letter> on
<slice/issue>. Gate <green/red>. Next: <suggested letter>."

Stop. Do not start a second item this paste even if there's time.
```
