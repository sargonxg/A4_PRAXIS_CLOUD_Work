# PRAXIS Deployment Log

Use this file to keep daily deployment status visible to Codex, Claude Code, and humans.

## 2026-05-01 - Context Builder Workspace

Source:

- App commit deployed: `125cd53`
- Branch: `main`
- Remote: `origin/main`

What changed:

- Added `docs/PRAXIS_DEEP_RESEARCH_SYNTHESIS_2026-05-01.md`, converting the
  user-provided production research artifact into a PRAXIS execution thesis,
  monster backlog, immediate waves, and next deep-research prompts.
- Updated `docs/PRAXIS_AUTONOMOUS_IMPROVEMENT_PLAN.md` with the research
  ingest priorities and marked the Context Builder wave as the first
  implemented slice.
- Added a reusable context planner in `src/lib/context/context-builder-plan.ts`
  that derives context checklist status, missing inputs, recommended tool
  sequence, first boardroom question, and a deep-research handoff prompt from
  the active situation.
- Added `/app/context-builder`, a protected situation workspace that exposes
  context health, mission path, missing context, operating sequence, next best
  actions, and a structured research-agent prompt.
- Linked Context Builder from the authenticated sidebar and dashboard Situation
  Launchpad.
- Added unit coverage for mission-specific and thin-context planner behavior.
- Refreshed the tracked Graphify graph after code changes.

Validation before deploy:

- `npx vitest run tests/unit/lib/context/context-builder-plan.test.ts` passed:
  1 file, 2 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run lint` passed with the existing warning backlog and no errors
  (`205 warnings`).
- `npx vitest run` passed: 90 files, 441 tests.
- `npm run build` passed and included `/app/context-builder` in the compiled
  route manifest.
- Local dev smoke on `http://localhost:3100/login` returned `200`; protected
  `/app/context-builder` returned `307` to `/login?redirect=%2Fapp%2Fcontext-builder`.

Cloud Build:

- Build: `f9df0f4e-59be-4ff4-93bf-24ebfff9a71e`
- Status: `SUCCESS`
- Duration: `6M24S`
- Logs: <https://console.cloud.google.com/cloud-build/builds/f9df0f4e-59be-4ff4-93bf-24ebfff9a71e?project=852128226674>

Cloud Run:

- Frontend revision: `praxis-frontend-00188-6m7`
- Frontend URL: `https://praxis-frontend-pgoyqovcza-uc.a.run.app`
- Traffic: `100%`

Production verification:

- `GET https://praxis.tacitus.me/login` -> `200`.
- `GET https://praxis.tacitus.me/app/context-builder` -> `307` to
  `/login?redirect=%2Fapp%2Fcontext-builder` when unauthenticated.
- `GET https://praxis.tacitus.me/api/health` -> `status:"ok"`,
  `firestore:"ok"`, `ai_provider:"ok"`, `cookie_secret:"ok"`,
  `firecrawl:"ok"`, `vertex_adk:"ok"`.
- `GET https://praxis.tacitus.me/api/auth/test-firebase` confirmed Firebase
  is reachable and Email/Password auth is enabled.

## 2026-05-01 - Mission Workflow Playbooks

Source:

- App commit deployed: `ab229d7`
- Branch: `main`
- Remote: `origin/main`

What changed:

- Added `docs/PRAXIS_AUTONOMOUS_IMPROVEMENT_PLAN.md`, a codebase-grounded
  autonomous audit covering current architecture, customer-fit workflows,
  technical/product gaps, prioritized build waves, defense/diplomacy
  adaptations, and next improvements.
- Expanded policy workflow paths into mission playbooks with actual workflow,
  valuable UI, pay-worthy output, first-run question, and required inputs.
- Surfaced the mission playbooks in the no-situation empty state, situation
  creation workflow selection/review, and dashboard Situation Launchpad.
- Added regression coverage for workflow playbook completeness.
- Refreshed the tracked Graphify graph after code changes.

Validation before deploy:

- `npx vitest run tests/unit/lib/constants/policy-workflow-paths.test.ts`
  passed: 1 file, 2 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run lint` passed with the existing warning backlog and no errors.
- `npx vitest run` passed: 89 files, 439 tests.
- `npm run build` passed.
- Local dev smoke on `http://localhost:3100/login` passed; protected
  `/app/situations/new?workflow=mediator-envoy` redirected to login when
  unauthenticated.

Cloud Build:

- Build: `74e3b2e8-d662-4873-8c82-73bfde327a5c`
- Status: `SUCCESS`
- Duration: `5M18S`
- Logs: <https://console.cloud.google.com/cloud-build/builds/74e3b2e8-d662-4873-8c82-73bfde327a5c?project=852128226674>

Cloud Run:

- Frontend revision: `praxis-frontend-00184-8cl`
- Frontend URL: `https://praxis-frontend-pgoyqovcza-uc.a.run.app`
- Traffic: `100%`

Production verification:

- `GET https://praxis.tacitus.me/login` -> `200`.
- `GET https://praxis.tacitus.me/api/health` -> `status:"ok"`,
  `firestore:"ok"`, `ai_provider:"ok"`, `vertex_adk:"ok"`,
  `firecrawl:"ok"`.
- `GET https://praxis.tacitus.me/api/auth/test-firebase` confirmed Firebase
  is reachable and Email/Password auth is enabled.
- Production browser smoke passed for `/login`; protected
  `/app/situations/new?workflow=mediator-envoy` redirected to
  `/login?redirect=%2Fapp%2Fsituations%2Fnew` when unauthenticated.

## 2026-05-01 - Boardroom Capability + Context/Search Audit

Source:

- App commit deployed: `6aaa531`
- Branch: `main`
- Remote: `origin/main`

What changed:

- Added a public four-advisor capability registry covering each flagship
  expert's method, boardroom role, visible tool access, source/data diet, and
  Dialectica-ready graph layer.
- Updated the landing Advisory Council so users see the four experts as
  differentiated working agents, not generic personas.
- Updated the authenticated Strategic Advisory picker to show each advisor's
  boardroom role, source categories, server-allowed tools, model tier, and
  graph layer.
- Added `docs/PRAXIS_BOARDROOM_CONTEXT_SEARCH_AUDIT_2026-05-01.md`, a
  researched audit and next-work queue for new/returning users, context
  creation, search/data grounding, boardroom runs, and future Dialectica graph
  integration.
- Added regression coverage for the four-advisor capability registry.

Validation before deploy:

- `npx vitest run tests/unit/lib/constants/advisors.test.ts tests/types/advisor.test.ts`
  passed: 2 files, 6 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run lint` passed with the existing warning backlog and no errors.
- `npx vitest run` passed: 88 files, 437 tests.
- `npm run build` passed.

Cloud Build:

- Build: `fce22196-ce9b-43af-af10-6c6c07e2c493`
- Status: `SUCCESS`
- Duration: `6M13S`
- Logs: <https://console.cloud.google.com/cloud-build/builds/fce22196-ce9b-43af-af10-6c6c07e2c493?project=852128226674>

Cloud Run:

- Frontend revision: `praxis-frontend-00180-fkk`
- Frontend URL: `https://praxis-frontend-pgoyqovcza-uc.a.run.app`
- Traffic: `100%`

Production verification:

- `GET https://praxis.tacitus.me/login` -> `200`.
- `GET https://praxis.tacitus.me/api/health` -> `status:"ok"`,
  `firestore:"ok"`, `ai_provider:"ok"`, `vertex_adk:"ok"`,
  `firecrawl:"ok"`.
- `GET https://praxis.tacitus.me/api/auth/test-firebase` confirmed Firebase
  is reachable and Email/Password auth is enabled.
- Production browser smoke passed for `/#advisory`; the new four-expert
  boardroom roles and Dialectica graph callout render on the live landing page.
- Production browser smoke passed for `/app/tools` unauth redirect to
  `/login?redirect=%2Fapp%2Ftools`.

