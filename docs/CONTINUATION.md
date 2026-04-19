# PRAXIS — Continuation prompt for the next Claude session

**Use this file to resume work in a fresh Claude Code session.** Copy the prompt block below into the new session.

---

## Current state (2026-04-19)

- Branch `feat/plan-a-onboarding` merged to `main` as commit `7468b04`.
- 29 task commits + 3 follow-up commits (T27 tool gate, final-review fixes, CLAUDE.md, handoff doc, landing upgrade) pushed to `origin/main`.
- Working tree clean. Only untracked item is `.claude/` local tooling (not for repo).
- **Deploy to `praxis.tacitus.me`:** NOT yet rolled out. Source is pushed to `main` but Cloud Build was not confirmed green this session.

## Start-here prompt (paste into new Claude session)

> I'm continuing work on PRAXIS (C:\Users\giuli\ANTIGRAVITY\A4_PRAXIS_CLOUD_TACITUS\A4_PRAXIS_CLOUD_Work, project `praxisbytacitus`, domain `praxis.tacitus.me`).
>
> Plan A (user onboarding + tool calibration foundation) is merged to `main`. Read these three files before anything else:
> 1. `docs/CONTINUATION.md` — this file
> 2. `docs/superpowers/plans/2026-04-19-plan-b-handoff.md` — what's next
> 3. `docs/audits/tools-2026-04-19.md` — baseline audit (50 AI routes, max 4/11, all need `withCalibration`)
>
> Priority order for this session:
> 1. **Deploy to production first.** Run `gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus` (or `./infrastructure/deploy.sh`). Verify `https://praxis.tacitus.me/onboarding` returns 200. If Cloud Build fails, debug — do NOT skip the deploy.
> 2. **Start Plan B** — migrate Tier 1 tools (Dashboard, Assistant, Conflict Graph, Actor Profiles, Risk Monitor, Early Warning, Report Studio, Daily Brief, Deep Research, Scenarios) to `withCalibration`. Each tool must score 11/11 on the audit after migration.
> 3. Use `superpowers:writing-plans` skill to author Plan B as a task-by-task plan, then `superpowers:subagent-driven-development` to execute.
>
> Known gaps to fix during Plan B (from final review):
> - `VectorLayer.search` doesn't propagate chunk embeddings → profile-weighted rerank is inert. Fix first so calibration actually ranks sources.
> - `OnboardingBanner` sits inside the scrollable main container → move to sticky full-width strip between Header and `<main>`.
> - 2 pre-existing TS test errors (`tests/unit/types/analyst-profile.test.ts` string narrowing; `tests/unit/lib/knowledge/profile-weighted-retrieval.test.ts` implicit-`this`).
> - Dead-code verification on `/api/ai/research-extract` and `/api/ai/claude-analyze` (drop if orphaned).
>
> After every Plan B phase: run `npm run audit:tools` and commit the fresh `docs/audits/tools-YYYY-MM-DD.md` so progress is auditable.
>
> Start with step 1 (deploy), then pause and show me the verification output before moving to step 2.

## Deploy commands (quick reference)

```bash
# from repo root
gcloud config set project praxisbytacitus
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus

# OR the wrapper
./infrastructure/deploy.sh

# verify after deploy
curl -sI https://praxis.tacitus.me/                # 200
curl -sI https://praxis.tacitus.me/onboarding      # 200 (404 today — confirms Plan A not yet live)
curl -sI https://praxis.tacitus.me/login           # 200

# run audit + verify freshness
npm run audit:tools
npm run audit:verify
```

## Where key Plan A artifacts live

| Artifact | Path |
|---|---|
| Spec (source of truth for both plans) | `docs/superpowers/specs/2026-04-18-user-onboarding-tool-calibration-design.md` |
| Plan A (implementation plan, fully executed) | `docs/superpowers/plans/2026-04-18-plan-a-onboarding-foundation.md` |
| Plan B handoff (what's next) | `docs/superpowers/plans/2026-04-19-plan-b-handoff.md` |
| Latest audit | `docs/audits/tools-2026-04-19.md` |
| Manual verification checklist | `docs/verification/2026-04-18-onboarding-manual-checklist.md` |
| Calibration middleware | `src/lib/api/with-calibration.ts` |
| Context builder | `src/lib/context/profile-context.ts` |
| System prompt block renderer | `src/lib/context/system-prompt-block.ts` |
| Save tool output helper | `src/lib/api/save-tool-output.ts` |
| AnalystProfile type + Zod schema | `src/types/analyst-profile.ts` |
| Onboarding UI | `src/app/onboarding/` |
| Onboarding API routes | `src/app/api/onboarding/` |
| Audit script | `scripts/audit-tools.ts` |

## Non-obvious things to remember

- Session cookie embeds `onboarded: boolean` signed by HMAC. `POST /api/onboarding/complete` re-issues the cookie with `onboarded: true` atomically with the version bump. If you change `/api/auth/session` cookie options, also update the re-issue block in `/api/onboarding/complete/route.ts`.
- Server-side gate (`withCalibration` returns 403) fires ONLY for routes that adopt the middleware. No pre-existing route has `withCalibration` yet, so current production tools still work for users with incomplete onboarding — the gate activates tool-by-tool as Plan B migrates them.
- Demo users bypass both the redirect and the server gate.
- `FALLBACK_CHIPS` in `src/lib/constants/onboarding-chips.ts` is the hardcoded fallback if Firestore `config/onboarding_suggestions` is missing. Seed via `npm run seed:onboarding` (requires `FIREBASE_SERVICE_ACCOUNT_KEY` env).

## Rough Plan B task count

Expect 25-40 tasks for full Plan B. Rough tier estimates from audit:
- T1 (10 tools) — ~2-3 days of subagent-driven execution
- T2 (12 tools) — ~3-4 days
- T3 (10 tools) — ~2-3 days
- T4 (8 tools) — ~2 days
- GCP additions + dead code sweep + prompts registry — ~2-3 days
