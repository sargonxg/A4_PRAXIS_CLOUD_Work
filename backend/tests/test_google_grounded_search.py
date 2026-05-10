from backend.services.google_grounded_search import grounded_search


def test_google_grounded_search_local_fallback_is_honest_t5():
    results = grounded_search("AI transparency policy 2026", max_results=2)

    assert results
    assert results[0].tier == "T5"
    assert "does not fabricate sources" in results[0].snippet
