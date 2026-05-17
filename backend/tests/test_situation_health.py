from __future__ import annotations

from datetime import UTC, datetime, timedelta

from services.situation_health import (
    AnalystProfileHealthInput,
    CorpusCoverageHealthInput,
    DegradationKind,
    FeedHealthInput,
    HealthState,
    JobHealthInput,
    SituationHealthInput,
    ToolOutputHealthInput,
    compute_situation_health,
)


NOW = datetime(2026, 4, 27, 12, 0, tzinfo=UTC)


def _healthy_snapshot(**overrides):
    data = {
        "now": NOW,
        "profile": AnalystProfileHealthInput(
            role="mediator",
            domain="peace-process",
            workingStyle="brief-first",
            preferredLenses=["stakeholder", "legal"],
        ),
        "feeds": [
            FeedHealthInput(source="grounded_search", lastSuccessAt=NOW - timedelta(hours=1)),
        ],
        "toolOutputs": [
            ToolOutputHealthInput(toolId="risk-monitor", generatedAt=NOW - timedelta(hours=2)),
        ],
        "expectedToolIds": ["risk-monitor"],
        "jobs": [
            JobHealthInput(jobId="job-1", kind="feed.refresh", status="completed", updatedAt=NOW),
        ],
        "corpus": CorpusCoverageHealthInput(
            totalChunks=24,
            citedItems=5,
            vectorIndexReady=True,
            lastIndexedAt=NOW - timedelta(hours=3),
        ),
    }
    data.update(overrides)
    return SituationHealthInput(**data)


def _kinds(report):
    return {finding.kind for finding in report.findings}


def test_compute_situation_health_returns_green_for_current_context():
    report = compute_situation_health(_healthy_snapshot())

    assert report.state == HealthState.GREEN
    assert report.findings == []
    assert set(report.dimensions) == {"profile", "feeds", "toolOutputs", "jobs", "corpus"}
    assert report.summary == "Situation context is current enough for calibrated analysis."


def test_compute_situation_health_flags_missing_profile_fields():
    report = compute_situation_health(
        _healthy_snapshot(
            profile=AnalystProfileHealthInput(
                role="",
                domain="peace-process",
                preferredLenses=[],
            )
        )
    )

    assert report.state == HealthState.YELLOW
    assert DegradationKind.MISSING_PROFILE_FIELDS in _kinds(report)
    profile_finding = report.dimensions["profile"].findings[0]
    assert profile_finding.evidence["missing"] == "role,preferred_lenses"


def test_compute_situation_health_flags_stale_feeds_as_red():
    report = compute_situation_health(
        _healthy_snapshot(
            feeds=[
                FeedHealthInput(source="grounded_search", lastSuccessAt=NOW - timedelta(hours=8)),
                FeedHealthInput(source="crawler_receipts", lastSuccessAt=NOW - timedelta(minutes=30), degraded=True),
            ]
        )
    )

    assert report.state == HealthState.RED
    assert report.dimensions["feeds"].state == HealthState.RED
    assert DegradationKind.STALE_FEEDS in _kinds(report)


def test_compute_situation_health_flags_stale_and_failed_tool_outputs():
    report = compute_situation_health(
        _healthy_snapshot(
            toolOutputs=[
                ToolOutputHealthInput(toolId="risk-monitor", generatedAt=NOW - timedelta(days=9)),
                ToolOutputHealthInput(toolId="briefing", generatedAt=NOW - timedelta(hours=1), status="failed"),
            ],
            expectedToolIds=["risk-monitor", "briefing", "source-scout"],
        )
    )

    assert report.state == HealthState.RED
    assert report.dimensions["toolOutputs"].state == HealthState.RED
    assert DegradationKind.STALE_TOOL_OUTPUTS in _kinds(report)
    assert len(report.dimensions["toolOutputs"].findings) == 3


def test_compute_situation_health_flags_failed_jobs():
    report = compute_situation_health(
        _healthy_snapshot(
            jobs=[
                JobHealthInput(jobId="job-1", kind="feed.refresh", status="completed", updatedAt=NOW),
                JobHealthInput(jobId="job-2", kind="document.embed", status="dead_letter", updatedAt=NOW, attempts=5),
            ]
        )
    )

    assert report.state == HealthState.RED
    assert report.dimensions["jobs"].state == HealthState.RED
    assert DegradationKind.FAILED_JOBS in _kinds(report)


def test_compute_situation_health_flags_degraded_corpus_coverage():
    report = compute_situation_health(
        _healthy_snapshot(
            corpus=CorpusCoverageHealthInput(
                totalChunks=12,
                citedItems=0,
                vectorIndexReady=False,
                lastIndexedAt=NOW - timedelta(days=5),
            )
        )
    )

    assert report.state == HealthState.YELLOW
    assert report.dimensions["corpus"].state == HealthState.YELLOW
    assert DegradationKind.DEGRADED_CORPUS_COVERAGE in _kinds(report)
    assert len(report.dimensions["corpus"].findings) == 2


def test_compute_situation_health_returns_grey_when_no_snapshots_exist():
    report = compute_situation_health(SituationHealthInput(now=NOW))

    assert report.state == HealthState.GREY
    assert all(dimension.state == HealthState.GREY for dimension in report.dimensions.values())
    assert _kinds(report) == {DegradationKind.NO_SIGNAL}
