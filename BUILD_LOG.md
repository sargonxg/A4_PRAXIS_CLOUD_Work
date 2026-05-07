# PRAXIS Build Log

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
