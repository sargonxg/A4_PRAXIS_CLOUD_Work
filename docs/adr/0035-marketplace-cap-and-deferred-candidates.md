# ADR 0035: Marketplace Cap and Deferred Candidates

Date: 2026-05-07

## Status

Accepted.

## Context

Pack 21 contains an internal count conflict: it requires 30 new tools and 52
total marketplace tools, while the detailed candidate list names 36 possible
new tools. The product direction also says the marketplace should stay
streamlined and never show users an unbounded tool wall.

## Decision

PRAXIS keeps the Pack 21 marketplace cap at 52 tools for v1.2. The implemented
set prioritizes:

- The 20 Pack 20 forward-declared tools for Human Rights, Economic/Sanctions,
  Humanitarian, Legal/Treaty, and Security/Defense.
- Seven cross-cutting tools that compound across all ontologies.
- Three conflict-depth tools that improve the existing conflict workflow.

The six over-cap candidates remain deferred rather than silently omitted:

- `mediation.batna-watna-explorer`
- `mediation.face-saving-options`
- `governance.veto-coalition-mapper`
- `governance.compliance-monitor`
- `narrative.disinformation-network-mapper`
- `narrative.frame-coalition-shift`

They may enter a later release only by replacing a lower-value tool, raising the
cap through a new ADR, or moving into a role-specific advanced bundle.

## Consequences

The 52-tool cap is now an explicit product invariant, guarded by
`audit:tool-marketplace` and `audit:tool-composition-static`. This keeps Pack 21
complete under its explicit total-count requirement while preserving the
deferred candidates for future product review.
