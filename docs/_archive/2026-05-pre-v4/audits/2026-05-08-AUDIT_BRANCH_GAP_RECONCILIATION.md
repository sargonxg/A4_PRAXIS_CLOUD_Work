# Audit Branch Gap Reconciliation - 2026-05-08

## Scope

Real app checked:

- Repo: `C:\Users\giuli\praxiscodexworking`
- Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
- Branch/commit checked: `main` at `29f0b44116bba06dedf7e3de8e29efb47f09ccd9`
- Worktree status before this note: clean

Sibling audit folders checked:

- `C:\Users\giuli\praxis-audit-ai-stack-and-vertex`
- `C:\Users\giuli\praxis-audit-context-substrate-and-storage`
- `C:\Users\giuli\praxis-audit-landing-page-fitness`
- `C:\Users\giuli\praxis-audit-onboarding-and-personas`
- `C:\Users\giuli\praxis-audit-platform-and-deploy`
- `C:\Users\giuli\praxis-audit-routes-and-user-flows`
- `C:\Users\giuli\praxis-audit-symbolic-firewall`
- `C:\Users\giuli\praxis-audit-tools-and-marketplace`

These folders are sibling checkouts of the same GitHub repo on `audit/*-20260506` branches. They are not separate applications. Each branch has untracked `docs/audits/2026-05-06-*.md` and `.json` outputs from a focused self-audit lane.

## Verification Performed

Local/current-code checks:

```powershell
git -C C:\Users\giuli\praxiscodexworking remote -v
git -C C:\Users\giuli\praxiscodexworking status --short --branch
git -C C:\Users\giuli\praxiscodexworking rev-parse HEAD
npm run audit:landing
npm run audit:legal-pages-present
npm run audit:tool-marketplace
npm run audit:tool-authoring-spike
npm run audit:tool-composition-static
npm run audit:tool-canary-executable
npm run audit:tool-suggestion-eval
npm run audit:tool-skill-conforms
npm run audit:tool-persona-coverage
npm run audit:embedding-dim
npm run audit:firewall-coverage
npm run audit:cost-telemetry
npm run audit:onboarding-gate
npm run audit:observability-coverage
npm run audit:telemetry-coverage
npm run verify:neo4j-sync
npm run audit:kg-drift-runtime
npm run audit:gcp-production-posture
```

Production/cloud spot checks:

```powershell
Invoke-WebRequest https://praxis.tacitus.me/demo/syria-2024 -MaximumRedirection 0
Invoke-WebRequest https://praxis.tacitus.me/waitlist -MaximumRedirection 0
Invoke-WebRequest https://praxis.tacitus.me/legal/privacy -MaximumRedirection 0
Invoke-WebRequest https://praxis.tacitus.me/legal/terms -MaximumRedirection 0
Invoke-WebRequest https://praxis.tacitus.me/legal/security -MaximumRedirection 0
Invoke-WebRequest https://praxis.tacitus.me/legal/data-retention -MaximumRedirection 0
Invoke-WebRequest https://praxis.tacitus.me/login/callback -MaximumRedirection 0
gcloud scheduler jobs list --project=praxisbytacitus --location=us-central1
gcloud sql instances describe praxisbytacitus-instance --project=praxisbytacitus
gcloud run services list --project=praxisbytacitus --region=us-central1
```

## Closed Since The May 6 Audit Branches

