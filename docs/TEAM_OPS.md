# PRAXIS — Team Operations Playbook

How a multi-agent team (Claude Code, Codex 5.5, plus the user as
CEO/CTO) ships PRAXIS from a fresh clone, every time, without stepping
on each other.

> This document explains *how the team works*. For *what to work on*,
> consult `docs/SPRINT_BACKLOG.md`. For *how the system works*,
> consult `docs/CONTEXT_INJECTION.md`.

---

## Cast

| Role | Who | Scope |
|---|---|---|
| **CEO/CTO** | Giulio Catanzariti (`giuliocatanzariti@gmail.com`) | Product strategy, vendor/license negotiations, GCP console actions, deploy authorisation, the deep-research prompts |
| **Lead engineer** | Claude Code (each session) | Architecture, UX, documentation, tool quality. Operates in the cloned repo on the user's machine. |
| **Implementation pair** | Codex 5.5 (separate sessions) | Mechanical retrofits, repetitive batch edits, persistence patterns. Operates in a parallel session against the same `main` branch. |
| **Subagent specialists** | Spawned per task | Explore (codebase audit), feature-dev:code-architect (design), feature-dev:code-reviewer (review), Plan (migration plans), general-purpose (long-running multi-step research) |

---

## How a session starts

Every session — Codex or Claude Code — begins identically:

```bash
git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git
cd A4_PRAXIS_CLOUD_Work
git log --oneline -10
npm install
```

Read in order (item numbers match `AGENTS.md`):

1. README.md
2. CLAUDE.md
3. AGENTS.md ← hard rules, validation gate, deploy procedure
4. CHANGELOG.md ← "what just shipped"
5. docs/CONTINUATION.md ← last "do this next" note
6. docs/STRATEGY.md
7. docs/SPRINT_2026-04-25.md
8. **docs/SPRINT_BACKLOG.md** ← canonical actionable list
9. **docs/CONTEXT_INJECTION.md** ← the architectural contract
10. docs/tools/INDEX.md
11. docs/GCP_OPERATIONS.md
12. docs/RESEARCH_PROMPTS.md
13. docs/HANDOFF_PROMPTS.md
14. docs/DEPLOYMENT_LOG.md
15. docs/compass_artifact_…_text_markdown.md ← deep-research findings
16. docs/USER_ACTION_LIST.md ← things only the user can do
17. docs/VISION_2026.md ← strategic north star
18. docs/COMPLIANCE.md ← licensing + cert posture
19. docs/TEAM_OPS.md ← this file

Then run the validation gate to confirm the local clone is healthy:

```bash
npm run build
npm run lint
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run
```

If any of those fail before you've changed a thing, pause and figure
out why before opening any task. **Do not start work in a broken tree.**

---

## How tasks are picked

1. Open `docs/SPRINT_BACKLOG.md`.
2. Find the highest-priority task that is `Pending` and **does not
   conflict** with what the other assistant is currently working on
   (every task lists a "Tandem note" with the conflict surface).
3. Mark it `In progress (<your-name>)` in the same commit you start.
4. Build / test / commit incrementally; do not batch.
5. When done, change the status line to `Done <commit-hash>` in the
   final commit of the slice.

If the task is missing a DoD or files-to-touch list, *write those
first* and commit them before any code change. Backlog hygiene comes
before velocity.

---

## Stream ownership convention

The four streams in `docs/SPRINT_2026-04-25.md` are the orientation
plan; in practice they overlap, so own *files* not streams.

| Files an assistant touches | Stream affinity |
|---|---|
| `src/components/dashboard/*`, `src/lib/dashboard/*`, `src/components/landing/*`, `src/components/praxis/*`, `src/app/onboarding/*`, `src/app/(landing)/*` | Stream A (Workspace personalisation) — Claude Code |
| `src/app/app/<tool>/page.tsx` retrofits, `usePersistedToolData` wiring, `tests/unit/components/<tool>/*` | Stream B (Tool quality) — Codex |
| `cloudbuild.yaml`, `infrastructure/*`, `docs/GCP_OPERATIONS.md`, vendor signups | Stream C (Data activation) — pair with user |
| `src/middleware.ts` / `src/proxy.ts`, lint cleanup, `scripts/*`, `cloud_functions/*` | Stream D (Ops hygiene) — either |
| `docs/tools/*.md`, `docs/CONTEXT_INJECTION.md`, `docs/COMPLIANCE.md` | Stream E (Tool catalogue + docs) — either |

The rule: **never edit a file that the other assistant is currently
touching.** If a backlog task forces an overlap, the lower-priority
task waits.

---

## Subagent dispatch — when and which

Spawn a subagent (`Agent` tool) when the task is *exploratory* (you
don't yet know which files to touch) or *parallelisable* (you have 2+
independent investigations). Don't spawn for tasks where the path is
already clear — just do them yourself.

| Subagent | When |
|---|---|
| **Explore** | "Audit X across the codebase" — color contrast, tool readiness, data feed connectivity |
| **feature-dev:code-architect** | "Design feature Y" — produce blueprint with files-to-create, data flows, build sequence |
| **feature-dev:code-explorer** | "Trace this feature's execution path" |
| **feature-dev:code-reviewer** | "Review my implementation for bugs / security / convention" — after a non-trivial slice |
| **Plan** | "Plan migration from X to Y" — middleware → proxy, COSINE → DOT_PRODUCT |
| **general-purpose** | Multi-step research that would otherwise blow your own context window |

