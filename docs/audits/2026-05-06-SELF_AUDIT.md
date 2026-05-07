# PRAXIS Self Audit Against Architecture Bible

Date: 2026-05-06  
Repo: `C:\Users\giuli\praxiscodexworking`  
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`  
HEAD audited: `ac2a7bb chore(architecture): enforce bible audit chain`  
Production target: `https://praxis.tacitus.me`

## Inputs Read

- `C:\Users\giuli\Downloads\PRAXIS_ARCHITECTURE.md`; SHA256 matched `docs/architecture/PRAXIS_ARCHITECTURE.md`.
- `C:\Users\giuli\Downloads\PRAXIS_CODEX_00_MASTER_CHARTER.md`.
- `C:\Users\giuli\Downloads\PRAXIS_CODEX_03_*` through `PRAXIS_CODEX_14_*`.
- `docs/audits/2026-05-06-COMPREHENSIVE.md`.
- `docs/adr/`: not present. This is an audit input gap.
- `/mnt/skills/user/praxis-conventions/SKILL.md`: not present on this Windows host. This is an audit input gap.

## Subagent Reports

- Routes and user flows: `C:\Users\giuli\praxis-audit-routes-and-user-flows\docs\audits\2026-05-06-routes-and-user-flows.md`
- AI stack and Vertex: `C:\Users\giuli\praxis-audit-ai-stack-and-vertex\docs\audits\2026-05-06-ai-stack-and-vertex.md`
- Context substrate and storage: `C:\Users\giuli\praxis-audit-context-substrate-and-storage\docs\audits\2026-05-06-context-substrate-and-storage.md`
- Symbolic firewall: `C:\Users\giuli\praxis-audit-symbolic-firewall\docs\audits\2026-05-06-symbolic-firewall.md`
- Tools and marketplace: `C:\Users\giuli\praxis-audit-tools-and-marketplace\docs\audits\2026-05-06-tools-and-marketplace.md`
- Onboarding and personas: `C:\Users\giuli\praxis-audit-onboarding-and-personas\docs\audits\2026-05-06-onboarding-and-personas.md`
- Platform and deploy: `C:\Users\giuli\praxis-audit-platform-and-deploy\docs\audits\2026-05-06-platform-and-deploy.md`
- Landing page fitness: `C:\Users\giuli\praxis-audit-landing-page-fitness\docs\audits\2026-05-06-landing-page-fitness.md`

## 1. Executive Summary

Phase 1 found 45 tracked items: 3 S0, 15 S1, 20 S2, 5 S3, and 2 blocked verification items. Overall product health is **yellow/red**: the core PRAXIS workbench, provider abstraction, tool registry, and production deployment are real, but the architecture bible overstates several production-ready guarantees. The highest-risk gaps are the missing public `/demo/syria-2024` contract, unproven/red persona flows, incomplete canonical auth/waitlist/legal routes, incomplete structural firewall/review-queue coverage, and storage/platform posture that is not yet at the bible's production bar.

## 2. Findings Table

