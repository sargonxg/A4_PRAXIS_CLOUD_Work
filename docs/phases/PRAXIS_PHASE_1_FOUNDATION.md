# PRAXIS Phase 1 — Foundation

**Status:** Ships first. No user-visible change. Lays the rails for Phases 2 and 3.
**Constraints:** Neo4j Aura is the only graph index. Cloud SQL Postgres is the only relational + vector + memory store. Vertex AI Gemini is the only AI provider. Firestore stays canonical and unchanged.
**Audience:** Codex (orchestrator + subagents).
**Deploys to:** `praxis.tacitus.me`

---

## 0. What Phase 1 ships

A clean foundation. Six things become true at the end:

1. The 80-doc `/docs/` tree is collapsed to 12 canonical docs. Older docs sit under `/docs/_archive/`.
2. Cloud SQL Postgres is provisioned with `pgvector`, `pg_trgm`, `pgcrypto`, RLS policies, and PgBouncer in front of every backend connection.
3. Neo4j Aura is provisioned and a one-way sync from Firestore `graph/main` to Neo4j is running.
4. Every node and edge in the graph has bi-temporal columns (`validFrom`, `validTo`, `assertedFrom`, `assertedTo`).
5. Model-string discipline is enforced by lint. Anthropic, Firecrawl, Tavily, Parallel.ai are removed from the codebase.
6. The calibration audit (`npm run audit:routes`) and the spine audit (`scripts/audit-spine.ts`) are wired into CI as merge gates.

No user-facing change. The shipped value is *trust* — every later change can rely on the foundation.

---

## 1. Pre-flight (must be true before any subagent fans out)

- [ ] Working tree is clean: `git status` is empty.
- [ ] Branch `phase/1-foundation` is created from `main` and pushed.
- [ ] Cloud SQL Postgres instance exists in the `praxisbytacitus` project. Confirm: `gcloud sql instances describe praxisbytacitus-instance`.
  - Production uses the existing private-IP instance `praxisbytacitus:us-east4:praxisbytacitus-instance` to avoid provisioning a second paid Postgres instance. The Phase 1 application database is `praxis`, user is `praxis_app`, and password secret is `praxis-db-password`.
- [ ] Neo4j Aura instance exists, connection URI in Secret Manager as `NEO4J_URI`. Confirm: `gcloud secrets versions access latest --secret=NEO4J_URI`.
- [ ] Codex has read this file fully. No other doc is loaded into context yet.

---

## 2. Reference material Codex must load

Before the first lane begins, Codex `view`s these files to understand existing shape (read-only, do not modify in this phase unless listed):

| File | Why |
|---|---|
| `CLAUDE.md` | Repo conventions, security boundaries, model discipline rules |
| `AGENTS.md` | Hard rules, validation gate, deploy procedure |
| `cloudbuild.yaml` and `cloudbuild.frontend.yaml` | Existing CI/CD shape |
| `infrastructure/setup-gcp.sh` | Existing GCP provisioning |
| `infrastructure/deploy-backend.sh`, `deploy-frontend.sh` | Deploy mechanics |
| `backend/config.py` | Existing pydantic-settings schema |
| `backend/main.py` | Backend entry point and middleware |
| `src/lib/ai/providers.ts` | Single source of model strings |
| `firestore.rules` | Owner-only data isolation |
| `src/middleware.ts` | Edge-runtime CSP/HSTS — DO NOT TOUCH in this phase |

External docs to consult (no need to load fully; cite when relevant):

- LangGraph PostgresSaver: <https://langchain-ai.github.io/langgraph/how-tos/persistence_postgres/>
- pgvector docs: <https://github.com/pgvector/pgvector>
- Neo4j Aura connection patterns: <https://neo4j.com/docs/aura/>
- Cloud SQL Postgres connection from Cloud Run: <https://cloud.google.com/sql/docs/postgres/connect-run>

---

## 3. Subagent lanes

