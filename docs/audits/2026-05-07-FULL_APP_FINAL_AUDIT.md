# PRAXIS Full App Final Audit

Date: 2026-05-07
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Baseline commit audited: `276cf95c`
Production URL: `https://praxis.tacitus.me`

## Executive Summary

PRAXIS is in a strong coded-and-tested state for the May 2026 product surface.
The full repository gate passes, the public production routes are responding,
the live public demo visualization suite passes in a real browser, the core GCP
runtime is healthy, and the app has durable audit coverage across the master
charter, workbench, dashboard, boardroom, ontology, context, tools, firewall,
owner scoping, visualization, extraction, analytics, memo studio, KG backend,
and production posture.

The main remaining gap is not local implementation; it is production activation
of the newly scaffolded worker services from Packs 30 and 31. The code,
contracts, Cloud Build configs, Terraform modules, tests, and audit gates exist,
but the following worker services are not yet live in Cloud Run:
`extract-docling`, `extract-ner-gliner`, `extract-graphrag`,
`sanctions-yente`, and `simulate-policy-abm`.

## Verification Evidence

Commands run successfully on 2026-05-07:

- `npm run audit:gate`
- `npm run build`
- `npm run test` -> 142 test files, 562 tests passed
- `npm run audit:gcp` -> hard failures 0, soft warnings 0
- `npm run audit:gcp-production-posture` -> hard failures 0, soft warnings 3
- `PLAYWRIGHT_BASE_URL=https://praxis.tacitus.me npx playwright test tests/e2e/visualization` -> 4 passed

Production route checks:

- `/` -> 200
- `/demo/syria-2024` -> 200
- `/waitlist` -> 200
- `/login` -> 200
- `/legal/privacy` -> 200
- `/app/workbench` -> 307 to `/login?mode=demo&example=syria-2026&redirect=%2Fapp%2Fworkbench`
- `/api/health` -> 200 with `firestore`, `ai_provider`, `cookie_secret`, and `vertex_adk` all `ok`; `polar` is `unconfigured`

Cloud Run inventory in `us-central1`:

- `praxis-frontend` ready
- `praxis-backend` ready
- `gdelt-poller` ready
- `on-document-uploaded` ready
- `on-situation-created` ready
- Dialectica services also present

## Implemented And Coded

Core product:

- Landing page, public demo, waitlist, legal pages, login, app shell, dashboard,
  workbench, settings, admin surfaces, and demo case routes are present and
  covered by route/build audits.
- Workbench supports the consolidated app flow with situations, context,
  graph, tools, memos, boardroom, ACH, research, library, draft, and settings
  surfaces.
- Empty states, transparency cards, evidence drawer, tool context isolation,
  owner scoping, symbolic firewall coverage, context-aware coverage, and
  context type parity are all audited.

AI and context:

- AI provider isolation, Vertex default posture, model matrix coverage, route
  calibration, context-aware wrappers, cost telemetry, and GCP/Vertex secrets
  are audited.
- Tool execution uses the v2 marketplace contract with 57 curated tools and
  7 subagents covered by skills and semantic/canary audits.

Ontology and knowledge graph:

- Nine ontologies pass mapping, version, classifier, and context audits.
- KG backend, Postgres schema current audit, Neo4j example drift check, and
  graph viewer uniqueness audit pass.

Packs 29-31:

- Pack 29 visualization: force graph, timeline, map, graph inspector, and Desk
  inline chronology are implemented and browser-tested.
- Pack 30 extraction/GraphRAG: Docling, GLiNER, and GraphRAG worker scaffolds,
  orchestration contracts, chunker, adapters, marketplace tools, cost telemetry
  contract, and license gates are implemented.
- Pack 31 analytics/sanctions/simulation: NetworkX analytics, additive metrics
  writer, yente client and owner-scoped metadata helper, sanctions UI badge,
  Mesa ABM worker scaffold, marketplace tools, and license gates are implemented.

## Remaining Work

S1 - Production worker activation:

- Build and deploy Pack 30 workers: `extract-docling`,
  `extract-ner-gliner`, `extract-graphrag`.
- Build and deploy Pack 31 workers: `sanctions-yente`,
  `simulate-policy-abm`.
- Wire the production backend environment to those worker service URLs.
- Run live document extraction, GraphRAG, sanctions matching, and ABM smoke
  tests against staging or production.

S1 - Authenticated user-flow proof:

- The public production demo browser suite passes. A full signed-in user smoke
  still needs a durable test account or scripted auth fixture so `/app/*`
  flows can be verified beyond auth redirects.
- Priority flows: create/open situation, run marketplace tool, draft/export
  memo, run boardroom, upload/retrieve document, inspect graph.

S2 - GCP production posture warnings:

- Upload bucket public access prevention reports as `inherited`; acceptable but
  worth making explicit if the org allows.
- The current account cannot inspect `gs://praxis-terraform-state`; grant
  `storage.buckets.get` or document why that check is intentionally delegated.
- Cloud Armor policy check is reported as a warning by the posture script; make
  the script distinguish configured policy from missing policy.

S2 - Payments/config:

- `/api/health` reports `polar` as `unconfigured`. This is acceptable if
  payments are intentionally disabled, but should be reflected in launch copy
  and runbooks.

S2 - Worker monitoring:

- After worker deployment, bind Pack 30/31 metrics to Cloud Monitoring:
  GLiNER reduction, GraphRAG batch cost, yente latency, ABM runtime/cost, and
  worker error rates.

## Local Repository Cleanup

Safe generated artifacts removed:

- `test-results`
- `.code-review-graph`
- `.pytest_cache`
- `backend/.pytest_cache`
- `.next/dev/cache/turbopack`
- Python `__pycache__` folders under backend and worker services

Large directories intentionally kept:

- `node_modules` (~1.46 GB): required for immediate local development.
- `backend/.venv` inside `backend` size (~837 MB including dependencies):
  required for Python-side worker/backend testing.
- `.next` (~443 MB after cleanup): current build output and cache from the
  successful final gate.
- `.env.local`: required local configuration; never remove automatically.

## Next Reference Queue

Use this file as the current handoff checkpoint before starting the next build
loop. The app is green by local and public production checks, but the next
meaningful work should focus on:

1. Deploy Pack 30/31 worker services and wire URLs.
2. Add a durable authenticated browser smoke suite.
3. Resolve or document the three GCP production posture warnings.
4. Decide whether `polar` remains intentionally unconfigured for launch.
5. Add live worker metrics dashboards after deployment.

