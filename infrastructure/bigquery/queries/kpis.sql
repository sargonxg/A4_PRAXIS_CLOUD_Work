-- D1 KPI pipeline derived views.

CREATE OR REPLACE VIEW `praxis_telemetry.kpis_daily` AS
SELECT
  DATE(created_at) AS day,
  COUNT(DISTINCT IF(uid IS NOT NULL AND uid != 'anonymous', uid, NULL)) AS active_users,
  COUNTIF(event_name = 'case.create' AND status = 'ok') AS cases_created,
  COUNTIF(event_name = 'tool.run-start') AS tool_runs,
  COUNTIF(event_name = 'tool.run-complete' AND status = 'ok') AS tool_runs_completed,
  COUNTIF(event_name = 'tool.run-fail') AS tool_runs_failed,
  SAFE_DIVIDE(COUNTIF(event_name = 'tool.run-fail'), NULLIF(COUNTIF(event_name = 'tool.run-start'), 0)) AS tool_fail_rate,
  COUNTIF(event_name = 'document.upload-complete' AND status = 'ok') AS documents_uploaded,
  COUNTIF(event_name = 'memo.export' AND status = 'ok') AS memo_exports,
  COUNTIF(event_name = 'graph.populate-complete' AND status = 'ok') AS graph_populates,
  APPROX_QUANTILES(IF(event_name = 'tool.run-complete', latency_ms, NULL), 100)[OFFSET(50)] AS tool_latency_p50_ms,
  APPROX_QUANTILES(IF(event_name = 'tool.run-complete', latency_ms, NULL), 100)[OFFSET(95)] AS tool_latency_p95_ms,
  SUM(IFNULL(cost_usd, 0)) AS ai_cost_usd
FROM `praxis_telemetry.events`
WHERE created_at IS NOT NULL
GROUP BY day;

CREATE OR REPLACE VIEW `praxis_telemetry.route_health_daily` AS
SELECT
  DATE(created_at) AS day,
  route,
  COUNT(*) AS event_count,
  COUNTIF(status = 'fail') AS fail_count,
  SAFE_DIVIDE(COUNTIF(status = 'fail'), COUNT(*)) AS fail_rate,
  APPROX_QUANTILES(latency_ms, 100)[OFFSET(95)] AS latency_p95_ms
FROM `praxis_telemetry.events`
WHERE route IS NOT NULL
GROUP BY day, route;

CREATE OR REPLACE VIEW `praxis_telemetry.tool_health_daily` AS
SELECT
  DATE(created_at) AS day,
  tool_id,
  COUNTIF(event_name = 'tool.run-start') AS started,
  COUNTIF(event_name = 'tool.run-complete') AS completed,
  COUNTIF(event_name = 'tool.run-fail') AS failed,
  SAFE_DIVIDE(COUNTIF(event_name = 'tool.run-fail'), NULLIF(COUNTIF(event_name = 'tool.run-start'), 0)) AS fail_rate,
  APPROX_QUANTILES(IF(event_name = 'tool.run-complete', latency_ms, NULL), 100)[OFFSET(95)] AS latency_p95_ms,
  SUM(IFNULL(cost_usd, 0)) AS cost_usd
FROM `praxis_telemetry.events`
WHERE tool_id IS NOT NULL
GROUP BY day, tool_id;
