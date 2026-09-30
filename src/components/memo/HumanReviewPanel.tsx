'use client';

import { useEffect, useState } from 'react';
import { isCurrentMemoHumanApproval, normalizeMemoHumanApproval, type MemoReviewUse } from '@/lib/memo/human-review';
import { memoOutputBodyHash } from '@/lib/memo/output-review';

export function HumanReviewPanel({ memoId, currentVersionId, body, savedBody, humanApproval, dirty = false, disabled = false, onApproved, onReload }: {
  memoId: string | null;
  currentVersionId?: string | null;
  body: string;
  savedBody?: string | null;
  humanApproval: unknown;
  dirty?: boolean;
  disabled?: boolean;
  onApproved: (payload: unknown) => void;
  onReload?: () => void;
}) {
  const [digest, setDigest] = useState<{ body: string | null; hash: string | null }>({ body: null, hash: null });
  const [intendedUse, setIntendedUse] = useState<MemoReviewUse>('internal-analysis');
  const [limitations, setLimitations] = useState('');
  const [sourcesReviewed, setSourcesReviewed] = useState(false);
  const [assumptionsReviewed, setAssumptionsReviewed] = useState(false);
  const [limitationsReviewed, setLimitationsReviewed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    setSourcesReviewed(false); setAssumptionsReviewed(false); setLimitationsReviewed(false); setError('');
    setDigest({ body: savedBody ?? null, hash: null });
    if (typeof savedBody === 'string') void memoOutputBodyHash(savedBody).then((hash) => {
      if (!cancelled) setDigest({ body: savedBody, hash });
    }).catch(() => { if (!cancelled) setError('The saved version could not be checked. Reload it before reviewing.'); });
    return () => { cancelled = true; };
  }, [memoId, currentVersionId, savedBody]);
  const unchanged = Boolean(memoId && currentVersionId && typeof savedBody === 'string' && body === savedBody && !dirty);
  const hash = digest.body === savedBody ? digest.hash : null;
  const approval = normalizeMemoHumanApproval(humanApproval);
  const approved = unchanged && isCurrentMemoHumanApproval(approval, { memoId, versionId: currentVersionId, bodyHash: hash });
  const canApprove = unchanged && Boolean(hash) && sourcesReviewed && assumptionsReviewed && limitationsReviewed && !pending && !disabled;
  const useLabel = approval?.intendedUse === 'publication' ? 'publication' : approval?.intendedUse === 'external-sharing' ? 'external sharing' : 'internal analysis';
  async function review() {
    if (!canApprove) return;
    setPending(true); setError('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`/api/memos/${encodeURIComponent(memoId!)}/review`, {
        method: 'POST', credentials: 'include', signal: controller.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: currentVersionId, bodyHash: hash, intendedUse, limitations: limitations.trim(), sourcesReviewed, assumptionsReviewed, limitationsReviewed }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) throw new Error(payload.error || 'Review could not be saved. Reload the saved version and retry.');
      onApproved(payload);
    } catch (err) {
      setError(controller.signal.aborted ? 'Review timed out. Reload the saved version before retrying.' : err instanceof Error ? err.message : 'Review could not be saved.');
    } finally { clearTimeout(timeout); setPending(false); }
  }
  async function download(format: 'md' | 'docx') {
    if (!approved || pending || disabled) return;
    setPending(true); setError('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const query = new URLSearchParams({ format, versionId: currentVersionId! });
      const response = await fetch(`/api/memos/${encodeURIComponent(memoId!)}/export?${query}`, { credentials: 'include', signal: controller.signal });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Reviewed download is unavailable. Reload the saved version.');
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `reviewed-memo.${format}`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    } catch (err) {
      setError(controller.signal.aborted ? 'Download timed out. Please retry.' : err instanceof Error ? err.message : 'Reviewed download failed.');
    } finally { clearTimeout(timeout); setPending(false); }
  }
  return <section className="mt-4 rounded-md border border-slate-200 bg-white p-3" data-testid="memo-human-review">
    <h3 className="text-sm font-semibold text-slate-950">Human review</h3>
    <p className="mt-2 text-xs leading-5 text-slate-600">Review the original sources, assumptions and caveats before approving a saved version. Automated checks support your judgement.</p>
    {!unchanged ? <p className="mt-2 text-xs font-semibold text-amber-900">Save your changes before approving or downloading a reviewed version.</p>
      : approved ? <><p className="mt-2 text-xs font-semibold text-emerald-800">{`Reviewed for ${useLabel}`}</p>
        {approval?.intendedUse === 'internal-analysis' ? <p className="mt-1 text-xs leading-5 text-slate-600">This review does not approve external sharing or publication.</p> : null}
        {approval?.limitations ? <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">Limitations: {approval.limitations}</p> : null}</>
        : <p className="mt-2 text-xs font-semibold text-amber-900">Saved version awaits human review.</p>}
    <label className="mt-3 block text-xs font-semibold text-slate-700">Intended use
      <select aria-label="Intended use" value={intendedUse} disabled={pending || disabled} onChange={(event) => { setIntendedUse(event.target.value as MemoReviewUse); setSourcesReviewed(false); setAssumptionsReviewed(false); setLimitationsReviewed(false); }} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm text-slate-950">
        <option value="internal-analysis">Internal analysis</option><option value="external-sharing">External sharing</option><option value="publication">Publication</option>
      </select>
    </label>
    <label className="mt-3 block text-xs font-semibold text-slate-700">Limitations and caveats
      <textarea aria-label="Limitations and caveats" value={limitations} maxLength={4000} disabled={pending || disabled} onChange={(event) => { setLimitations(event.target.value); setLimitationsReviewed(false); }} placeholder="What remains uncertain or needs qualification?" className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm text-slate-950" />
    </label>
    <div className="mt-3 space-y-2 text-xs leading-5 text-slate-700">
      <label className="flex items-start gap-2"><input type="checkbox" checked={sourcesReviewed} disabled={pending || disabled} onChange={(event) => setSourcesReviewed(event.target.checked)} />I reviewed the original sources and their relevance.</label>
      <label className="flex items-start gap-2"><input type="checkbox" checked={assumptionsReviewed} disabled={pending || disabled} onChange={(event) => setAssumptionsReviewed(event.target.checked)} />I reviewed the assumptions and unsupported claims.</label>
      <label className="flex items-start gap-2"><input type="checkbox" checked={limitationsReviewed} disabled={pending || disabled} onChange={(event) => setLimitationsReviewed(event.target.checked)} />I reviewed the limitations for the selected intended use.</label>
    </div>
    <button type="button" disabled={!canApprove} onClick={review} className="mt-3 w-full rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? 'Working…' : 'Approve saved version'}</button>
    <div className="mt-2 flex flex-wrap gap-2">
      <button type="button" disabled={!approved || pending || disabled} onClick={() => download('md')} className="rounded border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-800 disabled:opacity-50">Download reviewed Markdown</button>
      <button type="button" disabled={!approved || pending || disabled} onClick={() => download('docx')} className="rounded border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-800 disabled:opacity-50">Download reviewed Word</button>
    </div>
    {error ? <p role="alert" className="mt-2 text-xs leading-5 text-red-800">{error} {onReload ? <button type="button" onClick={onReload} disabled={pending || disabled} className="underline">Reload saved version</button> : null}</p> : null}
  </section>;
}
