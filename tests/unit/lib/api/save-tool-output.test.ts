import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: vi.fn() }));

import { saveToolOutput } from '@/lib/api/save-tool-output';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

describe('saveToolOutput', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes to situations/{id}/tools/{toolId} with profile version', async () => {
    const setMock = vi.fn().mockResolvedValue(undefined);
    const toolsDocMock = vi.fn(() => ({ set: setMock }));
    const toolsCollMock = vi.fn(() => ({ doc: toolsDocMock }));
    const situationsDocMock = vi.fn(() => ({ collection: toolsCollMock }));
    const situationsCollMock = vi.fn(() => ({ doc: situationsDocMock }));
    const usersDocMock = vi.fn(() => ({ collection: situationsCollMock }));
    const db = { collection: vi.fn(() => ({ doc: usersDocMock })) };
    (getAdminDbOrThrow as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    await saveToolOutput({
      uid: 'u1', situationId: 's1', toolId: 'risk-monitor',
      profileVersion: 3, output: { score: 8 },
    });
    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({
      output: { score: 8 }, profileVersion: 3,
    }), expect.any(Object));
  });

  it('is a no-op when situationId is absent', async () => {
    const db = { collection: vi.fn() };
    (getAdminDbOrThrow as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    await saveToolOutput({ uid: 'u1', situationId: undefined, toolId: 'chat', profileVersion: 0, output: 'hi' });
    expect(db.collection).not.toHaveBeenCalled();
  });
});