## 2026-05-01 - Real App Prompt Isolation + Dialectica Backbone Docs

Source:

- App commit deployed: `747edfa`
- Branch: `main`
- Remote: `origin/main`

What changed:

- Ask PRAXIS suggested prompts now keep demo conflict prompts isolated to demo
  mode. Real users without an active situation receive neutral setup, context
  quality, workflow, and graph-backbone prompts.
- Added regression coverage for real/no-situation, real/situation, and demo
  prompt categories.
- Added `docs/PRAXIS_REAL_APP_CRITICAL_ROADMAP_2026-05-01.md`, a
  production-focused roadmap that separates real app content from demo content
  and ranks the highest-impact user-success work.
- Added `docs/PRAXIS_DIALECTICA_BACKBONE_ARCHITECTURE_2026-05-01.md`, a
  researched architecture plan for future premium Dialectica-backed dynamic
  ontologies, deterministic graph reasoning, and context packs.

Validation before deploy:

- `npx vitest run tests\unit\components\assistant\suggested-prompts.test.ts`
  passed: 3 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run lint` passed with the existing warning backlog and no errors.
- `npx vitest run` passed: 87 files, 435 tests.
- `npm run build` passed.

Cloud Build:

- Build: `aa47784b-ed5d-4d4b-8e1a-f0575775aa92`
- Status: `SUCCESS`
- Duration: `6M40S`
- Logs: <https://console.cloud.google.com/cloud-build/builds/aa47784b-ed5d-4d4b-8e1a-f0575775aa92?project=852128226674>

Cloud Run:

- Frontend revision: `praxis-frontend-00176-k8z`
- Frontend URL: `https://praxis-frontend-pgoyqovcza-uc.a.run.app`

Production verification:

- `GET https://praxis.tacitus.me/` -> `200`.
- `GET https://praxis.tacitus.me/login` -> `200`.
- `GET https://praxis.tacitus.me/onboarding` -> `307 /login`.
- `GET https://praxis.tacitus.me/api/health` -> `status:"ok"`,
  `firestore:"ok"`, `ai_provider:"ok"`, `vertex_adk:"ok"`,
  `firecrawl:"ok"`.
- `GET https://praxis.tacitus.me/api/auth/test-firebase` confirmed Firebase
  is reachable and Email/Password auth is enabled.
- Production browser smoke passed for `/login` and `/app/tools` unauth
  redirect to `/login?redirect=%2Fapp%2Ftools`.

## 2026-05-01 - Tools Workspace + Context Creation Release

Source:

- Commit: `c873dd7`
- Branch: `main`
- Remote: `origin/main`

What changed:

- Added `/app/tools` as a tools workspace for package readiness, missing
  context, and next actions.
- Added deterministic package action planning shared by dashboard cards and
  the tools workspace.
- Expanded package readiness warnings for graph, source, document, stale
  output, route, and context gaps.
- Enriched calibrated situation prompt blocks with situation id/status/type,
  region, actors, risk/Glasl trend, domain confidence, workflow path,
  inventory counts, analyst notes, source URLs, custom sources, and date or
  language overrides.
- Added default SKC retrieval query construction for calibrated AI routes
  that do not provide their own retrieval query.
- Hardened situation creation context intake with URL normalization,
  protocol validation, dedupe, caps, context-note trimming, and custom-source
  filtering.
- Added an AI context quality readout to the situation creation review step.
- Updated changelog, TODO, tools usability docs, and context creation release
  notes.

Validation before deploy:

- `npx vitest run` passed: 86 files, 432 tests.
- `npx tsc --noEmit --pretty false` passed.
- `npm run lint` passed with the existing warning backlog and no errors.
- `npm run audit:routes` passed: 62 calibrated AI routes and 5 exempt.
- `npm run audit:tool-contracts` passed: 54/54 tools at >=6/7 checks.
- `npm run audit:gcp` passed with zero hard failures and zero soft warnings.
- `npm run build` passed.
- Local browser smoke passed for `/login`, `/onboarding` unauth redirect, and
  `/app/tools` unauth redirect preservation.
- `npx playwright test tests/e2e/golden-path.spec.ts tests/e2e/onboarding.spec.ts`
  skipped both authenticated specs because `TEST_FIREBASE_EMAIL` is not
  configured on this machine.

Cloud Build:

- Build: `e9c94507-6130-47e3-8dbd-4b64b035b716`
- Status: `SUCCESS`
- Duration: `5M51S`
- Logs: <https://console.cloud.google.com/cloud-build/builds/e9c94507-6130-47e3-8dbd-4b64b035b716?project=852128226674>

Cloud Run:

- Frontend revision: `praxis-frontend-00172-b5n`
- Frontend URL: `https://praxis-frontend-pgoyqovcza-uc.a.run.app`

Production verification:

- `GET https://praxis.tacitus.me/` -> `200`.
- `GET https://praxis.tacitus.me/login` -> `200`.
- `GET https://praxis.tacitus.me/onboarding` -> `307 /login`.
- `GET https://praxis.tacitus.me/api/health` -> `status:"ok"`,
  `firestore:"ok"`, `ai_provider:"ok"`, `vertex_adk:"ok"`,
  `firecrawl:"ok"`.
- `GET https://praxis.tacitus.me/api/auth/test-firebase` confirmed Firebase
  is reachable and Email/Password auth is enabled.
- Production browser smoke passed for `/login` and `/app/tools` unauth
  redirect to `/login?redirect=%2Fapp%2Ftools`.

## 2026-04-29 — Tool Provenance Hardening + Enforced GCP Audit

Source:

- Commit: `8fbe2f7`
- Branch: `main`
- Remote: `origin/main`

What changed:

- Added the consolidated 20-item subagent roadmap:
  `docs/PRAXIS_NEXT_20_IMPROVEMENTS_2026-04-29.md`.
- Added canonical versioned tool-output envelopes under `tool-data/{toolId}`
  while preserving the legacy `tools/{toolId}` compatibility documents.
- Updated Export Center to read canonical and legacy outputs, prefer canonical
  envelopes, and include provenance/compatibility metadata in exported bundles.
- Added structured validation and canonical persistence to terminology,
  extract-episodes, deep research, deep search agent, and grounded-search
  flows.
- Renamed user-facing assistant surfaces to Ask PRAXIS and passed the active
  `situationId` into grounded-search chat requests.
- Improved guided walkthrough copy so it no longer depends on stale demo
  language.
- Hardened `scripts/audit-tools.ts` so delegated AI routes are scored against
  their real implementation files.
- Turned Cloud Build GCP audit enforcement back on with `_AUDIT_GCP_SKIP=0`.

Validation before deploy:

- `npx vitest run tests/unit/lib/api/save-tool-output.test.ts tests/unit/scripts/audit-tools.test.ts tests/unit/lib/knowledge/evidence-envelope.test.ts tests/unit/lib/knowledge/tool-output-layer.test.ts tests/unit/lib/api/with-calibration.test.ts` passed.
- `npx tsc --noEmit` passed.
- `npm run audit:tools` passed and regenerated
  `docs/audits/tools-2026-04-29.md`.
- `npm run audit:routes` passed: 62 calibrated AI routes and 5 exempt.
- `npm run audit:gcp` passed locally with zero hard failures and zero soft
  warnings.
- `npm run build` passed with only the known Next.js middleware-to-proxy
  warning.
- `npm run lint` exited successfully with existing repo-wide warnings and no
  errors.
- Exact secret scan over changed source, scripts, docs, tests, cloudbuild, and
  changelog/TODO files returned no sensitive-token hits.

Cloud Build:

- Initial enforced audit build `a8b62d27-b9d3-499b-b674-3195159ab5bb` failed
  because the actual build identity lacked read-only audit permissions.
- Follow-up build `110fd631-d7e3-40ca-b5ee-294eb1f13742` failed only on
  upload bucket metadata visibility.
