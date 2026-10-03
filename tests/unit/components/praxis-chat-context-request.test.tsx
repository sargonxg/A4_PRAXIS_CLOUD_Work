import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PraxisChat, type PraxisChatProps } from '@/components/app/praxis-chat';
import { defaultActiveContextStack, sanitizeActiveContextStack, type ActiveContextStackState } from '@/lib/context/active-context-stack';
import { hasConversationCapsuleSignal } from '@/lib/conversations/capsule-signal';
import { buildInstantContextCapsule } from '@/lib/ai/instant-context';
import { saveQuestionHandoff } from '@/lib/auth/question-handoff';
import { isValidElement, type ReactNode, type ReactElement } from 'react';

// Exercise the real Home send callback and its serialized request without a DOM.
const runtime = vi.hoisted(() => {
  let cursor = 0;
  const states: unknown[] = [];
  const effects = new Map<number, { deps: readonly unknown[]; cleanup?: () => void }>();
  const pending: Array<() => void> = [];
  return {
    owner: 'analyst-a',
    router: { push: vi.fn() },
    useState<T>(initial: T | (() => T)) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? (initial as () => T)() : initial;
      return [states[index] as T, (update: T | ((previous: T) => T)) => {
        states[index] = typeof update === 'function' ? (update as (previous: T) => T)(states[index] as T) : update;
      }] as const;
    },
    useRef<T>(initial: T) {
      const index = cursor++;
      if (!(index in states)) states[index] = { current: initial };
      return states[index] as { current: T };
    },
    useEffect(effect: () => void | (() => void), deps: readonly unknown[]) {
      const index = cursor++;
      const previous = effects.get(index);
      if (previous && deps.length === previous.deps.length && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
      pending.push(() => {
        effects.get(index)?.cleanup?.();
        const cleanup = effect();
        effects.set(index, { deps, cleanup: cleanup || undefined });
      });
    },
    render<T>(callback: () => T) { cursor = 0; return callback(); },
    flushEffects() { for (const effect of pending.splice(0)) effect(); },
    reset() {
      for (const effect of effects.values()) effect.cleanup?.();
      states.length = 0;
      effects.clear();
      pending.length = 0;
      cursor = 0;
    },
  };
});

vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useState: runtime.useState,
  useRef: runtime.useRef,
  useEffect: runtime.useEffect,
  useMemo: <T,>(compute: () => T) => compute(),
  useCallback: <T,>(callback: T) => callback,
}));
vi.mock('next/navigation', () => ({ useRouter: () => runtime.router }));
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: runtime.owner ? { id: runtime.owner, email: `${runtime.owner}@example.test` } : null }) }));
vi.mock('@/lib/domain/classifier', () => ({ classifyDomain: vi.fn().mockResolvedValue({ domainId: 'generic', confidence: 1, rationale: 'Fixture domain', alternatives: [] }) }));
vi.mock('@/lib/domain/resolve', () => ({ resolveDomain: vi.fn().mockResolvedValue({ id: 'generic', name: 'General policy', description: 'Policy analysis', promptOverrides: {}, preferredFeeds: [], frameworks: [], defaultAudience: null }) }));

interface ChatRequest {
  capsuleId?: string;
  contextPackageId?: string;
  activeContextStack: ActiveContextStackState;
  messages: Array<{ role: string; content: string }>;
  threadId: string;
  turnMetadata: { capsuleId: string | null; requestedOutputTarget: string | null; activeCapsules: unknown[] };
}

