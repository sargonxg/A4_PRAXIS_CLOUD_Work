'use client';

/**
 * SourceMentionMenu — lightweight @-trigger popover for the Tiptap
 * editor in MemoDesk. Watches the editor for a literal `@`, opens a
 * small floating list populated from /api/sources?q=..&situationId=..
 * scoped to the active capsule's Source Core, and inserts a mono
 * superscript `[n]` pinned to the chosen source receipt on select.
 *
 * Kept as a React sibling rather than a full Tiptap Extension so we
 * avoid pulling in @tiptap/extension-mention + tippy. The trade-off is
 * we lose ProseMirror suggestion plumbing — the menu re-queries on
 * each keystroke after the `@` and closes on Escape or selection
 * change.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface SourceHit {
  id: string;
  title?: string;
  publisher?: string;
  url?: string;
  receiptId?: string;
}

interface Anchor {
  top: number;
  left: number;
  query: string;
  startPos: number;
}

interface Props {
  editor: Editor | null;
  situationId?: string | null;
}

export function SourceMentionMenu({ editor, situationId }: Props) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [hits, setHits] = useState<SourceHit[]>([]);
  const [highlight, setHighlight] = useState(0);

  // Track @-trigger state by inspecting the editor selection on each update.
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      const { from, empty } = editor.state.selection;
      if (!empty) {
        setAnchor(null);
        return;
      }
      const text = editor.state.doc.textBetween(Math.max(0, from - 64), from, '\n', ' ');
      const match = /@([\w-]{0,40})$/.exec(text);
      if (!match) {
        setAnchor(null);
        return;
      }
      const startPos = from - match[0].length;
      const coords = editor.view.coordsAtPos(startPos);
      setAnchor({ top: coords.bottom + 4, left: coords.left, query: match[1], startPos });
    };
    editor.on('selectionUpdate', handler);
    editor.on('update', handler);
    return () => {
      editor.off('selectionUpdate', handler);
      editor.off('update', handler);
    };
  }, [editor]);

  // Fetch sources whenever the query changes.
  useEffect(() => {
    if (!anchor) return;
    const params = new URLSearchParams();
    if (situationId) params.set('situationId', situationId);
    if (anchor.query) params.set('q', anchor.query);
    let cancelled = false;
    fetch(`/api/sources?${params.toString()}`, { credentials: 'include' })
      .then(async (res) => (res.ok ? (await res.json()) as { sources: unknown[] } : { sources: [] }))
      .then((body) => {
        if (cancelled) return;
        const normalised = (Array.isArray(body.sources) ? body.sources : [])
          .map((raw) => normaliseSource(raw))
          .filter((s): s is SourceHit => Boolean(s))
          .filter((s) => !anchor.query || (s.title ?? s.id).toLowerCase().includes(anchor.query.toLowerCase()))
          .slice(0, 8);
        setHits(normalised);
        setHighlight(0);
      })
      .catch(() => {
        if (!cancelled) setHits([]);
      });
    return () => {
      cancelled = true;
    };
  }, [anchor, situationId]);

  const insertCounter = useMemo(() => Math.max(1, hits.length), [hits]);

  const insert = useCallback((hit: SourceHit) => {
    if (!editor || !anchor) return;
    const endPos = editor.state.selection.from;
    // Replace the `@query` slice with a superscript citation marker.
    editor
      .chain()
      .focus()
      .deleteRange({ from: anchor.startPos, to: endPos })
      .insertContent(
        `<sup data-source-receipt-id="${escapeAttr(hit.receiptId ?? hit.id)}" class="praxis-source-mention">[${insertCounter}]</sup>`,
      )
      .run();
    setAnchor(null);
  }, [anchor, editor, insertCounter]);

  // Keyboard navigation while the menu is open.
  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAnchor(null);
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        setHighlight((h) => Math.min(hits.length - 1, h + 1));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setHighlight((h) => Math.max(0, h - 1));
        e.preventDefault();
      } else if (e.key === 'Enter' && hits[highlight]) {
        e.preventDefault();
        insert(hits[highlight]);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [anchor, hits, highlight, insert]);

  if (!anchor || hits.length === 0) return null;

  return (
    <div
      role="listbox"
      style={{ position: 'fixed', top: anchor.top, left: anchor.left, zIndex: 50 }}
      className="w-72 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
    >
      {hits.map((hit, i) => (
        <button
          key={hit.id}
          type="button"
          role="option"
          aria-selected={i === highlight}
          onMouseDown={(e) => {
            e.preventDefault();
            insert(hit);
          }}
          className={
            'block w-full px-3 py-1.5 text-left text-xs ' +
            (i === highlight ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-slate-50')
          }
        >
          <span className="block truncate font-semibold">{hit.title ?? hit.id}</span>
          {hit.publisher ? <span className="block truncate font-mono text-[10px] text-slate-500">{hit.publisher}</span> : null}
        </button>
      ))}
    </div>
  );
}

function normaliseSource(raw: unknown): SourceHit | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id =
    typeof record.id === 'string' ? record.id :
    typeof record.receiptId === 'string' ? record.receiptId :
    typeof record.url === 'string' ? record.url :
    null;
  if (!id) return null;
  return {
    id,
    title: typeof record.title === 'string' ? record.title : typeof record.name === 'string' ? record.name : undefined,
    publisher: typeof record.publisher === 'string' ? record.publisher : typeof record.source === 'string' ? record.source : undefined,
    url: typeof record.url === 'string' ? record.url : undefined,
    receiptId: typeof record.receiptId === 'string' ? record.receiptId : undefined,
  };
}

function escapeAttr(value: string): string {
  return value.replace(/[&<>"']/g, (ch) =>
    ch === '&' ? '&amp;'
    : ch === '<' ? '&lt;'
    : ch === '>' ? '&gt;'
    : ch === '"' ? '&quot;'
    : '&#39;');
}