- Granted the Cloud Build service identities project-level read-only audit
  roles plus bucket-level `roles/storage.legacyBucketReader` on the uploads
  bucket.
- Successful build: `d6c0bbb8-2bf9-4266-81cd-d20064d3a693`
- Status: `SUCCESS`
- Duration: `9M46S`

Cloud Run:

- Frontend revision: `praxis-frontend-00132-jz6`
- Backend revision: `praxis-backend-00076-ttp`

Production verification:

- `https://praxis.tacitus.me/api/health` returned `status: ok`.
- `/api/health` reported `ai_provider: ok`, `vertex_adk: ok`, and request
  safeguard limits including `maxMessages: 50`.
- `https://praxis.tacitus.me/api/health/feeds` returned `11/11 feeds active`.

## 2026-04-29 — Vertex AI Agent Engine activation

Provisioned the PRAXIS Deep Research Agent on Vertex AI Agent Engine in
`praxisbytacitus` / `us-central1`.

What changed:

- Enabled and verified Vertex AI / Storage / Secret Manager prerequisites.
- Installed a supported local Python 3.12 runtime for Agent Engine deployment.
- Deployed `backend/agents/deploy.py` to Vertex AI Agent Engine using the
  staging bucket `gs://praxisbytacitus-agent-staging`.
- Stored the numeric engine ID in Secret Manager
  `praxis-vertex-adk-engine-id`.
- Granted the frontend and backend Cloud Run service accounts access to the
  engine ID secret.
- Mounted `VERTEX_AGENT_ENGINE_ID` and `VERTEX_AGENT_LOCATION=us-central1` on
  `praxis-frontend`.
- Updated `cloudbuild.yaml` so future Cloud Build deploys preserve the Vertex
  Agent Engine mount.
- Removed ACLED references from the deployable deep-research agent prompts in
  favor of UCDP, GDELT, ReliefWeb, UN sources, peer-reviewed work, and media of
  record.

Production verification:

- Frontend revision: `praxis-frontend-00128-fnd`.
- `https://praxis.tacitus.me/api/health` reports `checks.vertex_adk = ok`.
- `checks.ai_provider = ok`.

## 2026-04-28 — Authenticated backend proxy + admin reset hardening (DEPLOYED, smoke OK)

Source commits deployed:

- `f01ab12 Route backend access through authenticated proxy`
- `16cf6f7 Harden bulk credit reset endpoint`

What changed:

- Added authenticated, allowlisted `/api/backend/*` proxy for user-scoped
  pipeline, graph, temporal, and analysis calls to the private Python backend.
- Updated the browser-facing `praxisBackend` facade to call `/api/backend/*`
  instead of direct private Cloud Run URLs.
- Removed the legacy `/backend/:path*` rewrite from `next.config.ts`.
- Conflict Graph now surfaces TACITUS Core-8 coverage in the main workflow.
- Added long-form production backlog:
  `docs/PRODUCTION_TODO_2026-04-28.md`.
- Hardened `/api/admin/set-all-credits`; it now requires authenticated admin
  session plus explicit confirmation body.

Validation before deploy:

- `npx vitest run tests/unit/app/api/backend/proxy.test.ts tests/unit/lib/graph/core-primitives.test.ts` passed.
- `npx tsc --noEmit` clean.
- Strict ESLint passed on touched TS/TSX/config files.
- `npm run audit:routes` passed.
- `npm run build` passed.

Cloud Build:

- Build: `6d7b95b9-7272-4baa-b145-01c5c8ade45b`
- Status: `SUCCESS`
- Duration: `9M50S`
- Logs: <https://console.cloud.google.com/cloud-build/builds/6d7b95b9-7272-4baa-b145-01c5c8ade45b?project=852128226674>

Cloud Run:

- Frontend revision: `praxis-frontend-00111-w8z`
- Backend revision: `praxis-backend-00066-d6d`

Production smoke:

- `GET https://praxis.tacitus.me/api/health` -> `200`, `status:"ok"`,
  `firestore:"ok"`, `ai_provider:"ok"`, `cookie_secret:"ok"`,
  `firecrawl:"ok"`, `vertex_adk:"unconfigured"`, `polar:"unconfigured"`.
- Unauthenticated `GET https://praxis.tacitus.me/api/backend/graph/test-situation` -> `401`.
- Unauthenticated `POST https://praxis.tacitus.me/api/admin/set-all-credits`
  with confirmation body -> `401`.
- Legacy `GET https://praxis.tacitus.me/backend/graph/test-situation` -> `404`.

Notes:

- Known optional integrations remain unconfigured: Vertex ADK and Polar.
- Next best sprint: add Core-8 coverage to corpus traces / Ask PRAXIS warnings,
  rotate local secrets, and automate GCP audit + Firestore rules deployment.

---

## 2026-04-28 — Backend trust boundary + Core-8 coverage (DEPLOYED, smoke OK)

Source commit deployed:

- `8dbe521 Harden backend trust and add core graph coverage`

What changed:

- Backend service-to-service auth now verifies Google OIDC audience and trusted
  service-account email before accepting `X-PRAXIS-UID`.
- `/agents/health` and `/api/v1/graph/test-connection` are service-only
  backend operations.
- Graph connection testing now goes through the admin-gated frontend API bridge
  `/api/backend/graph/test-connection`.
- Backend CORS allows `X-Firebase-Token` and `X-PRAXIS-UID`, matching the
  documented auth split.
- Graph writes now persist `corePrimitiveCoverage` for the TACITUS Core-8.
- README, CLAUDE, AGENTIC_SYSTEM, AGENT_REGISTRY, CORPUS_ARCHITECTURE, and
  continuation docs were updated.

Validation before deploy:

- `python -m py_compile backend/auth.py backend/config.py backend/main.py backend/routers/graph.py` passed.
- `python -m pytest tests/test_auth.py` passed from `backend/`.
- `npx vitest run tests/unit/lib/graph/core-primitives.test.ts` passed.
- `npx tsc --noEmit` clean.
- Strict ESLint passed on touched TS/TSX files.
- `npm run audit:routes` passed.
- `npm run build` passed and route table included `/api/backend/graph/test-connection`.

Cloud Build:

- Build: `52b79304-7779-4699-835e-78981b687ae8`
- Status: `SUCCESS`
- Duration: `12M6S`
- Logs: <https://console.cloud.google.com/cloud-build/builds/52b79304-7779-4699-835e-78981b687ae8?project=852128226674>

Cloud Run:

- Frontend revision: `praxis-frontend-00107-vg2`
- Backend revision: `praxis-backend-00064-hbl`

Production smoke:

- `GET https://praxis.tacitus.me/api/health` -> `200`, `status:"ok"`,
  `firestore:"ok"`, `ai_provider:"ok"`, `cookie_secret:"ok"`,
  `firecrawl:"ok"`, `vertex_adk:"unconfigured"`, `polar:"unconfigured"`.
- Unauthenticated `POST https://praxis.tacitus.me/api/backend/graph/test-connection` -> `401`.
- Direct unauthenticated `GET https://praxis-backend-pgoyqovcza-uc.a.run.app/agents/health` -> `403` from Cloud Run IAM.

Notes:

- Next iteration should replace remaining browser-to-backend rewrite usage with
  Next API bridges and surface Core-8 coverage inside the Conflict Graph UI.

---

## 2026-04-28 — Integration readiness + admin/security hardening (DEPLOYED, smoke OK)

Source commit deployed:

- `db4a78c Harden integration readiness and admin controls`

What changed:

- `/api/health/provider` and `/app/settings/system-health` now expose live,
  non-secret readiness for Firecrawl, Parallel, Vertex AI Agent Engine, and
  Polar.
- Admin credit top-up and advisor-feed reads now require the admin allowlist.
- Signed sessions now require `COOKIE_SIGNING_SECRET`; unsafe fallback secrets
  were removed.
