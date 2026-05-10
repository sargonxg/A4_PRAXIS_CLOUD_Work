from pathlib import Path

from backend.services.docling_parser import parse


def test_docling_parser_plain_text_preserves_byte_spans(tmp_path: Path):
    fixture = tmp_path / "source.txt"
    fixture.write_text("Russia met United Nations officials.\n", encoding="utf-8")

    parsed = parse(str(fixture), "text/plain")

    assert parsed.parser == "plain"
    assert parsed.text.startswith("Russia")
    assert parsed.chunks[0].byte_span is not None
    assert parsed.byte_spans[0].end == len(parsed.text.encode("utf-8"))


def test_docling_parser_html_extracts_visible_text(tmp_path: Path):
    fixture = tmp_path / "source.html"
    fixture.write_text("<h1>Heading</h1><p>Actor A made a commitment.</p>", encoding="utf-8")

    parsed = parse(str(fixture), "text/html")

    assert "Heading" in parsed.text
    assert "commitment" in parsed.text
    assert parsed.parser == "beautifulsoup-compatible-html"


def test_docling_parser_pdf_has_dependency_optional_fallback(tmp_path: Path):
    fixture = tmp_path / "source.pdf"
    fixture.write_bytes(b"%PDF-1.4 fixture")

    parsed = parse(str(fixture), "application/pdf")

    assert parsed.chunks
    assert parsed.parser in {"docling", "docling-fallback"}
    assert parsed.structure["mime_type"] == "application/pdf"