```
                  Lane Y — Pre-flight + Postgres bootstrap
                                 │
        ┌──────────┬─────────────┼────────────┬──────────┐
        A          B             C            D          E
       Docs       Postgres      Neo4j +      Lint       CI gates
       hygiene    schema +      bi-temporal  + cleanup
                  RLS                        of deps
                                 │
                       Lane G — Synthesis & verification
                                 │
                       Lane DEPLOY — Merge + Cloud Build
```

Lanes A through E run in parallel after Lane Y.

### Lane Y — Pre-flight & Postgres bootstrap (sequential, runs first)

**Brief.** Provision the application database role, install extensions, write the Alembic baseline, and bring up PgBouncer as a sidecar on the backend Cloud Run service.

**Files in scope:**
- `backend/migrations/alembic.ini` (new)
- `backend/migrations/env.py` (new)
- `backend/migrations/versions/0001_baseline.py` (new)
- `backend/services/postgres.py` (new — async pool + tenant session helper)
- `backend/config.py` (extend — add `DATABASE_URL`, `PGBOUNCER_HOST`, `PGBOUNCER_PORT`)
- `infrastructure/pgbouncer/Dockerfile` (new)
- `infrastructure/pgbouncer/pgbouncer.ini` (new)
- `infrastructure/pgbouncer/userlist.txt.template` (new)
- `cloudbuild.yaml` (extend — add PgBouncer container build + Cloud Run sidecar config)

**Files NOT to touch:** anything outside the list above.

**Todo list:**

- [ ] Add `psycopg[binary,pool]>=3.2`, `pgvector>=0.3`, `alembic>=1.13` to `backend/pyproject.toml`.
- [ ] Write `backend/migrations/versions/0001_baseline.py`:
  - `CREATE EXTENSION IF NOT EXISTS vector;`
  - `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
  - `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
  - Create role `praxis_app` with no superuser, no createdb, no createrole.
  - Helper SQL function `current_tenant() RETURNS text` that reads `current_setting('app.tenant_id', true)`.
- [ ] Implement `backend/services/postgres.py` with:
  - `pool: AsyncConnectionPool` (psycopg pool)
  - `@asynccontextmanager async def tenant_session(uid: str)` that opens a connection, sets `SET LOCAL app.tenant_id = $uid`, yields, releases.
  - `async def verify_extensions()` that asserts the three extensions exist.
- [ ] PgBouncer config: `pool_mode = transaction`, `max_client_conn = 200`, `default_pool_size = 25`, `server_reset_query = DISCARD ALL`.
- [ ] `cloudbuild.yaml` extension: build pgbouncer image, push to Artifact Registry, deploy backend Cloud Run service with `--add-cloudsql-instances` and the sidecar.

**Acceptance:**
- [ ] `cd backend && alembic upgrade head` runs clean.
- [ ] `psql $DATABASE_URL -c "SELECT extname FROM pg_extension"` shows `vector`, `pg_trgm`, `pgcrypto`.
- [ ] Backend Cloud Run service exposes port 8080 and reaches Postgres through PgBouncer on `localhost:6432`.
- [ ] `pytest backend/tests/test_postgres_smoke.py -v` passes (test included below).

**Test to write** — `backend/tests/test_postgres_smoke.py`:

```python
import pytest
from services.postgres import pool, tenant_session, verify_extensions

@pytest.mark.asyncio
async def test_extensions_installed():
    await verify_extensions()  # raises if missing

@pytest.mark.asyncio
async def test_tenant_session_isolation():
    async with tenant_session("user_a") as conn:
        result = await conn.fetchval("SELECT current_setting('app.tenant_id')")
        assert result == "user_a"
    async with tenant_session("user_b") as conn:
        result = await conn.fetchval("SELECT current_setting('app.tenant_id')")
        assert result == "user_b"

@pytest.mark.asyncio
async def test_pool_recycles_connections():
    for _ in range(50):
        async with tenant_session("test") as conn:
            assert await conn.fetchval("SELECT 1") == 1
```

---

### Lane A — Docs consolidation

**Brief.** Reduce `/docs/*.md` from ~80 files to 12 canonical docs. Move the rest under `/docs/_archive/` with `git mv` so history is preserved. Update `CLAUDE.md` and `AGENTS.md` "read before code" lists to the new short list.

