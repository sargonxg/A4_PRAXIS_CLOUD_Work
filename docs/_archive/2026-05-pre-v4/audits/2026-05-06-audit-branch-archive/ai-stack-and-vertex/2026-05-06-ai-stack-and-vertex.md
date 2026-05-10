# PRAXIS Phase 1 Self-Audit - Topic B: AI Stack and Vertex/Gemini Enterprise

Date: 2026-05-06
Worktree: `C:\Users\giuli\praxis-audit-ai-stack-and-vertex`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Write scope honored: this markdown file and `docs/audits/2026-05-06-ai-stack-and-vertex.json` only.

## Executive Summary

Static provider posture is good. The repo now has a real `MODEL_MATRIX`, shared frontend/backend provider boundaries, production Vertex defaults, route calibration, context-aware wrapping, and local observability gates. The production Cloud Run frontend is also configured for Vertex (`AI_PROVIDER=vertex`, `GOOGLE_VERTEX_PROJECT=praxisbytacitus`, `GOOGLE_VERTEX_LOCATION=us-central1`) and `/api/health` reports `ai_provider=ok` and `vertex_adk=ok`.

The remaining issue is runtime evidence, not basic provider isolation. The Deep Research Agent is deployed on Vertex AI Agent Engine / ReasoningEngine, but the four canonical Pack 13 subagents are documented as skills and contracts rather than live Agent Engine/LangGraph runtimes. Cost, token, model, and trace fields exist structurally, but this audit did not find end-to-end evidence that they are populated for every AI/subagent call.

No paid model calls were made. I stopped at static inspection, Cloud Run/gcloud inventory, public health checks, Agent Engine inventory, and Cloud Logging reads.

## Source Docs Read

- `C:\Users\giuli\Downloads\PRAXIS_ARCHITECTURE.md`
- `C:\Users\giuli\Downloads\PRAXIS_CODEX_00_MASTER_CHARTER.md`
- `C:\Users\giuli\Downloads\PRAXIS_CODEX_03_WORKBENCH_ARCHITECTURE.md` through `PRAXIS_CODEX_14_PRODUCTION_EXCELLENCE.md`
- `docs/audits/2026-05-06-COMPREHENSIVE.md`
- `docs/audits/2026-05-06-AI_PROVIDER_INVENTORY.md`
- `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`

## Audit Commands

| Check | Result | Evidence |
|---|---:|---|
| `npm run audit:routes` | PASS | `66 AI route files, 66 calibrated, 5 exempt` |
| `audit-ai-provider-isolation.ts` via sibling installed `tsx` | PASS | `[audit:ai-provider-isolation] ok` |
| `audit-ai-provider-vertex-default.ts` via sibling installed `tsx` | PASS | `[audit:ai-provider-vertex-default] ok` |
| `audit-context-vs-tools.ts` via sibling installed `tsx` | PASS | `audit-context-vs-tools: ok` |
| `audit-context-aware-coverage.ts` via sibling installed `tsx` | PASS | `Context-aware coverage audit passed.` |
| `audit-observability-coverage.ts` via sibling installed `tsx` | PASS | `[audit:observability-coverage] ok` |
| `npm run audit:gcp` | PASS | 0 hard failures, 0 soft warnings |

Operational note: local `node_modules` is absent in this worktree, so `npm run` TypeScript scripts initially failed with `tsx not recognized`. Per the sibling-worktree note, I reran the TypeScript scripts with `C:\Users\giuli\praxiscodexworking\node_modules\.bin\tsx.cmd`.

## Provider Status

| Area | Status | Notes |
|---|---:|---|
| Provider isolation | PASS | Direct provider SDK imports are confined to approved provider/provisioning boundaries. |
| `MODEL_MATRIX` sanity | PASS | All task kinds use `provider=vertex`; embeddings use `text-embedding-005`. |
| Production `AI_PROVIDER` | PASS | Cloud Run `praxis-frontend` has `AI_PROVIDER=vertex`, `GOOGLE_VERTEX_PROJECT=praxisbytacitus`, `GOOGLE_VERTEX_LOCATION=us-central1`. |
| Backend provider imports | PASS with exceptions | `backend/agents/deploy.py` is a provisioning script; `backend/services/gemini_client.py` is the backend Gemini service boundary. |
| Hard-coded model strings | PASS with debt | Audit passes, but allowed residual Gemini labels remain in settings/advisor/tool prose. |

## Vertex / Agent Engine Status

Read-only cloud checks were successful under `giulio@tacitus.me` for project `praxisbytacitus` (`852128226674`).