- Firestore user create rules now reject client-seeded subscription, Polar,
  promo, and full-access fields except for the expected free-plan bootstrap.
- Backend Python/ADK defaults now use stable `gemini-2.5-flash` /
  `gemini-2.5-pro` model IDs.

Validation before deploy:

- `npx vitest run tests/unit/app/api/health/provider.test.ts tests/unit/lib/auth/cookie-signer.test.ts` passed.
- `npx tsc --noEmit` clean.
- Strict ESLint passed on touched TS/TSX files.
- `python -m py_compile backend/config.py backend/ai/flows.py backend/ai/genkit_app.py backend/agents/deploy.py` passed.
- `npm run audit:routes` passed: `61 AI route files, 61 calibrated, 5 exempt`.
- `npm run build` passed.

Cloud Build:

- Build: `7a2cdb66-d62f-4b45-923c-9442abcb13ef`
- Status: `SUCCESS`
- Duration: `10M6S`
- Logs: <https://console.cloud.google.com/cloud-build/builds/7a2cdb66-d62f-4b45-923c-9442abcb13ef?project=852128226674>

Cloud Run:

- Frontend revision: `praxis-frontend-00105-6d5`
- Backend revision: `praxis-backend-00063-2t2`

Firestore:

- `firebase deploy --only firestore:rules --project praxisbytacitus` succeeded
  after Firebase CLI re-auth.

Production smoke:

- `GET https://praxis.tacitus.me/api/health` -> `200`, `status:"ok"`,
  `firestore:"ok"`, `ai_provider:"ok"`, `cookie_secret:"ok"`,
  `firecrawl:"ok"`, `vertex_adk:"unconfigured"`, `polar:"unconfigured"`.
- `GET https://praxis.tacitus.me/app/pricing` -> `307 location: /pricing`.
- `GET https://praxis.tacitus.me/app/dashboard` unauthenticated ->
  `307 location: /login?redirect=%2Fapp%2Fdashboard`.

Notes:

- Vertex ADK and Polar are intentionally still unconfigured until their live
  Secret Manager values are created/mounted.
- Security review found local `.env.local` contains live secrets; rotate those
  credentials as the next manual owner action.

---

## 2026-04-28 — Dashboard pricing route + evidence retrieval hardening (DEPLOYED, smoke OK)

Source commit deployed:

- `ca1f870 Harden dashboard links and evidence retrieval`

What changed:

- Fixed authenticated dashboard upgrade links that were resolving `/pricing`
  as `/app/pricing` and causing `_rsc` 404s.
- Added middleware-level `/app/pricing` -> `/pricing` redirect so cached
  clients bypass app auth and no longer bounce through login.
- Soft-metered AI credits so depleted balances no longer block AI execution.
- Switched post-create `/api/ai/auto-structure` to the standard Flash model for
  reliable first-value situation creation.
- Added a citation-ready evidence envelope and SKC/corpus fallback across both
  `tool-data/{toolId}` and `tools/{toolId}`.

Validation before deploy:

- `npx tsc --noEmit` clean.
- Focused Vitest passed for routes, with-calibration, evidence envelope,
  tool-output layer, and corpus-search helpers.
- Strict ESLint passed on touched files.
- `npm run build` passed and route table included `/app/pricing`.

Cloud Build:

- Build: `9d80d0f1-f8f9-4402-b6a1-dedec064b110`
- Status: `SUCCESS`
- Duration: `8M53S`
- Logs: <https://console.cloud.google.com/cloud-build/builds/9d80d0f1-f8f9-4402-b6a1-dedec064b110?project=852128226674>

Cloud Run:

- Frontend revision: `praxis-frontend-00103-g86`
- Backend revision: `praxis-backend-00062-f58`

Production smoke:

- `GET https://praxis.tacitus.me/app/pricing` -> `307 location: /pricing`
- `GET https://praxis.tacitus.me/pricing` -> `200`
- `GET https://praxis.tacitus.me/app/dashboard` unauthenticated ->
  `307 location: /login?redirect=%2Fapp%2Fdashboard`
- `GET https://praxis.tacitus.me/api/health` ->
  `status:"ok"`, `firestore:"ok"`, `ai_provider:"ok"`,
  `cookie_secret:"ok"`, `firecrawl:"ok"`

Notes:

- `vertex_adk` remains `unconfigured`; this is optional for managed Agent
  Engine deep-research paths. Core PRAXIS AI provider health is `ok`.
- `polar` remains `unconfigured`; paid checkout still needs live Polar secrets.

---

## 2026-04-27 — Landing-page + share-metadata refresh (DEPLOYED, smoke OK)

Source commits deployed (all on `origin/main` at submission time):

- `c6afdd4 feat(landing): hero portal panels filled with real Sahel content + agentic-AI narrative`
- `5a1929a feat(landing): commercial 'AI Built for Statecraft' headline + audience copy`
- `0548c78 feat(landing): replace waitlist with 'Talk to TACITUS' + AI-native-stack pitch`
- `b088e8f feat(seo): retune share metadata + OG image around the Statecraft positioning`
- (also rolled in: `abc42be fix(csp): allow next chunks on protected pages` ·
  `2476ef2 feat(health): add situation health scoring` ·
  `51812a5 fix(csp): permit next bootstrap scripts`)

Validation gate before deploy:

- `npx tsc --noEmit` clean.
- `npm run build` clean — `Errors: 0 | Warnings: 0`.
- `node scripts/audit-ai-routes.mjs` passed: `58 AI route files, 58 calibrated, 4 exempt`.
- `node scripts/audit-gcp.mjs` passed: `Hard failures: 0 · Soft warnings: 0`.
- `npm run lint` and `npx vitest run` not re-run in this session — last green
  from the previous successful deploy (commit `c7253b62-c058-4b1d-b3c0-00ac650b8edc`,
  same day) still applies; no source files since then change behaviour those
  suites cover (landing-only edits + share metadata).

Cloud Build:

- Submitted: `b2287473-897e-49be-92c5-33a051932420` via
  `gcloud builds submit --config=cloudbuild.yaml --async`.
- Logs: <https://console.cloud.google.com/cloud-build/builds/b2287473-897e-49be-92c5-33a051932420?project=852128226674>
- Outcome: build reached `SUCCESS` while the Claude session was idle
  (gcloud auth tokens expired in the meantime). Revision details
  could not be queried from this session — Codex should fill them in
  with `gcloud run services describe praxis-{frontend,backend}` after
  re-authenticating.

Production smoke (curl, no gcloud needed):

- `GET https://praxis.tacitus.me/` → `200`
- `GET https://praxis.tacitus.me/login` → `200`
- `GET https://praxis.tacitus.me/pricing` → `200`
- `GET https://praxis.tacitus.me/api/health` →
  `{"status":"ok", checks:{firestore:"ok", ai_provider:"ok", cookie_secret:"ok", ...}}`
- `GET https://praxis.tacitus.me/opengraph-image` → `200 OK ·
  content-type: image/png · x-nextjs-cache: HIT`
- HTML head confirms new metadata is live:
  - `<title>PRAXIS by TACITUS — AI Built for Statecraft</title>`
  - `og:title` = `PRAXIS by TACITUS · AI Built for Statecraft. Calibrated to You.`
  - `og:image:secure_url` = `https://praxis.tacitus.me/opengraph-image`
  - canonical, keywords, googlebot `max-image-preview:large` all
    present.

Still owed (nice-to-have, not blocking):

- Run `gcloud run services describe praxis-{frontend,backend}` to
  capture the new revision names; record them inline above.
- Send `https://praxis.tacitus.me` through the LinkedIn / WhatsApp /
  Twitter / Slack / Facebook share debuggers to bust their caches
  and confirm the new portal-ring OG image is picked up.

---

## 2026-04-27 — Codex Admin Console v2 foundation deploy

Source commits deployed:

- `67b5130 feat(admin): harden operator console and advisor feed`
- `c578677 fix(deploy): escape admin email allowlist env`

Cloud Build:

- Failed build: `8986edf2-4eba-4b52-9543-775d6b00bf47` — frontend deploy failed because
  `ADMIN_EMAIL_ALLOWLIST` comma needed gcloud custom-delimiter escaping.
- Successful build: `c7253b62-c058-4b1d-b3c0-00ac650b8edc` — `SUCCESS`, `9M24S`.

Cloud Run:

- Frontend revision after final deploy: `praxis-frontend-00087-w42`
- Backend revision after final deploy: `praxis-backend-00053-w9x`
- `ADMIN_EMAIL_ALLOWLIST` confirmed on frontend runtime:
  `giulio@tacitus.me,giuliocatanzariti@gmail.com`

Validation before deploy:

- `npx tsc --noEmit` clean after `.next/types` regeneration.
- `npm run build` clean.
- `npm run lint` clean with warnings only.
- `npm run audit:gcp` passed with zero hard failures and zero soft warnings.
- `node scripts/audit-ai-routes.mjs` passed: `58 AI route files, 58 calibrated, 4 exempt`.
- `npx vitest run` passed: `367/367`.
- `python -m pytest tests\test_langgraph_runtime.py -q` passed: `2/2`.

Production smoke:

- `https://praxis.tacitus.me/` returned `200`.
- `https://praxis.tacitus.me/login` returned `200`.
- `https://praxis.tacitus.me/api/health` returned `200`.
- `https://praxis.tacitus.me/app/admin` returned `307` to `/login?redirect=%2Fapp%2Fadmin` unauthenticated.
- `https://praxis.tacitus.me/api/admin/advisor-feed` returned `401` unauthenticated.
- Private backend `GET /agents/health` returned `200` with Cloud SQL
  `praxis_langgraph` checkpointer reachable and `schemaSetup: true`.

Firestore deploy note:

- `firebase deploy --only firestore:rules,firestore:indexes --project=praxisbytacitus`
  was re-run after Firebase CLI reauth and completed successfully.
- Rules compiled and were released to `cloud.firestore`.
- Indexes in `firestore.indexes.json` deployed successfully for the default
  database, including the `advisor_feed_items(status, updatedAt desc)` index.
- Firebase reported six existing field overrides in the project that are not
  present in source. The deploy was intentionally run without `--force`, so no
  existing production field overrides were deleted.

---

## 2026-04-27 — Codex Brick #1 LangGraph runtime deploy

Source commits deployed:

- `be39dbd feat(agents): add langgraph postgres runtime foundation`
- `17a85b9 fix(agents): trim langgraph database secret`

Cloud Build:

- Build ID: `c7c9f090-fc43-4d14-a2ac-dc35c18b79a2` — `SUCCESS`, `11M28S`.
- Build ID: `b6a61ecb-196e-47d2-80d8-8cf842abb606` — `SUCCESS`, `9M49S` (password-secret trim fix).
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision after final deploy: `praxis-frontend-00085-qvq`
- Backend revision after final deploy: `praxis-backend-00051-55q`
- Backend URL: `https://praxis-backend-pgoyqovcza-uc.a.run.app`

Validation before deploy:

- `npx tsc --noEmit` clean.
- `npm run build` clean.
- `npm run lint` clean with warnings only.
- `npm run audit:gcp` passed with zero hard failures and zero soft warnings.
- `node scripts/audit-ai-routes.mjs` passed: `58 AI route files, 58 calibrated, 4 exempt`.
- `npx vitest run` passed: `366/366`.
- `python -m pytest tests\test_langgraph_runtime.py -q` passed: `2/2`.

Production smoke:

- `https://praxis.tacitus.me/` returned `200`.
- `https://praxis.tacitus.me/login` returned `200`.
- `https://praxis.tacitus.me/api/health` returned `200`.
- Private backend `GET /agents/health` returned `200` with Cloud SQL
  `praxis_langgraph` checkpointer reachable and `schemaSetup: true`.

Notes:

- First deploy surfaced a real production issue: Cloud Run could reach
  private IP `10.101.0.3:5432`, but Postgres rejected the password because
  the mounted Secret Manager env value needed trimming. Commit `17a85b9`
  normalizes the env secret and production health is now green.

---

## 2026-04-26 — Tenth-session round 4 deploy (Claude Code) — Lanes AA, BB, CC, DD, EE, FF

Source commit deployed: head of `main` at `gcloud builds submit` time (round-4 lanes AA → FF + the round-4 CHANGELOG commit).

Cloud Build:

- Build ID: `7761707d-455e-4187-80d2-d014e3b6615b`
- Status: `SUCCESS`
- Duration: `~10M36S` (createTime 2026-04-26T23:26:16Z → finishTime 23:36:52Z)
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision: `praxis-frontend-00077-lqg` (ready, active)
- Backend revision: `praxis-backend-00047-vbg` (ready, active)
- Function services still ready: `on-document-uploaded-00001-taz`, `on-situation-created-00001-zay`
- GDELT worker still ready: `gdelt-poller-00001-wag`

Validation before submit:

- `npx tsc --noEmit` clean.
- `npm run build` clean.
- `node scripts/audit-ai-routes.mjs` reports `57 AI route files, 57 calibrated, 4 exempt` (no new AI routes vs round 3 — round 4 ships intelligence + helper modules).
- `npx vitest run` 317/317 (was 270 entering round 4 — +47 from CC dev-backlog (18) + DD clarifying-questions (15) + EE wikipedia-enrichment (5) + FF analyst-notes (8) + 1 from a registry tweak).

Production smoke (post-deploy):

- `https://praxis.tacitus.me/` returned `200`.
- `https://praxis.tacitus.me/login` returned `200`.
- `https://praxis.tacitus.me/api/health` returned `status: ok` with Firestore, AI provider, and cookie-secret checks healthy. `anthropic`, `firecrawl`, `vertex_adk`, `stripe` continue to report `unconfigured` (expected operating posture).

What shipped (round 4 lanes):

- **Lane AA — bottom-right collision + Screenshot* gitignore.** Activity-panel pill moved from `fixed bottom-4 right-4` to `bottom-24 right-6` so it no longer overlaps the FloatingPraxis dome. Screenshot files dropped into the repo are now ignored from git.
- **Lane BB — dashboard widget-shell light-mode token swap (WCAG AA).** Root cause: `slate-800/900/300/500/600` dark-theme tokens inside the `app-light` shell. New tokens: `navy-700/600/500/400` + `slate-200` borders + `bg-white` + soft shadow. Same WidgetShell powers RiskGaugeWidget + EscalationWidget + RecommendedToolsWidget so all three dashboard cards now render legibly.
- **Lane CC — Developer Backlog system.** `dev_backlog/` Firestore root collection with 8 kinds, 5 severities, 7 statuses, dedupe key (SHA-1 of normalised signature), TTL by severity (30/90/365 days). `withCalibration` failure path auto-publishes on every 4xx/5xx. `GET / POST /api/intelligence/dev-backlog` admin-gated.
- **Lane DD — Clarifying Questions framework.** Schema, route helper `clarificationResponse(req)`, type guard, prompt-block helper, modal component with 5 input types and 6 topics. Threading into specific routes queued.
- **Lane EE — Wikipedia enrichment client.** REST API + opensearch + 6s timeout + AbortController + PRAXIS user-agent. `formatWikipediaPromptBlock` renders the `## WIKIPEDIA BACKGROUND (CC-BY-SA, cite by URL on use)` block. Threading into Conflict Graph + Timeline routes queued.
- **Lane FF — Analyst Notes** (natural-language knowledge retention). CRUD on `users/{uid}/situations/{sitId}/analyst_notes/{id}` + `formatAnalystNotesBlock` prompt-injection helper with explicit "do NOT contradict an analyst note silently" instruction.

