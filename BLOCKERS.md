# PRAXIS Blockers

## 2026-05-07 — Notification external channels need delivery workers

Context: `NOTIFICATIONS_FEEDBACK_SYSTEM.md` is now implemented for in-app notifications, preferences, lifecycle state, feedback signals, bundling, SSE snapshot streaming, and Cognee acted/dismissed feedback. The registry and preferences include `email-digest`, `email-immediate`, `browser-push`, and `webhook`, but this pass does not deploy external channel workers or provider credentials.

Options considered: mock external delivery and call it done, remove channels from the registry until workers exist, or keep the channel contract visible while marking delivery as a live operations slice. Recommendation: keep the channel contract and add the delivery worker after provider credentials and staging migration are confirmed. Smallest unblocking diff: add a notification dispatcher worker that drains pending channel rows, sends through the approved email/push/webhook providers, writes delivery receipts, and extends `audit:notifications-feedback` with provider-backed smoke tests.

## 2026-05-07 — Gemini 3-only prompt conflicts with current model guard

Context: the new workspace prompt requires only `gemini-3-flash` and `gemini-3.1-pro-preview` as model strings. The current repo intentionally keeps `src/lib/ai/MODEL_MATRIX.json`, `src/lib/ai/providers.ts`, and `backend/ai/providers.py` on stable Gemini 2.5 IDs, and `npm run audit:model-matrix-coverage` passes by rejecting Gemini 3 targets unless `PRAXIS_ALLOW_GEMINI3_TARGETS=1` is set.

Options considered: switch the model matrix immediately to Gemini 3, add a new failing `audit:model-strings` script that blocks the repo, or keep the current production-safe guard and record the conflict. Recommendation: do not flip the model matrix until Vertex availability for the exact IDs is verified in the target GCP project and the architecture/model-selection docs are reconciled. Smallest unblocking diff after approval: update `MODEL_MATRIX.json`, `providers.ts`, `backend/ai/providers.py`, `.env.example`, and `docs/architecture/MODEL_SELECTION.md`, then replace the current gate with a stricter `audit:model-strings` script.

## 2026-05-07 — Live Cognee SDK calls are intentionally service-owned

Context: `backend/services/cognee_memory.py` is disabled-safe and raises `NotImplementedError` when Cognee is enabled in the monolith, because live `remember`, `add`, `cognify`, `search`, `memify`, and `forget` are owned by the isolated `praxis-cognee` Cloud Run service. The Tabs/Chapters can queue and persist local rows, but live latency and token-cost verification require that service and its Cloud SQL/Cognee database binding.

Options considered: implement direct SDK calls in the monolith, bypass the isolated service with mocks, or keep the service boundary and improve the app-side contract. Recommendation: keep the isolated service boundary; direct SDK calls in app routers would violate the operational design and Kuzu single-writer model. Smallest unblocking diff after deployment verification: point `COGNEE_BACKEND_URL` at `praxis-cognee`, run the Research/Memos/Draft/Tab acceptance paths against Syria, and append measured latency/cost to `BUILD_LOG.md`.

## 2026-05-07 — Deep pre-ship live checks require staging/prod execution

Context: `npm run audit:deep-preship` now turns the static parts of `DEEP_PRESHIP_CHECKLIST.md` into a saved audit report with 83 PASS, 4 WARN, 0 BLOCKED static checks. The remaining checklist items are live-environment assertions: Cloud SQL restore/PITR, PgBouncer load behavior, staged RLS SQL probes, Vertex billing comparisons, browser-hour console monitoring, Lighthouse/accessibility, Syria cold-open timing, end-to-end exports in real readers, and production trace/log coverage.

Options considered: mark them green by source inspection, run local-only mocks, or keep them explicit as live gates. Recommendation: keep them explicit; local static audits are now green, but ship acceptance still requires staging/prod execution. Smallest unblocking diff after credentials/data are ready: run the live test pack against `praxis.tacitus.me`, append measured timings to `docs/audits/2026-05-07-DEEP_PRESHIP_CHECKLIST.md`, and update the JSON evidence file with live pass/fail records.
