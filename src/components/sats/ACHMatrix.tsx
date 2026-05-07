'use client';

import { CheckCircle2, CircleHelp, FileDown, MinusCircle, ShieldQuestion, XCircle, type LucideIcon } from 'lucide-react';
import { rankACH } from '@/lib/sats/ach-ranking';
import type { ACHMatrix, ACHScore, ACHScoreRating } from '@/types/sats';
import { cn } from '@/lib/utils/cn';

const RATING_LABELS: Record<ACHScoreRating, string> = {
  consistent: 'C',
  inconsistent: 'I',
  irrelevant: '-',
  unknown: '?',
};

const RATING_STYLES: Record<ACHScoreRating, string> = {
  consistent: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  inconsistent: 'border-red-200 bg-red-50 text-red-800',
  irrelevant: 'border-slate-200 bg-slate-50 text-slate-500',
  unknown: 'border-amber-200 bg-amber-50 text-amber-800',
};

const RATING_CYCLE: ACHScoreRating[] = ['unknown', 'consistent', 'inconsistent', 'irrelevant'];

interface ACHMatrixViewProps {
  matrix: ACHMatrix;
  onMatrixChange?: (matrix: ACHMatrix) => void;
  onSave?: () => void;
  onExportMarkdown?: () => void;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
}

export function ACHMatrixView({
  matrix,
  onMatrixChange,
  onSave,
  onExportMarkdown,
  saveState = 'idle',
}: ACHMatrixViewProps) {
  const ranking = rankACH(matrix);
  const editable = Boolean(onMatrixChange);

  function updateScore(score: ACHScore) {
    if (!onMatrixChange) return;
    const scores = matrix.scores.some((item) => item.hypothesisId === score.hypothesisId && item.evidenceId === score.evidenceId)
      ? matrix.scores.map((item) => (
        item.hypothesisId === score.hypothesisId && item.evidenceId === score.evidenceId ? score : item
      ))
      : [...matrix.scores, score];
    onMatrixChange({
      ...matrix,
      scores,
      ranking: rankACH({ ...matrix, scores }),
      updatedAt: new Date().toISOString(),
    });
  }

  function cycleScore(hypothesisId: string, evidenceId: string, current: ACHScoreRating) {
    const next = RATING_CYCLE[(RATING_CYCLE.indexOf(current) + 1) % RATING_CYCLE.length] ?? 'unknown';
    updateScore({ hypothesisId, evidenceId, rating: next });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-navy-950/5">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-navy-950">Hypothesis x evidence matrix</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Canonical ACH ranks hypotheses by least disconfirming evidence, not by the most supporting evidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              <Legend rating="consistent" label="Consistent" />
              <Legend rating="inconsistent" label="Inconsistent" />
              <Legend rating="irrelevant" label="Irrelevant" />
              <Legend rating="unknown" label="Unknown" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[780px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="w-[34%] border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Evidence
                </th>
                {matrix.hypotheses.map((hypothesis) => (
                  <th key={hypothesis.id} className="border-b border-l border-slate-200 px-3 py-3 align-top">
                    <p className="text-xs font-semibold text-navy-950">{hypothesis.text}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {hypothesis.proposedBy === 'subagent' ? 'suggested' : 'user'}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.evidence.map((evidence) => (
                <tr key={evidence.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 align-top">
                    <p className="text-sm font-medium leading-5 text-navy-950">{evidence.text}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {evidence.sourceKind} · weight {Math.round(evidence.weight * 100)} · diag {Math.round((evidence.diagnosticity ?? 0.5) * 100)}
                    </p>
                  </td>
                  {matrix.hypotheses.map((hypothesis) => {
                    const score = matrix.scores.find((item) => item.evidenceId === evidence.id && item.hypothesisId === hypothesis.id);
                    const rating = score?.rating ?? 'unknown';
                    return (
                      <td key={`${evidence.id}-${hypothesis.id}`} className="border-l border-slate-100 px-3 py-3 align-top">
                        <button
                          type="button"
                          disabled={!editable}
                          onClick={() => cycleScore(hypothesis.id, evidence.id, rating)}
                          className={cn(
                            'inline-flex h-9 w-9 items-center justify-center rounded-md border font-mono text-sm font-bold transition-transform',
                            editable ? 'cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold-400' : 'cursor-default',
                            RATING_STYLES[rating],
                          )}
                          title={editable ? 'Cycle ACH rating' : undefined}
                        >
                          {RATING_LABELS[rating]}
                        </button>
                        {score?.note ? <p className="mt-2 text-xs leading-5 text-slate-600">{score.note}</p> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
          <div className="flex items-center gap-2">
            <ShieldQuestion className="h-4 w-4 text-gold-600" />
            <h2 className="text-sm font-semibold text-navy-950">ACH ranking</h2>
          </div>
          <div className="mt-3 space-y-2">
            {ranking.map((item) => {
              const hypothesis = matrix.hypotheses.find((candidate) => candidate.id === item.hypothesisId);
              return (
                <div key={item.hypothesisId} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-gold-700">#{item.rank}</span>
                    <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      {item.conclusion.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-5 text-navy-950">{hypothesis?.text}</p>
                  <p className="mt-2 text-xs text-slate-600">
                    {item.inconsistencyCount} inconsistent cells · weighted {item.weightedInconsistency}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-gold-200 bg-gold-50 p-4">
          <h2 className="text-sm font-semibold text-gold-950">Heuer-Pherson SAT</h2>
          <p className="mt-2 text-sm leading-6 text-gold-900">
            ACH follows Richards J. Heuer Jr.&apos;s disconfirmation logic: look for evidence that is inconsistent with each hypothesis, then prefer the explanation with the fewest serious inconsistencies.
          </p>
          <div className="mt-3 grid gap-2">
            <Action
              label={saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save ACH'}
              icon={CheckCircle2}
              onClick={onSave}
              disabled={!onSave || saveState === 'saving'}
            />
            <Action label="Export Markdown" icon={FileDown} onClick={onExportMarkdown} disabled={!onExportMarkdown} />
            <Action label="Append annex" icon={MinusCircle} disabled />
            <Action label="Promote via review queue" icon={CircleHelp} disabled />
          </div>
        </section>
      </aside>
    </div>
  );
}

function Legend({ rating, label }: { rating: ACHScoreRating; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded border font-mono text-[10px]', RATING_STYLES[rating])}>
        {RATING_LABELS[rating]}
      </span>
      {label}
    </span>
  );
}

function Action({
  label,
  icon: Icon,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: LucideIcon | typeof XCircle;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-gold-200 bg-white px-3 text-xs font-semibold text-gold-950 transition-colors hover:bg-gold-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
