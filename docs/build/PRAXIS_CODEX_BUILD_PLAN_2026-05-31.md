# PRAXIS Codex Build Plan - 2026-05-31

Repo: `sargonxg/A4_PRAXIS_CLOUD_Work`
Live surface: `https://praxis.tacitus.me`

This repo-local copy records the sequential Codex build track for the five-session PRAXIS push.

## Session Status

| Session | Focus | Status |
|---|---|---|
| 1 | Capsule Studio and living graph | Complete locally on `feature/capsule-studio-living-graph` |
| 2 | Live agents and proof rail | Complete locally on `feature/live-agents-proof-rail` |
| 3 | Approvals and real multi-agent orchestration | Complete locally on `feature/human-approvals-multi-agent` |
| 4 | Boardroom depth | Complete locally on `feature/boardroom-live-history-personas` |
| 5 | Public surface, billing, and ship proof | Implemented locally on `feature/public-billing-golden-proof`; authenticated runtime proof blocked by missing test credentials/ADC in this shell |

## Prompt 1 Completion Notes

- Replaced the static 14-node SVG capsule graph with a lazy-loaded `react-force-graph-2d` Capsule Studio graph.
- Removed view-model graph truncation so the workbench emits the full source, document, claim, memory, output, agent, ontology, and review graph.
- Added node click detail, edge hover detail, search-to-focus, zoom-to-fit, right-click proposal entry, review-state shape encoding, ACO entity colors, and level-of-detail clustering above 150 nodes.
- Added review-gated graph proposal APIs:
  - `POST /api/context/capsules/[capsuleId]/graph/nodes`
  - `POST /api/context/capsules/[capsuleId]/graph/edges`
- Added graph proposal service helpers that create review cards and reuse `applyCapsuleReviewCard` for approval/version bumps.
- Added Studio overview rails for sources/freshness, claim ledger, tools, outputs, memory/tacit knowledge, trust/readiness, and history/diff.
- Added Firestore starter loader and idempotent seed script for `config/capsule_starters` plus `config/capsule_starters_history`.
- Added focused unit contracts and a skipped-unless-auth Playwright spec for create -> graph -> propose -> approve.

## Validation Output

```text
npx tsc --noEmit
PASS

npm run build
PASS - Next.js production build compiled and generated 167 static pages.
Note: existing Firebase Admin credential warnings appeared during static generation; they did not fail the build.

npm run lint
PASS

npx vitest run
PASS - 282 files, 1204 tests.

npm run audit:capsule-v3
PASS - audit:capsule-v3 OK

npm run audit:capsule-context-capture
PASS - audit:capsule-context-capture OK (205 starters, avg prompt 9441 chars)

npm run audit:capsule-graphlite-projections
PASS - audit:capsule-graphlite-projections OK; Starters: 205; Named graphs: 205

npm run check:landing-bundle
PASS - Landing route JS: 58.3 KB gzip across 4 chunks.

npm run check:authenticated-app-bundle
PASS - Authenticated app route assets: 760.9 KB gzip across 22 chunks.
```

## Handoff For Session 2

1. Reuse the Capsule Studio graph proposal routes instead of adding new graph mutation paths.
2. Use review cards as the proof rail for graph/capsule changes; approvals already bump capsule versions.
3. `buildCapsuleWorkbenchViewModel` now emits full graph metadata with entity type, provenance, confidence, source receipts, and relationship type.
4. Starters now have Firestore loader/seed plumbing, but broader runtime adoption should continue by moving remaining catalog reads behind server/API loaders.
5. Keep Session 2 work inside the existing Ask/cockpit surfaces and wire live agent proof into the same review/proposal language.

## Prompt 2 Completion Notes

