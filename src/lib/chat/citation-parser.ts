/**
 * Citation parser — Ask PRAXIS chat.
 *
 * Lane N (round 2) injected `[#1]` / `[argus]` / `[documents]` style citation
 * refs into the chat system prompt; the model emits them in its replies.
 * This module turns those inline markers into structured tokens the chat
 * UI can render as `<CitationChip />`s.
 *
 * Pure / no DOM. Tests live at `tests/services/citation-parser.test.ts`.
 */

export type ChatToken =
  | { kind: 'text'; value: string }
  | { kind: 'citation-index'; index: number; raw: string }
  | { kind: 'citation-layer'; layer: string; raw: string };

const RECOGNISED_LAYERS = new Set([
  'argus',
  'sources',
  'documents',
  'graph',
  'tool-output',
  'situation',
  'profile',
  'event',
  'timeline',
]);

// Matches:
//   [#3]                  -> citation-index, index=3
//   [argus]               -> citation-layer, layer=argus
//   [DOCUMENTS]           -> citation-layer, layer=documents (case-insensitive)
// Anything else inside [] (e.g., [actor:name], [example.com]) stays as text.
const PATTERN = /\[(#\d{1,3}|[A-Za-z][A-Za-z0-9-]{0,30})\]/g;

export function parseChatCitations(text: string): ChatToken[] {
  if (!text) return [];

  const tokens: ChatToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  // Reset state because regex is global.
  PATTERN.lastIndex = 0;

  while ((match = PATTERN.exec(text)) !== null) {
    const matchStart = match.index;
    const inner = match[1];
    const matchEnd = matchStart + match[0].length;

    if (inner.startsWith('#')) {
      const idx = parseInt(inner.slice(1), 10);
      if (Number.isFinite(idx) && idx > 0) {
        if (matchStart > lastIndex) {
          tokens.push({ kind: 'text', value: text.slice(lastIndex, matchStart) });
        }
        tokens.push({ kind: 'citation-index', index: idx, raw: match[0] });
        lastIndex = matchEnd;
        continue;
      }
    } else if (RECOGNISED_LAYERS.has(inner.toLowerCase())) {
      if (matchStart > lastIndex) {
        tokens.push({ kind: 'text', value: text.slice(lastIndex, matchStart) });
      }
      tokens.push({ kind: 'citation-layer', layer: inner.toLowerCase(), raw: match[0] });
      lastIndex = matchEnd;
      continue;
    }
    // Unrecognised — leave it as part of text.
  }

  if (lastIndex < text.length) {
    tokens.push({ kind: 'text', value: text.slice(lastIndex) });
  }

  return tokens;
}

/** Convenience: returns true if any citation tokens are in the text. */
export function hasCitations(text: string): boolean {
  return parseChatCitations(text).some(
    (t) => t.kind === 'citation-index' || t.kind === 'citation-layer'
  );
}

export const __test__ = {
  RECOGNISED_LAYERS: Array.from(RECOGNISED_LAYERS),
};
