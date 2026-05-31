# PRAXIS Runtime Data Plane Diagnostic

Generated: 2026-05-31T03:38:26.579Z
Mode: read-only

## Architecture

- Canonical state owner: PRAXIS
- Firestore: Firestore remains canonical for user/app state, profiles, ContextCapsules, context stacks, conversations, documents, and output capsules.
- Cloud SQL: Cloud SQL Postgres is the durable ledger for Ask SQL memory and agent runs: ask_threads, ask_thread_turns, agent_runs, agent_run_events, agent_tool_calls, and agent_approvals.
- Execution: ADK, Genkit, Vertex, Gemini, Cloud Tasks, and Cloud Run execute work but do not become the product source of truth.

## Status Summary

- PASS: 2
- WARN: 4
- FAIL: 2
- BLOCKED: 3

## Findings

### FAIL / CRITICAL / cloud-tasks-worker-auth-missing

Cloud Tasks worker authentication is not configured.

Affected flow: Durable queued agent dispatch and worker execution.

Evidence:
- Firebase Admin credential source: missing
- ADC/impersonation: not visible in env
- Cloud Tasks worker auth: missing
- Cloud Run service account hint: not visible in env

Remediation:
- Set AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL and AGENT_RUN_WORKER_OIDC_AUDIENCE for OIDC worker auth.
- Use AGENT_RUN_WORKER_SHARED_SECRET only as a documented fallback.

### FAIL / HIGH / vertex-project-missing

Vertex project is missing and no Google AI fallback is visible.

Affected flow: Ask model selection, Gemini runtime routing, and queued agent execution.

Evidence:
- Vertex location: global
- Google AI fallback: missing

Remediation:
- Set GOOGLE_VERTEX_PROJECT and GOOGLE_VERTEX_LOCATION/GOOGLE_VERTEX_GEMINI_LOCATION.
- Keep Google AI fallback configured only as a controlled fallback, not the canonical production posture.

### BLOCKED / HIGH / capsule-thread-agent-continuity

Continuity check maps ownerUid, capsuleId, threadId, and traceId across Firestore and Cloud SQL.

Affected flow: User asks a capsule, continues a conversation, queues a deep agent run, and reads the resulting receipt.

Evidence:
- Firestore capsule path: BLOCKED
- Firestore capsule turns path: BLOCKED
- SQL ask turns: BLOCKED
- SQL agent runs: BLOCKED

Remediation:
- Ensure Ask requests persist capsuleId/threadId in Firestore and SQL.
- Ensure agent_runs carries owner_uid, capsule_id, context_package_id, and trace_id.

### BLOCKED / HIGH / firebase-admin-credentials-blocked

Firebase Admin credentials are not visible to the diagnostic environment.

Affected flow: Profile, ContextCapsule, conversation, and output-capsule reads.

Evidence:
- Firebase Admin credential source: missing
- ADC/impersonation: not visible in env
- Cloud Tasks worker auth: missing
- Cloud Run service account hint: not visible in env

Remediation:
- Run npm run auth:doctor and configure FIREBASE_SERVICE_ACCOUNT_KEY_FILE, FIREBASE_SERVICE_ACCOUNT_KEY, or ADC.

### BLOCKED / MEDIUM / firestore-sample-blocked

Required Firestore data-plane paths were not sampled in this run.

Affected flow: Profile, ContextCapsule, conversation, and output-capsule continuity.

Evidence:
- users/{uid}: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/profile/analyst: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/usage/{period}: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/capsules/{capsuleId}: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/capsules/{capsuleId}/versions/{version}: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/capsules/{capsuleId}/sources/{sourceId}: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/capsules/{capsuleId}/researchDossiers/starter-dossier: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/capsules/{capsuleId}/claimLedgers/starter-claims: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/capsules/{capsuleId}/humanWorkflowExamples/starter-workflow: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/capsules/{capsuleId}/sourceRefreshDockets/starter-refresh: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/capsules/{capsuleId}/ontologyGraphs/starter-seed: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/capsules/{capsuleId}/graphProjections/graphlite-starter-projection: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/capsules/{capsuleId}/askThreads/{threadId}: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/capsules/{capsuleId}/askThreads/{threadId}/turns/{turnId}: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/contextStacks/default: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/conversations/{conversationId}/turns/{turnId}: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/outputCapsules/{outputId}: No bounded Firestore diagnostic sample was supplied.
- users/{uid}/capsules/{capsuleId}/outputs/{outputId}: No bounded Firestore diagnostic sample was supplied.

Remediation:
- Set PRAXIS_DIAGNOSTIC_UID to a non-demo diagnostic user and rerun npm run audit:runtime-data-plane.
- Confirm Firebase Admin credentials with npm run auth:doctor.

### WARN / MEDIUM / ai-provider-warning-google-vertex-project-is-not-configured

GOOGLE_VERTEX_PROJECT is not configured.

Affected flow: Ask PRAXIS model routing.

Evidence:
- Frontier models: gemini-3.5-flash, gemini-3.1-pro-preview
- Fallback models: gemini-2.5-flash, gemini-2.5-pro, gemini-2.5-flash-lite

Remediation:
- Run npm run audit:ai-provider-vertex-default and align env with src/lib/ai/model-runtime-policy.ts.

### WARN / MEDIUM / cloud-sql-url-missing

Cloud SQL URL was not visible in this environment; Firestore can still carry app state but Ask SQL memory and durable agent ledgers are degraded.

Affected flow: Ask SQL memory and queued agent-run durability.

Evidence:
- Checked ASK_THREAD_DATABASE_URL, AGENT_RUNTIME_DATABASE_URL, PRAXIS_DATABASE_URL, and DATABASE_URL.

Remediation:
- Set ASK_THREAD_DATABASE_URL or AGENT_RUNTIME_DATABASE_URL from Secret Manager in the Cloud Run service.
- Rerun npm run audit:runtime-data-plane after the secret is mounted.

### WARN / MEDIUM / embeddings-unconfigured

Embeddings configuration was not visible in this environment.

Affected flow: Context retrieval, capsule evidence packs, and semantic memory.

Evidence:
- Checked GOOGLE_VERTEX_EMBEDDING_MODEL, EMBEDDING_MODEL, and GOOGLE_GENERATIVE_AI_EMBEDDING_MODEL.

Remediation:
- Configure the approved embedding model or document why deterministic retrieval is sufficient for this environment.

### WARN / MEDIUM / runtime-health-degraded

Runtime health is degraded.

Affected flow: Runtime semaphore, Settings/System, and operator debugging.

Evidence:
- frontend: ok
- firestore: degraded
- backend: unconfigured
- agent_ledger: unconfigured
- agent_queue: down
- agent_worker: unconfigured
- agent_platform: unconfigured

Remediation:
- Open /app/settings?tab=system with an authenticated user and repair down checks first.

### PASS / LOW / architecture-ownership

Database ownership is explicit: Firestore owns user/app/capsule state; Cloud SQL owns Ask SQL memory and agent-run ledgers; PRAXIS remains canonical over execution substrates.

Affected flow: Architecture and operator repair decisions.

Evidence:
- Firestore path inventory includes profiles, capsules, context stacks, conversations, documents, and output capsules.
- Cloud SQL schema inventory includes Ask thread tables and agent runtime tables.
- Ask PRAXIS model policy provider: vertex

Remediation:
- Do not introduce a replacement database owner without updating the architecture docs and migration plan.

### PASS / LOW / write-canary-gate

Write canary mode is disabled; this diagnostic is read-only.

Affected flow: Production diagnostics and safety posture.

Evidence:
- PRAXIS_DIAGNOSTIC_WRITE_CANARY=not set

Remediation:
- Set PRAXIS_DIAGNOSTIC_WRITE_CANARY=1 only for an explicit controlled canary phase.

## Firestore Inventory

| Status | Required | Path | Purpose | Evidence |
| --- | --- | --- | --- | --- |
| BLOCKED | yes | `users/{uid}` | Profile, credits, onboarding, API-key metadata, and AI settings. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/profile/analyst` | Onboarding/profile metadata for the analyst core. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/usage/{period}` | Usage and credit accounting. | No bounded Firestore diagnostic sample was supplied. |
| WARN | no | `users/{uid}/settings/api_keys_encrypted/providers/{provider}` | Server-owned API-key metadata and encrypted provider key records. | Optional path recorded for coverage; no bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/capsules/{capsuleId}` | Canonical ContextCapsule state. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/capsules/{capsuleId}/versions/{version}` | Capsule version history and lockability. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/capsules/{capsuleId}/sources/{sourceId}` | Starter and user-owned source receipt records. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/capsules/{capsuleId}/researchDossiers/starter-dossier` | Starter research dossier with human job, source spine, gaps, and next actions. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/capsules/{capsuleId}/claimLedgers/starter-claims` | Starter claim ledger seeds for supported, weak, missing, and stale claims. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/capsules/{capsuleId}/humanWorkflowExamples/starter-workflow` | Starter human workflow example and output path. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/capsules/{capsuleId}/sourceRefreshDockets/starter-refresh` | Starter source refresh docket for every starter capsule. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/capsules/{capsuleId}/ontologyGraphs/starter-seed` | Starter ontology graph seed with review-gated node and edge templates. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/capsules/{capsuleId}/graphProjections/graphlite-starter-projection` | GraphLite-ready advisory projection compiled from the starter graph seed. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/capsules/{capsuleId}/askThreads/{threadId}` | Capsule-scoped Ask thread metadata. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/capsules/{capsuleId}/askThreads/{threadId}/turns/{turnId}` | Capsule-scoped Ask turns. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/contextStacks/default` | Default active ContextCapsule stack. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/conversations/{conversationId}/turns/{turnId}` | Conversation continuity outside capsule-specific threads. | No bounded Firestore diagnostic sample was supplied. |
| WARN | no | `users/{uid}/situations/{situationId}/memos/{memoId}` | Memo outputs and versions. | Optional path recorded for coverage; no bounded Firestore diagnostic sample was supplied. |
| WARN | no | `users/{uid}/situations/{situationId}/documents/{documentId}` | User document corpus and chunks. | Optional path recorded for coverage; no bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/outputCapsules/{outputId}` | Durable output capsules created by Ask/agent runs. | No bounded Firestore diagnostic sample was supplied. |
| BLOCKED | yes | `users/{uid}/capsules/{capsuleId}/outputs/{outputId}` | Capsule-linked output capsule index. | No bounded Firestore diagnostic sample was supplied. |

## Cloud SQL Schema

| Status | Table | Missing columns | Missing indexes |
| --- | --- | --- | --- |
| BLOCKED | `ask_threads` | none | none |
| BLOCKED | `ask_thread_turns` | none | none |
| BLOCKED | `agent_runs` | none | none |
| BLOCKED | `agent_run_events` | none | none |
| BLOCKED | `agent_tool_calls` | none | none |
| BLOCKED | `agent_approvals` | none | none |

## AI Provider

- Vertex project configured: no
- Vertex location: global
- Frontier models: gemini-3.5-flash, gemini-3.1-pro-preview
- Stable fallback models: gemini-2.5-flash, gemini-2.5-pro, gemini-2.5-flash-lite
- Google AI key fallback: not configured
- Embeddings: not configured

## Runtime Health

Runtime health summary: degraded (Some systems degraded)
