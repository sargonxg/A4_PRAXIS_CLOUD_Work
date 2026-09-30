'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { buildCapsuleWorkbenchViewModel, type CapsuleWorkbenchViewModel, type CapsuleWorkbenchCapsuleInput, type CapsuleWorkbenchReviewCardInput } from '@/lib/context/capsule-workbench-view-model';
import { StatePill, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

type ReviewSnapshot = {
  capsule: CapsuleWorkbenchCapsuleInput;
  reviewCards: CapsuleWorkbenchReviewCardInput[];
  reviewCardsNextCursor: string | null;
  reviewCardsHasMore: boolean;
};

export const CapsuleReviewQueueSection = memo(function CapsuleReviewQueueSection({ reviewQueue, capsuleId, onReviewed }: {
  reviewQueue: CapsuleWorkbenchViewModel['reviewQueue'];
  capsuleId?: string;
  onReviewed?: (capsule: CapsuleWorkbenchCapsuleInput) => void;
}) {
  const [snapshot, setSnapshot] = useState<ReviewSnapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(capsuleId));
  const [pending, setPending] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState('');
  const activeCapsuleId = useRef(capsuleId);
  activeCapsuleId.current = capsuleId;
  const requestController = useRef<AbortController | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!capsuleId) return;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    setLoading(true);
    setError('');
    setMoreError('');
    setLoadingMore(false);
    try {
      const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}?includeReviewCards=true&reviewLimit=50`, { signal: controller.signal });
      if (!response.ok) throw new Error('Could not load saved proposals. Sign in to your workspace and retry.');
      const data = await response.json();
      if (!data.capsule || data.capsule.capsuleId !== capsuleId || !Array.isArray(data.reviewCards)) throw new Error('Saved proposals are unavailable. Retry loading.');
      if (!controller.signal.aborted && activeCapsuleId.current === capsuleId) setSnapshot(reviewSnapshot(data));
    } catch (err) {
      if (!controller.signal.aborted && activeCapsuleId.current === capsuleId) setError(err instanceof Error ? err.message : 'Could not load proposals.');
    } finally {
      signal?.removeEventListener('abort', abort);
      if (!controller.signal.aborted && activeCapsuleId.current === capsuleId) setLoading(false);
    }
  }, [capsuleId]);
  useEffect(() => {
    const controller = new AbortController();
    setPending(null); setReason(''); setNotice('');
    void load(controller.signal);
    return () => { controller.abort(); requestController.current?.abort(); };
  }, [load]);
  const current = snapshot?.capsule.capsuleId === capsuleId ? snapshot : null;
  const queue = current ? buildCapsuleWorkbenchViewModel(current).reviewQueue : reviewQueue;
  async function loadMore() {
    if (!capsuleId || !current?.reviewCardsNextCursor || !current.reviewCardsHasMore || loadingMore || loading || pending) return;
    const controller = requestController.current;
    if (!controller || controller.signal.aborted) return;
    setLoadingMore(true); setMoreError('');
    try {
      const query = new URLSearchParams({ includeReviewCards: 'true', reviewLimit: '50', reviewCursor: current.reviewCardsNextCursor });
      const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}?${query}`, { signal: controller.signal });
      if (!response.ok) throw new Error('Could not load more proposals. Your loaded proposals remain available; retry below.');
      const data = await response.json();
      if (!data.capsule || data.capsule.capsuleId !== capsuleId || !Array.isArray(data.reviewCards)) throw new Error('Could not load more proposals. Please retry.');
      if (!controller.signal.aborted && activeCapsuleId.current === capsuleId) setSnapshot((previous) => {
        if (previous?.capsule.capsuleId !== capsuleId) return previous;
        const next = reviewSnapshot(data);
        const seen = new Set(previous.reviewCards.map((card) => card.reviewCardId ?? card.id));
        return { ...next, reviewCards: [...previous.reviewCards, ...next.reviewCards.filter((card) => { const id = card.reviewCardId ?? card.id; if (!id || seen.has(id)) return false; seen.add(id); return true; })] };
      });
    } catch (err) {
      if (!controller.signal.aborted && activeCapsuleId.current === capsuleId) setMoreError(err instanceof Error ? err.message : 'Could not load more proposals.');
    } finally {
      if (!controller.signal.aborted && activeCapsuleId.current === capsuleId) setLoadingMore(false);
    }
  }
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
      if (activeCapsuleId.current !== capsuleId) return;
      onReviewed?.(data.capsule);
      setSnapshot((previous) => previous?.capsule.capsuleId === capsuleId ? { ...previous, capsule: data.capsule, reviewCards: previous.reviewCards.map((card) => (card.reviewCardId ?? card.id) === reviewCardId ? data.card : card) } : previous);
      setNotice(operation === 'approve' ? 'Proposal applied. A new capsule version was saved.' : 'Proposal rejected. No proposed facts were applied.');
      setReason('');
    } catch (err) {
      if (activeCapsuleId.current === capsuleId) setError(err instanceof Error ? err.message : 'Decision could not be saved.');
    } finally {
      if (activeCapsuleId.current === capsuleId) setPending(null);
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
                      disabled={!current || loading || loadingMore || Boolean(pending) || !reason.trim() || Boolean(error)}
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
        {moreError ? <p role="alert" className="mt-3 text-sm text-red-700">{moreError}</p> : null}
        {current?.reviewCardsHasMore && current.reviewCardsNextCursor ? <button type="button" onClick={loadMore} disabled={loadingMore || loading || Boolean(pending)} className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">{loadingMore ? 'Loading more proposals…' : 'Load more proposals'}</button> : null}
      </WorkbenchSection>
    </div>
  );
});

function reviewSnapshot(data: ReviewSnapshot): ReviewSnapshot {
  const cursor = typeof data.reviewCardsNextCursor === 'string' && data.reviewCardsNextCursor ? data.reviewCardsNextCursor : null;
  return { capsule: data.capsule, reviewCards: data.reviewCards, reviewCardsNextCursor: cursor, reviewCardsHasMore: Boolean(cursor && data.reviewCardsHasMore === true) };
}