| id | severity | area | title | evidence | remediation sketch | hours | blocks-merge |
|---|---:|---|---|---|---|---:|---|
| F-01 | S0 | Onboarding/personas | Persona CI green-streak not evidenced and production persona suite red | Persona report found no last-10-green CI proof; production persona run is 3/4, with analyst flow missing `praxis-graph-canvas`. | Add/repair persona CI workflow, restore graph test hook or update spec to the shipped UI, publish green-streak ledger. | 16 | yes |
| F-02 | S0 | Public demo | `/demo/syria-2024` is not a signed-out public demo | Production returns 307 to `/login?mode=demo&example=syria-2026`; landing copy says no login. | Build canonical read-only demo route, preserve demo watermark, add browser regression and route contract audit. | 18 | yes |
| H-01 | S0 | Landing funnel | Primary demo funnel contradicts architecture route map | Landing audit and production probes show `/demo/syria-2024` redirects into login/demo mode. | Align landing CTA, route, metadata, and demo entry with the architecture bible. | 8 | yes |
| routes-flows-001 | S1 | Routes | Public demo route contract drift | Same route-level evidence as F-02 from routes agent. | Fold into the canonical demo fix; keep a distinct route audit assertion. | 4 | yes |
| C-001 | S1 | Storage | Production context/storage parity not verified | Firebase Admin, DB SQL, Cloud SQL extensions/RLS, and production drift checks were blocked or incomplete. | Add credential-aware staging smoke, read-only SQL audit, and explicit production evidence ledger. | 20 | yes |
| C-002 | S1 | Storage | Two-phase Firestore/Postgres commit and reconciler not implemented | Tests/scripts exist in contract form, but production reconciler and crash-injection proof are missing. | Implement atomic ingestion reconciliation path or narrow architecture claim with ADR. | 24 | yes |
| SF-HIGH-001 | S1 | Firewall | Hard-tier structural firewall is not universal | Backend claim rejection tests pass, but route/write-path coverage is not exhaustive. | Add write-path inventory, enforce firewall wrapper at every graph/write API, add AST coverage test. | 20 | yes |
| SF-HIGH-002 | S1 | Firewall | Review queue missing for synthesized candidates | Source Augmenter candidates are specified as review-queue-bound, but queue behavior is not proven. | Implement review queue persistence/surface or update contract by ADR. | 24 | yes |
| E-HIGH-001 | S1 | Tools | Marketplace handlers are prompt-contract foundation, not specialist-backed executions | 16 tools register and pass audits, but outputs are generic prompt-contract runs. | Upgrade highest-value v1 handlers first; add canary output assertions per ontology. | 32 | yes |
| E-HIGH-002 | S1 | Tools/memos | `cross.memo-create` and `cross.memo-refresh` are not registered marketplace tools | Memo tools exist conceptually but are absent from the v1 marketplace registry as tools. | Register memo tools with contracts, skills, handler signatures, and canaries. | 16 | yes |
| E-HIGH-003 | S1 | Tool composition | v2 contextProjection/composition flow is partial | Chains are documented; downstream augmented context is not fully proven. | Implement chain runner assertions and persist context projection between steps. | 24 | yes |
| F-03 | S1 | Onboarding | 60-second wow flow is specified but not testable end-to-end | No green five-run evidence; auth/demo route mismatch blocks the flow. | Build deterministic e2e spec after demo/login route alignment. | 16 | yes |
| F-04 | S1 | Public demo | Lighthouse/accessibility proof not feasible for canonical public demo | Canonical route is missing, so Lighthouse/axe proof is against the wrong surface. | Add LHCI/axe target for public demo once route lands. | 8 | yes |
| G-01 | S1 | Deploy | Latest production deploy lacks evidenced 5/25/100 canary phases | Cloud Run showed 100% traffic to latest revision, no canary timestamps. | Add deploy ledger or canary script evidence; do not claim protocol until proven. | 12 | yes |
| G-02 | S1 | Platform | Cloud SQL posture below bible target | Cloud SQL is `ZONAL`; transaction log retention surfaced as 7 days, not 30-day PITR evidence. | Decide staged upgrade path for HA/PITR or mark as launch blocker with cost owner. | 12 | yes |
| G-03 | S1 | Platform | Scheduler jobs paused | `praxis-check-alerts`, `praxis-generate-briefing`, and `gdelt-poller` are paused. | Review cost/safety, then enable required jobs in staging before production. | 6 | yes |
| H-02 | S1 | Routes/landing | Canonical `/waitlist`, `/login/callback`, and `/legal/*` routes missing | Production returned 404 for those architecture routes; `/privacy` and `/terms` exist instead. | Add route aliases/pages or revise architecture with ADR. | 12 | yes |
| H-03 | S1 | Landing CTA | CTA hierarchy does not meet one-primary/one-secondary contract | Landing has multiple entry affordances and no canonical `/waitlist` page. | Enforce primary "Try the demo, no signup" and secondary "Join the waitlist". | 6 | yes |
| routes-flows-002 | S2 | Auth | Login is not magic-link primary | `/login` ships Google, email/password, and demo login; no primary magic-link CTA visible. | Choose product direction: implement magic link or update bible/charter with ADR. | 18 | no |
| routes-flows-003 | S2 | Routes | Authenticated route surface broader than sealed map | Route audit found additional shipped surfaces outside the canonical map. | Produce canonical route manifest and document retired/extra routes. | 8 | no |
| B-S2-001 | S2 | AI/subagents | Canonical four-subagent pattern documented but not live as claimed | Agent Engine inventory did not prove four clean current deployed runtimes. | Bind concrete deployments or lower copy to "planned/experimental". | 24 | no |
| B-S2-002 | S2 | AI/cost | Cost/token/model telemetry is structurally present but not populated end-to-end | Live trace/cost collection proof missing for matrix calls. | Add audit collection write and smoke for each task kind. | 16 | no |
| B-S2-003 | S2 | AI/trace | Full request-to-model Cloud Trace coverage not proven | No complete route-to-Vertex span tree evidence for latest sampled tool runs. | Add tracing assertions to tool-run smoke and deployment audit. | 16 | no |
| C-003 | S2 | Context | Four-layer context parity is stronger in types than persisted hydration | Static parity exists; workspace/user persistence and retrieval are not fully proven. | Add synthetic user/workspace/case/conversation round-trip tests. | 20 | no |
| C-004 | S2 | Embeddings | KG embedding dimensionality drift | `graph_embeddings vector(1536)` conflicts with current 768-dim Vertex text embedding default. | Split embedding columns/indexes or update model/dimension contract. | 10 | no |
| C-005 | S2 | Neo4j | Production Neo4j posture contradictory | Docs/config say Neo4j should be gone or optional; live zero-connection proof missing. | Add production config grep and runtime secret audit. | 6 | no |
| SF-MED-001 | S2 | Firewall/synthesis | Synthesized labels and confidence caps are contracts, not runtime gates everywhere | Memo/source synthesis labeling not proven at runtime across subagents. | Enforce synthesized metadata at persistence and output boundaries. | 16 | no |
| SF-MED-002 | S2 | Firewall coverage | Route-level firewall audit too shallow | Existing audits pass but do not enumerate every mutating route. | Add AST route classifier and require firewall wrapper for mutating writes. | 12 | no |
| E-MED-001 | S2 | Tools/tests | Canary fixtures are declared but not executable per-tool runs | Registry includes canary IDs, not full output assertions for each tool. | Convert canaries into parameterized tests with schema and semantic checks. | 20 | no |
| E-MED-002 | S2 | Skills | `audit:tool-skill-conforms` aliases to presence and does not itself enforce canonical order | Skill audits pass but the command name overstates validation. | Add ordered-section parser or rename command. | 6 | no |
| E-MED-003 | S2 | Suggestions | Suggestion engine lacks full Pack 13 eval/surface set | Recall@3 and rationale behavior not fully proven in CI. | Add fixture eval and visible rationale assertions. | 12 | no |
| E-MED-004 | S2 | Tool authoring | 17th-tool spike feasible but not one-folder/60-minute proven | Template exists, but no measured authoring spike completed in this phase. | Run disposable spike after approval and document duration. | 8 | no |
| F-05 | S2 | Empty states | Empty-state posture partial | No comprehensive brand-new-user sweep ledger; blank/naked states not exhaustively ruled out. | Add empty-state Playwright sweep and fixture screenshots. | 12 | no |
| G-04 | S2 | Storage/platform | Cloud Storage posture blocked by permissions | `gcloud storage buckets describe gs://praxis-uploads` denied. | Grant read-only audit role or add service-account evidence path. | 4 | no |
| G-05 | S2 | Observability | Structured log coverage not proven | Latest sampled logs had trace IDs, but not complete `userId/caseId/requestId` proof. | Add log schema sampler and fail on missing structured fields. | 8 | no |
| H-04 | S2 | Landing copy | Syria-heavy legacy copy/assets remain | Legacy components still frame Syria heavily even though Syria is one example. | De-Syriafy hero/value props and make Syria one sample situation. | 10 | no |
| H-05 | S2 | Landing structure | Marketplace and Memo Studio not explicit enough | Landing lacks strong "16 tools" and "memo loop" product evidence sections. | Add actual workbench/graph/memo sections with live screenshots. | 14 | no |
| H-06 | S2 | Landing performance | Lighthouse targets not proven | Landing smoke failed locally due no dev server; production Lighthouse not run in this pass. | Add LHCI command and run after landing changes. | 8 | no |
| routes-flows-004 | S3 | Health routes | Unauthenticated health routes have inconsistent detail | Some unauthenticated health/API surfaces reveal different levels of information. | Normalize public health detail after security review. | 4 | no |
| B-S3-001 | S3 | AI/deploy | Multiple same-name Agent Engine deployments create binding ambiguity | Agent Engine inventory found same-name deployment ambiguity. | Add deployment selector convention and stale deployment cleanup plan. | 6 | no |
| B-S3-002 | S3 | Docs/model matrix | Target-state Gemini 3.x and Claude-on-Vertex examples differ from live matrix | Docs use future/target model IDs while live matrix uses stable Gemini 2.5 IDs. | Mark future model IDs as target state or update matrix when available. | 4 | no |
| B-S3-003 | S3 | AI/static | Allowed residual model literals remain in preference/methodology surfaces | Static grep has expected residual strings outside providers. | Add allowlist comments or centralize labels. | 4 | no |
| SF-LOW-001 | S3 | Audit infra | Sibling worktrees lack `node_modules` | Some Vitest/local commands blocked outside main checkout. | Document audit runner dependency strategy. | 2 | no |
| routes-flows-005 | BLOCKED | Routes/user flows | Real user/admin/onboarding/paid flows untested | No synthetic approved user/admin credential path in this phase. | Provide staging test users and owner/non-owner fixtures. | 8 | no |
| routes-flows-006 | BLOCKED | Audit infra | Sibling worktree dependency isolation slowed local browser runs | Worktrees did not have local dependency installs. | Use shared install or scripted `npm ci --workspaces=false` strategy. | 4 | no |