**Files in scope:** `/docs/*`, `CLAUDE.md`, `AGENTS.md`. Do not touch any code file.

**Canonical 12:**

```
README.md                                          (root)
CLAUDE.md                                          (root)
AGENTS.md                                          (root)
ARCHITECTURE.md                                    (root)
TODO.md                                            (root)
CHANGELOG.md                                       (root)
docs/CONTEXT_INJECTION.md
docs/OPERATIONAL_SPINE.md
docs/CORPUS_ARCHITECTURE.md
docs/GCP_OPERATIONS.md
docs/COMPLIANCE.md
docs/PRAXIS_TECHNICAL_SPECIFICATION.md             (= spec v2 from earlier)
```

The three Phase docs (this file plus its siblings for Phase 2 and Phase 3) live at `/docs/phases/PRAXIS_PHASE_{1,2,3}_*.md` and are also canonical.

**Todo list:**

- [ ] `mkdir docs/_archive`
- [ ] For every `.md` in `/docs/` not on the canonical list: `git mv docs/X.md docs/_archive/X.md`.
- [ ] Update `CLAUDE.md` "Agent Handoff" section: replace the 25-doc list with the 12 canonical + 3 phase docs.
- [ ] Update `AGENTS.md` "Read Before Code" list similarly.
- [ ] Drop the `compass_artifact_*` link from `CLAUDE.md` (move file to `_archive`).
- [ ] Verify `find docs/ -maxdepth 1 -name "*.md" | wc -l` ≤ 12 (excluding `phases/` subdirectory).

**Acceptance:**
- [ ] `npm run lint && npx tsc --noEmit && npm run build` all pass.
- [ ] No code file is in the diff.
- [ ] `git log --diff-filter=R` shows the renames (preserved history).

**Verification:** `git status && git diff --stat` — diff is doc-only.

---

### Lane B — Postgres schema for Phase 1 use

**Brief.** Migrations 0002–0010 from the Context Backbone spec. Every table with tenant data has `tenant_id` NOT NULL, RLS enabled, and a `USING (tenant_id = current_tenant())` policy. HMAC-chained audit log with INSERT-only trigger.

**Files in scope:** `backend/migrations/versions/000{2..10}_*.py` only.

**Todo list (one migration per checkbox, all idempotent, all reversible):**

- [ ] `0002_embeddings.py` — `embeddings` table with `vector(768)` column, HNSW index `vector_cosine_ops` (m=16, ef_construction=64), RLS.
- [ ] `0003_agent_memory.py` — `agent_memory` table with `embedding`, `importance`, `use_count`, RLS, HNSW.
- [ ] `0004_tool_runs_analytics.py` — denormalized `tool_runs_analytics` with indexes on `(uid, started_at DESC)` and `(situation_id, started_at DESC)`.
- [ ] `0005_cost_ledger.py` — `cost_ledger` with unique `(tenant_id, uid, situation_id, day, source, source_id)` and `(tenant_id, situation_id, day)` index.
- [ ] `0006_trust_scores.py` — historical scores per export per paragraph.
- [ ] `0007_saved_queries.py` — Cypher console with version history.
- [ ] `0008_audit_log.py` — partitioned by month, HMAC trigger, INSERT-only trigger blocking UPDATE/DELETE.
- [ ] `0009_canonical_actors.py` — `canonical_actors` with GIN trigram indexes on `canonical_name` and `aliases`.
- [ ] `0010_partitions_setup.py` — initial monthly partitions for `audit_log` covering current and next 6 months.

**Acceptance:**
- [ ] Every migration runs clean both forward (`alembic upgrade head`) and backward (`alembic downgrade -1` then `upgrade head`).
- [ ] Every table with `tenant_id` has `pg_class.relrowsecurity = true`.
- [ ] Audit log INSERT works; UPDATE and DELETE are rejected by trigger.
- [ ] `pytest backend/tests/test_phase1_schema.py -v` passes.

**Test to write** — `backend/tests/test_phase1_schema.py`:

