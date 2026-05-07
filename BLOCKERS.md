# PRAXIS Blockers

## 2026-05-07 — Gemini 3-only prompt conflicts with current model guard

Context: the new workspace prompt requires only `gemini-3-flash` and `gemini-3.1-pro-preview` as model strings. The current repo intentionally keeps `src/lib/ai/MODEL_MATRIX.json`, `src/lib/ai/providers.ts`, and `backend/ai/providers.py` on stable Gemini 2.5 IDs, and `npm run audit:model-matrix-coverage` passes by rejecting Gemini 3 targets unless `PRAXIS_ALLOW_GEMINI3_TARGETS=1` is set.

Options considered: switch the model matrix immediately to Gemini 3, add a new failing `audit:model-strings` script that blocks the repo, or keep the current production-safe guard and record the conflict. Recommendation: do not flip the model matrix until Vertex availability for the exact IDs is verified in the target GCP project and the architecture/model-selection docs are reconciled. Smallest unblocking diff after approval: update `MODEL_MATRIX.json`, `providers.ts`, `backend/ai/providers.py`, `.env.example`, and `docs/architecture/MODEL_SELECTION.md`, then replace the current gate with a stricter `audit:model-strings` script.

## 2026-05-07 — Live Cognee SDK calls are intentionally service-owned

Context: `backend/services/cognee_memory.py` is disabled-safe and raises `NotImplementedError` when Cognee is enabled in the monolith, because live `remember`, `add`, `cognify`, `search`, `memify`, and `forget` are owned by the isolated `praxis-cognee` Cloud Run service. The Tabs/Chapters can queue and persist local rows, but live latency and token-cost verification require that service and its Cloud SQL/Cognee database binding.

Options considered: implement direct SDK calls in the monolith, bypass the isolated service with mocks, or keep the service boundary and improve the app-side contract. Recommendation: keep the isolated service boundary; direct SDK calls in app routers would violate the operational design and Kuzu single-writer model. Smallest unblocking diff after deployment verification: point `COGNEE_BACKEND_URL` at `praxis-cognee`, run the Research/Memos/Draft/Tab acceptance paths against Syria, and append measured latency/cost to `BUILD_LOG.md`.
