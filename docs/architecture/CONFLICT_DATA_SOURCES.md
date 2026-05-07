# Conflict Data Sources

PRAXIS keeps conflict event data source choices explicit because source terms,
update cadence, and citation posture affect real analyst work.

## Active Baseline

- `UCDP`: conflict event baseline for active product references and source
  credibility metadata.
- `GDELT`: media tone and instability signal.
- `HDX`, `ReliefWeb`, `World Bank`, `Google Grounding`: supporting contextual
  feeds where already wired.

## Retired Active Source

ACLED client code has been removed from active `src`, `backend`, `scripts`, and
`tests` paths. Historic documentation may still mention the data source as
project history, but production code must not depend on it or request user
credentials for it.

## Pack 30 Extraction Policy

Docling, GLiNER, and GraphRAG are isolated Cloud Run workers. Their outputs are
candidate context or synthesized claims, not direct writes. The main backend is
responsible for firewall validation, review queue routing, cost logging, and
database persistence.
