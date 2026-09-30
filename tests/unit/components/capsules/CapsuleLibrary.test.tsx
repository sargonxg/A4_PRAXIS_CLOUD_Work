import { renderToStaticMarkup } from 'react-dom/server';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CapsuleLibrary, CapsuleLibraryWithTry } from '@/components/capsules/CapsuleLibrary';
import {
  CAPSULE_LIBRARY_CATEGORIES,
  CAPSULE_LIBRARY_ENTRIES,
  buildCapsuleLibraryFacetOptions,
  buildCapsuleRepositoryEntries,
  capsuleRepositoryEntryFromCapsule,
  filterCapsuleLibraryEntries,
  filterCapsuleRepositoryEntries,
  proposeDockSlotForCapsule,
} from '@/lib/capsules/library';
import { sanitizeCapsule } from '@/lib/context/capsule-service';
import { POLICY_CAPSULE_SPOTLIGHTS } from '@/lib/capsules/spotlights';
import { defaultActiveContextStack } from '@/lib/context/active-context-stack';

// Run owner transitions through the real component without adding a DOM dependency.
const runtime = vi.hoisted(() => {
  let cursor = 0;
  const states: unknown[] = [];
  const effects = new Map<number, { deps: readonly unknown[]; cleanup?: () => void }>();
  const pending: Array<() => void> = [];
  return {
    user: { id: 'owner' } as { id: string } | null,
    authLoading: false,
    hydrated: false,
    lifecycle: false,
    saveStack: vi.fn(),
    push: vi.fn(),
    useState<T>(initial: T | (() => T)) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? (initial as () => T)() : initial;
      return [states[index] as T, (update: T | ((previous: T) => T)) => {
        states[index] = typeof update === 'function' ? (update as (previous: T) => T)(states[index] as T) : update;
      }] as const;
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
      this.lifecycle = false;
    },
  };
});
vi.mock('react', async (importOriginal) => {
  const original = await importOriginal<typeof import('react')>();
  return {
    ...original,
    useState: <T,>(initial: T | (() => T)) => runtime.lifecycle ? runtime.useState(initial) : original.useState(initial),
    useEffect: (effect: () => void | (() => void), deps: readonly unknown[]) => runtime.lifecycle ? runtime.useEffect(effect, deps) : original.useEffect(effect, deps),
    useMemo: <T,>(factory: () => T, deps: readonly unknown[]) => runtime.lifecycle ? factory() : original.useMemo(factory, deps),
    useRef: <T,>(initial: T) => runtime.lifecycle ? runtime.useState({ current: initial })[0] : original.useRef(initial),
  };
});
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: runtime.push }) }));
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: () => ({ user: runtime.user, loading: runtime.authLoading }) }));
vi.mock('@/components/app/use-active-context-stack', () => ({
  useActiveContextStack: () => ({ stack: defaultActiveContextStack(), hydrated: runtime.hydrated, saveStack: runtime.saveStack }),
}));

