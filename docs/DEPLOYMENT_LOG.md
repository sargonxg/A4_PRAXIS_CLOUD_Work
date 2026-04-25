# PRAXIS Deployment Log

Use this file to keep daily deployment status visible to Codex, Claude Code, and humans.

## 2026-04-25 — Deploy hardening in progress (session 7)

Source commit deployed: `b4c88cd`

Cloud Build:

- Build ID `2bcd558a-bff5-4aec-ba42-fb42b29e2e42` failed in step
  `build-frontend`.
- Failure: Next.js 16 route-handler type validation rejected
  `/api/notifications/[id]` because `params` was typed synchronously
  instead of as `Promise<{ id: string }>`.
- Local fix verified with `npx tsc --noEmit` and `npm run build`.
- Build ID `c4cc3b65-7478-4c2d-9d40-114e2cf36f25` succeeded in
  `8M48S`.

Cloud Run:

- Frontend revision: `praxis-frontend-00055-dcj` (ready)
- Backend revision: `praxis-backend-00036-lt9` (ready)
- GDELT worker pool: `gdelt-poller-00005-xg2` (ready)

Deploy verification:

- Firestore composite indexes are READY, including
  `situations.status` collection-group.
- Firestore TTL is ACTIVE for `system_events`, `tool_runs`,
  `background_jobs`, `notifications`, `audit_logs`, and `rate_limits`.
- `npm run audit:gcp` passes with no hard failures or soft warnings.
- Firebase CLI auth on the Windows host is expired, so Firestore rules
  deployment should be run from Cloud Shell or after `firebase login --reauth`.
- `https://praxis.tacitus.me/` returns `200 OK`.
- `https://praxis.tacitus.me/login` returns `200 OK`.
- `https://praxis.tacitus.me/onboarding` returns `307` to `/login`.
- `https://praxis.tacitus.me/api/health` returns `status: ok`.

Code fixes shipped:

- Notification route handler signature fixed for Next.js 16.
- Operator console table typing fixed.
- GDELT worker Docker image now includes vendored `_shared` spine helpers.
- GDELT worker now calls `/api/v1/pipeline/ingest-feeds` with
  `X-PRAXIS-UID`.
- Backend pipeline reports `X-PRAXIS-JOB-ID` progress to `background_jobs`.
- Dashboard mounts situation-scoped `<ActivityFeed />`; activity feed hides
  internal credit deductions.

## 2026-04-25 — Open-source pivot deploy (session 5)

Source commit deployed: head `97...` (pivot commit + redeploy)

Cloud Build:

- Build ID: `2d60880f-340b-457e-9a39-1a0f32123cfd`
- Status: `SUCCESS`
- Duration: `9M05S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision: `praxis-frontend-00052-974` (ready)
- Backend revision:  inherited from prior deploy (no backend changes)

Production verification:

- `https://praxis.tacitus.me/` returns `200 OK`
- `/api/health` returns `status: ok` (firestore + ai_provider +
  cookie_secret all `ok`; anthropic + firecrawl + vertex_adk + stripe
  all `unconfigured` — this is now the **intended** steady state for
  the open-source-only stack)

Pivot recap (full notes in CHANGELOG.md):

- ACLED removed from data substrate (EULA incompatible with SaaS)
- Firecrawl removed (replaced by Vertex AI Deep Research)
- Anthropic removed (single Gemini line on Vertex AI)
- Landing page, pricing, system-health activation guide all updated
- Sub-processor list reduced to Google Cloud + Stripe + Cloudflare +
  GitHub
- Stream G ACLED + Firecrawl + Anthropic backlog items withdrawn
- B-10 GDELT BigQuery hot slice promoted to P0 as the new event-data
  backbone
- All open-license attribution copy preserved on derived surfaces

## 2026-04-25 — Playbook + Vision + Cleanup deploy (session 4)

Source commits deployed (head = `22dd8c9`):

- `22dd8c9` docs(playbook): user action list + 2026 vision + wiring map + cleanup
- `9312c25` docs(team): TEAM_OPS playbook + updated CONTINUATION
- `34d3dc2` docs(research): integrate compass artifact + COMPLIANCE tracker
- `7589334` Add files via upload (compass research artifact)
- `fa8cd33` feat(workspace): role-aware sidebar + audience-tuned briefings + master backlog