- Reworked Research Memo Agent execution into explicit plan -> live retrieval -> evidence pack -> sourceability verification -> memo draft -> self-critique -> artifact finalize phases.
- Live retrieval uses the existing grounded research path when a server AI/search provider is configured, with dependency-injected search/model seams for tests and future supervisors.
- Sourceability verification now attaches live source receipt ids to checked claims, persists claim checks/unsupported claims on memo drafts, and emits proof-rail events.
- Capsule Factory proposals now become review cards for source gaps, claim ledger updates, and agent instruction/memory posture changes; canonical mutation remains review-card-only.
- The Ask proof rail streams the new runtime event names and shows compact tool risk, receipt counts, unsupported-claim counts, and artifact links.
- Exporting `policy-memo` or `board-executive-pack` DOCX output is blocked with `409` while unsupported claims remain.
- Runtime degradation copy now says `Agent runtime unavailable - answered directly` instead of implying durable work succeeded.
- Memo side artifacts surface paragraph-level weak-source highlights from preserved unsupported claims.

## Prompt 2 Validation Output

```text
npx tsc --noEmit
PASS

npm run build
PASS - Next.js production build compiled and generated 167 static pages.
Note: existing Firebase Admin credential warnings appeared during static generation; they did not fail the build.

npm run lint
PASS

npx vitest run
PASS - 283 files, 1210 tests.

node scripts/audit-ai-routes.mjs
PASS - OK - 61 AI route files, 61 calibrated, 10 exempt (static-marker).

npm run audit:agent-runtime-proof
PASS - audit:agent-runtime-proof OK.
Warnings in this local shell: missing AgentRun database URL, worker base URL/auth, Genkit live model config, and ADK Agent Engine config.

npm run audit:agent-process-contract
PASS - audit:agent-process-contract OK

npm run audit:agentic-search-proof
PASS - audit:agentic-search-proof OK

npm run eval:agentic-research
PASS - 10/10 scenarios beat the prompt-only baseline.

graphify update .
PASS - graph.json and GRAPH_REPORT.md updated; HTML viz skipped because the graph has 6869 nodes.
```

## Handoff For Session 3

1. Hook approval pauses into `evaluateAgentOperatingContract` and the `agent.contract.stop_condition` event in `src/lib/agent-runtime/worker.ts`.
2. Use the `approvalSeam` metadata emitted by `research.plan_created` and `capsuleFactoryReviewCards` as the supervisor pause/resume markers.
3. Promote capsule changes through review cards created by `runCapsuleFactoryDraft`; do not add direct canonical mutation paths.
4. Reuse `collectSearchEvidenceForRun`, `verifySourceabilityLedgerWithLiveSearch`, and `draftAndCritiqueMemo` as the single-agent worker primitives under the multi-agent supervisor.
5. Preserve the proof rail event schema in `useOrchestratorEvents.ts` and add orchestration events rather than creating a new cockpit surface.

## Prompt 3 Completion Notes

- Added durable approval gates in `src/lib/agent-runtime/worker.ts` with stable approval/tool-call ids, persisted `agent_approvals` rows, explicit `waiting_approval` transitions, resume-on-approved behavior, and reject-to-failed behavior.
- `agentOperatingContract.approvalThreshold` / `approvalRiskThreshold` now controls approval risk thresholds; default runtime behavior approval-gates medium/high risk, while capsule policy can raise/lower or disable the threshold.
- Added a bounded `multi_agent_review` supervisor path: research agent -> drafting agent -> red-team agent -> revise agent, with downstream consumption recorded in `praxis.supervisor.*` proof events and final memo blocks.
- Extended the compact Ask proof rail to show pending approval cards, Approve/Reject actions, and multi-agent graph facts (`agent`, `consumes`, `produces`) without adding a new top-level surface.
- Added `tests/e2e/agentic-approval.spec.ts` for the approval pause/resume/multi-agent rail flow; it skips in shells without `TEST_FIREBASE_EMAIL` / `TEST_FIREBASE_PASSWORD`.

## Prompt 3 Validation Output

