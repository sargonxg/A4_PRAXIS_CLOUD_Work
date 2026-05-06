# PRAXIS Master Charter Completion TODO

Date: 2026-05-06
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Production: `https://praxis.tacitus.me`

This is the exhaustive working checklist for closing the remaining gap between
the preserved Codex prompt packs and the live PRAXIS application. Keep it
updated on every implementation pass. A checked item means shipped, tested, and
documented. A partial item must keep its named gap visible.

## Control Gates

- [x] Preserve master charter and prompt packs 03-14 in `docs/codex-prompts/`.
- [x] Keep `npm run audit:gate` green on `main`.
- [x] Keep Graphify outputs refreshed after code changes.
- [x] Keep repo identity visible in charter docs and handoff docs.
- [x] Keep no open S0/S1 launch blockers in the current reality check.
- [ ] Run persona Playwright suites 10 consecutive times in CI and record run ids.
- [ ] Add a machine-readable persona streak ledger under `docs/audits/`.
- [ ] Add CI artifact upload for persona screenshots, traces, and console logs.
- [ ] Add production-authenticated smoke evidence for all eight primary surfaces.
- [ ] Add staging 24-hour clean-run evidence before any `v1.0.0` tag.
- [ ] Add production 24-hour clean-run evidence after canary phase 100.
- [ ] Obtain owner production-readiness signature.
- [ ] Tag `v1.0.0` only after the final launch gate is green.

## Pack 03 - Workbench Architecture

- [x] Keep one canonical Workbench route for active case work.
- [x] Keep Syria/Nordalia as examples, not the app architecture.
- [x] Keep route/sidebar audits green.
- [ ] Add browser assertion that default sidebar exposes the intended primary surfaces only.
- [ ] Confirm every legacy route redirects or archives with clear user copy.
- [ ] Remove stale route language from old docs or mark as historical.
- [ ] Add mobile Workbench regression for shell/sidebar/tool switching.
- [ ] Add slow-network Workbench regression for loading and retry states.

## Pack 04 - Landing And Entry Rebuild

- [x] Keep landing Workbench-first and not Syria-only.
- [x] Keep current section anchors audited.
- [ ] Add live public-domain smoke with screenshot evidence after every deploy.
- [ ] Add landing CTA journey test through demo/session creation.
- [ ] Add pricing/waitlist copy audit against the current signup posture.
- [ ] Add mobile landing visual regression for hero, trust, and pricing sections.

## Pack 05 - Context Vs Tools Separation

- [x] Context health is advisory and not a hard block by default.
- [x] Tool artifacts can store raw text, structured output, and context dumps.
- [x] Symbolic firewall posture remains tolerant for generation and context capture.
- [ ] Add token-level SSE firewall annotation for streaming outputs.
- [ ] Add route-level audit proving every streaming route emits visible firewall metadata.
- [ ] Add Trust Score persistence for every streaming claim event, not only inspectable JSON outputs.
- [ ] Add user-facing explanation of advisory vs blocking posture in relevant tool surfaces.
- [ ] Add per-ontology firewall warning/rejection aggregates to operational metrics.

## Pack 06 - Ontology System

- [x] Four ontologies are registered and mapped.
- [x] Frontend ontology selection and suggestions are present.
- [ ] Implement backend ontology classifier with versioned migrations.
- [ ] Add ingestion validators per ontology before graph writes.
- [ ] Add two-phase Firestore-to-Postgres commit for ontology ingestion.
- [ ] Add crash-injection tests for pending/committed/failed ingestion recovery.
- [ ] Add migration fixtures for ontology `v1.0.0` to `v1.1.0`.
- [ ] Add admin-visible ontology drift and migration status.
- [ ] Add docs for ontology extension policy and owner review.

## Pack 07 - Graph Visualization

- [x] Canonical graph viewer is present.
- [x] Graph uniqueness audit is green.
- [ ] Add optimistic graph edit round-trip for merge/split/lock/dispute/contradiction.
- [ ] Persist graph edit audit trails to the KG backend.
- [ ] Add saved graph views per user/workspace.
- [ ] Add source-fragment evidence drawers for graph nodes and edges.
- [ ] Add temporal diff view against prior graph snapshots.
- [ ] Add graph edit e2e test with approve, undo, reload, and audit verification.
- [ ] Add Postgres traversal endpoint coverage for graph UI queries.
- [ ] Add Neo4j/Postgres fallback diagnostics in GraphOps.

## Pack 08 - Tools Marketplace

