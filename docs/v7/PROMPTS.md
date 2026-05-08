# Codex Prompt Patterns · v7

> **Path:** `docs/v7/PROMPTS.md`
> Three prompts. Use them in this order, depending on session type.
> The repo's `AGENTS.md` does most of the work — these prompts just point
> Codex at the right slice and the right ritual.

---

## Prompt 1 — Slice kickoff (most common, 80% of sessions)

Use when starting a fresh slice from `STATUS.md`.

```
You are Codex working on https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.

Read AGENTS.md fully — it is your contract. Then read docs/v7/STATUS.md,
docs/v7/00_VISION_AND_OPERATING_PRINCIPLES.md, and the brief that owns the
current slice. Then read the slice file under docs/v7/SLICES/.

Run the session-start ritual from AGENTS.md §1. Confirm in chat:
  - which slice you're working on
  - which audits are currently green
  - any blocker you see before you start

Then ship the slice end-to-end:
  - implement
  - test
  - run the gate (AGENTS.md §4 Pass 3)
  - self-review (Pass 1 and Pass 2)
  - open a PR using the template in AGENTS.md §9
  - update STATUS.md

If you hit an open question that AGENTS.md §3 says you must escalate, open
the question in docs/v7/OPEN_QUESTIONS.md, post it on the PR, and continue
with parallel work that doesn't depend on the answer.

Do not end the session without a merged PR or a draft PR with a clear blocker
explained.
```

## Prompt 2 — Resume mid-flight (handing off across days)

Use when the previous session left a slice `in-progress`.

```
You are Codex resuming v7 work. Read AGENTS.md, docs/v7/STATUS.md, and any
open PRs on the repo (filter: author:codex, state:open).

Identify the current slice and where the last session stopped. State that in
chat in two sentences. Then continue from there.

If the previous session left uncommitted local state that doesn't exist in
the PR, treat the PR as the source of truth — do not invent context that
isn't in the repo.

Same exit criteria as Prompt 1: ship, or document the blocker.
```

## Prompt 3 — Skeptical review (run after a slice lands, before next slice)

Use periodically to catch drift. Recommended: every 3rd slice.

```
You are Codex in skeptic mode. You are NOT writing code this session. You are
reviewing.

Read AGENTS.md, the five v7 briefs (docs/v7/00..04), and the most recent N
merged PRs (where N is the number of slices since the last skeptic pass).

Produce a single comment on a new GitHub issue titled "v7 skeptic pass
YYYY-MM-DD" containing:

  1. Three things that have drifted from the briefs since the last review,
     with file:line references and the brief's contradicting passage.
  2. Three audits that exist but are weaker than they should be (hint: look
     at audits that always pass — those are usually checking the wrong thing).
  3. Three risks for the next slice, ranked by likelihood × impact.
  4. Three small wins that would tighten the codebase (e.g., dead code paths,
     stale TODOs, duplicate components, redundant audits).

If everything is fine, say so and explain why you believe that — don't pad.

Do not change code in this session. If you spot something urgent, open it as
an issue and tag it `urgent`. The owner will decide whether to interrupt the
slice flow.
```

---

## Three quick patterns inside a session

These are short interventions GC types into the chat mid-session.

### "Show me your plan first"

When starting anything risky, before writing code:

```
Before you implement, write a 6-bullet plan as a PR comment:
  1. Files you'll touch
  2. Files you will NOT touch (and why, if non-obvious)
  3. New tests you'll add
  4. New audits or audit changes
  5. Migrations (if any) and their downgrade
  6. Open questions you'll defer

Wait for "go" before implementing.
```

### "Run the skeptic on yourself"

When a PR feels too easy:

```
Before pushing, do a hostile-reviewer pass on your own diff. Specifically check:
  - owner-scoping on every new query
  - calibration block usage on every AI call
  - advisory-default on every graph mutation
  - citation preservation on every output path
  - no direct OpenAI/Anthropic SDK imports
  - no secrets, no localStorage, no leftover console.log
  - no TODO comments without an issue link

Post the result as a PR comment under the heading "Skeptic pass". If you
find something, fix it before pushing.
```

### "Stop and ask"

When Codex is heading somewhere you didn't authorize:

```
Stop. Don't push.

The change you're about to make affects [X]. AGENTS.md §3 says that requires
escalation. Open an issue in OPEN_QUESTIONS.md with the question, propose
two or three options, name your default, then continue with parallel work
that doesn't depend on the answer.
```

---

## Anti-patterns (what NOT to write)

- **"Build the whole thing."** Codex will produce a 5k-line PR you can't
  review. Always slice.
- **"Just do what's right."** Codex's "right" drifts from yours over time.
  Always anchor in a brief and a slice.
- **"Don't worry about audits, they're slow."** Audits ARE the contract.
  Skip them and the codebase rots in two weeks.
- **"Be creative with the architecture."** v7 is a simplification, not a
  re-architecture. Creativity goes into the UX, not the substrate.
- **"Try X and see if it works."** No. Plan, ship, verify. "Try and see"
  produces flaky tests and unreviewable diffs.

---

## When to NOT use Codex

Some work is better done by you with Codex as second opinion, not as primary
agent:

- Resolving items in `OPEN_QUESTIONS.md`. Those need product judgment, not code.
- Writing the briefs themselves when you decide to revise them.
- Reviewing security-sensitive changes (Codex drafts; you sign off).
- Anything touching prod data migration in a non-reversible way.
- Pricing, billing, contractual surfaces.

For those, Codex can draft and skeptic-review, but you decide.
