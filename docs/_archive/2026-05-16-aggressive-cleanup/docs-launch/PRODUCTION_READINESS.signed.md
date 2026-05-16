# Production Readiness

Date: 2026-05-06

Status: engineering-prepared, owner signature pending.

Latest engineering verification snapshot:

- Commit: `4669e02ebd222513553589573586a070afbe5c44`
- Cloud Run revision: `praxis-frontend-00262-vdn`
- Cloud Build: `4e76a579-73bf-447a-bee1-00033850783b`
- `npm run audit:gate`: passed on 2026-05-07 with 138 Vitest files and 552 tests.
- Production smoke: public demo, waitlist, login callback, legal routes,
  Workbench Tools, memo-tool marketplace search, `cross.memo-create` run, and
  evidence drawer passed with zero console/page errors.
- Production health: `https://praxis.tacitus.me/api/health` returned HTTP 200
  with `status: ok`; Firestore, AI provider, cookie secret, and Vertex ADK were
  `ok`; Polar remains `unconfigured`.
- Public demo Lighthouse: performance 87, accessibility 95 on
  `/demo/user-case-2024`; this is below the Pack 18 launch target and remains open.
- Master charter posture: launch foundation is verified; strict v1.0.0 charter sign-off remains pending.

Checks required before a public launch claim:

- `npm run audit:gate` passes.
- Production deploy succeeds.
- `https://praxis.tacitus.me/api/health` returns healthy.
- Workbench demo login opens the example case.
- Ontology, Graph, Tools, and Memos tabs render in production.
- Reality check and roadmap documents are present.

Owner signature:

- Name:
- Date:
- Notes:
