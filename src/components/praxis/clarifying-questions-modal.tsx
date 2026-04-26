'use client';

/**
 * <ClarifyingQuestionsModal /> — popup the page renders when an AI route
 * returns `{ status: 'clarification-needed', clarification: {...} }`.
 *
 * Mounts inline (the calling tool page owns when to render). The user
 * answers, hits Submit, and the modal calls `onResume(answers)` so the
 * page can re-POST to the resumeRoute with the answers folded into the
 * original payload.
 */

import { useMemo, useState } from 'react';
import { MessageCircleQuestion, X, Send, Loader2 } from 'lucide-react';
import type {
  ClarificationRequest,
  ClarifyingAnswer,
  ClarifyingQuestion,
} from '@/lib/agents/clarifying-questions';
import { cn } from '@/lib/utils/cn';

const TOPIC_TONE: Record<string, string> = {
  scope: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sources: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  audience: 'bg-amber-50 text-amber-700 border-amber-200',
  'red-line': 'bg-rose-50 text-rose-700 border-rose-200',
  tradeoff: 'bg-violet-50 text-violet-700 border-violet-200',
  data: 'bg-sky-50 text-sky-700 border-sky-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

export interface ClarifyingQuestionsModalProps {
  request: ClarificationRequest;
  /** Called with the analyst's answers. Page should POST to resumeRoute. */
  onResume: (answers: ClarifyingAnswer[]) => Promise<void> | void;
  /** Called when the analyst dismisses without answering. */
  onCancel: () => void;
  /** When true, the modal shows a spinner and disables the Submit button. */
  busy?: boolean;
  /** Optional error to surface below the buttons (e.g. resume request failed). */
  errorMessage?: string;
  className?: string;
}

type AnswerValue = string | string[] | boolean | undefined;

export function ClarifyingQuestionsModal({
  request,
  onResume,
  onCancel,
  busy = false,
  errorMessage,
  className,
}: ClarifyingQuestionsModalProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  const allRequiredAnswered = useMemo(() => {
    for (const q of request.questions) {
      if (!q.required) continue;
      const v = answers[q.id];
      if (v === undefined || v === '') return false;
      if (Array.isArray(v) && v.length === 0) return false;
    }
    return true;
  }, [answers, request.questions]);

  const submit = async () => {
    if (!allRequiredAnswered || busy) return;
    const payload: ClarifyingAnswer[] = request.questions
      .filter((q) => answers[q.id] !== undefined && answers[q.id] !== '')
      .map((q) => ({ questionId: q.id, value: coerceAnswer(answers[q.id]) }));
    await onResume(payload);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clarifying-title"
      className={cn(
        'fixed inset-0 z-[120] flex items-center justify-center bg-navy-950/40 px-4 backdrop-blur-sm',
        className
      )}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start gap-3 border-b border-slate-200 bg-emerald-50/40 px-4 py-3">
          <MessageCircleQuestion className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div className="flex-1">
            <h2 id="clarifying-title" className="text-sm font-semibold text-navy-900">
              {request.toolId} needs your input to continue
            </h2>
            <p className="mt-0.5 text-xs text-navy-600">{request.reason}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={busy}
            className="shrink-0 rounded p-0.5 text-navy-500 hover:bg-slate-100"
            aria-label="Cancel and discard the in-flight tool run"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
          <ul className="flex flex-col gap-4">
            {request.questions.map((q) => (
              <li key={q.id}>
                <label htmlFor={`cq-${q.id}`} className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-navy-900">{q.prompt}</span>
                  <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide', TOPIC_TONE[q.topic ?? 'other'])}>
                    {q.topic}
                  </span>
                  {!q.required && <span className="text-[10px] uppercase tracking-wide text-navy-400">optional</span>}
                </label>
                {q.why ? (
                  <p className="mb-1.5 text-xs text-navy-500">{q.why}</p>
                ) : null}
                <QuestionInput question={q} value={answers[q.id]} onChange={(v) => setAnswers((s) => ({ ...s, [q.id]: v }))} />
              </li>
            ))}
          </ul>
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          {errorMessage ? (
            <span className="mr-auto text-xs text-rose-700">{errorMessage}</span>
          ) : null}
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!allRequiredAnswered || busy}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-white',
              !allRequiredAnswered || busy
                ? 'cursor-not-allowed bg-slate-400'
                : 'bg-emerald-600 hover:bg-emerald-700'
            )}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Resume
          </button>
        </footer>
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: ClarifyingQuestion;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
}) {
  switch (question.inputType) {
    case 'short-text':
      return (
        <input
          id={`cq-${question.id}`}
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-navy-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      );
    case 'long-text':
      return (
        <textarea
          id={`cq-${question.id}`}
          rows={3}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-navy-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      );
    case 'yes-no':
      return (
        <div className="flex gap-2">
          {[true, false].map((b) => (
            <button
              type="button"
              key={String(b)}
              onClick={() => onChange(b)}
              className={cn(
                'rounded-md border px-3 py-1 text-xs',
                value === b
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300 bg-white text-navy-700 hover:bg-slate-50'
              )}
            >
              {b ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      );
    case 'single-choice':
      return (
        <div className="flex flex-wrap gap-1.5">
          {(question.options ?? []).map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                'rounded-full border px-2 py-0.5 text-xs',
                value === opt.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300 bg-white text-navy-700 hover:bg-slate-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    case 'multi-choice': {
      const arr = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {(question.options ?? []).map((opt) => {
            const selected = arr.includes(opt.value);
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() =>
                  onChange(selected ? arr.filter((x) => x !== opt.value) : [...arr, opt.value])
                }
                className={cn(
                  'rounded-full border px-2 py-0.5 text-xs',
                  selected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300 bg-white text-navy-700 hover:bg-slate-50'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      );
    }
  }
}

function coerceAnswer(v: AnswerValue): string | string[] | boolean {
  if (Array.isArray(v)) return v;
  if (typeof v === 'boolean') return v;
  return String(v ?? '');
}
