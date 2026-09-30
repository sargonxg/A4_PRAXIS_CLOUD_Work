'use client';

import { useEffect, useRef, useState } from 'react';
import type { HandoverPreview } from '@/lib/memo/handover-package';

type Props = { memoId: string | null; saved: boolean; onDownload?: (url: string) => void };

/** Keep previews and pending requests inside the currently saved artifact. */
export function MemoHandoverPreview(props: Props) {
  return <MemoHandoverPreviewForMemo key={`${props.memoId}:${props.saved}`} {...props} />;
}

/** Previewing does not create bearer download access; that requires another click. */
function MemoHandoverPreviewForMemo({ memoId, saved, onDownload = (url) => window.location.assign(url) }: Props) {
  const [preview, setPreview] = useState<HandoverPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  const endpoint = `/api/memos/${encodeURIComponent(memoId ?? '')}/handover-package`;
  async function request(create: boolean) {
    if (!memoId || !saved || busy || (create && !preview)) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true); setError('');
    try {
      const response = await fetch(endpoint, { method: create ? 'POST' : 'GET', credentials: 'include', signal: controller.signal,
        ...(create ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ previewHash: preview!.previewHash }) } : {}) });
      const body = await response.json();
      if (controller.signal.aborted) return;
      if (response.status === 409 && body.preview) { setPreview(body.preview); setError('The saved work changed. Review this refreshed preview before creating a download.'); return; }
      if (!response.ok) { setPreview(null); throw new Error(typeof body.error === 'string' ? body.error : 'The package could not be prepared. Retry after checking the saved draft.'); }
      if (body.preview) setPreview(body.preview);
      if (create) {
        if (typeof body.signedUrl !== 'string' || !/^https:\/\//i.test(body.signedUrl)) throw new Error('The package did not return a valid download. Retry the preview.');
        onDownload(body.signedUrl);
      }
    } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'The package could not be prepared.'); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  return <section className="rounded-md border border-[color:var(--color-mineral)] bg-white p-4" data-testid="memo-handover-preview">
    <h3 className="font-serif text-xl">Hand over the work, with its context.</h3>
    <p className="mt-2 text-sm leading-6">Preview the saved draft, pinned capsule, evidence references and open gaps. Source links may still require the recipient’s access.</p>
    {!saved ? <p className="mt-3 text-sm font-semibold">Save your current changes before preparing a package.</p> : <button type="button" disabled={busy} onClick={() => void request(false)} className="mt-3 min-h-11 rounded-md border border-[color:var(--color-mineral)] px-3 text-sm font-semibold disabled:opacity-50">{busy ? 'Preparing…' : preview ? 'Refresh package preview' : 'Preview handover package'}</button>}
    {error ? <p role="alert" className="mt-3 text-sm leading-6 text-red-700">{error}</p> : null}
    {preview ? <div className="mt-4 space-y-3">
      <p className="text-sm font-semibold">{preview.mode === 'human-reviewed' ? `Reviewed for ${preview.review.intendedUse === 'publication' ? 'publication' : preview.review.intendedUse === 'external-sharing' ? 'external sharing' : 'internal analysis'}` : 'Draft — review required'}</p>
      {preview.mode === 'human-reviewed' ? <p className="text-sm leading-6">This records the owner’s review of the saved memo for that use. Capsule and source dependencies are not independently approved.</p> : null}
      <p className="text-xs leading-5">Saved version {preview.memoVersionId} · {preview.capsule.status === 'pinned' ? `Capsule ${preview.capsule.label || preview.capsule.capsuleId}, version ${preview.capsule.resolvedVersion}` : 'No pinned capsule'}</p>
      <PackageList title="Included" items={preview.included} /><PackageList title="Omitted" items={preview.omitted} />
      {preview.unresolvedDependencies.length ? <PackageList title="Recipient access and missing dependencies" items={preview.unresolvedDependencies.map((dependency) => `${dependency.label}: ${dependency.reason}`)} /> : null}
      <PackageList title="Limitations" items={[...preview.warnings, preview.review.limitations].filter(Boolean)} />
      <p className="text-xs leading-5">Creating the package grants temporary bearer download access. Anyone with that link can download while it is valid; it does not grant access to the original source systems.</p>
      <button type="button" disabled={busy || !saved} onClick={() => void request(true)} className="min-h-11 rounded-md bg-[color:var(--color-praxis-emerald-700)] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Preparing…' : 'Create temporary download'}</button>
    </div> : null}
  </section>;
}

function PackageList({ title, items }: { title: string; items: string[] }) {
  return items.length ? <div><p className="text-sm font-semibold">{title}</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6">{Array.from(new Set(items)).map((item) => <li key={item}>{item}</li>)}</ul></div> : null;
}
