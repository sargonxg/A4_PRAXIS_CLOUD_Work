from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel, Field

try:
    from docling.document_converter import DocumentConverter
except Exception:  # pragma: no cover - dependency is present only in worker image
    DocumentConverter = None  # type: ignore[assignment]


app = FastAPI(title="PRAXIS Docling Parser", version="1.0.0")
_converter = None


class ParseRequest(BaseModel):
    gcs_uri: str = Field(..., pattern=r"^gs://")
    source_id: str | None = None


class ParseResponse(BaseModel):
    markdown: str
    docling_json_uri: str
    page_count: int
    table_count: int
    content_sha256: str


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "worker": "extract-docling"}


@app.post("/parse")
async def parse(req: ParseRequest) -> ParseResponse:
    local_path = _download_gcs_uri(req.gcs_uri)
    content_hash = hashlib.sha256(local_path.read_bytes()).hexdigest()
    markdown, doc_json, page_count, table_count = _convert(local_path)
    output_uri = _persist_json(req.gcs_uri, content_hash, doc_json)
    return ParseResponse(
        markdown=markdown,
        docling_json_uri=output_uri,
        page_count=page_count,
        table_count=table_count,
        content_sha256=content_hash,
    )


def _get_converter():
    global _converter
    if _converter is None:
        if DocumentConverter is None:
            raise RuntimeError("docling is not installed in this environment")
        _converter = DocumentConverter()
    return _converter


def _download_gcs_uri(uri: str) -> Path:
    if os.getenv("PRAXIS_WORKER_LOCAL_FIXTURE") == "1":
        return Path(uri.removeprefix("gs://")).resolve()
    from google.cloud import storage

    bucket_name, blob_name = uri.removeprefix("gs://").split("/", 1)
    target = Path("/tmp") / Path(blob_name).name
    storage.Client().bucket(bucket_name).blob(blob_name).download_to_filename(target)
    return target


def _convert(path: Path) -> tuple[str, dict, int, int]:
    result = _get_converter().convert(str(path))
    doc = result.document
    markdown = doc.export_to_markdown()
    doc_json = json.loads(doc.export_to_json())
    page_count = len(doc_json.get("pages", []))
    table_count = len(doc_json.get("tables", [])) + len([item for item in doc_json.get("texts", []) if str(item.get("label", "")).lower() == "table"])
    return markdown, doc_json, page_count, table_count


def _persist_json(input_uri: str, content_hash: str, payload: dict) -> str:
    if os.getenv("PRAXIS_WORKER_LOCAL_FIXTURE") == "1":
        out = Path("/tmp") / f"docling-{content_hash}.json"
        out.write_text(json.dumps(payload), encoding="utf-8")
        return str(out)
    from google.cloud import storage

    bucket_name = input_uri.removeprefix("gs://").split("/", 1)[0]
    blob_name = f"parsed/docling/{content_hash}.json"
    storage.Client().bucket(bucket_name).blob(blob_name).upload_from_string(json.dumps(payload), content_type="application/json")
    return f"gs://{bucket_name}/{blob_name}"
