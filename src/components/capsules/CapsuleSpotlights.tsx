'use client';

import Link from 'next/link';
import { POLICY_CAPSULE_SPOTLIGHTS } from '@/lib/capsules/spotlights';
import { proposeDockSlotForCapsule, type CapsuleLibraryEntry } from '@/lib/capsules/library';
import type { CapsuleDockSlotKind } from '@/lib/context/active-context-stack';

export function CapsuleSpotlights({ entries, busyCapsuleId, onAttach }: {
  entries: CapsuleLibraryEntry[];
  busyCapsuleId: string | null;
  onAttach?: (entry: CapsuleLibraryEntry, slot: CapsuleDockSlotKind) => void;
}) {
  const available = new Map(entries.map((entry) => [entry.id, entry]));
  return (
    <section className="mt-5 border-y border-emerald-100 py-4" aria-label="Policy capsule spotlights">
      <h3 className="text-base font-semibold text-slate-950">{POLICY_CAPSULE_SPOTLIGHTS.length} starting points for serious policy work</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">Choose a case, a thinking method or a deliverable. Inspect the evidence and adapt a private copy. Starters need your current sources and review.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {POLICY_CAPSULE_SPOTLIGHTS.map((item) => {
          const entry = available.get(item.id);
          if (!entry) return null;
          const slot = proposeDockSlotForCapsule(entry);
          return (
            <article key={item.id} className="rounded-md border border-slate-200 bg-white p-3">
              <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
              <p className="mt-1 text-xs leading-5 text-slate-600">{item.question}</p>
              <details className="mt-2 text-xs leading-5 text-slate-600">
                <summary className="cursor-pointer font-semibold text-slate-700">What to inspect</summary>
                <p className="mt-1">{item.inspect}</p>
                <p className="mt-1">{item.caveat}</p>
              </details>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={!onAttach || busyCapsuleId !== null}
                  onClick={() => onAttach?.(entry, slot)}
                  className="min-h-9 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-50">
                  {busyCapsuleId === item.id ? 'Adding…' : `Add ${slot === 'tool' ? 'method' : slot === 'output' ? 'format' : 'context'}`}
                </button>
                <Link href={`/app/capsules?starter=${encodeURIComponent(item.id)}&lane=inspect`}
                  className="inline-flex min-h-9 items-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700">
                  Inspect capsule
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
