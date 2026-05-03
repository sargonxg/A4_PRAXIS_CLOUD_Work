# PRAXIS + DIALECTICA Backbone Architecture - 2026-05-01

## Objective

Prepare PRAXIS so premium users can eventually connect their situation
workspaces to `https://dialectica.tacitus.me` as the structured reasoning
backbone for dynamic ontology layers, graph construction, situation
description, and policy/diplomacy reasoning.

## Research Baseline

Live Dialectica positioning, checked 2026-05-01:

- Dialectica describes itself as the context and data layer for TACITUS.
- It exposes a context layer, foundation layer, and reasoning layer.
- It structures conflict data into a deterministic knowledge graph grounded in
  peer-reviewed frameworks.
- Its public architecture preview names a pipeline from unstructured text to
  GLiNER NER, Gemini extraction, Pydantic validation, Neo4j graph storage,
  symbolic rules, specialist AI agents, and decision support.
- Developer materials are advertised for API docs, SDKs, examples, API keys,
  and MCP.

Research basis for the design:

- Pan et al., "Unifying Large Language Models and Knowledge Graphs: A Roadmap"
  (IEEE TKDE 2024 / arXiv 2306.08302): frames KG-enhanced LLMs,
  LLM-augmented KGs, and synergized LLM+KG systems.
- Ji et al., "A Survey on Knowledge Graphs: Representation, Acquisition, and
  Applications" (IEEE TNNLS 2022): covers KG representation learning,
  acquisition, completion, temporal KGs, and knowledge-aware applications.
- OG-RAG research argues that plain retrieval misses structured domain
  knowledge; ontology-grounded retrieval is better suited when type systems and
  relationships matter.
- The May 3 Syria workspace pass adds a concrete PRAXIS product pattern:
  graph-grounded live research modes. The app should let analysts run targeted
  searches, extract candidate graph updates, compare discrepancies, stage
  changes through GraphOps, and draft outputs from graph paths rather than
  isolated chunks.

Sources:

- https://dialectica.tacitus.me/
- https://arxiv.org/abs/2306.08302
- https://doi.org/10.1109/TNNLS.2021.3070843
- https://arxiv.org/abs/2412.15235

## PRAXIS Live Research Pattern

The graph-grounded research loop is:

1. Search targeted source families.
2. Extract typed candidates.
3. Validate against ontology, source tier, temporal anchor, and graph context.
4. Stage graph updates in GraphOps.
5. Reason from graph paths and source receipts.
6. Draft memo, briefing, scenario, or commitment-monitor output.

The first modeled Syria research modes are:

- latest-source sweep;
- think-tank discrepancy review;
- commitment and communique monitor;
- local media and narrative divergence;
- graph-grounded policy question;
- economic and HLP scenario research.

Dialectica should eventually make this stronger by resolving ontology layers,
checking typed edge constraints, computing deterministic rule outputs, and
returning context packs that PRAXIS tools can use without re-processing the
entire source corpus.

See
[`docs/PRAXIS_SYRIA_GRAPH_GROUNDED_RESEARCH_HANDOFF_2026-05-03.md`](./PRAXIS_SYRIA_GRAPH_GROUNDED_RESEARCH_HANDOFF_2026-05-03.md)
for the current app-facing implementation notes.

## Product Boundary

PRAXIS should remain the user-facing policy, diplomacy, and intelligence app.
Dialectica should become the premium graph and ontology substrate.

PRAXIS owns:

- onboarding;
- situation creation;
- user documents and notes;
- source selection;
- tool workflows;
- reports and exports;
- user permissions, billing, and workspace UX.

Dialectica owns, when connected:

- ontology versioning;
- dynamic layer definitions;
- typed node and edge validation;
- deterministic symbolic rules;
- graph reasoning;
- graph health diagnostics;
- ontology-backed retrieval packs;
- graph mutation proposals.

## Backbone Layers

1. Situation Description Layer
   - Input: PRAXIS situation name, type, region, description, actors, notes,
     source URLs, documents, language, date range.
   - Output: normalized situation frame, canonical actor list, time window,
     geography, conflict domain, required ontology layers.

2. Dynamic Ontology Layer
   - Input: situation frame plus domain.
   - Output: enabled ontology modules, node types, edge types, allowed
     relation constraints, required evidence fields, and confidence rules.
   - Examples: ceasefire-monitoring layer, sanctions layer, humanitarian
     access layer, mediation-design layer, treaty-compliance layer.

