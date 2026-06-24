# Ontology Backend Frontend Map

This file records the frontend TypeScript mapping for the backend case-specialization ontology stack. Backend OWL specs remain out of scope for this slice; the map keeps agent-facing frontend packets aligned with the ten backend case specializations and the nine frontend `OntologyId` values.

## Core Contract

The ACO core primitive substrate remains unchanged:

- Actor
- Claim
- Interest
- Constraint
- Leverage
- Commitment
- Event
- Narrative

Frontend ontology IDs remain:

- `conflict`
- `mediation`
- `governance`
- `narrative`
- `human-rights`
- `economic`
- `humanitarian`
- `legal`
- `security`

The executable mapping lives in `src/lib/ontology/backend-frontend-map.ts`.

## Backend Specialization Mapping

| Backend case specialization | Backend ID | Primary frontend ontology | Compatible frontend ontologies |
| --- | --- | --- | --- |
| Active conflict | `active-conflict` | `conflict` | `conflict`, `humanitarian`, `security` |
| Frozen conflict | `frozen-conflict` | `conflict` | `conflict`, `governance`, `legal` |
| Negotiation / mediation | `negotiation-mediation` | `mediation` | `mediation`, `conflict`, `governance` |
| Counter-terrorism | `counter-terrorism` | `security` | `security`, `economic`, `legal` |
| Humanitarian crisis | `humanitarian-crisis` | `humanitarian` | `humanitarian`, `conflict`, `human-rights` |
| Political transition | `political-transition` | `governance` | `governance`, `legal`, `conflict` |
| Sanctions / economic statecraft | `sanctions-economic-statecraft` | `economic` | `economic`, `governance`, `legal` |
| Strategic competition | `strategic-competition` | `security` | `security`, `governance`, `narrative` |
| Cyber / hybrid | `cyber-hybrid` | `narrative` | `narrative`, `security`, `conflict` |
| Forced displacement | `forced-displacement` | `humanitarian` | `humanitarian`, `human-rights`, `legal` |

## Agent-Readable Additions

All frontend case ontologies expose the universal evidence, temporal, causal, and contestation vocabulary from `src/lib/ontology/universal.ts`.

Causal edges require evidence references and carry a default confidence cap of `0.75` unless the causal statement is directly source-stated. Off-schema edges must remain proposed, advisory, or missing until reviewed.

Reusable path templates live in `src/lib/ontology/path-templates.ts` and cover:

- conflict/security
- mediation
- economic/sanctions
- narrative
