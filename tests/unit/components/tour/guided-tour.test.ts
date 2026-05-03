import { describe, expect, it } from 'vitest';
import { chapterIndexFor } from '@/lib/tour/chapter-flow';

const flow = [
  { id: 'one', title: 'One', estimateSeconds: 30, target: { selector: '#one' } },
  { id: 'two', title: 'Two', estimateSeconds: 30, target: { selector: '#two' } },
];

describe('guided tour helpers', () => {
  it('finds active chapter indexes and falls back to the first chapter', () => {
    expect(chapterIndexFor(flow, 'two')).toBe(1);
    expect(chapterIndexFor(flow, 'missing')).toBe(0);
  });
});
