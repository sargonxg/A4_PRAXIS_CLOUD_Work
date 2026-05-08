# PRAXIS Audit Taxonomy

PRAXIS audit output must say what kind of evidence a green result represents.
The default gate stays fast and dependency-light; runtime checks are explicit.

## Tier 1: Static-Marker

Fast file, import, route, and marker checks. These can pass while runtime is
scaffolded, but they catch refactor regressions and broken structural contracts.

Examples: `audit:routes`, `audit:tool-context-isolation`, `audit:cognee`,
`audit:cognee-operations`, `audit:transparency-cards`,
`audit:evidence-drawer`, `audit:purpose-surface`, `audit:owner-scoping`,
`audit:no-deterministic-tool-output-in-ui`, `audit:cognee-ui-honesty`,
`audit:hero-tool-calibration-coverage`, `audit:thin-case-handling`,
`audit:onboarding-gate`, `audit:aco-parity`.

Run on every PR through `npm run audit:gate`.

## Tier 2: Configuration-Aware

Reads code configuration and verifies internal consistency without external
services. These checks are stronger than markers but still local.

Examples: `audit:embedding-dim`, `audit:document-ingest-parity`,
`audit:model-matrix-coverage`, `audit:ai-provider-isolation`,
`audit:ai-provider-vertex-default`.

Run on every PR through `npm run audit:gate`.

## Tier 3: Runtime-Proof

Hits real services such as Cloud SQL, Cognee, Firestore, or deployed HTTP
routes. Runtime-proof audits skip with an explicit message when their opt-in
environment is missing.

Examples: `audit:kg-drift-runtime`, `audit:cognee-runtime`, live mode of
`audit:embedding-dim`.

Run on protected branches through `npm run audit:gate-with-cloud`.

## Tier 4: Cross-Tenant Runtime

Exercises authenticated flows across users. These checks are required before
multi-user collaboration or team-scoped reads ship.

Examples: `audit:owner-scoping-runtime`,
`audit:tool-context-isolation-runtime`.

Run on release candidates through `npm run audit:gate-runtime-full`.

## Gate Composition

`audit:gate` is the every-PR gate: static-marker plus configuration-aware.

`audit:gate-with-cloud` runs `audit:gate`, then Cloud SQL and Cognee runtime
checks.

`audit:gate-runtime-full` runs `audit:gate-with-cloud`, then cross-tenant
runtime checks.
