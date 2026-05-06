# Diagnostics Dashboard Audit

Date: 2026-05-06

Current state:

- `/app/admin/diagnostics` renders real API-driven probes from `/api/admin/diagnostics`.
- Existing panels cover storage, AI providers, secrets, feeds, counters, and runtime.
- `/app/admin/operator-console` separately covers background jobs, tool runs, agent runs, ingestion, backlog, and system events.

Pack 09 seven-panel target:

| Panel | State | Next action |
|---|---|---|
| Tool health | PARTIAL | Promote operator-console tool run aggregates into diagnostics. |
| Ingestion pipeline | PARTIAL | Add P95 duration and awaiting-review counts. |
| Drift verifier | PARTIAL | Add Firestore to Postgres status after KG cutover. |
| Context Health distribution | MISSING | Add nightly aggregate document. |
| Symbolic firewall | PARTIAL | Add warning/rejection distribution by ontology. |
| Auth and abuse | MISSING | Add Firebase/Auth rate-limit aggregate. |
| Cost dashboard | PARTIAL | Join cost ledger and tool run aggregates. |

No S0/S1 blocker is recorded because the existing admin diagnostics are functional; the seven-panel operational dashboard is a v1.1 hardening item.
