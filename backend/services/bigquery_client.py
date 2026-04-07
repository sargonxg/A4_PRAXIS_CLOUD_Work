"""BigQuery client — pipeline audit logs and usage metrics."""
from __future__ import annotations

from datetime import datetime, timezone

from config import get_settings


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
            "tenant_id": tenant_id,
            "situation_id": situation_id,
            "nodes_count": nodes_count,
            "edges_count": edges_count,
            "duration_ms": duration_ms,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }]
        client.insert_rows_json(table_id, rows)
    except Exception:
        pass  # Non-critical — don't fail pipeline on logging errors


def log_extraction(
    tenant_id: str,
    source_file: str,
    source_type: str,
    nodes_count: int,
    edges_count: int,
    model: str,
    input_tokens: int,
    output_tokens: int,
) -> None:
    """Log an extraction operation to BigQuery."""
    try:
        client = _get_client()
        table_id = f"{_project()}.{_dataset()}.extractions"
        rows = [{
            "tenant_id": tenant_id,
            "source_file": source_file,
            "source_type": source_type,
            "nodes_count": nodes_count,
            "edges_count": edges_count,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }]
        client.insert_rows_json(table_id, rows)
    except Exception:
        pass


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