| Resource | Status |
|---|---|
| `aiplatform.googleapis.com` | ENABLED |
| `run.googleapis.com` | ENABLED |
| `cloudtrace.googleapis.com` | ENABLED |
| `logging.googleapis.com` | ENABLED |
| Cloud Run `praxis-frontend` | Ready, revision `praxis-frontend-00244-m2t` |
| Cloud Run `praxis-backend` | Ready, revision `praxis-backend-00103-zmq` |
| Secret `praxis-vertex-adk-engine-id` | Exists, version 1 enabled; payload not read |
| ReasoningEngine inventory | 3 `praxis_deep_research_v1` resources found |

The installed `gcloud ai` surface does not expose `reasoning-engines`, so I used the Vertex AI REST v1beta1 `reasoningEngines` list endpoint. It returned three same-name `praxis_deep_research_v1` resources. The newest observed resource is:

`projects/852128226674/locations/us-central1/reasoningEngines/2584860027680456704`

It reports `agentFramework=google-adk`, `pythonVersion=3.12`, effective identity `service-852128226674@gcp-sa-aiplatform-re.iam.gserviceaccount.com`, and methods including `create_session`, `stream_query`, `async_stream_query`, `async_search_memory`, and `async_add_session_to_memory`.

## Subagent Table

| Subagent | Skill Doc | Backend Runtime | Agent Engine Resource | Status |
|---|---|---|---|---|
| Context Preparer | Present | Not found | Not found as distinct resource | Documented, not live |
| Source Augmenter | Present | Not found | Not found as distinct resource | Documented, not live |
| Output Refiner | Present | Not found | Not found as distinct resource | Documented, not live |
| Memo Drafter | Present | Not found | Not found as distinct resource | Documented, not live |
| Deep Research Agent | Not a Pack 13 skill | `backend/agents/deep_research`, `backend/agents/deploy.py` | 3 ReasoningEngine resources | Partially live |

`src/lib/tools/context-provider.ts` has a `subagent()` method, but it returns a prepared descriptor, not an actual Agent Engine invocation. This matches the latest comprehensive audit's warning that LangGraph subagent runtimes remain deferred.

## Live Smoke Status

| Probe | Result | Notes |
|---|---:|---|
| `GET https://praxis.tacitus.me/api/health` | 200 | `firestore=ok`, `ai_provider=ok`, `cookie_secret=ok`, `vertex_adk=ok`, `polar=unconfigured` |
| `GET /api/health/provider` | 401 | Expected without user session; endpoint uses `withAuth`. |
| `GET /api/capabilities` | 401 | Expected without user session. |
| Agent Engine session/query | Not run | Stopped before session or model/runtime spend. |

## Trace and Cost Evidence

Static observability gates pass, and Cloud Trace/Logging APIs are enabled. Cloud Logging has ReasoningEngine startup logs for `reasoning_engine_id=6389755199971393536` on 2026-05-04. I did not find recent `praxis-frontend` logs for `deep-search-agent`, `Vertex`, `tool.completed`, or `withCalibration` in the sampled query.

`withCalibration` creates and completes `tool_runs`; `ToolRun` has fields for `model`, `creditsDeducted`, `inputTokens`, `outputTokens`, and `durationMs`. The current wrapper calls `completeToolRun(toolRunId)` without passing model/token/cost data. A Postgres `cost_ledger` migration exists, but no active writer was found in this pass.

## Findings

| ID | Sev | Finding |
|---|---:|---|
| B-S2-001 | S2 | Canonical four-subagent pattern is documented but not live. Skills exist, but runtime dirs/evals/deployments for Context Preparer, Source Augmenter, Output Refiner, and Memo Drafter are missing. |
| B-S2-002 | S2 | Cost/token/model telemetry is structurally present but not populated end to end. |
| B-S2-003 | S2 | Cloud Trace and Agent Engine evidence is not yet a full request-to-model trace. |
| B-S3-001 | S3 | Multiple same-name Agent Engine deployments create binding ambiguity until the active secret-to-engine mapping is recorded. |
| B-S3-002 | S3 | Architecture/model docs still contain target-state Gemini 3.x and Claude-on-Vertex examples while the live matrix uses Gemini 2.5 stable IDs. |
| B-S3-003 | S3 | Allowed residual model literals remain in user preference and methodology surfaces. |

No S0 or S1 issues were found in this self-audit.

## Overall Status

Phase 1 Topic B is **yellow**: provider isolation and Vertex default posture are in good shape, and live cloud configuration is present. The gap is the stronger enterprise claim: canonical subagents, cost ceilings, token accounting, and trace evidence are not yet production-complete across the architecture.
