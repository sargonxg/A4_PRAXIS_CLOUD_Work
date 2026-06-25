# PRAXIS Production Readiness Audit

Date: 2026-06-24 local / 2026-06-25 UTC  
Target: https://praxis.tacitus.me  
Mode: read-only live audit plus this written report  
Throwaway account created in this pass: `praxis-audit+mqsuba67@example-codex-qa.com`  
Prior audit asset account found in the same artifact folder: `praxis-livetest+715c6443@example-codex-qa.com`

## Executive Summary

Verdict: **not ready for broad external sharing with policy/conflict/knowledge-work customers or investors yet.** It is credible as an internal beta or tightly guided demo, but not as a self-serve production product. Score: **64/100, risky beta**.

The public site, live deploy proof, health endpoints, security headers, and signed-in capsule library are materially better than a prototype. The deployed revision matches `main`, `/api/health` and `/api/health/runtime` are green, email/password signup works, onboarding renders, the signed-in app shell loads, a default capsule docks, and `/app/capsules` exposes a large searchable starter capsule repository.

The blocker is trust in the signed-in agentic workflow. In live testing, new-account onboarding repeatedly logged Firestore permission warnings, later auth/cookie sync became unstable in headless runs, and I could not complete a clean end-to-end proof of "capsule attached -> grounded cited answer streams -> grounding verifier coverage -> deeper AgentRun queued -> temporal timeline used." Repo review also found that the help/Guide assistant is not truly server-separated from the real Ask runtime, despite product copy promising that it does not create runs or mutate data. That boundary gap is customer-visible and investor-visible because it cuts directly against PRAXIS's trust story.

Top 10 priorities:

1. **Enforce product-help separation server-side.** Route help/Guide through a non-mutating, no-credit, no-AgentRun endpoint or hard-block `productHelpOnly` from durable writes and queues.
2. **Fix new-user Firestore profile permissions.** The live onboarding page logs `FirebaseError: Missing or insufficient permissions` while using defaults.
3. **Produce a repeatable live golden path.** One script must prove signup/login, onboarding skip/complete, capsule attach, Ask answer, citations, grounding verifier, AgentRun queue, temporal timeline, and help separation.
4. **Persist the actual active context stack into Ask-created AgentRuns.** Current code creates runs with `contextStackId: input.capsule.capsuleId`, losing the docked User/Situation/Tools/Output stack.
5. **Normalize temporal dates before sorting.** Current timeline builder accepts any `Date.parse` string but sorts raw strings lexicographically.
6. **Make runtime health less optimistic.** `/api/health/runtime` reports backend/agent/platform OK from env-style checks; add real dependency probes or label them as configuration checks.
7. **Add production performance budgets.** Lighthouse CI, bundle budgets, route budgets, graph-query fixture, and tool latency budgets are explicitly gated.
8. **Run cloud proof from an authenticated shell.** Cloud Run logs, build history, IAM, Secret Manager, and deployed rules versions were blocked here by local credential filesystem access.
9. **Clean route/copy drift.** `/app/repository` does not render the repository workbench, residual `/app/contexts` links remain, and stale `V6.4` footer text undermines polish.
10. **Prepare investor demo path.** Use one first-run capsule, one question, one answer with citations, one deeper run, one export, one security posture page.

Single biggest blocker to sharing: **the core trust contract is not yet proven live end to end for a fresh signed-in user, and the help agent boundary is not enforced.**

## Evidence Base

### Live and Browser Artifacts

Screenshots and JSON are under `docs/reviews/2026-06-24-live-app-test-assets/`.

