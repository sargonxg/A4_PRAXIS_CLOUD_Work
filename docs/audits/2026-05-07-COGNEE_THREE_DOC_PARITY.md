# Cognee Three-Document Parity

Date: 2026-05-07
Sources:
- `C:\Users\giuli\Downloads\COGNEE_ARCHITECTURE.md`
- `C:\Users\giuli\Downloads\COGNEE_IMPLEMENTATION.md`
- `C:\Users\giuli\Downloads\COGNEE_OPERATIONS.md`

## Status

The Cognee work is implemented as a disabled-first PRAXIS memory layer. The
repo now contains the architecture guardrails, code surface, operations assets,
audits, and Workbench entry point needed to continue toward live enablement.

Cognee is not enabled in production by default. That is intentional. The three
source documents require owner-controlled Cloud SQL/IAM/Cloud Run operations
before live recall/remember can be switched on.

## Implemented

| Area | Evidence |
|---|---|
| Cognee SDK isolation | `backend/services/cognee_memory.py`; `npm run audit:cognee` |
| Disabled-safe wrapper | `backend/services/cognee_memory.py`; `backend/tests/test_cognee_memory.py` |
| ACO bridge table | `backend/migrations/versions/0013_cognee_bridge.py` |
| Symbolic firewall DDL | `backend/migrations/versions/0014_cognee_provenance_firewall.py` |
| Cognee database setup SQL | `backend/migrations/sql/cognee_database_setup.sql` |
| Cognee table RLS wrapper | `backend/migrations/sql/cognee_rls_apply.sql` |
| Vertex-only provider guard | `backend/ai/providers.py`; `scripts/audit-embedding-dim.ts` |
| No OpenAI/Anthropic egress test | `backend/tests/test_cognee_no_openai_egress.py` |
| FastAPI memory routes | `backend/routers/memory.py`; mounted at `/api/v1/memory/*` and `/v1/memory/*` |
| Frontend authenticated proxy | `src/app/api/memory/[...slug]/route.ts` |
| Credit metering for live recall/cognify | `src/lib/api/with-credits.ts`; `src/app/api/memory/[...slug]/route.ts` |
| Frontend client helpers | `src/lib/memory/client.ts` |
| Workbench Memory tab | `src/components/memory/MemoryPanel.tsx`; `src/lib/workbench/tabs.ts` |
| Private service deploy script | `infrastructure/deploy-cognee.sh` |
| Kuzu snapshot script + scheduler manifest | `infrastructure/cognee-kuzu-snapshot.sh`; `infrastructure/scheduler/cognee-kuzu-snapshot.yaml` |
| Cloud Monitoring dashboard definition | `monitoring/dashboards/cognee.json` |
| Cognee alert policy extensions | `infrastructure/monitoring-alerts.sh` |
| GCP setup scaffolding | `infrastructure/setup-gcp.sh` |
| Operations runbook | `docs/runbooks/MEMORY_LAYER_RUNBOOK.md` |
| ADR and architecture docs | `docs/adr/0049-cognee-memory-layer-disabled-first.md`; `docs/architecture/COGNEE_MEMORY_LAYER.md`; `docs/architecture/KG_BACKEND.md` |

## Deliberately Gated

These are not marked complete because they require live infrastructure,
operator approval, or a real canary:

- Create `praxis_cognee` in Cloud SQL and run setup SQL.
- Apply RLS wrapper after Cognee has created managed tables.
- Deploy private `praxis-cognee` Cloud Run service.
- Grant `praxis-frontend-sa` invoke permission on `praxis-cognee`.
- Publish Cloud Monitoring dashboard and alert policies.
- Run live Firebase-token remember/recall smoke tests.
- Run cross-tenant integration tests against staging data.
- Execute 5 percent canary and verify rollback.

## Validation Commands

Expected local gates:

```bash
npm run audit:cognee
npm run audit:embedding-dim
npm run audit:cognee-operations
npm run audit:firewall-coverage
npm run audit:runbook-bundle
npm run typecheck
npm run build
```

Focused backend tests:

```bash
pytest backend/tests/test_cognee_memory.py backend/tests/test_cognee_bridge.py backend/tests/test_cognee_firewall.py backend/tests/test_cognee_no_openai_egress.py backend/tests/test_cognee_tenant_isolation.py -q
```

## Remaining Product Follow-Up

The Memory tab currently provides recall and candidate rejection. Promotion is
still intentionally conservative: canonical graph promotion should be wired to
the existing graph review queue/NodeRepo flow, not directly from the memory
panel, so firewall and audit-log behavior remains centralized.
