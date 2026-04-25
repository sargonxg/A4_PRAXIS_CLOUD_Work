import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  adminDb: null as unknown,
}));

vi.mock('@/lib/firebase/admin', () => ({
  get adminDb() {
    return state.adminDb;
  },
}));

import { saveToolData } from '@/lib/firebase/tool-data-service';

describe('tool-data-service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns authoritative generatedAt and version after saving', async () => {
    const setCurrent = vi.fn(async () => undefined);
    const setVersion = vi.fn(async () => undefined);
    const getCurrent = vi.fn(async () => ({ exists: true, data: () => ({ version: 2 }) }));
    const currentRef = {
      get: getCurrent,
      set: setCurrent,
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({ set: setVersion })),
      })),
    };
    const db = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              collection: vi.fn(() => ({
                doc: vi.fn(() => currentRef),
              })),
            })),
          })),
        })),
      })),
    };
    state.adminDb = db as never;

    const result = await saveToolData('u1', 's1', 'risk-monitor', { score: 72 });

    expect(result.version).toBe(3);
    expect(Date.parse(result.generatedAt)).not.toBeNaN();
    expect(setCurrent).toHaveBeenCalledWith(expect.objectContaining({
      data: { score: 72 },
      version: 3,
      generatedAt: result.generatedAt,
    }));
    expect(setVersion).toHaveBeenCalledWith(expect.objectContaining({
      data: { score: 72 },
      version: 3,
      generatedAt: result.generatedAt,
    }));
  });
});
