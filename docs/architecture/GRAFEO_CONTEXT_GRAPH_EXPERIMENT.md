# Grafeo Context Graph Experiment

Status: experimental PRAXIS Context Core Lite graph backend.

PRAXIS still uses Firestore-backed capsules, context packages, and active context
stacks as the reliable MVP context spine. This experiment adds a deterministic
graph capture layer that can mirror Context Core Lite material into Grafeo when
`PRAXIS_CONTEXT_GRAPH_BACKEND=grafeo_experimental` is enabled.

## Boundary

- PRAXIS owns the workbench, Context Core Lite, Ask PRAXIS, memo handover, and
  simple graph review.
- Grafeo is an optional embedded graph accelerator inside PRAXIS for this
  experiment.
- DIALECTICA by TACITUS remains the future full context creation engine for
  ingestion, extraction, provenance-heavy graph construction, versioned context
  packages, and deeper hybrid retrieval.

## Current Pipeline

The experimental builder creates a graph from explicit fields, lite structured
input, or a small material-ingestion payload:

```text
Context Core Lite input or source material
-> ontology preset selection
-> Actor / Event / Claim / Constraint / Assumption / Gap / SourceReceipt nodes
-> deterministic support and conflict edges
-> standard query pack
-> optional Grafeo mirror
-> visualization payload
-> context-core evolution actions
-> prompt block for Ask PRAXIS review
```

Structured text can use simple lines:

```text
Actor: Defense Ministry
Claim: Defense Ministry confirms the access review.
Event: 2026-05-15 policy review opened
Constraint: Legal review required before recommendation.
Assumption: Customs data remains incomplete.
Gap: Missing customs authority source receipt.
Source: Port access circular
```

The material ingestion API also accepts one or more material records:

```json
{
  "ingestion": {
    "contextCoreId": "conflict-core-1",
    "title": "Corridor Access Conflict Core",
    "domain": "conflict_analysis",
    "ontology": "conflict_ontology",
    "materials": [
      {
        "id": "field-report-1",
        "title": "Field report 1",
        "sourceType": "document",
        "text": "Actor: Monitoring Cell\nClaim: Armed Group A confirms corridor access."
      }
    ]
  }
}
```

## Ontology Presets

The current lite presets are:

- `conflict_ontology`: actors, claims, events, commitments/friction signals,
  constraints, assumptions, gaps, and source receipts.
- `policy_core`: stakeholders, policy claims, constraints, implementation
  risks, assumptions, gaps, and source receipts.
- `procurement_compliance`: vendors, requirements, compliance constraints,
  delivery events, gaps, and source receipts.
- `humanitarian_access`: actors, access events, protection or needs claims,
  constraints, gaps, and source receipts.

`GET /api/context/graph/experimental` returns the presets and the top suggested
presets for a domain, intent, or text sample.

## Standard Queries

The current standard query pack checks:

- claims without source receipts
- conflicting claims
- assumption load
- evidence gaps
- dated event coverage
- policy or conflict constraint readiness

The response also includes a `visualization` object with graph nodes and links
for a force-directed view, plus an `evolution` object with readiness, embed
eligibility, and next actions for developing the Context Core Lite.

These are deterministic review queries. They are not a replacement for full
DIALECTICA context creation.

## Runtime

Default mode:

```text
PRAXIS_CONTEXT_GRAPH_BACKEND=firestore_lite
```

Experimental Grafeo mode:

```text
PRAXIS_CONTEXT_GRAPH_BACKEND=grafeo_experimental
```

Optional embedded artifact output:

```text
PRAXIS_GRAFEO_CONTEXT_DIR=/path/to/context-graphs
```

When `PRAXIS_GRAFEO_CONTEXT_DIR` is unset, the route still builds the graph and
mirrors it into an in-memory Grafeo database for the request.

## API

Experimental route:

```text
POST /api/context/graph/experimental
```

The route is authenticated, rejects demo-user private graph creation, and returns
the deterministic graph, query results, optional Grafeo mirror result, and the
boundary statement.

## Adoption Rule

Do not make Grafeo mandatory for the PRAXIS MVP until:

1. Cloud Run deployment behavior is verified.
2. Persistent artifact storage is intentionally configured.
3. The Ask PRAXIS tool path consumes the graph summary without breaking the
   existing capsule/context package contract.
4. DIALECTICA export compatibility is tested against the same node and edge
   vocabulary.