```text
npx tsc --noEmit
PASS

npm run build
PASS - Next.js production build compiled and generated 167 static pages.
Note: existing Firebase Admin credential warnings appeared during static generation; they did not fail the build.

npm run lint
PASS

npx vitest run
PASS - 283 files, 1214 tests.

npm run audit:agent-runtime-proof
PASS - audit:agent-runtime-proof OK.
Warnings in this local shell: Agent ledger env missing, worker base URL missing, worker auth env missing, Genkit live model env missing, ADK Agent Engine unconfigured.

npm run audit:agent-process-contract
PASS - audit:agent-process-contract OK.

node scripts/audit-ai-routes.mjs
PASS - OK - 61 AI route files, 61 calibrated, 10 exempt (static-marker).

npx playwright test tests/e2e/agentic-approval.spec.ts
SKIPPED - TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set in this shell.
```

## Handoff For Session 4

1. Reuse the `multi-agent-supervisor` execution mode and `praxis.supervisor.agent.*` proof events for Boardroom deliberation depth instead of creating a separate Boardroom runtime rail.
2. Boardroom persona/participant passes should follow the same durable consumption contract: each participant event should name `agentId`, `consumes`, `produces`, evidence refs, and confidence.
3. The approval seam to reuse is `pauseForApprovalGate` in `worker.ts`; Boardroom high/medium-risk synthesis/export should pause with persisted `agent_approvals` rows before external or executive-pack finalization.
4. The compact cockpit rail already renders `agent`, `consumes`, and `produces` facts; Session 4 can add Boardroom-specific event names to `useOrchestratorEvents.ts` without a new page.
5. Keep Boardroom outputs sourceability-compatible by preserving `sourceabilityLedgerSummary`, `redTeamFindings`-style critique artifacts, and final `outputHref` metadata on the AgentRun.

## Prompt 4 Completion Notes

- Added live Boardroom turn callbacks to `runLiveBoardroomDiscussion`; the worker now mirrors `boardroom.turn.{participantId}` events as each persona finishes instead of replaying the transcript only after all turns complete.
- Added synthesis streaming via `boardroom.synthesis_created`, while preserving the final memo, OutputCapsule, tool-call, and AgentRun artifact ledger.
- Boardroom turn and synthesis events now carry compact `agent`, `consumes`, and `produces` facts for the cockpit proof rail.
- Added strict evidence-ref handling: invalid persona evidence refs are rejected, recorded on the turn as `unsupportedEvidenceRefs`, marked `unsupported` with low confidence when no valid evidence remains, and mirrored as `boardroom.evidence_ref_rejected` eval signals.
- Added `GET /api/boardroom/history` backed by a ledger query for this user's Boardroom AgentRuns, plus a workspace history panel that can reopen past board packs.
- Moved Boardroom participants to a registry-backed client-safe module and removed the hardcoded workspace roster; retired `src/lib/constants/advisor-configs.ts` by deriving fallback advisor runtime configs from `src/lib/agents/registry.ts`.
- Kept `brainstorming-table` as the synchronous Boardroom Lite path sharing the registry/schema language rather than a separate persona source.
- Added focused steering in the workspace so a user can spawn a one-round follow-up from the active synthesis without mutating the capsule.

## Prompt 4 Validation Output

```text
npx tsc --noEmit
PASS

npm run build
PASS - Next.js production build compiled and generated 167 static pages.
Note: existing Firebase Admin credential warnings appeared during static generation; they did not fail the build.

npm run lint
PASS

npx vitest run
PASS - 284 files, 1218 tests.

npx playwright test tests/e2e/boardroom.spec.ts
SKIPPED - TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set in this shell.

Local browser smoke
LIMITED - next start on localhost:3005 served the app shell, but unauthenticated localhost redirected to the PRAXIS home surface and Firebase Installations blocked localhost referer with 403, so the authenticated Boardroom workspace was not visually exercised in this shell.
```

## Handoff For Session 5

1. Reuse `src/lib/boardroom/participants.ts` as the Boardroom roster source; do not reintroduce `advisor-configs.ts` or hardcoded persona arrays.
2. Boardroom proof now streams `boardroom.turn.*`, `boardroom.evidence_ref_rejected`, `boardroom.synthesis_created`, and `boardroom.artifact_created`; public/billing proof can link to these run events.
3. History is available at `GET /api/boardroom/history` and returns `outputHref`, `memoId`, and `outputCapsuleId` for reopening board packs.
4. Strict evidence rejection is intentional: if Session 5 surfaces public examples, show unsupported turns honestly rather than substituting nearby receipts.
5. Boardroom still reads capsules immutably; public/billing work should preserve the output-only path through memo + OutputCapsule + AgentRun metadata.

