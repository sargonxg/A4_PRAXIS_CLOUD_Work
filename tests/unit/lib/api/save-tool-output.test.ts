import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: vi.fn() }));

import { saveToolOutput } from '@/lib/api/save-tool-output';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

describe('saveToolOutput', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes canonical tool-data and legacy tools documents with profile version', async () => {
    const legacySetMock = vi.fn().mockResolvedValue(undefined);
    const canonicalSetMock = vi.fn().mockResolvedValue(undefined);
    const versionSetMock = vi.fn().mockResolvedValue(undefined);
    const versionDocMock = vi.fn(() => ({ set: versionSetMock }));
    const versionsCollMock = vi.fn(() => ({ doc: versionDocMock }));
    const toolsDocMock = vi.fn(() => ({ set: legacySetMock }));
    const toolDataDocMock = vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ exists: false }),
      set: canonicalSetMock,
      collection: versionsCollMock,
    }));
    const toolsCollMock = vi.fn(() => ({ doc: toolsDocMock }));
    const toolDataCollMock = vi.fn(() => ({ doc: toolDataDocMock }));
    const situationsDocMock = vi.fn(() => ({
      collection: vi.fn((name: string) => {
        if (name === 'tools') return toolsCollMock();
        if (name === 'tool-data') return toolDataCollMock();
        throw new Error(`Unexpected collection ${name}`);
      }),
    }));
    const situationsCollMock = vi.fn(() => ({ doc: situationsDocMock }));
    const usersDocMock = vi.fn(() => ({ collection: situationsCollMock }));
    const db = { collection: vi.fn(() => ({ doc: usersDocMock })) };
    (getAdminDbOrThrow as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    await saveToolOutput({
      uid: 'u1', situationId: 's1', toolId: 'risk-monitor',
      profileVersion: 3, output: { score: 8 },
    });
    expect(canonicalSetMock).toHaveBeenCalledWith(expect.objectContaining({
      data: { score: 8 }, profileVersion: 3, version: 1,
    }), expect.any(Object));
    expect(versionSetMock).toHaveBeenCalledWith(expect.objectContaining({
      data: { score: 8 }, profileVersion: 3, version: 1,
    }));
    expect(legacySetMock).toHaveBeenCalledWith(expect.objectContaining({
      output: { score: 8 }, profileVersion: 3, version: 1,
    }), expect.any(Object));
  });

  it('is a no-op when situationId is absent', async () => {
    const db = { collection: vi.fn() };
    (getAdminDbOrThrow as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    await saveToolOutput({ uid: 'u1', situationId: undefined, toolId: 'chat', profileVersion: 0, output: 'hi' });
    expect(db.collection).not.toHaveBeenCalled();
  });
});
