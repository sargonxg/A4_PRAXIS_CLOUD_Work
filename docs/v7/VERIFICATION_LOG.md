# PRAXIS v7 Verification Log

Read-only verification passes append here. Findings are evidence-backed and do
not imply a fix has been approved.

### Pass #1 - 2026-05-08
- Brief deep-checked: `00_VISION_AND_OPERATING_PRINCIPLES.md`
- Flow walked: `Home` target flow, approximated locally by visiting `http://localhost:3020/app/dashboard` because no authenticated test user credentials were available in this session.
- Gate result: **fail**
  - `npx tsc --noEmit`: pass.
  - `npm run lint`: pass with 97 warnings, so not clean against the v7 "green local gate" standard.
  - `npm run build`: pass. Build generated 197 app routes.
  - `npm run audit:gate`: fail at `audit:architecture-reference`.
  - `npx vitest run`: pass, 149 files and 582 tests.
- Skills/subagents invoked:
  - `cross.contradiction-finder`: not executable from a documented CLI path; only `skills/tools/cross.contradiction-finder/SKILL.md` and marketplace metadata were reachable.
  - `cross.devils-advocate`: not executable from a documented CLI path; only `skills/tools/cross.devils-advocate/SKILL.md` and marketplace metadata were reachable.
  - `cross.assumption-mapper`: not executable from a documented CLI path; only `skills/tools/cross.assumption-mapper/SKILL.md` and marketplace metadata were reachable.
  - `red-team-analyst`: not executable from a documented CLI path; only `skills/subagents/red-team-analyst/SKILL.md` and registry references were reachable.

#### NEW findings, severity-ranked

**HIGH - V7-001 - Bootstrap AGENTS replacement breaks the current deploy gate.**
Evidence: `npm run audit:gate` fails at `audit:architecture-reference` because the current `AGENTS.md` on branch `v7/bootstrap-current-state-audit` is missing required architecture markers: `PRAXIS_ARCHITECTURE.md`, `PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`, and `audit:architecture-reference`. Relevant files: `AGENTS.md`, `scripts/audit-architecture-reference.ts`. Issue: https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work/issues/3.

**HIGH - V7-002 - v7 foundations are not implemented yet.**
Evidence: `backend/migrations/versions/` ends at `0018_notifications_feedback_system.py`; there is no `0019_cores_baseline.py` or `0020_cores_linkage.py`. `src/lib/cores/types/` and `backend/services/cores/types/` do not exist. `next.config.ts` has no `NEXT_PUBLIC_PRAXIS_V7`; `backend/config.py` has no `PRAXIS_V7_BACKEND`. `backend/routers/cores.py` and `backend/routers/ask.py` are absent. This disproves the "v7 completed" claim for briefs `00`, `02`, and `03`. Issue: https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work/issues/4.

**HIGH - V7-003 - Six-destination v7 app shell and user flows are not present.**
Evidence: the build route table still exposes the legacy app model (`/app/dashboard`, `/app/workbench`, `/app/tools`, `/app/settings/*`, `/app/syria-case`) and does not expose `/app/home`, `/app/ask`, `/app/sources`, `/app/outputs`, `/app/advanced`, `/app/cores`, or canonical `/app/situations/[id]`. `src/components/app/app-sidebar.tsx` still renders the current Workbench/Dashboard model. The local flow screenshot at `docs/v7/build/SCREENSHOTS/v7-home-flow.png` shows the existing ACO explainer overlay, not v7 Home with an always-focused Ask bar and attached cores strip. Issue: https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work/issues/5.

**HIGH - V7-004 - Production v7 reality checks are blocked or contradictory.**
Evidence: `https://praxis.tacitus.me/` returns 200 and `/api/health` returns 200, but `https://praxis.tacitus.me/api/health/features` returns 404 even though the local build route table includes `/api/health/features`. Cloud Run revision checks failed because `gcloud` requires non-interactive reauthentication. `monitoring/` contains `dashboards/gliner-cost-reduction.json` and `dashboards/cognee.json`, but not `monitoring/v7_dashboard.json`. Issue: https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work/issues/6.

**MEDIUM - V7-005 - v7 operational prompt/index files are not installed in repo paths named by the prompt library.**
Evidence: downloaded `INDEX.md`, `BOOTSTRAP.md`, `VERIFY.md`, and `ADVANCE.md` exist under `C:\Users\giuli\Downloads\`, but `docs/v7/INDEX.md`, `docs/v7/prompts/BOOTSTRAP.md`, `docs/v7/prompts/VERIFY.md`, and `docs/v7/prompts/ADVANCE.md` are missing in the repo. The current repo has earlier v7 docs, but not the full prompt library contract now being used.

**MEDIUM - V7-006 - The skills/subagents requested by the verification prompt are registry artifacts, not directly invocable verification tools.**
Evidence: `skills/tools/cross.contradiction-finder/SKILL.md`, `skills/tools/cross.devils-advocate/SKILL.md`, `skills/tools/cross.assumption-mapper/SKILL.md`, and `skills/subagents/red-team-analyst/SKILL.md` exist, but no documented CLI/dev path was found to invoke them against "briefs vs code" without going through an authenticated app route or marketplace UI.

**MEDIUM - V7-007 - Model-string posture still has visible drift that needs classification before v7.**
Evidence: a static scan found model strings outside the expected matrix paths, including `docs/v7/04_ANALYST_SKILLS_POLICY_PRODUCT_AND_OUTPUTS.md` using illustrative `gemini-pro`, `src/types/advisor.ts` and `src/lib/ai/advisor-model.ts` using advisor tiers such as `gemini-3-pro`, and legacy references to `gemini-2.5-*` in `src/lib/constants/tool-registry.ts`, `backend/.env.example`, and UI copy. Some are documentation/examples or existing audit allowlist cases, but v7 needs a single explicit classification.

**LOW - V7-008 - Dev-server flow verification is noisy because another Next dev server was already running.**
Evidence: `npm run dev -- -p 3017` reported another Next dev server at `http://localhost:3020` with PID 21892. I used the existing dev server for the local flow. This is not a product defect, but it reduces reproducibility of local verification.

#### STILL OPEN findings from previous passes

- None. This is the first entry in `docs/v7/VERIFICATION_LOG.md`.

#### CLOSED findings since last pass

- None. This is the first entry.

#### Things I did NOT check this pass, and why

- I did not sign in as a real production test user. No test-user credentials were available in this session.
- I did not verify Cloud Run revision names. Local `gcloud` credentials require reauthentication and cannot prompt in this execution mode.
- I did not verify live Cloud SQL core table state because v7 migrations are absent locally, and the prior Cloud SQL posture has required a VPC-connected shell.
- I did not run every individual audit past the first failing `audit:gate` step. The gate failed early at `audit:architecture-reference`; later audits remain unproven in this pass.
- I did not fix any issue. This was a read-only verification session by instruction.

#### Process gap I'm proposing to close

Add `audit:v7-readiness` or split `audit:v7-index-current` plus `audit:v7-foundations-present` so the repo fails fast when v7 docs, prompt library, feature flags, core migrations/types, and monitoring dashboard are missing. Issue: https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work/issues/7.
