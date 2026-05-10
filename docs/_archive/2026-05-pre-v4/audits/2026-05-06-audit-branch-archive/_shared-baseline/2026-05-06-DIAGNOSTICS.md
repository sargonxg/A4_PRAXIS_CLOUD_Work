# Diagnostics Dashboard Audit

Date: 2026-05-06

Current state:

- `/app/admin/diagnostics` renders real API-driven probes from `/api/admin/diagnostics`.
- Existing panels cover storage, AI providers, secrets, feeds, counters, runtime, and the charter's seven operational categories.
- `/api/cron/operational-metrics` now writes a persisted `operational_metrics/latest` snapshot and `operational_metrics_history/*` records for diagnostics to consume.
- `/app/admin/operator-console` separately covers background jobs, tool runs, agent runs, ingestion, backlog, and system events.

Pack 09 seven-panel target:

| Panel | State | Next action |
|---|---|---|
| Tool health | SCHEDULER SNAPSHOT DONE | Promote provider-level specialist handler latency after handlers ship. |
| Ingestion pipeline | SCHEDULER SNAPSHOT DONE | Add production graph proposal review SLA after ingestion cutover. |
| Drift verifier | FOUNDATION DONE | Add Firestore to Postgres status after KG cutover. |
| Context Health distribution | SCHEDULER SNAPSHOT DONE | Add richer persona/user-segment buckets. |
| Symbolic firewall | SCHEDULER SNAPSHOT DONE | Add route-level warning/rejection distribution once streaming events land. |
| Auth and abuse | SCHEDULER SNAPSHOT DONE | Add dedicated failed-auth/rate-limit event taxonomy. |
| Cost dashboard | SCHEDULER SNAPSHOT DONE | Join provider-level external API cost once specialist handlers are live. |

No S0/S1 blocker is recorded because the existing admin diagnostics are functional and now consume scheduler-backed operational snapshots when present, falling back to live probes before the first cron write. The remaining v1.1 hardening item is enriching those snapshots with Postgres parity, provider-level cost, and streaming firewall event distributions.