## 3. Cross-Cutting Patterns

- The architecture bible is ahead of the live product on public entry, Agent Engine subagents, storage parity, review queues, canary deployment evidence, and persona CI.
- The strongest live foundation is the Next.js workbench, tool registry, provider abstraction, Vertex default posture, static context/tool audits, and production Cloud Run deployment.
- Route contracts are the biggest user-facing mismatch: `/demo/syria-2024`, `/waitlist`, `/login/callback`, and `/legal/*` are canonical in the bible but absent or redirected in production.
- Several "audit says green" scripts validate presence or shape, but not full semantic behavior. Future fixes must extend the audit net, especially for tool output canaries, firewall coverage, context persistence, and deploy canaries.
- PRAXIS is partly de-Syriafied in intent, but landing/demo mechanics still make Syria look like the primary product rather than an example situation.

## 4. User-Flow Scorecard

| flow | status | evidence |
|---|---|---|
| Sign-up to first memo, 60-second wow | BROKEN/UNPROVEN | Missing canonical public demo and magic-link/waitlist path; no 5-run green e2e proof. |
| Ingestion | DEGRADED/UNPROVEN | Context/storage tests exist, but production Postgres/Firestore round trip and graph delta were not proven. |
| Tool-run | DEGRADED | Tool registry and protected APIs exist; specialist outputs, cost persistence, SSE trace, and deterministic rerun proof incomplete. |
| Memo | DEGRADED | Memo surfaces exist, but `cross.memo-create` and `cross.memo-refresh` are not first-class marketplace tools. |
| Graph ops | DEGRADED | Workbench graph is real; merge/revert/audit trail persistence not proven against production. |
| Suggestion | DEGRADED | Suggestion foundation exists; mediator/Northwind recall@3 and rationale assertions need CI proof. |

