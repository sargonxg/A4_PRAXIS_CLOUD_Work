import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  pdfLoaded: vi.fn(),
  docxLoaded: vi.fn(),
  getText: vi.fn(),
  destroy: vi.fn(),
  extractRawText: vi.fn(),
  saveDocument: vi.fn(),
  getDocumentById: vi.fn(),
  ingestDocument: vi.fn(),
  set: vi.fn(),
  ownerCheck: vi.fn(),
  storageSave: vi.fn(),
  storageDelete: vi.fn(),
}));

vi.mock('pdf-parse', () => {
  mocks.pdfLoaded();
  return { PDFParse: class { getText = mocks.getText; destroy = mocks.destroy; } };
});
vi.mock('mammoth', () => {
  mocks.docxLoaded();
  return { default: { extractRawText: mocks.extractRawText } };
});
vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string }) => Promise<Response>) =>
    (request: Request) => handler(request, { uid: 'owner' }),
}));
vi.mock('@/lib/firebase/documents-service', () => ({
  saveDocument: mocks.saveDocument, getDocumentById: mocks.getDocumentById,
  updateDocumentIngestionMetadata: (_uid: string, _case: string, _id: string, value: unknown) => mocks.set(value),
  DocumentWriteUnavailableError: class extends Error { readonly status = 409; readonly code = 'DOCUMENT_UNAVAILABLE'; },
}));
vi.mock('@/lib/documents/owner-write', async (importActual) => ({
  ...await importActual<typeof import('@/lib/documents/owner-write')>(),
  assertDocumentOwnerWritable: mocks.ownerCheck,
  withDocumentOwnerWrite: async (_uid: string, write: (transaction: { set: typeof mocks.set }) => unknown) => {
    await mocks.ownerCheck();
    return write({ set: mocks.set });
  },
}));
vi.mock('@/lib/firebase/sources-service', () => ({ saveSource: vi.fn(async () => ({ id: 'source' })) }));
vi.mock('@/lib/firebase/admin', () => ({
  getAdminStorage: () => ({ bucket: () => ({ file: () => ({ save: mocks.storageSave, delete: mocks.storageDelete }) }) }),
  getDefaultBucketName: () => 'test-bucket',
  getAdminDbOrThrow: () => {
    const ref = { collection: () => ref, doc: () => ref, set: mocks.set };
    return ref;
  },
}));
vi.mock('@/lib/documents/auto-structure', () => ({ autoStructureDocument: () => ({ title: 'Evidence', actors: [], keyClaims: [], timelineCandidates: [], sourceType: 'document' }) }));
vi.mock('@/lib/telemetry/emit', () => ({ emitTelemetrySafe: vi.fn(async () => {}) }));
vi.mock('@/lib/knowledge/context-engine', () => ({ localKnowledgeAdapter: { ingestDocument: mocks.ingestDocument } }));
vi.mock('@/lib/context/capsule-service', () => ({
  attachCapsuleRefs: vi.fn(async () => {}), getCapsule: vi.fn(),
  getOrMigrateDefaultCapsule: vi.fn(async () => ({ capsule: { capsuleId: 'capsule', version: 1 } })),
}));
vi.mock('@/lib/agent-runtime/document-postgres', () => ({ mirrorDocumentIngestionSql: vi.fn(async () => {}) }));
vi.mock('@/lib/knowledge/library-service', () => ({
  ensureDefaultKnowledgeRepository: vi.fn(async () => ({ id: 'repository' })),
  getKnowledgeRepository: vi.fn(),
  upsertKnowledgeDocument: vi.fn(async () => ({ id: 'knowledge-document' })),
}));

async function upload(extension: string, contents = 'Evidence text') {
  const { POST } = await import('@/app/api/documents/upload/route');
  const form = new FormData();
  form.set('file', new File([contents], `evidence.${extension}`, { type: 'text/plain' }));
  form.set('situationId', 'case');
  return POST(new Request('http://localhost/api/documents/upload', { method: 'POST', body: form }) as never);
}