```python
import pytest
from services.postgres import tenant_session

@pytest.mark.asyncio
async def test_rls_blocks_cross_tenant():
    async with tenant_session("alice") as conn:
        await conn.execute(
            "INSERT INTO embeddings (tenant_id, subject_type, subject_id, content, embedding, model) "
            "VALUES ('alice', 'doc_chunk', 'd1', 'x', '[0,...]'::vector, 'gemini-embedding-2-preview')"
        )
    async with tenant_session("mallory") as conn:
        rows = await conn.fetch("SELECT * FROM embeddings")
        assert len(rows) == 0   # RLS blocks read

@pytest.mark.asyncio
async def test_audit_log_insert_only():
    async with tenant_session("alice") as conn:
        await conn.execute(
            "INSERT INTO audit_log (tenant_id, actor_uid, actor_kind, action, this_hash) "
            "VALUES ('alice', 'alice', 'user', 'test.action', E'\\\\x00')"
        )
        with pytest.raises(Exception):
            await conn.execute("UPDATE audit_log SET action = 'other'")
        with pytest.raises(Exception):
            await conn.execute("DELETE FROM audit_log")

@pytest.mark.asyncio
async def test_trgm_actor_match():
    async with tenant_session("alice") as conn:
        await conn.execute(
            "INSERT INTO canonical_actors (tenant_id, canonical_name, aco_type) "
            "VALUES ('alice', 'Hayat Tahrir al-Sham', 'armed_group')"
        )
        rows = await conn.fetch(
            "SELECT canonical_name, similarity(canonical_name, $1) AS sim "
            "FROM canonical_actors WHERE canonical_name % $1 ORDER BY sim DESC",
            "Hay'at Tahrir al Sham"
        )
        assert len(rows) == 1
        assert rows[0]["sim"] > 0.5
```

---

### Lane C — Neo4j Aura sync + bi-temporal columns

**Brief.** Stand up the one-way Firestore → Neo4j sync. Add bi-temporal columns to every node and edge in both stores. Backfill existing graphs with `assertedFrom = createdAt`, `validFrom = null`.

**Files in scope:**
- `backend/services/neo4j_client.py` (new)
- `backend/services/firestore_to_neo4j_sync.py` (new — replaces any FalkorDB / Spanner code)
- `src/lib/graph/neo4j-sync.ts` (new — frontend-side helper for OIDC-mediated calls; not a direct Neo4j client)
- `src/lib/graph/canonical-graph.ts` (extend — add bi-temporal fields)
- `src/types/conflict-graph.ts` (extend — bi-temporal fields)
- `backend/graphify_tacitus/schemas/*.py` (extend — bi-temporal fields)
- `scripts/migrate-bitemporal.ts` (new — backfill)
- `scripts/verify-neo4j-sync.ts` (new)
- `infrastructure/setup-neo4j.sh` (new — replaces any `setup-spanner.sh` / `setup-falkor.sh`)
- Delete: any `falkor_client.py`, `spanner_*.py`, `*falkor*.ts` references.

**Todo list:**

- [ ] Provision Neo4j constraints and indexes via `setup-neo4j.sh`:
  - `CREATE CONSTRAINT actor_id IF NOT EXISTS FOR (a:Actor) REQUIRE a.id IS UNIQUE;` (and same for the other 13 ACO labels)
  - `CREATE CONSTRAINT tenant_required IF NOT EXISTS FOR (n) REQUIRE n.tenantId IS NOT NULL;`
  - `CREATE INDEX ON :Actor(tenantId);` (and same for other labels)
- [ ] `backend/services/neo4j_client.py`:
  - Use `neo4j` Python driver. Connection from Secret Manager.
  - `async def merge_node(label, props, tenant_id)` — parametrized MERGE.
  - `async def merge_edge(from_id, to_id, type, props, tenant_id)` — parametrized MERGE.
  - `async def query(cypher, params, tenant_id)` — wraps every call with `WHERE n.tenantId = $tenantId` enforcement at the driver level.
