import { describe, it, expect } from 'vitest';
import { __test__, AnalystNoteSchema, type AnalystNote } from '@/lib/knowledge/analyst-notes';

const { formatAnalystNotesBlock } = __test__;

describe('AnalystNoteSchema', () => {
  it('accepts a minimal valid note', () => {
    const parsed = AnalystNoteSchema.safeParse({ text: 'AFN field commander Yusuf is the decision-maker for Kessara.' });
    expect(parsed.success).toBe(true);
  });

  it('defaults tags to [] and confidence to medium', () => {
    const parsed = AnalystNoteSchema.parse({ text: 'A factual note worth keeping.' });
    expect(parsed.tags).toEqual([]);
    expect(parsed.confidence).toBe('medium');
  });

  it('rejects empty text', () => {
    expect(AnalystNoteSchema.safeParse({ text: '' }).success).toBe(false);
  });

  it('caps tags at 12 items', () => {
    const tooMany = Array(13).fill('tag').map((t, i) => `${t}${i}`);
    expect(AnalystNoteSchema.safeParse({ text: 'long enough text', tags: tooMany }).success).toBe(false);
  });

  it('rejects unsupported confidence', () => {
    expect(AnalystNoteSchema.safeParse({ text: 'long enough text', confidence: 'kinda' as never }).success).toBe(false);
  });
});

describe('formatAnalystNotesBlock', () => {
  it('renders an "intelligence gap" hint when no notes', () => {
    const block = formatAnalystNotesBlock([]);
    expect(block).toMatch(/## ANALYST NOTES/);
    expect(block).toMatch(/has not added any free-text notes/);
    expect(block).toMatch(/clarifying-questions framework/);
  });

  it('renders one bullet per note with confidence + tags', () => {
    const notes: AnalystNote[] = [
      {
        id: 'n1',
        text: 'Yusuf is decision-maker for Kessara.',
        tags: ['kessara', 'leadership'],
        confidence: 'high',
      },
      {
        id: 'n2',
        text: 'Donor cluster meets Tuesdays at 14:00.',
        tags: [],
        confidence: 'medium',
      },
    ];
    const block = formatAnalystNotesBlock(notes);
    expect(block).toMatch(/HIGH-PRIORITY CONTEXT/);
    expect(block).toMatch(/- \(confidence: high\) \[kessara, leadership\] Yusuf is decision-maker/);
    expect(block).toMatch(/- \(confidence: medium\) Donor cluster meets/);
  });

  it('omits the tag bracket when no tags are present', () => {
    const block = formatAnalystNotesBlock([
      { id: 'n3', text: 'A bare fact.', tags: [], confidence: 'low' },
    ]);
    expect(block).not.toMatch(/\[\]/);
    expect(block).toMatch(/- \(confidence: low\) A bare fact\./);
  });

  it('instructs the model not to contradict notes silently', () => {
    const block = formatAnalystNotesBlock([{ id: 'n4', text: 'A note.', tags: [], confidence: 'medium' }]);
    expect(block).toMatch(/Do NOT contradict an analyst note silently/);
  });
});
