# PRAXIS Build Log

## 2026-05-07 — Deep pre-ship operator SSE hardening

Continued `DEEP_PRESHIP_CHECKLIST.md` by hardening the workspace operator SSE path and expanding the saved pre-ship audit from 97 to 141 static checks. `/v1/workspace/events` now emits SSE retry hints, event IDs, and named events using the checklist vocabulary (`start`, `step`, `progress`, `complete`, `fail`); `useOrchestratorEvents` now subscribes to named events and leaves browser EventSource reconnection active instead of closing on transient errors. Added a backend SSE contract test and extended `audit:deep-preship` to cover operator transparency, notifications, frontend polish, E2E scaffolding, and performance script availability. Verified with the deep pre-ship audit, focused pytest, scoped ESLint, Python compile, TypeScript, and production build. Live staging/browser/Cloud SQL/Vertex checks remain environment gates.

## 2026-05-07 — Purpose audit continuation

Continued `PURPOSE_AUDIT_PROMPT.md` by finishing the remaining pure-removal and first-view cleanup findings from `PURPOSE_AUDIT_REPORT.md`. Generic institution/persona phrasing was removed from the Syria Ask PRAXIS demo, briefing audience placeholders were made neutral, the default Tools page no longer foregrounds archive mechanics before the active workflow, notification settings now show human event labels, and the purpose audit gate now checks these regressions. Verified with the focused purpose audit, scoped ESLint on touched UI, TypeScript, and production build.

## 2026-05-07 — Notification external delivery contract

Continued `NOTIFICATIONS_FEEDBACK_SYSTEM.md` by fixing channel lifecycle semantics and adding the first safe external-delivery dispatcher. In-app notifications still deliver immediately, but email digest, immediate email, browser push, and webhook receipts now start queued and are advanced by a user-scoped dispatcher that records `provider_unconfigured` when credentials are absent instead of pretending the send succeeded. Added HMAC-SHA256 webhook signing, a three-attempt retry ceiling, a `/v1/notifications/dispatch` route plus Next proxy fallback, audit markers, and focused delivery tests. Provider-backed sends, Cloud Scheduler cadence, push subscriptions, and workspace webhook configuration remain live-ops blockers until secrets and staging are confirmed.

## 2026-05-07 — Deep pre-ship observability counters

Continued `DEEP_PRESHIP_CHECKLIST.md` by adding a protected backend `/metrics` endpoint and a small dependency-free Prometheus text registry. Cognee wrapper calls now record operation/status/mode counters and latency summaries even in disabled-safe mode, and tenant sessions record reset counters when connections return to the pool. Extended `audit:deep-preship` to enforce the metrics surface and added backend tests for the metrics contract. This improves the static pre-ship observability gate without claiming live Cloud SQL, Vertex billing, or staging scrape coverage.

## 2026-05-07 — Case typology surfaced in creation

Continued the ontology system build by wiring the ten PRAXIS specialization case types into the user-facing situation creation path. Added a shared TypeScript case-type registry/classifier, manual primary/secondary case-type picker, review-card display, classify-domain preview payload, and `/api/situations` persistence into both camelCase and snake_case fields so Firestore cases carry the same `case_type` contract as the backend substrate. Extended `audit:ontology-system` and added unit coverage for the ten-type taxonomy. This preserves the existing broad ontology-lens UI for tool ranking while adding the specific ontology stack used by Cognee extraction.

## 2026-05-07 — Ontology evolution loop and golden contracts

Continued `ONTOLOGY_SYSTEM_BUILD.md` by adding the advisory ontology evolution loop for repeated rejected extraction patterns, plus a workspace subgraph that emits `ontology_evolution_proposed` suggestions without mutating OWL files, firewall rules, RLS policy, or substrate rows. Added five priority golden sets with 5 documents and 30 labeled primitives each, aligned the resolver/data-point LRU cache with the documented size of 50, and extended `audit:ontology-system` so the evolution loop and golden contracts stay enforced. Verified locally with the ontology audit, ontology version/classifier audits, Python compile, and focused backend pytest; live Cognee extraction recall/precision, Syria latency, and token cost remain environment-gated and are not claimed here.

## 2026-05-07 — Purpose audit and first surface cleanup

Ran `PURPOSE_AUDIT_PROMPT.md` against the Tabs, Chapters, Settings, and cross-cutting UI surfaces. Added `PURPOSE_AUDIT_REPORT.md` with Remove/Simplify/Consolidate/Keep findings, then shipped the first low-risk removals: removed Context implementation-contract narration, removed the duplicate Library case-frame-claim action, and removed decorative Draft capability badges. Added `audit:purpose-surface` so these pure-removal findings stay enforced. Verified with the purpose audit, scoped lint, TypeScript, and build.