- [ ] `firestore_to_neo4j_sync.py`:
  - Listens to Firestore document changes on `users/{uid}/situations/{sit}/graph/main`.
  - For each change, computes the diff (added/modified/removed nodes and edges) and emits MERGE/SET Cypher.
  - Idempotent: re-running the same sync produces no change.
  - `assertedTo` is set on retired nodes/edges, never `DELETE`.
- [ ] Add bi-temporal fields to TypeScript types and Python schemas.
- [ ] `scripts/migrate-bitemporal.ts`: scans every situation in Firestore, sets `assertedFrom = createdAt`, `validFrom = null` on every node and edge missing the fields.
- [ ] `scripts/verify-neo4j-sync.ts`: picks 10 random situations, asserts node and edge counts match between Firestore and Neo4j.
- [ ] Delete every reference to FalkorDB and Spanner Graph in `src/`, `backend/`, `infrastructure/`. Verify with `rg "falkor|spanner|graphiti"`.

**Acceptance:**
- [ ] A node written to Firestore appears in Neo4j within 5 seconds.
- [ ] Re-running the sync on the same Firestore state produces no Neo4j writes (idempotent).
- [ ] All existing situations have bi-temporal fields after `migrate-bitemporal.ts`.
- [ ] `rg "falkor|spanner|graphiti" src/ backend/ infrastructure/` returns zero matches.
- [ ] `pytest backend/tests/test_neo4j_sync.py -v` passes.

**Test to write** — `backend/tests/test_neo4j_sync.py`:

```python
import pytest
from services.neo4j_client import Neo4jClient
from services.firestore_to_neo4j_sync import sync_situation

@pytest.mark.asyncio
async def test_sync_creates_nodes(neo4j_test_db, firestore_emulator):
    # Seed Firestore
    await firestore_emulator.set("users/alice/situations/sit1/graph/main", {
        "nodes": [{"id": "n1", "label": "Actor", "name": "State A",
                   "assertedFrom": "2026-05-01T00:00:00Z"}],
        "edges": []
    })
    await sync_situation("alice", "sit1")
    # Verify in Neo4j
    rows = await neo4j_test_db.run("MATCH (a:Actor {id:'n1'}) RETURN a.name AS n")
    assert rows[0]["n"] == "State A"

@pytest.mark.asyncio
async def test_sync_is_idempotent(neo4j_test_db, firestore_emulator):
    await sync_situation("alice", "sit1")
    count_before = await neo4j_test_db.run("MATCH (n) RETURN count(n) AS c")
    await sync_situation("alice", "sit1")
    count_after = await neo4j_test_db.run("MATCH (n) RETURN count(n) AS c")
    assert count_before == count_after

@pytest.mark.asyncio
async def test_tenant_isolation_in_cypher(neo4j_test_db):
    client = Neo4jClient()
    rows = await client.query("MATCH (n) RETURN n", params={}, tenant_id="alice")
    for row in rows:
        assert row["n"]["tenantId"] == "alice"
```

---

### Lane D — Drop Anthropic, Firecrawl, Tavily, Parallel.ai + model lint

**Brief.** Remove every non-Gemini AI dependency and every premium-search dependency. Add an ESLint rule that flags forbidden model strings outside `providers.ts`.

**Files in scope:**
- `package.json`
- `src/lib/ai/providers.ts`
- `src/lib/ai/firecrawl.ts` (delete)
- `src/lib/ai/web-research.ts` (rewrite — grounded Google Search only)
- `src/lib/ai/tools.ts` (remove `webSearch` premium provider branches)
- `src/lib/crypto/envelope.ts` (BYOK schema: keep `google_ai_key` only)
- `src/lib/firebase/preferences-service.ts` (remove deleted key references)
- `eslint.config.mjs`
- `.eslintrc-rules/no-forbidden-models.js` (new)

**Todo list:**