- [x] Sixteen curated marketplace tools are registered.
- [x] Tool skills and contract v2 audits are green.
- [x] Marketplace foundation run route exists and uses `ContextProvider`.
- [x] Tool run artifacts store raw text, structured output, and context dumps.
- [x] Add per-tool handler audit so foundation fallback cannot be mistaken for specialist completion.
- [x] Add prompt contracts for all 16 marketplace handlers.
- [x] Add marketplace run history UI and reload from persisted artifacts.
- [x] Add marketplace cost and latency telemetry per run.
- [ ] Implement specialist model-backed handler for `conflict.leverage-trace`.
- [ ] Implement specialist model-backed handler for `conflict.commitment-check`.
- [ ] Implement specialist model-backed handler for `conflict.escalation-timeline`.
- [ ] Implement specialist model-backed handler for `mediation.position-vs-interest`.
- [ ] Implement specialist model-backed handler for `mediation.zopa-finder`.
- [ ] Implement specialist model-backed handler for `mediation.mediation-brief`.
- [ ] Implement specialist model-backed handler for `governance.veto-probability`.
- [ ] Implement specialist model-backed handler for `governance.mandate-traceback`.
- [ ] Implement specialist model-backed handler for `governance.coalition-map`.
- [ ] Implement specialist model-backed handler for `narrative.frame-cascade`.
- [ ] Implement specialist model-backed handler for `narrative.counter-narrative-finder`.
- [ ] Implement specialist model-backed handler for `narrative.fact-check-traceback`.
- [ ] Implement specialist model-backed handler for `cross.contradiction-finder`.
- [ ] Implement specialist model-backed handler for `cross.context-health-explainer`.
- [ ] Implement specialist model-backed handler for `cross.brief-exporter`.
- [ ] Implement specialist model-backed handler for `cross.scenario-projector`.
- [ ] Add tool chaining from selected artifact to next recommended tool.
- [ ] Add tool run cancellation/retry state for long-running specialist handlers.

## Pack 09 - Verification And Admin

- [x] Canonical tabbed admin route exists.
- [x] Admin diagnostics expose the seven charter operational categories.
- [x] Replace diagnostics foundation signals with scheduler-backed operational metrics when a snapshot exists.
- [x] Add Cloud Scheduler config for operational metrics snapshots.
- [x] Add tool health aggregates from `tool_runs` and marketplace artifacts.
- [x] Add ingestion P95 duration and awaiting-review counts.
- [ ] Add Firestore/Postgres/Neo4j drift panel backed by persisted parity snapshots.
- [x] Add context health distribution by ontology.
- [x] Add symbolic firewall warning/rejection aggregates by ontology.
- [x] Add auth/rate-limit abuse metrics from sampled system events.
- [x] Add cost dashboard from credit ledger.
- [ ] Add user-persona buckets to context health distribution.
- [ ] Add route-level symbolic firewall distribution after streaming events land.
- [ ] Add provider-level cost telemetry after specialist handlers land.
- [ ] Add alert thresholds and runbook links per diagnostics panel.
- [ ] Add admin e2e smoke for diagnostics, operator console, users, domains, and advisor feed.

## Pack 10 - Postgres Knowledge Graph

- [x] Postgres architecture docs and repository scaffolding exist.
- [x] KG backend audit is green.
- [ ] Apply production Cloud SQL migrations and verify extensions: `pgvector`, `pg_trgm`, `pgcrypto`.
- [ ] Verify RLS policies in a non-interactive smoke script.
- [ ] Add traversal endpoints backed by Postgres recursive CTEs.
- [ ] Add semantic search endpoint using pgvector embeddings.
- [ ] Add Firestore-to-Postgres two-phase commit reconciler.
- [ ] Run Neo4j-to-Postgres sample migration with parity checks.
- [ ] Add parity report to admin diagnostics.
- [ ] Switch graph reads to repository abstraction by feature flag.
- [ ] Add backfill script for existing example and user cases.
- [ ] Add rollback plan and backup/restore runbook.
- [ ] Add index health and slow-query diagnostics.

## Pack 11 - Memo Studio And Launch

- [x] Memo Studio foundation exists with server-backed persistence.
- [x] Memo Studio audit is green.
- [ ] Add DOCX export with citation footnotes and provenance manifest.
- [ ] Add PDF export with citation footnotes and provenance manifest.
- [ ] Add Markdown export with citation footnotes and provenance manifest.
- [ ] Persist paragraph-level provenance maps.
- [ ] Add citation auto-suggest from graph/search context.
- [ ] Add memo run history and version diff review.
- [ ] Add first-run onboarding coach ending in memo export.
- [ ] Add production smoke for memo create, edit, export, reload.
- [ ] Finalize production readiness signature file after all launch gates.
- [ ] Finalize launch announcement after canary phase 100 holds.

