'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { ACO_COPY, ACO_THESIS_COPY, ACO_WORKED_EXAMPLE } from '@/lib/ontology/aco-copy';

interface Props {
  /** Storage key segment so per-user dismissal is durable. */
  userKey: string;
  /** Where the user opens this from. */
  trigger: 'first-case-open' | 'manual';
}

export function AcoFirstTimeOverlay({ userKey, trigger }: Props) {
  const storageKey = `praxis:aco-overlay-dismissed:${userKey}`;
  const [open, setOpen] = useState(false);
  const core = useMemo(() => ACO_COPY.filter((entity) => entity.tier === 'core'), []);
  const extended = useMemo(() => ACO_COPY.filter((entity) => entity.tier === 'extended'), []);

  useEffect(() => {
    if (trigger === 'manual') {
      setOpen(true);
      return;
    }
    if (typeof window === 'undefined') return;
    const dismissed = window.localStorage.getItem(storageKey);
    if (!dismissed) setOpen(true);
  }, [trigger, storageKey]);

  if (!open) return null;

  function dismiss() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, new Date().toISOString());
    }
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/45 p-3 backdrop-blur-sm sm:p-4">
      <section
        className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
        aria-labelledby="aco-first-time-title"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:border-navy-300 hover:text-navy-950"
          aria-label="Dismiss conflict grammar primer"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-navy-600">The PRAXIS conflict grammar</p>
        <h2 id="aco-first-time-title" className="mt-2 pr-10 text-2xl font-semibold tracking-tight text-navy-950">
          Fourteen entities make a case legible.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">{ACO_THESIS_COPY}</p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">Core 8</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {core.map((entity) => (
                <AcoEntityCard key={entity.id} name={entity.name} oneLiner={entity.oneLiner} example={entity.example} />
              ))}
            </dl>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">Extended 6</h3>
              <dl className="mt-3 grid gap-3">
                {extended.map((entity) => (
                  <AcoEntityCard key={entity.id} name={entity.name} oneLiner={entity.oneLiner} example={entity.example} />
                ))}
              </dl>
            </div>

            <div className="rounded-lg border border-gold-200 bg-gold-50 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-900">Worked example</h3>
              <p className="mt-2 text-sm italic leading-6 text-navy-900">"{ACO_WORKED_EXAMPLE.sentence}"</p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-800">
                {ACO_WORKED_EXAMPLE.decomposition.map((item) => (
                  <li key={`${item.primitive}-${item.text}`}>
                    <span className="font-semibold text-navy-950">{item.primitive}:</span> {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-xs font-medium text-slate-700">You can reopen this from the Ontology tab anytime.</p>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
          >
            Got it
          </button>
        </div>
      </section>
    </div>
  );
}

function AcoEntityCard({
  name,
  oneLiner,
  example,
}: {
  name: string;
  oneLiner: string;
  example: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <dt className="text-sm font-semibold text-navy-950">{name}</dt>
      <dd className="mt-1 text-xs leading-5 text-slate-700">{oneLiner}</dd>
      <dd className="mt-1 text-[11px] italic leading-4 text-slate-600">{example}</dd>
    </div>
  );
}
