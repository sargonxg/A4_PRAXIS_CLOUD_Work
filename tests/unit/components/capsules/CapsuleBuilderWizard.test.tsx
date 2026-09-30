import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CapsuleBuilderWizard } from '@/components/capsules/CapsuleBuilderWizard';

// Exercise the real wizard event handlers without a browser/DOM dependency.
const runtime = vi.hoisted(() => {
  let cursor = 0;
  const states: unknown[] = [];
  const effects = new Map<number, { deps: readonly unknown[]; cleanup?: () => void }>();
  const pending: Array<() => void> = [];
  return {
    user: { id: 'owner' } as { id: string } | null,
    push: vi.fn(),
    params: new URLSearchParams(),
    state<T>(initial: T | (() => T)) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? (initial as () => T)() : initial;
      return [states[index] as T, (update: T | ((previous: T) => T)) => { states[index] = typeof update === 'function' ? (update as (previous: T) => T)(states[index] as T) : update; }] as const;
    },
    effect(effect: () => void | (() => void), deps: readonly unknown[]) {
      const index = cursor++;
      const previous = effects.get(index);
      if (previous && deps.length === previous.deps.length && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
      pending.push(() => { effects.get(index)?.cleanup?.(); const cleanup = effect(); effects.set(index, { deps, cleanup: cleanup || undefined }); });
    },
    render<T>(callback: () => T) { cursor = 0; return callback(); },
    flush() { for (const effect of pending.splice(0)) effect(); },
    reset() { for (const effect of effects.values()) effect.cleanup?.(); states.length = 0; effects.clear(); pending.length = 0; cursor = 0; },
  };
});
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(), useState: <T,>(initial: T | (() => T)) => runtime.state(initial), useRef: <T,>(initial: T) => runtime.state({ current: initial })[0], useMemo: <T,>(factory: () => T) => factory(), useEffect: (effect: () => void | (() => void), deps: readonly unknown[]) => runtime.effect(effect, deps) }));
vi.mock('next/navigation', () => ({ useSearchParams: () => runtime.params, useRouter: () => ({ push: runtime.push }) }));
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: runtime.user }) }));
vi.mock('@/hooks/use-situation-guard', () => ({ useSituationGuard: () => ({ situation: null, isDemo: false }) }));
vi.mock('@/components/capsules/CapsuleJsonMonacoEditor', () => ({ CapsuleJsonMonacoEditor: () => null }));
vi.mock('@/components/capsules/CapsuleLivePreview', () => ({ CapsuleLivePreview: () => null }));

