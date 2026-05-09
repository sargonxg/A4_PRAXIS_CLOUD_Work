# 02 — Backend, Database & Deployment

> **Track B.** This file owns the server side: FastAPI routers, the Postgres schema additions for cores, the Firestore + Postgres split, GCP/Firebase deployment, observability, and the audit additions that protect all of it.
> **Read after `00`, alongside `01` and `03`.**

---

## 1. Architectural posture (what stays, what extends)

PRAXIS production is a dual-service GCP application. None of that changes.

- **Frontend service**: `praxis-frontend` (Next.js 16 on Cloud Run).
- **Backend service**: `praxis-backend` (Python FastAPI on Cloud Run, private).
- **Auth**: Firebase Auth (email/password + Google).
- **Primary KG store**: Postgres (Cloud SQL) with `pgvector`, `pg_trgm`, `btree_gin`. Schema in `backend/migrations/versions/`.
- **User metadata store**: Firestore (owner-scoped), rules in `firestore.rules`.
- **Blobs**: Cloud Storage, rules in `storage.rules`.
- **Models**: Vertex AI / Gemini Enterprise. No direct OpenAI / Anthropic SDK calls. `audit:ai-provider-isolation` enforces.
- **Memory**: Cognee, default disabled. Optional. `audit:cognee-ui-honesty` enforces honesty.
- **Domain**: `praxis.tacitus.me`, project `praxisbytacitus`, region `us-central1`.

The v7 rewrite extends this stack with **core tables** in Postgres and a **cores router** in FastAPI. It does not rip out anything.

---

## 2. The cores Postgres schema

A new migration `0019_cores_baseline.py` introduces three tables:

### 2.1 `cores`

Holds the metadata for every core (User, Team, Situation, Source, Document, Graph, Output) and the platform PRAXIS Core if we choose to materialize it.

Fields:

- `id uuid PRIMARY KEY`
- `kind text NOT NULL` — one of `praxis | user | team | situation | source | document | graph | output`. Constrained by check.
- `name text NOT NULL`
- `description text`
- `owner_uid text NOT NULL` — Firebase UID, except `praxis` cores which use `'platform'`.
- `team_id text` — nullable, set when shared to a team.
- `parent_core_id uuid REFERENCES cores(id)` — single-parent inheritance.
- `version integer NOT NULL DEFAULT 1`
- `status text NOT NULL DEFAULT 'active'` — `active | archived | locked`.
- `tags text[] NOT NULL DEFAULT '{}'`
- `metadata jsonb NOT NULL DEFAULT '{}'` — catch-all bag including type-specific fields. Schema validated in app.
- `ontology_id text` — nullable, set when the core binds to a domain ontology.
- `ontology_version text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `created_by text NOT NULL`

Indexes:

- `(owner_uid, kind, status)`
- `(team_id, kind, status)` partial where `team_id IS NOT NULL`
- GIN on `tags`
- GIN on `metadata jsonb_path_ops`

### 2.2 `core_grants`

Sharing grants for cores. Generic, replaces ad-hoc per-resource sharing.

Fields:

- `id uuid PRIMARY KEY`
- `core_id uuid NOT NULL REFERENCES cores(id) ON DELETE CASCADE`
- `principal_kind text NOT NULL` — `user | team | link | public`.
- `principal_id text NOT NULL` — UID, team_id, link token, or `'public'`.
- `role text NOT NULL` — `owner | editor | commenter | viewer`.
- `granted_by text NOT NULL`
- `granted_at timestamptz NOT NULL DEFAULT now()`
- `expires_at timestamptz`
- `revoked_at timestamptz`

Indexes:

- `(core_id, principal_kind, principal_id) WHERE revoked_at IS NULL`
- `(principal_kind, principal_id) WHERE revoked_at IS NULL`

### 2.3 `core_audit`

Append-only audit log for core operations. Mirrors `graph_audit`.

Fields:

- `id bigserial PRIMARY KEY`
- `core_id uuid NOT NULL`
- `actor_uid text NOT NULL`
- `action text NOT NULL` — `create | update | rename | re-parent | fork | share | unshare | archive | restore | delete`.
- `before jsonb`
- `after jsonb`
- `at timestamptz NOT NULL DEFAULT now()`
- `request_id text`

A 24-hour reversible window applies to `update | rename | re-parent`. Hard delete is gated by org-admin.

### 2.4 Linkage tables (one per existing concept)

The existing tables `graph_nodes`, `graph_edges`, `graph_embeddings`, source receipts, documents, memos, drafts, etc. each gain a nullable `core_id uuid REFERENCES cores(id)` column with a backfill migration that sets `core_id` to the corresponding Situation Core (or Source/Document/Graph/Output Core, depending on row).

This is the pivot that lets v7 say "load the Situation Core" and pull the right rows in one query, without duplicating data. The existing `case_id text` column stays — `core_id` is a complement, not a replacement, for one release cycle.

---

## 3. The cores FastAPI router

A new router `backend/routers/cores.py` exposes:

- `POST /cores` — create a core (kind, name, parent, metadata).
- `GET /cores` — list cores for the caller, filterable by kind, owner, team, tag.
- `GET /cores/{id}` — read a core.
- `PATCH /cores/{id}` — update metadata, name, description, tags.
- `POST /cores/{id}/fork` — clone with new owner, optional new parent.
- `POST /cores/{id}/grants` — share to user/team/link/public.
- `DELETE /cores/{id}/grants/{grant_id}` — revoke a grant.
- `POST /cores/{id}/archive`, `POST /cores/{id}/restore`.
- `GET /cores/{id}/lineage` — parent + ancestors.
- `GET /cores/{id}/audit` — recent audit events.
- `POST /cores/{id}/attach` — record an attachment to a thread (used by Ask).

Every endpoint enforces:

- Caller has a Firebase ID token (existing middleware).
- Caller has `read | edit | own` access to the core based on `cores.owner_uid` and `core_grants` resolved at request time.
- Mutations write to `core_audit` in the same transaction.
- Responses are owner-scoped; rows the caller cannot see are filtered server-side.

The router lives next to the existing `analyze.py`, `chapters.py`, `graph.py`, `memory.py`, `notifications.py`, `pipeline.py`, `reason.py`, `tabs.py`, `workspace.py`. None of those move. `cores.py` is added.

---

## 4. The Ask PRAXIS routing endpoint

A new router `backend/routers/ask.py` exposes the command plane:

- `POST /ask` — body: `{ query, mode, situation_id, attached_core_ids[], thread_id? }`.
- `GET /ask/threads` — list threads owned by caller, filterable by Situation.
- `GET /ask/threads/{id}` — full thread with messages, attached cores, citations.
- `POST /ask/threads/{id}/promote` — promote a message into a memo, a research thread, or a graph candidate.
- `DELETE /ask/threads/{id}` — soft-archive.

Behaviour of `POST /ask`:

1. Resolve attached cores (User Core implicit, Situation Core implicit if not provided, plus user-attached).
2. Build the four-layer calibration block via the existing `withCalibration` contract — no new context system, the existing one is correct.
3. Run the routing layer (Track D §3): pick `direct | skill | subagent_plan | clarify`.
4. Stream the response: text tokens, then citations, then mutation card payloads if any.
5. Persist the thread, the messages, and a `core_audit` `attach` event for any cores touched.

Streaming uses the existing AI SDK posture (`ai`, `@ai-sdk/google`, `@ai-sdk/google-vertex`, `@ai-sdk/react`).

Rate limits, retries, and observability hooks reuse the patterns in `analyze.py` and `reason.py`.

---

## 5. Owner scoping (the rule that keeps the multi-tenant model honest)

`audit:owner-scoping` and `audit:owner-scoping-runtime` are the most important guardrails in this codebase. Track B must keep both green.

The rule:

- **Every** new table has `owner_uid text NOT NULL`.
- **Every** new endpoint reads `request.user.uid` from the verified Firebase token and filters by `owner_uid` (with team_id resolution for shared rows).
- **Team sharing is opt-in** — a row is private to its `owner_uid` until a `core_grant` exists.
- **No cross-user joins** without an explicit grant lookup.
- **Audit trail** — every read of a shared row writes to `core_audit` with `action='read'` only when the row belongs to another user. Same-owner reads are not audited.

Firestore rules mirror this: `users/{uid}/...` collections require `request.auth.uid == uid` for read and write. Cross-user reads go through Postgres-only paths.

The MT-1..5 decisions in `docs/architecture/MULTI_TENANT_MODEL.md` must be resolved before Team Cores ship. Codex must not implement Team Cores beyond the schema until those rows are marked APPROVED.

---

## 6. Migrations and backfill

Migration sequence for v7:

- `0019_cores_baseline.py` — `cores`, `core_grants`, `core_audit`, indexes.
- `0020_cores_linkage.py` — add `core_id uuid` to existing tables (`situations`, `source_receipts`, `documents`, `graph_nodes`, `graph_edges`, `memos`, `drafts`, `boardroom_briefings`, `recipe_runs`, `research_threads`).
- `0021_cores_backfill.py` — for each existing situation, insert a `cores` row of kind `situation` and update linked rows' `core_id`. For each user, insert a `cores` row of kind `user` from their existing profile. Source/Document/Graph/Output cores derive from their parent situation 1:1.
- `0022_ask_threads.py` — `ask_threads`, `ask_messages`, `ask_message_citations`. Owner-scoped.

Each migration:

- Has a `downgrade()` that is real, tested, and reversible.
- Runs in CI against an ephemeral Postgres before merging.
- Records its result in `STATUS.md`.

Production application of migrations is gated by the existing Cloud Build job. Don't apply 0019–0022 to prod until Track A slices 1–4 are ready to be flipped on.

---

## 7. Cognee binding (still optional, still honest)

`backend/services/cognee_memory.py` is the only module allowed to import the Cognee SDK. That stays.

In v7, Cognee fits as the optional memory layer that improves recall when assembling cores into a calibration block. Specifically:

- During Ask, after attached cores are resolved, the backend asks the memory layer for additional retrieved fragments tagged with the same `owner_uid`, `case_id`, and ontology binding.
- If `COGNEE_ENABLED=false` or the service is unreachable, the memory layer returns empty arrays. **The product still works.** This is `audit:cognee-ui-honesty` territory.
- If enabled, retrieved fragments are surfaced in the Ask response as "Memory recall" citations, marked as candidate, capped at 0.6 confidence, never auto-promoted.
- Cognee never writes to `graph_nodes` or `graph_edges`. Promotion is human-only via `MutationConfirmCard`.

The Cognee Postgres database (`praxis_cognee`) stays isolated from the main `praxis` database. RLS scripts in `backend/migrations/sql/cognee_rls_apply.sql` continue to enforce `owner_uid` isolation inside Cognee.

The toggle lives under **Cores Library → Settings → Memory** in the new shell.

---

## 8. AI provider posture

Vertex is the default. Routing logic for which model to use sits in `src/lib/ai/` and in `docs/architecture/MODEL_SELECTION.md`. Codex must not bypass it.

Specific guardrails:

- Model strings are centralized. New code references constants from the existing model matrix, not literal strings. `audit:ai-provider-vertex-default` and `audit:model-matrix-coverage` enforce.
- The Ask routing layer can pick a cheaper model for `Quick` mode and a richer model for `Deep research` and `Memo` modes. The choice is explicit and logged.
- Calibrated-AI-tier skills wrap their AI call with `withCalibration`. New skills follow the same pattern.

If the rewrite needs a model not in the matrix, propose it via ADR before adding.

---

## 9. Observability

The repo already wires OpenTelemetry, Sentry, and Cloud Logging. Don't change the wiring; add to it.

Each new endpoint and skill emits:

- A trace span named `praxis.<area>.<operation>` (e.g., `praxis.cores.create`, `praxis.ask.run`).
- Structured log events with `request_id`, `owner_uid`, `team_id` (if any), `core_ids[]`, `model_id`, `mode`.
- Sentry breadcrumbs for user-impacting failures.
- Counters in `monitoring/` dashboards: cores created per day, ask requests per day, skill-run success rate, mutation-card acceptance rate, Cognee recall yield.

`audit:observability-coverage` and `audit:telemetry-coverage` continue to pass.

A new dashboard `monitoring/v7_dashboard.json` collects: % of Ask requests answered with citations, % with at least one core attached besides User+Situation, p95 first-token latency by mode, error rates per destination.

---

## 10. Security

- All endpoints require a verified Firebase ID token.
- All endpoints check ownership/grants before responding.
- Secrets in Secret Manager; nothing in the repo. `audit:gcp` enforces.
- CSRF: existing posture, no change.
- CSP: tighten on the new shell. Inline scripts banned, hashes only.
- Rate limits: per-uid, per-endpoint. Reuse the existing limiter.
- The Ask endpoint is rate-limited more aggressively than reads (e.g., 60/min per uid, 600/hour).
- Logging never includes raw query text by default; only when an admin-only debug flag is set, with the user's consent banner.

`SECURITY.md` is updated to mention cores and Ask endpoints with the same rigor as graph endpoints today.

---

## 11. Deployment

The pipeline doesn't change shape. It changes content.

- `cloudbuild.yaml` — full pipeline: builds backend image, frontend image, deploys both, applies Firestore rules + indexes, applies Cloud Storage rules, runs the audit gate. Used when backend or shared infra changed.
- `cloudbuild.frontend.yaml` — frontend-only, faster. Used when only `src/` changed.

Codex updates `cloudbuild.yaml` to:

- Run `alembic upgrade head` against the production Postgres in a manual-approval step before flipping the v7 flag in slice 9.
- Run a smoke test against `/ask` after deploy.
- Re-apply `firestore.indexes.json` and `firestore.rules`.

Domain mapping (`praxis.tacitus.me` → `praxis-frontend`) and HTTPS load balancer are already configured. No DNS changes needed.

`STATUS.md` is updated after every prod deploy, including which migrations applied.

---

## 12. Local dev

`docker-compose.yml` already runs Neo4j and FalkorDB locally. v7 adds:

- A Postgres + pgvector container alongside `backend` (replace or augment Neo4j as the dev KG once 0019–0022 are stable).
- A Cognee mock container that returns canned recalls (so dev can exercise both `disabled` and `enabled` paths without a real Cognee instance).

Dev secrets via `.env.local` (gitignored). Real GCP creds via ADC, never copied into containers.

`README.md` is updated with the v7 dev quickstart: `docker compose up`, `npm run dev`, sign in with the demo user, see Home.

---

## 13. Audits to add (Track B specific)

- `audit:cores-schema` — `cores`, `core_grants`, `core_audit` exist with the required columns and indexes; linkage columns exist on the joined tables.
- `audit:cores-owner-scoping` — every `cores`-touching query filters by `owner_uid` or resolves a grant.
- `audit:ask-thread-shape` — `ask_threads` and `ask_messages` exist with required columns; every Ask request writes one thread + one message + zero or more citation rows.
- `audit:cores-router-coverage` — all endpoints in the router have request validation + auth + audit-write.
- `audit:cognee-isolation` (existing, keep green) — Cognee imports only inside `cognee_memory.py`.
- `audit:vertex-default` (existing, keep green) — no direct OpenAI / Anthropic SDK imports outside the allowlist.

These run inside `npm run audit:gate`. The Python equivalents (a few exist already, e.g., `audit:owner-scoping-runtime`) live under `scripts/audit_*.py` and are wired into the same gate.

---

## 14. Performance budget (backend)

- `POST /ask` Quick mode: p95 first-token < 1.5 s, full response < 6 s on 90% of requests with attached cores ≤ 5.
- `GET /cores`: p95 < 250 ms with up to 200 cores in scope.
- `POST /cores/{id}/fork`: p95 < 800 ms with up to 1k linked rows.
- Postgres connection pool sized for concurrent bursts; Cloud SQL CPU autoscaling rules updated.
- Cold-start budget: backend Cloud Run revisions warm-pool of 1, scale to N under load.

`monitoring/v7_dashboard.json` tracks all of the above.

---

## 15. Rollback

Each slice has a clean rollback:

- Frontend: flip `NEXT_PUBLIC_PRAXIS_V7=false` in Cloud Run env, redeploy. Old shell back instantly.
- Backend routers: feature flag `PRAXIS_V7_BACKEND` gates `cores.py` and `ask.py` registration in `main.py`. Off → endpoints 404, old endpoints still serve.
- Migrations: every migration has a real `downgrade()`. Rollback path documented in the migration's PR.
- Linkage backfill: reversible because `core_id` columns are nullable; setting them back to NULL has no side effect on existing queries.

The cutover (slice 9) is a one-week canary: 5% → 25% → 100% by uid hash. Measured via `monitoring/v7_dashboard.json`.

---

## 16. Open questions for GC

These need a decision before slice 1 ships. Codex must not invent answers.

1. **Team Cores scope.** The MT-1..5 decisions are still pending. Until `MULTI_TENANT_MODEL.md` is APPROVED, Team Cores ship as schema-only (no UI). Confirm this is acceptable.
2. **Public link sharing.** Are public read-only core links a v7 feature, or v7.1? Default is v7.1 unless GC says otherwise.
3. **Cognee enablement.** Default off in v7. When GC wants to flip it on for a tenant, the `Cores Library → Settings → Memory` toggle and the `praxis_cognee` infra must both be ready. Track on `STATUS.md`.
4. **Billing posture.** Polar is wired (`@polar-sh/nextjs`). v7 doesn't change billing surfaces — Pricing page stays as-is. Confirm.
5. **Demo data.** The Syria demo is currently a route. v7 makes it a seeded Situation Core. Confirm seeding script can run on every deploy or whether to gate it.

These go in `docs/v7/OPEN_QUESTIONS.md` and stay there until resolved.

---

## 17. What "backend done" looks like

The Track B definition of done:

- Migrations 0019–0022 applied in prod. Linkage backfill complete. `audit:cores-schema` green.
- `cores.py` and `ask.py` routers in production, behind `PRAXIS_V7_BACKEND=true`. All endpoints owner-scoped, audit-logged.
- Cognee remains optional and honest. `audit:cognee-ui-honesty` and `audit:cognee-isolation` green.
- Vertex routing intact. `audit:ai-provider-isolation` and `audit:ai-provider-vertex-default` green.
- Observability dashboard `v7_dashboard.json` deployed and showing real traffic.
- Smoke tests in Cloud Build pass against `/ask` and `/cores`.
- `praxis.tacitus.me` serves both legacy and v7 paths during canary, then v7 only after cutover.
- `STATUS.md` says Track B v7 shipped.
