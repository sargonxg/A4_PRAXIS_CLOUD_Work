import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CapsuleLibrary } from '@/components/capsules/CapsuleLibrary';
import {
  CAPSULE_LIBRARY_CATEGORIES,
  CAPSULE_LIBRARY_ENTRIES,
  filterCapsuleLibraryEntries,
} from '@/lib/capsules/library';

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

  it('renders category chips, what-is-inside counts, try, and inspect actions', () => {
    const entries = CAPSULE_LIBRARY_ENTRIES.slice(0, 3);
    const html = renderToStaticMarkup(
      <CapsuleLibrary entries={entries} onTryCapsule={() => undefined} />,
    );

    expect(html).toContain('data-testid="capsule-library"');
    expect(html).toContain('Capsule Library');
    expect(html).toContain('Try this capsule');
    expect(html).toContain('Inspect');
    expect(html).toContain('Sources');
    expect(html).toContain('Claims');
    expect(html).toContain('Graph');
    expect(html).toContain(encodeURIComponent(entries[0].id));
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
});