## 5. AI Stack Health

- Provider isolation is mostly clean. Production config defaults to Vertex and `npm run audit:gcp` passed with 0 hard failures and 0 soft warnings.
- Live Agent Engine posture is not yet the architecture bible's canonical four-subagent design. Deployments exist, but binding/freshness/eval/session/memory evidence is incomplete.
- The model matrix is implementation-ready but needs clearer separation between current live IDs and future target IDs such as Gemini 3.x and Claude-on-Vertex names.
- Cost telemetry and trace span trees are structurally planned but not proven end-to-end for `/v1/cases/*/tools/*/run`.

## 6. Storage Health

- Static context parity and context-vs-tools audits are useful and mostly green.
- Production storage parity is not yet verified: Cloud SQL schema, RLS/constraints, Firestore/Postgres drift, and user/workspace/case/conversation round trips need a credentialed staging harness.
- The 1536-dim pgvector schema conflicts with current 768-dim embedding defaults unless long/context embeddings are separated from text embeddings.
- Reconciler and two-phase commit are still product-critical gaps before claiming robust knowledge graph persistence.

## 7. Firewall Posture

- Soft-tier behavior matches the recalibrated direction: low context health and weak confidence should advise rather than block.
- Hard-tier rejections are partially implemented for claim-level tests, but write-path coverage is not yet universal.
- Synthesized outputs need runtime labeling/capping enforcement and review-queue routing, especially for Memo Drafter and Source Augmenter flows.
- The symbolic firewall should remain advisory for context quality and user-generated text. The strict layer should focus on graph/persistence invariants, cross-case isolation, provenance requirements, and verdict-level assertions.

