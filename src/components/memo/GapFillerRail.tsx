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
import { AlertCircle, Languages, Loader2, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type {
  MemoClaimCheckResult,
  MemoLanguageCheckResult,
  MemoLanguageViolation,
} from '@/lib/memo/memo-checks';

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
  checkResults?: Array<MemoClaimCheckResult | MemoLanguageCheckResult>;
  checkingAction?: 'claim-check' | 'language-check' | null;
  onCheckClaim?: () => void;
  onLanguageCheck?: () => void;
  className?: string;
}

export function GapFillerRail({
  editor,
  situationId,
  checkResults = [],
  checkingAction = null,
  onCheckClaim,
  onLanguageCheck,
  className,
}: GapFillerRailProps) {
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
        <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-praxis-emerald-700)]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">
          Memo checks
        </span>
        <span className="ml-auto font-mono text-[10px] text-slate-400">{gaps.length}</span>
      </header>
      <div className="mb-3 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onCheckClaim}
          disabled={!onCheckClaim || Boolean(checkingAction)}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[10px] font-bold uppercase text-slate-700 hover:border-[color:var(--color-praxis-emerald-500)]/50 hover:text-[color:var(--color-praxis-emerald-700)] disabled:opacity-50"
        >
          {checkingAction === 'claim-check' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
          Claim
        </button>
        <button
          type="button"
          onClick={onLanguageCheck}
          disabled={!onLanguageCheck || Boolean(checkingAction)}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[10px] font-bold uppercase text-slate-700 hover:border-[color:var(--color-praxis-emerald-500)]/50 hover:text-[color:var(--color-praxis-emerald-700)] disabled:opacity-50"
        >
          {checkingAction === 'language-check' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
          Language
        </button>
      </div>
      <MemoCheckResults results={checkResults} />
      <div className="mb-2 mt-3 flex items-center gap-2">
        <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">
          Unsourced gaps
        </span>
      </div>
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
                  className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md bg-[color:var(--color-praxis-emerald-700)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:brightness-110 disabled:opacity-60"
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

function MemoCheckResults({ results }: { results: Array<MemoClaimCheckResult | MemoLanguageCheckResult> }) {
  if (!results.length) {
    return (
      <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-2 text-[11px] leading-4 text-slate-500">
        Select memo text, then run a claim or language check.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {results.slice(0, 4).map((result) => (
        result.kind === 'claim-check'
          ? <ClaimCheckCard key={`${result.kind}-${result.provenance.generatedAt}`} result={result} />
          : <LanguageCheckCard key={`${result.kind}-${result.provenance.generatedAt}`} result={result} />
      ))}
    </div>
  );
}

function ClaimCheckCard({ result }: { result: MemoClaimCheckResult }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          <ReceiptText className="h-3 w-3" />
          Claim check
        </span>
        <span className={cn(
          'rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase',
          result.verdict === 'supported'
            ? 'border-[color:var(--color-praxis-emerald-500)]/50 bg-[#0F172A] text-[color:var(--color-praxis-emerald-100)]'
            : result.verdict === 'contradicted'
              ? 'border-red-200 bg-red-50 text-red-800'
              : result.verdict === 'weak'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-slate-50 text-slate-600',
        )}>
          {result.verdict}
        </span>
      </div>
      <p className="mt-1 line-clamp-3 text-[11px] leading-4 text-slate-700">{result.claim}</p>
      <p className="mt-1 text-[11px] leading-4 text-slate-500">{result.rationale}</p>
      {result.receipt ? (
        <div className="mt-2 rounded border-l-[3px] border-l-[color:var(--color-praxis-emerald-500)] bg-slate-50 px-2 py-1.5">
          <p className="truncate text-[10px] font-semibold text-slate-800">{result.receipt.title}</p>
          {result.receipt.quote ? <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-600">{result.receipt.quote}</p> : null}
          <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">{result.receipt.sourceId}</p>
        </div>
      ) : null}
    </article>
  );
}

function LanguageCheckCard({ result }: { result: MemoLanguageCheckResult }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          <Languages className="h-3 w-3" />
          Language check
        </span>
        <span className={cn(
          'rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase',
          result.violations.length ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
        )}>
          {result.violations.length ? `${result.violations.length} flagged` : 'clear'}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-slate-600">{result.summary}</p>
      {result.violations.length ? (
        <ul className="mt-2 space-y-1">
          {result.violations.slice(0, 4).map((violation) => (
            <LanguageViolationRow key={violation.id} violation={violation} />
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function LanguageViolationRow({ violation }: { violation: MemoLanguageViolation }) {
  return (
    <li className="rounded border border-amber-100 bg-amber-50 px-2 py-1">
      <p className="truncate text-[11px] font-semibold text-amber-950">{violation.phrase}</p>
      <p className="mt-0.5 text-[10px] leading-4 text-amber-800">{violation.suggestion}</p>
    </li>
  );
}
