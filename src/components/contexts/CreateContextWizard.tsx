'use client';

import { useMemo, useState } from 'react';

const domainOptions = ['Conflict', 'Mediation', 'Humanitarian'];
const workOptions = ['Foreign Policy Research', 'Domestic Policy Analysis', 'Corporate Strategic Analysis'];

export function CreateContextWizard() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState(domainOptions[0]);
  const [work, setWork] = useState(workOptions[0]);
  const suggestedDomain = useMemo(() => {
    const lower = name.toLowerCase();
    if (lower.includes('aid') || lower.includes('humanitarian')) return 'Humanitarian';
    if (lower.includes('talk') || lower.includes('mediation') || lower.includes('negotiation')) return 'Mediation';
    return 'Conflict';
  }, [name]);

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
                <select value={domain} onChange={(event) => setDomain(event.target.value)} className="h-10 border border-slate-300 px-3">
                  {domainOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
                <span className="text-xs text-slate-500">Suggested: {suggestedDomain}</span>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Work ontology</span>
                <select value={work} onChange={(event) => setWork(event.target.value)} className="h-10 border border-slate-300 px-3">
                  {workOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
                <span className="text-xs text-slate-500">Defaults come from the active user model.</span>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Four-field frame</span>
                <textarea className="min-h-28 border border-slate-300 p-3" placeholder="What is happening? Why does it matter? What would change the assessment? What decision does this support?" />
              </label>
            </div>
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-4 text-sm">
              <p className="text-slate-600">Authenticated persistence writes to the owner-scoped Context record. Local preview keeps the draft on this screen.</p>
              <button type="button" className="border border-slate-300 px-4 py-2 font-medium text-slate-600">
                Create after sign-in
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