async function sendHome(activeContextStack: ActiveContextStackState | null) {
  const values = new Map<string, string>();
  vi.stubGlobal('window', { localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  } });
  const requests: ChatRequest[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
    if (url === '/api/ai/chat' && options?.method === 'POST') {
      requests.push(JSON.parse(options.body as string) as ChatRequest);
      return new Response('0:"Policy response"\n');
    }
    return Response.json(url.startsWith('/api/ai/chat?') ? { turns: [] } : {});
  }));
  const props: PraxisChatProps = { mode: 'authenticated', activeContextStack, initialPrompt: 'Explain negotiation mandates.', autoSendNonce: 1, currentPath: '/app' };
  runtime.render(() => PraxisChat(props));
  runtime.flushEffects();
  for (let i = 0; i < 12; i++) await Promise.resolve();
  runtime.render(() => PraxisChat(props));
  runtime.flushEffects();
  for (let i = 0; i < 24; i++) await Promise.resolve();
  expect(requests).toHaveLength(1);
  return requests[0];
}

beforeEach(() => { runtime.reset(); runtime.owner = 'analyst-a'; vi.clearAllMocks(); });
afterEach(() => { runtime.reset(); vi.unstubAllGlobals(); });

describe('Home request reaches the server with the selected context only', () => {
  it.each(['new Home', 'explicitly cleared context'])('%s uses real server instant mode without reviving saved capsule context', async (state) => {
    const request = await sendHome(state === 'new Home' ? null : defaultActiveContextStack());
    expect(hasConversationCapsuleSignal(request)).toBe(false);
    expect(request.activeContextStack).toMatchObject({ capsuleId: null, capsuleRefs: [], sourceIds: [], documentIds: [], outputGoal: null, evidenceGaps: [], contextBlocks: defaultActiveContextStack().contextBlocks });
    expect(request.capsuleId).toBeUndefined();
    expect(request.turnMetadata.requestedOutputTarget).toBeNull();
    expect(request.threadId).toBe('home-direct');

    // These are the actual predicate and builder used by the chat route's instant branch.
    const instant = await buildInstantContextCapsule({ uid: 'analyst-a', prompt: request.messages.at(-1)!.content });
    expect(instant.ephemeral).toBe(true);
    expect(instant.capsuleContext.capsule.capsuleId).toMatch(/^instant-/);
    expect(instant.turnCapsule.sourceDocumentCore).toEqual([]);
    expect(instant.capsuleContext.capsule.coreRefs.documentCoreIds).toEqual([]);
    expect(instant.capsuleContext.capsule.coreRefs.sourceCoreIds).toEqual([]);
  });

  it.each([
    { label: 'capsules', patch: { capsuleId: 'selected-case', capsuleRefs: [{ capsuleId: 'selected-method', role: 'tool' }] } },
    { label: 'documents and sources', patch: { documentIds: ['selected-document'], sourceIds: ['selected-source'] } },
    { label: 'output and context references', patch: { outputGoal: 'Negotiation brief', contextBlocks: { output: [{ id: 'selected-format', capsuleId: 'selected-format', label: 'Brief format', role: 'output', primary: true, order: 0 }] } } },
  ])('preserves explicitly selected $label in the real request', async ({ patch }) => {
    const selected = sanitizeActiveContextStack(patch);
    const request = await sendHome(selected);
    expect(hasConversationCapsuleSignal(request)).toBe(true);
    expect(request.activeContextStack).toEqual(selected);
    expect(request.turnMetadata.requestedOutputTarget).toBe(selected.outputGoal);
  });
});

