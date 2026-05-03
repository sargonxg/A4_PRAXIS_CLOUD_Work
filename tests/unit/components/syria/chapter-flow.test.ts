import { describe, expect, it } from 'vitest';
import { SYRIA_CHAPTER_FLOW, SYRIA_CHAPTER_IDS, isSyriaChapterId } from '@/lib/syria/chapter-flow';

describe('Syria chapter flow', () => {
  it('defines the five analyst workspace chapters in order', () => {
    expect(SYRIA_CHAPTER_FLOW.map((chapter) => chapter.title)).toEqual([
      'Situation Frame',
      'Source Receipts',
      'Conflict Graph',
      'DIALECTICA Reasoning',
      'Decision Product',
    ]);
    expect(SYRIA_CHAPTER_FLOW.map((chapter) => chapter.number)).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps ids unique and anchorable', () => {
    expect(new Set(SYRIA_CHAPTER_IDS).size).toBe(5);
    for (const chapter of SYRIA_CHAPTER_FLOW) {
      expect(chapter.href).toBe(`#${chapter.id}`);
      expect(chapter.timeBudget).toMatch(/min$/);
      expect(chapter.question.length).toBeGreaterThan(20);
    }
  });

  it('validates hash-routable chapter ids', () => {
    expect(isSyriaChapterId('decision-product')).toBe(true);
    expect(isSyriaChapterId('north-star')).toBe(false);
    expect(isSyriaChapterId(null)).toBe(false);
  });
});
