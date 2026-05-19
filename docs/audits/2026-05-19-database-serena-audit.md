# PRAXIS Database Audit With Serena Discovery

Date: 2026-05-19
Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
Firebase project: `praxisbytacitus`

## Serena Status

Serena is installed and configured for this checkout through the global Codex MCP config. Its CLI tool registry exposes semantic code-navigation tools such as `find_symbol`, `find_referencing_symbols`, `get_symbols_overview`, `search_for_pattern`, and `think_about_collected_information`.

In this Codex session, those Serena MCP tools were not mounted as directly callable tool namespaces. `serena project health-check` was attempted but timed out after roughly two minutes. This audit therefore uses Serena discovery as the starting point, then relies on Firebase MCP, source inspection, repo contract audits, Firestore rules, Firestore indexes, and storage rules for verified evidence.

## Data Planes

PRAXIS currently has four persistence planes:

1. Firebase Firestore
   - Canonical app database for users, situations, context capsules, context stacks, knowledge repositories, knowledge documents, output capsules, profiles, preferences, usage/credits, notifications, and operational event records.
   - Root config is `firebase.json`, with rules in `firestore.rules` and indexes in `firestore.indexes.json`.

2. Firebase Storage
   - User-scoped file storage under `users/{uid}/...`.
   - Rules limit writes to authenticated owners, under 25 MB, and selected document/text MIME types.

3. Cloud SQL / Postgres
   - Runtime ledger and optional mirror plane.
   - Agent runtime uses SQL tables for `agent_runs`, `agent_run_events`, `agent_tool_calls`, and `agent_approvals`.
   - Ask-thread and document-ingestion SQL mirrors are environment-gated.
   - Backend migrations also define graph, Cognee, pgvector, and ACO-related tables.

4. Optional graph / memory layers
   - Cognee and graph-related persistence are treated as derived or optional memory layers.
   - Current code does not make Cognee authoritative for core app state.

## Firestore Shape

Key user-scoped collections:

- `users/{uid}`
- `users/{uid}/situations/{situationId}`
- `users/{uid}/contextStacks/{stackId}`
- `users/{uid}/capsules/{capsuleId}`
- `users/{uid}/capsules/{capsuleId}/notes`
- `users/{uid}/capsules/{capsuleId}/evaluations`
- `users/{uid}/capsules/{capsuleId}/memories`
- `users/{uid}/capsules/{capsuleId}/spans`
- `users/{uid}/capsules/{capsuleId}/outputs`
- `users/{uid}/capsules/{capsuleId}/askThreads/{threadId}/turns`
- `users/{uid}/knowledgeRepositories/{repositoryId}`
- `users/{uid}/knowledgeDocuments/{documentId}`
- `users/{uid}/outputCapsules/{outputCapsuleId}`
- `users/{uid}/profile`
- `users/{uid}/profile_versions`
- `users/{uid}/notifications/{notificationId}`

Top-level operational or configuration collections:

- `credit_transactions`
- `tool_runs`
- `background_jobs`
- `system_events`
- `alerts`
- `data_ingestions`
- `audit_logs`
- `advisor_feed_items`
- `settings/api_keys_encrypted`
- `settings/api_keys`
- domain catalogs such as `agent_capabilities`, `tools`, `methodology_templates`, `workflow_templates`, and related config collections

## Rules Posture

Strengths:

- Firestore has a deny-all fallback.
- User records are owner-scoped.
- Credits, subscription, Polar, and full-access fields are protected from normal client update.
- API key settings are denied to all client reads and writes.
- Capsule, repository, document, output-capsule, profile, and context-stack state is owner-scoped.
- Storage is owner-scoped and constrained by size and MIME type.
- Operational collections mostly block direct client writes.

Watch item:

- `users/{uid}/situations/{situationId}/{document=**}` gives authenticated owners broad read/write access to all descendants under each situation. This is acceptable only if every situation subcollection is meant to be client-writable. If server-owned subcollections live under situations, this catchall should be narrowed.

