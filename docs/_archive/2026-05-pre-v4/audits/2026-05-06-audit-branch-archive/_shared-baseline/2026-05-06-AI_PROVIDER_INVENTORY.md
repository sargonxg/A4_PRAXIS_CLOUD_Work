# AI Provider Inventory

Date: 2026-05-06
Pack: 14 Production Excellence

## Pass 1 Findings

- Frontend provider boundary existed at `src/lib/ai/providers.ts`, but model defaults were prose and constants rather than a data matrix.
- Backend model strings were duplicated across Genkit flows, deployment scripts, config defaults, and the Deep Research Agent.
- Firestore document embeddings directly imported `@ai-sdk/google` and instantiated `text-embedding-004`, bypassing the shared provider boundary.
- User-facing preference pages and advisor tier names still expose legacy model labels. These are preference/tier labels, not direct provider SDK calls, but they remain migration debt.

## Pass 2 Fixes Applied

- Added `src/lib/ai/MODEL_MATRIX.json` and typed loader `src/lib/ai/model-matrix.ts`.
- Updated `src/lib/ai/providers.ts` to read production model IDs from the matrix.
- Added `backend/ai/providers.py` and moved backend model defaults through named constants.
- Updated Genkit, backend config, Agent Engine deploy script, and Deep Research Agent to use backend provider constants.
- Rewired `src/lib/firebase/documents-service.ts` to use `getEmbeddingModel()` from the shared provider boundary and upgraded the document embedding path to `text-embedding-005`.
- Added `npm run audit:ai-provider-isolation` and `npm run audit:ai-provider-vertex-default`.

## Current Model Defaults

| Area | Default |
|---|---|
| Enterprise agent platform posture | Gemini Enterprise |
| Developer model runtime | Vertex AI |
| Agent runtime posture | Gemini Enterprise Agent Platform Runtime |
| Local fallback | Google AI Studio |
| Region | `us-central1` |
| Balanced model | `gemini-2.5-flash` |
| Deep model | `gemini-2.5-pro` |
| Embeddings | `text-embedding-005` |

## Remaining Gaps

- Owner approval is still required for region, cost projection, Terraform plan, canary deployment, and launch sign-off.
- The four LangGraph subagents are not yet deployed as managed Gemini Enterprise Agent Platform Runtime agents with sessions, Memory Bank, and Cloud Trace evidence.
- Provider-level cost telemetry is still pending specialist model-backed tool handlers.
- User preference labels should eventually move from raw model IDs to task-kind names.
- The deploy script still imports Vertex AI SDKs directly because it is an Agent Runtime provisioning tool, not an application request path.
