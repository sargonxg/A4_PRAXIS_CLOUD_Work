from backend.services.wikidata_sparql import actor_disambiguation, entity_facts


def test_wikidata_sparql_known_actor_helper():
    actors = actor_disambiguation("United Nations")

    assert actors[0].qid == "Q1065"
    assert entity_facts("Q1065")["qid"] == "Q1065"
