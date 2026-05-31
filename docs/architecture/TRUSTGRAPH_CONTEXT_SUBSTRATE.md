# TrustGraph Context Substrate

Last reviewed: 2026-05-31

## Position

TrustGraph is an optional, disabled-first derived context substrate for PRAXIS.
It may hold capsule projections, graph paths, ontology extraction output,
embeddings, and explainability traces, but it is not the canonical store for
ContextCapsules.

Canonical PRAXIS state remains:

- Firestore for owner-scoped ContextCapsules, context stacks, user-facing state,
  review cards, and capsule version history.
- Cloud SQL/Postgres for agent run ledgers, Capsule+ graph rows, and operational
  joins where already configured.
- Capsule+ for portable graph proposal/export bundles.

TrustGraph output is advisory until a human applies a PRAXIS review card.

## Upstream Basis

TrustGraph is Apache-2.0 licensed, so PRAXIS can use, modify, and build a
custom service around it while preserving license and notice obligations. The
initial PRAXIS strategy is adapter-first: keep upstream TrustGraph intact, add a
private bridge, and fork only if upstream extension points cannot support PRAXIS
tenancy, processors, or capsule schemas.

Primary references:

- TrustGraph license: https://github.com/trustgraph-ai/trustgraph/blob/master/LICENSE
- Context Cores: https://docs.trustgraph.ai/guides/context-cores/
- GraphRAG: https://docs.trustgraph.ai/guides/graph-rag/
- Ontology RAG: https://docs.trustgraph.ai/guides/ontology-rag/
- Custom processing: https://docs.trustgraph.ai/guides/building/custom-processing.html
- GCP deployment: https://docs.trustgraph.ai/deployment/gcp.html

## Bridge Contract

PRAXIS calls a private `praxis-trustgraph-bridge` service, not a browser-exposed
TrustGraph gateway. The app-side contract is defined in
`src/lib/knowledge/trustgraph-contract.ts`.

Required endpoints:

- `POST /v1/capsules/sync` - accepts owner/capsule scope, capsule version,
  source/document/output/memory refs, and `advisoryOnly: true`.
- `POST /v1/capsules/recall` - returns provenance-bound advisory hits,
  graph-candidate IDs, and explainability IDs.
- `POST /v1/capsules/graph-propose` - converts selected candidates into PRAXIS
  review-card-ready graph proposal payloads.
- `GET /v1/capsules/:capsuleId/status` - returns sync/readiness state for the
  owner/capsule collection.

Every request is owner/capsule scoped. The default TrustGraph workspace mode is
`owner-capsule`; `owner` mode is reserved for later cross-capsule retrieval.

## Capsule Mapping

TrustGraph collections/context cores should mirror the PRAXIS capsule anatomy:

| PRAXIS core | TrustGraph projection |
| --- | --- |
| User | durable preferences, role, red lines, review heuristics |
| Situation | problem frame, jurisdiction, geography, actors, decision context |
| Source | receipts, links, source tiers, source gaps |
| Document | chunks, spans, embeddings, extraction metadata |
| Graph | actors, claims, commitments, relationships, proposed facts |
| Time | validity windows, events, deadlines, freshness posture |
| Tool | allowed tools, method path, action limits |
| Objective | decision question, monitoring goal, handover aim |
| Product | memo/brief/board-pack/handover family |
| Output | audience, tone, citation posture, export rules |
| Memory | tacit assumptions, decisions, preferences, caveats, open questions |

TrustGraph recall injects only provenance-bound hits into the PRAXIS turn
capsule. Hits without source/document/run/path provenance are ignored and
recorded in the enrichment receipt.

## App-Side Readiness

The PRAXIS app can now prepare both sides of the bridge contract without
standing up the new service:

- `src/lib/knowledge/trustgraph-contract.ts` defines the disabled-first bridge
  schemas for sync, recall, graph proposal, and status.
- `src/lib/knowledge/trustgraph-capsule-sync.ts` compiles a normalized
  ContextCapsule v3 into advisory-only TrustGraph segments across identity,
  user/tacit knowledge, situation, path, source, document, graph, time, tools,
  objective, product, output, memory, ontology, governance, and review cards.
- `src/lib/knowledge/context-enrichment-adapter.ts` can call the future bridge
  for recall and records used/ignored TrustGraph hits separately from canonical
  capsule state.
- Health and feature routes expose TrustGraph as optional/unconfigured until
  `TRUSTGRAPH_ENABLED=true` and `TRUSTGRAPH_BACKEND_URL` are set.

This means the remaining work before production use is service-side wiring and
ops proof, not capsule modeling inside the Next.js app.

## Deployment Path

The safe MVP keeps `TRUSTGRAPH_ENABLED=false` by default and validates the
adapter against mocked bridge responses. Once a local round trip is green,
deploy the bridge on Cloud Run and TrustGraph on GKE. Cloud Run is appropriate
for the bridge; GKE is the target for TrustGraph because upstream deployment is
multi-service and Kubernetes-oriented.

Rollback is setting `TRUSTGRAPH_ENABLED=false`. Disabled mode must preserve
stable receipts and must not degrade Ask PRAXIS.

Pre-deploy checklist:

- Implement `praxis-trustgraph-bridge` against the schemas in
  `trustgraph-contract.ts`.
- Stand up upstream TrustGraph in GKE with private ingress, tenant/capsule
  isolation, logs, health checks, and budget controls.
- Point `TRUSTGRAPH_BACKEND_URL` at the private bridge and keep
  `TRUSTGRAPH_ENABLED=false` until local sync/recall/status round trips pass.
- Run the app verification gates, then enable in a controlled environment and
  verify Ask PRAXIS receipts show advisory TrustGraph paths without canonical
  capsule mutation.