describe('document upload parser isolation', () => {
  beforeEach(() => {
    mocks.getText.mockResolvedValue({ text: 'PDF evidence' });
    mocks.destroy.mockResolvedValue(undefined);
    mocks.extractRawText.mockResolvedValue({ value: 'Word evidence' });
    mocks.saveDocument.mockImplementation(async (_uid, _case, value) => ({ ...value, id: 'document' }));
    mocks.set.mockResolvedValue(undefined);
    mocks.ownerCheck.mockResolvedValue(undefined);
    mocks.storageSave.mockResolvedValue(undefined);
    mocks.storageDelete.mockResolvedValue(undefined);
    mocks.getDocumentById.mockResolvedValue(null);
    mocks.ingestDocument.mockResolvedValue({ id: 'ingest', status: 'checked', chunkCount: 1 });
  });

  it('accepts text without initializing either binary document parser', async () => {
    const response = await upload('txt');
    expect(response.status).toBe(200);
    expect(mocks.pdfLoaded).not.toHaveBeenCalled();
    expect(mocks.docxLoaded).not.toHaveBeenCalled();
    expect(mocks.saveDocument).toHaveBeenCalledWith('owner', 'case', expect.objectContaining({ text: 'Evidence text' }), expect.objectContaining({ documentId: expect.stringMatching(/^upload-/) }));
  });

  it('accepts Word documents without initializing PDF native dependencies', async () => {
    expect((await upload('docx')).status).toBe(200);
    expect(mocks.pdfLoaded).not.toHaveBeenCalled();
    expect(mocks.extractRawText).toHaveBeenCalled();
  });

  it('destroys the PDF parser after extracting text', async () => {
    expect((await upload('pdf')).status).toBe(200);
    expect(mocks.getText).toHaveBeenCalled();
    expect(mocks.destroy).toHaveBeenCalledTimes(1);
  });

  it('destroys the PDF parser when extraction fails and reports upload failure', async () => {
    mocks.destroy.mockClear();
    mocks.getText.mockRejectedValueOnce(new Error('Invalid PDF'));
    const response = await upload('pdf');
    expect(response.status).toBe(500);
    expect(mocks.destroy).toHaveBeenCalledTimes(1);
    expect(await response.json()).toEqual({ error: 'Upload failed' });
  });

  it('rejects oversized binary files before invoking their parser or saving a document', async () => {
    const parserCalls = mocks.getText.mock.calls.length;
    const saveCalls = mocks.saveDocument.mock.calls.length;
    const response = await upload('pdf', 'a'.repeat(20 * 1024 * 1024 + 1));
    expect(response.status).toBe(413);
    expect(mocks.getText).toHaveBeenCalledTimes(parserCalls);
    expect(mocks.saveDocument).toHaveBeenCalledTimes(saveCalls);
  });

  it('rejects excessive extracted text and empty OCR-only PDFs with an actionable error', async () => {
    mocks.getText.mockResolvedValueOnce({ text: '界'.repeat(210000) });
    expect((await upload('pdf')).status).toBe(413);
    mocks.getText.mockResolvedValueOnce({ text: '  ' });
    const empty = await upload('pdf');
    expect(empty.status).toBe(422);
    expect(await empty.json()).toMatchObject({ code: 'DOCUMENT_TEXT_EMPTY', retryable: false, error: expect.stringMatching(/OCR/i) });
  });

  it('reports saved documents with failed indexing rather than claiming indexed success', async () => {
    mocks.ingestDocument.mockResolvedValueOnce({ id: 'ingest', status: 'failed', chunkCount: 0 });
    const response = await upload('txt');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ retryable: true, document: { indexingStatus: 'failed' }, message: expect.stringMatching(/indexing.*retry/i) });
  });

  it('replays a completed upload after response loss without another parser or ingestion run', async () => {
    mocks.set.mockClear();
    const first = await upload('pdf');
    const firstBody = await first.json();
    const completed = mocks.set.mock.calls.find(([value]) => value.uploadCompletion)?.[0].uploadCompletion;
    expect(completed).toBeDefined();
    mocks.getDocumentById.mockResolvedValueOnce({ id: firstBody.documentId, ownerUid: 'owner', uploadCompletion: completed });
    const parserCalls = mocks.getText.mock.calls.length;
    const ingestionCalls = mocks.ingestDocument.mock.calls.length;
    const saveCalls = mocks.saveDocument.mock.calls.length;
    const second = await upload('pdf');
    expect(await second.json()).toMatchObject({ documentId: firstBody.documentId, replayed: true });
    expect(mocks.getText).toHaveBeenCalledTimes(parserCalls);
    expect(mocks.ingestDocument).toHaveBeenCalledTimes(ingestionCalls);
    expect(mocks.saveDocument).toHaveBeenCalledTimes(saveCalls);
  });

  it('reuses saved successful ingestion when later attachment or response persistence was interrupted', async () => {
    mocks.getDocumentById.mockResolvedValueOnce({ id: 'document', ownerUid: 'owner', ingestionRunId: 'original-run',
      ingestionStatus: 'checked', chunkCount: 4, indexing: { status: 'keyword_only' } });
    const ingestionCalls = mocks.ingestDocument.mock.calls.length;
    const response = await upload('txt');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ document: { ingestionRunId: 'original-run', chunkCount: 4 } });
    expect(mocks.ingestDocument).toHaveBeenCalledTimes(ingestionCalls);
  });

  it('rejects deletion that starts during PDF extraction before any storage or document write', async () => {
    const { DocumentOwnerUnavailableError } = await import('@/lib/documents/owner-write');
    mocks.storageSave.mockClear();
    mocks.saveDocument.mockClear();
    mocks.getText.mockImplementationOnce(async () => {
      mocks.ownerCheck.mockRejectedValue(new DocumentOwnerUnavailableError());
      return { text: 'PDF evidence' };
    });
    const response = await upload('pdf');
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'ACCOUNT_UNAVAILABLE', retryable: false });
    expect(mocks.storageSave).not.toHaveBeenCalled();
    expect(mocks.saveDocument).not.toHaveBeenCalled();
  });

  it('fails closed when the current owner state cannot be read', async () => {
    const { DocumentOwnerUnavailableError } = await import('@/lib/documents/owner-write');
    mocks.storageSave.mockClear();
    mocks.ownerCheck.mockRejectedValueOnce(new DocumentOwnerUnavailableError('Account state could not be verified.', 503));
    const response = await upload('txt');
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'ACCOUNT_UNAVAILABLE', retryable: true });
    expect(mocks.storageSave).not.toHaveBeenCalled();
  });

  it('cleans up an in-flight storage upload if erasure begins before its completion', async () => {
    const { DocumentOwnerUnavailableError } = await import('@/lib/documents/owner-write');
    mocks.storageDelete.mockClear();
    mocks.saveDocument.mockClear();
    mocks.storageSave.mockImplementationOnce(async () => {
      mocks.ownerCheck.mockRejectedValue(new DocumentOwnerUnavailableError());
    });
    const response = await upload('txt');
    expect(response.status).toBe(409);
    expect(mocks.storageDelete).toHaveBeenCalledWith({ ignoreNotFound: true });
    expect(mocks.saveDocument).not.toHaveBeenCalled();
  });

  it('refuses JSON artifact writes when the owner has disappeared', async () => {
    const { DocumentOwnerUnavailableError } = await import('@/lib/documents/owner-write');
    const { POST } = await import('@/app/api/documents/upload/route');
    mocks.storageSave.mockClear();
    mocks.ownerCheck.mockRejectedValueOnce(new DocumentOwnerUnavailableError());
    const response = await POST(new Request('http://localhost/api/documents/upload', { method: 'POST',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Brief', html: '<p>Draft</p>', situationId: 'case' }),
    }) as never);
    expect(response.status).toBe(409);
    expect(mocks.storageSave).not.toHaveBeenCalled();
  });
});
