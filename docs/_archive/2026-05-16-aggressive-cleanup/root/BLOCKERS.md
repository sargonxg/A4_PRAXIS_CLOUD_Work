# PRAXIS Blockers

## 2026-05-07 — Notification external channels need provider-backed sends

Context: `NOTIFICATIONS_FEEDBACK_SYSTEM.md` is now implemented for in-app notifications, preferences, lifecycle state, feedback signals, bundling, SSE snapshot streaming, Cognee acted/dismissed feedback, and a user-scoped external delivery dispatcher. The registry and preferences include `email-digest`, `email-immediate`, `browser-push`, and `webhook`; dispatcher receipts now stay queued or become `provider_unconfigured` instead of being marked as fake-delivered, but this pass does not deploy provider credentials, Cloud Scheduler jobs, browser push subscriptions, or outbound webhook workspace configuration.

Options considered: mock provider delivery and call it done, remove channels from the registry until providers exist, or keep the channel contract visible while marking provider sends as a live operations slice. Recommendation: keep the dispatcher contract and add provider-backed sends only after Resend/web-push/webhook secrets and staging migration are confirmed. Smallest unblocking diff: add Cloud Scheduler or worker invocation for `/v1/notifications/dispatch`, wire approved email/push/webhook providers, store provider delivery receipts, and extend `audit:notifications-feedback` with provider-backed smoke tests.

## 2026-05-07 — Live Cognee SDK calls are intentionally service-owned

Context: `backend/services/cognee_memory.py` is disabled-safe and raises `NotImplementedError` when Cognee is enabled in the monolith, because live `remember`, `add`, `cognify`, `search`, `memify`, and `forget` are owned by the isolated `praxis-cognee` Cloud Run service. The Tabs/Chapters can queue and persist local rows, but live latency and token-cost verification require that service and its Cloud SQL/Cognee database binding.

Options considered: implement direct SDK calls in the monolith, bypass the isolated service with mocks, or keep the service boundary and improve the app-side contract. Recommendation: keep the isolated service boundary; direct SDK calls in app routers would violate the operational design and Kuzu single-writer model. Smallest unblocking diff after deployment verification: point `COGNEE_BACKEND_URL` at `praxis-cognee`, run the Research/Memos/Draft/Tab acceptance paths against Syria, and append measured latency/cost to `BUILD_LOG.md`.

## 2026-05-07 — Deep pre-ship live checks require staging/prod execution

Context: `npm run audit:deep-preship` now turns the static parts of `DEEP_PRESHIP_CHECKLIST.md` into a saved audit report with 94 PASS, 3 WARN, 0 BLOCKED static checks. The remaining checklist items are live-environment assertions: Cloud SQL restore/PITR, PgBouncer load behavior, staged RLS SQL probes, Vertex billing comparisons, browser-hour console monitoring, Lighthouse/accessibility, Syria cold-open timing, end-to-end exports in real readers, production trace/log coverage, and scrape-backed metric collection.

Options considered: mark them green by source inspection, run local-only mocks, or keep them explicit as live gates. Recommendation: keep them explicit; local static audits are now green, but ship acceptance still requires staging/prod execution. Smallest unblocking diff after credentials/data are ready: run the live test pack against `praxis.tacitus.me`, append measured timings to `docs/audits/2026-05-07-DEEP_PRESHIP_CHECKLIST.md`, and update the JSON evidence file with live pass/fail records.
