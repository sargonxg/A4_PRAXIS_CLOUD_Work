"""Dependency-optional Docling parser facade for the v5 document pipeline.

The production worker image owns the real Docling dependency. This backend
facade keeps tests, audits, and local development deterministic when Docling is
not installed, while preserving the same parsed-document contract.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

from backend.services.chunker.docling_chunker import chunk_docling_document


@dataclass(frozen=True)
class ByteSpan:
    start: int
    end: int


@dataclass(frozen=True)
class ParsedChunk:
    text: str
    kind: str
    page: int | None = None
    order: int = 0
    byte_span: ByteSpan | None = None
    structure_path: str = ""


@dataclass(frozen=True)
class ParsedDocument:
    text: str
    chunks: list[ParsedChunk]
    byte_spans: list[ByteSpan]
    structure: dict[str, Any] = field(default_factory=dict)
    parser: str = "docling"


def parse(file_path: str, mime_type: str) -> ParsedDocument:
    """Parse PDF, DOCX, HTML, and TXT into the v5 parsed-document contract."""
    path = Path(file_path)
    normalized = mime_type.lower()
    if normalized in {"text/plain", "text/markdown"} or path.suffix.lower() in {".txt", ".md"}:
        return _parse_plain(path)
    if "html" in normalized or path.suffix.lower() in {".html", ".htm"}:
        return _parse_html(path)
    if "pdf" in normalized or "wordprocessingml" in normalized or path.suffix.lower() in {".pdf", ".docx"}:
        return _parse_docling(path, mime_type)
    if normalized.startswith("audio/"):
        return _parse_audio_placeholder(path)
    return _parse_plain(path)


def _parse_docling(path: Path, mime_type: str) -> ParsedDocument:
    try:
        from docling.document_converter import DocumentConverter  # type: ignore
    except Exception:
        text = (
            f"Docling extraction queued for {path.name}. "
            "Local environment does not include docling; production worker parses this file."
        )
        span = ByteSpan(0, len(text.encode("utf-8")))
        return ParsedDocument(
            text=text,
            chunks=[ParsedChunk(text=text, kind="paragraph", order=0, byte_span=span)],
            byte_spans=[span],
            structure={"mime_type": mime_type, "fallback": "docling-unavailable", "source": str(path)},
            parser="docling-fallback",
        )

    result = DocumentConverter().convert(str(path))
    doc = result.document
    doc_json = doc.export_to_dict() if hasattr(doc, "export_to_dict") else {}
    text = doc.export_to_markdown()
    chunks = _chunks_from_docling_json(doc_json, text)
    return ParsedDocument(
        text=text,
        chunks=chunks,
        byte_spans=[chunk.byte_span for chunk in chunks if chunk.byte_span is not None],
        structure={"mime_type": mime_type, "docling": doc_json},
        parser="docling",
    )


def _parse_plain(path: Path) -> ParsedDocument:
    text = path.read_text(encoding="utf-8", errors="replace")
    span = ByteSpan(0, len(text.encode("utf-8")))
    return ParsedDocument(
        text=text,
        chunks=[ParsedChunk(text=text, kind="paragraph", order=0, byte_span=span)],
        byte_spans=[span],
        structure={"mime_type": "text/plain", "source": str(path)},
        parser="plain",
    )


def _parse_html(path: Path) -> ParsedDocument:
    html = path.read_text(encoding="utf-8", errors="replace")
    parser = _HTMLTextParser()
    parser.feed(html)
    text = "\n".join(part for part in parser.parts if part.strip()).strip()
    span = ByteSpan(0, len(html.encode("utf-8")))
    return ParsedDocument(
        text=text,
        chunks=[ParsedChunk(text=text, kind="paragraph", order=0, byte_span=span)] if text else [],
        byte_spans=[span],
        structure={"mime_type": "text/html", "source": str(path)},
        parser="beautifulsoup-compatible-html",
    )


def _parse_audio_placeholder(path: Path) -> ParsedDocument:
    text = f"Audio transcription queued for Vertex Whisper-compatible processing: {path.name}"
    span = ByteSpan(0, len(text.encode("utf-8")))
    return ParsedDocument(
        text=text,
        chunks=[ParsedChunk(text=text, kind="paragraph", order=0, byte_span=span)],
        byte_spans=[span],
        structure={"mime_type": "audio/*", "source": str(path), "fallback": "vertex-whisper-queued"},
        parser="audio-placeholder",
    )


def _chunks_from_docling_json(doc_json: dict[str, Any], fallback_text: str) -> list[ParsedChunk]:
    raw_chunks = chunk_docling_document(doc_json, max_chars=1800) if doc_json else []
    if not raw_chunks and fallback_text.strip():
        raw_chunks = chunk_docling_document({"texts": [{"text": fallback_text, "label": "paragraph", "order": 0}]})
    chunks: list[ParsedChunk] = []
    cursor = 0
    for raw in raw_chunks:
        encoded_len = len(raw.text.encode("utf-8"))
        span = ByteSpan(cursor, cursor + encoded_len)
        chunks.append(
            ParsedChunk(
                text=raw.text,
                kind=raw.kind,
                page=raw.page,
                order=raw.order,
                byte_span=span,
                structure_path=raw.source_path,
            )
        )
        cursor += encoded_len
    return chunks


class _HTMLTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.parts.append(data.strip())