| Artifact | Evidence |
|---|---|
| `01-public-home.png`, `phase1-public.json` | Public home returned 200, title `PRAXIS by TACITUS - Sourced Policy Work`, visible capsule dock and Ask-first shell. |
| `02-login.png`, `01-login-signup.png` | Login/signup page rendered cleanly and email/password signup form was available. |
| `02-after-signup.png`, `03-onboarding-returning.png` | Signup completed and redirected to `/onboarding`; onboarding rendered. |
| `20-login-result.png`, `22-app.png` | Signed-in `/app` loaded with shared app chrome, Capsule Dock, default capsule in Situation slot, welcome modal, and help button. |
| `23-capsules.png` | `/app/capsules` rendered starter library, category filters, search input, Attach and Inspect actions. |
| `40-ask-flow.json` | A later scripted Ask run failed back to `login?redirect=/app`, so full Ask proof is explicitly unverified. |
| Frontend QA temp artifacts at `C:\Users\giuli\AppData\Local\Temp\praxis-qa-20260624-214154` | Desktop/mobile pass confirmed public `/` and `/login` had no horizontal overflow, authenticated `/app` showed distinct Ask and help surfaces, `/app/capsules?lane=repository` rendered search on desktop/mobile, but `/app/repository` only showed the first-run welcome panel. |

### Live Health

| URL | Result |
|---|---|
| `/api/health` | 200, `status: ok`; checks included `firestore: ok`, `ai_provider: ok`, `cookie_secret: ok`, `vertex_adk: ok`; optional `cognee_memory`, `graphlite_context`, `trustgraph_context`, `polar` were `unconfigured`. |
| `/api/health/runtime` | 200, `status: ok`; commit `45c03d68dc2b1aa5f0f4e97d3003a3801b2a2f84`, build id `21e950b1-72f4-434f-9511-ed78488025c9`, revision `praxis-frontend-01038-pdb`, service `praxis-frontend`. |
| `/robots.txt` | Allows `/`, disallows `/app/` and `/api/`, links sitemap. |
| `/sitemap.xml` | Lists public, learn, guide, pricing, release notes, changelog, login, and legal routes. Lastmod is still `2026-05-31`. |

PowerShell `Invoke-WebRequest` and `curl.exe` failed locally with Windows TLS/Schannel credential errors before reaching the app. Node fetch and Playwright worked, so those client failures are not counted as app failures.

### Repo and Release State

| Evidence | Status |
|---|---|
| `git status --short --branch` | `main...origin/main`, with a dirty worktree. Dirty local changes are not deployed. |
| `git log -1` | `45c03d68 feat(context): grounded temporal timeline generation for temporal queries`. |
| Live runtime commit | Matches local `HEAD` and local `origin/main` at `45c03d68dc2b1aa5f0f4e97d3003a3801b2a2f84`. |
| `graphify-out/GRAPH_REPORT.md` | Stale: graph built from `c1ff3921`, not current `45c03d68`. Use as orientation only. |
| Cloud CLI | Blocked: `gcloud` could not open `C:\Users\giuli\AppData\Roaming\gcloud\credentials.db`; Firebase CLI could not open configstore. |

## DONE

| Area | Done | Evidence |
|---|---|---|
| Public marketing surface | Public home, pricing, release notes, robots, sitemap, OG/Twitter metadata and legal route set exist. | `phase1-public.json`; `src/app/layout.tsx:42-141`; `src/app/robots.ts:3-13`; `src/app/sitemap.ts:7-59`. |
| Deploy proof | Live runtime endpoint reports deployed `main` commit, build id, revision, service. | `/api/health/runtime`; `src/app/api/health/runtime/route.ts:6-21`. |
| Health endpoint | Firestore/Admin and core AI config health expose status. | `/api/health`; `src/app/api/health/route.ts:5-86`. |
| Security headers | CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy present on live HTML and health routes. | Live root response headers; `src/proxy.ts:287-336`; `src/app/api/health/route.ts:5-12`. |
| Signup | Email/password signup succeeded in production for `praxis-audit+mqsuba67@example-codex-qa.com`. | `02-after-signup.png`; identitytoolkit `accounts:signUp` 200 in script output. |
| Onboarding UI | Onboarding profile flow renders and includes role/seniority/org fields, calibration preview, Finish later affordance. | `02-after-signup.png`, `18c-onboarding-step2.json`. |
| Signed-in app shell | `/app` loads shared chrome, capsule dock, Ask PRAXIS text area, welcome first-run modal, help button. | `22-app.png`; `20-login-result` script text. |
| Capsule repository | `/app/capsules` loads category filters, search input, starter capsule cards, quality/source/graph indicators, Attach/Inspect actions. | `23-capsules.png`. |
| Responsive public shell | Public `/` and `/login` rendered on desktop `1440x960` and mobile `390x844` without horizontal overflow. | Frontend QA artifacts `home__desktop.png`, `login__desktop.png`, `home__mobile.png`, `login__mobile.png`. |
| New-user seed | Fresh signed-in app showed `Default capsule` in the Situation slot and welcome copy with `Try this capsule`. | `22-app.png`. |
| Firestore rules posture | Owner-scoped user/capsule/run rules, server-only API keys, deny-all fallthrough; syntax validates. | Firebase MCP `firebase_get_security_rules`; `firebase_validate_security_rules` OK. |
| AgentRun scaffolding | Docs/code show durable AgentRun spine, idempotent run creation, Cloud Tasks dispatch, proof rails. | `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md:54`; `src/lib/agent-runtime/postgres.ts`; `src/lib/agent-runtime/cloud-tasks.ts`. |