## 8. Landing-Page Audit Summary

- Accurate: PRAXIS is presented as a serious workbench, and the page already includes structured product sections, trust copy, and JSON-LD.
- Outdated: public demo copy says no login while production redirects to login/demo mode; Syria still carries too much of the product narrative.
- Missing: canonical `/waitlist`, `/login/callback`, `/legal/*`, explicit 16-tool marketplace section, explicit Memo Studio loop, and real workbench/graph screenshots.
- Visual/performance: existing polish is good enough to preserve, but Lighthouse and accessibility targets were not proven in this pass.

## 9. Improvement Opportunities

- Treat the public demo and onboarding path as the first product hardening loop. This unlocks landing truthfulness, persona CI, Lighthouse proof, and the 60-second wow.
- Convert high-value audits from presence checks into behavior checks: route manifest, persona streaks, tool canaries, context round trips, firewall write-path coverage, and deploy canary ledger.
- Keep the symbolic firewall permissive for text/AI/context ingestion while enforcing structural graph writes and provenance. This matches Giulio's instruction that the firewall should not be too strict.
- Position Gemini Enterprise Agent Platform as the orchestration target, but separate "live today" from "target architecture" in docs and landing copy until Agent Engine deployment evidence is complete.

## 10. Audit Confidence Rating

Confidence: **medium**. Static repo evidence and production HTTP/Cloud Run probes are strong. Confidence is reduced by missing staging test credentials, missing `/mnt/skills/user/praxis-conventions/SKILL.md`, absent `docs/adr/`, missing browser/Lighthouse proof for the canonical demo, and blocked SQL/Firestore/Cloud Storage read-only checks.

## Proposed Plan For Giulio

Per the requested four-phase pattern, this section is a proposal only. No implementation has been performed.

### S0: Fix This Loop Iteration

1. Public demo contract and landing funnel.
   - Files likely touched: `src/app/demo/syria-2024/page.tsx`, `src/app/demo/page.tsx`, `src/components/landing/live-demo.tsx`, landing CTA components, route-manifest audit, Playwright route tests.
   - Risk: medium.
   - Acceptance: signed-out `/demo/syria-2024` returns 200, read-only demo visible, watermark present, landing primary CTA points there, Lighthouse/axe can run against it.

2. Persona CI and red analyst flow.
   - Files likely touched: `tests/e2e/personas/*`, `.github/workflows/*persona*`, graph canvas component/test IDs, `docs/audits/health-trends.md`.
   - Risk: medium.
   - Acceptance: all four persona suites green locally and in CI, green-streak tracking starts, analyst graph selector fixed.

