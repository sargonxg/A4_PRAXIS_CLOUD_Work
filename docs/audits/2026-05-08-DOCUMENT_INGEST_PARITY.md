# Document Ingest Parity Audit - 2026-05-08

## Modern Library Substrate Path

Visible Library uploads now run:

```text
DocumentUploadInline / LibraryTab
  -> POST /api/documents/upload
  -> save Firestore document
  -> extract text
  -> chunk and index document chunks for retrieval
  -> return documentId
  -> POST /api/backend/tabs/library/ingest?case_id=...
  -> FastAPI /api/v1/tabs/library/ingest
  -> INSERT source_receipts (...)
  -> persist documentId in source_receipts.metadata
  -> cognee_memory.add(...)      # queued when disabled
  -> cognee_memory.cognify(...)  # queued when disabled
```

Side effects on full success:

- Firestore document created under the user's situation.
- Document text is chunked and saved for hero-tool retrieval.
- `source_receipts` row is created in the Library substrate.
- `source_receipts.metadata.documentId` links the receipt to the Firestore document.
- Cognee add/cognify work is attempted or queued without changing the user-facing retrieval path.

## Canonical Embedding Endpoint

`/api/documents/upload` is the canonical document extraction, chunking, and retrieval-indexing endpoint. The Library substrate route registers the source receipt and Cognee queue only. It does not own chunking logic.

## Previous Divergence

Before consolidation, the visible Library upload path could create a source receipt and queue Cognee work while leaving the uploaded document invisible to Firestore-backed RAG. Since Cognee is disabled-safe in current production, that made successful uploads look useful while hero tools could not retrieve from the uploaded text.

## Current Contract

The UI must call `/api/documents/upload` first, then call `/api/backend/tabs/library/ingest` with the returned `documentId`. The second call is allowed to fail without undoing retrieval indexing; the UI must report that the source receipt was deferred.

## Static Enforcement

`npm run audit:document-ingest-parity` checks:

- `DocumentUploadInline` calls both endpoints in order.
- `LibraryTab` calls both endpoints in order.
- both surfaces pass `situationId` to `/api/documents/upload`.
- both surfaces pass `documentId` to the Library substrate ingest.
- success and partial-failure copy are honest.
- `/api/documents/upload` remains marked as canonical and awaits chunking.
- FastAPI Library ingest accepts and stores the `documentId`.

## Runtime Follow-Up

`audit:document-ingest-parity-runtime` is still needed. It should upload a fixture file with a synthetic user, verify a Firestore document and chunk collection exist, verify a matching `source_receipts.metadata.documentId`, and verify hero-tool retrieval can find text from the uploaded document.
