# PRAXIS KPI Pipeline

Date: 2026-05-08

The KPI pipeline is the operational consumer of D0 structured telemetry. It is
defined in repo so the dashboard and alerts do not drift from the emitted event
schema.

## Assets

- `infrastructure/bigquery/views/events.sql` normalizes Cloud Logging JSON
  payloads into `praxis_telemetry.events`.
- `infrastructure/bigquery/queries/kpis.sql` derives daily product-health views:
  `praxis_telemetry.kpis_daily`, `praxis_telemetry.route_health_daily`, and
  `praxis_telemetry.tool_health_daily`.
- `infrastructure/monitoring/alerts.yaml` records the intended alert names and
  thresholds.
- `npm run audit:bq-views` statically checks the assets and gate membership.

## Deployment Runbook

1. Deploy the D0 telemetry code.
2. Confirm Cloud Logging receives JSON payloads with
   `message = praxis.telemetry.<event>`.
3. Create the BigQuery dataset if absent:

   ```bash
   bq --project_id=praxisbytacitus mk --dataset praxis_telemetry
   ```

4. Create or update a Cloud Logging sink that filters:

   ```text
   jsonPayload.message:"praxis.telemetry."
   ```

5. Run:

   ```bash
   PROJECT_ID=praxisbytacitus infrastructure/bigquery/deploy-views.sh
   ```

6. Create the Looker Studio dashboard from `praxis_telemetry.kpis_daily`.
7. Wire alerting from `infrastructure/monitoring/alerts.yaml` through Cloud
   Monitoring once the views are populated.

## Telemetry Dropout

Alert: `praxis-telemetry-dropout`

If no D0 structured telemetry arrives for 15 minutes while production traffic is
active, check the latest deploy, Cloud Run stdout parsing, and the logging sink
filter. The app path should still work because telemetry emission is non-fatal.

## Tool Run Fail Rate

Alert: `praxis-tool-run-fail-rate`

The first-response threshold is a 10% fail rate over 15 minutes. Use
`praxis_telemetry.tool_health_daily` to find the affected `tool_id`, then inspect
the route and provider logs for that tool.

## Document Upload Fail Rate

Alert: `praxis-document-upload-fail-rate`

The warning threshold is a 5% fail rate over 30 minutes. Check GCS bucket
permissions, PDF/DOCX extraction errors, and Firestore document writes.

## Live Status

Static assets are committed. The live BigQuery sink and Looker Studio dashboard
remain deployment tasks until D0 telemetry is observed in production logs.