describe('CapsuleLibrary', () => {
  beforeEach(() => {
    runtime.reset();
    runtime.user = { id: 'owner' };
    runtime.authLoading = false;
    runtime.hydrated = false;
    vi.clearAllMocks();
  });
  afterEach(() => { runtime.reset(); vi.unstubAllGlobals(); });

  it('hides account A immediately while account B inventory is pending or failed, then loads only B on retry', async () => {
    const bRequest = deferredResponse();
    const aCapsule = ownedCapsule({ capsuleId: 'a-private', label: 'Account A confidential title', coreRefs: { documentCoreIds: ['a-confidential-document'] } });
    const bCapsule = ownedCapsule({ capsuleId: 'b-private', label: 'Account B title', coreRefs: { documentCoreIds: ['b-document'] } });
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ capsules: [aCapsule] }))
      .mockReturnValueOnce(bRequest.promise)
      .mockResolvedValueOnce(Response.json({ capsules: [bCapsule] }));
    vi.stubGlobal('fetch', fetcher);
    renderInventory();
    await settleInventory();
    expect(renderInventory().entries[0]).toMatchObject({ id: 'a-private', title: 'Account A confidential title', coreRefs: { documentCoreIds: ['a-confidential-document'] } });

    runtime.user = { id: 'account-b' };
    expect(renderInventory().entries.every((entry) => entry.origin === 'starter')).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await settleInventory();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(renderInventory().entries.every((entry) => entry.origin === 'starter')).toBe(true);
    bRequest.resolve(Response.json({ error: 'unavailable' }, { status: 503 }));
    await settleInventory();
    const failed = renderInventory();
    expect(failed.entries.every((entry) => entry.origin === 'starter')).toBe(true);
    expect(failed.retry).toBeDefined();
    failed.retry!();
    renderInventory();
    await settleInventory();
    const recovered = renderInventory().entries;
    expect(recovered[0]).toMatchObject({ id: 'b-private', title: 'Account B title', coreRefs: { documentCoreIds: ['b-document'] } });
    expect(recovered.some((entry) => entry.id === 'a-private')).toBe(false);
  });

  it('aborts an old account inventory request and ignores its late response after another account loads', async () => {
    const lateA = deferredResponse();
    const fetcher = vi.fn()
      .mockReturnValueOnce(lateA.promise)
      .mockResolvedValueOnce(Response.json({ capsules: [ownedCapsule({ capsuleId: 'b-private' })] }));
    vi.stubGlobal('fetch', fetcher);
    renderInventory();
    await settleInventory();
    runtime.user = { id: 'account-b' };
    renderInventory();
    await settleInventory();
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
    expect(renderInventory().entries[0].id).toBe('b-private');
    lateA.resolve(Response.json({ capsules: [ownedCapsule({ capsuleId: 'a-private' })] }));
    await settleInventory();
    expect(renderInventory().entries[0].id).toBe('b-private');
    expect(renderInventory().entries.some((entry) => entry.id === 'a-private')).toBe(false);
  });

  it('loads the next owner page without losing previously loaded capsules or duplicating receipts', async () => {
    const first = ownedCapsule({ capsuleId: 'first-private' });
    const second = ownedCapsule({ capsuleId: 'second-private' });
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ capsules: [first], nextCursor: 'cursor-page-2', hasMore: true }))
      .mockResolvedValueOnce(Response.json({ capsules: [first, second], nextCursor: null, hasMore: false }));
    vi.stubGlobal('fetch', fetcher);
    renderInventory(); await settleInventory();
    const page = renderInventory();
    expect(page.loadMore).toBeDefined();
    page.loadMore!(); renderInventory(); await settleInventory();
    expect(fetcher.mock.calls[0][0]).toContain('limit=50');
    expect(fetcher.mock.calls[1][0]).toContain('cursor=cursor-page-2');
    const rows = renderInventory().entries.filter((entry) => entry.origin === 'user');
    expect(rows.map((entry) => entry.id)).toEqual(['first-private', 'second-private']);
    expect(renderInventory().loadMore).toBeUndefined();
  });

  it('keeps the public catalog visible and skips private inventory requests until auth settles', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ capsules: [ownedCapsule()] }));
    vi.stubGlobal('fetch', fetcher);
    runtime.authLoading = true;
    expect(renderInventory().entries.every((entry) => entry.origin === 'starter')).toBe(true);
    await settleInventory();
    expect(fetcher).not.toHaveBeenCalled();
    runtime.user = null;
    runtime.authLoading = false;
    renderInventory();
    await settleInventory();
    expect(fetcher).not.toHaveBeenCalled();
    runtime.user = { id: 'owner' };
    renderInventory();
    await settleInventory();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(renderInventory().entries[0].origin).toBe('user');
    runtime.user = null;
    expect(renderInventory().entries.every((entry) => entry.origin === 'starter')).toBe(true);
    await settleInventory();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([
    { owner: true, authLoading: false, hydrated: false, disabled: true },
    { owner: true, authLoading: false, hydrated: true, disabled: false },
    { owner: false, authLoading: false, hydrated: false, disabled: false },
    { owner: false, authLoading: true, hydrated: false, disabled: true },
  ])('gates library attachment by account context readiness: %j', (state) => {
    runtime.user = state.owner ? { id: 'owner' } : null;
    runtime.authLoading = state.authLoading;
    runtime.hydrated = state.hydrated;
    const method = CAPSULE_LIBRARY_ENTRIES.find((entry) => entry.id === 'starter-tool-institutional-logic-lens')!;
    const html = renderToStaticMarkup(<CapsuleLibraryWithTry entries={[method]} />);
    const attachmentButtons = (html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [])
      .filter((button) => /Use in chat/.test(button));
    expect(attachmentButtons).toHaveLength(1);
    expect(attachmentButtons.every((button) => button.includes('disabled=""') === state.disabled)).toBe(true);
    expect(html).toContain('Inspect capsule');
    expect(runtime.saveStack).not.toHaveBeenCalled();
  });

  it('keeps a seeded starter’s exact catalog type and domain when metadata omits its snapshot', () => {
    for (const spotlight of POLICY_CAPSULE_SPOTLIGHTS) {
      const starter = CAPSULE_LIBRARY_ENTRIES.find((entry) => entry.id === spotlight.id)!;
      const metadata = { ...ownedCapsule({ capsuleId: starter.id, version: 8 }), starterSnapshot: undefined, v3: undefined };
      const [loaded] = buildCapsuleRepositoryEntries({ userCapsules: [metadata], starterEntries: [starter] });
      expect(loaded.origin).toBe('user');
      expect(loaded.version).toBe(8);
      expect(loaded.title).toBe(metadata.label);
      expect(loaded.capsuleType, starter.id).toBe(starter.capsuleType);
      expect(loaded.starterDomain, starter.id).toBe(starter.starterDomain);
      expect(proposeDockSlotForCapsule(loaded), starter.id).toBe(proposeDockSlotForCapsule(starter));
      expect(loaded.coreRefs.documentCoreIds).toEqual(metadata.coreRefs.documentCoreIds);
    }
  });

  it('does not treat an unknown user ID that resembles a starter as a catalog method', () => {
    const custom = ownedCapsule({
      capsuleId: 'starter-tool-institutional-logic-lens-private-copy',
      scope: 'situation', starterSnapshot: undefined, v3: undefined,
      coreRefs: { situationCoreId: 'custom-case', documentCoreIds: ['custom-document'] },
      community: { tags: [] },
    });
    const entry = capsuleRepositoryEntryFromCapsule(custom);
    expect(entry.origin).toBe('user');
    expect(entry.capsuleType).toBe('situation');
    expect(entry.starterDomain).toBe('generic');
    expect(proposeDockSlotForCapsule(entry)).toBe('situation');
  });

  it('uses private builder domain metadata and treats missing domain as generic rather than user scope', () => {
    const custom = ownedCapsule({ capsuleId: 'private-domain', v3: undefined, starterSnapshot: undefined, memoryPosture: { builderDraft: { domain: 'economic-sanctions' } } });
    expect(capsuleRepositoryEntryFromCapsule(custom).starterDomain).toBe('economic-sanctions');
    expect(capsuleRepositoryEntryFromCapsule({ ...custom, memoryPosture: undefined }).starterDomain).toBe('generic');
  });

  it('builds featured entries from real ranked starter capsules for every category', () => {
    expect(CAPSULE_LIBRARY_CATEGORIES.map((category) => category.id)).toEqual([
      'conflict',
      'mediation',
      'governance',
      'narrative',
      'human-rights',
      'economic',
      'humanitarian',
      'legal',
      'security',
    ]);

    for (const category of CAPSULE_LIBRARY_CATEGORIES) {
      const entries = filterCapsuleLibraryEntries(CAPSULE_LIBRARY_ENTRIES, category.id);
      expect(entries.length, category.id).toBeGreaterThan(0);
      const spotlightIds = new Set<string>(POLICY_CAPSULE_SPOTLIGHTS.map((entry) => entry.id));
      expect(entries.filter((entry) => !spotlightIds.has(entry.id)).length, category.id).toBeLessThanOrEqual(3);
      expect(entries.every((entry) => entry.id.startsWith('starter-'))).toBe(true);
      expect(entries.every((entry) => entry.ranking.rank > 0 && entry.ranking.score > 0)).toBe(true);
      expect(entries.every((entry) => entry.inside.sources >= 4)).toBe(true);
      expect(entries.every((entry) => entry.inside.claims >= 4)).toBe(true);
      expect(entries.every((entry) => entry.inside.graphNodes > 0 && entry.inside.graphEdges > 0)).toBe(true);
    }
  });

  it('renders category chips, search, what-is-inside counts, attach, and inspect actions', () => {
    const entries = buildCapsuleRepositoryEntries({
      userCapsules: [ownedCapsule()],
      starterEntries: CAPSULE_LIBRARY_ENTRIES.slice(0, 3),
    });
    const html = renderToStaticMarkup(
      <CapsuleLibrary entries={entries} onTryCapsule={() => undefined} />,
    );

    expect(html).toContain('data-testid="capsule-library"');
    expect(html).toContain('Your context library');
    expect(html).toContain('Search capsules');
    expect(html).toContain('Filter by capsule type');
    expect(html).toContain('Filter by capsule domain');
    expect(html).toContain('Filter by policy team');
    expect(html).toContain('Use in chat');
    expect(html).toContain('Inspect');
    expect(html).toContain('Your capsule');
    expect(html).toContain('Starter library');
    expect(html).toContain('Owned mediation workspace');
    expect(html).toContain('source refs');
    expect(html).toContain('claims');
    expect(html).toContain('recorded graph nodes');
    expect(html).not.toContain('capsule-repository-v2-scoreboard');
    expect(html).toContain('<details');
    expect(html).toContain(encodeURIComponent(CAPSULE_LIBRARY_ENTRIES[0].id));
  });

  it('filters the initial view by category without mixing other categories', () => {
    const legalEntries = filterCapsuleLibraryEntries(CAPSULE_LIBRARY_ENTRIES, 'legal');
    expect(legalEntries.length).toBeGreaterThan(0);

    const html = renderToStaticMarkup(
      <CapsuleLibrary entries={CAPSULE_LIBRARY_ENTRIES} initialCategory="legal" onTryCapsule={() => undefined} />,
    );

    expect(html).toContain(legalEntries[0].title);
    const nonLegal = CAPSULE_LIBRARY_ENTRIES.find((entry) => entry.category !== 'legal');
    expect(nonLegal).toBeTruthy();
    expect(html).not.toContain(nonLegal!.title);
  });

  it('filters the rendered grid by taxonomy facets from the resolver', () => {
    const facets = buildCapsuleLibraryFacetOptions(CAPSULE_LIBRARY_ENTRIES);
    const situation = facets.types.find((facet) => facet.tag === 'type:situation');
    const nonSituation = CAPSULE_LIBRARY_ENTRIES.find((entry) => !entry.taxonomy.types.some((facet) => facet.tag === situation?.tag));
    const situationEntry = CAPSULE_LIBRARY_ENTRIES.find((entry) => entry.taxonomy.types.some((facet) => facet.tag === situation?.tag));

    expect(situation).toBeTruthy();
    expect(situationEntry).toBeTruthy();
    expect(nonSituation).toBeTruthy();

    const html = renderToStaticMarkup(
      <CapsuleLibrary
        entries={CAPSULE_LIBRARY_ENTRIES}
        initialTypeFacet={situation!.tag}
        onTryCapsule={() => undefined}
      />,
    );

    expect(html).toContain(situation!.label);
    expect(html).toContain(situationEntry!.title);
    expect(html).not.toContain(nonSituation!.title);
  });

  it('shows a resettable quiet empty state when facet filters have no matches', () => {
    const html = renderToStaticMarkup(
      <CapsuleLibrary
        entries={CAPSULE_LIBRARY_ENTRIES}
        initialTypeFacet="type:not-real"
        onTryCapsule={() => undefined}
      />,
    );

    expect(html).toContain('No capsules match these filters.');
    expect(html).toContain('Reset filters');
  });

  it('builds repository entries from owned capsules and starter entries without duplicating seeded starters', () => {
    const starter = CAPSULE_LIBRARY_ENTRIES[0];
    const entries = buildCapsuleRepositoryEntries({
      userCapsules: [
        ownedCapsule({ capsuleId: 'cap-owned', label: 'Owned human rights brief' }),
        ownedCapsule({ capsuleId: starter.id, label: 'My seeded starter' }),
      ],
      starterEntries: [starter, CAPSULE_LIBRARY_ENTRIES[1]],
    });

    expect(entries.map((entry) => entry.id)).toEqual(['cap-owned', starter.id, CAPSULE_LIBRARY_ENTRIES[1].id]);
    expect(entries.find((entry) => entry.id === starter.id)?.origin).toBe('user');
    expect(entries.find((entry) => entry.id === CAPSULE_LIBRARY_ENTRIES[1].id)?.origin).toBe('starter');
  });

  it('filters the repository by category and searches title, ontology, and contents', () => {
    const owned = capsuleRepositoryEntryFromCapsule(ownedCapsule());
    const entries = [owned, ...CAPSULE_LIBRARY_ENTRIES.slice(0, 4)];

    expect(filterCapsuleRepositoryEntries(entries, 'mediation', '').map((entry) => entry.id)).toContain(owned.id);
    expect(filterCapsuleRepositoryEntries(entries, 'all', 'ceasefire ledger').map((entry) => entry.id)).toEqual([owned.id]);
    expect(filterCapsuleRepositoryEntries(entries, 'all', 'aco:claim').map((entry) => entry.id)).toContain(owned.id);
    expect(filterCapsuleRepositoryEntries(entries, 'legal', 'ceasefire ledger')).toEqual([]);
  });
});

