'use client';

import { useState, type FormEvent } from 'react';
import { EXPERT_INTERVIEW_MODES, getExpertInterviewQuestions } from '@/lib/cognitive-capsule/interview';
import type { Condition } from '@/lib/cognitive-capsule/types';

const labels = { cta: 'Recognizing cues', 'critical-decision': 'A difficult decision', distinction: 'Distinguishing concepts', exception: 'An exception to a rule', language: 'Interpreting language', case: 'Learning from a case' };
const field = 'w-full rounded border border-slate-300 bg-white p-2 text-sm text-slate-950';

export function CapsuleExpertInterview({ capsuleId, onProposed }: { capsuleId: string; onProposed?: () => void }) {
  const [mode, setMode] = useState<(typeof EXPERT_INTERVIEW_MODES)[number]>('distinction');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [conditions, setConditions] = useState<Record<string, Condition[]>>({});
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  const questions = getExpertInterviewQuestions(mode);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const values: Record<string, unknown> = {};
    for (const q of questions) {
      const value = answers[q.key]?.trim() ?? '';
      if (q.type === 'conditions') values[q.key] = conditions[q.key] ?? [];
      else if (q.type === 'references' || q.type === 'text-list') values[q.key] = value.split(q.type === 'references' ? /[\n,]/ : /\n/).map((v) => v.trim()).filter(Boolean);
      else if (value) values[q.key] = value;
    }
    try {
      const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/cognition`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, answers: values }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'The interview could not be saved.');
      if (body.status === 'needs_answers') setNotice(`More detail needed: ${body.missingQuestions.map((q: { prompt: string }) => q.prompt).join(' ')}`);
      else { setNotice('Interview saved as a proposal. Review it before using it as accepted expertise.'); onProposed?.(); }
    } catch (err) { setError(err instanceof Error ? err.message : 'The interview could not be saved.'); }
    finally { setBusy(false); }
  }
  return <details className="rounded border border-slate-200 bg-white p-3" data-testid="capsule-expert-interview">
    <summary className="cursor-pointer text-sm font-semibold">Guided expert interview</summary>
    <p className="my-3 text-sm text-slate-600">Describe your own experience. Leave uncertain facts unanswered. Your answers become proposals for human review.</p>
    <label className="block text-sm">Interview topic<select className={field} value={mode} disabled={busy} onChange={(e) => { setMode(e.target.value as typeof mode); setAnswers({}); setConditions({}); setNotice(''); setError(''); }}>
      {EXPERT_INTERVIEW_MODES.map((m) => <option key={m} value={m}>{labels[m]}</option>)}
    </select></label>
    <form className="mt-3 space-y-3" onSubmit={submit}>
      {questions.map((q) => q.type === 'conditions' ? <fieldset key={q.key} className="space-y-2 rounded border border-slate-200 p-2">
        <legend className="text-sm">{q.prompt}{q.required ? ' (required)' : ''}</legend>
        {(conditions[q.key] ?? []).map((c, index) => <div className="flex flex-wrap gap-2" key={index}>
          <input aria-label={`${q.prompt} fact ${index + 1}`} className={`${field} flex-1 min-w-32`} value={c.key} disabled={busy} onChange={(e) => setConditions({ ...conditions, [q.key]: conditions[q.key].map((v, i) => i === index ? { ...v, key: e.target.value } : v) })} placeholder="Fact to verify" />
          <select aria-label={`${q.prompt} test ${index + 1}`} className="rounded border p-2 text-sm" value={c.operator} disabled={busy} onChange={(e) => setConditions({ ...conditions, [q.key]: conditions[q.key].map((v, i) => i === index ? { kind: v.kind, key: v.key, operator: e.target.value as Condition['operator'], ...(e.target.value === 'equals' ? { value: '' } : {}) } : v) })}>
            <option value="present">is present</option><option value="absent">is absent</option><option value="equals">equals</option>
          </select>
          {c.operator === 'equals' ? <input aria-label={`${q.prompt} value ${index + 1}`} className={`${field} flex-1 min-w-32`} value={String(c.value ?? '')} disabled={busy} onChange={(e) => setConditions({ ...conditions, [q.key]: conditions[q.key].map((v, i) => i === index ? { ...v, value: e.target.value } : v) })} /> : null}
          <button type="button" disabled={busy} className="text-xs underline" onClick={() => setConditions({ ...conditions, [q.key]: conditions[q.key].filter((_, i) => i !== index) })}>Remove condition</button>
        </div>)}
        <button type="button" disabled={busy || (conditions[q.key]?.length ?? 0) >= 30} className="min-h-10 text-xs underline" onClick={() => setConditions({ ...conditions, [q.key]: [...(conditions[q.key] ?? []), { kind: 'context', key: '', operator: 'present' }] })}>Add condition</button>
      </fieldset> : <label key={q.key} className="block text-sm">{q.prompt}{q.required ? ' (required)' : ''}
        <textarea className={field} value={answers[q.key] ?? ''} maxLength={4000} rows={q.type === 'text' ? 2 : 3} disabled={busy} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} />
        {q.type === 'text-list' ? <span className="text-xs text-slate-500">One item per line.</span> : q.type === 'references' ? <span className="text-xs text-slate-500">Attached evidence or rule IDs, separated by commas. Leave empty for your own recollection.</span> : null}
      </label>)}
      {notice ? <p role="status" className="text-sm text-emerald-800">{notice}</p> : null}{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={busy} className="min-h-10 rounded border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">{busy ? 'Saving interview…' : 'Save interview proposal'}</button>
    </form>
  </details>;
}