## MISSING

| Severity | Missing | Evidence | Impact |
|---|---|---|---|
| High | Repeatable live Ask golden path for fresh user. | My Ask script could not complete; `40-ask-flow.json` ended at `login?redirect=/app`. | Cannot claim the core customer workflow works end to end. |
| High | Verified grounded cited answer with new grounding verifier coverage. | Not observed live in this audit. | Product trust claim remains unproven. |
| High | Verified deeper AgentRun queued from capsule-attached Ask. | Not observed live; repo code can queue, but browser proof failed. | Investor/customer demo can fail at the central "agentic" moment. |
| High | Verified temporal question builds/uses timeline live. | Code/tests exist, but live Ask temporal turn was not completed. | Current headline temporal feature is only code-level proof. |
| High | Enforced help-agent separation. | Product copy promises no runs/mutations, but help uses `/api/conversations/.../turns`. See `src/app/guide/page.tsx:138-141`, `src/components/app/help-agent.tsx:83-98`, and `src/app/api/conversations/[conversationId]/turns/route.ts:60-154`. | Help can persist, consume allowance, and potentially queue work. |
| Medium | Cloud proof. | `gcloud` and Firebase CLI blocked by local credential filesystem access. | No current Cloud Run logs, IAM, Secret Manager, build history, or deployed rules version proof. |
| Medium | Real performance budgets. | Alignment doc lists `lh:ci`, `audit:bundle-budgets`, `audit:graph-query-perf`, `audit:tool-perf-budgets` as gated. | No reliable Core Web Vitals or latency acceptance bar. |
| Medium | Production billing readiness. | `/api/health` reports `polar: unconfigured`; pricing page says Polar checkout unavailable. | Paid conversion path is not production-ready. |
| Medium | Current full local gate. | Typecheck passed via release-manager agent; build was not rerun to avoid `.next` writes; lint/vitest/audit:gate not rerun in this pass. | Release confidence is partial. |
| Medium | Fresh graphify. | `GRAPH_REPORT.md` built from `c1ff3921` while HEAD is `45c03d68`. | Architecture graph is stale for current changes. |

## BROKEN OR RISKY

