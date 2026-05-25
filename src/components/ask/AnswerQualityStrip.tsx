'use client';

import { AlertTriangle, CheckCircle2, FileText, Search, Sparkles } from 'lucide-react';
import type { AskAnswerEnvelope, AskContextReadinessState, AskQueuedDeepRunStatus } from '@/lib/ai/ask-answer-envelope';
import { cn } from '@/lib/utils/cn';

export function AnswerQualityStrip({
  envelope,
  onAction,
  className,
}: {
  envelope?: AskAnswerEnvelope;
  onAction?: (prompt: string) => void;
  className?: string;
}) {
  const summary = envelope?.answerQualitySummary;
  if (!summary) return null;
  const agenticDepthRecommendation = envelope?.agenticDepthRecommendation;
  const contextDiagnostics = envelope?.contextDiagnostics;
  const contextRepairActions = envelope?.contextRepairActions ?? [];
  const healthy = summary.contextReadiness === 'ready' || summary.contextReadiness === 'thin';
  const Icon = healthy ? CheckCircle2 : AlertTriangle;

  return (
    <section
      className={cn(
        'mt-3 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700',
        className,
      )}
      data-testid="answer-quality-strip"
      aria-label="Answer Quality"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 font-bold text-slate-800">
          <Icon className={cn('h-3.5 w-3.5', healthy ? 'text-emerald-600' : 'text-amber-700')} />
          Answer Quality
        </p>
        <span className={cn(
          'rounded-md border px-2 py-1 font-mono text-[10px]',
          summary.confidencePosture === 'high'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : summary.confidencePosture === 'medium'
              ? 'border-sky-200 bg-sky-50 text-sky-900'
              : 'border-amber-200 bg-amber-50 text-amber-900',
        )}>
          {summary.confidencePosture} confidence
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <QualityPill label="Context" value={formatContextReadiness(summary.contextReadiness)} />
        <QualityPill label="Sources" value={`${summary.sourceCount} (${summary.sourceReceiptCount} receipts)`} />
        <QualityPill label="Weak" value={String(summary.weakClaimCount)} />
        <QualityPill label="Unsupported" value={String(summary.unsupportedClaimCount)} />
        <QualityPill label="Gaps" value={String(summary.sourceGapCount)} />
        <QualityPill label="Deep run" value={formatDeepRun(summary.queuedDeepRunStatus)} />
      </div>
      <p className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-700">
        Next: {summary.recommendedNextAction}
      </p>
      {contextDiagnostics ? (
        <details className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-1.5">
          <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            How PRAXIS used context
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <QualityPill label="Capsule" value={contextDiagnostics.activeCapsule} />
            <QualityPill label="Lanes" value={contextDiagnostics.sourceLanesUsed.map((lane) => lane.replace(/-/g, ' ')).join(', ') || 'none'} />
            <QualityPill label="Cognee" value={contextDiagnostics.cogneeStatus} />
            <QualityPill label="Memory" value={contextDiagnostics.memoryPosture.replace(/_/g, ' ')} />
            <QualityPill label="Graph" value={contextDiagnostics.graphProposalStatus.replace(/_/g, ' ')} />
            <QualityPill label="Output" value={contextDiagnostics.outputReadiness.replace(/_/g, ' ')} />
          </div>
        </details>
      ) : null}
      {agenticDepthRecommendation ? (
        <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-4 text-slate-600">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
          <span>{agenticDepthRecommendation.label}: {agenticDepthRecommendation.reason}</span>
        </p>
      ) : null}
      {contextRepairActions.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {contextRepairActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction?.(action.prompt)}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold hover:bg-white',
                action.priority === 'primary'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-white text-slate-700',
              )}
            >
              {iconForAction(action.id)}
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function QualityPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[10px] text-slate-600">
      {label}: {value}
    </span>
  );
}

function formatContextReadiness(value: AskContextReadinessState): string {
  if (value === 'missing_sources') return 'missing sources';
  if (value === 'stale_sources') return 'stale sources';
  if (value === 'needs_review') return 'needs review';
  return String(value).replace(/_/g, ' ');
}

function formatDeepRun(value: AskQueuedDeepRunStatus): string {
  if (value === 'not_needed') return 'not needed';
  return String(value).replace(/_/g, ' ');
}

function iconForAction(id: string) {
  if (id === 'check-sources' || id === 'create-source-gap') return <Search className="h-3 w-3" />;
  if (id === 'send-to-memo') return <FileText className="h-3 w-3" />;
  if (id === 'run-deeper-agent' || id === 'create-output-capsule') return <Sparkles className="h-3 w-3" />;
  return null;
}
