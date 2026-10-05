'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

type Reply = { answer: string; sources: { id: string; title: string; url: string; author?: string; publisher?: string; license?: string; licenseUrl?: string }[]; observations?: { text: string; kind: 'reported-data' | 'interpretation' | 'unknown'; citationIds: string[]; exactQuote?: string }[]; generatedAt?: string; snapshotUpdatedAt?: string | null; limitations?: string[] };
function externalUrl(value: string) { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : undefined; } catch { return undefined; } }

export function SignalWorldChat({ ownerKey, countryCode, countryName }: { ownerKey: string; countryCode: string | null; countryName?: string }) {
  const identity = `${ownerKey}:${countryCode ?? 'world'}`;
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const [draft, setDraft] = useState({ identity, text: '' });
  const question = draft.identity === identity ? draft.text : '';
  const [state, setState] = useState<{ identity: string; pending: boolean; reply?: Reply; error?: string }>({ identity, pending: false });
  useEffect(() => { const invalidate = () => { sequence.current++; controller.current?.abort(); }; invalidate(); return invalidate; }, [identity]);
  const visible = state.identity === identity ? state : { identity, pending: false };
  async function ask(event: React.FormEvent) {
    event.preventDefault(); if (question.trim().length < 5 || visible.pending) return;
    controller.current?.abort(); const request = new AbortController(); controller.current = request;
    const ticket = ++sequence.current; setState({ identity, pending: true });
    try {
      const response = await fetch('/api/ai/signal-world', { method: 'POST', credentials: 'include', signal: request.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: question.trim(), countryCode }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof body?.error === 'string' ? body.error : `The research request is unavailable (${response.status}).`);
      if (typeof body?.answer !== 'string') throw new Error('The research service returned an incomplete answer.');
      if (ticket === sequence.current && !request.signal.aborted) setState({ identity, pending: false, reply: { answer: body.answer, sources: Array.isArray(body.sources) ? body.sources : [], observations: Array.isArray(body.observations) ? body.observations : [], generatedAt: body.generatedAt, snapshotUpdatedAt: body.snapshotUpdatedAt, limitations: Array.isArray(body.limitations) ? body.limitations : [] } });
    } catch (error) { if (ticket === sequence.current && !request.signal.aborted) setState({ identity, pending: false, error: error instanceof Error ? error.message : 'The research request failed. Try again when the service is available.' }); }
  }
  return <section aria-labelledby="signal-world-chat-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" data-testid="signal-world-chat">
    <div className="mb-4"><h2 id="signal-world-chat-title" className="text-lg font-semibold text-slate-950">Ask about {countryName ?? 'the world'}</h2><p className="mt-1 text-sm text-slate-600">Explore the available sources. Answers are source-linked research drafts for your review.</p></div>
    <form onSubmit={ask} className="flex items-end gap-2"><label className="min-w-0 flex-1"><span className="sr-only">World research question</span><textarea value={question} onChange={event => setDraft({ identity, text: event.target.value })} minLength={5} maxLength={2000} rows={2} placeholder={countryName ? `What should I understand about ${countryName} today?` : 'Choose a country, or ask a question about the world…'} className="w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-950 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" /></label><button type="submit" disabled={question.trim().length < 5 || visible.pending} aria-label="Ask world research question" className="mb-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-40">{visible.pending ? <Loader2 size={20} className="animate-spin motion-reduce:animate-none" /> : <ArrowUp size={20} />}</button></form>
    {visible.pending && <p role="status" className="mt-3 text-sm text-slate-600">Reading the available source records…</p>}
    {visible.error && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{visible.error}</p>}
    {visible.reply && <div className="mt-5 border-t border-slate-100 pt-5" aria-live="polite"><p className="mb-3 text-xs font-medium text-amber-800">Research draft · review required{visible.reply.generatedAt && ` · generated ${new Date(visible.reply.generatedAt).toLocaleString()}`}</p><p className="mb-3 text-xs text-slate-500">Source snapshot: {visible.reply.snapshotUpdatedAt ? new Date(visible.reply.snapshotUpdatedAt).toLocaleString() : 'timestamp unavailable'}</p><p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{visible.reply.answer}</p>{visible.reply.observations?.length ? <details className="mt-4 rounded-lg bg-slate-50 p-3"><summary className="cursor-pointer text-sm text-slate-700">Inspect observations and citations</summary><ul className="mt-3 space-y-3">{visible.reply.observations.map((observation, index) => <li key={index} className="text-sm text-slate-700"><p className="mb-1 text-xs font-medium uppercase text-slate-500">{observation.kind === 'reported-data' ? 'Reported source data' : observation.kind === 'interpretation' ? 'Interpretation' : 'Unknown'}</p><p>{observation.text}</p>{observation.exactQuote && <blockquote className="mt-2 border-l-2 border-slate-300 pl-3">“{observation.exactQuote}”</blockquote>}<p className="mt-1 break-words text-xs text-slate-500">Citations: {observation.citationIds.join(', ') || 'none'}</p></li>)}</ul></details> : null}<p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Source records</p>{visible.reply.sources.length ? <ul className="mt-2 space-y-2">{visible.reply.sources.map((source, index) => <li key={`${source.id}-${index}`} className="break-words text-sm">{externalUrl(source.url) ? <a href={externalUrl(source.url)} target="_blank" rel="noopener noreferrer" className="text-sky-800 underline underline-offset-2">{source.title || source.id}</a> : <span>{source.title || source.id} · link unavailable</span>}<p className="mt-1 text-xs leading-5 text-slate-500">{source.author ? `Author: ${source.author}` : 'Author not supplied'}{source.publisher && ` · Publisher: ${source.publisher}`}{source.license && ` · ${source.license}`}{source.licenseUrl && externalUrl(source.licenseUrl) && <> · <a href={externalUrl(source.licenseUrl)} target="_blank" rel="noopener noreferrer" className="text-sky-800 underline">License terms</a></>}</p></li>)}</ul> : <p className="mt-2 text-sm text-slate-600">No source links were returned. Treat this answer as unverified.</p>}{visible.reply.limitations?.map((limitation, index) => <p key={index} className="mt-2 text-xs text-slate-500">{limitation}</p>)}</div>}
  </section>;
}
