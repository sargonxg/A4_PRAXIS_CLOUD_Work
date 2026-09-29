import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveCapsuleStarterNotes } from '@/lib/context/save-capsule-starter-notes';

afterEach(() => vi.unstubAllGlobals());

describe('capsule starter notes', () => {
  const input = { capsuleId: 'private-capsule', label: '<Example>', notes: 'A & B', onUploaded: vi.fn() };

  it('reports an upload failure without attempting attachment', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 500 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(saveCapsuleStarterNotes(input)).rejects.toThrow('notes could not be uploaded');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('retains the upload receipt and retries attachment without uploading twice', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ documentId: 'document-1' }))
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetcher);
    const onUploaded = vi.fn();
    await expect(saveCapsuleStarterNotes({ ...input, onUploaded })).rejects.toThrow('could not be attached');
    const uploaded = onUploaded.mock.calls[0][0];
    await saveCapsuleStarterNotes({ ...input, uploaded, onUploaded });
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      '/api/documents/upload', '/api/context/capsules/private-capsule/attach', '/api/context/capsules/private-capsule/attach',
    ]);
    expect(JSON.parse(fetcher.mock.calls[0][1].body).html).toContain('&lt;Example&gt;');
    expect(JSON.parse(fetcher.mock.calls[0][1].body).html).toContain('A &amp; B');
  });

  it('uploads edited notes instead of reusing an obsolete document', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ documentId: 'new-doc' })).mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetcher);
    await saveCapsuleStarterNotes({ ...input, uploaded: { documentId: 'old-doc', notes: 'old text' } });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetcher.mock.calls[1][1].body).documentIds).toEqual(['new-doc']);
  });
});
