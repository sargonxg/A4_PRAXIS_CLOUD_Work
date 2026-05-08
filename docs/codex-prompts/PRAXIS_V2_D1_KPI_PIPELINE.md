# D1 — KPI pipeline: BigQuery sink + dashboard

## Goal

D0 emits structured events to Cloud Logging. This file pipes them to
BigQuery, defines the queries that answer the operational and
strategic questions that matter, and stands up a dashboard. After
this file ships, you can answer in a single tab: "How many active
analysts last week, what tools did they run, what was the median
calibration health, what's the retention curve."

## Pre-conditions

D0 shipped. Cloud Logging shows JSON-line `telemetry` entries from
production traffic.

## Files Codex must read first

- D0 outputs (emit sites, schema)
- Existing Cloud Logging configuration (`infrastructure/logging/*`
  if present)
- `docs/architecture/TELEMETRY.md`

## Tasks

### 1. BigQuery dataset

GC creates the dataset (one-time, console or `bq mk`):

```bash
bq mk --dataset \
  --description "PRAXIS production telemetry" \
  --location us-central1 \
  praxisbytacitus:praxis_telemetry
```

Document in `STATUS.md` as a deploy-step requirement.

### 2. Cloud Logging sink

Cloud Logging ingest filter:

```
jsonPayload.telemetry.schemaVersion = 1
AND resource.type = "cloud_run_revision"
AND resource.labels.service_name = "praxis-monolith"
```

Sink destination: BigQuery dataset `praxis_telemetry`. GC creates the
sink:

```bash
gcloud logging sinks create praxis-telemetry-sink \
  bigquery.googleapis.com/projects/praxisbytacitus/datasets/praxis_telemetry \
  --log-filter='jsonPayload.telemetry.schemaVersion=1 AND resource.type="cloud_run_revision" AND resource.labels.service_name="praxis-monolith"'
```

Then grant the sink's service account write permission:

```bash
SINK_SA=$(gcloud logging sinks describe praxis-telemetry-sink --format='value(writerIdentity)')
bq add-iam-policy-binding \
  --member="$SINK_SA" \
  --role='roles/bigquery.dataEditor' \
  praxisbytacitus:praxis_telemetry
```

Codex documents the commands in `STATUS.md`.

### 3. View definitions

BigQuery materializes events as `<dataset>.run_googleapis_com_*`
tables. Codex creates views that flatten the nested `jsonPayload`
into a queryable shape:

```sql
-- praxis_telemetry.events
CREATE OR REPLACE VIEW `praxisbytacitus.praxis_telemetry.events` AS
SELECT
  JSON_VALUE(jsonPayload.telemetry.event) AS event,
  TIMESTAMP(JSON_VALUE(jsonPayload.telemetry.ts)) AS ts,
  JSON_VALUE(jsonPayload.telemetry.uid) AS uid,
  JSON_VALUE(jsonPayload.telemetry.orgId) AS org_id,
  JSON_VALUE(jsonPayload.telemetry.sessionId) AS session_id,
  JSON_VALUE(jsonPayload.telemetry.caseId) AS case_id,
  JSON_VALUE(jsonPayload.telemetry.toolId) AS tool_id,
  JSON_VALUE(jsonPayload.telemetry.outcome) AS outcome,
  CAST(JSON_VALUE(jsonPayload.telemetry.latencyMs) AS INT64) AS latency_ms,
  JSON_VALUE(jsonPayload.telemetry.errorClass) AS error_class,
  jsonPayload.telemetry.details AS details_json,
  resource.labels.revision_name AS revision
FROM `praxisbytacitus.praxis_telemetry.run_googleapis_com_*`
WHERE JSON_VALUE(jsonPayload.telemetry.schemaVersion) = '1';
```

Codex puts this in `infrastructure/bigquery/views/events.sql` and a
deploy script.

### 4. KPI queries

`infrastructure/bigquery/queries/kpis.sql`:

