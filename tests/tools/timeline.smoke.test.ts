import { describe, it, expect } from 'vitest';
import { aggregateEpisodesByDay } from '@/lib/firebase/episodes';
import type { Episode } from '@/types/episode';

const make = (id: string, date: string, deleted = false): Episode => ({
  id,
  situationId: 's',
  title: `e${id}`,
  description: `desc ${id}`,
  date,
  actors: [],
  importance: 3,
  createdAt: null,
  updatedAt: null,
  deletedAt: deleted ? new Date().toISOString() : null,
});

describe('aggregateEpisodesByDay', () => {
  it('groups by day and returns newest-first', () => {
    const eps: Episode[] = [
      make('a', '2026-04-10T10:00:00Z'),
      make('b', '2026-04-10T12:00:00Z'),
      make('c', '2026-04-11T08:00:00Z'),
      make('d', '2026-04-05T00:00:00Z'),
    ];
    const buckets = aggregateEpisodesByDay(eps);
    expect(buckets.map((b) => b.date)).toEqual(['2026-04-11', '2026-04-10', '2026-04-05']);
    expect(buckets[1].episodes).toHaveLength(2);
  });

  it('excludes soft-deleted episodes', () => {
    const eps = [make('a', '2026-04-10T10:00:00Z'), make('b', '2026-04-10T12:00:00Z', true)];
    const buckets = aggregateEpisodesByDay(eps);
    expect(buckets[0].episodes).toHaveLength(1);
    expect(buckets[0].episodes[0].id).toBe('a');
  });
});
