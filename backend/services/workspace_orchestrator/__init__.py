"""Workspace orchestration seams for tabs and chapters.

The production graph will run in LangGraph. This package owns only advisory
suggestions, logs, and candidate links; canonical case product tables are
written by their surface-specific routers.
"""
from .events import WorkspaceEvent, orchestrator_heartbeat
from .log import log_orchestrator_event

__all__ = ["WorkspaceEvent", "orchestrator_heartbeat", "log_orchestrator_event"]
