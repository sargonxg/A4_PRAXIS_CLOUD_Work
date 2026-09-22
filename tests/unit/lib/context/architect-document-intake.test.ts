import { describe, expect, it, vi } from 'vitest';
import { ingestArchitectDocuments } from '@/lib/context/architect-document-intake';

describe('architect document intake', () => {
  it('creates a real workspace before uploading when no case is selected', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ situation: { id: 'new-case' } }))
      .mockResolvedValueOnce(Response.json({ documentId: 'doc-1' }))
      .mockResolvedValueOnce(Response.json({ document: { previewText: 'Source evidence' } }));
    const result = await ingestArchitectDocuments([new File(['evidence'], 'source.txt')], { workspaceName: 'Evidence review', fetcher });
    expect(result.situationId).toBe('new-case');
    expect(fetcher.mock.calls[0][0]).toBe('/api/situations');
    expect((fetcher.mock.calls[1][1].body as FormData).get('situationId')).toBe('new-case');
    expect(result.documents).toHaveLength(1);
  });
  it('does not upload under a fabricated default if workspace creation fails', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 503 }));
    const result = await ingestArchitectDocuments([new File(['evidence'], 'source.txt')], { fetcher });
    expect(result.documents).toEqual([]);
    expect(result.warnings.join(' ')).toContain('workspace');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('uploads a PDF through canonical ingestion and reads its extracted text', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ documentId: 'doc-1' }))
      .mockResolvedValueOnce(Response.json({ document: { title: 'Evidence', previewText: 'Council met on 2026-01-02.', truncated: true } }));
    const result = await ingestArchitectDocuments([new File(['pdf'], 'evidence.pdf', { type: 'application/pdf' })], { situationId: 'case-1', fetcher });
    expect(result.documents[0]).toMatchObject({ documentId: 'doc-1', text: 'Council met on 2026-01-02.' });
    expect(result.warnings.join(' ')).toContain('first 16,000');
    expect(fetcher.mock.calls[0][0]).toBe('/api/documents/upload');
    expect((fetcher.mock.calls[0][1].body as FormData).get('situationId')).toBe('case-1');
  });
  it('never labels a scanned PDF with no extracted text as ready', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ documentId: 'scan' }))
      .mockResolvedValueOnce(Response.json({ document: { previewText: '' } }));
    const result = await ingestArchitectDocuments([new File(['scan'], 'scan.pdf')], { situationId: 'case-1', fetcher });
    expect(result.documents).toEqual([]);
    expect(result.warnings.join(' ')).toContain('OCR');
  });
  it('reports per-file failures and keeps successful documents', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(Response.json({ documentId: 'good' }))
      .mockResolvedValueOnce(Response.json({ document: { previewText: 'Evidence text' } }));
    const result = await ingestArchitectDocuments([new File(['bad'], 'bad.pdf'), new File(['ok'], 'good.txt')], { situationId: 'case-1', fetcher });
    expect(result.documents.map((item) => item.documentId)).toEqual(['good']);
    expect(result.warnings.join(' ')).toContain('bad.pdf');
  });
});
