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
- `0030-dynamic-ontology-lenses.md`
- `0036-gcp-production-verification-discipline.md`
- `0037-draft-briefing-assembly-contract.md`
- `0038-ai-first-case-creation-pattern.md`
- `0040-chapters-layered-content-rendering.md`
- `0041-desk-command-center-contract.md`
- `0042-library-tab-as-artifact-faceted-view.md`
- `0043-research-as-ingestion-front-door.md`
- `0044-draft-as-briefing-assembly-contract.md`
- `0045-ai-first-case-creation-pattern.md`
- `0049-cognee-memory-layer-disabled-first.md`
- `0050-context-capsule-unified-schema.md`

Historical v5 duplicate ADRs and superseded marketplace/tool-lane ADRs were
removed or archived during Tasklet cleanup. The 2026-05-16 aggressive cleanup
archive keeps the retired marketplace/depth, composition-chain,
visualization/extraction, and cross-cutting-tool ADRs as evidence without
listing them as current decisions.

Future ADRs should resume at the next unused numeric prefix.

Active target-state gaps are tracked in:

- `docs/PRAXIS_CODEX_PLAYBOOK.md`
- `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`