Cloud Build:

- Build ID: `995dfad5-b80e-4cb7-a232-59fdddec49a9`
- Status: `SUCCESS`
- Duration: `9M03S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision: `praxis-frontend-00050-d4v` (ready)
- Backend revision: `praxis-backend-00030-2vl` (ready)

Production verification:

- `https://praxis.tacitus.me/` → `200 OK`
- `https://praxis.tacitus.me/api/health` → `status: ok`

Configuration gaps remaining (degrade gracefully — see
`docs/USER_ACTION_LIST.md` for the activation steps):

- ACLED: licensing pending (engineering safe-harbour ready in B-9)
- Vertex ADK: deploy.py ready in `backend/agents/`; user runs once
- Firecrawl: $83/mo signup pending
- Stripe: products + webhook setup pending
- Anthropic: optional, marginal ROI

What's now live:

- Plan-tier badge + role-aware "For you" sidebar anchor
- Role-aware "Recommended for you" dashboard widget
- Audience-tuned briefing presets (behind feature flag)
- System Health page with Copy-Diagnostic + Activation guide
- Onboarding mandate live-validation
- Geospatial Monitor situation-aware centroid (no more "always Sudan")
- Hero, pricing teaser, footer reframed for monthly plans
- Contrast pass across the workspace
- 19 strategic / operational docs cross-linked

> **Subsequent commits not in this build (will deploy next):**
> `bd46423` (user upload of GDELT + ACLED briefs) and `6e0ac8e`
> (cross-referencing those briefs from the doc graph). Doc-only —
> safe to redeploy whenever the next code change ships.

## 2026-04-25 — Workspace personalisation + audience-tuned briefings deploy

Source commits deployed (head = `fa8cd33`):

- `fa8cd33` feat(workspace): role-aware sidebar + audience-tuned briefings + master backlog
- `dae0b48` docs(deploy): record 2026-04-25 deploy + final Codex handover
- `5fb542b` docs(context): Context Injection Contract + GCP runbook
- `fc7b9f1` feat(geospatial): situation-aware map centroid + tool docs scaffolding
- `9f05783` feat(ux): contrast pass + onboarding feedback + activation guide
- `0b6a3c1` docs(sprint): add 2026-04-25 sprint plan + tandem handoff
- `ce810b0` feat(dashboard): role-aware "Recommended for you" widget
- `7b28314` feat(pricing): hide internal credit metering; sidebar shows plan tier

Cloud Build:

- Build ID: `55e3963f-2c16-497f-9ad6-807f3ce9c418`
- Status: `SUCCESS`
- Duration: `10M54S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision: `praxis-frontend-00048-p4t` (ready)
- Backend revision: `praxis-backend-00029-6vc` (ready)

Production verification:

- `https://praxis.tacitus.me/` → `200 OK`
- `https://praxis.tacitus.me/api/health` → `{"status":"ok",...}` (firestore + ai_provider + cookie_secret all `ok`)

Local validation before deploy:

- `npm run build`: passed
- `tsc --noEmit`: passed
- `npx vitest run`: 150/150 passed (+10 new audience-preset tests)
- `node scripts/audit-ai-routes.mjs`: 53/53 calibrated

What is now live in production (incremental over the previous 00046/00027):

- "For you" anchor at top of sidebar surfaces top-3 role-tuned tools.
- Audience tone presets ready to use behind feature flag
  `PRAXIS_AUDIENCE_TUNED_BRIEFING=1`. To activate, append the env var to
  the frontend service in `cloudbuild.yaml` and redeploy. No code change
  required to enable.
- `docs/SPRINT_BACKLOG.md`, `docs/tools/assistant.md`,
  `docs/tools/risk-monitor.md` are in the source.

## 2026-04-25 — UX + Pricing + Context-Contract Deployment

Source commits deployed (head = `5fb542b`):

