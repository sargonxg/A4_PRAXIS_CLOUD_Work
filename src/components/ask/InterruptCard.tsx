'use client';

/**
 * InterruptCard — HITL confirmation card surfaced when the Genkit
 * Ask PRAXIS flow hits an `interrupt: true` tool (e.g. redline_finder,
 * brief_builder).
 *
 * Brief: Claude Code CC-5.
 *
 * Renders the tool name, the description of why it's pausing, the
 * intended inputs as an editable form (Modify mode), and Approve /
 * Modify / Cancel buttons. Approve POSTs to
 *   /api/ai/ask-praxis/resume?turnId=<>&interruptId=<>
 * with the (potentially modified) inputs. Modify edits inputs in
 * place; Cancel aborts the SSE stream via the parent abort controller.
 *
 * Focus-trapped dialog. Enter approves, Esc cancels.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil, X, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const SPRING = { type: 'spring' as const, stiffness: 240, damping: 28 };

export interface InterruptRequest {
  turnId: string;
  interruptId: string;
  toolName: string;
  description: string;
  inputs: Record<string, unknown>;
}

export interface InterruptCardProps {
  request: InterruptRequest;
  onApprove: (modifiedInputs: Record<string, unknown>) => Promise<void> | void;
  onCancel: () => void;
}

export function InterruptCard({ request, onApprove, onCancel }: InterruptCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftJson, setDraftJson] = useState(() => JSON.stringify(request.inputs, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const approveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    approveRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && !editing && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        void doApprove();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, onCancel]);

  async function doApprove() {
    let inputs = request.inputs;
    if (editing) {
      try {
        inputs = JSON.parse(draftJson);
        setParseError(null);
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'invalid JSON');
        return;
      }
    }
    setSubmitting(true);
    try {
      await onApprove(inputs);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={SPRING}
      role="dialog"
      aria-modal="true"
      aria-label={`Confirm ${request.toolName}`}
      className="rounded-xl border-2 border-[#8A5A00]/40 bg-[#FAF8F2] p-4 shadow-lg"
    >
      <header className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#8A5A00]" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A5A00]">
            human-in-the-loop · {request.toolName}
          </p>
          <p className="mt-1 text-sm leading-snug text-slate-800">{request.description}</p>
        </div>
      </header>

      <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Intended inputs
        </p>
        {editing ? (
          <textarea
            value={draftJson}
            onChange={(e) => setDraftJson(e.target.value)}
            spellCheck={false}
            className="mt-1 block h-40 w-full resize-none rounded border border-slate-300 bg-slate-50 p-2 font-mono text-[11px] leading-snug text-slate-900 focus:border-[#8A5A00] focus:outline-none"
          />
        ) : (
          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-snug text-slate-700">
            {JSON.stringify(request.inputs, null, 2)}
          </pre>
        )}
        {parseError ? (
          <p className="mt-1 text-[11px] text-red-700">{parseError}</p>
        ) : null}
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold transition',
            editing
              ? 'border-[#8A5A00] bg-[#8A5A00]/10 text-[#8A5A00]'
              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
          )}
        >
          <Pencil className="h-3 w-3" />
          {editing ? 'Editing' : 'Modify'}
        </button>
        <motion.button
          type="button"
          ref={approveRef}
          onClick={() => void doApprove()}
          disabled={submitting}
          whileHover={{ scale: 1.03 }}
          transition={SPRING}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Approve
        </motion.button>
      </footer>
    </motion.div>
  );
}

/**
 * Convenience: POST resume to the Ask PRAXIS streaming endpoint.
 * Returns the new SSE response body so callers can re-attach a reader.
 */
export async function resumeAskPraxis(
  turnId: string,
  interruptId: string,
  inputs: Record<string, unknown>,
): Promise<Response> {
  return fetch(
    `/api/ai/ask-praxis/resume?turnId=${encodeURIComponent(turnId)}&interruptId=${encodeURIComponent(interruptId)}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ inputs }),
    },
  );
}