3. Extraction Layer
   - Input: user documents, source excerpts, notes, and generated tool
     summaries.
   - Output: candidate nodes, edges, events, claims, commitments, interests,
     constraints, norms, violations, and causal mechanisms.
   - Rule: extraction writes proposals, not canonical graph mutations.

4. Validation Layer
   - Input: candidate graph changes.
   - Output: schema-validated graph proposals with evidence envelopes,
     confidence, conflicts, missing fields, and ontology version.

5. Deterministic Reasoning Layer
   - Input: approved graph plus ontology rules.
   - Output: computed Glasl stage, ripeness indicators, power/leverage scores,
     treaty or norm violation flags, causal chains, escalation mechanisms, and
     graph health warnings.

6. Retrieval Layer
   - Input: tool id, user question, active situation, profile, and graph state.
   - Output: typed context pack for PRAXIS AI routes:
     actors, claims, interests, constraints, risks, events, commitments,
     evidence receipts, graph paths, and computed rule results.

7. AI Tool Layer
   - Input: PRAXIS prompt block plus Dialectica context pack.
   - Output: schema-validated PRAXIS tool result with provenance and suggested
     graph proposals.

8. Analyst Approval Layer
   - Input: graph proposals and tool output claims.
   - Output: approved graph mutations, rejected proposals, analyst notes, and
     corrections that Ask PRAXIS can reuse.

## API Shape

Initial premium integration should be additive and feature-flagged.

Environment:

- `DIALECTICA_API_URL=https://dialectica.tacitus.me`
- `DIALECTICA_API_KEY_SECRET=praxis-dialectica-api-key`
- `DIALECTICA_ENABLED=true`
- `DIALECTICA_MIN_TIER=premium`

Core calls:

```ts
POST /v1/workspaces
POST /v1/workspaces/{id}/situations
POST /v1/situations/{id}/ontology/resolve
POST /v1/situations/{id}/extract
POST /v1/situations/{id}/graph/proposals
POST /v1/situations/{id}/graph/approve
POST /v1/situations/{id}/context-pack
GET  /v1/situations/{id}/graph/health
GET  /v1/ontologies/{version}
```

PRAXIS local types should not depend on Dialectica internals. Use a small
adapter boundary:

```ts
interface DialecticaContextPack {
  ontologyVersion: string;
  situationId: string;
  graphVersion: string;
  nodes: Array<{ id: string; type: string; label: string; summary?: string }>;
  edges: Array<{ source: string; target: string; type: string; evidence?: string }>;
  computed: Array<{ ruleId: string; label: string; value: unknown; confidence: number }>;
  evidence: Array<{ id: string; sourceType: string; citation: string; excerpt?: string }>;
  warnings: Array<{ severity: 'low' | 'medium' | 'high'; message: string }>;
}
```

## Premium UX

Free and standard users:

- use PRAXIS local graph, documents, sources, and calibrated AI routes;
- see clear context quality warnings;
- never require Dialectica to complete the first useful workflow.

Premium users:

- can connect Dialectica from Settings;
- see ontology layer status in Situation Settings and GraphOps;
- get stronger graph-backed context packs in AI routes;
- can approve graph proposals with ontology explanations;
- can export ontology-backed evidence bundles.

## Rollout Plan

Phase 1 - Contract first:

- Add `DialecticaAdapter` interface and disabled-by-default provider.
- Add settings/readiness UI for connection status.
- Add typed context-pack model and tests.

Phase 2 - Read-only context:

- Send situation frame to Dialectica.
- Pull ontology and graph health.
- Feed read-only context packs into PRAXIS AI routes.

Phase 3 - Proposal loop:

- Send documents/source excerpts for extraction.
- Store graph proposals in PRAXIS and/or Dialectica.
- Add analyst review UI in GraphOps.

Phase 4 - Premium graph reasoning:

- Enable deterministic rule outputs in risk, early warning, stakeholder map,
  policy memo, talking points, and situation intelligence.
- Show computed vs AI-inferred claims separately.

Phase 5 - Full backbone:

- Dialectica becomes the premium canonical graph store.
- PRAXIS remains the UX, workflow, reporting, and app orchestration layer.

## Non-Negotiables

- Never silently mix demo data into real user graph state.
- Never let AI overwrite deterministic rule results.
- Never write canonical graph changes without analyst approval.
- Always preserve source receipts and ontology version.
- Always degrade gracefully when Dialectica is unavailable.
- Keep free-tier PRAXIS useful without premium backbone dependency.
