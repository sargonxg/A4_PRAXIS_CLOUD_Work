'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { buildCapsuleWorkbenchViewModel, type CapsuleWorkbenchViewModel, type CapsuleWorkbenchCapsuleInput, type CapsuleWorkbenchReviewCardInput } from '@/lib/context/capsule-workbench-view-model';
import { StatePill, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleReviewQueueSection = memo(function CapsuleReviewQueueSection({ reviewQueue, capsuleId, onReviewed }: {
  reviewQueue: CapsuleWorkbenchViewModel['reviewQueue'];
  capsuleId?: string;
  onReviewed?: (capsule: CapsuleWorkbenchCapsuleInput) => void;
}) {
  const [snapshot, setSnapshot] = useState<{ capsule: CapsuleWorkbenchCapsuleInput; reviewCards: CapsuleWorkbenchReviewCardInput[] } | null>(null);
  const [loading, setLoading] = useState(Boolean(capsuleId));
  const [pending, setPending] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!capsuleId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}?includeReviewCards=true`, { signal });
      if (!response.ok) throw new Error('Could not load saved proposals. Sign in to your workspace and retry.');
      const data = await response.json();
      if (!data.capsule || !Array.isArray(data.reviewCards)) throw new Error('Saved proposals are unavailable. Retry loading.');
      setSnapshot(data);
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : 'Could not load proposals.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [capsuleId]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const current = snapshot?.capsule.capsuleId === capsuleId ? snapshot : null;
  const queue = current ? buildCapsuleWorkbenchViewModel(current).reviewQueue : reviewQueue;
  async function decide(reviewCardId: string, operation: 'approve' | 'reject') {
    if (!capsuleId || pending || !reason.trim() || !current) return;
    setPending(reviewCardId);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/graph/nodes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, reviewCardId, confirmationReason: reason.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 409 ? 'This proposal changed. Reload and inspect it before deciding.' : 'Decision could not be saved. Reload before retrying.');
      onReviewed?.(data.capsule);
      setSnapshot({ capsule: data.capsule, reviewCards: current.reviewCards.map((card) => (card.reviewCardId ?? card.id) === reviewCardId ? data.card : card) });
      setNotice(operation === 'approve' ? 'Proposal applied. A new capsule version was saved.' : 'Proposal rejected. No proposed facts were applied.');
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decision could not be saved.');
    } finally {
      setPending(null);
    }
  }
  return (
    <div id="capsule-review-queue">
      <WorkbenchSection title="Review Queue" icon={AlertTriangle}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatePill state="proposed" label="proposals stay review-gated" />
          <StatePill state="advisory" label={`${queue.filter((item) => item.allowedActions.length).length} pending decisions`} />
        </div>
        <p className="mb-3 text-xs text-slate-600">Inspect the proposed changes and source receipts before deciding. Approval records your review; it does not independently verify a claim.</p>
        {loading ? <p role="status">Loading saved proposals…</p> : null}
        {error ? <p role="alert" className="my-2 text-sm text-red-700">{error} <button type="button" disabled={loading || Boolean(pending)} onClick={() => void load()} className="underline">Reload proposals</button></p> : null}
        {notice ? <p role="status" className="my-2 text-sm text-emerald-800">{notice}</p> : null}
        {current ? <label className="mb-3 block text-sm font-medium text-slate-800">Reason for your next decision
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} disabled={Boolean(pending)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-slate-950 placeholder:text-slate-500" placeholder="What did you check? What caveats remain?" />
        </label> : null}
        {queue.length ? (
          <div className="grid gap-2" data-testid="capsule-unified-review-queue">
            {queue.map((item) => (
              <article key={item.id} id={`capsule-review-${item.id}`} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{item.state.replaceAll('_', ' ')}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.why}</p>
                  </div>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {item.target}
                  </span>
                </div>
                <div className="mt-2 grid gap-2 text-xs leading-5 text-slate-600 md:grid-cols-2">
                  <div className="rounded-md bg-slate-50 px-2 py-1.5">
                    <span className="font-semibold text-slate-900">Evidence: </span>
                    {item.evidenceLabels.length ? item.evidenceLabels.join(', ') : item.sourceType}
                  </div>
                  <div className="rounded-md bg-slate-50 px-2 py-1.5">
                    <span className="font-semibold text-slate-900">Impact: </span>
                    {item.impact}
                  </div>
                </div>
                {current?.reviewCards.find((card) => (card.reviewCardId ?? card.id) === item.id)?.proposedEnvelopePatch ? (
                  <details className="mt-2 text-xs text-slate-800"><summary className="cursor-pointer font-semibold">Inspect proposed changes</summary>
                    <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-50 p-3">{JSON.stringify(current.reviewCards.find((card) => (card.reviewCardId ?? card.id) === item.id)?.proposedEnvelopePatch, null, 2)}</pre>
                  </details>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.allowedActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={!current || loading || Boolean(pending) || !reason.trim() || Boolean(error)}
                      onClick={() => void decide(item.id, action)}
                      title="Inspect the proposal and enter a reason first."
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold capitalize text-slate-800 disabled:opacity-50"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            No review cards are open.
          </p>
        )}
      </WorkbenchSection>
    </div>
  );
});
