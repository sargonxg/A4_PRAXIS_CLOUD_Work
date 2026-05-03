'use client';

import { useEffect, useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { buildTrustState } from '@/lib/trust/trust-state';
import { cn } from '@/lib/utils/cn';

export function TrustDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const trust = buildTrustState(undefined, activeModel ?? undefined);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/api/health/provider', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ proModel?: string; model?: string }> : null)
      .then((payload) => {
        if (!cancelled && payload) setActiveModel(payload.proModel ?? payload.model ?? null);
      })
      .catch(() => {
        if (!cancelled) setActiveModel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="PRAXIS trust posture">
      <button type="button" className="absolute inset-0 bg-navy-950/30" onClick={onClose} aria-label="Close trust drawer backdrop" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Trust posture</p>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-navy-950">Why should I trust this workspace?</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close trust drawer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <TrustSection title="Active model">
          <p className="text-sm font-semibold text-navy-950">{trust.activeModel}</p>
          <p className="mt-1 text-xs text-slate-600">Current model registry snapshot: {trust.modelCurrentAsOf}</p>
        </TrustSection>

        <TrustSection title="Syria source library">
          <div className="space-y-2">
            {trust.sourceDomains.slice(0, 10).map((source) => (
              <div key={source.name} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-navy-950">{source.name}</p>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', source.liveEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700')}>
                    {source.liveEnabled ? 'live' : 'catalog'}
                  </span>
                </div>
                <p className="mt-1 truncate text-[11px] text-slate-500">{source.tier} · {source.url}</p>
              </div>
            ))}
          </div>
        </TrustSection>

        <TrustSection title="Last evaluation">
          <div className="grid gap-2">
            {trust.evaluation.map((metric) => (
              <div key={metric.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-xs font-medium text-navy-900">{metric.label}</span>
                <span className="text-[11px] font-semibold text-amber-700">{metric.value}</span>
              </div>
            ))}
          </div>
        </TrustSection>

        <TrustSection title="Privacy posture">
          <ul className="space-y-2 text-xs leading-5 text-slate-700">
            {trust.privacy.map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </TrustSection>

        <TrustSection title="What this system does not do">
          <ul className="space-y-2 text-xs leading-5 text-slate-700">
            {trust.limits.map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </TrustSection>
      </aside>
    </div>
  );
}

function TrustSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}
