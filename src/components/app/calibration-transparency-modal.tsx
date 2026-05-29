'use client';

/**
 * CalibrationTransparencyModal — "What's about to run".
 *
 * Renders the merged system-prompt block (analyst-profile +
 * situation-frame + domain-frame + path-frame + output constraints)
 * exactly as it will be prepended to the next Ask PRAXIS request.
 *
 * Open via window event:
 *   window.dispatchEvent(new CustomEvent('open-calibration-modal'))
 *
 * Toggle "Show before each Ask" is persisted in localStorage under
 * `praxis-calibration-transparency`. Other surfaces (FloatingPraxis,
 * AskWorkspacePage) can read this key to gate a pre-Ask interrupt.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Pencil, Play, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useSituationStore } from '@/stores/situation-store';
import { renderSystemPromptBlock } from '@/lib/context/system-prompt-block';
import { DEFAULT_USER_PREFERENCES } from '@/types/preferences';
import { cn } from '@/lib/utils/cn';

const STORAGE_KEY = 'praxis-calibration-transparency';

export function CalibrationTransparencyModal() {
  const { analystProfile } = useAuth();
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const [open, setOpen] = useState(false);
  const [showBeforeAsk, setShowBeforeAsk] = useState(() => (
    typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === 'on'
  ));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const opener = () => setOpen(true);
    window.addEventListener('open-calibration-modal', opener);
    return () => window.removeEventListener('open-calibration-modal', opener);
  }, []);

  function persistToggle(next: boolean) {
    setShowBeforeAsk(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
    }
  }

  const block = analystProfile
    ? renderSystemPromptBlock({
        profile: analystProfile,
        situation: activeSituation,
        retrievedChunks: [],
        preferences: DEFAULT_USER_PREFERENCES,
      })
    : null;

  async function handleCopy() {
    if (!block) return;
    try {
      await navigator.clipboard.writeText(block);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Calibration transparency"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close transparency modal backdrop"
          />
          <motion.div
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                  <span className="font-mono text-slate-500">audit</span>
                  <span aria-hidden className="h-px w-4 bg-slate-400" />
                  <span className="text-[#8A5A00]">what is about to run</span>
                </p>
                <h2 className="mt-1 font-serif text-xl text-slate-950">
                  Final merged system prompt
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Every Ask, draft, and tool prepends this block. Inspect, copy, or
                  edit your posture before running.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#0F172A] px-5 py-4">
              {block ? (
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-emerald-100">
                  {block}
                </pre>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-200/80">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  No analyst profile loaded — onboarding required to render the block.
                </div>
              )}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={showBeforeAsk}
                  onChange={(e) => persistToggle(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-400"
                />
                <span>Show before each Ask</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!block}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                >
                  <Copy className="h-3 w-3" />
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <a
                  href="/app/cores/user"
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                >
                  <Pencil className="h-3 w-3" />
                  Edit posture
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    window.dispatchEvent(new CustomEvent('open-praxis-chat'));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-diplomatic-blue px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
                >
                  <Play className="h-3 w-3" />
                  Run as-is
                </button>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
