# Diagnostics Dashboard Audit

Date: 2026-05-06

Current state:

- `/app/admin/diagnostics` renders real API-driven probes from `/api/admin/diagnostics`.
- Existing panels cover storage, AI providers, secrets, feeds, counters, runtime, and the charter's seven operational categories.
- `/app/admin/operator-console` separately covers background jobs, tool runs, agent runs, ingestion, backlog, and system events.

Pack 09 seven-panel target:

| Panel | State | Next action |
|---|---|---|
| Tool health | FOUNDATION DONE | Promote operator-console tool run aggregates into diagnostics. |
| Ingestion pipeline | FOUNDATION DONE | Add P95 duration and awaiting-review counts. |
| Drift verifier | FOUNDATION DONE | Add Firestore to Postgres status after KG cutover. |
| Context Health distribution | FOUNDATION DONE | Add nightly aggregate document. |
| Symbolic firewall | FOUNDATION DONE | Add warning/rejection distribution by ontology. |
| Auth and abuse | FOUNDATION DONE | Add Firebase/Auth rate-limit aggregate. |
| Cost dashboard | FOUNDATION DONE | Join cost ledger and tool run aggregates. |

No S0/S1 blocker is recorded because the existing admin diagnostics are functional and now expose the seven-panel operational shell. The remaining v1.1 hardening item is replacing foundation signals with scheduler-backed aggregates and parity snapshots.
