# PRAXIS Deployment Log

Use this file to keep daily deployment status visible to Codex, Claude Code, and humans.

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

- `docs/CODEX_HANDOFF_2026-04-26.md` is the drop-in prompt for the next Codex session. Lanes F–K queued (Ask PRAXIS corpus wiring, Humanitarian page wiring, Situation Health Card, real notification bell, tool id canonicalization, document-graph cross-link).

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
