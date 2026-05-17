# Conflict Data Sources

PRAXIS keeps conflict event data source choices explicit because source terms,
update cadence, and citation posture affect real analyst work.

## Active Baseline

- `Google Grounding`: canonical live-research path for current, source-linked
  political and humanitarian context.
- `Web crawler receipts`: optional future path, allowed only when each result
  returns a checkable URL, excerpt, retrieval timestamp, and source receipt.
- `User documents and URLs`: primary analyst-provided evidence.
- `Wikipedia`: background and entity enrichment only.

## Retired Active Sources

ACLED, GDELT, UCDP, ReliefWeb, HDX, UN News, UNHCR, SIPRI, Crisis Group, and
World Bank clients/workers are not active runtime dependencies. Historic docs
may mention them as project history, but production code must not import their
clients, deploy their workers, or request user credentials for them.

## Pack 30 Extraction Policy

Docling, GLiNER, and GraphRAG are isolated Cloud Run workers. Their outputs are
candidate context or synthesized claims, not direct writes. The main backend is
responsible for firewall validation, review queue routing, cost logging, and
database persistence.
