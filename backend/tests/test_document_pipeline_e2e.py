from pathlib import Path

from backend.scripts.benchmark_extraction_cost import estimate_reduction


REPO_ROOT = Path(__file__).resolve().parents[2]


def test_document_pipeline_12_steps_are_labeled_in_order():
    source = (REPO_ROOT / "cloud_functions/on_document_uploaded/main.py").read_text(encoding="utf-8")
    markers = [
        "# [1] receive",
        "# [2] parse",
        "# [3] chunk",
        "# [4] embed",
        "# [5] receipt",
        "# [6] extract",
        "# [7] resolve",
        "# [8] firewall",
        "# [9] route",
        "# [10] commit",
        "# [11] index",
        "# [12] notify",
    ]

    positions = [source.index(marker) for marker in markers]

    assert positions == sorted(positions)


def test_document_pipeline_cost_benchmark_exceeds_target():
    assert estimate_reduction() >= 0.60
