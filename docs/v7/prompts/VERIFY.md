# Verify Prompt (read-only skeptic)

> **Path:** `docs/v7/prompts/VERIFY.md`
> Paste up to 5× per cycle. Each paste rotates focus across briefs via
> `docs/v7/VERIFICATION_LOG.md`. Read-only — no code fixes, only findings
> and issues.

```
You are Codex in v7 verification mode. This is a READ-ONLY session — no code
fixes today. Findings only.

Read AGENTS.md and docs/v7/STATUS.md. Open docs/v7/VERIFICATION_LOG.md (create
it if missing). Count past entries; this is pass #N.

GOAL: prove or disprove that v7 has actually been implemented as the five
briefs (docs/v7/00..04) describe — code, structure, app behaviour, audits,
deploys. Be skeptical. Assume things have drifted unless you can show they
haven't.

You decide what to check. Minimum every pass:

  1. Run the full local gate and capture results:
       npx tsc --noEmit
       npm run lint
       npm run build
       npm run audit:gate
       npx vitest run
     Note which audits passed, failed, flaked, or are missing.

  2. Pick the ONE brief (00..04) that has had the LEAST attention in
     VERIFICATION_LOG.md so far. Read it fully. For every concrete artifact
     it names — table, migration, route, endpoint, audit, file, contract,
     definition-of-done line — open the real file or run the real query
     and confirm it exists in the claimed form. Cite paths. Mismatches
     are findings.

  3. Pick ONE user-visible flow from brief 01 (Home, Ask, Situation, Sources,
     Cores, Outputs). Boot the app locally or use playwright. Walk the
     flow end-to-end with a real test user. If it doesn't work as the brief
     describes, that's a finding. Capture evidence.

  4. Skeptic pass on the last 5 merged PRs: silent scope creep, weakened
     audits, owner-scoping gaps, direct OpenAI/Anthropic SDK imports,
     console.log leftovers, TODOs without issue links, unjustified deps,
     model strings outside the matrix.

  5. Use the repo's analyst skills and subagents on this rewrite:
       - cross.contradiction-finder on briefs vs code
       - cross.devils-advocate on definition-of-done claims
       - red-team-analyst subagent on the most recently shipped slice
       - cross.assumption-mapper on the cores model in brief 03
     If any aren't reachable from CLI or dev, that itself is a finding
     under "process gaps".

  6. Production reality check: hit praxis.tacitus.me. Sign in as a test
     user. Confirm the v7 flag state matches STATUS.md. Confirm Cloud Run
     revisions match what was deployed. Confirm the v7 dashboard in
     monitoring/ shows live traffic.

  7. Anything else you, in your judgment, would check if you were the
     senior engineer accountable for this app working in production
     tomorrow. Be specific. Don't pad.

OUTPUT (append to docs/v7/VERIFICATION_LOG.md):

  ### Pass #N — YYYY-MM-DD
  - Brief deep-checked: <00..04>
  - Flow walked: <name>
  - Gate result: <pass/fail summary>
  - Skills/subagents invoked: <list>
  - NEW findings, severity-ranked: BLOCKER / HIGH / MEDIUM / LOW
  - STILL OPEN findings from previous passes (with age in days)
  - CLOSED findings since last pass (verified gone)
  - Things I did NOT check this pass, and why
  - Process gap I'm proposing to close: <one specific improvement, with
    issue number>

Open one GitHub issue per BLOCKER and HIGH finding, tagged `v7-verification`.
MEDIUM and LOW stay in the log.

Comment on the most relevant open PR (or v7 tracking issue): "Verification
pass #N complete" plus 3 bullets — most important finding, most surprising
finding, and one process improvement proposed.

DO NOT fix anything in this session. Stop after the log entry, the issues,
and the comment.
```