describe('CapsuleBuilderWizard snapshot lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    runtime.reset(); runtime.user = { id: 'owner' }; runtime.params = new URLSearchParams(); vi.clearAllMocks();
    const session = new Map<string, string>();
    const storage = { getItem: (key: string) => session.get(key) ?? null, setItem: (key: string, value: string) => { session.set(key, value); }, removeItem: (key: string) => { session.delete(key); } };
    vi.stubGlobal('window', { sessionStorage: storage, localStorage: { getItem: () => null, removeItem: () => {} }, setTimeout, clearTimeout, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  });
  afterEach(() => { runtime.reset(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('marks edits after saving and Save and use persists the newest snapshot before navigation', async () => {
    const fetcher = vi.fn().mockImplementation(async () => Response.json({ capsule: { capsuleId: 'private-receipt' } }));
    vi.stubGlobal('fetch', fetcher);
    render(); runtime.flush(); let tree = render();
    changePurpose(tree, 'Compare first decision options.'); tree = render();
    click(tree, 'Save draft'); await settle(); tree = render();
    expect(textContent(tree)).toContain('Private snapshot saved.');
    expect(textContent(tree)).toContain('Use in chat');
    changePurpose(tree, 'Compare revised decision options.'); tree = render();
    expect(textContent(tree)).toContain('Unsaved changes.');
    expect(elements(tree).filter((element) => element.type === 'button').map(textContent)).toContain('Save and use in chat');
    click(tree, 'Save and use in chat'); await settle();
    const payload = JSON.parse(fetcher.mock.calls.at(-1)![1].body);
    expect(payload.purpose).toBe('Compare revised decision options.');
    expect(payload.sourcing).toMatchObject({ allowedDomains: [], blockedDomains: [] });
    expect(payload.tools).toMatchObject({ policy: 'suggest' });
    expect(payload.temporality).toBeUndefined();
    expect(runtime.push).toHaveBeenLastCalledWith('/app?capsuleId=private-receipt');
  });

  it('retains edits and prevents navigation when Save and use fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'Temporary save failure' }, { status: 503 })));
    render(); runtime.flush(); let tree = render();
    changePurpose(tree, 'Keep this private draft after a failure.'); tree = render();
    click(tree, 'Save and use in chat'); await settle(); tree = render();
    expect(textContent(tree)).toContain('Temporary save failure');
    expect(elements(tree).find((element) => element.type === 'textarea')?.props.value).toBe('Keep this private draft after a failure.');
    expect(runtime.push).not.toHaveBeenCalled();
  });

  it('recovers a valid owner draft on reload and immediately hides it on account switch or logout', async () => {
    render(); runtime.flush(); let tree = render();
    changePurpose(tree, 'Owner confidential decision exercise.'); render(); runtime.flush();
    await vi.advanceTimersByTimeAsync(301);
    runtime.reset(); render(); runtime.flush(); tree = render();
    expect(elements(tree).find((element) => element.type === 'textarea')?.props.value).toBe('Owner confidential decision exercise.');
    expect(textContent(tree)).toContain('Working draft restored in this tab.');
    runtime.user = { id: 'another-owner' }; tree = render();
    expect(textContent(tree)).toContain('Loading your working draft');
    expect(textContent(tree)).not.toContain('Owner confidential');
    runtime.flush(); tree = render();
    expect(elements(tree).find((element) => element.type === 'textarea')?.props.value).not.toBe('Owner confidential decision exercise.');
    runtime.user = null; tree = render();
    expect(textContent(tree)).toContain('Sign in to create a private capsule.');
    expect(elements(tree).some((element) => element.type === 'textarea')).toBe(false);
  });

  it('ignores a previous account save receipt after switching accounts', async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise<Response>((done) => { resolve = done; })));
    render(); runtime.flush(); let tree = render();
    changePurpose(tree, 'Account A private request.'); tree = render(); click(tree, 'Save and use in chat');
    runtime.user = { id: 'account-b' }; render(); runtime.flush(); render();
    resolve(Response.json({ capsule: { capsuleId: 'account-a-private-receipt' } })); await settle(); tree = render();
    expect(textContent(tree)).not.toContain('Private snapshot saved.');
    expect(elements(tree).find((element) => element.type === 'textarea')?.props.value).not.toBe('Account A private request.');
    expect(runtime.push).not.toHaveBeenCalled();
  });
});

type Element = ReactElement<{ children?: ReactNode; value?: unknown; onClick?: () => void; onChange?: (event: { target: { value: string } }) => void }>;
function render() { return runtime.render(() => CapsuleBuilderWizard()); }
function elements(node: ReactNode): Element[] { return Children.toArray(node).flatMap((child) => isValidElement(child) ? [child as Element, ...elements((child.props as { children?: ReactNode }).children)] : []); }
function textContent(node: ReactNode): string { return Children.toArray(node).map((child) => isValidElement(child) ? textContent((child.props as { children?: ReactNode }).children) : typeof child === 'string' || typeof child === 'number' ? String(child) : '').join(''); }
function click(tree: ReactNode, label: string) { const button = elements(tree).find((element) => element.type === 'button' && textContent(element).trim() === label); expect(button, `button ${label}`).toBeDefined(); button!.props.onClick!(); }
function changePurpose(tree: ReactNode, value: string) { elements(tree).find((element) => element.type === 'textarea')!.props.onChange!({ target: { value } }); }
async function settle() { for (let i = 0; i < 20; i++) await Promise.resolve(); }
