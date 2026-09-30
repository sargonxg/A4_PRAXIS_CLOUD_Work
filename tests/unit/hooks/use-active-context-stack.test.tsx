import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { sanitizeActiveContextStack } from '@/lib/context/active-context-stack';

vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: { id: 'analyst-a' } }) }));

describe('context attachment persistence', () => {
  afterEach(() => vi.unstubAllGlobals());

  function setup(fetcher: ReturnType<typeof vi.fn>, remote = true) {
    const previous = sanitizeActiveContextStack({ capsuleId: 'previous', stackId: 'previous' });
    const storage = { getItem: () => JSON.stringify(previous), setItem: vi.fn() };
    vi.stubGlobal('window', { localStorage: storage });
    vi.stubGlobal('fetch', fetcher);
    const capture = vi.fn<(value: ReturnType<typeof useActiveContextStack>) => void>();
    function Harness() { capture(useActiveContextStack({ remote })); return null; }
    renderToStaticMarkup(createElement(Harness));
    return { hook: capture.mock.calls[0][0], storage };
  }

  it.each(['network', 'server'])('blocks a remote save before hydration even when the next request would have a %s failure', async (failure) => {
    const fetcher = failure === 'network' ? vi.fn().mockRejectedValue(new Error('offline')) : vi.fn().mockResolvedValue(Response.json({ error: 'unavailable' }, { status: 503 }));
    const { hook, storage } = setup(fetcher);
    await expect(hook.saveStack({ capsuleId: 'new', stackId: 'new' })).rejects.toThrow('saved context to load');
    expect(fetcher).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('stores explicit guest context in its separate local scope without a server call', async () => {
    const fetcher = vi.fn();
    const { hook, storage } = setup(fetcher, false);
    expect(await hook.saveStack({ capsuleId: 'new', stackId: 'new', documentIds: ['document-1'] })).toMatchObject({ documentIds: ['document-1'] });
    expect(storage.setItem).toHaveBeenCalledWith('praxis-active-context-stack:v2:guest', expect.stringContaining('document-1'));
    expect(fetcher).not.toHaveBeenCalled();
  });
});
