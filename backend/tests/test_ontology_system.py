from __future__ import annotations

import asyncio
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).parents[1]
REPO_ROOT = ROOT.parents[0]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services import cognee_memory
from services.cognee_memory import MemoryScope
from services.ontology_system import (
    CASE_TYPES,
    available_case_types,
    ontology_cache_snapshot,
    data_point_class_names,
    ontology_resolver_descriptor,
    ontology_stack_for_case_types,
)


def test_all_case_type_ontologies_exist_and_parse():
    base = REPO_ROOT / "backend/data/ontologies/praxis_aco_base.owl"
    assert base.exists()
    ET.parse(base)
    assert len(CASE_TYPES) == 10
    assert set(available_case_types()) == {spec.slug for spec in CASE_TYPES}

    for spec in CASE_TYPES:
        owl_path = REPO_ROOT / spec.ontology_path
        changelog_path = REPO_ROOT / spec.changelog_path
        assert owl_path.exists(), spec.slug
        assert changelog_path.exists(), spec.slug
        ET.parse(owl_path)
        source = owl_path.read_text(encoding="utf-8")
        assert "https://tacitus.me/praxis/ontology/base" in source
        assert f"<base:caseType>{spec.slug}</base:caseType>" in source
        for class_name in spec.classes[:3]:
            assert f"#{class_name}" in source


def test_runtime_composes_base_primary_and_secondary_stacks():
    stack = ontology_stack_for_case_types("negotiation-mediation", "humanitarian_crisis")
    assert stack[0] == "backend/data/ontologies/praxis_aco_base.owl"
    assert "backend/data/ontologies/specializations/negotiation-mediation.owl" in stack
    assert "backend/data/ontologies/specializations/humanitarian-crisis.owl" in stack
    assert len(stack) == len(set(stack))

    resolver = ontology_resolver_descriptor("negotiation-mediation", "humanitarian-crisis")
    assert resolver["kind"] == "rdflib_ontology_resolver"
    assert resolver["ontologyFilePaths"] == list(stack)
    snapshot = ontology_cache_snapshot()
    assert snapshot["resolver"]["maxsize"] == 64
    assert len(snapshot["caseTypes"]) == 10


def test_data_point_classes_are_indexable_and_case_specific():
    names = data_point_class_names("negotiation-mediation", "active-conflict")
    assert "Actor" in names
    assert "Party" in names
    assert "Frontline" in names
    assert len(names) == len(set(names))
    for cls in cognee_memory.get_data_points(case_type="active-conflict"):
        assert cls.metadata["index_fields"]


def test_disabled_cognify_reports_ontology_stack_and_data_points():
    scope = MemoryScope(owner_uid="user-1", case_id="case-1")
    result = asyncio.run(
        cognee_memory.cognify(
            scope=scope,
            content="Party A says access is blocked.",
            source_id="source-1",
            case_type="negotiation-mediation",
            case_type_secondary="humanitarian-crisis",
        )
    )
    assert result["status"] == "queued_disabled"
    assert result["ontologyFilePath"] == "backend/data/ontologies/praxis_aco_base.owl"
    assert result["ontologyFilePaths"] == [
        "backend/data/ontologies/praxis_aco_base.owl",
        "backend/data/ontologies/specializations/negotiation-mediation.owl",
        "backend/data/ontologies/specializations/humanitarian-crisis.owl",
    ]
    assert "Party" in result["dataPointClasses"]
    assert "AffectedPopulation" in result["dataPointClasses"]
    assert result["resolver"]["ontologyFilePaths"] == result["ontologyFilePaths"]
