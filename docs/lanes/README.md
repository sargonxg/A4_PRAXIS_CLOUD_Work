# Codex Lanes

Use these lane files when work needs to be split across sessions or agents.

- `LANE_FRONTEND.md`: Ask/workbench UI, responsive behavior, browser QA.
- `LANE_RUNTIME.md`: Ask runtime, agent runs, streams, orchestration, persistence.
- `LANE_CLOUD.md`: GCP/Firebase/Cloud Run/IAM/Secret Manager/deploy readiness.
- `LANE_DEPENDENCIES.md`: dependency upgrades, security audit, lockfile changes.

Each lane should produce local evidence before another lane builds on it.
