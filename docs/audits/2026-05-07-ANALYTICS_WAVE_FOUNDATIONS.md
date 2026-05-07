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

## Deployment Reality

NetworkX is ready for in-process backend use once the backend image includes the
new Python dependencies. The yente and ABM services are committed as Cloud Run
worker scaffolds and Terraform modules; they still need explicit builds,
service URLs, and production verification before being described as live.

## Verification Targets

- 57 marketplace tools.
- Network analytics deterministic with fixed Louvain seed.
- Sanctions data licensing documented separately from MIT code use.
- ABM output consistently says scenario stress-test, not prediction.
- No new categories, ontologies, or graph primitives.

