'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CONTEXT_DOMAIN_OPTIONS,
  CONTEXT_WORK_OPTIONS,
  buildContextCreatePayload,
  suggestContextDomainId,
  type ContextDomainOptionId,
  type ContextWorkOptionId,
} from '@/lib/contexts/context-create-payload';

const STORAGE_KEY = 'praxis.context.create.draft.v1';

export function CreateContextWizard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [frame, setFrame] = useState('');
  const [domain, setDomain] = useState<ContextDomainOptionId>('conflict');
  const [work, setWork] = useState<ContextWorkOptionId>('foreign-policy');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [manualDomain, setManualDomain] = useState(false);
  const suggestedDomain = useMemo(() => suggestContextDomainId(`${name}\n${frame}`), [frame, name]);
  const selectedDomainLabel = CONTEXT_DOMAIN_OPTIONS.find((option) => option.id === suggestedDomain)?.label ?? 'Conflict';
  const canCreate = name.trim().length >= 3 && !saving;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<{
        name: string;
        frame: string;
        domain: ContextDomainOptionId;
        work: ContextWorkOptionId;
      }>;
      if (parsed.name) setName(parsed.name);
      if (parsed.frame) setFrame(parsed.frame);
      if (parsed.domain && CONTEXT_DOMAIN_OPTIONS.some((option) => option.id === parsed.domain)) {
        setDomain(parsed.domain);
        setManualDomain(true);
      }
      if (parsed.work && CONTEXT_WORK_OPTIONS.some((option) => option.id === parsed.work)) {
        setWork(parsed.work);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!manualDomain) setDomain(suggestedDomain);
  }, [manualDomain, suggestedDomain]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, frame, domain, work }));
    } catch {
      /* local draft persistence is best-effort */
    }
  }, [domain, frame, name, work]);

  async function createContext() {
    if (!canCreate) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/situations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildContextCreatePayload({ name, frame, domain, work })),
      });

      if (response.status === 401) {
        setMessage('Sign in to save this context. The draft is preserved in this browser.');
        router.push(`/login?redirect=${encodeURIComponent('/contexts')}`);
        return;
      }

      if (response.status === 403) {
        setMessage('Example sessions are read-only. Sign in with a real account to create a context.');
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(typeof data.error === 'string' ? data.error : 'Context creation failed.');
        return;
      }

      const situationId = data?.situation?.id;
      if (typeof situationId !== 'string' || !situationId) {
        setMessage('Context was created, but the response did not include a workspace id.');
        return;
      }

      window.localStorage.removeItem(STORAGE_KEY);
      router.push(`/app/workbench/${encodeURIComponent(situationId)}?openChapter=context&source=contexts`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Context creation failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} className="h-10 border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white">
        New Context
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <section className="w-full max-w-4xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-semibold">Create Context</h2>
                <p className="mt-1 text-sm text-slate-600">A short setup for name, lenses, work process, and the first frame.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="border border-slate-300 px-3 py-1 text-sm text-slate-600">
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-4">
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Name and brief</span>
                <textarea value={name} onChange={(event) => setName(event.target.value)} className="min-h-28 border border-slate-300 p-3" placeholder="Indo-Pacific strategic competition 2026" />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Domain ontology</span>
                <select
                  value={domain}
                  onChange={(event) => {
                    setManualDomain(true);
                    setDomain(event.target.value as ContextDomainOptionId);
                  }}
                  className="h-10 border border-slate-300 px-3"
                >
                  {CONTEXT_DOMAIN_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
                <span className="text-xs text-slate-500">Suggested: {selectedDomainLabel}</span>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Work ontology</span>
                <select value={work} onChange={(event) => setWork(event.target.value as ContextWorkOptionId)} className="h-10 border border-slate-300 px-3">
                  {CONTEXT_WORK_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
                <span className="text-xs text-slate-500">Defaults come from the active user model.</span>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Four-field frame</span>
                <textarea value={frame} onChange={(event) => setFrame(event.target.value)} className="min-h-28 border border-slate-300 p-3" placeholder="What is happening? Why does it matter? What would change the assessment? What decision does this support?" />
              </label>
            </div>
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-4 text-sm">
              <p className="text-slate-600">{message ?? 'Creates an owner-scoped Context record and opens the workbench. Unsaved drafts stay in this browser.'}</p>
              <button type="button" onClick={createContext} disabled={!canCreate} className="border border-slate-900 bg-slate-900 px-4 py-2 font-medium text-white disabled:border-slate-300 disabled:bg-white disabled:text-slate-400">
                {saving ? 'Creating...' : 'Create Context'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
