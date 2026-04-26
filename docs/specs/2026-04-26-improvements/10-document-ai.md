# Spec #10 — Document AI OCR for uploaded PDFs

## Problem
Scanned PDFs (signed agreements, OCHA situation reports, ICC indictments,
Crisis Group PDFs) yield zero extracted text today. Conflict Graph
extraction sees nothing; RAG returns nothing. Document AI fills that
gap.

## Persona impact
- Legal analyst: ICC / ICJ filings are scans.
- Humanitarian lead: OCHA situation reports are often PDF scans.
- Researcher: Crisis Group / SIPRI PDFs have inconsistent text layers.

## Files
- `cloud_functions/on_document_uploaded/main.py` (EDIT) — detect MIME
  type, route scans to Document AI before chunking.
- `cloud_functions/on_document_uploaded/document_ai.py` (NEW) —
  isolated client for the OCR processor.
- `infrastructure/setup-gcp.sh` (EDIT) — provision the Document AI
  processor and grant the Cloud Function service account
  `roles/documentai.apiUser`.
- `tests/integration/document_ai_smoke.py` (NEW) — uses a small
  fixture PDF to assert text extraction.

## Interface contract
```python
def extract_text(uri: str, mime_type: str) -> tuple[str, dict]:
    """Returns (text, metadata).
    metadata includes processor name, page_count, average confidence,
    and any per-page entity hints."""
```

## Implementation order
1. Provision the OCR processor (`OCR_PROCESSOR`) in
   `setup-gcp.sh`. Document the processor id in
   `docs/GCP_OPERATIONS.md`.
2. Add `document_ai.py` with retry + timeout + the schema above.
3. Edit `main.py` so that when MIME is `application/pdf` and the PDF
   has no embedded text layer, the function routes through
   Document AI. When the PDF already has text, fall through to the
   existing path.
4. Update Firestore `documents/{id}.metadata` to record `ocr: true` +
   processor id + average confidence so analysts can see why a doc
   was extracted via OCR.
5. Run integration smoke against a fixture and a real OCHA PDF.

## Definition of done
- A scanned PDF arrives → ≥1 chunk with non-empty text in
  `documents/{id}/chunks/{chunkId}`.
- Conflict Graph extraction over that doc finds at least one entity.
- `documents/{id}.metadata.ocr === true` for OCR'd uploads only.
- Cost cap: never run Document AI on a doc with embedded text layer.

## Validation gate
- `npm run audit:gcp` (verifies Document AI API enabled).
- Integration smoke test fixture passes locally with a small PDF.

## Risks / open questions
- Cost: Document AI bills per page. Cap pages per upload? Default
  proposal: 50-page hard cap; tag oversize uploads with
  `metadata.ocr_truncated = true` and surface in the Documents UI.
- Quality: which processor — `OCR_PROCESSOR` only, or the more
  expensive `FORM_PARSER_PROCESSOR` for structured docs?
