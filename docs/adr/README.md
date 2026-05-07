# PRAXIS Architecture Decision Records

This directory is the required home for PRAXIS architecture decision records.

The architecture bible requires ADRs for changes that weaken or materially
alter a foundational invariant, add a new data store, change layer
responsibilities, remove an audit guard, or otherwise shift the architecture
contract.

## Format

Use monotonically increasing filenames:

```text
docs/adr/0001-short-slug.md
```

Each ADR should use MADR-style sections:

- Status
- Context
- Decision
- Consequences
- Alternatives considered

Accepted ADRs are not edited for meaning. Supersede them with a later ADR.

## Current ADR Set

- `0021-sats-as-first-class.md`
- `0022-red-team-analyst-subagent.md`
- `0023-ach-workbench-surface.md`
- `0026-agentic-boardroom-architecture.md`
- `0027-parameterized-analyst-persona-subagent.md`
- `0028-persona-corpus-retrieval.md`
- `0030-dynamic-ontology-lenses.md`
- `0033-marketplace-depth-strategy.md`
- `0034-composition-chain-governance.md`
- `0035-marketplace-cap-and-deferred-candidates.md`
- `0036-gcp-production-verification-discipline.md`
- `0037-draft-briefing-assembly-contract.md`
- `0038-ai-first-case-creation-pattern.md`
- `0040-chapters-layered-content-rendering.md`
- `0041-desk-command-center-contract.md`
- `0042-library-tab-as-artifact-faceted-view.md`
- `0043-research-as-ingestion-front-door.md`
- `0044-draft-as-briefing-assembly-contract.md`
- `0045-ai-first-case-creation-pattern.md`

Active target-state gaps are tracked in:

- `docs/audits/2026-05-06-SELF_AUDIT.md`
- `docs/backlog/2026-05-06-from-self-audit.md`
- `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`
