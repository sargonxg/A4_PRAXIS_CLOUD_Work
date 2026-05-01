# PRAXIS Graph Backbone Sprint A

Status: active proposal.
Created: 2026-04-30.
Short name: **Graph Backbone Sprint A**.
Reference alias: **GB-A**.

Use this document when asking Codex to continue the Firestore-first graph
backbone work. Example prompts:

- "Continue GB-A."
- "Start GB-A-01."
- "Implement the GraphOps workspace from GB-A-04."
- "Run the Falkor GraphRAG pilot from GB-A-FALKOR."

## Strategic Principle

Firestore is the canonical, reviewable situation context store. Graph databases
such as Neo4j, FalkorDB, or future Spanner Graph are derived indexes for
traversal, GraphRAG, pathfinding, and advanced analytics. PRAXIS must be able
to rebuild any derived index from Firestore.

The graph must become a trusted intelligence backbone, not a decorative
visualization. Every graph fact should be:

- typed
- sourced
- time-aware
- confidence-rated
- reviewable
- patchable by Ask PRAXIS through proposals
- safe to export or query later

## Stable Item Codes

### GB-A-01 — Canonical Graph v1 Contract

Define and enforce one canonical Firestore graph shape for
`users/{uid}/situations/{situationId}/graph/main`.

Required fields:

- nodes
- edges
- temporal assertions
- source/evidence envelopes
- confidence and status
- aliases/canonical-name data
- extraction/update metadata
- version and schema version

Acceptance checks:

- One shared schema/normalizer module validates every write.
- The dashboard, Conflict Graph, Ask PRAXIS, extraction routes, and export
  paths all read the same normalized graph shape.
- Legacy shapes are either normalized on read or explicitly migrated.

### GB-A-02 — Proposal Apply Hardening

Harden the graph proposal apply path added in GraphOps v0.1.

Acceptance checks:

- Unit tests cover `node.add`, `node.edit`, `edge.add`, `edge.edit`.
- Approving the same proposal twice is idempotent.
- Rejected proposals cannot mutate `graph/main`.
- Bad payloads fail with a clear reason and do not flip proposal status.
- Every successful apply writes a snapshot and a system event.

### GB-A-03 — Stop Direct Canonical Writes

Move graph-producing AI/extraction routes to proposal-first or staged-first
mode by default.

Acceptance checks:

- `/api/ai/extract`, `/api/ai/research-extract`, and graph population do not
  directly overwrite `graph/main` for normal users.
- Direct commit remains possible only for explicit admin/dev operations.
- UI copy explains staged/proposed graph data before approval.

### GB-A-04 — GraphOps Workspace Page

Build a real GraphOps workspace for each situation.

Page goals:

- pending proposals
- staged graph diff
- latest snapshots
- low-confidence graph items
- orphan nodes
- temporal coverage
- provenance gaps
- repair actions
- backend/derived-index status

Acceptance checks:

- User can inspect and approve/reject graph proposals from one page.
- User can see why the graph is or is not ready for serious analysis.
- The page links back to Conflict Graph, Documents, Source Scout, and Ask
  PRAXIS.

### GB-A-05 — Evidence Envelope for Graph Items

Every graph node and edge should explain why PRAXIS believes it exists.

Evidence envelope fields:

- source receipt id
- document id
- chunk or paragraph id
- URL
- source title/domain
- quote or fragment pointer
- extraction run id
- model/tool that proposed it
- confidence rationale

Acceptance checks:

- Clicking a graph node can answer: "What source supports this?"
- Source Scout, document ingestion, and extraction routes all emit compatible
  evidence envelopes.

### GB-A-06 — Temporal Assertion Layer

Add Firestore-backed temporal assertions.

Suggested path:

`users/{uid}/situations/{situationId}/graph/assertions/{assertionId}`

Suggested fields:

- subjectId
- predicate
- objectId or literal
- validFrom
- validTo
- observedAt
- recordedAt
- sourceIds
- confidence
- status
- supersedes
- supersededBy

Acceptance checks:

- Tools can ask what was true before/after a date.
- Actor positions, commitments, sanctions, access constraints, alliances, and
  ceasefire status can change over time without overwriting history.

### GB-A-07 — Ask PRAXIS Graph Patch Tool

Give Ask PRAXIS a safe graph writeback capability through proposals only.

Tool name:

`proposeGraphDelta`

Acceptance checks:

- User can say: "This stakeholder is wrong" or "Add this constraint."
- Ask PRAXIS asks only required clarifying questions.
- The result is a `graph_updates` proposal, not a direct graph write.
- Proposal includes evidence and a confidence note.

### GB-A-08 — Central Graph Query Service

Create one graph query/read service used by all graph-aware tools.

Queries to support:

- actor list
- actor dossier seed
- commitments
- claims
- interests
- constraints
- risks
- events
- timeline
- actor neighborhood
- source-backed context pack
- missing evidence

Acceptance checks:

- Tools stop hand-reading inconsistent graph shapes.
- Ask PRAXIS and calibrated AI routes can request compact graph context packs.

### GB-A-09 — Graph Repair and Maintenance Jobs

Add deterministic graph maintenance jobs.

Repair actions:

- normalize casing
- dedupe aliases
- suggest actor merges
- detect orphan nodes
- detect edges with missing endpoints
- flag stale temporal claims
- identify nodes with weak provenance
- generate proposal cards for repair

Acceptance checks:

- GraphOps can produce repair proposals rather than only warnings.
- Repairs are auditable and reversible.

### GB-A-10 — Derived Graph Index Sync

After Firestore canonical graph is stable, mirror approved graph state to a
derived graph database.

Candidate indexes:

- Neo4j Aura
- FalkorDB / GraphRAG-SDK
- Spanner Graph later for enterprise GCP-native scale

Acceptance checks:

- Derived index can be rebuilt from Firestore.
- Failed sync never corrupts canonical graph state.
- GraphOps shows derived-index freshness and health.
- Advanced traversal/pathfinding uses derived index only when fresh enough.

## GB-A-FALKOR — FalkorDB GraphRAG-SDK Evaluation

The FalkorDB GraphRAG-SDK is promising for PRAXIS, but it should be treated as
a derived GraphRAG pilot rather than the canonical graph store.

Potential PRAXIS uses:

- fast graph-backed retrieval for Ask PRAXIS
- text-to-Cypher over approved situation graphs
- ontology-guided extraction experiments
- source-cited answers from graph neighborhoods
- multi-hop relationship reasoning
- FalkorDB-backed GraphRAG demo for the future DIALECTICA layer

Reasons to pilot:

- It is built for GraphRAG over FalkorDB.
- It supports schema-driven entity/relation definitions.
- It supports retrieval with source context.
- It integrates with multiple LLM providers.
- PRAXIS already has a backend graph adapter for FalkorDB.

Risks and constraints:

- PRAXIS still needs Firestore as canonical state for auth, audit, review, and
  user-visible persistence.
- GraphRAG-SDK is Python-first, so it belongs in the backend/worker lane, not
  directly in Next.js routes.
- Text-to-Cypher should be read-only at first.
- Temporal graph support should not be assumed until tested against PRAXIS
  policy/conflict time-series needs.
- Any FalkorDB index must be rebuildable from Firestore.

Recommended pilot:

1. Export one approved situation graph from Firestore to FalkorDB.
2. Define a small PRAXIS schema: Actor, Claim, Interest, Constraint, Event,
   Commitment, SourceFragment.
3. Run read-only GraphRAG questions:
   - "Which actors are constrained by the ceasefire?"
   - "What source supports this claim?"
   - "What changed after the government transition?"
4. Compare answers against PRAXIS's existing Firestore context pack.
5. Keep only if it improves multi-hop accuracy, citation quality, or latency.

Decision:

Good idea as **GB-A-FALKOR pilot** after GB-A-01 through GB-A-05 are underway.
Not a good idea as an immediate replacement for Firestore canonical graph
storage.

