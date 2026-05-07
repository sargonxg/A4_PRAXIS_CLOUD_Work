"""Docling-aware chunker.

Keeps tables atomic and chunks prose on reading-order boundaries. The function
accepts Docling-like JSON so the main backend never imports Docling itself.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal


ChunkKind = Literal["paragraph", "table", "heading", "list", "unknown"]


@dataclass(frozen=True)
class Chunk:
    text: str
    kind: ChunkKind
    page: int | None = None
    order: int = 0
    source_path: str = ""


def chunk_docling_document(doc: dict[str, Any], *, max_chars: int = 1800) -> list[Chunk]:
    items = _extract_items(doc)
    chunks: list[Chunk] = []
    paragraph_buffer: list[str] = []
    buffer_page: int | None = None

    def flush() -> None:
        nonlocal paragraph_buffer, buffer_page
        if not paragraph_buffer:
            return
        text = "\n\n".join(paragraph_buffer).strip()
        if text:
            chunks.extend(_split_long_text(text, page=buffer_page, start_order=len(chunks), max_chars=max_chars))
        paragraph_buffer = []
        buffer_page = None

    for item in items:
        kind = _kind(item)
        text = _text(item)
        if not text:
            continue
        page = _page(item)
        if kind == "table":
            flush()
            chunks.append(Chunk(text=text, kind="table", page=page, order=len(chunks), source_path=str(item.get("self_ref", ""))))
            continue
        if kind == "heading":
            flush()
            chunks.append(Chunk(text=text, kind="heading", page=page, order=len(chunks), source_path=str(item.get("self_ref", ""))))
            continue
        if buffer_page is None:
            buffer_page = page
        if sum(len(part) for part in paragraph_buffer) + len(text) > max_chars:
            flush()
            buffer_page = page
        paragraph_buffer.append(text)

    flush()
    return chunks


def _extract_items(doc: dict[str, Any]) -> list[dict[str, Any]]:
    for key in ("texts", "items", "body", "document_items"):
        value = doc.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def _kind(item: dict[str, Any]) -> ChunkKind:
    raw = str(item.get("label") or item.get("kind") or item.get("type") or "").lower()
    if "table" in raw:
        return "table"
    if "head" in raw or "title" in raw:
        return "heading"
    if "list" in raw:
        return "list"
    if raw:
        return "paragraph"
    return "unknown"


def _text(item: dict[str, Any]) -> str:
    for key in ("text", "content", "markdown"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    if isinstance(item.get("cells"), list):
        return _table_to_markdown(item["cells"])
    return ""


def _table_to_markdown(cells: list[Any]) -> str:
    rows: dict[int, dict[int, str]] = {}
    for cell in cells:
        if not isinstance(cell, dict):
            continue
        row = int(cell.get("row", cell.get("row_index", 0)))
        col = int(cell.get("col", cell.get("col_index", 0)))
        rows.setdefault(row, {})[col] = str(cell.get("text", "")).strip()
    if not rows:
        return ""
    ordered = [[cols.get(col, "") for col in range(max(cols.keys(), default=0) + 1)] for _, cols in sorted(rows.items())]
    header = ordered[0]
    body = ordered[1:]
    lines = ["| " + " | ".join(header) + " |", "| " + " | ".join("---" for _ in header) + " |"]
    lines.extend("| " + " | ".join(row) + " |" for row in body)
    return "\n".join(lines)


def _page(item: dict[str, Any]) -> int | None:
    prov = item.get("prov")
    if isinstance(prov, list) and prov and isinstance(prov[0], dict):
        page = prov[0].get("page_no")
        return int(page) if isinstance(page, (int, float)) else None
    page = item.get("page")
    return int(page) if isinstance(page, (int, float)) else None


def _split_long_text(text: str, *, page: int | None, start_order: int, max_chars: int) -> list[Chunk]:
    if len(text) <= max_chars:
        return [Chunk(text=text, kind="paragraph", page=page, order=start_order)]
    parts: list[Chunk] = []
    remaining = text
    while remaining:
        cut = remaining.rfind("\n", 0, max_chars)
        if cut < max_chars // 2:
            cut = min(max_chars, len(remaining))
        part = remaining[:cut].strip()
        if part:
            parts.append(Chunk(text=part, kind="paragraph", page=page, order=start_order + len(parts)))
        remaining = remaining[cut:].strip()
    return parts