| Severity | Issue | Evidence | Fix |
|---|---|---|---|
| High | New-user profile Firestore permission warning. | Browser console repeatedly logged `[auth] Firestore profile load failed (using defaults): FirebaseError: Missing or insufficient permissions.` on `/onboarding` and `/app`. | Fix profile read/create rules or client path; add e2e assertion that no Firestore permission warning appears after signup. |
| High | Help/Guide boundary is policy-only. | Help POSTs to `/api/conversations/${threadId}/turns` with `productHelpOnly`; the conversations route applies monthly allowance and persists conversation before delegating to Ask. | Add a separate `/api/help/chat` or server-enforce `productHelpOnly` no-write/no-credit/no-queue semantics. |
| High | Ask-created AgentRuns can lose actual dock stack. | `createAgentRun` uses `contextStackId: input.capsule.capsuleId` and `selectedCoreIds: input.capsule.coreRefs` at `src/app/api/ai/chat/route.ts:1289-1295`. | Persist `activeContextStack`, applied capsules, and selected roles in AgentRun metadata and read models. |
| Medium | Temporal sorting can misorder mixed valid dates. | `firstDate` returns raw parseable date string, then `compareTimelineItems` sorts `left.date.localeCompare(right.date)` at `src/lib/context/temporal-timeline.ts:302-317`. | Normalize to ISO timestamp plus display label; sort by numeric epoch. |
| Medium | Runtime health overstates agent readiness. | Cloud agent health was green live, but cloud_ops review found runtime health largely env/config based for backend/agent checks. | Distinguish "configured" from "live dependency probed"; add queue/worker round-trip canary. |
| Medium | Auth/cookie sync instability in headless. | One signed-in app run logged `[auth] Cookie sync failed: TypeError: Failed to fetch`; later Ask script fell back to login redirect. | Add auth cookie sync retry/telemetry and a production e2e covering token readiness after signup/login. |
| Medium | `/app/repository` route does not render the repository workbench. | Frontend QA opened signed-in `/app/repository`; URL stayed on that path but the page only showed the first-run welcome panel, not the repository workbench/header. | Redirect `/app/repository` to `/app/capsules?lane=repository` or wire the route to the same repository shell. |
| Medium | Onboarding/protected-route state is inconsistent on mobile. | On `390x844`, after `Finish later`, `/app` bounced back to `/onboarding` while `/app/capsules?lane=repository` stayed accessible in the same session. | Normalize onboarding completion checks across protected routes and assert them in mobile e2e. |
| Medium | Inspect and Graph/Agent-context detail panels were not reliable in automation. | Frontend QA could not get visible `Inspect` CTAs to open `capsule-inspector-sheet`, and `?starter=...&lane=inspect` stayed on repository list view. | Add deterministic selectors, route state tests, and visible error/recovery states for inspect/detail panels. |
| Low | Public reconnaissance endpoint. | `/api/auth/test-firebase` is publicly callable and reveals Firebase/Admin reachability and masked API key prefix. | Gate behind admin/diagnostic secret or remove from production. |
| Low | Public polish drift. | Pricing page text includes `Polar checkout is not configured...`; footer in `phase1-public.json` showed `V6.4` while release notes say `v6.5.0`. | Hide internal checkout config from public pricing; centralize displayed version. |
| Low | Residual old route affordances. | Cleanup plan reports `/app/contexts` href/comment residue in Ask/Memo/cores components. | Rewrite to `/app/capsules` lanes and remove dead contexts affordances. |

## Agentic Workflow Readiness

| Requirement | Result | Notes |
|---|---|---|
| Capsule attached before Ask | Partially verified | `/app` showed `Default capsule` in Situation slot and `1 capsule`; repository has Attach actions. |
| Grounded cited answer streams | Unverified live | Textarea was present in one app run, but a later Ask proof could not keep authenticated state. |
| Grounding/proof surface shows coverage | Unverified live | Repo has grounding verifier/proof code, but live proof was not captured. |
| Deeper request creates/queues AgentRun | Unverified live | Code path exists; no completed live browser proof. |
| Temporal question builds/uses timeline | Code-level only | Tests and route commit exist; live temporal Ask was not captured. |
| Multi-agent roster reachable via triage | Code-level only | Existing tests and docs cover writer/source-checker/diff/media/human-friction style roster, but not live browser proof. |
| Help agent distinct from workflow | UI verified, server failed by code review | Frontend QA saw distinct `praxis-help-agent-panel` and Ask surfaces, but server boundary is not enforced. |

## Capsules and Repository

The capsule surface is one of the stronger parts of the deployed app.

Done:

- `/app/capsules` renders a large starter library by category.
- Search input is present.
- Cards show type/domain/status, source counts, claims, graph stats, quality, Attach, Inspect.
- `/app` has the shared dock with User/Situation/Tools/Output slots.
- Fresh user received a default Situation capsule and first-run "Try this capsule" path.

Remaining risk:

- I did not complete a live attach-click proof that repository Attach docks a selected capsule and changes the next answer.
- `/app/repository` is not equivalent to the visible repository lane and should not be linked as a canonical route until fixed.
- Inspect/Graph detail behavior is not yet reliable enough to treat source/proof panels as production-proven.
- The output includes a very long list of starter cards, which is powerful but dense. For a first-time policy customer, the repository needs a shorter "recommended first three" rail before the full taxonomy.

## Graphics and UX

Strengths:

- The public home now foregrounds the actual work surface instead of a generic landing page.
- Login/onboarding are visually cohesive with the PRAXIS identity.
- The signed-in dock is concrete: slots, default capsule, context details, pending approvals, and clear context.
- Capsule cards carry useful inspection signals: quality, graph, claims, sources.

Problems:

- Onboarding copy is dense and internally framed. It explains prompt injection and calibration well for power users, but it is too much for a first policy/investor demo.
- The app can sit on `Loading PRAXIS...` during auth transitions, with no recovery copy.
- Help and Ask are visually distinct but behaviorally coupled.
- The capsule library is dense enough that the first-run path needs a guided choice, not just a full catalog.
- Pricing exposes unavailable checkout state publicly.

## Tech and Architecture

Strengths:

- Next.js app on Cloud Run with live revision metadata.
- Firebase Auth and Firestore are live enough for signup/session/onboarding surfaces.
- Firestore rules are deny-by-default and owner-scoped.
- Ask, capsules, AgentRun, Cloud Tasks, and proof rails are wired in code.
- Public SEO and legal surfaces exist.

Gaps:

- Architecture alignment doc still lists Postgres/pgvector graph source-of-truth cutover, fully managed ADK/Agent Engine execution, two-phase Firestore/Postgres commits, Identity Platform/magic-link posture, Terraform apply, and canary traffic shift as partial or owner-gated at `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md:111-122`.
- The live health endpoint reports optional memory/graph systems unconfigured.
- Direct Cloud Run/IAM/Secret Manager/log evidence could not be collected here.
- Local graphify is stale relative to HEAD.

## Testing and Gates

Observed:

- Release-manager agent ran and reported `npm run typecheck`, `npm run audit:release-notes`, and `npm run audit:architecture-reference` passing.
- Static pre-ship artifact reports `140 PASS, 2 WARN, 1 BLOCKED` at `docs/audits/LATEST-DEEP_PRESHIP_CHECKLIST.md:5`.
- The blocked static item is `notifications stack includes PraxisAppLaunchpad` at `docs/audits/LATEST-DEEP_PRESHIP_CHECKLIST.md:154`.
- Warnings remain for direct `gpt-` and `gemini-2.` markers at `docs/audits/LATEST-DEEP_PRESHIP_CHECKLIST.md:192-195`.
- E2E files exist for onboarding, authenticated app, Ask/capsule runtime, same-thread AgentRun, capsule studio, runtime health, mobile landing, and timeline display.

Not rerun in this pass:

- `npm run build` because it writes `.next`.
- `npm run lint`.
- `npx vitest run`.
- `npm run audit:gate`.
- Full live authenticated runtime lane.

Missing tests:

- Help/Guide cannot mutate data, consume credits, or queue runs.
- Ask-created AgentRuns persist active context stack and applied capsule chain.
- Temporal timeline mixed date formats sort correctly.
- Worker execute endpoint auth (`verifyAgentWorkerRequest`).
- Fresh production signup has no Firestore permission warning and can complete the full Ask golden path.

## Performance

This audit did not produce true Core Web Vitals. Browser timings from the public JSON are page-load wall times in headless Chromium, not Lighthouse or field data:

| Route | Headless elapsed |
|---|---:|
| `/` | 4803 ms |
| `/login` | 1305 ms |
| `/pricing` | 1516 ms |
| `/release-notes` | 4312 ms |

Known gaps:

- `lh:ci` needs target deployment and budget config.
- `audit:bundle-budgets` needs thresholds.
- `audit:graph-query-perf` needs a 10k-node Postgres fixture.
- `audit:tool-perf-budgets` needs per-tool latency fixtures.

This is not launch-grade performance evidence. Before external sharing, run Lighthouse on `/`, `/login`, `/app`, `/app/capsules`, and one answer-rendering state; add route budgets for JS, CSS, LCP, INP, CLS, and API latency.

