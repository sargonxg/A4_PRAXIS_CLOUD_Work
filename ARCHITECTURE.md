# PRAXIS Architecture

Last updated: 2026-04-30.

PRAXIS is a dual-service GCP application:

- Next.js 16 frontend and API gateway on Cloud Run.
- Private Python FastAPI backend on Cloud Run for graph, extraction, pipeline,
  and analysis work.
- Firebase Auth and Firestore as the user/session/situation source of truth.
- Google Cloud services for AI, storage, queues, scheduled work, observability,
  and deploy automation.

The active multi-agent improvement plan is
`docs/PRAXIS_SUPERPLAN_2026-04-29.md`. It extends this architecture into
concrete implementation lanes for product identity, AI evidence, testing,
security, cloud, and observability.

## Product Shape

The app has two primary experiences:

- Public/demo surfaces: landing, pricing, login, and `/demo/*` routes.
- Authenticated workspace: `/app/*` routes for situations, dashboard, tools,
  reports, documents, settings, and admin/operator surfaces.

The core user journey is:

1. User signs in.
2. User completes onboarding and creates an AnalystProfile.
3. User creates or selects a situation.
4. AI routes assemble calibrated context from profile, situation, domain, and
   Situation Knowledge Core retrieval.
5. Tools produce cited, saved, reusable outputs.
6. Ask PRAXIS, reports, graph workflows, and exports reuse those outputs.

## Frontend

- Routes: `src/app`.
- Authenticated workspace: `src/app/app`.
- Demo mirror: `src/app/demo`.
- API routes: `src/app/api`.
- Shared app chrome: `src/components/app`.
- Tool shell and product trust UI: `src/components/praxis`.
- Domain/tool constants: `src/lib/constants`.
- State: `src/stores` with Zustand.
- Data hooks: `src/hooks`.

## Backend

- Entry point: `backend/main.py`.
- Auth/trust boundary: `backend/auth.py`.
- Routers: `backend/routers`.
- ACO pipeline: `backend/graphify_tacitus`.
- Services: `backend/services`.
- Agent runtime foundations: `backend/agents`.

The backend is private Cloud Run. Browser clients should not call it directly.
Next.js API routes call it server-side with Cloud Run OIDC.

## Data Model

Primary Firestore shapes:

- `users/{uid}`: user/account/billing summary.
- `users/{uid}/profile/analyst`: AnalystProfile.
- `users/{uid}/situations/{situationId}`: situation metadata.
- Situation subcollections for graph, tool outputs, documents, reports,
  settings, events, graph updates, and staged graph proposals.
- Operational spine collections: `tool_runs`, `background_jobs`,
  `system_events`, and user notifications.

## GraphOps and DIALECTICA Context

PRAXIS treats Firestore as the canonical situation context store. Neo4j Aura,
FalkorDB, and future Spanner Graph integrations are derived indexes for
traversal, pathfinding, and advanced graph analytics, not the first source of
truth.

Current graph paths:

- `users/{uid}/situations/{situationId}/graph/main`: approved graph snapshot
  used by PRAXIS tools.
- `users/{uid}/situations/{situationId}/graph/staged`: temporary graph rebuild
  waiting for analyst approval.
- `users/{uid}/situations/{situationId}/graph/snapshot-{iso}`: time-stamped
  snapshots for diffing and evolution review.
- `users/{uid}/situations/{situationId}/graph_updates/{proposalId}`:
  evidence-backed proposed node/edge mutations.

The GraphOps surface normalizes this into a maintenance contract:

- Pure summary builder: `src/lib/graph/graphops.ts`.
- Firestore admin reader: `src/lib/graph/graphops-service.ts`.
- API: `GET /api/graph/ops?situationId=...`.
- Dashboard UI: Situation Launchpad GraphOps panel.

GraphOps reports approved vs proposed items, provenance coverage, temporal
coverage, low-confidence items, orphan nodes, node/edge type distribution, and
the next maintenance action. This is the bridge toward the future DIALECTICA
backbone: canonical Firestore records stay reviewable and auditable while
Neo4j can be populated as a powerful derived graph index.

## AI Contract

Every authenticated AI route must use `withCalibration` unless documented as
exempt. The calibration block includes:

- Analyst profile.
- Situation frame.
- Domain frame.
- Retrieval/SKC context.
- Output constraints for language, red lines, audience, schema, and citations.

See `docs/CONTEXT_INJECTION.md` for the full contract.

The dashboard now includes a dedicated executive intelligence path:

- Route: `POST /api/ai/situation-intelligence`.
- Schema: `src/lib/ai/schemas/situation-intelligence.ts`.
- UI: `src/components/dashboard/executive-intelligence-panel.tsx`.
- Persistence: route records `saveToolOutput`; the dashboard also stores the
  successful response through `tool-data/situation-intelligence` so users can
  reopen prior analyses.
- Output contract: executive panel, strategic insight, causal timeline, actor
  dossiers, scenarios, risk scoring, actions, graph nodes/edges, provenance,
  confidence, and timestamped export data.

## Operational Spine

Long-running or high-value work must be observable and idempotent through:

- `tool_runs`.
- `background_jobs`.
- `system_events`.
- `users/{uid}/notifications`.

See `docs/OPERATIONAL_SPINE.md`.

## Deeper References

- `README.md`: high-level architecture and file map.
- `CLAUDE.md`: agent operating guide.
- `docs/CONTEXT_INJECTION.md`: AI prompt/context contract.
- `docs/OPERATIONAL_SPINE.md`: jobs/events/notifications contract.
- `docs/CORPUS_ARCHITECTURE.md`: Situation Knowledge Core.
- `docs/GCP_OPERATIONS.md`: cloud operations.
- `docs/PRODUCTION_TODO_2026-04-28.md`: long-form historical backlog.
- `docs/PRAXIS_SUPERPLAN_2026-04-29.md`: current hyper-detailed execution plan.
