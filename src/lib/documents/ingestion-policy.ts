/** Budgets enforced before extraction/storage; larger sources must be split. */
export const DOCUMENT_LIMITS = {
  fileBytes: 20 * 1024 * 1024,
  requestBytes: 21 * 1024 * 1024,
  textBytes: 600 * 1024,
  chunks: 512,
  embeddingBatch: 32,
  writeBatch: 100,
} as const;

export class DocumentIngestionError extends Error {
  constructor(message: string, public readonly status = 413, public readonly code = 'DOCUMENT_LIMIT_EXCEEDED') {
    super(message);
    this.name = 'DocumentIngestionError';
  }
}

export function assertDocumentFileSize(bytes: number): void {
  if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > DOCUMENT_LIMITS.fileBytes) {
    throw new DocumentIngestionError('The file exceeds the 20 MiB upload limit. Split it into smaller source files.');
  }
}

export function assertDocumentTextSize(text: string): void {
  if (new TextEncoder().encode(text).byteLength > DOCUMENT_LIMITS.textBytes) {
    throw new DocumentIngestionError('The extracted text exceeds 600 KiB. Split the source into smaller documents.');
  }
}

/** Bound streamed bytes even when Content-Length is absent or incorrect. */
export async function readBoundedUploadBody(request: Request): Promise<Uint8Array<ArrayBuffer>> {
  if (Number(request.headers.get('content-length')) > DOCUMENT_LIMITS.requestBytes) {
    throw new DocumentIngestionError('The upload request exceeds 21 MiB. Upload one file of at most 20 MiB.');
  }
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const parts: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > DOCUMENT_LIMITS.requestBytes) {
        await reader.cancel().catch(() => undefined);
        throw new DocumentIngestionError('The upload request exceeds 21 MiB. Upload one file of at most 20 MiB.');
      }
      parts.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(bytes);
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.byteLength; }
  return result;
}