```sql
-- 1. Weekly active analysts (last 4 weeks)
SELECT
  DATE_TRUNC(DATE(ts), WEEK(MONDAY)) AS week_start,
  COUNT(DISTINCT uid) AS active_analysts,
  COUNT(DISTINCT org_id) AS active_orgs,
  COUNT(DISTINCT case_id) AS active_cases,
FROM `praxisbytacitus.praxis_telemetry.events`
WHERE ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 28 DAY)
  AND event IN ('case.open', 'tool.run-complete', 'graph.populate-complete')
GROUP BY week_start
ORDER BY week_start DESC;

-- 2. Hero-tool runs per week, by tool
SELECT
  DATE_TRUNC(DATE(ts), WEEK(MONDAY)) AS week_start,
  tool_id,
  COUNT(*) AS runs,
  COUNT(DISTINCT uid) AS distinct_users,
  APPROX_QUANTILES(latency_ms, 100)[OFFSET(50)] AS p50_latency_ms,
  APPROX_QUANTILES(latency_ms, 100)[OFFSET(95)] AS p95_latency_ms,
  COUNTIF(outcome = 'fail') AS failures,
FROM `praxisbytacitus.praxis_telemetry.events`
WHERE event = 'tool.run-complete'
  AND ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 28 DAY)
GROUP BY week_start, tool_id
ORDER BY week_start DESC, runs DESC;

-- 3. Mean prompt-health score across runs
SELECT
  DATE_TRUNC(DATE(ts), WEEK(MONDAY)) AS week_start,
  AVG(CAST(JSON_VALUE(details_json, '$.health') AS FLOAT64)) AS mean_health,
  AVG(CAST(JSON_VALUE(details_json, '$.graphHealth') AS FLOAT64)) AS mean_graph_health,
  AVG(CAST(JSON_VALUE(details_json, '$.profileHealth') AS FLOAT64)) AS mean_profile_health,
  AVG(CAST(JSON_VALUE(details_json, '$.sourcesHealth') AS FLOAT64)) AS mean_sources_health,
FROM `praxisbytacitus.praxis_telemetry.events`
WHERE event = 'calibration.snapshot'
  AND ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 28 DAY)
GROUP BY week_start
ORDER BY week_start DESC;

-- 4. Refusal rate (thin-case handling firing)
SELECT
  DATE_TRUNC(DATE(ts), WEEK(MONDAY)) AS week_start,
  COUNTIF(event = 'calibration.refusal') AS refusals,
  COUNTIF(event = 'calibration.compensation') AS compensations,
  COUNTIF(event = 'tool.run-complete') AS completions,
  SAFE_DIVIDE(COUNTIF(event = 'calibration.refusal'), COUNTIF(event = 'tool.run-start')) AS refusal_rate,
FROM `praxisbytacitus.praxis_telemetry.events`
WHERE ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 28 DAY)
GROUP BY week_start
ORDER BY week_start DESC;

-- 5. Retention curve (Day-N return)
WITH first_seen AS (
  SELECT uid, MIN(DATE(ts)) AS first_day
  FROM `praxisbytacitus.praxis_telemetry.events`
  WHERE event = 'auth.signin'
  GROUP BY uid
),
returns AS (
  SELECT
    fs.uid,
    fs.first_day,
    DATE_DIFF(DATE(e.ts), fs.first_day, DAY) AS days_since_first,
  FROM first_seen fs
  JOIN `praxisbytacitus.praxis_telemetry.events` e ON e.uid = fs.uid
  WHERE event = 'auth.signin'
)
SELECT
  days_since_first,
  COUNT(DISTINCT uid) AS users,
  COUNT(DISTINCT uid) / NULLIF((SELECT COUNT(DISTINCT uid) FROM first_seen), 0) AS retention_rate,
FROM returns
WHERE days_since_first IN (0, 1, 7, 14, 28)
GROUP BY days_since_first
ORDER BY days_since_first;

-- 6. Marketplace vs hero ratio
SELECT
  DATE_TRUNC(DATE(ts), WEEK(MONDAY)) AS week_start,
  COUNTIF(event = 'tool.run-complete') AS hero_runs,
  COUNTIF(event = 'marketplace.recipe-stage') AS marketplace_stages,
  SAFE_DIVIDE(COUNTIF(event = 'marketplace.recipe-stage'), COUNTIF(event = 'tool.run-complete')) AS marketplace_to_hero_ratio,
FROM `praxisbytacitus.praxis_telemetry.events`
WHERE ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 28 DAY)
GROUP BY week_start
ORDER BY week_start DESC;

-- 7. Per-org usage summary (for sales conversations)
SELECT
  org_id,
  COUNT(DISTINCT uid) AS analysts,
  COUNT(DISTINCT case_id) AS cases,
  COUNTIF(event = 'tool.run-complete') AS tool_runs,
  COUNTIF(event = 'export.briefing' OR event = 'export.boardroom') AS exports,
  MAX(ts) AS last_active,
FROM `praxisbytacitus.praxis_telemetry.events`
WHERE ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
GROUP BY org_id
ORDER BY tool_runs DESC;
```

### 5. Dashboard

Two options:

**Option A: Looker Studio (free, fast)**

Connect a Looker Studio report to BigQuery. Codex documents:

- Data source: BigQuery → `praxisbytacitus.praxis_telemetry.events`
- Pages: KPIs, Tool Usage, Calibration Health, Retention, Per-Org

GC creates the report. Codex provides screenshots/specs in
`docs/operational/DASHBOARD.md`.

**Option B: Simple internal page**

A `/admin/dashboard` route in the Next app that runs the queries via
BigQuery client and renders charts (Recharts). More control but more
maintenance.

**Recommended: Option A** for speed; Option B if Looker free tier
hits limits.