## Security and Compliance

Positive:

- HTTPS and HSTS are live.
- CSP is nonce-based with strict-dynamic on the public app response.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and Permissions-Policy are present.
- Firestore rules are owner-scoped for user/capsule/run data and deny API-key docs to clients.
- Health diagnostics/provider endpoints return 401 when unauthenticated.
- Storage rules are reported as owner/type/size limited by cloud_ops review.

Concerns:

- Public HTML exposes `x-powered-by: Next.js`.
- `/api/auth/test-firebase` is public diagnostic surface.
- Help agent can hit mutating/persistent Ask routes.
- Billing is unconfigured.
- Cloud logs/IAM/Secret Manager and deployed rules version were not verified from cloud control plane.
- No current dependency audit summary was produced in this pass.

Investor/customer security review will likely ask for: SOC 2 roadmap, DPA/subprocessor accuracy, data residency stance, tenant isolation proof, prompt-injection handling, AI output audit trail, incident response, logging retention, deletion/export workflows, and signed security posture for Firebase/GCP/Vertex.

## SEO and Sharability

Done:

- Metadata, canonical URL, OG and Twitter image are configured in root layout.
- Robots and sitemap exist and correctly exclude `/app/` and `/api/`.
- Legal pages are in sitemap.
- Release notes are public.

Gaps:

- Sitemap `lastmod` values are stale at `2026-05-31`.
- Pricing page exposes environment state instead of product state.
- Public route copy is better than before, but the first-run investor demo path is not explicit: there should be one "Try this capsule" public-to-signed-in journey with a prepared question and expected outcome.

## Roadmap

### Now: 0 to 7 days

| Item | Impact | Effort |
|---|---:|---:|
| Enforce Help/Guide no-write/no-queue/no-credit server-side. | High | Medium |
| Fix Firestore profile permission warnings for new users. | High | Medium |
| Add live golden-path Playwright: signup, onboarding, attach capsule, Ask answer, citations, verifier, AgentRun, temporal, help separation. | High | Medium |
| Persist active context stack into Ask-created AgentRuns. | High | Medium |
| Normalize temporal dates and add mixed-format tests. | Medium | Low |
| Remove public pricing "checkout unavailable" copy or convert to beta waitlist. | Medium | Low |
| Gate `/api/auth/test-firebase` in production. | Medium | Low |
| Re-run full local gate from clean checkout and record results. | High | Medium |

### Next: 1 to 3 weeks

| Item | Impact | Effort |
|---|---:|---:|
| Add real Cloud Run/Cloud Tasks/worker dependency probes or downgrade health labels to "configured". | High | Medium |
| Cloud proof pack: logs, builds, IAM, secrets, deployed rules, error rate, latency. | High | Medium |
| Lighthouse CI and bundle budgets for public and app routes. | Medium | Medium |
| First-run capsule wizard: recommended capsules, sample questions, expected proof output. | High | Medium |
| Capsule attach repository e2e including search and one-click attach. | High | Medium |
| Investor demo script and seeded account with resettable data. | High | Low |
| Clean `/app/contexts` drift and stale version text. | Medium | Low |
| Add source coverage UI states: no sources, weak coverage, strong coverage, stale source warning. | High | Medium |

### Later: 1 to 2 months

| Item | Impact | Effort |
|---|---:|---:|
| Postgres/pgvector production graph cutover with parity snapshots. | High | High |
| Managed ADK/Agent Engine execution proof with policy-team parent workflow smoke. | High | High |
| Two-phase Firestore/Postgres commit coverage and crash-injection tests. | High | High |
| Terraform plan/apply and canary 5/25/100 process. | Medium | High |
| Admin usage/billing dashboard and paid checkout activation. | Medium | Medium |
| Security review package: threat model, tenant isolation proof, data retention/deletion proof. | High | Medium |

## Researched Best Practices and PRAXIS Actions

