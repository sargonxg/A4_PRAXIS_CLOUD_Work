import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { sanitizeActiveContextStack } from '@/lib/context/active-context-stack';

describe('context attachment persistence', () => {
  afterEach(() => vi.unstubAllGlobals());

  function setup(fetcher: ReturnType<typeof vi.fn>) {
    const previous = sanitizeActiveContextStack({ capsuleId: 'previous', stackId: 'previous' });
    const storage = { getItem: () => JSON.stringify(previous), setItem: vi.fn() };
    vi.stubGlobal('window', { localStorage: storage });
    vi.stubGlobal('fetch', fetcher);
    const capture = vi.fn<(value: ReturnType<typeof useActiveContextStack>) => void>();
    function Harness() { capture(useActiveContextStack()); return null; }
    renderToStaticMarkup(createElement(Harness));
    return { hook: capture.mock.calls[0][0], storage };
  }

  it.each(['network', 'server'])('preserves the prior attachment and reports a %s failure', async (failure) => {
    const fetcher = failure === 'network' ? vi.fn().mockRejectedValue(new Error('offline')) : vi.fn().mockResolvedValue(Response.json({ error: 'unavailable' }, { status: 503 }));
    const { hook, storage } = setup(fetcher);
    await expect(hook.saveStack({ capsuleId: 'new', stackId: 'new' })).rejects.toThrow('previous capsule is still attached');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('stores the server-confirmed capsule including its existing document references', async () => {
    const saved = sanitizeActiveContextStack({ capsuleId: 'new', stackId: 'new', documentIds: ['document-1'] });
    const { hook, storage } = setup(vi.fn().mockResolvedValue(Response.json({ stack: saved, persisted: true })));
    expect(await hook.saveStack({ capsuleId: 'new', stackId: 'new' })).toMatchObject({ documentIds: ['document-1'] });
    expect(storage.setItem).toHaveBeenCalledWith('praxis-active-context-stack', expect.stringContaining('document-1'));
  });
});
