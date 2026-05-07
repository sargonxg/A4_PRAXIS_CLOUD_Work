# PRAXIS Backlog From 2026-05-06 Self-Audit

Date: 2026-05-06  
Source: `docs/audits/2026-05-06-SELF_AUDIT.md`  
Owner: Giulio / PRAXIS engineering loop  
Status: active blocker and backlog ledger

This file converts the architecture self-audit findings into the master-charter work queue. It supersedes any older "no open S0/S1" reading from `docs/audits/2026-05-06-REALITY_CHECK.md` until every item below is fixed and re-audited.

## S0 / S1 Launch Blockers

These block any `v1.0.0` readiness claim.

| Priority | Area | Item | Acceptance Check | Owner | Target |
|---|---|---|---|---|---|
| S0 | Public demo | Public demo contract | Signed-out `/demo/syria-2024` returns 200, is read-only, watermarked, and has Playwright + Lighthouse/axe evidence. | PRAXIS engineering | v1.0 gate |
| S0 | Personas | Persona CI | Four persona suites are green in CI; green-streak ledger records progress toward 10 consecutive runs. | PRAXIS engineering | v1.0 gate |
| S0 | Landing funnel | Landing primary demo funnel | Homepage primary CTA points at the canonical public demo and no copy claims a flow that does not exist. | PRAXIS engineering | v1.0 gate |
| S1 | Canonical entry routes | Canonical entry routes | `/waitlist`, `/login/callback`, and `/legal/{privacy,terms,security,data-retention}` resolve or redirect by documented contract. | PRAXIS engineering | v1.0 gate |
| S1 | Context/storage | Production context/storage parity | Synthetic staging user proves User, Workspace, Case, and Conversation context round trips; evidence saved in audit docs. | PRAXIS engineering | v1.0 gate |
| S1 | Storage atomicity | Two-phase commit/reconciler | Crash-injection test and reconciler dry run prove Firestore/Postgres drift recovery. | PRAXIS engineering | v1.0 gate |
| S1 | Firewall | Hard-tier structural write coverage | Every graph/write path passes through the symbolic firewall; AST/route audit fails on bypass. | PRAXIS engineering | v1.0 gate |
| S1 | Firewall | Synthesized review queue | Source Augmenter and Memo Drafter synthesized candidates are labeled and review-gated before graph persistence. | PRAXIS engineering | v1.0 gate |
| S1 | Tools | Specialist marketplace depth | The 16 curated marketplace tools have executable canaries and specialist handlers or clearly documented foundation fallback status. | PRAXIS engineering | v1.0 gate |
| S1 | Memos | Memo marketplace tools | CLOSED foundation 2026-05-07: `cross.memo-create` and `cross.memo-refresh` are registered with contract v2, SKILL.md files, Memo Studio handoff payloads, and 22-tool audits. Model-backed runtime evidence remains covered by Specialist marketplace depth. | PRAXIS engineering | v1.0 gate |
| S1 | Tool composition | Context projection through chains | Documented chains persist and pass augmented context to the next tool; chain tests prove it. | PRAXIS engineering | v1.0 gate |
| S1 | Onboarding | 60-second wow | Five consecutive e2e runs complete demo/onboarding/memo export in the target window or produce a named blocker. | PRAXIS engineering | v1.0 gate |
| S1 | Deployment | Canary evidence | Latest production deploy has 5 -> 25 -> 100 phase timestamps or launch docs stop claiming canary completion. | PRAXIS engineering | v1.0 gate |
| S1 | Platform | Cloud SQL HA/PITR decision | Cloud SQL production posture meets the charter target or has an owner-approved ADR with cost/risk rationale. | Giulio + PRAXIS engineering | v1.0 gate |
| S1 | Scheduler | Required jobs active | Required scheduler jobs are enabled in staging/production or explicitly deferred by ADR. | PRAXIS engineering | v1.0 gate |

## S2 Backlog

| Area | Item | Owner | Target |
|---|---|---|---|
| Auth | Decide whether magic-link is primary or update the bible/charter with current Google/email/password posture. | Giulio + PRAXIS engineering | v1.0 or ADR |
| Routes | Produce a canonical route manifest and mark retired/extra routes. | PRAXIS engineering | v1.0 |
| AI/subagents | Bind concrete Agent Engine deployments for Context Preparer, Source Augmenter, Output Refiner, and Memo Drafter, or lower copy to planned status. | PRAXIS engineering | v1.1 |
| AI telemetry | Populate cost/token/model telemetry for every task kind and tool run. | PRAXIS engineering | v1.1 |
| Cloud Trace | Prove route-to-Vertex span trees for latest sampled tool runs. | PRAXIS engineering | v1.1 |
| Context | Add synthetic user/workspace/case/conversation round-trip tests. | PRAXIS engineering | v1.0 |
| Embeddings | Resolve `graph_embeddings vector(1536)` vs 768-dim text embedding default. | PRAXIS engineering | v1.0 |
| Neo4j | Add production zero-connection proof or document optional runtime posture. | PRAXIS engineering | v1.0 |
| Firewall | Enforce synthesized labels and confidence caps at persistence/output boundaries. | PRAXIS engineering | v1.0 |
| Tools | Convert canary IDs into executable per-tool semantic tests. CLOSED foundation 2026-05-07 with `audit:tool-semantic-canaries`; model-backed semantic evals remain for runtime cutover. | PRAXIS engineering | v1.1 |
| Skills | Enforce ordered canonical SKILL.md sections. | PRAXIS engineering | v1.1 |
| Suggestions | Add recall@3 eval and rationale assertions. | PRAXIS engineering | v1.1 |
| Empty states | Add brand-new-user sweep with screenshot ledger. | PRAXIS engineering | v1.0 |
| Storage platform | Add read-only Cloud Storage posture evidence. | PRAXIS engineering | v1.0 |
| Observability | Add structured log coverage sampler for `traceId`, `spanId`, `userId`, `caseId`, and `requestId`. | PRAXIS engineering | v1.1 |
| Landing | Continue de-Syriafied product copy, marketplace/memo sections, real workbench screenshots, and Lighthouse proof. | PRAXIS engineering | v1.0 |

## S3 / Deferred

- Normalize unauthenticated health-route detail after security review.
- Resolve duplicate Agent Engine deployment names once binding rules are documented.
- Mark future model IDs as target state until live Vertex availability is confirmed.
- Centralize residual model label strings when provider isolation regresses or copy gets confusing.
- Improve sibling worktree dependency strategy only if audit agents keep requiring heavy runtime checks in separate worktrees.

## Next Loop Recommendation

1. Fix the public demo route contract and landing CTA truthfulness first.
2. Add the canonical route aliases/pages for waitlist, login callback, and legal pages.
3. Re-run route, landing, persona, and Lighthouse/axe checks.
4. Then move to context/storage and firewall S1 items, because those carry the highest backend correctness risk.