When dispatching, give the agent:

- The exact question or design goal in one paragraph
- The repo root path (`C:\Users\giuli\A4_PRAXIS_CLOUD_Work_fresh` on
  the user's Windows machine; clone path elsewhere)
- The specific files to read (not "the codebase")
- A word/section budget for the response so the report stays focused
- Whether you want code written or just research

Examples in `docs/SPRINT_BACKLOG.md` reference suggested subagent
types per task.

---

## Validation gate — non-negotiable

Before *every* push, run:

```bash
npm run build         # 0 errors
npm run lint          # warnings allowed; 0 errors
npm run audit:gcp     # 0 hard failures, 0 soft warnings
node scripts/audit-ai-routes.mjs   # 53/53 calibrated, 4 exempt
npx vitest run        # 150/150 (or higher — never lower)
```

If a test you wrote in this slice fails, fix it before push. If a
*pre-existing* test fails, stop, check `git log -- <test-file>` for
context, and confirm with the user before merging.

---

## Deploy gate — only with authorisation

Push to `main` ≠ deploy. Cloud Run deploy is a separate, billable,
visible-to-customers action. Authorisation rules:

- The user (CEO/CTO) authorises every deploy.
- The validation gate above must be green.
- After deploy, all of these must return their expected response
  before the deploy is logged as healthy:

```bash
curl -sI https://praxis.tacitus.me/                           # 200
curl -sI https://praxis.tacitus.me/login                      # 200
curl -sI https://praxis.tacitus.me/onboarding                 # 307 → /login
curl -s  https://praxis.tacitus.me/api/health | jq             # status:ok
curl -s  https://praxis.tacitus.me/api/auth/test-firebase | jq # adminSdkStatus INITIALIZED_OK
```

Then immediately update `docs/DEPLOYMENT_LOG.md` with:

- Source commits in this deploy
- Cloud Build ID and duration
- Cloud Run revision IDs
- Smoke-test results
- Configuration gaps remaining

Deploy commands themselves live in `docs/GCP_OPERATIONS.md` §2.

---

## Doc maintenance — the team's source of truth

When a slice ships, update **all** of these in the same commit batch:

| Doc | What to update |
|---|---|
| `CHANGELOG.md` | New entry under `[Unreleased]` |
| `docs/SPRINT_BACKLOG.md` | Mark task `Done <commit>` |
| `docs/CONTINUATION.md` | One-paragraph "what's next for the other assistant" |
| `docs/DEPLOYMENT_LOG.md` | Only if a deploy happened |
| `docs/tools/<id>.md` | If the tool's behaviour changed |
| `docs/COMPLIANCE.md` | If a vendor / cert / legal posture changed |

If a doc fell out of date during your slice, **fix it as part of the
slice**, not later. Stale docs are the single biggest hazard for a
multi-agent team.

---

## Handover ritual at end of session

Last thing in any session:

1. Confirm `git status` is clean.
2. Confirm last push was successful.
3. Update `docs/CONTINUATION.md` with the new "do this next" note.
4. If the next session is the *other* assistant, update
   `docs/HANDOFF_PROMPTS.md` with a fresh tandem-handoff prompt
   anchored in the latest commit.
5. Tell the user, in chat, exactly:
   - What shipped (commits + revisions)
   - What is now blocked or unblocked (especially compliance items)
   - What the very next agent should pick up first
   - Any vendor / license / GCP-console action only the user can do

That last bullet is critical. Agents have no `gcloud`-with-vendor
auth, no Stripe-dashboard auth, no DNS, no email-as-the-CEO. The user
unblocks those.

---

## Hard rules — restated for emphasis

From `AGENTS.md`, kept here so they're visible from the team-ops view:

1. Never expose internal tool-by-tool credit costs publicly.
2. Public pricing stays plan-based and monthly.
3. Never hardcode secrets — Secret Manager or Cloud Run env vars only.
4. Don't deploy before the validation gate passes.
5. **Every AI route must be wrapped in `withCalibration`.** Read
   `docs/CONTEXT_INJECTION.md` before touching `/api/ai/*`.
6. No new graph backend (Neo4j/Falkor/TrustGraph), no new MCP server,
   no new AI provider this sprint without a backlog ticket and user
   authorisation.
7. Commits must use `giuliocatanzariti@gmail.com` only — no
   `Co-Authored-By` lines, no `--amend` of pushed commits.
8. **ACLED raw event display stays gated until Corporate License is
   signed.** See `docs/COMPLIANCE.md` §1.1.

---

## Velocity cap (a reminder to self)

Agents can ship a *lot* per hour. The cap is not technical — it's
deploy-frequency safety + doc-staleness risk. Aim for:

- 3–5 commits per session
- 1 deploy per session at most (none if the slice is doc-only)
- Every commit ships its own CHANGELOG + backlog status update
- No more than 3 P0 backlog items in flight per assistant at once

Slow is smooth. Smooth is fast.