- `5fb542b` docs(context): Context Injection Contract + GCP runbook
- `fc7b9f1` feat(geospatial): situation-aware map centroid + tool docs scaffolding
- `9f05783` feat(ux): contrast pass + onboarding feedback + activation guide
- `0b6a3c1` docs(sprint): add 2026-04-25 sprint plan + tandem handoff
- `ce810b0` feat(dashboard): role-aware "Recommended for you" widget
- `7b28314` feat(pricing): hide internal credit metering; sidebar shows plan tier

Cloud Build:

- Build ID: `204af7bf-730a-4c33-90c2-77d5e3976bfc`
- Status: `SUCCESS`
- Duration: `8M36S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision: `praxis-frontend-00046-475` (ready)
- Backend revision:  `praxis-backend-00028-z26`  (ready)

Production verification:

- `https://praxis.tacitus.me/` → `200 OK`
- `https://praxis.tacitus.me/login` → `200 OK`
- `https://praxis.tacitus.me/onboarding` → `307` redirect to `/login` (expected for unauthenticated)
- `https://praxis.tacitus.me/api/health` → `{"status":"ok","checks":{"firestore":"ok","ai_provider":"ok","cookie_secret":"ok","anthropic":"unconfigured","firecrawl":"unconfigured","vertex_adk":"unconfigured","stripe":"unconfigured"}}`

Local validation before deploy:

- `npm run build` passed.
- `npx vitest run` passed (140/140).
- `tsc --noEmit` passed.

What is now live in production:

- Plan-tier badge in the sidebar (replaces the old raw "TACITUS Credits: N" pill).
- Role-aware "Recommended for you" dashboard widget driven by `analystProfile.identity.role` + `situation.domain`.
- Onboarding Step 2 mandate field shows live "X more characters needed" / "✓ Mandate ready" feedback.
- Landing hero rewritten to active voice; data-sources tagline weight bumped.
- Pricing teaser explains "active situations" inline.
- Geospatial Monitor centres the map on the actual situation region (DRC, Yemen, Ukraine, etc.) instead of always defaulting to Sudan when no bounding box is set.
- System Health page (`/app/settings/system-health`) has a **Copy diagnostic** button (redacted JSON snapshot for paste-into-Codex / Claude Code) and an **Activate paid / freemium data sources** card with signup links and effort estimates for ACLED, Vertex ADK, Firecrawl, Stripe, Anthropic.
- All public surfaces no longer show internal credit costs.

Configuration gaps that remain (degrade gracefully — see `docs/GCP_OPERATIONS.md` §1):

- ACLED unconfigured (15 min activation; biggest immediate win)
- Vertex ADK Reasoning Engine unconfigured (1–2h)
- Firecrawl unconfigured ($20–50/mo; unlocks CrisisWatch + SIPRI)
- Stripe unconfigured (2h, gates monetisation)
- Anthropic unconfigured (15 min, marginal)

## 2026-04-25 - Handoff Documentation Deployment

Source commit deployed:

- `5cdfebf docs: add agent handoff and deployment strategy`

Cloud Build:

- Build ID: `06b20a50-c0ef-4159-906f-5c97efad8159`
- Status: `SUCCESS`
- Duration: `8M32S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend service: `praxis-frontend`
- Frontend URL: `https://praxis-frontend-pgoyqovcza-uc.a.run.app`
- Frontend revision: `praxis-frontend-00044-tcl`
- Frontend ready: `True`
- Backend service: `praxis-backend`
- Backend URL: `https://praxis-backend-pgoyqovcza-uc.a.run.app`
- Backend revision: `praxis-backend-00027-nlk`
- Backend ready: `True`

Production verification:

- `https://praxis.tacitus.me/` returned `200 OK`.
- `https://praxis.tacitus.me/login` returned `200 OK`.
- `https://praxis.tacitus.me/onboarding` returned `307 Temporary Redirect` to `/login` for unauthenticated requests. This is expected.
- `https://praxis.tacitus.me/api/health` returned `status: ok`.
- Health checks reported:
  - Firestore: `ok`
  - AI provider: `ok`
  - Cookie secret: `ok`
  - Anthropic: `unconfigured`
  - Firecrawl: `unconfigured`
  - Vertex ADK: `unconfigured`
  - Stripe: `unconfigured`
- `https://praxis.tacitus.me/api/auth/test-firebase` confirmed:
  - Firebase reachable: `true`
  - Email/password enabled: `true`
  - Admin SDK status: `INITIALIZED_OK`