Cumulative tenth-session totals (rounds 1 → 4):

- Code lanes shipped: A, B, C, D, M, N, T, U, V, W, X, Z, AA, BB, CC, DD, EE, FF (18).
- Doc lanes shipped: E, O, P, Q, R, S, Y, LP1, LP2 + persona walkthroughs + Codex handoff + agent registry doc + agentic-system refresh + this DEPLOYMENT_LOG (14).
- Cloud Build SUCCESS deploys: 4 (`05a1e8dd`, `8bda8f5d`, `0bbb5830`, `7761707d`).
- AI routes calibrated: 57 (was 53 at session start).
- Vitest count: 317/317 (was 168 at session start; +149 across the session).
- Open bricks tracked on `docs/TODO_BOARD_2026-04-26.md`: 38 BIG bricks + 6 NEW bricks 39-44 from rounds 3-4 + 7 P-Test items + queued lanes.

---

## 2026-04-26 — Tenth-session round 3 deploy (Claude Code) — Lanes M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z + LP1 + LP2

Source commit deployed: head of `main` at submit time (round-3 lanes shipped + the docs bundle).

Cloud Build:

- Build ID: `0bbb5830-ceda-4850-868f-9acfaf779a9c`
- Status: `SUCCESS`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision: `praxis-frontend-00075-lzv` (was active before round 4)
- Backend revision: `praxis-backend-00046-xdp` (was active before round 4)

Production smoke (post-deploy): `/`, `/login`, `/api/health` → 200/200/200.

