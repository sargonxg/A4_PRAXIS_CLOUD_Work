'use client';

import { useState, type FormEvent } from 'react';
import type { SignalDesk, SignalFeedbackInput } from '@/lib/signal/schema';

const areas = ['Overview', 'Coverage', 'Narratives', 'Evidence', 'Context', 'Briefs'] as const;
const categories = ['usability', 'visualization', 'source-coverage', 'evidence-review', 'brief-export', 'other'] as const;
const control = 'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-emerald-700';
const button = 'min-h-11 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:opacity-50';

export function SignalFeedbackPanel({ desk, area, busy, onSave }: {
  desk: SignalDesk;
  area: SignalFeedbackInput['area'];
  busy: boolean;
  onSave: (input: SignalFeedbackInput) => Promise<boolean>;
}) {
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const notes = desk.feedback ?? [];
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || busy) return;
    const data = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const saved = await onSave({ area: String(data.get('area')) as SignalFeedbackInput['area'], category: String(data.get('category')) as SignalFeedbackInput['category'], rating: Number(data.get('rating')), message: message.trim(), synthetic: data.get('synthetic') === 'on' });
      if (saved) setMessage('');
    } finally { setSaving(false); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ deskId: desk.id, deskName: desk.name, exportedAt: new Date().toISOString(), feedback: notes }, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `signal-${desk.id}-private-feedback.json`; anchor.click(); URL.revokeObjectURL(url);
  }
  return <details className="mt-5 rounded-xl border border-stone-200 bg-white p-4 sm:p-6">
    <summary className="min-h-11 cursor-pointer font-semibold">Private feedback</summary>
    <p className="my-3 text-sm text-stone-600">Your feedback stays in this desk. You can export and share it yourself. Feedback does not accept evidence or change an approved brief.</p>
    <form onSubmit={event => void save(event)} className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm">Area<select key={area} name="area" aria-label="Feedback area" defaultValue={area} className={control}>{areas.map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="text-sm">Feedback category<select name="category" aria-label="Feedback category" className={control}>{categories.map(value => <option key={value} value={value}>{value.replaceAll('-', ' ')}</option>)}</select></label>
      <label className="text-sm">Rating<select name="rating" aria-label="Feedback rating" defaultValue="3" className={control}>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}{value === 1 ? ' · difficult' : value === 5 ? ' · works well' : ''}</option>)}</select></label>
      <label className="text-sm sm:col-span-3">Feedback message<textarea aria-label="Feedback message" value={message} onChange={event => setMessage(event.target.value)} required minLength={5} maxLength={1500} rows={3} className={control} /></label>
      <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-3"><input name="synthetic" type="checkbox" />This is test feedback</label>
      <button className={button} disabled={busy || saving || notes.length >= 30}>Save private feedback</button>
    </form>
    <p className="mt-3 text-xs text-stone-600">{notes.length}/30 private notes. Existing notes are retained when the allowance is full.</p>
    {notes.length > 0 && <><button className={`${button} mt-3`} disabled={busy} onClick={download}>Export private feedback JSON</button><ul className="mt-4 space-y-3">{notes.slice().reverse().map(note => <li key={note.id} className="rounded-lg border border-stone-200 p-3 text-sm"><p className="font-medium">{note.area} · {note.category.replaceAll('-', ' ')} · {note.rating}/5{note.synthetic && ' · Test feedback'}</p><p className="mt-1 whitespace-pre-wrap"><bdi>{note.message}</bdi></p><p className="mt-2 text-xs text-stone-600">{new Date(note.createdAt).toLocaleString()} · Desk revision {note.deskVersion}</p></li>)}</ul></>}
  </details>;
}
