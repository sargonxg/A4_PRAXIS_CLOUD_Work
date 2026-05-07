# Pack 31 Analytics, Sanctions, and Simulation Foundations

## Scope

This pass implements the Pack 31 foundation after Pack 30: graph analytics,
sanctions matching scaffolding, and policy simulation scaffolding.

## Implemented

- `backend/services/analytics/network_metrics.py` computes betweenness,
  eigenvector centrality, PageRank, closeness, Louvain communities, and k-core
  values over NetworkX graphs.
- `backend/services/analytics/firewall_metrics_writer.py` writes additive
  owner-scoped `graph_nodes.metrics` metadata and graph audit entries.
- Migration `0012_graph_nodes_metrics.py` adds `metrics jsonb`.
- yente sidecar scaffold at `services/sanctions-yente`.
- OpenSanctions client and index sync contract under `backend/services/sanctions`.
- Mesa-style ABM worker scaffold at `services/simulate-policy-abm` with
  `escalation_ladder_with_mediator`.
- Marketplace tools `analyze.network`, `match.sanctions`, and
  `simulate.policy_abm` in the existing `cross` category.
- Force graph centrality sizing toggle and entity panel sanctions badge support.
- License audit extended for NetworkX, python-louvain, FollowTheMoney, Rigour,
  yente/OpenSanctions code posture, and Mesa worker dependencies.
- Second-pass hardening: the active Pack 29 graph entity inspector now renders
  Pack 31 `metadata.sanctions[]` matches with review posture and
  OpenSanctions links.
- Second-pass hardening: yente matching now has an owner-scoped Actor metadata
  update payload helper so matches cannot be persisted without `owner_uid` and
  `case_id`.
- Second-pass hardening: the ABM worker deploy config now targets the existing
  `praxis` Artifact Registry repository, not the nonexistent `praxis-workers`
  repository.
- Third-pass verification: Pack 29-31 audit gates, focused Pack 31 tests,
  typecheck, build, full Vitest, and GCP hard checks passed on 2026-05-07.

## Deployment Reality

NetworkX is ready for in-process backend use once the backend image includes the
new Python dependencies. The yente and ABM services are committed as Cloud Run
worker scaffolds and Terraform modules; they still need explicit builds,
service URLs, and production verification before being described as live.
On 2026-05-07, `gcloud run services list --region=us-central1
--project=praxisbytacitus` showed `praxis-backend` and `praxis-frontend` live,
but not `sanctions-yente` or `simulate-policy-abm`.

## Verification Targets

- 57 marketplace tools.
- Network analytics deterministic with fixed Louvain seed.
- Sanctions data licensing documented separately from MIT code use.
- ABM output consistently says scenario stress-test, not prediction.
- No new categories, ontologies, or graph primitives.
