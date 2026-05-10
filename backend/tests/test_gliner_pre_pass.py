from backend.services.gliner_pre_pass import detect_entities


def test_gliner_pre_pass_returns_actor_spans_without_model_dependency():
    spans = detect_entities("Russia and the United Nations met in Geneva in 2026.", ["Actor", "Event"])

    assert any(span.primitive == "Actor" and "Russia" in span.text for span in spans)
    assert any(span.primitive == "Event" and span.text == "2026" for span in spans)
    assert all(span.start < span.end for span in spans)
