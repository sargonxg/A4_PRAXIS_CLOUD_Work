# PRAXIS Ontology System

Last updated: 2026-05-07

PRAXIS uses a two-layer ontology system for extraction: a shared Analytical Concepts Ontology base and optional case-type specializations. The base lives at `backend/data/ontologies/praxis_aco_base.owl` and defines the eight stable primitives: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, and Narrative.

Case-type specializations live under `backend/data/ontologies/specializations/`. The current registry covers ten case types: active conflict, frozen conflict, negotiation/mediation, counter-terrorism, humanitarian crisis, political transition, sanctions/economic statecraft, strategic competition, cyber/hybrid, and forced displacement. Each specialization imports the base ontology, declares its case type, subclasses base primitives, and has a colocated changelog.

Runtime composition is owned by `backend/services/ontology_system.py`. Callers pass `case_type` and optional `case_type_secondary`; the helper returns a deterministic base-plus-specialization stack and the corresponding Cognee data-point classes from `backend/services/cognee_aco_models/`. Cognee remains isolated: only `backend/services/cognee_memory.py` owns the Cognee boundary, and the monolith currently returns disabled-safe extraction shapes until the isolated service consumes the resolver descriptor.

The Library tab is the first integration point. Upload and re-extract requests can pass primary and secondary case types, which are persisted into receipt metadata and forwarded to `cognee_memory.cognify()`. This does not change the symbolic firewall, RLS policy, or substrate table ownership.

Guardrails:

- `npm run audit:ontology-system` verifies the base ontology, all ten specialization OWLs, changelogs, data-point modules, runtime helpers, Library tab wiring, and the 0.6 synthesized-confidence cap.
- `python -m pytest backend/tests/test_ontology_system.py -q` parses every OWL file and checks runtime stack/data-point composition.
- No PRAXIS ontology file should contain product-positioning claims about a specific institution; use source-specific references only when source material requires them.