### 6. Alerting

A small set of alerts in Cloud Monitoring:

| Alert | Condition |
|---|---|
| `praxis-tool-failure-rate` | `> 10%` of `tool.run-*` events have outcome='fail' over 1 hour |
| `praxis-no-traffic` | 0 events for `> 30 minutes` during 9-21 UTC business hours |
| `praxis-calibration-collapse` | Mean `health` `< 30` for 1 hour |
| `praxis-export-failure-spike` | `> 5` `export.*` failures in 10 minutes |

Codex documents the alert configurations in
`infrastructure/monitoring/alerts.yaml`. GC creates them.

### 7. Audit: `audit:bq-views`

Static-marker confirming the SQL files exist in
`infrastructure/bigquery/`. Doesn't validate against BigQuery (that
needs credentials), but it ensures the view definitions are
checked into the repo.

### 8. Documentation

`docs/operational/KPIS.md`:

```markdown
# PRAXIS KPIs

## What we track

- WAA: Weekly Active Analysts (distinct uids with case.open OR
  tool.run-complete in the week)
- Tool runs / week / tool: hero-tool usage breakdown
- Mean health: composite + per-component (graph, profile, sources)
- Refusal rate: % of starts that turn into refusals
- Retention: Day 0/1/7/14/28
- Marketplace ratio: marketplace stages / hero runs

## What we DON'T track in KPIs

- Investor metrics (LTV, CAC, MRR) — separate billing dataset
- Engineering health (deploy frequency, MTTR) — separate sources
- Compliance audit (who did what when) — that's the audit log
  (A6), not telemetry.

## How to read

| KPI | Healthy | Watch | Action needed |
|---|---|---|---|
| WAA | up week-over-week | flat | down 2 wk |
| Tool runs / WAA | > 5 | 2-5 | < 2 |
| Mean health | > 65 | 50-65 | < 50 |
| Refusal rate | 5-15% | 15-30% | > 30% (means too many thin cases) or < 5% (means refusal not firing) |
| D7 retention | > 30% | 20-30% | < 20% |
| Marketplace ratio | < 0.5 | 0.5-1.0 | > 1.0 (marketplace eating hero) |
```

## Acceptance criteria

1. BigQuery dataset created.
2. Cloud Logging sink in place.
3. View definition committed to repo.
4. Seven KPI queries committed and produce results from real data.
5. Dashboard exists (Looker Studio link or internal page).
6. Four alerts configured.
7. `docs/operational/KPIS.md` written.

## Diagnostics

```bash
# 1. SQL files
test -f infrastructure/bigquery/views/events.sql && echo OK
test -f infrastructure/bigquery/queries/kpis.sql && echo OK

# 2. View resolves (run from a machine with bq CLI auth)
bq query --use_legacy_sql=false \
  "SELECT COUNT(*) FROM \`praxisbytacitus.praxis_telemetry.events\` WHERE ts > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)"

# 3. KPI queries return reasonable results
for q in 1 2 3 4 5 6 7; do
  echo "running KPI $q..."
  # extract the q-th query from kpis.sql and run
done

# 4. Audit
npm run audit:bq-views && echo OK
```

## If Codex stops short

**Failure mode A**: Sink not receiving events. Re-prompt:

> "Confirm the sink filter matches what the app emits. Run:
>   gcloud logging read 'jsonPayload.telemetry.schemaVersion=1' \\
>     --limit=5 --format=json
> If empty, the filter is wrong. The events come through as
> jsonPayload, not textPayload — verify the path."

**Failure mode B**: BigQuery shows events but queries return errors
on JSON_VALUE. Re-prompt:

> "BigQuery JSON parsing is sensitive. Confirm the events table
> (run_googleapis_com_*) actually has jsonPayload as STRUCT or
> JSON. If STRING, parse with PARSE_JSON first. Adjust the views."

**Failure mode C**: Alerts fire on noise. Re-prompt:

> "Tune thresholds. praxis-no-traffic at 30 min during business
> hours is right; outside business hours, suppress (or change to
> 4 hours). praxis-tool-failure-rate at 10% is too tight in early
> traffic — set to 25% until weekly volume > 100 runs."

## Commit

```
feat(D1): bigquery sink + kpi dashboard

Cloud Logging structured-events (D0) sink to BigQuery dataset
praxis_telemetry. Flattening view at events. Seven KPI queries
covering: WAA, tool usage, calibration health, refusals, retention,
marketplace-to-hero ratio, per-org usage.

Looker Studio dashboard (link in docs/operational/DASHBOARD.md).
Four Cloud Monitoring alerts: failure rate, no-traffic,
calibration collapse, export failure spike.

audit:bq-views ensures the SQL files stay in repo.

docs/operational/KPIS.md describes how to read the metrics.

Refs: V2_WORK_PACK/D1_KPI_PIPELINE.md
```
