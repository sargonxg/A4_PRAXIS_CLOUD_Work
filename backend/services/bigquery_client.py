"""BigQuery client — pipeline audit logs and usage metrics."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import uuid4

from config import get_settings

logger = logging.getLogger("praxis.bigquery")


def _get_client():
    from google.cloud import bigquery
    return bigquery.Client()


def _dataset() -> str:
    return get_settings().bigquery_dataset


def _project() -> str:
    return get_settings().gcp_project_id


def log_pipeline_run(
    tenant_id: str,
    situation_id: str,
    nodes_count: int,
    edges_count: int,
    duration_ms: int,
    status: str,
) -> None:
    """Log a pipeline run to BigQuery for audit and analytics."""
    try:
        client = _get_client()
        table_id = f"{_project()}.{_dataset()}.pipeline_runs"
        rows = [{
            "run_id": str(uuid4()),
            "tenant_id": tenant_id,
            "situation_id": situation_id,
            "nodes_count": nodes_count,
            "edges_count": edges_count,
            "duration_ms": duration_ms,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }]
        client.insert_rows_json(table_id, rows)
    except Exception as exc:
        logger.warning("BigQuery pipeline_runs log failed: %s", exc)


def log_extraction(
    tenant_id: str,
    source_file: str,
    source_type: str,
    nodes_count: int,
    edges_count: int,
    model: str,
    input_tokens: int,
    output_tokens: int,
    situation_id: str = "",
    duration_ms: int = 0,
) -> None:
    """Log an extraction operation to BigQuery."""
    try:
        client = _get_client()
        table_id = f"{_project()}.{_dataset()}.extractions"
        rows = [{
            "extraction_id": str(uuid4()),
            "tenant_id": tenant_id,
            "situation_id": situation_id,
            "source_file": source_file,
            "source_type": source_type,
            "nodes_count": nodes_count,
            "edges_count": edges_count,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "duration_ms": duration_ms,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }]
        client.insert_rows_json(table_id, rows)
    except Exception as exc:
        logger.warning("BigQuery extraction log failed: %s", exc)


def get_usage_metrics(tenant_id: str, date_from: str, date_to: str) -> dict:
    """Query usage metrics for a tenant over a date range."""
    try:
        client = _get_client()
        query = f"""
            SELECT
                COUNT(*) as total_runs,
                SUM(nodes_count) as total_nodes,
                SUM(edges_count) as total_edges,
                AVG(duration_ms) as avg_duration_ms,
                COUNTIF(status = 'complete') as successful_runs
            FROM `{_project()}.{_dataset()}.pipeline_runs`
            WHERE tenant_id = @tenant_id
              AND timestamp BETWEEN @from AND @to
        """
        from google.cloud import bigquery
        job = client.query(
            query,
            job_config=bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("tenant_id", "STRING", tenant_id),
                    bigquery.ScalarQueryParameter("from", "STRING", date_from),
                    bigquery.ScalarQueryParameter("to", "STRING", date_to),
                ]
            )
        )
        rows = list(job.result())
        return dict(rows[0]) if rows else {}
    except Exception:
        return {}


def log_agent_run_analytics(row: dict) -> None:
    """Mirror a PRAXIS AgentRun row into BigQuery analytics."""
    _insert_analytics_row("agent_runs_analytics", row)


def log_agent_run_event_analytics(row: dict) -> None:
    """Mirror a PRAXIS AgentRun event into BigQuery analytics."""
    _insert_analytics_row("agent_run_events_analytics", row)


def log_agent_tool_call_analytics(row: dict) -> None:
    """Mirror a PRAXIS agent tool call into BigQuery analytics."""
    _insert_analytics_row("agent_tool_calls_analytics", row)


def log_agent_approval_analytics(row: dict) -> None:
    """Mirror a PRAXIS agent approval into BigQuery analytics."""
    _insert_analytics_row("agent_approvals_analytics", row)


def _insert_analytics_row(table_name: str, row: dict) -> None:
    try:
        client = _get_client()
        table_id = f"{_project()}.{_dataset()}.{table_name}"
        client.insert_rows_json(table_id, [_json_ready(row)])
    except Exception as exc:
        logger.warning("BigQuery %s log failed: %s", table_name, exc)


def _json_ready(row: dict) -> dict:
    clean: dict = {}
    for key, value in row.items():
        if isinstance(value, datetime):
            clean[key] = value.astimezone(timezone.utc).isoformat()
        else:
            clean[key] = value
    return clean
