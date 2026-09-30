import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PraxisChat, type PraxisChatProps } from '@/components/app/praxis-chat';
import { defaultActiveContextStack, sanitizeActiveContextStack, type ActiveContextStackState } from '@/lib/context/active-context-stack';
import { hasConversationCapsuleSignal } from '@/lib/conversations/capsule-signal';
import { buildInstantContextCapsule } from '@/lib/ai/instant-context';

// Exercise the real Home send callback and its serialized request without a DOM.
const runtime = vi.hoisted(() => {
  let cursor = 0;
  const states: unknown[] = [];
  const effects = new Map<number, { deps: readonly unknown[]; cleanup?: () => void }>();
  const pending: Array<() => void> = [];
  return {
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
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: { id: 'analyst-a' } }) }));
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

beforeEach(() => { runtime.reset(); vi.clearAllMocks(); });
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
