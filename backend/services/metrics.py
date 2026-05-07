"""Small in-process metrics registry for backend pre-ship visibility.

This intentionally emits Prometheus text without adding another runtime
dependency. Cloud Run instances are ephemeral, so these counters are for live
health probes and scrape-based aggregation, not durable analytics.
"""
from __future__ import annotations

from collections import defaultdict
from threading import Lock
from typing import Mapping


_lock = Lock()
_counters: dict[tuple[str, tuple[tuple[str, str], ...]], float] = defaultdict(float)
_latency: dict[tuple[str, tuple[tuple[str, str], ...]], dict[str, float]] = defaultdict(
    lambda: {"count": 0.0, "sum": 0.0}
)


def _labels(labels: Mapping[str, object] | None = None) -> tuple[tuple[str, str], ...]:
    if not labels:
        return ()
    return tuple(sorted((str(key), str(value)) for key, value in labels.items() if value is not None))


def increment_counter(name: str, labels: Mapping[str, object] | None = None, amount: float = 1.0) -> None:
    with _lock:
        _counters[(name, _labels(labels))] += amount


def observe_latency(name: str, seconds: float, labels: Mapping[str, object] | None = None) -> None:
    with _lock:
        bucket = _latency[(name, _labels(labels))]
        bucket["count"] += 1.0
        bucket["sum"] += max(0.0, seconds)


def record_cognee_call(*, operation: str, status: str, seconds: float, mode: str | None = None) -> None:
    labels = {"operation": operation, "status": status, "mode": mode or "none"}
    increment_counter("cognee_calls_total", labels)
    observe_latency("cognee_latency_seconds", seconds, {"operation": operation, "mode": mode or "none"})
    if status not in {"disabled", "queued_disabled", "ok"}:
        increment_counter("cognee_failures_total", {"operation": operation, "status": status})


def record_tenant_session_reset() -> None:
    increment_counter("tenant_session_resets_total")


def render_prometheus() -> str:
    lines: list[str] = [
        "# HELP cognee_calls_total Total Cognee wrapper calls by operation, status, and mode.",
        "# TYPE cognee_calls_total counter",
        "# HELP cognee_failures_total Cognee wrapper failures by operation and status.",
        "# TYPE cognee_failures_total counter",
        "# HELP cognee_latency_seconds Cognee wrapper latency summary.",
        "# TYPE cognee_latency_seconds summary",
        "# HELP tenant_session_resets_total Tenant sessions returned to the pool after transaction exit.",
        "# TYPE tenant_session_resets_total counter",
    ]
    with _lock:
        for (name, labels), value in sorted(_counters.items()):
            lines.append(f"{name}{_format_labels(labels)} {value:g}")
        for (name, labels), values in sorted(_latency.items()):
            label_text = _format_labels(labels)
            lines.append(f"{name}_count{label_text} {values['count']:g}")
            lines.append(f"{name}_sum{label_text} {values['sum']:g}")
    return "\n".join(lines) + "\n"


def _format_labels(labels: tuple[tuple[str, str], ...]) -> str:
    if not labels:
        return ""
    body = ",".join(f'{key}="{_escape(value)}"' for key, value in labels)
    return f"{{{body}}}"


def _escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


def reset_metrics_for_tests() -> None:
    with _lock:
        _counters.clear()
        _latency.clear()
