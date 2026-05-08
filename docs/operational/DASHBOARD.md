# PRAXIS Product Health Dashboard

Date: 2026-05-08

The dashboard should be built in Looker Studio on top of
`praxis_telemetry.kpis_daily`, with drilldowns into
`praxis_telemetry.route_health_daily` and `praxis_telemetry.tool_health_daily`.

## Required Tiles

- Active users
- Cases created
- Tool runs started, completed, and failed
- Tool failure rate
- Tool latency P50/P95
- Documents uploaded
- Memo exports
- Graph populations
- AI cost in USD
- Route-level failure and latency table

## Interpretation

The dashboard is not a replacement for logs. It is the first product-health
screen for whether analysts are creating situations, adding context, running
tools, exporting memos, and populating graphs.

## Current Gate

The repository now enforces the SQL and documentation assets through
`npm run audit:bq-views`. The live dashboard is considered verified only after
production Cloud Logging has D0 events and the BigQuery views return non-empty
rows.
