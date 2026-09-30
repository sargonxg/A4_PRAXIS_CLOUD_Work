import { describe, expect, it } from 'vitest';
import { assertDocumentFileSize, assertDocumentTextSize, DocumentIngestionError, DOCUMENT_LIMITS, readBoundedUploadBody } from '@/lib/documents/ingestion-policy';
import { documentUploadIdentity } from '@/lib/documents/upload-identity';

describe('document ingestion budgets and identity', () => {
  it('accepts the file boundary and rejects excess bytes before extraction', () => {
    expect(() => assertDocumentFileSize(DOCUMENT_LIMITS.fileBytes)).not.toThrow();
    expect(() => assertDocumentFileSize(DOCUMENT_LIMITS.fileBytes + 1)).toThrow(DocumentIngestionError);
  });
  it('measures extracted text as UTF-8 bytes, including multibyte sources', () => {
    expect(() => assertDocumentTextSize('a'.repeat(DOCUMENT_LIMITS.textBytes))).not.toThrow();
    expect(() => assertDocumentTextSize('界'.repeat(Math.floor(DOCUMENT_LIMITS.textBytes / 3) + 1))).toThrow(/extracted text/i);
  });
  it('retains content identity across response loss while isolating owner, case, format, and content', () => {
    const bytes = Buffer.from('Evidence');
    const identity = documentUploadIdentity('u1', 's1', 'txt', bytes);
    expect(documentUploadIdentity('u1', 's1', 'txt', bytes)).toBe(identity);
    expect(new Set([identity, documentUploadIdentity('u2', 's1', 'txt', bytes),
      documentUploadIdentity('u1', 's2', 'txt', bytes), documentUploadIdentity('u1', 's1', 'pdf', bytes),
      documentUploadIdentity('u1', 's1', 'txt', Buffer.from('Changed'))]).size).toBe(5);
  });
  it('rejects an oversized streamed body without trusting Content-Length', async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({ start(controller) {
      controller.enqueue(new Uint8Array(DOCUMENT_LIMITS.requestBytes));
      controller.enqueue(new Uint8Array(1));
    }, cancel() { cancelled = true; } });
    const request = new Request('http://localhost/upload', { method: 'POST', body, duplex: 'half' } as RequestInit);
    await expect(readBoundedUploadBody(request)).rejects.toThrow(/request exceeds/i);
    expect(cancelled).toBe(true);
  });
});