## 2026-05-07 — Notifications and feedback foundation

Built the first shippable in-app slice from `NOTIFICATIONS_FEEDBACK_SYSTEM.md`: added the 16-type notification taxonomy, Postgres lifecycle and feedback-signal migration, backend `notify()` service with quiet hours, per-type preferences, deduplication/bundling, orchestrator audit logging, acted/dismissed Cognee feedback with `save_interaction=True`, `/v1/notifications` APIs, backend proxy allowlisting, live notification center actions, and `/app/settings/notifications`. Verified with `audit:notifications-feedback`, focused backend pytest, Python compile, and TypeScript. Live Syria latency/token cost and external channels are not claimed yet; email/browser/webhook delivery and production migration checks are tracked in `BLOCKERS.md`.

## 2026-05-07 — Deep pre-ship checklist gate

Built the first enforceable pass for `DEEP_PRESHIP_CHECKLIST.md`: added `audit:deep-preship`, wrote the saved audit ledger at `docs/audits/2026-05-07-DEEP_PRESHIP_CHECKLIST.md`, centralized Cognee dataset construction through `dataset_for()`, added disabled-safe `improve()` feedback calls, added tenant-scoped ontology debug endpoints, added the missing Postgres pre-ship foundation tables/RLS/NOTIFY triggers, wired workspace SSE to event history, and exposed canonical `praxis.*` MCP tool registry names. Verified with the new audit, Cognee/orchestrator/workspace audits, focused backend pytest, TypeScript, Vitest, and production build. Live staging checks, Cloud SQL restore/load tests, browser-hour checks, and Vertex billing comparisons remain live-environment work and are tracked in `BLOCKERS.md`.

## 2026-05-07 — Ontology system foundation

Built the first safe pass from `ONTOLOGY_SYSTEM_BUILD.md`: added the PRAXIS ACO base OWL, ten case-type specialization OWLs with changelogs, typed Cognee data-point modules, a runtime ontology stack/composition helper, and disabled-safe Cognee `cognify` reporting for ontology paths and data-point classes. The Library tab can now pass primary and secondary case types into extraction/re-extraction without touching firewall, RLS, migrations, or live Cognee imports. Acceptance verified locally through XML parsing, runtime stack tests, data-point metadata tests, and the new `audit:ontology-system`; measured Syria live latency/token cost remains unavailable until the isolated Cognee service is live in this environment.

## 2026-05-07 — Workspace Tabs/Chapters/Cognee continuation

Built a focused P9.0 continuity slice after reading `WORKSPACE_RETHINK.md`, `TABS_BUILD_GUIDE.md`, `CHAPTERS_BUILD_GUIDE.md`, `COGNEE_ARCHITECTURE.md`, `COGNEE_IMPLEMENTATION.md`, and `CLAUDE.md`. The workspace event stream now emits real `workspace_suggestions` and `workspace_orchestrator_log` rows before its heartbeat, plus shared confirm/dismiss actions for frontend consumers. Graph node detail now uses Cognee `CHUNKS` recall for provenance, matching the Graph Tab contract, and Research now exposes the required `Close thread → improve memory` action label. Verified acceptance guardrails by running the existing Cognee/tab/writer/model audits before changes; local measured latency/token cost on Syria was not available because the local backend is not bound to a live Cognee service in this session, so live cost remains tracked as a follow-up blocker rather than invented.

## 2026-05-07 — Desk queue and Research recall ledger

Continued the workspace build after re-reading `COGNEE_IMPLEMENTATION.md`, `CLAUDE.md`, and the active Tab/Chapter guides. The Desk surface now consumes the shared workspace SSE stream through `useOrchestratorEvents('workspace')`, renders live orchestrator suggestions ahead of static next actions, and gives analysts confirm/dismiss controls backed by the existing workspace suggestion APIs. Research recall now persists a citation-shaped turn (`answer`, `hit_count`, `citations`, `cognee` status) and displays an analyst-visible recall ledger beside the thread controls, so graph recall is no longer only a transient status note. Verified with focused Vitest, pytest, Cognee/writer/model audits, ESLint on touched files, TypeScript, and `npm run build`; live Syria latency and token cost are still blocked on the missing live Cognee backend URL documented in `BLOCKERS.md`.
