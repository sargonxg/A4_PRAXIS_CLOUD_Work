from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parents[2]
REPO_ROOT = ROOT.parents[0]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.ontology_system import data_point_class_names


GOLDEN_ROOT = REPO_ROOT / "backend/tests/data/ontology_golden"
PRIORITY_CASE_TYPES = (
    "active-conflict",
    "negotiation-mediation",
    "counter-terrorism",
    "humanitarian-crisis",
    "political-transition",
)


def test_priority_ontology_golden_sets_are_versioned_and_well_formed():
    for case_type in PRIORITY_CASE_TYPES:
        case_root = GOLDEN_ROOT / case_type
        expected_path = case_root / "expected.json"
        document_root = case_root / "documents"
        assert expected_path.exists(), case_type
        assert document_root.exists(), case_type

        documents = sorted(document_root.glob("*.txt"))
        assert len(documents) >= 5, case_type

        payload = json.loads(expected_path.read_text(encoding="utf-8"))
        labels = payload["labels"]
        assert payload["case_type"] == case_type
        assert payload["minimum_recall"] >= 0.8
        assert payload["minimum_precision"] >= 0.7
        assert len(labels) >= 30

        allowed_types = set(data_point_class_names(case_type))
        document_text = {
            document.name: document.read_text(encoding="utf-8") for document in documents
        }
        for label in labels:
            assert label["type"] in allowed_types
            assert label["document"] in document_text
            assert label["source_quote"] in document_text[label["document"]]
