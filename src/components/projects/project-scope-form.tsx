'use client';

import { useState } from 'react';
import { z } from 'zod';
import { ProjectScopeSchema, type ProjectScope } from '@/lib/projects/schema';
import { useProjectDraft } from './use-project-draft';

export const emptyProjectScope: ProjectScope = { title: '', question: '', purpose: '', audience: '', jurisdiction: '', asOfDate: null, language: 'en', mandate: '', conventions: '' };
const labels: Record<keyof ProjectScope, string> = { title: 'Project title', question: 'Research question', purpose: 'Intended use', audience: 'Audience', jurisdiction: 'Jurisdiction / scope', asOfDate: 'Analytical cutoff', language: 'Output language', mandate: 'Organization mandate', conventions: 'Approved working conventions' };
const fields = ['title', 'question', 'purpose', 'audience', 'jurisdiction', 'asOfDate', 'language', 'mandate', 'conventions'] as const;
export const projectInputClass = 'w-full min-w-0 rounded border border-[var(--color-app-border)] bg-[var(--color-app-card)] p-2 text-sm text-[var(--color-app-text)] focus-visible:outline-2 focus-visible:outline-emerald-700';
export const projectButtonClass = 'inline-flex min-h-11 items-center justify-center rounded border border-[var(--color-app-border)] px-3 py-2 text-sm font-semibold disabled:opacity-50';

const DraftScopeSchema = ProjectScopeSchema.extend({ title: z.string().max(200), question: z.string().max(2000), language: z.string().max(80) });
export function ProjectScopeForm({ initial, pending, submitLabel, onSave, onDirty, draftKey, revision }: {
  initial: ProjectScope; pending: boolean; submitLabel: string;
  onSave: (scope: ProjectScope, expectedRevision?: number) => Promise<boolean>; onDirty: (dirty: boolean) => void; draftKey: string; revision: number;
}) {
  const draft = useProjectDraft(draftKey, initial, revision, DraftScopeSchema, onDirty);
  const scope = draft.value; const setScope = draft.update;
  const [validation, setValidation] = useState('');
  const dirty = JSON.stringify(scope) !== JSON.stringify(initial);
  return <form className="grid min-w-0 gap-3 sm:grid-cols-2" onSubmit={async (event) => {
    event.preventDefault();
    const parsed = ProjectScopeSchema.safeParse(scope);
    if (!parsed.success) { setValidation(parsed.error.issues.map((issue) => `${labels[issue.path[0] as keyof ProjectScope] ?? 'Field'}: ${issue.message}`).join('; ')); return; }
    setValidation('');
    if (await onSave(parsed.data, draft.expectedRevision)) { draft.clear(); onDirty(false); }
  }}>
    {draft.recovered ? <p role="status" className="text-sm sm:col-span-2">Recovered unsaved scope from this browser. It retains its original revision check; compare it with saved scope before applying.</p> : null}
    {draft.storageUnavailable ? <p role="status" className="text-sm sm:col-span-2">Browser draft recovery is unavailable. Save before navigating.</p> : null}
    {fields.map((field) => <label key={field} className={`grid min-w-0 gap-1 text-sm ${['question', 'mandate', 'conventions'].includes(field) ? 'sm:col-span-2' : ''}`}>
      <span className="font-medium">{labels[field]}{field === 'title' || field === 'question' ? ' *' : ''}</span>
      {['question', 'purpose', 'mandate', 'conventions'].includes(field)
        ? <textarea className={projectInputClass} rows={field === 'question' ? 3 : 2} maxLength={field === 'mandate' || field === 'conventions' ? 3000 : 2000} value={scope[field] ?? ''} disabled={pending} onChange={(event) => { const next = { ...scope, [field]: event.target.value }; setScope(next); onDirty(JSON.stringify(next) !== JSON.stringify(initial)); }} />
        : <input className={projectInputClass} type={field === 'asOfDate' ? 'date' : 'text'} maxLength={field === 'title' ? 200 : field === 'language' ? 80 : 500} required={field === 'title' || field === 'question' || field === 'language'} value={scope[field] ?? ''} disabled={pending} onChange={(event) => { const next = { ...scope, [field]: field === 'asOfDate' ? event.target.value || null : event.target.value }; setScope(next); onDirty(JSON.stringify(next) !== JSON.stringify(initial)); }} />}
      {field === 'asOfDate' ? <span className="text-xs text-[var(--color-app-text-secondary)]">Leave unknown dates empty. This cutoff is separate from publication, event and effective dates.</span> : null}
    </label>)}
    {validation ? <p role="alert" className="sm:col-span-2">{validation}</p> : null}
    <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button className={projectButtonClass} type="submit" disabled={pending}>{pending ? 'Saving…' : submitLabel}</button><span role="status" className="text-xs">{dirty ? 'Unsaved scope changes' : 'Scope loaded'}</span></div>
  </form>;
}
