# PRAXIS — Codex Pack 31: Analytics, Sanctions & Simulation Wave

**File**: `PRAXIS_CODEX_31_ANALYTICS_SANCTIONS_SIMULATION_WAVE.md`
**Branch**: `feature/analytics-sanctions-simulation-wave`
**Depends on**: Pack 30 merged. v1.6.0 tagged. Docling + GLiNER + GraphRAG live. Force-graph + timeline + map visualizations live (Pack 29). 9 ontologies × 12 surfaces × 12 subagents stack stable.
**Estimated effort**: ~3 days (~24 engineering hours).
**Target release**: v1.7
**Voice**: Senior backend engineer who has shipped graph analytics, compliance/sanctions screening, and agent-based modeling separately and knows the right way to integrate each into a workbench. Three more permissive libraries; three more concrete capabilities the user can demo on Tuesday.

---

## 0. Why this pack exists

After packs 29-30, PRAXIS has substantial new visualization and ingestion infrastructure. Three categories of analytical capability remain absent:

**(1) Graph analytics on the case graph itself.** PRAXIS stores `graph_nodes` and edges in Postgres but has no built-in centrality, community detection, or structural metrics. The user can see the graph (Pack 29's force-directed view) but cannot ask "which actors are the brokers?" or "what are the de-facto coalitions?" or "which edges form the resilient backbone?" These are the textbook tools for coalition analysis, narrative spread, sanctions evasion networks — exactly the questions a conflict-and-diplomacy workbench should answer.

**(2) Sanctions and PEP matching.** Half of conflict-and-diplomacy work touches sanctions designations, beneficial ownership, illicit finance, war-economy actors. PRAXIS extracts Actor entities but cannot match them against the OFAC SDN List, EU sanctions lists, UN 1267 lists, or PEP databases. Without this, an analyst working on Russia/Ukraine, Iran, Sudan, Venezuela, or Myanmar has to copy-paste names into another tool. The capability gap is severe and embarrassing for the product positioning.

**(3) Policy stress-testing via simulation.** PRAXIS today is descriptive (what is happening) and analytical (why and how it connects). It is not yet prescriptive (what happens if the EU adds a sanction tier, what happens if mediation cadence changes, what happens if a coalition fractures). Agent-based modeling is the standard tool for these "what if" questions and is genuinely demanded by policy customers — but it must be positioned correctly as scenario stress-test, not prediction.

The OSS sourcing report identified three permissively-licensed libraries that close these gaps:

1. **NetworkX (BSD-3-Clause) + python-louvain (BSD-3-Clause)**: the standard Python graph-analytics stack. NetworkX provides centrality (betweenness, eigenvector, PageRank, closeness), shortest paths, k-core decomposition; python-louvain (and NetworkX 3.x's built-in `nx.community.louvain_communities` / `leiden_communities`) provides community detection. Pure Python with optional C extensions. Smallest pick by lines of code; highest leverage-per-line.

2. **OpenSanctions yente + FollowTheMoney + Rigour (all MIT)**: the only credible open-source stack for sanctions/PEP/beneficial-ownership entity resolution. yente is a FastAPI service that exposes `/match` (rank matches for a given entity), `/search`, `/entities/{id}`, and a Reconciliation API. FollowTheMoney provides the Person/Organization/Company/Sanction/Ownership ontology that maps cleanly to PRAXIS's ACO Actor primitive. Rigour provides name + country + identifier normalization. **Code is unconditionally MIT**; data licensing is a separate commercial conversation with OpenSanctions (free for non-commercial; paid for commercial production).

3. **Mesa 3 (Apache-2.0)**: the leading Python ABM framework. Define `Agent` and `Model` classes, place agents in space (grid, hex, network, Voronoi), step the simulation, collect data via `DataCollector`, batch-run for parameter sweeps. JOSS paper "Mesa 3: Agent-based modeling with Python in 2025" published April 2025. Pair with OpenSpiel (Apache-2.0, DeepMind) for game-theoretic equilibria when the question demands a solver, not a simulation.

Three structural decisions:

**(A) NetworkX runs in-process; sanctions and Mesa run as Cloud Run workers.** NetworkX is a pure-Python library with low memory overhead and per-call latency in the milliseconds-to-seconds range — a normal direct import in the FastAPI app. yente needs OpenSearch or Elasticsearch and benefits from independent scaling, so it's a Cloud Run sidecar. Mesa simulations have unbounded runtime per scenario, so they're Cloud Run workers with timeout discipline.

**(B) Three new v2-contract tools in `cross-cutting` category.** `analyze.network` (NetworkX), `match.sanctions` (yente), `simulate.policy_abm` (Mesa). Marketplace count goes 54 → 57. NO new categories. NO new ontologies. NO new graphical primitives.

**(C) OpenSanctions data licensing is a separable conversation.** The code path ships in this pack; the dataset choice (public-archive bucket for development, paid commercial subscription for production) is a procurement decision deferred to closer to first paying commercial customer. The integration works on day one with the public archive.

After this pack: the user opens a Sudan case, runs `analyze.network`, sees that General Hemedti has betweenness centrality 0.47 (highest in the graph) and is the broker between two coalitions; runs `match.sanctions`, sees that 12 of the 80 Actors in the graph have OFAC or EU designations with full provenance; runs `simulate.policy_abm` with the "tighter sanctions tier" scenario and gets a 30-step trajectory showing the coalition fractures by step 18. Three concrete demonstrations of why PRAXIS is a serious tool, not a generic LLM wrapper.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | NetworkX + python-louvain integrated in-process; new module `backend/services/analytics/network_metrics.py` provides betweenness, eigenvector, PageRank, closeness centrality + Louvain communities | Unit tests on synthetic graphs |
| 2 | New v2-contract tool `analyze.network` registered in `cross-cutting` category; Pack 21 makes it 55 tools | `audit:tool-contract-v2` reports 55 tools |
| 3 | NetworkX results write back to `graph_nodes.metrics` JSONB through firewall (additive, never destructive); force-graph viewer (Pack 29) optionally renders centrality as node size | E2E: run `analyze.network` → metrics persisted → force-graph reflects sizes |
| 4 | OpenSanctions yente deployed as Cloud Run sidecar `services/sanctions-yente/`; backed by managed OpenSearch | Yente `/healthz` green; sample `/match` returns ranked results |
| 5 | yente indexed against the public OpenSanctions dataset (free for development); commercial licensing path documented | Index size ~5 GB; query latency P95 ≤300ms |
| 6 | New v2-contract tool `match.sanctions` registered in `cross-cutting` category; chains from Actor extraction stage; results persist as `Actor.metadata.sanctions[]` through firewall | `audit:tool-contract-v2` reports 56 tools |
| 7 | FollowTheMoney + Rigour integrated as in-process Python deps for name/country normalization in the existing extraction pipeline | Existing extraction pipeline tests pass with normalized names |
| 8 | Mesa 3 deployed as Cloud Run worker `services/simulate-policy-abm/`; one canonical scenario template (escalation ladder with mediator parameter) shipped at v1 | E2E: run scenario → trajectory returned → renders in Recharts panel |
| 9 | New v2-contract tool `simulate.policy_abm` registered in `cross-cutting` category | `audit:tool-contract-v2` reports 57 tools |
| 10 | One ADR: 0048 (analytics/sanctions/simulation as cross-cutting tools — when each fires, cost ceilings, output discipline, sanctions data licensing posture) | ADR reviewed |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 31. I understand:
> 1. **Three new tools, three different deployment shapes.** NetworkX runs in-process (it's a Python library, not a service). yente runs as a Cloud Run sidecar with managed OpenSearch backend. Mesa 3 runs as a Cloud Run worker with timeout discipline.
> 2. **All three register as v2-contract tools in `cross-cutting` category.** No new categories. No new ontologies. No new graphical primitives. Marketplace 54 → 57.
> 3. **Sanctions data licensing is a separable conversation.** The code is MIT. The data has two tiers: free for non-commercial development and evaluation, paid for commercial production. PRAXIS deploys against the public-archive bucket on day one; OpenSanctions data subscription is procured before the first paying commercial customer.
> 4. **Mesa is positioned as scenario stress-test, not prediction.** All UI labels, memo annexes, and tool descriptions reflect this. Pack 18's intellectual-honesty discipline applies.
> 5. **NetworkX writes additive `metrics` JSONB on graph_nodes through firewall.** Never destructive. Centrality recomputed on graph change. Determinism: Louvain seed persisted in provenance.
> 6. **License floor: MIT / Apache-2.0 / BSD-3-Clause / ISC.** Verified: NetworkX BSD-3, python-louvain BSD-3, yente MIT, FollowTheMoney MIT, Rigour MIT, Mesa Apache-2.0, OpenSpiel Apache-2.0. Pack 30's license audit extended.
> 7. **Architecture invariants from the bible (§3) hold.** ContextProvider-only access. Symbolic firewall enforced. Owner scoping absolute. Model strings only in `MODEL_MATRIX.json`. All three tools follow Tool Contract v2 strictly.
>
> Open questions for Giulio:
> - **Q1**: NetworkX scale ceiling — propose: works fine to ~10k nodes / ~50k edges in single-threaded Python on Cloud Run; for cases beyond that, Sprint 2 swap to NetworKit (MIT, C++ backend, drop-in compatible). Acceptable as v1?
> - **Q2**: yente data choice — propose: deploy against public OpenSanctions dataset for v1 (development + evaluation + non-commercial). Add `docs/runbooks/SANCTIONS_DATA_LICENSING.md` documenting the procurement path for commercial production. Acceptable?
> - **Q3**: Mesa scenario — propose: ship a single canonical scenario template "escalation_ladder_with_mediator" at v1. The user supplies actors + initial conditions + mediator-intervention parameter; engine simulates 30-100 steps; output is a trajectory + summary statistics. Future scenarios are added in Sprint 2 (sanctions-evasion, coalition-formation, etc.). Acceptable, or different starter scenario?
> - **Q4**: OpenSpiel pairing — propose: skip in v1; add in Sprint 2 when the question becomes "what's the optimal mediation strategy" rather than "what does this scenario look like." Mesa alone is enough to demonstrate the capability. Acceptable?
> - **Q5**: NetworkX visualization integration — propose: when `analyze.network` runs, persist centrality scores to `graph_nodes.metrics.centrality`; force-graph view (Pack 29) optionally maps centrality to node size via a toggle in the existing layout dropdown. No new graphical primitive — toggle is a checkbox in existing toolbar. Acceptable?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---:|
| EE1 | Foundations: in-process vs sidecar architectural decision; v2-contract registration discipline; license audit deepening | 3 |
| EE2 | NetworkX + python-louvain: in-process module; analyze.network tool; centrality + Louvain on graph_nodes; firewall write-back | 6 |
| EE3 | yente sidecar: Cloud Run + OpenSearch backend; data indexing; FollowTheMoney/Rigour integration | 7 |
| EE4 | match.sanctions tool: chain from Actor extraction; Actor.metadata.sanctions[] persistence; sanctions-data-licensing documentation | 4 |
| EE5 | Mesa 3 worker: Cloud Run; canonical scenario template; trajectory output; simulate.policy_abm tool | 6 |
| EE6 | ADR + integration tests + license audit + final verification + tag | 4 |
| **Total** | | **~30** |

---

## 4. Hard rules

- **Three different deployment shapes, one register pattern.** All three tools register as v2-contract entries in `cross-cutting`. Deployment posture is per-library; tool contract is uniform.
- **License floor: MIT / Apache-2.0 / BSD / ISC.** Pack 30's license audit catches drift.
- **No new categories, ontologies, or graphical primitives.**
- **NetworkX writes are additive metadata only.** `graph_nodes.metrics` JSONB extension. Firewall enforced. Determinism preserved (seed in provenance).
- **yente sidecar is owner-scoped at query time.** A user's Actor matching never returns another tenant's data — yente is stateless against the OpenSanctions index, but the wiring layer enforces tenant isolation on the matching results that persist back to graph_nodes.
- **Mesa simulations are positioned as scenario stress-test.** No tool description, memo annex, or UI label calls them "predictions."
- **Cost ceilings:** `analyze.network` ≤$0.001 per invocation (CPU-only, in-process); `match.sanctions` ≤$0.01 per Actor (yente OpenSearch query); `simulate.policy_abm` ≤$0.30 per 100-step run (Cloud Run CPU compute).
- **All prior invariants from packs 03-30 hold.**

---

## 5. Prompt EE1 — Foundations: deployment patterns + v2-contract discipline + license audit

### Persona
Backend architect.

### Phase 1 — Read & report

- Inspect existing Tool Contract v2 spec (Pack 18 R5+R6).
- Inspect existing Cloud Run worker template (Pack 30 DD1).
- Inspect existing `graph_nodes.metadata` JSONB shape and firewall write paths.
- Output `docs/audits/2026-NN-NN-ANALYTICS_WAVE_FOUNDATIONS.md`.

### Phase 2 — Propose & confirm

Architectural decision matrix:

| Library | Deployment | Why |
|---|---|---|
| NetworkX + python-louvain | In-process import in FastAPI app | Pure Python, no network deps, sub-second per call, no model weights, zero GPU |
| yente + FollowTheMoney | Cloud Run sidecar with managed OpenSearch | OpenSearch is a stateful dep; independent scaling needed; yente FastAPI is the official deployment shape |
| Mesa 3 | Cloud Run worker | Per-scenario CPU runtime is unbounded; isolation needed for timeout discipline; scenario engine has its own state during a run |

Tool registration pattern (uniform across all three):

```ts
// Common pattern (all three in src/lib/tools/registry/)
export const ANALYZE_NETWORK_TOOL: ToolDefinitionV2 = { id: 'analyze.network', category: 'cross-cutting', ... };
export const MATCH_SANCTIONS_TOOL: ToolDefinitionV2 = { id: 'match.sanctions', category: 'cross-cutting', ... };
export const SIMULATE_POLICY_ABM_TOOL: ToolDefinitionV2 = { id: 'simulate.policy_abm', category: 'cross-cutting', ... };
```

License audit deepening:

```ts
// scripts/audit-license-sbom.ts (extended further from Pack 30)
// Per-service venv check now covers:
// - Main backend (existing): NetworkX BSD-3, python-louvain BSD-3, FollowTheMoney MIT, Rigour MIT
// - services/sanctions-yente: yente MIT, FastAPI MIT, opensearch-py Apache-2.0, all transitives clean
// - services/simulate-policy-abm: Mesa Apache-2.0, NumPy BSD-3, all transitives clean
// Frontend SBOM unchanged from Pack 30.
```

Wait for sign-off.

### Phase 3 — Execute

- Author architectural decision document.
- Extend tool-registration discipline.
- Extend license audit.

### Phase 4 — Verify

- License audit green.
- Existing pipeline runs unchanged.

---

## 6. Prompt EE2 — NetworkX + python-louvain in-process module

### Persona
Backend engineer with graph-algorithms experience.

### Outcome

```python
# backend/services/analytics/network_metrics.py
import networkx as nx
import community as community_louvain   # python-louvain; NB: imports as `community`

def load_case_graph(case_id: str, owner_uid: str) -> nx.MultiDiGraph:
    """Load case graph from Postgres graph_nodes + edges into NetworkX."""
    # Query graph_nodes WHERE case_id = ? AND owner_uid = ? AND status = 'committed'
    # Build nx.MultiDiGraph with node attributes (primitive, ontologyId, label) and edge attributes (label, weight).
    ...

def compute_centrality(G: nx.MultiDiGraph) -> dict[str, dict[str, float]]:
    """Returns {node_id: {betweenness, eigenvector, pagerank, closeness}}."""
    # Convert to nx.DiGraph for centrality (collapse parallel edges by sum of weights).
    DG = nx.DiGraph()
    for u, v, data in G.edges(data=True):
        if DG.has_edge(u, v):
            DG[u][v]['weight'] += data.get('weight', 1.0)
        else:
            DG.add_edge(u, v, weight=data.get('weight', 1.0))
    return {
        node: {
            'betweenness': nx.betweenness_centrality(DG)[node],
            'eigenvector': nx.eigenvector_centrality(DG, max_iter=1000)[node],
            'pagerank': nx.pagerank(DG)[node],
            'closeness': nx.closeness_centrality(DG)[node],
        }
        for node in DG.nodes
    }

def detect_communities(G: nx.MultiDiGraph, *, seed: int = 42) -> dict[str, int]:
    """Returns {node_id: community_label} via Louvain."""
    UG = G.to_undirected(as_view=False)
    partition = community_louvain.best_partition(UG, random_state=seed)
    return partition

def k_core_decomposition(G: nx.MultiDiGraph) -> dict[str, int]:
    """Returns {node_id: core_number}; identifies the resilient backbone."""
    UG = G.to_undirected(as_view=False)
    return nx.core_number(UG)

async def run_network_analysis(case_id: str, owner_uid: str) -> NetworkAnalysisResult:
    """Top-level entrypoint invoked by the analyze.network tool."""
    G = load_case_graph(case_id, owner_uid)
    centrality = compute_centrality(G)
    communities = detect_communities(G)
    cores = k_core_decomposition(G)

    # Write back to graph_nodes.metrics through firewall + two-phase commit.
    await write_metrics_to_graph_nodes(case_id, owner_uid, {
        node_id: {
            'centrality': centrality[node_id],
            'community': communities[node_id],
            'core_number': cores[node_id],
        }
        for node_id in centrality
    })

    return NetworkAnalysisResult(
        node_count=G.number_of_nodes(),
        edge_count=G.number_of_edges(),
        community_count=len(set(communities.values())),
        top_brokers=top_n_by_metric(centrality, 'betweenness', n=5),
        top_prestige=top_n_by_metric(centrality, 'eigenvector', n=5),
        backbone_size=sum(1 for c in cores.values() if c >= 3),
        louvain_seed=42,
    )
```

V2-contract tool:

```ts
// src/lib/tools/registry/analyze-network.ts
export const ANALYZE_NETWORK_TOOL: ToolDefinitionV2 = {
  id: 'analyze.network',
  version: '1.0.0',
  title: 'Analyze Network',
  description: 'Compute centrality (betweenness, eigenvector, PageRank, closeness), Louvain communities, and k-core decomposition over the case graph. Identifies brokers, coalitions, and the resilient backbone.',
  category: 'cross-cutting',
  contextSpec: { ontologies: ['*'], requiresGraph: true, requiresDocuments: false, minNodeCount: 5 },
  composition: { canChainInto: ['cross.brief-exporter'], canChainFrom: ['cross.contradiction-finder'] },
  sideEffects: 'writes-graph-metadata',
  subagentDeps: [],
  skill: { file: 'skills/tools/analyze-network/SKILL.md' },
  inputSchema: { /* optional weight-function override */ },
  outputSchema: { /* NetworkAnalysisResult */ },
  estimatedRuntimeMs: 5000,
  costClass: 'cheap',
  streaming: false,
};
```

Force-graph integration: optional centrality-as-node-size toggle (Pack 29 force-graph component). When toggled on, `nodeRelSize` scales with `node.metrics.centrality.betweenness`.

### Files

- `backend/services/analytics/network_metrics.py`.
- `backend/services/analytics/firewall_metrics_writer.py`.
- `backend/migrations/versions/0016_graph_nodes_metrics.py` (additive `metrics jsonb DEFAULT '{}'::jsonb`).
- `src/lib/tools/registry/analyze-network.ts`.
- `skills/tools/analyze-network/SKILL.md`.
- `src/components/graph/PraxisForceGraph.tsx` extended with optional centrality-size toggle.
- Tests.

### Verify

- 100-node synthetic graph: betweenness, eigenvector, PageRank computed in <2s.
- Louvain partition deterministic with fixed seed.
- Metrics persist correctly through firewall.
- Force-graph reflects sizes when toggle on.
- Cost ≤$0.001 per invocation.

---

## 7. Prompt EE3 — yente sidecar + FollowTheMoney + Rigour

### Persona
Backend engineer + DevOps.

### Outcome

Service `services/sanctions-yente/`:

```yaml
# services/sanctions-yente/cloudbuild.yaml
# Use the official yente container image: ghcr.io/opensanctions/yente
# Pin to a specific version tag.
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['pull', 'ghcr.io/opensanctions/yente:4.x.x']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['tag', 'ghcr.io/opensanctions/yente:4.x.x', 'us-central1-docker.pkg.dev/$PROJECT_ID/praxis/sanctions-yente:$COMMIT_SHA']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'us-central1-docker.pkg.dev/$PROJECT_ID/praxis/sanctions-yente:$COMMIT_SHA']
```

OpenSearch backend: managed via Elastic Cloud or self-hosted on GCE; persistent volume sized for the OpenSanctions index (~5-10 GB depending on data scope).

Indexing job: a Cloud Scheduler nightly job pulls the public OpenSanctions delta and updates the yente index.

```python
# backend/services/sanctions/yente_client.py
import httpx
from rigour.names import normalize_name
from rigour.langs.countries import normalize_country

async def match_actor(actor: ActorNode) -> list[SanctionsMatch]:
    """Match a PRAXIS Actor against the OpenSanctions index via yente."""
    payload = {
        "queries": {
            actor.id: {
                "schema": "Person" if actor.subtype.endswith("person") else "Organization",
                "properties": {
                    "name": [normalize_name(actor.label)],
                    "country": [normalize_country(actor.metadata.get("country"))] if actor.metadata.get("country") else [],
                },
            }
        }
    }
    response = await httpx_client.post(
        f"{YENTE_URL}/match/sanctions",
        json=payload,
        timeout=10.0,
    )
    return [
        SanctionsMatch(
            entity_id=result["id"],
            schema=result["schema"],
            score=result["score"],
            matched_labels=result["properties"].get("topics", []),
            datasets=result["datasets"],
            opensanctions_url=f"https://www.opensanctions.org/entities/{result['id']}/",
        )
        for result in response.json()["responses"][actor.id]["results"]
        if result["score"] >= 0.7
    ]
```

V2-contract tool:

```ts
// src/lib/tools/registry/match-sanctions.ts
export const MATCH_SANCTIONS_TOOL: ToolDefinitionV2 = {
  id: 'match.sanctions',
  version: '1.0.0',
  title: 'Match Sanctions',
  description: 'Match Actor entities in the case graph against the OpenSanctions dataset (sanctions, PEPs, sanctions-evasion networks). Returns ranked matches with provenance to OpenSanctions records.',
  category: 'cross-cutting',
  contextSpec: { ontologies: ['*'], requiresGraph: true, requiresDocuments: false, minActorCount: 1 },
  composition: { canChainInto: ['cross.brief-exporter'], canChainFrom: ['cross.contradiction-finder'] },
  sideEffects: 'writes-actor-metadata',
  subagentDeps: [],
  skill: { file: 'skills/tools/match-sanctions/SKILL.md' },
  inputSchema: { /* optional confidence threshold override */ },
  outputSchema: { /* {actorId: matches[]} */ },
  estimatedRuntimeMs: 1000,
  costClass: 'cheap',
  streaming: false,
};
```

Sanctions-data-licensing documentation:

```markdown
# docs/runbooks/SANCTIONS_DATA_LICENSING.md
# OpenSanctions Data Licensing

## Development / Evaluation
PRAXIS deploys yente against the **public OpenSanctions archive bucket** for development, evaluation, and non-commercial use. License: free.

## Commercial Production
For commercial production deployment serving paying customers, a commercial data subscription from OpenSanctions is required.

Procurement contact: contact@opensanctions.org
Estimated cost: $X/year per OpenSanctions's published pricing.

This conversation should occur **before** the first paying commercial customer goes live, separate from the integration work.

The **code** (yente, FollowTheMoney, Rigour) is unconditionally MIT and ships in PRAXIS without restriction.
```

### Files

- `services/sanctions-yente/Dockerfile`, `cloudbuild.yaml`, deployment manifest.
- `infrastructure/terraform/modules/sanctions-yente/`.
- `infrastructure/terraform/modules/sanctions-opensearch/`.
- `backend/services/sanctions/yente_client.py`.
- `backend/services/sanctions/sync_index.py` (nightly Cloud Scheduler job).
- `src/lib/tools/registry/match-sanctions.ts`.
- `skills/tools/match-sanctions/SKILL.md`.
- `docs/runbooks/SANCTIONS_DATA_LICENSING.md`.
- Tests.

### Verify

- yente health endpoint green.
- Index populated with the OpenSanctions public dataset.
- Sample Actor "Yevgeny Prigozhin" matches with high confidence.
- Owner scoping enforced (cross-tenant matching results blocked).
- Cost ≤$0.01 per Actor.

---

## 8. Prompt EE4 — match.sanctions tool integration with extraction pipeline

### Persona
Backend engineer.

### Outcome

The match.sanctions tool is exposed in two places:

**(1) On-demand from the Tools tab** (Pack 26 marketplace) — user runs match.sanctions on the case; results write to `Actor.metadata.sanctions[]` for every matched Actor.

**(2) Optional automatic stage in the Pack 23 Context Genesis pipeline** (gated by user preference, default off) — after Actor extraction, sanctions matching runs automatically and persists matches inline.

UI display: when an Actor has `metadata.sanctions[]` populated, the existing entity panel (used by all three Pack 29 visualizations: oval graph, force-graph, timeline) renders a small "Sanctions: 2 matches" badge. Click expands to show the matches with links to OpenSanctions records.

### Files

- Modified `backend/services/context_genesis/orchestrator.py` (optional sanctions-matching stage).
- Modified `src/components/graph/entity-panel.tsx` (sanctions badge + expandable matches list).
- E2E test: case with Russian/Iranian Actor → sanctions matches surface in entity panel.

### Verify

- Pipeline integration works without breaking existing Pack 23 ingestion.
- Entity panel renders sanctions correctly.
- Cross-tenant isolation preserved.

---

## 9. Prompt EE5 — Mesa 3 worker + canonical scenario template

### Persona
Backend engineer with light agent-based-modeling experience.

### Outcome

Service `services/simulate-policy-abm/`:

```python
# services/simulate-policy-abm/main.py
from fastapi import FastAPI
from mesa import Agent, Model
from mesa.time import RandomActivation
from mesa.datacollection import DataCollector

app = FastAPI()

# Canonical v1 scenario: escalation_ladder_with_mediator
class FactionAgent(Agent):
    def __init__(self, unique_id, model, faction_type, initial_aggression, utility_fn):
        super().__init__(unique_id, model)
        self.faction_type = faction_type
        self.aggression = initial_aggression
        self.utility_fn = utility_fn

    def step(self):
        # Decision rule: signal/concede/defect based on utility, mediator_pressure, neighbors' aggression.
        ...

class MediatorAgent(Agent):
    def __init__(self, unique_id, model, intervention_strength):
        super().__init__(unique_id, model)
        self.intervention_strength = intervention_strength

    def step(self):
        # Apply pressure to factions based on intervention strength.
        ...

class EscalationLadderModel(Model):
    def __init__(self, num_factions, mediator_strength, max_steps=30, seed=42):
        super().__init__(seed=seed)
        self.schedule = RandomActivation(self)
        # Create factions + mediator.
        ...
        self.datacollector = DataCollector(
            model_reporters={"avg_aggression": lambda m: ..., "ceasefires_held": lambda m: ...},
            agent_reporters={"aggression": "aggression", "faction_type": "faction_type"},
        )

    def step(self):
        self.schedule.step()
        self.datacollector.collect(self)


@app.post("/simulate")
async def simulate(req: SimulateRequest) -> SimulateResponse:
    """Run a Mesa scenario."""
    if req.scenario_id != "escalation_ladder_with_mediator":
        raise HTTPException(400, "Unknown scenario; only escalation_ladder_with_mediator is implemented in v1")

    model = EscalationLadderModel(
        num_factions=req.num_factions,
        mediator_strength=req.mediator_strength,
        max_steps=req.max_steps,
        seed=req.seed,
    )
    for _ in range(req.max_steps):
        model.step()
        if model.terminated:
            break

    return SimulateResponse(
        scenario_id=req.scenario_id,
        steps_run=model.schedule.steps,
        terminated_early=model.terminated,
        model_data=model.datacollector.get_model_vars_dataframe().to_dict(),
        agent_data=model.datacollector.get_agent_vars_dataframe().to_dict(),
        summary={
            "ceasefire_held_at_end": model.ceasefire_at_step(-1),
            "max_aggression_step": model.max_aggression_step(),
            "final_avg_aggression": model.avg_aggression_at_step(-1),
        },
    )
```

V2-contract tool:

```ts
// src/lib/tools/registry/simulate-policy-abm.ts
export const SIMULATE_POLICY_ABM_TOOL: ToolDefinitionV2 = {
  id: 'simulate.policy_abm',
  version: '1.0.0',
  title: 'Simulate Policy (Agent-Based Model)',
  description: 'Run an agent-based scenario stress-test on the case. Produces a trajectory and summary statistics. NOT a forecast — a structured scenario simulation under explicit assumptions. v1 scenario: escalation_ladder_with_mediator.',
  category: 'cross-cutting',
  contextSpec: { ontologies: ['conflict', 'mediation', 'security'], requiresGraph: true, requiresDocuments: false },
  composition: { canChainInto: ['cross.brief-exporter'], canChainFrom: [] },
  sideEffects: 'reads-only',
  subagentDeps: [],
  skill: { file: 'skills/tools/simulate-policy-abm/SKILL.md' },
  inputSchema: { /* scenario_id, num_factions, mediator_strength, max_steps, seed */ },
  outputSchema: { /* trajectory + summary */ },
  estimatedRuntimeMs: 60000,
  costClass: 'medium',
  streaming: false,
};
```

UI: trajectory rendered in an existing Recharts panel inside the existing tool-output drawer. Two charts: "Avg aggression over time" (line), "Faction aggression by faction" (multi-line).

The tool description, the SKILL.md, and the rendered output all label the simulation as **"scenario stress-test"**, not prediction. Any memo annex synthesized from a simulation result includes a standard disclaimer.

### Files

- `services/simulate-policy-abm/main.py`, `Dockerfile`, `requirements.txt`, `cloudbuild.yaml`.
- `services/simulate-policy-abm/scenarios/escalation_ladder_with_mediator.py`.
- `infrastructure/terraform/modules/simulate-policy-abm/`.
- `src/lib/tools/registry/simulate-policy-abm.ts`.
- `skills/tools/simulate-policy-abm/SKILL.md` (with the scenario-stress-test framing).
- `src/components/tools/output/AbmTrajectoryView.tsx` (uses existing Recharts).
- Tests.

### Verify

- Sample run with 5 factions + mediator_strength=0.5 + 30 steps produces a valid trajectory.
- Determinism: same seed → same output.
- Cost ≤$0.30 per 100-step run.
- UI renders trajectory correctly.
- "Scenario stress-test" framing consistent in all surfaces.

---

## 10. Prompt EE6 — ADR + integration tests + license audit + final verification

### ADR

- `0048-analytics-sanctions-simulation-as-cross-cutting-tools.md` — explains:
  - Why each library deploys differently (in-process vs sidecar vs worker).
  - Cost ceilings + rate limits per tool.
  - OpenSanctions data licensing posture (code MIT, data tiered).
  - Mesa as scenario stress-test, not prediction.
  - Owner scoping enforcement at each tool.
  - Firewall + provenance discipline for all writes.

### Integration tests

- E2E `tests/e2e/analytics/network-metrics.spec.ts`: open populated case → run analyze.network → verify metrics persist + force-graph reflects sizes.
- E2E `tests/e2e/sanctions/match-sanctions.spec.ts`: case with Russian Actor → run match.sanctions → verify match badge appears in entity panel.
- E2E `tests/e2e/simulation/policy-abm.spec.ts`: case with Conflict ontology → run simulate.policy_abm → verify trajectory chart renders.

### Final verification

```bash
# Foundations
npm run typecheck && npm run lint && npm run test
pytest backend/ -q

# Pack-31-specific
npm run audit:license-sbom                  # zero non-permissive licenses
npm run audit:tool-contract-v2               # 57 tools (54 + 3 new)
npm run audit:tool-skills-present            # 57/57
npm run audit:firewall-coverage              # extended for new metric writes
npm run audit:owner-scoping                   # cross-tenant isolation verified

# All prior gates
npm run audit:gate

# Persona suites
npm run test:e2e:personas                   # 10 consecutive green

# Pack-specific
pytest backend/services/analytics/tests/
pytest services/sanctions-yente/tests/
pytest services/simulate-policy-abm/tests/

# Live integration smoke
PRAXIS_ENV=staging python scripts/smoke-analytics-wave.py

git tag v1.7.0
```

---

## 11. Out of scope

- NetworKit migration for >10k node cases — Sprint 2.
- igraph (GPL-2 — excluded permanently).
- Neo4j Graph Data Science (commercial — excluded permanently).
- OpenSpiel game-theoretic equilibria — Sprint 2 if customer demands "optimal mediation" rather than "scenario simulation."
- Additional Mesa scenarios (sanctions-evasion ABM, coalition-formation ABM, narrative-spread ABM) — Sprint 2-3.
- Custom user-defined ABM scenarios via DSL — v2 (significant authoring UX).
- mesa-geo GIS-aware ABMs — Sprint 2 if mapped scenarios become a need.
- Real-time / streaming ABM updates — out of scope (always batch).
- Sanctions data subscription procurement — separate procurement track, not engineering.
- VIEWS forecasting integration — Sprint 2 (HTTP API consume, half-day job).

---

## 12. Closing note

Three more permissive libraries. Three more concrete capabilities. ~30 hours.

After Pack 31, PRAXIS has visualization (Pack 29: force-graph + timeline + map), document extraction + KG construction (Pack 30: Docling + GLiNER + GraphRAG), and analytics + sanctions + simulation (Pack 31: NetworkX + yente + Mesa). Marketplace at 57 tools across 9 ontologies + cross-cutting. Twelve subagents on Vertex AI Agent Engine. Three Cloud Run extraction workers + one yente sidecar + one Mesa worker, each license-clean, each runbook-covered.

The user opens a Sudan case, switches the graph to force layout (Pack 29), runs `analyze.network` (Pack 31) — sees Hemedti's centrality. Runs `match.sanctions` (Pack 31) — sees the OFAC + EU designations on 12 Actors. Runs `simulate.policy_abm` (Pack 31) with the "tighter sanctions" scenario — sees the predicted trajectory. Drafts the memo (Pack 26-28 surfaces) with all three analyses cited inline. Exports as DOCX with C2PA chain (Pack 28).

That's the workbench shipping.

Branch: `feature/analytics-sanctions-simulation-wave`. Commit prefix `analytics(<library>): EE<N> <description>`. PR titled `Pack 31 — Analytics, Sanctions & Simulation Wave`.

After merge, tag `v1.7.0`. The OSS sourcing report (artifact `compass_artifact_wf-89dfc1f8`) is fully consumed across packs 29, 30, 31.

---

## 13. Aggregated impact across packs 29-31

After this final pack of the OSS-integration trilogy:

| Capability | Pack 29 | Pack 30 | Pack 31 | Total new |
|---|---|---|---|---|
| Frontend libraries | react-force-graph, vis-timeline, MapLibre GL JS | — | — | 3 |
| Backend Cloud Run workers | — | extract-docling, extract-ner-gliner, extract-graphrag | sanctions-yente, simulate-policy-abm | 5 |
| In-process Python libraries | — | FollowTheMoney, Rigour | NetworkX, python-louvain | 4 |
| Marketplace tools | — | extract.entities.gliner, cross.community-synthesizer | analyze.network, match.sanctions, simulate.policy_abm | 5 |
| Removed components | — | ACLED feed client (license cleanup) | — | 1 |
| New ADRs | 0046 | 0047 | 0048 | 3 |
| License posture | All MIT/Apache-2.0/BSD verified per `audit:license-sbom` | | | |
| Total marketplace tool count | 52 → 52 | 52 → 54 | 54 → 57 | +5 |

The 12 surfaces, 12 subagents, 9 ontologies, 8 ACO primitives, four-layer context, and symbolic firewall are unchanged across all three packs. Every new component slots into existing patterns. Every license is verified. Every cost ceiling is bounded. The architecture bible's invariants hold.

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_31_ANALYTICS_SANCTIONS_SIMULATION_WAVE.md`