## Index Posture

Existing indexes cover the obvious operational queues and feeds:

- `credit_transactions`: user timeline
- `situations`: status and update ordering
- `tool_runs`: user, status, situation, tool, and start-time lookups
- `background_jobs`: status, owner, kind, run timing
- `system_events`: user, situation, severity, kind, created time
- `notifications`: read state and created time
- `alerts`: user/situation alert views
- `data_ingestions`: situation ingestion timeline
- collection groups for `graph_updates`, `provenance`, `sources`, `work_products`, `saved_queries`, `agent_runs`, and `claims`

Gap:

- Knowledge library, capsule catalog, and output-capsule services still do several `limit(100)` or `limit(200)` reads followed by in-memory filtering. That is fine for the current scale, but it should not be the long-term query model for a growing workspace.

## Source-Level Findings

1. Firestore is the canonical product database.
   - `src/lib/context/capsule-service.ts` persists context capsules and default context stacks under `users/{uid}`.
   - `src/lib/knowledge/library-service.ts` persists repositories and documents under the owner.
   - `src/lib/output-capsules/storage.ts` persists output capsules and mirrors capsule output references.
   - `src/lib/firebase/ask-thread-service.ts` persists capsule ask threads under capsule documents.

2. Admin initialization is explicit but has one footgun.
   - `src/lib/firebase/admin.ts` correctly supports service-account JSON, service-account file, or ADC.
   - `getAdminDbOrThrow()` gives a clear error when admin credentials are missing.
   - The module also exports `adminDb: Firestore = _db!`; direct imports can still fail at runtime if the environment is not configured. Critical services should prefer `getAdminDbOrThrow()`.

3. Document retrieval is not yet a scale-grade vector database path.
   - `src/lib/firebase/documents-service.ts` stores extracted text and embeddings inline on chunk documents.
   - Retrieval loads documents and chunks, then scores in application memory.
   - This is workable for small corpora, but it should be replaced by a real vector query plane before large repositories are expected.

4. Postgres is a useful ledger, but migration ownership should stay clear.
   - Agent runtime tables are created with `CREATE TABLE IF NOT EXISTS` at runtime.
   - Backend migrations also exist for graph and memory-plane tables.
   - Production should avoid drifting between runtime-created schemas and migration-managed schemas.

## Validation Run

Passed:

- `npm run audit:capsule-contract`
- `npm run audit:capsule-memory-contract`
- `npm run audit:output-capsule-storage`
- `npm run audit:knowledge-library-contract`
- `npm run audit:agent-process-contract`

Timed out:

- `serena project health-check`
- `npm run audit:gcp`

Firebase MCP confirmed:

- Active project: `praxisbytacitus`
- Project name: `PRAXISbyTACITUS`
- Lifecycle state: `ACTIVE`
- Billing enabled
- Authenticated user: `giulio@tacitus.me`
- Firestore and Storage config files are wired from `firebase.json`

## Recommended Next Moves

1. Narrow or explicitly document the broad situation descendant rule.
   - Classify situation subcollections as client-writable or server-owned.
   - Move server-owned descendants under stricter rules if needed.

2. Replace direct `adminDb` imports in critical runtime paths.
   - Prefer `getAdminDbOrThrow()` so misconfiguration fails clearly.

3. Add a real query model for growing capsule and knowledge surfaces.
   - Add indexed Firestore queries and pagination, or move large search workloads to the chosen vector/search plane.

4. Decide the durable vector-search plane.
   - Current chunk scanning should be treated as a bootstrap implementation, not the scale path.
   - Pick Firestore vector search, pgvector, or another managed search layer and make it explicit.

5. Re-run the live cloud audit with a longer timeout or narrower scope.
   - `npm run audit:gcp` timed out in this pass, so deployed rules/indexes and live infrastructure were not fully verified here.