function renderInventory() {
  runtime.lifecycle = true;
  const tree = runtime.render(() => CapsuleLibraryWithTry({ entries: CAPSULE_LIBRARY_ENTRIES.slice(0, 2) }));
  const children = Children.toArray(tree.props.children);
  const library = children.find((child) => isValidElement(child) && child.type === CapsuleLibrary) as ReactElement<Parameters<typeof CapsuleLibrary>[0]>;
  const alert = children.find((child) => isValidElement(child) && (child.props as { role?: string }).role === 'alert') as ReactElement<{ children: ReactNode }> | undefined;
  const retryButton = alert && Children.toArray(alert.props.children).find((child) => isValidElement(child) && child.type === 'button') as ReactElement<{ onClick: () => void }> | undefined;
  const loadMore = children.find((child) => isValidElement(child) && child.type === 'button' && (child.props as { 'data-testid'?: string })['data-testid'] === 'load-more-saved-capsules') as ReactElement<{ onClick: () => void }> | undefined;
  return { entries: library.props.entries!, retry: retryButton?.props.onClick, loadMore: loadMore?.props.onClick };
}

async function settleInventory() {
  runtime.flushEffects();
  for (let i = 0; i < 12; i++) await Promise.resolve();
}

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((done) => { resolve = done; });
  return { promise, resolve };
}

