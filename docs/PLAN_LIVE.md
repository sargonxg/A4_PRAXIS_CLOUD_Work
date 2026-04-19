# PRAXIS — Live Plan (resumable across sessions)

> **Owner**: Claude (Opus 4.7). **Domain**: praxis.tacitus.me. **GCP project**: praxisbytacitus.
> **Read this file first** in any new session. Update checkboxes as items ship.
> Source of truth → `docs/PLAN_LIVE.md` on `main`.

## 0. Context at session start (2026-04-19)

Previous Claude (call it PC1) shipped commit `768fbb1` with:
- P0 hardening (backend private, CORS scoped, DebugPanel env-gated, JSON logging, risk-assessment calibration)
- Broken commit message "also why there are"
- 9 agent-worktree files accidentally tracked (cause of ~1.8 GB local bloat)
- Landing page upgrade (`3d87654`) already live on `main`
- **Production `praxis.tacitus.me` is still running pre-P0 build** — deploy never ran

This plan closes the gap end-to-end in ~2 h.

## 1. Immediate (this session, target < 2 h)

- [x] Move `.claude/` + `.agents/` to `.gitignore`; `git rm --cached` them
- [ ] Broaden `withCalibration` to 10 flagship tools (codemod-style)
- [ ] Fix VectorLayer embedding propagation so profile rerank ranks real chunks
- [ ] Move `OnboardingBanner` out of scroll container (sticky strip)
- [ ] Add `Sentry` to Python backend
- [ ] Add "Calibrated for …" banner component + mount in `ToolPageShell`
- [ ] Clean commit (single message), push to `origin/main`
- [ ] `gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus`
- [ ] Verify: `/`, `/login`, `/onboarding`, `/app/dashboard`, `/api/ai/risk-assessment` (POST auth required)

## 2. Week 1 — Calibration completeness

- [ ] Extend `withCalibration` to remaining 39 AI routes (template = `risk-assessment/route.ts`)
- [ ] Prompts registry (`src/lib/ai/prompts/registry.ts`) — single source of truth per tool
- [ ] Delete dead routes after confirmation: `research-extract`, `claude-analyze`
- [ ] `npm run audit:tools` must pass 11/11 for all tools

## 3. Week 2 — Observability floor

- [ ] Sentry Python SDK wired via `SENTRY_DSN` secret
- [ ] `opentelemetry-instrumentation-fastapi` → Cloud Trace
- [ ] BigQuery `tool_calls` table + every AI route logs (uid, toolId, latency, tokens, profileVersion, redLineHits)
- [ ] Cloud Monitoring dashboard: per-tool p50/p95, credit burn, error rate
- [ ] SLO alert policies (error rate > 2%, p95 > 30s)

## 4. Week 3 — Event fabric live

- [ ] Pub/Sub `praxis.embed`: document upload → embed → Firestore KNN
- [ ] Pub/Sub `praxis.profile`: onboarding complete → embedding refresh + SKC reweight
- [ ] Delete deprecated `gdelt_poller` Cloud Function + Scheduler job
- [ ] Delete unused Pub/Sub topics

## 5. Week 4 — Deep Research Agent live

- [ ] Wire `src/lib/ai/vertex-agent.ts` into `src/app/api/ai/deep-research/route.ts`
- [ ] Remove `conductResearch()` stub path
- [ ] Vertex Memory Bank per user

## 6. Week 5 — Prompt eval harness

- [ ] `scripts/eval-prompts.ts` — 10 scenarios × 49 tools × critic model
- [ ] CI gate: min score per tool
- [ ] `docs/eval/runs/YYYY-MM-DD.md` auto-written per run

## 7. Week 6 — Daily Calibrated Brief (flagship)

- [ ] Cron (03:00 analyst-local) → read profile + active situations → 5-tool pipeline → Pro compose → email + in-app
- [ ] Sentinel feature; lead marketing with it

## Commands reference

```bash
# audit after any calibration change
npm run audit:tools && npm run audit:verify

# type check
npx tsc --noEmit

# deploy
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus

# verify live
curl -sI https://praxis.tacitus.me/
curl -sI https://praxis.tacitus.me/onboarding
curl -sI https://praxis.tacitus.me/api/health
```

## Where things live

| Thing | Path |
|---|---|
| Calibration middleware | `src/lib/api/with-calibration.ts` |
| Profile context builder | `src/lib/context/profile-context.ts` |
| System-prompt XML renderer | `src/lib/context/system-prompt-block.ts` |
| Tool-output persist | `src/lib/api/save-tool-output.ts` |
| AnalystProfile type + Zod | `src/types/analyst-profile.ts` |
| Vertex Agent SSE client | `src/lib/ai/vertex-agent.ts` |
| SKC layers | `src/lib/knowledge/*` |
| Onboarding UI | `src/app/onboarding/` |
| Audit script | `scripts/audit-tools.ts` |
| Latest audit | `docs/audits/tools-YYYY-MM-DD.md` |

## Non-obvious gotchas

- Session cookie embeds `onboarded: boolean` signed by HMAC. Re-issued on `POST /api/onboarding/complete`. If you change cookie options, update the re-issue block too.
- `withCalibration` 403s non-demo users without `profile.meta.completedAt` → only wire it on routes where you are OK blocking incomplete-profile users (currently true once every route migrates).
- Demo users bypass the gate AND credits AND profile read.
- Backend is private (`--no-allow-unauthenticated`) — only frontend service account can invoke it via OIDC (see `backend/auth.py::verify_oidc`).

## Session log

- 2026-04-19 PC2 pass 1: P0 security + structured logs + risk-assessment calibration exemplar (commit `768fbb1`, broken msg, pre-deploy)
- 2026-04-19 PC2 pass 2 (this session): untracked worktree bloat, broader calibration rollout, deploy to prod