| Source | Pattern | PRAXIS action |
|---|---|---|
| Glean February 2026 release notes: https://docs.glean.com/release-notes/releases/2026-02-25-february-release | Chat became the primary work entry point while Search remained available; Glean reported a 29% increase in Chat queries. | Keep Ask as first screen, but reduce first-run friction with one guided capsule and one prepared question. |
| Glean agentic engine docs: https://docs.glean.com/administration/assistant/features/agentic-engine | Fast vs Thinking modes, with deeper mode using more tools and more reliable citations. | Rename PRAXIS modes to user-obvious "Fast answer" and "Deep work"; show what citations/tools become available. |
| Glean agent design docs: https://docs.glean.com/agents/agent-development-lifecycle/plan-and-design-your-agent | Define in-scope, out-of-scope, target users, data sources, actions, constraints, and success criteria before building agents. | Add visible policy-agent cards with scope, sources, allowed actions, forbidden actions, and success criteria. |
| Elastic Agent Builder context article: https://www.elastic.co/search-labs/blog/elastic-agent-builder-ai-agents-context-management | Use dynamically loaded skills, context stores, selective compaction, and connectors to reduce token load. | Move large capsule/source payloads into retrievable context packs and show "active vs stored" context in the dock. |
| Atlan context graph guide: https://atlan.com/know/ai-agent/knowledge-graph-for-ai-agents/ | Context graphs add temporal validity, policy enforcement, ownership, and decision traces. | Make PRAXIS capsule graph UI expose ownership, temporal validity, and review decision trail, not only node/link counts. |
| AWS Bedrock AgentCore Web Search: https://aws.amazon.com/blogs/machine-learning/introducing-web-search-on-amazon-bedrock-agentcore/ | Fresh web search combines current index, knowledge graph, snippet extraction, and citations. | For current policy questions, require explicit freshness metadata and cite retrieved snippets, not generic source labels. |
| The Data Praxis trust-tier retrieval article: https://thedatapraxis.com/blog/knowledge-graphs-for-ai-agents/ | Trust-tier-aware retrieval prevents low-trust evidence from being cited as high-trust fact. | Add trust tier to every capsule receipt and make high-stakes modes fail closed below required tier. |
| NotebookLM business analysis: https://www.overthetopseo.com/notebooklm-business-google-ai-research-tool-knowledge-management/ | Closed-world source notebooks reduce hallucination and every response includes citations to source passages. | Offer a "capsule-only answer" mode that refuses unsupported claims and shows source passage coverage. |
| Enterprise knowledge brain prototype: https://suhasbhairav.com/ai-lab/enterprise-organizational-systems-knowledge-brain | Graph UI should keep source context, ownership, stale-reference warnings, and assumptions inspectable. | Add stale-source, missing-owner, and assumption badges to capsule graph/proof panels. |
| Glean May 2026 launch: https://www.glean.com/blog/may-2026-launch | Proactive task cards, transparent revision review, approval before writes, and shared output library. | Make PRAXIS created-work library a first-class demo: answer -> revision diff -> human approval -> saved output. |

## Unknowns

| Unknown | Why unverified |
|---|---|
| Cloud Run error rate and latency over time | `gcloud logging read` blocked by local credential filesystem access. |
| Cloud Build provenance beyond runtime endpoint | `gcloud builds list` blocked. |
| Deployed IAM/Secret Manager posture | `gcloud` blocked. |
| Deployed Firestore/Storage rules version | Firebase CLI blocked; MCP could read Firestore rules but not version history. |
| Full signed-in Ask/AgentRun/temporal live behavior | Auth/cookie instability and time-boxed browser runs prevented clean completion. |
| Core Web Vitals | No Lighthouse/field data gathered. |
| Full dependency audit posture | `npm audit` not run in this pass. |

## Bottom Line

PRAXIS has enough product substance to justify continued investment: the live app is deployed from main, the public shell is coherent, signup works, the capsule repository is real, and the architecture has serious governance intent. It is not yet production-ready for unguided external sharing. The next readiness milestone should be a clean, repeatable, artifact-producing live demo path that proves one fresh user can attach a capsule, get a grounded cited answer, see verifier coverage, queue a deeper run, ask a temporal question, and use product help without touching the work runtime.
