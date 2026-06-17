'use client';

import { AlertTriangle, CheckCircle2, FileText, Search, Sparkles } from 'lucide-react';
import { buildSourceGapScoutObjective, computeEvidenceCoverage } from '@/lib/agent-runtime/sourceability-ledger';
import type { AskAnswerEnvelope, AskContextReadinessState, AskQueuedDeepRunStatus } from '@/lib/ai/ask-answer-envelope';
import { cn } from '@/lib/utils/cn';

export function AnswerQualityStrip({
  envelope,
  onAction,
  onQueueSourceGapScout,
  className,
}: {
  envelope?: AskAnswerEnvelope;
  onAction?: (prompt: string) => void;
  onQueueSourceGapScout?: (claims: string[]) => Promise<void> | void;
  className?: string;
}) {
  const summary = envelope?.answerQualitySummary;
  if (!summary) return null;
  const agenticDepthRecommendation = envelope?.agenticDepthRecommendation;
  const contextDiagnostics = envelope?.contextDiagnostics;
  const contextRepairActions = envelope?.contextRepairActions ?? [];
  const healthy = summary.contextReadiness === 'ready' || summary.contextReadiness === 'thin';
  const Icon = healthy ? CheckCircle2 : AlertTriangle;
  const sourceAudit = envelope?.sourceAudit;
  const supportedClaims = sourceAudit?.supportedClaimCount
    ?? (envelope?.claimLedger ?? []).filter((claim) => claim.status === 'supported').length;
  const weakClaims = summary.weakClaimCount ?? sourceAudit?.weakClaimCount ?? 0;
  const unsupportedClaims = summary.unsupportedClaimCount ?? sourceAudit?.unsupportedClaimCount ?? 0;
  const assumptionClaims = sourceAudit?.assumptionClaimCount ?? sourceAudit?.modelPriorClaimCount ?? 0;
  const sourceCount = summary.sourceCount ?? sourceAudit?.sourceCount ?? 0;
  const sourceReceiptCount = summary.sourceReceiptCount ?? sourceAudit?.sourceReceiptCount ?? 0;
  const sourceGapCount = summary.sourceGapCount ?? 0;
  const confidencePosture = summary.confidencePosture ?? 'low';
  const coverage = computeEvidenceCoverage(envelope?.sourceabilityVerdicts ?? []);
  const dateCheckCount = (envelope?.claimLedger ?? []).filter((claim) => claim.freshness !== 'current').length
    + (envelope?.sourceRefreshDocket?.staleSourceIds.length ?? 0);
  const coverageLabel = coverage.totalClaims
    ? `${coverage.coveragePercent}% supported`
    : 'No claims checked';
  const sourceGapPrompt = buildSourceGapScoutObjective(coverage.unsupportedClaimTexts);

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
          Sourceability
        </p>
        <span className={cn(
          'rounded-md border px-2 py-1 font-mono text-[10px]',
          confidencePosture === 'high'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : confidencePosture === 'medium'
              ? 'border-sky-200 bg-sky-50 text-sky-900'
              : 'border-amber-200 bg-amber-50 text-amber-900',
        )}>
          {confidencePosture} confidence
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <QualityPill label="Context" value={formatContextReadiness(summary.contextReadiness)} />
        <QualityPill label="Sources" value={`${sourceCount} (${sourceReceiptCount} receipts)`} />
        <QualityPill label="Supported claims" value={String(supportedClaims)} />
        <QualityPill label="Weak claims" value={String(weakClaims)} />
        <QualityPill label="Unsupported claims" value={String(unsupportedClaims)} />
        <QualityPill label="Assumptions" value={String(assumptionClaims)} />
        <QualityPill label="Date checks" value={String(dateCheckCount)} />
        <QualityPill label="Gaps" value={String(sourceGapCount)} />
        <QualityPill label="Deep run" value={formatDeepRun(summary.queuedDeepRunStatus)} />
      </div>
      <div className="mt-2 rounded-md border border-slate-200 bg-white p-2" data-testid="evidence-coverage-meter">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Evidence coverage</p>
            <p className="mt-0.5 font-semibold text-slate-800">
              {coverageLabel} · {coverage.unsupportedClaims} unsupported
            </p>
          </div>
          <button
            type="button"
            disabled={!coverage.unsupportedClaims}
            onClick={() => {
              if (coverage.unsupportedClaims && onQueueSourceGapScout) {
                void onQueueSourceGapScout(coverage.unsupportedClaimTexts);
              } else if (coverage.unsupportedClaims) {
                onAction?.(sourceGapPrompt);
              }
            }}
            className="inline-flex min-h-7 items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <Search className="h-3 w-3" />
            {coverage.unsupportedClaims ? 'Find sources for gaps' : 'No source gaps'}
          </button>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${coverage.coveragePercent}%` }} />
        </div>
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
