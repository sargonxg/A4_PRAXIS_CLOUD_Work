import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  pdfLoaded: vi.fn(),
  docxLoaded: vi.fn(),
  getText: vi.fn(),
  destroy: vi.fn(),
  extractRawText: vi.fn(),
  saveDocument: vi.fn(),
  set: vi.fn(),
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
vi.mock('@/lib/firebase/documents-service', () => ({ saveDocument: mocks.saveDocument }));
vi.mock('@/lib/firebase/sources-service', () => ({ saveSource: vi.fn(async () => ({ id: 'source' })) }));
vi.mock('@/lib/firebase/admin', () => ({
  getAdminStorage: () => ({ bucket: () => ({ file: () => ({ save: vi.fn(async () => {}) }) }) }),
  getDefaultBucketName: () => 'test-bucket',
  getAdminDbOrThrow: () => {
    const ref = { collection: () => ref, doc: () => ref, set: mocks.set };
    return ref;
  },
}));
vi.mock('@/lib/documents/auto-structure', () => ({ autoStructureDocument: () => ({ title: 'Evidence', actors: [], keyClaims: [], timelineCandidates: [], sourceType: 'document' }) }));
vi.mock('@/lib/telemetry/emit', () => ({ emitTelemetrySafe: vi.fn(async () => {}) }));
vi.mock('@/lib/knowledge/context-engine', () => ({ localKnowledgeAdapter: { ingestDocument: vi.fn(async () => ({ id: 'ingest', status: 'complete', chunkCount: 1 })) } }));
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

async function upload(extension: string) {
  const { POST } = await import('@/app/api/documents/upload/route');
  const form = new FormData();
  form.set('file', new File(['Evidence text'], `evidence.${extension}`, { type: 'text/plain' }));
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
  });

  it('accepts text without initializing either binary document parser', async () => {
    const response = await upload('txt');
    expect(response.status).toBe(200);
    expect(mocks.pdfLoaded).not.toHaveBeenCalled();
    expect(mocks.docxLoaded).not.toHaveBeenCalled();
    expect(mocks.saveDocument).toHaveBeenCalledWith('owner', 'case', expect.objectContaining({ text: 'Evidence text' }));
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
});
