-- D1 KPI pipeline.
-- Source table expectation: Cloud Logging sink writes D0 JSON-line telemetry
-- into `praxisbytacitus.praxis_telemetry._AllLogs`. If the sink uses a
-- different table name, update only the FROM clause below before deployment.

CREATE OR REPLACE VIEW `praxis_telemetry.events` AS
SELECT
  TIMESTAMP(JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.createdAt')) AS created_at,
  JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.eventName') AS event_name,
  JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.uid') AS uid,
  JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.orgId') AS org_id,
  JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.caseId') AS case_id,
  JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.sessionId') AS session_id,
  JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.route') AS route,
  JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.toolId') AS tool_id,
  SAFE_CAST(JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.latencyMs') AS INT64) AS latency_ms,
  JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.status') AS status,
  SAFE_CAST(JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.costUsd') AS NUMERIC) AS cost_usd,
  SAFE_CAST(JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.schemaVersion') AS INT64) AS schemaVersion,
  JSON_QUERY(TO_JSON_STRING(jsonPayload), '$.details') AS details_json,
  timestamp AS log_timestamp
FROM `praxisbytacitus.praxis_telemetry._AllLogs`
WHERE JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.message') LIKE 'praxis.telemetry.%'
  AND SAFE_CAST(JSON_VALUE(TO_JSON_STRING(jsonPayload), '$.schemaVersion') AS INT64) = 1;