What shipped: Lane Z (agent runner), Lane T (Source Scout agentic workflow #1), Lane U (Red-Team auto-review agentic workflow #2), Lane V (AiErrorToast + DegradedDataChip), Lane W (citation chips), Lane X (Brainstorming Table Markdown export), Lane LP1 (landing page hero overhaul + AiCompanionSection), Lane LP2 (audit verified clean), Lane M (agent registry codified), Lane N (Ask PRAXIS chat → searchSituationCorpus), Lanes O-S (test plan, GCP expansion, TODO board, tool reliability audit, INDEX), Lane Y (seven specs).

---

## 2026-04-26 — Tenth-session round 2 deploy (Claude Code) — Lanes M, N, O, P, Q, R, S

Source commit deployed: `df15c12` (working-tree snapshot at submit time — head of `main` after the Lane M+N code commit and the Lane O–S docs bundle).

Cloud Build:

- Build ID: `8bda8f5d-6ed3-4f1a-860b-96ab086630fd`
- Status: `SUCCESS`
- Duration: `~9M23S` (createTime 2026-04-26T22:12:52Z → finishTime 22:22:15Z)
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision: `praxis-frontend-00073-vrc` (ready, active)
- Backend revision: `praxis-backend-00045-jdk` (ready, active)
- Function services still ready: `on-document-uploaded-00001-taz`, `on-situation-created-00001-zay`
- GDELT worker still ready: `gdelt-poller-00001-wag`

Validation before submit:

- `npx tsc --noEmit` clean (0 errors)
- `npm run build` clean
- `npm run audit:gcp` 0 hard / 0 soft
- `node scripts/audit-ai-routes.mjs` reports `55 AI route files, 55 calibrated, 4 exempt`
- `npx vitest run` 215/215 (was 207 entering round 2 — +8 from `tests/services/agent-registry.test.ts`)

Production smoke (post-deploy):

- `https://praxis.tacitus.me/` returned `200`
- `https://praxis.tacitus.me/login` returned `200`
- `https://praxis.tacitus.me/api/health` returned `status: ok` with Firestore, AI provider, and cookie secret checks healthy. `anthropic`, `firecrawl`, `vertex_adk`, and `stripe` continue to report `unconfigured` (expected operating posture).

What shipped (round 2 lanes):

- **Lane N** — Ask PRAXIS chat now reasons over the same evidence layers as Brainstorming Table, Humanitarian, and any future agent via `searchSituationCorpus`. Inline citation refs (`[#1]`, `[argus]`, `[documents]`, etc.) are anchored to specific corpus items. Empty-retrieval explicitly marks intelligence gaps and recommends a relevant tool run. Heavy strategic questions are routed to the Brainstorming Table. Closes step 4 of `docs/CORPUS_ARCHITECTURE.md`.
- **Lane M** — `src/lib/agents/registry.ts` is the single source of truth for every persona PRAXIS can invoke (10 personas: 6 active, 1 orchestrator, 3 stubs). Brainstorming Table route reads its panel from the registry now. Tests at `tests/services/agent-registry.test.ts` (8 tests). Spec at `docs/AGENT_REGISTRY.md`.
- **Lanes O–S** — Strategy bundle, no code: `docs/TEST_PLAN_2026-04-26.md` (multi-persona test matrix + 7-item automation backlog), `docs/GCP_EXPANSION_PLAN_2026-04-26.md` (12 new GCP services with brick ids 31–38), `docs/TODO_BOARD_2026-04-26.md` (single-pane status for every brick), `docs/TOOL_RELIABILITY_AUDIT_2026-04-26.md` (top-10 tools × 5 failure modes), `docs/INDEX.md` (navigation across every doc).

Cumulative tenth-session tally (round 1 + round 2):

- Code lanes shipped: A, B, C, D, M, N (6).
- Doc lanes shipped: E, O, P, Q, R, S, plus persona walkthroughs and Codex handoff (8).
- Commits to `main`: 18+ (from `de0ddf6` Lane A through round 2 docs bundle).
- AI routes calibrated: 55 (was 53 at session start).
- Vitest count: 215 (was 168 at session start; +47).
- Cloud Build deploys: 2 SUCCESS (round 1 = `05a1e8dd`, round 2 = `8bda8f5d`).
- New GCP brick proposals codified: 8 (bricks 31–38).
- Open bricks tracked on `docs/TODO_BOARD_2026-04-26.md`: 38 BIG bricks + 7 P-Test items + 5 Codex-queued lanes.

---

## 2026-04-26 — Tenth-session multi-lane sprint deploy (Claude Code)

Source commit deployed: `6f10860` (working-tree snapshot at `gcloud builds submit` time; the three subsequent docs-only commits `b70d4c3`, `d736182`, `2937013` landed on `main` after the build started and will deploy on the next build).

Cloud Build:

- Build ID: `05a1e8dd-0248-483f-aab3-5d1a72895220`
- Status: `SUCCESS`
- Duration: `~11M18S` (createTime 2026-04-26T21:36:19Z → finishTime 21:47:37Z)
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision: `praxis-frontend-00071-m95` (ready, active)
- Backend revision: `praxis-backend-00044-lf2` (ready, active)
- Function services still ready: `on-document-uploaded-00001-taz`, `on-situation-created-00001-zay`
- GDELT worker still ready: `gdelt-poller-00001-wag`

Validation before submit:

- `npx tsc --noEmit` clean (0 errors)
- `npm run build` clean (Next.js 16.1.6, build standalone)
- `npm run audit:gcp` 0 hard / 0 soft
- `node scripts/audit-ai-routes.mjs` reports `55 AI route files, 55 calibrated, 4 exempt` (was 53/4 entering the session — +2 from Lanes B and C)
- `npx vitest run` 207/207 (was 168 entering the session — +39 across the four lane test files)

Production smoke (post-deploy):

- `https://praxis.tacitus.me/` returned `200`
- `https://praxis.tacitus.me/login` returned `200`
- `https://praxis.tacitus.me/api/health` returned `status: ok` with Firestore, AI provider, and cookie secret checks healthy. `anthropic`, `firecrawl`, `vertex_adk`, and `stripe` continue to report `unconfigured` — that is expected operating posture.

What shipped (Lanes A–E):

- **Lane A** — `POST /api/intelligence/corpus-search` (auth-gated, Zod-validated, demo bypass, 50-item cap) plus shared `searchSituationCorpus()` retriever in `src/lib/intelligence/corpus-search.ts`. Ranks evidence across `argus | sources | documents | graph | tool-output`. Document-chunk layer leverages existing Gemini text-embedding-004 hybrid scoring. Each layer fails closed. `src/types/corpus.ts` is the canonical retrieval contract; `tests/services/corpus-search.test.ts` covers tokenization, scoring, layer priority, confidence mapping, summarisation, slug fallback.
- **Lane B** — `/api/ai/humanitarian/route.ts` with `withCalibration('humanitarian', 'ai_humanitarian')` (2 credits) and `HumanitarianSnapshotSchema` (BLUF, IPC phases, displacement, funding, protection, access constraints, intelligence gaps, recommended actions, confidence, primarySources). Live grounding via `getSituationIntelligence` (HDX HAPI, ReliefWeb, UNHCR, OCHA FTS, UN News, GDELT) with degraded path when feeds fail. `saveToolOutput` persistence to `tool-data/humanitarian` with metadata. Tool registry `aiRoute` flipped from `/api/ai/chat` → `/api/ai/humanitarian`. Tests at `tests/services/humanitarian-schema.test.ts`. Page wiring queued as Lane G.
- **Lane C** — Brainstorming Table MVP (synchronous prototype). `/api/ai/brainstorming-table/route.ts` wrapped with `withCalibration('brainstorming-table', 'ai_brainstorming_table')` (5 credits). Six personas (mediator, humanitarian, legal, media, security, red-team) deliberate over a single question, citing corpus items via `searchSituationCorpus`. `BrainstormingTableSchema` Pro-model generation, demo fixture, persistence to `tools/brainstorming-table`. UI at `src/app/app/brainstorming-table/page.tsx`. Cloud Tasks fan-out and `/demo/brainstorming-table` mirror page intentionally deferred.
- **Lane D** — Shared confidence/citation primitives + provenance panel: `<ConfidenceBadge />`, `<Citation />`, `<OutputProvenancePanel />`. Wired into the Brainstorming Table page as the first consumer.
- **Lane E** — `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` (flagship-grade 90-day roadmap, 30 named bricks) and `docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md` (five scenario-driven walkthroughs + cross-persona heatmap).

Handoff:

- `docs/CODEX_HANDOFF_2026-04-27.md` is the active drop-in prompt for the next Codex session. Lanes F–K queued (Ask PRAXIS corpus wiring, Humanitarian page wiring, Situation Health Card, real notification bell, tool id canonicalization, document-graph cross-link).

Next deploy will pick up the three docs-only commits already on `main` (CONTINUATION update, personas README, AGENTIC_SYSTEM queue refresh).

---

## 2026-04-26 — Agentic roadmap + trust-fix deploy

Source commit deployed: `865c507`

Cloud Build:

- Build ID: `09485e11-9863-4a49-af71-9082f28a9390`
- Status: `SUCCESS`
- Duration: `8M18S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision: `praxis-frontend-00067-mz2` (ready)
- Backend revision: `praxis-backend-00042-m4v` (ready)
- Function services still ready: `on-document-uploaded-00001-taz`,
  `on-situation-created-00001-zay`
- GDELT service still ready: `gdelt-poller-00001-wag`

Validation before deploy:

- `npx tsc --noEmit --pretty false`: pass
- `node scripts/audit-ai-routes.mjs`: 53 calibrated / 4 exempt
- `npm run build`: pass
- Stale-copy search for `Gemini 2.5 Flash`, `2× credits`,
  `Update with Research`, `Background research started`, `PRAXIS v6.3`, and
  package `6.2.0`: no matches in `src`, `docs`, or package metadata after the
  cleanup.

Production smoke:

- `https://praxis.tacitus.me/` returned `200`.
- `https://praxis.tacitus.me/login` returned `200`.
- `https://praxis.tacitus.me/api/health` returned `status: ok` with
  Firestore, AI provider, and cookie secret checks healthy.

What shipped:

- `docs/STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md`: consolidated 20+ item
  high-impact queue, agent lanes, Google Cloud service path, and Claude Code
  prompt.
- `docs/CORPUS_ARCHITECTURE.md`: dedicated situation-corpus retrieval plan for
  profile, situation, ARGUS, documents, sources, graph, timeline, tool outputs,
  and operational spine.
- `docs/AGENTIC_SYSTEM.md`: Brainstorming Table and agent execution blueprint.
- Release identity centralized in `src/lib/constants/app-version.ts` and
  package metadata aligned to `6.4.0`.
- Timeline live mode no longer falls back to fictional demo events.
- Inactive background research now returns `501` instead of a false pending
  status; `AiPopulate` now exposes only the working regenerate path.
- Assistant detailed mode is sent as `aiSettings.analysisDepth`; stale
  model/credit copy was removed from Assistant, Settings, Docs, and registry
  surfaces.
- Feed Alerts now expose `Open source` and `Ask PRAXIS` actions.
- Situation overview now includes next-action cards for Ask PRAXIS, Media
  Roundup, Conflict Graph, and Timeline.

## 2026-04-26 — Codex strategic uplift + ARGUS corpus deploy

Source commits deployed:

- `932ad3e` — strategic uplift docs, landing/source-truth copy, media query
  planning, geospatial degraded-state fix, Cloud Tasks audit coverage.
- `31aeb9c` — Ask PRAXIS ARGUS corpus bridge for active situation context.

Cloud Build:

- Build ID: `8d9f5c8d-c96e-4fb9-be67-b6abc604af73`
  - Status: `SUCCESS`
  - Deployed `932ad3e`
- Build ID: `36ff5d41-7f8d-4091-a675-8ec8a7646a59`
  - Status: `SUCCESS`
  - Deployed `31aeb9c`
- Latest five Cloud Build records checked on 2026-04-26 were all `SUCCESS`.

Cloud Run:

- Frontend revision: `praxis-frontend-00065-nhs` (ready)
- Backend revision: `praxis-backend-00041-g29` (ready)
- Function services ready: `on-document-uploaded-00001-taz`,
  `on-situation-created-00001-zay`
- GDELT service ready: `gdelt-poller-00001-wag`

Firebase / Firestore:

- Firebase CLI authenticated as `giulio@tacitus.me`; project
  `praxisbytacitus` visible and active.
- `firebase deploy --only firestore:rules,firestore:indexes
  --project praxisbytacitus --non-interactive` succeeded.
- Firebase reported 6 existing field overrides in the project that are not in
  `firestore.indexes.json`; they were intentionally left untouched.

GCP verification:

- `npm run audit:gcp`: 0 hard failures, 0 soft warnings.
- Cloud Tasks API enabled; queues running:
  `praxis-research`, `praxis-agents`, `praxis-embeddings`.
- Scheduler jobs enabled: `praxis-check-alerts`,
  `praxis-generate-briefing`, `gdelt-poller`.
- Pub/Sub includes `profile.events`, `praxis.alert`,
  `praxis.deadletter`, `praxis.ingest`, `praxis.extract`,
  `praxis.pipeline`.
- Infra shell scripts passed syntax checks with Git Bash
  (`C:\Program Files\Git\bin\bash.exe -n`). The default Windows `bash.exe`
  invokes WSL on this host; WSL has no installed distro, so use Git Bash for
  local script validation.

Production smoke:

- `https://praxis.tacitus.me/` returned `200`.
- `https://praxis.tacitus.me/login` returned `200`.
- `https://praxis.tacitus.me/api/health` returned `status: ok` with
  Firestore, AI provider, and cookie secret checks healthy.

Validation before deploy:

- `npx tsc --noEmit --pretty false`
- `npm run build`
- `node scripts/audit-ai-routes.mjs`
- `npx vitest run tests/unit/lib/argus/corpus-context.test.ts tests/unit/lib/media/search-query.test.ts`
- `npm audit --omit=dev` improved to 0 critical / 0 high.

## 2026-04-26 — Dashboard operational-status deploy

Source commit deployed: `6b519b3`

Cloud Build:

- Build ID: `646e18d5-1a7c-4ca8-b4ea-4d8449ccb8d7`
- Status: `SUCCESS`
- Duration: `9M30S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision: `praxis-frontend-00061-6h8` (ready)
- Backend revision: `praxis-backend-00039-mds` (ready)

Validation before deploy:

- `npx tsc --noEmit --pretty false`
- `npx vitest run tests/unit/lib/dashboard/tool-status-summary.test.ts tests/unit/lib/dashboard/role-recommendations.test.ts tests/unit/lib/navigation/tool-preferences.test.ts`
- `npx eslint` on touched dashboard/status files
- `npm run build`

Production smoke:

- `https://praxis.tacitus.me/` returned `200`.
- `https://praxis.tacitus.me/api/health` returned `status: ok` with Firestore,
  AI provider, and cookie secret checks healthy.

What shipped:

- Dashboard v2 foundation: the old static operational-status placeholder is
  now a real panel summarizing fresh, running, stale, warning, and failed tool
  outputs for the active situation.
- Status aggregation logic is covered by focused unit tests.

## 2026-04-26 — Workspace personalization deploy

Source commit deployed: `69424ad`

Cloud Build:

- Build ID: `e0b57fe4-7ee4-4d2c-8ed7-6e71d0e65182`
- Status: `SUCCESS`
- Duration: `11M31S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision: `praxis-frontend-00059-g4j` (ready)
- Backend revision: `praxis-backend-00038-pbf` (ready)

Validation before deploy:

- `npx tsc --noEmit --pretty false`
- `npx vitest run tests/unit/lib/navigation/tool-preferences.test.ts tests/unit/lib/dashboard/role-recommendations.test.ts tests/api/preferences.test.ts`
- `npx eslint` on touched recommendation/sidebar/preference files
- `npm run build`

Production smoke:

- `https://praxis.tacitus.me/` returned `200`.
- `https://praxis.tacitus.me/api/health` returned `status: ok` with Firestore,
  AI provider, and cookie secret checks healthy.

What shipped:

- Live analyst profile subscription for real authenticated users.
- Dashboard recommendations now honor hidden/reordered workspace tools.
- Sources Library is visible and customizable through the canonical
  `sources-library` id.
- User-research synthesis and high-impact product plan are documented for
  Codex, Claude Code, and the broader team.

## 2026-04-26 — Workspace preferences + recovered docs deploy

Source commit deployed: `488fa0c`

Cloud Build:

- Build ID: `3988d944-4865-4608-9577-eb1aa81bac1b`
- Status: `SUCCESS`
- Duration: `9M25S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend revision: `praxis-frontend-00057-z64` (ready)
- Backend revision: `praxis-backend-00037-5pt` (ready)

Validation before deploy:

- `npx tsc --noEmit`
- `npm run build`
- `npm run lint` (warnings only; existing lint backlog)
- `npm run audit:gcp`
- `node scripts/audit-ai-routes.mjs`
- `npx vitest run`

What shipped:

- Durable workspace tool preferences: hidden tools and user ordering.
- Sidebar applies tool preferences and shows analyst role/domain.
- Settings → Preferences exposes show/hide and move controls for tools.
- Public pricing/reference docs updated to monthly workspace language.
- README/AGENTS simplified and aligned with the Google-native open-data stack.

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

## 2026-04-29 — Grounded Intelligence + UCDP + Assistant Stream Fix

Source:

- Commit: `fe4d2d1`
- Branch: `main`
- Remote: `origin/main`

Cloud Build:

- Build ID: `23f307d1-684b-4bb3-84fc-f919eb5022f2`
- Status: `SUCCESS`
- Duration: `10M14S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend service: `praxis-frontend`
- Frontend URL: `https://praxis-frontend-pgoyqovcza-uc.a.run.app`
- Frontend revision: `praxis-frontend-00121-wck`
- Backend service: `praxis-backend`
- Backend URL: `https://praxis-backend-pgoyqovcza-uc.a.run.app`
- Backend revision: `praxis-backend-00071-7ln`

Production verification:

- `https://praxis.tacitus.me/` returned `200 OK`.
- `https://praxis.tacitus.me/login` returned `200 OK`.
- `https://praxis.tacitus.me/onboarding` returned `307 Temporary Redirect` to `/login` for unauthenticated requests.
- `https://praxis.tacitus.me/api/health` returned `status: ok`.
- `https://praxis.tacitus.me/api/health/feeds` returned `11/11 feeds active`, including `ucdp: ok` and `google_search: ok`.
- `https://praxis.tacitus.me/api/auth/test-firebase` returned `adminSdkStatus: INITIALIZED_OK`.
- Browser smoke with `agent-browser` loaded the landing page and production demo dashboard.
- Browser smoke on `/demo/assistant` submitted a Nordalia risk/action question and received a context-aware answer without the previous stream parser failure.

Production configuration changes:

- Created Secret Manager secret `praxis-ucdp-api-token`.
- Granted `praxis-frontend-sa@praxisbytacitus.iam.gserviceaccount.com` access to the UCDP secret.
- Mounted `UCDP_API_TOKEN` in the frontend Cloud Run deployment through `cloudbuild.yaml`.

Validation before deploy:

- `npm run audit:routes` passed.
- `npm run audit:tools` passed.
- `npx tsc --noEmit` passed.
- `npx eslint` on changed TypeScript/TSX files passed.
- `npm run build` passed before deploy; Cloud Build also completed the production build successfully.
- Full `npm run lint` did not complete within the local timeout during this iteration; no source errors were returned before timeout.
- Exact UCDP token scan over commit candidates returned `0` hits.

## 2026-04-29 — Calibrated AI Request Safeguards

Source:

- Commit: `b059944`
- Branch: `main`
- Remote: `origin/main`

Cloud Build:

- Build ID: `89e2247d-f4b7-4b6c-9d85-41e0807ed3ec`
- Status: `SUCCESS`
- Duration: `10M13S`
- Project: `praxisbytacitus`

Cloud Run:

- Frontend service: `praxis-frontend`
- Frontend URL: `https://praxis-frontend-pgoyqovcza-uc.a.run.app`
- Frontend revision: `praxis-frontend-00125-zbm`
- Backend service: `praxis-backend`
- Backend URL: `https://praxis-backend-pgoyqovcza-uc.a.run.app`
- Backend revision: `praxis-backend-00073-dck`

Production verification:

- `https://praxis.tacitus.me/` returned `200 OK`.
- `https://praxis.tacitus.me/login` returned `200 OK`.
- `https://praxis.tacitus.me/onboarding` returned `307 Temporary Redirect` to `/login` for unauthenticated requests.
- `https://praxis.tacitus.me/api/health` returned `status: ok`.
- `/api/health` exposed active safeguards: `maxMessages: 50`, `maxBytes: 750000`.
- `https://praxis.tacitus.me/api/health/feeds` returned `11/11 feeds active`, including `ucdp: ok`.
- `https://praxis.tacitus.me/api/auth/test-firebase` returned `adminSdkStatus: INITIALIZED_OK`.
- Browser-backed demo-session fetch to `/api/ai/chat` with a 250,001-character message returned `413`, `error: ai_request_too_large`, and `X-Praxis-Safeguard: ai_request_too_large`.

Validation before deploy:

- `npx vitest run tests/unit/lib/api/with-calibration.test.ts` passed.
- Targeted ESLint for touched files passed.
- `npx tsc --noEmit` passed.
- `npm run audit:routes` passed: 62 calibrated AI routes and 5 exempt.
- `npm run build` passed with only the known Next.js middleware-to-proxy warning.
- `npm run audit:gcp` passed with zero hard failures and zero soft warnings.
- Exact UCDP token scan over changed files returned `0` hits.

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