| Area | May 6 gap | Current status on `main` |
| --- | --- | --- |
| Public demo route | `/demo/syria-2024` was missing or redirecting to login demo mode. | Closed. `src/app/demo/syria-2024/page.tsx` exists and production returned HTTP 200. |
| Waitlist/legal routes | `/waitlist`, `/login/callback`, and `/legal/*` routes were missing. | Closed. Routes exist under current App Router structure and production returned HTTP 200 for `/waitlist`, `/login/callback`, `/legal/privacy`, `/legal/terms`, `/legal/security`, and `/legal/data-retention`. |
| Landing static posture | Landing was too Syria-heavy and missing static product route checks. | Improved. `npm run audit:landing` and `npm run audit:legal-pages-present` pass. Syria still exists as an example case, not the whole product story. |
| Marketplace size and memo tools | May 6 marketplace audit expected 16 tools and found memo tools missing. | Closed for current target. `npm run audit:tool-marketplace` passes for 57 curated tools, including `cross.memo-create` and `cross.memo-refresh`. |
| Tool authoring spike | `docs/contributing/AUTHORING_A_TOOL.md` was missing. | Functionally closed by audit. `npm run audit:tool-authoring-spike` passes, though the exact doc path from the old audit is no longer the only proof point. |
| Tool canaries and suggestions | Per-tool executable canaries and recommendation evaluation were missing. | Closed at static/foundation level. `audit:tool-canary-executable`, `audit:tool-suggestion-eval`, and `audit:tool-persona-coverage` pass. |
| Embedding dimension drift | Postgres migrations used 1536 while `text-embedding-005` is 768. | Closed for config/static checks. `npm run audit:embedding-dim` passes and reports canonical `text-embedding-005 @ 768d`; live Postgres verification was skipped unless `PRAXIS_LIVE_DB_AUDIT=true`. |
| Review queue presence | Symbolic-firewall audit found no review queue. | Partially closed. `src/lib/workbench/research-ingest-store.ts` stages candidates into `review-queue`, and boardroom synthesis promotion creates graph update proposals. Universal write-path enforcement still needs stronger runtime proof. |
| Neo4j example drift verifier | Prior Neo4j sync was unproven. | Improved. `npm run verify:neo4j-sync` passes in `example-contract` mode for Syria and Nordalia examples with zero drift. This is not the same as live production parity. |
| GCP posture baseline | Storage and platform posture were blocked. | Improved. `npm run audit:gcp-production-posture` reports zero hard failures. Soft warnings remain for upload bucket public-access state being inherited, Terraform state bucket metadata permission denied, and Cloud Armor policy. |
| Audit branch reports | The eight sibling audit branch reports were not incorporated into the real repo. | Closed. Raw May 6 reports are archived under `docs/audits/2026-05-06-audit-branch-archive/`, with this file as the current reconciliation ledger. |

## Still Not Implemented Or Not Evidenced

### P0 - Product/Launch Blockers

| ID | Gap | Current evidence | Required next proof |
| --- | --- | --- | --- |
| P0-1 | Canonical Agent Engine subagents are not live as backend runtimes. | `skills/subagents/{context-preparer,source-augmenter,output-refiner,memo-drafter}` exist, but `backend/agents` has no matching runtime directories for those four canonical subagents. Current backend agents include `deep_research`, `firewall`, `langgraph`, `analyst_persona`, `moderator`, and `red_team_analyst`. | Add backend runtime directories, typed schemas, evals, deploy/rollback entries, and Agent Engine invocation evidence for the canonical subagents. |
| P0-2 | Persona CI green streak is not implemented. | `package.json` has `smoke:personas` and `test:e2e:personas`; `tests/e2e/personas` exists. No `.github/workflows/personas.yml` exists. `docs/audits/persona-green-streak.md` says no v1.2.0 tag until 10 consecutive green runs. | Add the persona GitHub Actions workflow, upload artifacts, and record 10 consecutive green run IDs. |
| P0-3 | 60-second wow flow is still not testable as specified. | `tests/e2e/onboarding/60-second-wow.spec.ts` is absent. Current onboarding E2E tests cover new-user and AI-first case creation, not the exact Welcome -> sample case -> first memo -> DOCX timing contract. | Add the timed E2E flow or explicitly supersede the requirement in the charter. |
| P0-4 | Firestore/Postgres two-phase commit reconciler is not implemented. | Backlog still lists Firestore-to-Postgres two-phase commit reconciler and crash-injection tests as open. No `backend/services/two_phase_reconciler.py` exists. | Implement reconciler, schedule it, add crash-injection tests, and record live/staging parity proof. |
| P0-5 | Production scheduler jobs are paused. | `gcloud scheduler jobs list` shows `praxis-check-alerts`, `praxis-generate-briefing`, and `gdelt-poller` in `PAUSED` state. | Decide whether pause is intentional. Enable or document explicit launch gating. |

### P1 - High-Risk Partial Implementations

