'use client';

import { useState, type FormEvent } from 'react';
import { CAPSULE_INSPECTION_COMMANDS, inspectCognitiveCapsule, type CapsuleInspectionReply } from '@/lib/cognitive-capsule/chat';
import { EXPERT_INTERVIEW_MODES, type ExpertInterviewMode } from '@/lib/cognitive-capsule/interview';
import type { CognitiveCapsule } from '@/lib/cognitive-capsule/types';

const field = 'w-full min-w-0 rounded border border-slate-300 bg-white p-2 text-sm text-slate-950';
const modeLabels: Record<ExpertInterviewMode, string> = { cta: 'Recognizing cues', 'critical-decision': 'A difficult decision', distinction: 'Distinguishing concepts', exception: 'An exception to a rule', language: 'Interpreting language', case: 'Learning from a case' };
type Message = { role: 'user' | 'assistant'; content: string };
type Preview = { label: string; kind: string; body: string; terms?: string[]; sourceRefs?: string[] };

export function CapsuleCognitiveChat({ capsuleId, cognition, priorCognition, onProposed }: { capsuleId: string; cognition: CognitiveCapsule; priorCognition?: CognitiveCapsule; onProposed?: () => void }) {
  const [tab, setTab] = useState<'inspect' | 'interview'>('inspect');
  const [query, setQuery] = useState(''); const [inspection, setInspection] = useState<CapsuleInspectionReply>();
  const [baseline, setBaseline] = useState<CognitiveCapsule>();
  const [mode, setMode] = useState<ExpertInterviewMode>('distinction'); const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState(''); const [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null); const [followUps, setFollowUps] = useState<string[]>([]); const [blindSpots, setBlindSpots] = useState<string[]>([]);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  function inspect(value: string) {
    setError(''); setQuery(value);
    try { setInspection(inspectCognitiveCapsule(cognition, value, { prior: priorCognition ?? baseline })); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to inspect this capsule.'); }
  }
  async function interview(action: 'interview' | 'propose') {
    if (!consent || busy) return;
    const text = answer.trim() || (action === 'propose' ? 'Generate one review proposal from the expertise I supplied. Do not invent missing detail.' : 'Ask the first question for this interview topic.');
    const next: Message[] = [...messages, { role: 'user', content: text }];
    if (next.length > 20 || next.reduce((total, m) => total + m.content.length, 0) > 24000) { setError('This interview has reached its limit. Start a new interview with a summary of your earlier answers.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/cognitive-assist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, mode, consent, messages: next, capsuleId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.error || 'The interview could not continue.');
      const reply = String(body.reply ?? 'More detail is needed.');
      setMessages([...next, { role: 'assistant', content: reply }]); setAnswer(''); setPreview(body.capture ?? null);
      setFollowUps(body.followUps ?? []); setBlindSpots(body.blindSpotSuggestions ?? []);
      if (body.persisted) { setNotice('Saved as a model proposal. Review and edit it below before acceptance.'); setPreview(null); onProposed?.(); }
      else if (action === 'propose') setNotice('More detail is needed before a complete review proposal can be saved.');
    } catch (err) { setError(err instanceof Error ? err.message : 'The interview could not continue.'); }
    finally { setBusy(false); }
  }
  function resetInterview(nextMode = mode) { setMode(nextMode); setMessages([]); setPreview(null); setFollowUps([]); setBlindSpots([]); setAnswer(''); setNotice(''); setError(''); }
  function submit(event: FormEvent) { event.preventDefault(); if (tab === 'inspect') inspect(query); else void interview('interview'); }
  return <details className="rounded border border-slate-200 bg-white p-3" data-testid="capsule-cognitive-chat">
    <summary className="cursor-pointer text-sm font-semibold">Capsule chat</summary>
    <div className="my-3 flex flex-wrap gap-2" aria-label="Capsule chat mode">
      <button type="button" aria-pressed={tab === 'inspect'} onClick={() => { setTab('inspect'); setError(''); }} className="min-h-10 rounded border px-3 py-2 text-sm">Inspect this capsule</button>
      <button type="button" aria-pressed={tab === 'interview'} onClick={() => { setTab('interview'); setError(''); }} className="min-h-10 rounded border px-3 py-2 text-sm">Interview an expert</button>
    </div>
    {tab === 'inspect' ? <>
      <p className="text-sm text-slate-600">Inspect saved structure, evidence and provenance. These commands use the capsule records directly.</p>
      <button type="button" className="my-2 min-h-10 rounded border px-2 py-1 text-xs" onClick={() => { setBaseline(structuredClone(cognition)); setInspection(undefined); }}>Remember version {cognition.version} for comparison</button>
      {baseline ? <p className="text-xs text-slate-500">Comparison baseline: {baseline.version}, saved for this open session.</p> : null}
      <div className="my-3 flex flex-wrap gap-2">{CAPSULE_INSPECTION_COMMANDS.map(command => <button type="button" key={command} className="min-h-10 max-w-full rounded border px-2 py-1 text-left text-xs" onClick={() => inspect(command)}>{command}</button>)}</div>
      <form onSubmit={submit} className="space-y-2"><label className="block text-sm">Inspect an edge, origin or source<textarea className={field} rows={2} value={query} maxLength={1000} onChange={e => setQuery(e.target.value)} placeholder="Why does edge statement-123 exist?" /></label><button type="submit" className="min-h-10 rounded border px-3 py-2 text-sm" disabled={!query.trim()}>Inspect</button></form>
      {inspection ? <div className="mt-3 space-y-2" role="status"><p className="text-sm">{inspection.summary}</p>{inspection.rows.map(row => <details key={row.id} className="rounded border p-2"><summary className="break-words text-sm font-medium">{row.title}</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm">{row.text}</p><p className="mt-2 break-all text-xs text-slate-500">ID: {row.id}{row.refs.length ? ` · References: ${row.refs.join(', ')}` : ''}</p></details>)}{inspection.truncated ? <p className="text-xs">Showing 30 of {inspection.total} records.</p> : null}</div> : null}
    </> : <div className="space-y-3">
      <p className="text-sm text-slate-600">The interviewer follows your answers and asks for missing detail. Expertise becomes a review proposal only when you request it.</p>
      <label className="block text-sm">Interview topic<select className={field} disabled={busy} value={mode} onChange={e => resetInterview(e.target.value as ExpertInterviewMode)}>{EXPERT_INTERVIEW_MODES.map(value => <option value={value} key={value}>{modeLabels[value]}</option>)}</select></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} className="mt-1" /><span>Use AI to interview me using this capsule and my answers. Each AI turn uses my ordinary Ask allowance.</span></label>
      <div className="max-h-96 space-y-3 overflow-y-auto" aria-live="polite">{messages.map((message, index) => <div key={index} className="rounded border p-2"><p className="text-xs font-semibold">{message.role === 'user' ? 'You' : 'Interviewer'}</p><p className="whitespace-pre-wrap break-words text-sm">{message.content}</p></div>)}</div>
      {followUps.length ? <ul className="list-disc pl-5 text-sm">{followUps.map(q => <li key={q}>{q}</li>)}</ul> : null}
      {blindSpots.length ? <div className="rounded border border-amber-200 p-2"><p className="text-xs font-semibold">Possible blind spots to consider</p><ul className="list-disc pl-5 text-sm">{blindSpots.map(q => <li key={q}>{q}</li>)}</ul></div> : null}
      <form onSubmit={submit} className="space-y-2"><label className="block text-sm">Your experience or answer<textarea className={field} value={answer} maxLength={4000} rows={3} disabled={busy} onChange={e => { setAnswer(e.target.value); setPreview(null); }} /></label><div className="flex flex-wrap gap-2"><button type="submit" disabled={!consent || busy} className="min-h-10 rounded border px-3 py-2 text-sm disabled:opacity-50">{busy ? 'Continuing interview…' : messages.length ? 'Continue interview' : 'Start interview'}</button><button type="button" disabled={busy} className="min-h-10 px-3 py-2 text-sm underline" onClick={() => resetInterview()}>Start a new interview</button></div></form>
      {preview ? <div className="rounded border border-slate-300 p-3"><p className="text-sm font-semibold">Proposed {preview.kind}: {preview.label}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{preview.body}</p>{preview.terms?.length ? <p className="mt-2 text-sm">Terms: {preview.terms.join(' / ')}</p> : null}<p className="mt-2 break-all text-xs">Evidence spans: {preview.sourceRefs?.join(', ') || 'Expert recollection; no documentary anchors'}</p><p className="mt-2 text-xs text-slate-600">The next AI turn generates and saves a review proposal from your answers. Human acceptance is separate.</p><button type="button" disabled={!consent || busy} className="mt-2 min-h-10 rounded border px-3 py-2 text-sm disabled:opacity-50" onClick={() => void interview('propose')}>Generate review proposal</button></div> : null}
    </div>}
    {notice ? <p role="status" className="mt-3 text-sm text-emerald-800">{notice}</p> : null}
    {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
  </details>;
}