- [ ] In `package.json` `dependencies`: remove `@ai-sdk/anthropic`, `@mendable/firecrawl-js`, `parallel-web`. Run `npm install`.
- [ ] Rewrite `getAnalysisModel()` in `providers.ts`:
  ```ts
  export function getAnalysisModel(): LanguageModel {
    return getDeepThinkModel('high');
  }
  export function getDeepThinkModel(level: 'low' | 'medium' | 'high'): LanguageModel {
    if (process.env.PRAXIS_USE_GEMINI_31 === 'true') {
      try { return createModel('gemini-3.1-pro-preview'); } catch { /* fall through */ }
    }
    return createModel(MODEL_PRO);  // gemini-2.5-pro
  }
  ```
- [ ] Delete `src/lib/ai/firecrawl.ts`. In `src/lib/ai/web-research.ts`, simplify to grounded Google Search via `getGroundedModel()`.
- [ ] In `src/lib/ai/tools.ts`, the `webSearch` tool drops Tavily / Parallel branches; uses `executeWebResearch` only.
- [ ] BYOK schema: only `google_ai_key`. Migration script `scripts/strip-removed-byok-keys.ts` for any user document that still has the deleted fields.
- [ ] Custom ESLint rule `no-forbidden-models`:
  ```js
  module.exports = {
    create(context) {
      const FORBIDDEN = /gemini-(2\.0|3-pro-preview)|claude-|gpt-|firecrawl|tavily|parallel-web/i;
      return {
        Literal(node) {
          if (typeof node.value === 'string' && FORBIDDEN.test(node.value)) {
            const file = context.getFilename();
            if (!file.endsWith('providers.ts')) {
              context.report({ node, message: `Forbidden string "${node.value}" outside providers.ts` });
            }
          }
        },
      };
    },
  };
  ```
- [ ] Wire the rule into `eslint.config.mjs`.

