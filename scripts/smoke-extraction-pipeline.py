"""Local smoke check for the Pack 30 extraction pipeline contracts."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.services.context_genesis.pipeline import PIPELINE_STAGES, default_pipeline_plan


def main() -> None:
    plan = default_pipeline_plan(case_id="smoke-case", source_uri="gs://example/source.pdf", ontology_ids=["conflict"])
    print("stages=" + ",".join(PIPELINE_STAGES))
    print("case_id=" + plan.case_id)
    print("source_uri=" + plan.source_uri)
    print("ontology_ids=" + ",".join(plan.ontology_ids))


if __name__ == "__main__":
    main()
