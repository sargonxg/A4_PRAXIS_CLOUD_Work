'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { buildKnowledgeCaptureInput, KnowledgeCaptureFields, type CaptureKind } from '@/components/capsules/CapsuleKnowledgeCapture';

export function lessonCaptureInput(input: { conceptA: string; conceptB: string; scope: string; correction: string; explanation: string }) {
  const clean = (v: string) => v.trim();
  const terms = [clean(input.conceptA), clean(input.conceptB)];
  const scope = clean(input.scope), body = clean(input.correction), rationale = clean(input.explanation);
  if (terms.some((t) => !t || t.length > 100) || !scope || scope.length > 240 || !body || body.length > 4000 || !rationale || rationale.length > 4000) throw new Error('Name both concepts, their scope, your correction and its reason.');
  return { kind: 'distinction' as const, label: `${terms[0]} is distinct from ${terms[1]}`, scope: [scope], terms, body, rationale };
}
export function CapsuleLessonCapture({ capsuleId, answerId }: { capsuleId: string; answerId: string }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(false);
  const [kind, setKind] = useState<CaptureKind>('distinction');
  const prefix = useId(); const contextKey = `${capsuleId}:${answerId}`; const active = useRef(contextKey); active.current = contextKey;
  const controller = useRef<AbortController | null>(null);
  useEffect(() => { setOpen(false); setSaved(false); setError(''); setBusy(false); setKind('distinction'); return () => controller.current?.abort(); }, [capsuleId, answerId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget; const data = new FormData(form); const value = (key: string) => String(data.get(key) || '');
    const requestController = new AbortController();
    try {
      const payload = { ...buildKnowledgeCaptureInput(kind, value), originRef: `answer:${answerId}` };
      setBusy(true); setError(''); controller.current = requestController;
      const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/cognition`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: requestController.signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The lesson could not be saved.');
      if (!requestController.signal.aborted && active.current === contextKey) { setSaved(true); setOpen(false); }
    } catch (err) { if (!requestController.signal.aborted && active.current === contextKey) setError(err instanceof Error ? err.message : 'The lesson could not be saved.'); }
    finally { if (!requestController.signal.aborted && active.current === contextKey) setBusy(false); }
  }
  return <div className="w-full text-slate-800" data-testid="capsule-lesson-capture">
    <button type="button" aria-expanded={open} aria-controls={`${prefix}-form`} onClick={() => setOpen(!open)} className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold">Save lesson</button>
    {saved ? <p role="status" className="mt-2 text-xs">Lesson proposed. <Link href={`/app/capsules?starter=${encodeURIComponent(capsuleId)}&lane=inspect`} className="underline">Review it in Capsules</Link> before reuse.</p> : null}
    {open ? <form id={`${prefix}-form`} onSubmit={submit} className="mt-3 min-w-0 space-y-3 rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs">Save this correction as the kind of lesson it teaches. It remains a proposal in this answer’s capsule until you review it.</p>
      <label className="block text-xs font-semibold">Save correction as<select name="lessonKind" value={kind} disabled={busy} onChange={(event) => setKind(event.target.value as CaptureKind)} className="mt-1 min-h-10 w-full rounded border border-slate-300 px-2 font-normal"><option value="distinction">Distinction</option><option value="heuristic">Domain rule</option><option value="case">Example or critical case</option><option value="languageRule">Language rule</option></select></label>
      <KnowledgeCaptureFields key={kind} kind={kind} />
      <div className="flex flex-wrap gap-2"><button disabled={busy} type="submit" className="min-h-10 rounded bg-slate-950 px-3 text-xs font-semibold text-white">{busy ? 'Saving proposal…' : 'Propose lesson for review'}</button><button disabled={busy} type="button" onClick={() => { setOpen(false); setError(''); }} className="min-h-10 rounded border border-slate-300 px-3 text-xs">Ignore correction</button></div>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </form> : null}
  </div>;
}
