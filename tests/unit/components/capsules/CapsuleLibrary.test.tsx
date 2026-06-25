import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CapsuleLibrary } from '@/components/capsules/CapsuleLibrary';
import {
  CAPSULE_LIBRARY_CATEGORIES,
  CAPSULE_LIBRARY_ENTRIES,
  buildCapsuleRepositoryEntries,
  capsuleRepositoryEntryFromCapsule,
  filterCapsuleLibraryEntries,
  filterCapsuleRepositoryEntries,
} from '@/lib/capsules/library';
import { sanitizeCapsule } from '@/lib/context/capsule-service';

describe('CapsuleLibrary', () => {
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
      expect(entries.length, category.id).toBeLessThanOrEqual(3);
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
    expect(html).toContain('Capsule Repository');
    expect(html).toContain('Search capsules');
    expect(html).toContain('Attach');
    expect(html).toContain('Inspect');
    expect(html).toContain('Your capsule');
    expect(html).toContain('Starter library');
    expect(html).toContain('Owned mediation workspace');
    expect(html).toContain('Sources');
    expect(html).toContain('Claims');
    expect(html).toContain('Graph');
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