Local validation before deploy:

- `npm run build` passed.
- `npm run lint` passed with warnings only.
- `npm run audit:gcp` passed with zero hard failures and zero soft warnings.
- `node scripts/audit-ai-routes.mjs` passed: 53 AI route files, 53 calibrated, 4 exempt.
- `npx vitest run` passed: 40 test files, 140 tests.

Notes:

- This deploy updates production to include `AGENTS.md`, `docs/STRATEGY.md`, `docs/DAILY_WORKPLAN.md`, `docs/DEPLOYMENT_LOG.md`, and `docs/HANDOFF_PROMPTS.md` in the GitHub source and container build context.
- The deployed app itself remains functionally equivalent to the previous runtime deploy; this was a documentation/handoff synchronization deployment.

## 2026-04-25 - Build Stabilization Deployment

Source commit deployed:

- `a808b6f fix(build): stabilize Cloud Run deploy validation`

Cloud Build:

- Build ID: `ca612828-c779-46cd-bfde-8e1a8d3efe85`
- Status: `SUCCESS`
- Duration: `8M37S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend service: `praxis-frontend`
- Frontend URL: `https://praxis-frontend-pgoyqovcza-uc.a.run.app`
- Frontend revision: `praxis-frontend-00042-nhk`
- Frontend ready: `True`
- Backend service: `praxis-backend`
- Backend URL: `https://praxis-backend-pgoyqovcza-uc.a.run.app`
- Backend revision: `praxis-backend-00026-h82`
- Backend ready: `True`

Domain:

- Domain: `praxis.tacitus.me`
- Domain mapping ready: `True`
- Certificate provisioned: `True`
- Domain routable: `True`
- DNS record: `praxis CNAME ghs.googlehosted.com.`

Production verification:

- `https://praxis.tacitus.me/` returned `200 OK`.
- `https://praxis.tacitus.me/login` returned `200 OK`.
- `https://praxis.tacitus.me/onboarding` returned `307 Temporary Redirect` to `/login` for unauthenticated requests. This is expected.
- `https://praxis.tacitus.me/api/health` returned `status: ok`.
- Health checks reported:
  - Firestore: `ok`
  - AI provider: `ok`
  - Cookie secret: `ok`
  - Anthropic: `unconfigured`
  - Firecrawl: `unconfigured`
  - Vertex ADK: `unconfigured`
  - Stripe: `unconfigured`
- `https://praxis.tacitus.me/api/auth/test-firebase` confirmed:
  - Firebase reachable: `true`
  - Email/password enabled: `true`
  - Admin SDK status: `INITIALIZED_OK`

Firebase Auth authorized domains confirmed through Identity Toolkit config:

- `localhost`
- `praxisbytacitus.firebaseapp.com`
- `praxisbytacitus.web.app`
- `praxis.tacitus.me`
- `praxis-nextjs-tacitus.vercel.app`
- `praxis-frontend-852128226674.us-central1.run.app`

Local validation before deploy:

- `npm run build` passed.
- `npm run lint` passed with warnings only.
- `npm run audit:gcp` passed with zero hard failures and zero soft warnings.
- `node scripts/audit-ai-routes.mjs` passed: 53 AI route files, 53 calibrated, 4 exempt.
- `npx vitest run` passed: 40 test files, 140 tests.

Known production configuration gaps:

- Anthropic is unconfigured.
- Firecrawl is unconfigured.
- Vertex ADK engine ID is unconfigured; Deep Research Agent should use fallback behavior.
- Stripe is unconfigured.

## Deployment Verification Commands

```bash
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
gcloud run services describe praxis-frontend --region=us-central1 --format="value(status.url,status.latestReadyRevisionName)"
gcloud run services describe praxis-backend --region=us-central1 --format="value(status.url,status.latestReadyRevisionName)"
curl -sI https://praxis.tacitus.me/
curl -sI https://praxis.tacitus.me/login
curl -sI https://praxis.tacitus.me/onboarding
curl -s https://praxis.tacitus.me/api/health
curl -s https://praxis.tacitus.me/api/auth/test-firebase
```
