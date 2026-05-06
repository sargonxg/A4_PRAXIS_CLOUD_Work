'use client';

import { CreditCard } from 'lucide-react';

export function CostCapPanel() {
  const used = 312;
  const cap = 500;
  const pct = Math.round((used / cap) * 100);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-navy-500">
        <CreditCard className="h-3.5 w-3.5" /> Cost cap
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-navy-900">{pct}%</p>
          <p className="text-xs text-navy-500">{used} of {cap} monthly AI credits used</p>
        </div>
        <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50">
          Request lift
        </button>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gold-500" style={{ width: `${pct}%` }} />
      </div>
    </section>
  );
}