### S1: Fix This Loop Iteration Unless Scope Exceeds 40 Hours

1. Canonical entry/auth/legal routes.
   - Files likely touched: `src/app/waitlist/page.tsx`, `src/app/login/callback/page.tsx`, `src/app/legal/*/page.tsx`, login components, middleware route allowlist, route audit.
   - Risk: medium.

2. 60-second wow test harness after route alignment.
   - Files likely touched: `tests/e2e/onboarding/60-second-wow.spec.ts`, demo fixtures, memo export mocks/fixtures.
   - Risk: medium.

3. Structural firewall and review queue.
   - Files likely touched: backend graph/write routers, firewall middleware, review queue model/API/UI, firewall coverage audit.
   - Risk: high.

4. Marketplace/memo/composition hardening.
   - Files likely touched: tool registry, memo tool contracts, composition runner, canary fixtures, suggestion eval.
   - Risk: medium.

5. Context/storage production proof.
   - Files likely touched: context parity tests, staging smoke scripts, reconciliation scripts, migration/docs if embedding dimension interpretation changes.
   - Risk: high.

6. Platform deploy evidence.
   - Files likely touched: deploy/canary scripts, platform audit script, scheduler documentation, Cloud SQL decision ADR.
   - Risk: medium.

### S2: File To Backlog

After approval, create `docs/backlog/2026-05-06-from-self-audit.md` with owners and target releases for:

- Agent Engine canonical four-subagent runtime proof.
- AI cost/token/model telemetry population.
- Full Cloud Trace route-to-model span proof.
- Embedding dimension split or migration.
- Neo4j production zero-connection proof.
- Executable per-tool canaries.
- Ordered SKILL.md canonical-section enforcement.
- Suggestion recall@3 eval.
- 17th-tool spike duration proof.
- Empty-state sweep ledger.
- Storage bucket posture evidence.
- Structured log coverage sampler.
- Landing marketplace/memo/graph sections and Lighthouse targets.

### S3: Defer With Rationale

- Health-route detail normalization: defer until a security review defines the right public diagnostics level.
- Duplicate Agent Engine deployment cleanup: defer until binding rules are documented to avoid deleting the wrong runtime.
- Future model ID wording: defer until current Vertex model availability is confirmed and matrix ownership is clear.
- Residual model literals in labels/docs: defer unless provider isolation regresses.
- Sibling worktree dependency strategy: defer unless audits continue to require heavy browser/runtime checks in every sibling worktree.

## Landing-Page Polish Plan

This should run only after Giulio approves the route/demo S0 plan.

1. Sections to add or strengthen:
   - "What's inside" section with 16 tools across Conflict, Mediation, Governance, and Narrative.
   - Memo Studio loop: template, graph auto-population, edit, export DOCX.
   - Real graph viewer/workbench screenshot with "Demo data" watermark.
   - Subagent/trust strip: Gemini Enterprise Agent Platform as orchestration target, Claude-on-Vertex writing support only where actually live or clearly marked planned.

2. Copy to update:
   - De-Syriafy hero and value props. PRAXIS should be the workbench for policy, conflict, mediation, and diplomacy professionals.
   - Present Syria 2024, Northwind, UN CTED, and Nordalia as sample situations, not as the product.
   - Remove or revise "no login required" claims until `/demo/syria-2024` is truly public.

3. Assets to refresh:
   - Replace stock/abstract product cues with screenshots of the actual workbench, graph canvas, tools panel, and memo studio.
   - Preserve existing motion/heritage animation where it still fits the new narrative.

4. Visual targets:
   - Lighthouse desktop at least 95, mobile at least 90 after polish.
   - Accessibility 100 or documented exceptions.
   - Fresh load below 1.5s for above-the-fold landing.
   - One primary CTA: "Try the demo, no signup" -> `/demo/syria-2024`.
   - One secondary CTA: "Join the waitlist" -> `/waitlist`.

@Giulio: STOPPING HERE per the requested Read & Report -> Propose & Confirm gate. Waiting for `proceed [section]` before any code changes, commits, PRs, or deploy work.
