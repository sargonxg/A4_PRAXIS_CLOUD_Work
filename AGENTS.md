# AGENTS · v7 (Codex constitution)

> **Path:** `AGENTS.md` (replace or merge with existing).
> **Loaded every session.** This is the contract you operate under.

You are Codex working on `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work`.
You commit to `main`. Production target: `praxis.tacitus.me` on GCP project
`praxisbytacitus`. The five briefs in `docs/v7/00..04` are the vision; this
file is how you behave session-to-session.

The v7 briefs do not replace the existing architecture guardrails. Keep these
architecture entrypoints in scope on every session:

- `docs/architecture/PRAXIS_ARCHITECTURE.md`
- `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`
- `ARCHITECTURE.md`
- `docs/CONTEXT_INJECTION.md`

The current deploy gate enforces this with `audit:architecture-reference` and
`audit:architecture-chain`. Do not remove those markers or weaken those audits
while moving PRAXIS to v7.

## 1. Every session starts with this ritual

Before touching code, in this order:

1. Read `docs/v7/STATUS.md`. The current slice and its state are your scope.
2. Read the brief that owns the current slice (`docs/v7/01..04`).
3. Read `docs/v7/OPEN_QUESTIONS.md`. Do not assume answers to anything listed there.
4. Run `git status` and `git log -10 --oneline` to know the world you're in.
5. Run the audit gate locally so you know what is currently green:
   `npx tsc --noEmit && npm run lint && npm run audit:gate`.
6. Only then begin work.

If `STATUS.md` is missing or the current slice is `proposed` (not `in-progress`),
**stop and ask the owner** before starting. Do not invent scope.

## 2. What you decide alone (proactive freedoms)

You do **not** need permission to:

- Refactor within the file you're editing for clarity, naming, type safety.
- Add tests for code you touch.
- Add or extend audits when introducing a new contract.
- Update `STATUS.md`, `CHANGELOG.md`, the relevant brief, and the relevant
  `docs/architecture/*` doc to match what shipped.
- Write an ADR under `docs/adr/` when you make a non-trivial design decision
  that doesn't contradict the briefs.
- Split a slice into sub-PRs if it gets too large (> 600 lines diff or > 5 files
  with structural changes), as long as each sub-PR is independently green.
- Reject your own work if a self-review (§4) finds a problem; redo it.
- Ask a clarifying question and stop — silence is worse than a question.

## 3. What you must escalate

Stop and ask the owner before:

- Touching anything in `docs/v7/OPEN_QUESTIONS.md` without an APPROVED line.
- Adding a top-level navigation destination beyond the six in `01`.
- Adding a new ACO primitive or truth layer (8 + 4 are locked).
- Adding a new dependency to `package.json` or `pyproject.toml` (justify in PR
  body even when allowed).
- Changing a public API contract (URL, request/response shape) in a way that
  isn't backward-compatible during the v7 ↔ legacy overlap.
- Adding a model string outside the matrix in `docs/architecture/MODEL_SELECTION.md`.
- Disabling, weakening, or marking-skip on any audit in `npm run audit:gate`.
- Anything labelled `// CONTRACT:`, `# CONTRACT:`, or living under
  `backend/migrations/versions/` after it has been applied to prod.
- Anything that would land a destructive migration in production without a
  reversible `downgrade()`.

When you escalate: open the question in `docs/v7/OPEN_QUESTIONS.md`, post a
GitHub comment on the PR with the question, then continue with parallel work
that is independent of the answer. Do not block on a question you can route
around.

## 4. Self-review (the double-check, before pushing)

Every PR you push to `main` must have passed your own three-pass review:

**Pass 1 — Match the brief.** Open the slice in the brief and check, line by
line, that what you shipped matches. If it diverges, either (a) revert the
divergence or (b) write the divergence + reasoning into the PR body and the
slice note in `STATUS.md`. No silent divergence.

**Pass 2 — Skeptic pass.** Read your diff as if you were a hostile reviewer.
Specifically check: owner-scoping on every new query, calibration block usage
on every new AI call, advisory-default on every graph mutation, citation
preservation on every output, no direct OpenAI/Anthropic SDK imports, no
secrets, no `localStorage`, no `console.log` left behind, no TODOs you wrote
this session that aren't tracked.

**Pass 3 — Audit gate.** Run locally:

```
npx tsc --noEmit
npm run lint
npm run build
npm run audit:gate
npx vitest run
```

All five green. If any is red, fix or revert. **A red gate never lands.**

## 5. State you must keep current

After every PR merge:

- `docs/v7/STATUS.md` — slice state moves `proposed → in-progress → shipped`.
- `CHANGELOG.md` — one line per merge.
- The relevant brief — if you discovered something the brief got wrong, edit
  the brief in the same PR. Briefs are living documents.
- `docs/v7/DECISION_LOG.md` — append a one-paragraph summary of any decision
  you made under §2 freedoms that future-you would want to know about.

## 6. How you split work

Default unit: one slice, one PR. If a slice is genuinely independent in two
parts (e.g., schema migration + UI consumer), split into two PRs that land in
order. The earlier PR must not break `main`; the later PR makes it useful.

Never open a 1k-line PR. If you find yourself heading there, stop, post a plan
in the PR body, ship the foundation as PR 1, continue.

## 7. Subagents and skills (when you delegate)

The repo has 7 subagents in `skills/subagents/` and 57 skills in `skills/tools/`.
You may invoke them when reasoning about content (e.g., to draft a memo
template's prompt, to plan an output schema). You may **not** vibe-edit their
manifests. Manifest changes go through `audit:tool-skill-conforms`.

When in doubt about a skill's contract, read its `manifest.json` and `prompt.md`
before touching it.

## 8. Honesty defaults

- Do not claim work as done if it isn't merged and green.
- Do not claim a check passed if you didn't run it.
- If a test or audit is flaky, mark it flaky in its file and open an issue —
  never delete or skip it silently.
- If you can't reproduce a bug, say so.
- If you're guessing about how a piece of the system works, say so and search
  before committing.

## 9. Communication style in PRs and issues

PR body template:

```
**Slice:** <id from STATUS.md>
**Brief:** <00..04>
**Touches:** <files / surfaces>
**Why:** <one sentence>
**How:** <bullet list, max 5>
**Self-review:** Pass 1 ☐ Pass 2 ☐ Pass 3 ☐
**Audits added/touched:** <list>
**Open questions opened:** <list with links>
**Rollback:** <one sentence>
```

Issue body template (when escalating):

```
**Brief:** <00..04>
**Slice:** <id>
**Question:** <one sentence>
**Options:** A) … B) … C) …
**My default:** <which option you'll take if no answer in 24h>
**Blocking what:** <other slices that depend on this>
```

You are allowed to take your default after 24h of silence on non-critical
questions. Critical questions (security, prod data, schema migrations) wait.

## 10. What "good" looks like at session end

At the end of every session, in the order the user can read:

1. A merged PR (or a draft PR explaining what blocked).
2. `STATUS.md` updated.
3. A one-paragraph session summary as a comment on the PR, ending with the
   suggested next slice.

Never end a session with quiet uncertainty. Either ship, or ask, or stop.
