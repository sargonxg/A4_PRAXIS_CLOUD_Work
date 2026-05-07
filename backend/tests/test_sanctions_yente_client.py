import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.sanctions.yente_client import ActorNode, normalize_actor


def test_actor_normalization_maps_person_schema():
    payload = normalize_actor(ActorNode(id="a1", label="Yevgeny Prigozhin", subtype="natural_person", metadata={"country": "Russia"}))

    assert payload["schema"] == "Person"
    assert payload["properties"]["name"]


def test_actor_normalization_maps_organization_schema():
    payload = normalize_actor(ActorNode(id="a2", label="Example Trading LLC", subtype="organization"))

    assert payload["schema"] == "Organization"
    assert payload["properties"]["name"] == ["Example Trading LLC"]

