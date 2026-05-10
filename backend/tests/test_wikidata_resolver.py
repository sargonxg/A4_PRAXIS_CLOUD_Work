from backend.services.wikidata_resolver import normalize_name, resolve_actor


def test_wikidata_known_entities_resolve_without_network():
    assert resolve_actor("Russia").qid == "Q159"
    assert resolve_actor("United Nations").qid == "Q1065"
    assert resolve_actor("Hayʼat Tahrir al-Sham").qid == "Q21731129"


def test_wikidata_normalization_handles_punctuation():
    assert normalize_name("Hayʼat Tahrir al-Sham") == "hayat tahrir al sham"
