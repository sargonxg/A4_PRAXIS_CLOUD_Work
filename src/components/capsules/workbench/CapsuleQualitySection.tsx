'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import type { AskOrchestrationStatusEvent } from '@/lib/ai/ask-orchestrator';
import type { CapsuleWorkbenchAgentRunInput, CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { cn } from '@/lib/utils/cn';
import { AskQueuedAgentRunPanel } from '@/components/ask/AskQueuedAgentRunPanel';
import { clampPercent, CompactList, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

const ACTIVE_QUALITY_REVIEW_STATUSES = ['queued', 'running', 'waiting_approval'];

export const CapsuleQualitySection = memo(function CapsuleQualitySection({
  quality,
  capsuleId,
  capsuleVersion,
  agentRuns = [],
}: {
  quality: CapsuleWorkbenchViewModel['quality'];
  capsuleId: string;
  capsuleVersion: number;
  agentRuns?: CapsuleWorkbenchAgentRunInput[];
}) {
  const [queuedRun, setQueuedRun] = useState<AskOrchestrationStatusEvent | null>(null);
  const [reviewCreating, setReviewCreating] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const activeQualityReviewRun = useMemo(() => agentRuns.find((run) =>
    run.policyAgentId === 'capsule-quality-review' &&
    ACTIVE_QUALITY_REVIEW_STATUSES.includes(run.status)
  ) ?? null, [agentRuns]);
  const localQueuedRunActive = Boolean(
    queuedRun?.runId &&
    (queuedRun.status === 'queued' || queuedRun.status === 'pending' || queuedRun.status === 'active' || queuedRun.status === 'warn'),
  );
  const reviewButtonDisabled = reviewCreating ||
    Boolean(activeQualityReviewRun) ||
    localQueuedRunActive;

  const queueQualityReview = useCallback(async () => {
    if (reviewButtonDisabled) return;
    setReviewCreating(true);
    setReviewStatus('Queueing capsule quality review...');
    const outputHref = `/app/capsules?capsuleId=${encodeURIComponent(capsuleId)}#capsule-review-queue`;
    const selectedToolIds = ['context-resolve', 'capsule-evidence-pack', 'sourceability-reviewer', 'capsule-quality-review'];
    try {
      const response = await fetch('/api/agents/runs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          capsuleId,
          contextStackId: 'default',
          contextPackageId: `capsule:${capsuleId}:v${capsuleVersion}`,
          policyAgentId: 'capsule-quality-review',
          outputDestination: 'library',
          objective: 'Review the active ContextCapsule and file review-gated quality improvement proposals.',
          triggerType: 'manual',
          idempotencyKey: `capsule-quality-review:${capsuleId}:${Date.now()}`,
          maxStep: 8,
          maxSessionMinutes: 20,
          metadata: {
            policyAgentId: 'capsule-quality-review',
            policyAgentLabel: 'Capsule quality review',
            outputDestination: 'library',
            outputHref,
            selectedTools: selectedToolIds,
            source: 'capsule-quality-section',
          },
        }),
      });
      const run = await response.json().catch(() => ({})) as { runId?: string; outputHref?: string | null; error?: string; detail?: string };
      if (!response.ok || !run.runId) throw new Error(run.error ?? run.detail ?? 'Capsule quality review queue failed');
      const event: AskOrchestrationStatusEvent = {
        type: 'orchestrationStatus',
        id: 'worker',
        label: 'Capsule quality review',
        status: 'queued',
        detail: 'Capsule quality review queued review-gated improvement proposals.',
        runId: run.runId,
        outputHref: run.outputHref ?? outputHref,
        canOpen: true,
        canCancel: true,
        agentLabel: 'Capsule quality review',
        selectedToolIds,
        approvalGateCount: 0,
        outputTarget: 'library',
        groundingPosture: 'Capsule quality review runs through the AgentRun worker and review queue.',
        sourcePosture: 'Improvement proposals remain review-gated.',
      };
      setQueuedRun(event);
      setReviewStatus(`Capsule quality review queued as run ${run.runId.slice(0, 8)}.`);
      const dispatchResponse = await fetch(`/api/agents/runs/${encodeURIComponent(run.runId)}/dispatch`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attempt: 1 }),
      });
      if (!dispatchResponse.ok) {
        setQueuedRun({
          ...event,
          status: 'warn',
          detail: 'Capsule quality review is queued, but worker dispatch needs retry.',
          canRetry: true,
        });
        setReviewStatus('Run queued. Worker dispatch needs retry.');
      } else {
        setReviewStatus('Worker dispatched. Proposals will appear in the review queue.');
      }
    } catch (err) {
      setReviewStatus(err instanceof Error ? err.message : 'Capsule quality review could not be queued.');
    } finally {
      setReviewCreating(false);
    }
  }, [capsuleId, capsuleVersion, reviewButtonDisabled]);

  const handleRunTerminal = useCallback((run: { runId: string; status: 'succeeded' | 'failed'; outputHref?: string | null }) => {
    setQueuedRun((current) => current?.runId === run.runId
      ? {
          ...current,
          status: run.status === 'succeeded' ? 'complete' : 'failed',
          detail: run.status === 'succeeded'
            ? 'Capsule quality review finished. Review cards are ready in the queue.'
            : 'Capsule quality review failed before creating review cards.',
          outputHref: run.outputHref ?? current.outputHref,
          canCancel: false,
        }
      : current);
    setReviewStatus(run.status === 'succeeded'
      ? 'Review cards are ready in the review queue.'
      : 'Capsule quality review failed.');
  }, []);

  return (
    <WorkbenchSection title="Quality meter" icon={ShieldCheck}>
      <div data-testid="capsule-quality-meter" className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-lg font-semibold text-slate-950">
            {quality.score}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Live capsule quality</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{quality.diagnostics[0] ?? 'All tracked quality sections are currently clear.'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50/60 p-2.5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-950">Queue review-gated improvement cards</p>
            {reviewStatus ? <p className="mt-1 text-[11px] leading-4 text-emerald-800">{reviewStatus}</p> : null}
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-emerald-200 disabled:text-emerald-300"
            onClick={queueQualityReview}
            disabled={reviewButtonDisabled}
            data-testid="capsule-ai-quality-review-button"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI quality review
          </button>
        </div>
        <AskQueuedAgentRunPanel queuedRun={queuedRun} newestActive={false} onRunTerminal={handleRunTerminal} />
        <div className="grid gap-2">
          {quality.sections.map((section) => {
            const ratio = section.maxScore > 0 ? Math.round((section.score / section.maxScore) * 100) : 0;
            return (
              <div key={section.id} className="rounded-md border border-slate-100 bg-slate-50 p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-800">{section.label}</p>
                  <a
                    href={`#capsule-review-${section.fixTarget.reviewCardId ?? section.fixTarget.target}`}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-400"
                    data-builder-step={section.fixTarget.builderStep}
                    data-review-target={section.fixTarget.target}
                  >
                    Fix this
                  </a>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className={cn('h-full rounded-full', ratio >= 75 ? 'bg-emerald-500' : ratio >= 45 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${clampPercent(ratio)}%` }} />
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">{section.score}/{section.maxScore}</p>
                <CompactList items={section.diagnostics} empty="No issue in this section." />
              </div>
            );
          })}
        </div>
      </div>
    </WorkbenchSection>
  );
});