## Pack 12 - Context Architecture

- [x] Signed conversation context exists.
- [x] Runtime `ContextProvider` exists.
- [x] Tool projection and advisory context are live.
- [ ] Implement Context Preparer runtime with durable telemetry.
- [ ] Store prepared bundles as addressable artifacts.
- [ ] Add workspace methodology document ingestion into context snapshots.
- [ ] Add context health nightly aggregates.
- [ ] Add context cache invalidation rules by case/source/memo updates.
- [ ] Add user controls for role, communication style, and confidence tolerance.
- [ ] Add tests for signed context replay and tamper rejection.

## Pack 13 - Tool Context Interop

- [x] Tool Contract v2 audit is green.
- [x] Tool skills are present.
- [x] Context projection is wired to marketplace foundation runs.
- [ ] Implement Source Augmenter subagent runtime.
- [ ] Implement Output Refiner subagent runtime.
- [ ] Implement Memo Drafter subagent runtime.
- [ ] Add subagent telemetry, cost, latency, and failure records.
- [ ] Add subagent artifact viewer in admin/operator surfaces.
- [ ] Add tool-to-subagent dependency audit with handler coverage.
- [ ] Add memo-drafter handoff from `cross.brief-exporter`.
- [ ] Add source-augmenter handoff for narrative/fact-check tools.

## Pack 14 - Production Excellence

- [ ] Decide and document Vertex AI region and model defaults.
- [ ] Add audit proving Vertex AI is the default provider in production.
- [ ] Add provider isolation audit for Google AI fallback and user BYO keys.
- [ ] Add embeddings v2 plan using GCP-native embeddings.
- [ ] Decide whether Vertex AI Vector Search is v1.1 or v2.
- [ ] Terraform-manage Cloud Run, Cloud SQL, Firestore indexes/rules, Scheduler, Tasks, Pub/Sub, Secret Manager, IAM, budgets, and alerts.
- [ ] Add Terraform drift audit.
- [ ] Add observability coverage audit for logs, traces, metrics, and Sentry.
- [ ] Add load test script and capacity plan.
- [ ] Add cost projections doc and owner approval.
- [ ] Add public read-only demo/wow flow with 60-second route.
- [ ] Add waitlist/magic-link posture decision and implementation.
- [ ] Add canary monitor script for phases 5, 25, and 100.
- [ ] Add `docs/launch/CANARY_LOG.md` with phase metrics and sign-offs.
- [ ] Add rollback runbook and prove rollback command path.
- [ ] Add final `docs/audits/2026-05-06-LAUNCH_GATE.md`.

## Phase 1-3 Spec Audit Carryover

- [ ] Decide whether to finish the 12-doc canonical collapse or amend the old phase spec.
- [ ] Add SQL extension/RLS production smoke.
- [ ] Deploy Neo4j drift scheduler and Cloud Monitoring alert on drift 409.
- [ ] Add bitemporal field enforcement tests for graph writes.
- [ ] Replace placeholder LangGraph flows with real checkpointed graphs.
- [ ] Collapse 66 calibrated AI routes toward the 20-verb facade or document the divergence.
- [ ] Add read-only Neo4j execution and saved Cypher queries.
- [ ] Connect graph staging SSE to real proposal writes.
- [ ] Add AI Act acknowledgement UI/test path for high-risk calls.
- [ ] Replace static desk cost panel data with live cost-cap reads.

## Cross-Cutting Quality

- [ ] Reduce lint warning backlog by directory with ratcheted budgets.
- [ ] Add demo-content leakage audit for real `/app` empty states and exports.
- [ ] Add typed `contentOrigin` to saved tool outputs.
- [ ] Complete canonical `tool-data` envelope migration.
- [ ] Add App Check or equivalent abuse control for high-cost endpoints.
- [ ] Add per-tier concurrency controls for long-running agent routes.
- [ ] Add incident response runbook for key rotation and provider revocation.
- [ ] Add Firestore rules/index deployment drift gate.
- [ ] Add Storage rules smoke tests for document ownership.
- [ ] Add BigQuery marts for tool runs, background jobs, provider failures, user activation, and cost.
- [ ] Add browser smoke for all recently uplifted flagship tools.
- [ ] Keep `README.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`, `DEPLOYMENT.md`, `SECURITY.md`, `TESTING.md`, `TODO.md`, and `CHANGELOG.md` synced with this checklist.