**Acceptance:**
- [ ] `rg "claude-|firecrawl|tavily|parallel-web|@ai-sdk/anthropic" src/ backend/` returns zero outside `package.json`'s removal diff.
- [ ] A planted violation (`const x = "claude-sonnet-4"`) in any file but `providers.ts` fails `npm run lint`.
- [ ] `npm run build` succeeds.
- [ ] `pytest backend/tests/test_providers.py -v` passes (verify Python provider helpers don't reference dropped models).

---

### Lane E — CI gates: calibration audit + spine audit + model-lint + smoke

**Brief.** Make four gates fail-the-build:

1. `npm run audit:routes` — every AI route scores 11/11 on calibration.
2. `npx tsx scripts/audit-spine.ts` — no new async work bypasses `tool_runs` / `background_jobs` / `system_events`.
3. `npm run lint` — model-lint rule from Lane D.
4. `npm run smoke:public` — Playwright smoke test (already exists).

**Files in scope:**
- `scripts/audit-ai-routes.mjs` (extend — exit non-zero on score < 11)
- `scripts/audit-spine.ts` (new)
- `cloudbuild.yaml` (add the four gates as build steps before deploy)

**Todo list:**

- [ ] Modify `audit-ai-routes.mjs`: collect score per route; if any < 11, print the failing dimensions and `process.exit(1)`.
- [ ] `scripts/audit-spine.ts`:
  - Diff against `origin/main`.
  - For every changed `.ts` file under `src/app/api/`, parse the AST.
  - If the file declares an async handler that writes to Firestore but does not import any of `withCalibration`, `tool_runs`, `background_jobs`, `system_events` — fail.
- [ ] `cloudbuild.yaml`:
  ```yaml
  steps:
    - id: lint
      name: node:20
      entrypoint: bash
      args: ['-c', 'npm ci && npm run lint']
    - id: typecheck
      name: node:20
      entrypoint: bash
      args: ['-c', 'npx tsc --noEmit']
    - id: audit-routes
      name: node:20
      entrypoint: bash
      args: ['-c', 'npm run audit:routes']
    - id: audit-spine
      name: node:20
      entrypoint: bash
      args: ['-c', 'npx tsx scripts/audit-spine.ts']
    - id: build
      name: node:20
      entrypoint: bash
      args: ['-c', 'npm run build']
    - id: backend-tests
      name: python:3.11
      entrypoint: bash
      args: ['-c', 'cd backend && pip install -e ".[test]" && pytest tests/ -v']
    # ... existing build-and-deploy steps follow
  ```

**Acceptance:**
- [ ] A planted route score of 10 fails CI.
- [ ] A planted async writer without spine integration fails CI.
- [ ] A clean tree passes all four gates.

---

### Lane G — Synthesis & verification

**Brief.** After A–E merge into `phase/1-foundation`, the orchestrator runs the full verification suite. No code changes in this lane unless something failed.

**Verification:**

```bash
# Type / lint / build
npx tsc --noEmit
npm run lint
npm run build

# Forbidden patterns (must return zero)
rg "gemini-2\.0|gemini-3-pro-preview|claude-|gpt-|firecrawl|tavily|parallel-web" src/ backend/
rg "falkor|spanner|graphiti" src/ backend/ infrastructure/
rg "MemorySaver|InMemorySaver" backend/ --type py | grep -v tests/

# Calibration + spine audits
npm run audit:routes
npx tsx scripts/audit-spine.ts

# Schema + RLS
cd backend && alembic upgrade head && alembic check
cd backend && pytest tests/test_phase1_schema.py tests/test_postgres_smoke.py tests/test_neo4j_sync.py -v

# Frontend tests
npx vitest run

# Playwright smoke
npm run smoke:public
```

**All commands above must pass.** If anything fails, the orchestrator opens the failing lane back up.

---

## 4. Commit + deploy to `praxis.tacitus.me`

**Step 1 — Subagent merges into `phase/1-foundation`:**

```bash
# Each lane runs:
git add -A
git commit -m "<conventional-commit>: <one-line description>"
git push origin landing/v1-{lane}
# PR into phase/1-foundation
```

**Conventional-commit scopes for this phase:**

```
chore(docs):    Lane A — doc consolidation
feat(backend):  Lane Y, B, C
chore(deps):    Lane D — dropped providers
ci:             Lane E — gates
```

**Step 2 — Phase synthesis:**

```bash
git checkout phase/1-foundation
git pull
# Run Lane G verification (above) — all green
git tag phase-1-foundation-rc1
git push origin phase-1-foundation-rc1
```

**Step 3 — Merge to main:**

```bash
# PR phase/1-foundation → main with this file linked in description
# After approval and CI green:
git checkout main
git pull
git merge --no-ff phase/1-foundation
git push origin main
```

**Step 4 — Cloud Build deploy (automatic on push to main):**

The push to `main` triggers `cloudbuild.yaml`. The pipeline runs:

1. Lint, typecheck, audit gates, build (per Lane E).
2. Build backend image → Artifact Registry → deploy to Cloud Run service `praxis-backend`.
3. Apply Alembic migrations against Cloud SQL Postgres as a one-shot Cloud Run job:
   ```yaml
   - id: db-migrate
     name: gcr.io/cloud-builders/gcloud
     entrypoint: bash
     args:
       - '-c'
       - |
         gcloud run jobs execute praxis-db-migrate \
           --region us-central1 --wait --project praxisbytacitus
   ```
4. Build frontend image → Artifact Registry → deploy to Cloud Run service `praxis-frontend`.
5. Smoke test against `https://praxis.tacitus.me/api/health`.

**Step 5 — Post-deploy verification (manual, by orchestrator):**

```bash
# Health
curl -fsSL https://praxis.tacitus.me/api/health | jq .

# Backend reachable through OIDC (use your gcloud identity-token)
gcloud run services proxy praxis-backend --region us-central1 &
curl -fsSL http://localhost:8080/health

# Verify Postgres extensions in production
gcloud sql connect praxisbytacitus-instance --user=praxis_app --database=praxis -- \
  -c "SELECT extname FROM pg_extension WHERE extname IN ('vector','pg_trgm','pgcrypto');"

# Verify Neo4j sync
npx tsx scripts/verify-neo4j-sync.ts --production
```

If any step fails, **roll back** by deploying the previous Cloud Run revision:

```bash
gcloud run services update-traffic praxis-frontend --to-revisions=PREVIOUS=100 --region us-central1
gcloud run services update-traffic praxis-backend  --to-revisions=PREVIOUS=100 --region us-central1
```

---

## 5. Definition of done

- [ ] All five lanes merged into `main`.
- [ ] `cloudbuild.yaml` ran green on the merge commit.
- [ ] `https://praxis.tacitus.me/api/health` returns 200.
- [ ] Postgres has the three extensions and ten Phase-1 tables.
- [ ] Neo4j has constraints and indexes on every ACO label.
- [ ] `rg "(falkor|spanner|graphiti|firecrawl|tavily|parallel-web|claude-|gpt-)" src/ backend/ infrastructure/` returns zero.
- [ ] Tag `phase-1-foundation-shipped` is pushed: `git tag phase-1-foundation-shipped && git push origin phase-1-foundation-shipped`.

---

## 6. Codex orchestrator prompt (paste-ready)

```
You are the orchestrator for PRAXIS Phase 1 — Foundation.
Read /docs/phases/PRAXIS_PHASE_1_FOUNDATION.md fully. It is the only source of truth.
Do not read other docs unless that doc is referenced inside it.

Pre-flight: confirm the checklist in §1. If any item is false, stop and ask.

Lane Y runs first, sequentially.
Lanes A, B, C, D, E run in parallel after Y.
Lane G is verification, runs after all five lanes merge into phase/1-foundation.

Hard rules:
- Never bypass RLS. Never SET ROLE. Never DISABLE ROW LEVEL SECURITY.
- Never instantiate MemorySaver / InMemorySaver in production code.
- Every Postgres query goes through tenant_session(uid).
- No file outside a lane's "files in scope" list may be touched by that lane.
- Every commit follows Conventional Commits.

Begin Lane Y. Report back when ready to fan out.
```

---

## 7. Subagent prompts (paste-ready)

### Lane Y
```
You are subagent Y. Your lane is Lane Y — Pre-flight & Postgres bootstrap.
Read /docs/phases/PRAXIS_PHASE_1_FOUNDATION.md §3 Lane Y only.
Files in scope and forbidden listed there. Hold the boundary.
Branch from phase/1-foundation. Push when green.
Verification: §3 Lane Y "Acceptance" + the test in test_postgres_smoke.py.
```

### Lane A
```
You are subagent A. Your lane is Lane A — Docs consolidation.
Read /docs/phases/PRAXIS_PHASE_1_FOUNDATION.md §3 Lane A only.
Use git mv (not delete + add) so history is preserved.
Branch from phase/1-foundation. No code files in your diff.
```

### Lane B
```
You are subagent B. Your lane is Lane B — Postgres schema for Phase 1.
Read /docs/phases/PRAXIS_PHASE_1_FOUNDATION.md §3 Lane B only and the
schema section of /docs/PRAXIS_TECHNICAL_SPECIFICATION.md if referenced.
Every table needs RLS. HMAC chain on audit_log is sacred.
Verify: pytest backend/tests/test_phase1_schema.py.
```

### Lane C
```
You are subagent C. Your lane is Lane C — Neo4j Aura sync + bi-temporal.
Read /docs/phases/PRAXIS_PHASE_1_FOUNDATION.md §3 Lane C only.
Delete every falkor/spanner/graphiti reference. Sync must be idempotent.
Every Cypher read enforces tenantId.
Verify: pytest backend/tests/test_neo4j_sync.py + scripts/verify-neo4j-sync.ts.
```

### Lane D
```
You are subagent D. Your lane is Lane D — Drop non-Gemini providers.
Read /docs/phases/PRAXIS_PHASE_1_FOUNDATION.md §3 Lane D only.
Custom ESLint rule no-forbidden-models added to eslint.config.mjs.
Verify: a planted "claude-sonnet-4" outside providers.ts must fail npm run lint.
```

### Lane E
```
You are subagent E. Your lane is Lane E — CI gates.
Read /docs/phases/PRAXIS_PHASE_1_FOUNDATION.md §3 Lane E only.
Four gates: lint, audit:routes, audit-spine.ts, smoke. Wire into cloudbuild.yaml
BEFORE the deploy steps. A planted violation in any gate must fail CI.
```

Phase 2 begins after this phase's deploy is verified green.