function nodes(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...nodes(node.props.children as ReactNode)];
}
function renderChat(props: PraxisChatProps) {
  runtime.render(() => PraxisChat(props)); runtime.flushEffects();
  return runtime.render(() => PraxisChat(props));
}
function inputOf(tree: ReactNode) { return nodes(tree).find((node) => node.type === 'textarea')!; }
async function submitChat(tree: ReactNode) { await (nodes(tree).find((node) => node.type === 'form')!.props.onSubmit as (e: unknown) => void)({ preventDefault() {} }); }
function click(tree: ReactNode, label: string) { const button = nodes(tree).find((node) => node.type === 'button' && node.props.children === label)!; expect(button).toBeDefined(); (button.props.onClick as () => void)(); }
function tabStore() { const values = new Map<string, string>(); return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } }; }
describe('actual Chat privacy and recovery callbacks (controlled transport)', () => {
  it.each([
    { label: 'anonymous public visitor', mode: 'public' as const, owner: '' },
    { label: 'signed-in analyst without a handoff', mode: 'authenticated' as const, owner: 'analyst-a' },
  ])('does not offer nonexistent saved-question recovery to a $label', ({ mode, owner }) => {
    runtime.owner = owner;
    vi.stubGlobal('window', { localStorage: tabStore(), sessionStorage: tabStore() });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ turns: [] })));
    const tree = renderChat({ mode });
    expect(nodes(tree).some((node) => node.props['aria-label'] === 'Saved question recovery')).toBe(false);
    expect(nodes(tree).some((node) => node.props.children === 'Restore saved question')).toBe(false);
    expect(nodes(tree).some((node) => node.props.children === 'Dismiss saved question')).toBe(false);
  });
  it.each(['http', 'network', 'stream'])('restores the question after a %s failure without changing its qualifications', async (failure) => {
    vi.stubGlobal('window', { localStorage: tabStore(), sessionStorage: tabStore(), dispatchEvent: vi.fn() });
    vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
      if (url !== '/api/ai/chat' || options?.method !== 'POST') return Response.json({ turns: [] });
      if (failure === 'network') throw new Error('connection lost');
      if (failure === 'stream') return new Response('3:"Provider unavailable; funding remains undecided."\n');
      return Response.json({ error: 'Model unavailable' }, { status: 503 });
    }));
    const props: PraxisChatProps = { mode: 'authenticated', initialPrompt: 'An optional pilot, subject to undecided funding.' };
    await submitChat(renderChat(props));
    expect(inputOf(renderChat(props)).props.value).toBe(props.initialPrompt);
  });
  it.each(['newer draft', 'different account'])('a late failure cannot overwrite a %s', async (change) => {
    vi.stubGlobal('window', { localStorage: tabStore(), sessionStorage: tabStore() });
    let finish!: (response: Response) => void;
    let started!: () => void;
    const pending = new Promise<Response>((resolve) => { finish = resolve; });
    const sending = new Promise<void>((resolve) => { started = resolve; });
    vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
      if (url === '/api/ai/chat' && options?.method === 'POST') { started(); return pending; }
      return Response.json({ turns: [] });
    }));
    const props: PraxisChatProps = { mode: 'authenticated', initialPrompt: 'Prior private question' };
    const submitted = submitChat(renderChat(props));
    await sending;
    if (change === 'different account') runtime.owner = 'analyst-b';
    const tree = renderChat(props);
    const newer = change === 'different account' ? 'Account B question' : 'Newer qualified question';
    (inputOf(tree).props.onChange as (event: unknown) => void)({ target: { value: newer } });
    finish(Response.json({ error: 'Model unavailable' }, { status: 503 }));
    await submitted;
    expect(inputOf(renderChat(props)).props.value).toBe(newer);
  });
  it('persists failed submission recovery across refresh', async () => {
    vi.stubGlobal('window', { localStorage: tabStore(), sessionStorage: tabStore() });
    vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => url === '/api/ai/chat' && options?.method === 'POST'
      ? Response.json({ error: 'Model unavailable' }, { status: 503 }) : Response.json({ turns: [] })));
    const props: PraxisChatProps = { mode: 'authenticated', initialPrompt: 'Funding remains undecided.' };
    await submitChat(renderChat(props));
    expect(inputOf(renderChat(props)).props.value).toBe(props.initialPrompt);
    runtime.reset();
    expect(inputOf(renderChat({ ...props, initialPrompt: '' })).props.value).toBe(props.initialPrompt);
  });
  it('keeps unsent drafts scoped to the same capsule conversation', () => {
    vi.stubGlobal('window', { localStorage: tabStore(), sessionStorage: tabStore() });
    const props: PraxisChatProps = { mode: 'authenticated', activeContextStack: sanitizeActiveContextStack({ capsuleId: 'dossier-a' }) };
    const input = inputOf(renderChat(props));
    (input.props.onChange as (event: unknown) => void)({ target: { value: 'Private dossier A question' } });
    expect(inputOf(renderChat(props)).props.value).toBe('Private dossier A question');
    expect(inputOf(renderChat({ ...props, activeContextStack: sanitizeActiveContextStack({ capsuleId: 'dossier-b' }) })).props.value).toBe('');
    expect(inputOf(renderChat(props)).props.value).toBe('Private dossier A question');
  });
  it('uses one opaque auth URL on repeated submission and keeps text out of native form fields', async () => {
    vi.stubGlobal('window', { localStorage: tabStore(), sessionStorage: tabStore() });
    const props: PraxisChatProps = { mode: 'public', initialPrompt: 'Private Ministry briefing' };
    const tree = renderChat(props);
    await submitChat(tree); await submitChat(tree);
    expect(runtime.router.push).toHaveBeenCalledTimes(1);
    const url = runtime.router.push.mock.calls[0][0] as string;
    expect(url).toContain('handoff'); expect(decodeURIComponent(url)).not.toContain('Private');
    expect(nodes(tree).filter((node) => node.props.name === 'capsulePrompt')).toHaveLength(0);
    expect(nodes(tree).find((node) => node.type === 'form')?.props.method).toBe('post');
  });
  it('keeps the draft visible and does not navigate if storage is blocked', async () => {
    vi.stubGlobal('window', { localStorage: tabStore(), get sessionStorage() { throw Error('blocked'); } });
    const props: PraxisChatProps = { mode: 'public', initialPrompt: 'Funding remains undecided.' };
    await submitChat(renderChat(props));
    const tree = renderChat(props);
    expect(runtime.router.push).not.toHaveBeenCalled();
    expect(inputOf(tree).props.value).toBe(props.initialPrompt);
    expect(nodes(tree).some((node) => String(node.props.children).includes('Your question is still here'))).toBe(true);
  });
  it('restores explicitly, survives refresh and is inaccessible after account switch', () => {
    const sessionStorage = tabStore(); vi.stubGlobal('window', { localStorage: tabStore(), sessionStorage });
    const saved = saveQuestionHandoff(sessionStorage, { text: 'An optional pilot.', target: '/app' });
    const props: PraxisChatProps = { mode: 'authenticated', questionHandoffId: saved.id };
    let tree = renderChat(props); expect(inputOf(tree).props.value).toBe('');
    click(tree, 'Restore saved question'); tree = renderChat(props);
    expect(inputOf(tree).props.value).toBe('An optional pilot.');
    runtime.reset(); tree = renderChat(props); expect(inputOf(tree).props.value).toBe('An optional pilot.');
    runtime.owner = 'analyst-b'; tree = renderChat(props); expect(inputOf(tree).props.value).toBe('');
    expect(nodes(tree).some((node) => node.props.children === 'Restore saved question')).toBe(false);
  });
  it('does not replace a newer draft with an older handoff and dismissal preserves that draft', () => {
    const sessionStorage = tabStore(); vi.stubGlobal('window', { localStorage: tabStore(), sessionStorage });
    const saved = saveQuestionHandoff(sessionStorage, { text: 'Older question', target: '/app' });
    const props: PraxisChatProps = { mode: 'authenticated', initialPrompt: 'Newer question', questionHandoffId: saved.id };
    let tree = renderChat(props);
    expect(nodes(tree).find((node) => node.props.children === 'Restore saved question')?.props.disabled).toBe(true);
    click(tree, 'Restore saved question'); tree = renderChat(props); expect(inputOf(tree).props.value).toBe('Newer question');
    click(tree, 'Dismiss saved question'); tree = renderChat(props); expect(inputOf(tree).props.value).toBe('Newer question');
  });
});
