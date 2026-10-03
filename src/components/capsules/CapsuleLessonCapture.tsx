'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';

export function lessonCaptureInput(input: { conceptA: string; conceptB: string; scope: string; correction: string; explanation: string }) {
  const clean = (v: string) => v.trim();
  const terms = [clean(input.conceptA), clean(input.conceptB)];
  const scope = clean(input.scope), body = clean(input.correction), rationale = clean(input.explanation);
  if (terms.some((t) => !t || t.length > 100) || !scope || scope.length > 240 || !body || body.length > 4000 || !rationale || rationale.length > 4000) throw new Error('Name both concepts, their scope, your correction and its reason.');
  return { kind: 'distinction' as const, label: `${terms[0]} is distinct from ${terms[1]}`, scope: [scope], terms, body, rationale };
}
export function CapsuleLessonCapture({ capsuleId, answerId }: { capsuleId: string; answerId: string }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(false);
  const prefix = useId(); const active = useRef(capsuleId); active.current = capsuleId;
  const controller = useRef<AbortController | null>(null);
  useEffect(() => { setOpen(false); setSaved(false); setError(''); return () => controller.current?.abort(); }, [capsuleId, answerId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget; const data = new FormData(form); const value = (key: string) => String(data.get(key) || '');
    try {
      const payload = lessonCaptureInput({ conceptA: value('conceptA'), conceptB: value('conceptB'), scope: value('scope'), correction: value('correction'), explanation: value('explanation') });
      setBusy(true); setError(''); controller.current = new AbortController();
      const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/cognition`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.current.signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The lesson could not be saved.');
      if (!controller.current.signal.aborted && active.current === capsuleId) { setSaved(true); setOpen(false); }
    } catch (err) { if (!controller.current?.signal.aborted && active.current === capsuleId) setError(err instanceof Error ? err.message : 'The lesson could not be saved.'); }
    finally { if (active.current === capsuleId) setBusy(false); }
  }
  return <div className="w-full text-slate-800" data-testid="capsule-lesson-capture">
    <button type="button" aria-expanded={open} aria-controls={`${prefix}-form`} onClick={() => setOpen(!open)} className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold">Save lesson</button>
    {saved ? <p role="status" className="mt-2 text-xs">Lesson proposed. <Link href={`/app/capsules?starter=${encodeURIComponent(capsuleId)}&lane=repository`} className="underline">Review it in Capsules</Link> before reuse.</p> : null}
    {open ? <form id={`${prefix}-form`} onSubmit={submit} className="mt-3 grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2">
      <p className="text-xs sm:col-span-2">Correct a distinction in this answer. Save it to this answer’s capsule for your review.</p>
      {([['conceptA', 'First concept', 'e.g. authorization'], ['conceptB', 'Second concept', 'e.g. expenditure'], ['scope', 'Where does this apply?', 'e.g. public finance']] as const).map(([name, label, placeholder]) => <label key={name} htmlFor={`${prefix}-${name}`} className="grid gap-1 text-xs font-semibold">{label}<input id={`${prefix}-${name}`} name={name} required maxLength={name === 'scope' ? 240 : 100} placeholder={placeholder} className="min-h-10 w-full rounded border border-slate-300 px-2 font-normal" /></label>)}
      <label htmlFor={`${prefix}-correction`} className="grid gap-1 text-xs font-semibold sm:col-span-2">Your correction<textarea id={`${prefix}-correction`} name="correction" required maxLength={4000} rows={3} className="w-full rounded border border-slate-300 p-2 font-normal" /></label>
      <label htmlFor={`${prefix}-explanation`} className="grid gap-1 text-xs font-semibold sm:col-span-2">Why does the distinction matter?<textarea id={`${prefix}-explanation`} name="explanation" required maxLength={4000} rows={2} className="w-full rounded border border-slate-300 p-2 font-normal" /></label>
      <div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={busy} type="submit" className="min-h-10 rounded bg-slate-950 px-3 text-xs font-semibold text-white">{busy ? 'Saving proposal…' : 'Propose lesson for review'}</button><button disabled={busy} type="button" onClick={() => setOpen(false)} className="min-h-10 rounded border border-slate-300 px-3 text-xs">Cancel</button></div>
      {error ? <p role="alert" className="text-xs text-red-700 sm:col-span-2">{error}</p> : null}
    </form> : null}
  </div>;
}
