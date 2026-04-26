import { describe, it, expect } from 'vitest';
import { parseChatCitations, hasCitations } from '@/lib/chat/citation-parser';

describe('parseChatCitations', () => {
  it('returns a single text token when no citations', () => {
    expect(parseChatCitations('hello world')).toEqual([{ kind: 'text', value: 'hello world' }]);
  });

  it('parses a numeric ref [#3]', () => {
    const tokens = parseChatCitations('OCHA reports a closure [#3] of the corridor.');
    expect(tokens).toEqual([
      { kind: 'text', value: 'OCHA reports a closure ' },
      { kind: 'citation-index', index: 3, raw: '[#3]' },
      { kind: 'text', value: ' of the corridor.' },
    ]);
  });

  it('parses a layer ref [argus]', () => {
    const tokens = parseChatCitations('Recent ARGUS alert [argus] confirms the trend.');
    expect(tokens).toEqual([
      { kind: 'text', value: 'Recent ARGUS alert ' },
      { kind: 'citation-layer', layer: 'argus', raw: '[argus]' },
      { kind: 'text', value: ' confirms the trend.' },
    ]);
  });

  it('parses multiple citations in one message', () => {
    const tokens = parseChatCitations('Two sources: [#1] and [#2]. Layer hints: [documents], [graph].');
    const indices = tokens.filter((t) => t.kind === 'citation-index').map((t) => (t as { index: number }).index);
    expect(indices).toEqual([1, 2]);
    const layers = tokens.filter((t) => t.kind === 'citation-layer').map((t) => (t as { layer: string }).layer);
    expect(layers).toEqual(['documents', 'graph']);
  });

  it('lowercases recognised layers', () => {
    const tokens = parseChatCitations('Cite the [DOCUMENTS] layer.');
    expect(tokens.some((t) => t.kind === 'citation-layer' && t.layer === 'documents')).toBe(true);
  });

  it('leaves unrecognised brackets as text', () => {
    const tokens = parseChatCitations('See [actor:karovia] and [example.com] and [#999].');
    // [#999] is recognised (within 1-3 digit cap); the others stay text.
    const texts = tokens.filter((t) => t.kind === 'text').map((t) => (t as { value: string }).value);
    expect(texts.join('')).toContain('[actor:karovia]');
    expect(texts.join('')).toContain('[example.com]');
    expect(tokens.some((t) => t.kind === 'citation-index' && (t as { index: number }).index === 999)).toBe(true);
  });

  it('rejects [#0] and other non-positive indices as text', () => {
    const tokens = parseChatCitations('See [#0].');
    expect(tokens).toEqual([{ kind: 'text', value: 'See [#0].' }]);
  });

  it('handles empty input safely', () => {
    expect(parseChatCitations('')).toEqual([]);
    expect(parseChatCitations(undefined as unknown as string)).toEqual([]);
  });

  it('hasCitations returns true on numeric refs', () => {
    expect(hasCitations('A [#1] cite.')).toBe(true);
  });

  it('hasCitations returns true on layer refs', () => {
    expect(hasCitations('See [argus].')).toBe(true);
  });

  it('hasCitations returns false for plain text or unrecognised brackets', () => {
    expect(hasCitations('plain text')).toBe(false);
    expect(hasCitations('[mars] and [#0]')).toBe(false);
  });
});
