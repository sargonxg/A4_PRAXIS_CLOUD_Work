import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest

from services.sanctions.yente_client import ActorNode, SanctionsMatch, build_owner_scoped_actor_metadata_update, normalize_actor


def test_actor_normalization_maps_person_schema():
    payload = normalize_actor(ActorNode(id="a1", label="Yevgeny Prigozhin", subtype="natural_person", metadata={"country": "Russia"}))

    assert payload["schema"] == "Person"
    assert payload["properties"]["name"]


def test_actor_normalization_maps_organization_schema():
    payload = normalize_actor(ActorNode(id="a2", label="Example Trading LLC", subtype="organization"))

    assert payload["schema"] == "Organization"
    assert payload["properties"]["name"] == ["Example Trading LLC"]


def test_sanctions_metadata_update_is_owner_scoped_and_reviewable():
    actor = ActorNode(id="actor-1", label="Example Trading LLC", subtype="organization")
    match = SanctionsMatch(
        entity_id="Q123",
        schema="Company",
        score=0.91,
        matched_labels=["sanction"],
        datasets=["ofac"],
        opensanctions_url="https://www.opensanctions.org/entities/Q123/",
    )

    payload = build_owner_scoped_actor_metadata_update(actor=actor, matches=[match], owner_uid="user-1", case_id="case-1")

    assert payload["owner_uid"] == "user-1"
    assert payload["case_id"] == "case-1"
    assert payload["actor_id"] == "actor-1"
    assert payload["write_policy"] == "owner-scoped-actor-metadata-only"
    assert payload["metadata_patch"]["sanctions_review_required"] is True
    assert payload["metadata_patch"]["sanctions"][0]["source"] == "opensanctions-yente"


def test_sanctions_metadata_update_rejects_unscoped_writes():
    with pytest.raises(ValueError):
        build_owner_scoped_actor_metadata_update(actor=ActorNode(id="actor-1", label="A"), matches=[], owner_uid="", case_id="case-1")