| ID | Gap | Current evidence | Required next proof |
| --- | --- | --- | --- |
| P1-1 | Marketplace handlers remain foundation/prompt-contract handlers, not specialist model-backed execution. | `audit:tool-marketplace` passes, but `src/lib/tools/marketplace/handler-contracts.ts` still declares `executionStage: 'prompt-contract'` broadly. | Promote priority tools to `model-backed` handlers with provider calls, fixture evals, and cost/trace evidence. |
| P1-2 | Composition v2 typed parent-output flow is not present. | Static composition audit passes, but `rg parentRunId` finds no `parentRunId` handling in the marketplace run route. | Add parent run IDs, per-chain projection maps, child context merge, and tests proving chained outputs feed the next tool. |
| P1-3 | Per-call cost/token/model telemetry is not end-to-end for AI/subagent calls. | `audit:cost-telemetry` passes for Pack 30 extraction wave, but `src/lib/api/with-calibration.ts` still calls `completeToolRun(toolRunId)` without passing model/token/cost details. | Capture provider usage metadata at model call boundaries and persist it into tool runs/cost ledger rows. |
| P1-4 | Request-to-model trace proof is not archived. | `audit:observability-coverage` and `audit:telemetry-coverage` pass statically. The May 6 branch did not find a full inbound request -> tool run -> Agent Engine -> model trace. | Run an owner-approved canary, propagate trace context, and archive trace IDs plus cost rows. |
| P1-5 | Live Postgres/KG parity remains unproven. | `audit:kg-drift-runtime` skipped because `PRAXIS_LIVE_DB_AUDIT != true`; `audit:embedding-dim` also skipped live Postgres unless connected SQL is enabled. | Run live DB audit with `PRAXIS_LIVE_DB_AUDIT=true` and connected `PG_DATABASE_URL`, then archive output. |
| P1-6 | Cloud SQL is still below the HA/PITR target from the platform audit. | `gcloud sql instances describe praxisbytacitus-instance` returned `ZONAL` and transaction log retention `7`. | Either accept this as launch posture or move to REGIONAL HA and 30-day PITR through an approved cloud change. |
| P1-7 | Canary rollout evidence is missing. | `gcloud run services list` shows major services routing 100 percent to latest revision. No 5-25-100 canary artifact was found. | Add deploy artifact capture or explicit staged traffic split automation before claiming canary compliance. |
| P1-8 | Lighthouse CI/performance proof is missing. | No `lighthouserc.json` exists. Landing/public routes return 200, but LHCI targets are not configured. | Add LHCI config or a replacement performance budget audit and record public demo/landing runs. |
| P1-9 | Empty/loading/error sweep ledger is missing. | Reusable empty-state components exist and `audit:ux-polish` covers selected markers, but no Pack 09-style surface-by-surface ledger exists under `docs/audits`. | Add a surface ledger and extend `audit:ux-polish` to prove key empty/loading/error states. |

### P2 - Audit/Documentation Cleanups

| ID | Gap | Current evidence | Required next proof |
| --- | --- | --- | --- |
| P2-1 | `audit:tool-skill-conforms` is still an alias to presence checks. | `package.json` maps `audit:tool-skill-conforms` to `npm run audit:tool-skills-present`. The audit passes, but it does not independently enforce section order beyond presence. | Strengthen the script to verify canonical section ordering and required semantics. |
| P2-2 | Architecture docs still contain target-state items that can be mistaken for shipped behavior. | Current docs contain target-state references to live subagents, two-phase reconciler, and advanced runtime posture. Some have backlog notes, but not every claim is visibly gated. | Add status badges or "target/not live" callouts where target-state language remains. |

## Bottom Line

The May 6 audit branches were useful and several findings have already been fixed on current `main`: public demo, canonical legal/waitlist routes, marketplace expansion, memo tools, authoring/canary/suggestion audits, embedding config, basic GCP posture, and example Neo4j drift checks.

The real remaining gap is not "missing pages"; it is live operational proof and runtime depth. The app still should not claim fully live canonical subagents, specialist model-backed marketplace execution, full two-phase Firestore/Postgres recovery, persona green-streak readiness, staged canary deployment, or live DB parity until those items are implemented and evidenced.
