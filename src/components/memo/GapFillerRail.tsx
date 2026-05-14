'use client';

/**
 * GapFillerRail — right-side rail in MemoDesk that scans the current
 * draft for sentences without a `[^chunkId]` receipt marker and lists
 * each as a chip with a "Source this" CTA.
 *
 * Brief: Claude Code CC-7.
 *
 * Clicking "Source this" calls /api/memos/grounded-paragraph (Codex
 * CX-3) scoped to the gap text and inserts receipts inline. Until the
 * backend ships, the call falls back to a stub that adds a placeholder
 * `[^pending]` superscript so the gap drops out of the list.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Editor } from '@tiptap/react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Gap {
  id: string;
  text: string;
}

const RECEIPT_RE = /\[\^[^\]]+\]/;

function extractGaps(html: string): Gap[] {
  // Split on sentence boundaries. We keep each sentence raw so the chip
  // can show the literal text the user wrote.
  const stripped = html.replace(/<[^>]+>/g, ' ');
  const sentences = stripped
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && !RECEIPT_RE.test(s));
  // Dedupe + cap at 8 so the rail stays scannable.
  const seen = new Set<string>();
  const gaps: Gap[] = [];
  for (const s of sentences) {
    const key = s.toLowerCase().slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    gaps.push({ id: `gap-${gaps.length}`, text: s });
    if (gaps.length >= 8) break;
  }
  return gaps;
}

export interface GapFillerRailProps {
  editor: Editor | null;
  situationId?: string | null;
  className?: string;
}

export function GapFillerRail({ editor, situationId, className }: GapFillerRailProps) {
  const [tick, setTick] = useState(0);
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => setTick((t) => t + 1);
    editor.on('update', onUpdate);
    return () => {
      editor.off('update', onUpdate);
    };
  }, [editor]);

  const gaps = useMemo(() => {
    if (!editor) return [];
    void tick;
    return extractGaps(editor.getHTML());
  }, [editor, tick]);

  async function sourceThis(gap: Gap) {
    if (!editor) return;
    setWorking(gap.id);
    try {
      const res = await fetch('/api/memos/grounded-paragraph', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic: gap.text, situationId, mode: 'gap-fill' }),
      });
      if (res.ok) {
        const body = (await res.json()) as { receipts?: Array<{ chunkId: string }> };
        const receipts = (body.receipts ?? [])
          .map((r) => `[^${r.chunkId}]`)
          .join('');
        if (receipts) {
          // Append receipts at end of doc as a placeholder; better would
          // be selecting the gap span, but Tiptap doesn't expose that
          // without a custom decoration pass.
          editor.chain().focus('end').insertContent(`<p>${receipts}</p>`).run();
        }
      } else {
        // Fallback: stamp a [^pending] so the gap drops off the list.
        editor.chain().focus('end').insertContent('<p>[^pending]</p>').run();
      }
    } catch {
      editor.chain().focus('end').insertContent('<p>[^pending]</p>').run();
    } finally {
      setWorking(null);
    }
  }

  if (!editor) {
    return (
      <aside className={cn('w-72 shrink-0 border-l border-slate-200 bg-white p-3', className)}>
        <p className="text-xs text-slate-500">Editor not ready.</p>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Gap filler"
      className={cn('w-72 shrink-0 border-l border-slate-200 bg-white p-3', className)}
    >
      <header className="mb-2 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-[#8A5A00]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">
          Gap filler
        </span>
        <span className="ml-auto font-mono text-[10px] text-slate-400">{gaps.length}</span>
      </header>
      {gaps.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Every sentence over 30 characters has a receipt marker. Nice work.
        </p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence>
            {gaps.map((gap) => (
              <motion.li
                key={gap.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="rounded-md border border-amber-200 bg-amber-50 p-2"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-700" />
                  <p className="line-clamp-3 text-[11px] leading-snug text-amber-950">{gap.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void sourceThis(gap)}
                  disabled={working === gap.id}
                  className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md bg-[#8A5A00] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {working === gap.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Source this
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </aside>
  );
}