function ownedCapsule(overrides: Record<string, unknown> = {}) {
  return sanitizeCapsule({
    capsuleId: 'cap-owned-mediation',
    ownerUid: 'user-1',
    label: 'Owned mediation workspace',
    summary: 'Ceasefire ledger with source receipts and negotiation claims.',
    scope: 'situation',
    coreRefs: {
      userCoreId: 'user-core-1',
      situationCoreId: 'situation-core-1',
      sourceCoreIds: ['source-a', 'source-b'],
      documentCoreIds: ['doc-a'],
      toolCoreIds: ['tool-ach'],
      outputCoreIds: ['output-brief'],
    },
    graphStats: { nodeCount: 12, edgeCount: 19, entityTypeCounts: { Actor: 4, Claim: 8 }, updatedAt: '2026-06-18T00:00:00.000Z' },
    claimLedger: [
      { claimId: 'claim-1', text: 'Ceasefire monitors require neutral access.', sourceRefIds: ['source-a'] },
      { claimId: 'claim-2', text: 'Negotiators flagged a verification gap.', sourceRefIds: ['source-b'] },
    ],
    community: { tags: ['mediation', 'aco:claim', 'ceasefire-ledger'] },
    trust: { level: 'ready', score: 88, label: 'Ready', summary: 'Ready for Ask PRAXIS.', blockers: [], recommendations: [], checkedAt: '2026-06-18T00:00:00.000Z' },
    ...overrides,
  });
}