## Prompt 5 Completion Notes

- Rebuilt the public and signed-in entry language around three concrete policy missions: Sanctions impact memo, Treaty analysis with citations, and Stakeholder & ACH for a crisis.
- Public hero and signed-in launchpad prompts now hand off to Capsule Builder through `capsulePrompt`, with the builder pre-filling the job, sample questions, domain, and tags.
- Practitioner and Team pricing CTAs now call `/api/billing/checkout` for authenticated users and preserve signup-to-checkout intent for signed-out users; Institution remains contact-only.
- Billing routes return an explicit billing mode, Settings exposes Manage billing through `/api/billing/portal`, and subscription webhook patches now set a plan credit allowance.
- Learn, pricing trust copy, legal pages, release notes, and the Civic Atelier design contract now state the current beta posture, US infrastructure posture, Polar sub-processor posture, and premium-web limits.
- The authenticated golden path is wired into CI when `TEST_FIREBASE_EMAIL` and `TEST_FIREBASE_PASSWORD` secrets are present; local execution is blocked by missing disposable Firebase credentials and stale Application Default Credentials.
- Added `scripts/audit-runner.ts` for modular launch/gate/routes/simplification audits and documented the remaining audit/TODO sprawl in `docs/audits/2026-05-31-audit-and-todo-triage.md`.

## Prompt 5 Validation Output

```text
npx tsc --noEmit
PASS

npm run build
PASS - Next.js production build compiled and generated 167 static pages.
Note: existing Firebase Admin credential warnings appeared during static generation; they did not fail the build.

npm run lint
PASS - ESLint completed. Existing Babel deoptimization notes appeared for tasklet-praxis-workbench.tsx and context-capsules.ts.

npx vitest run
PASS - 286 files, 1226 tests.

npm run audit:public-surface
PASS - audit:public-surface OK

npm run audit:design
PASS - audit:design ok (9 files scanned)

npm run verify:design
PASS - local source markers present for EB Garamond, Inter, Civic Atelier, policy missions, billing honesty, and premium web honesty.

npm run audit:launch
PASS - audit-runner launch complete.
Warnings: local shell lacks Firebase Admin credentials and several live agent env vars; GCP audit has 0 hard failures and 1 soft runtime-proof warning.

npm run audit:launch-readiness
PASS - 49 pass, 1 warn, 0 fail.
Warning: live header probe skipped unless PRAXIS_LAUNCH_LIVE_HEADERS=1 is set.

npm run test:mobile
PASS - 2 passed.

npm run smoke:public
PASS - 5 passed.

npm run smoke:golden-path
SKIPPED - 2 skipped because TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD are not set.

npm run test:auth-runtime
BLOCKED before test execution.
Missing TEST_FIREBASE_EMAIL and TEST_FIREBASE_PASSWORD.
Application Default Credentials refresh failed; run gcloud auth application-default login --project=praxisbytacitus.
```

## Session 5 Handoff / Known Gaps

1. Add the disposable Firebase credentials to this shell or CI and refresh ADC, then rerun `npm run test:auth-runtime`.
2. The CI golden-path step is present but intentionally gated on `TEST_FIREBASE_EMAIL` and `TEST_FIREBASE_PASSWORD` secrets.
3. `scripts/audit-runner.ts` consolidates orchestration, but raw leaf audit count remains high for historical reproducibility; retire leaf audits only after docs/tests/runbooks are updated.
4. Polar checkout is wired but public copy still labels sandbox/unconfigured mode honestly based on environment configuration.
5. Local Browser smoke loaded `/` at `http://127.0.0.1:3006/` with the PRAXIS ContextCapsule title and mission-first public surface.
