# Phase 10 - staging proof and reviewable release

Additional required reading: [research/SOLO_FOUNDER_EXECUTION.md](../../research/SOLO_FOUNDER_EXECUTION.md). Use these as design inputs; verify current provider/repository contracts in this checkout.

Use the existing PRAXIS deployment process and required repository release gates. Inspect its current scripts and Cloud Run/data migration instructions; do not run an old command from the blueprint without verifying it. Prepare a feature-flagged release of only the capabilities whose acceptance gates passed. Keep deeper media or unverified collectors disabled.

Run applicable typecheck, lint, unit/storage/auth tests, relevant architecture/provider audits, production build, authenticated `/signal` journey and baseline PRAXIS smoke. Validate migrations/indexes/rules with the staging tenant. Verify response caching, direct object authorization, graph/export isolation, worker authentication, budget stops and deletion/retention behavior. Record exact commit, dependency lock, runtime, models and configuration names.

Prepare a deployment manifest, staging URL, migration plan, smoke commands, rollback procedure and operator monitoring checklist. Preserve prior PRAXIS capsule/native workflow compatibility and prove that `/signal` does not regress existing navigation and authenticated routes. Use the authorized staging identity if available. If staging deployment access is missing, complete all local build/release preparation and mark the staging gate blocked.

Production deployment is a distinct action. Before it, make the release concrete and reviewable with passing staging evidence and the repository's required authorization. The target route is `https://praxis.tacitus.me/signal` on the existing host; do not deploy a separate unrelated portal and call it integration. Do not publish synthetic fixture data into customer desks.

Acceptance: reproducible build, documented migration/rollback, staging proof with real auth, bounded live collector/model checks for enabled integrations, and no unresolved critical tenant or evidence-integrity failures. Distinguish build success, staging success and production success. Never report a URL as live merely because route files were committed or a deployment command was submitted.
