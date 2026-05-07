from backend.services.chunker.docling_chunker import chunk_docling_document


def test_docling_chunker_keeps_tables_atomic():
    doc = {
        "texts": [
            {"label": "section_header", "text": "Situation", "page": 1},
            {"label": "paragraph", "text": "Actor A made a proposal.", "page": 1},
            {
                "label": "table",
                "page": 2,
                "cells": [
                    {"row": 0, "col": 0, "text": "Party"},
                    {"row": 0, "col": 1, "text": "Interest"},
                    {"row": 1, "col": 0, "text": "A"},
                    {"row": 1, "col": 1, "text": "Access"},
                ],
            },
            {"label": "paragraph", "text": "The table should not merge with prose.", "page": 2},
        ]
    }

    chunks = chunk_docling_document(doc, max_chars=500)

    assert [chunk.kind for chunk in chunks] == ["heading", "paragraph", "table", "paragraph"]
    assert "| Party | Interest |" in chunks[2].text
    assert chunks[2].page == 2


def test_docling_chunker_splits_long_prose_without_splitting_tables():
    doc = {"texts": [{"label": "paragraph", "text": "alpha\n" * 120, "page": 4}]}
    chunks = chunk_docling_document(doc, max_chars=120)
    assert len(chunks) > 1
    assert all(chunk.kind == "paragraph" for chunk in chunks)
    assert all(chunk.page == 4 for chunk in chunks)


def test_docling_chunker_reads_tables_collection_as_atomic_chunks():
    doc = {
        "texts": [{"label": "paragraph", "text": "The report includes a designation table.", "page": 1, "order": 1}],
        "tables": [
            {
                "page": 2,
                "order": 2,
                "cells": [
                    {"row": 0, "col": 0, "text": "Entity"},
                    {"row": 0, "col": 1, "text": "Measure"},
                    {"row": 1, "col": 0, "text": "Company A"},
                    {"row": 1, "col": 1, "text": "Asset freeze"},
                ],
            }
        ],
    }

    chunks = chunk_docling_document(doc, max_chars=500)

    assert [chunk.kind for chunk in chunks] == ["paragraph", "table"]
    assert "| Entity | Measure |" in chunks[1].text
    assert chunks[1].page == 2
