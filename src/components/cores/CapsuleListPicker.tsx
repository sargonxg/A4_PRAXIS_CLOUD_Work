'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { cn } from '@/lib/utils/cn';

interface CapsuleListPickerProps {
  activeCapsuleId: string | null;
  onSelect: (capsuleId: string) => void;
  onCreate?: () => void;
  refreshKey?: number;
}

export function CapsuleListPicker({ activeCapsuleId, onSelect, onCreate, refreshKey }: CapsuleListPickerProps) {
  const [capsules, setCapsules] = useState<PraxisCapsule[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/context/capsules', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { capsules: PraxisCapsule[] }) => {
        if (cancelled) return;
        setCapsules(body.capsules);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const active = capsules.find((c) => c.capsuleId === activeCapsuleId) ?? capsules[0] ?? null;

  async function handleCreate() {
    setBusy(true);
    try {
      const res = await fetch('/api/context/capsules', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'create', label: `Capsule ${new Date().toISOString().slice(0, 10)}` }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { capsule: PraxisCapsule };
      setCapsules((prev) => [body.capsule, ...prev]);
      onSelect(body.capsule.capsuleId);
      onCreate?.();
      setOpen(false);
      window.dispatchEvent(new CustomEvent('capsule-mutated', { detail: { capsuleId: body.capsule.capsuleId } }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="max-w-[16ch] truncate">{active?.label ?? 'No capsule'}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open ? (
        <div className="absolute left-0 z-40 mt-1 w-72 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          <ul role="listbox" className="max-h-64 overflow-y-auto">
            {capsules.map((c) => (
              <li key={c.capsuleId}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(c.capsuleId);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50',
                    c.capsuleId === activeCapsuleId && 'bg-emerald-50/60',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-navy-950">{c.label}</span>
                    <span className="block truncate text-[10px] text-slate-500">
                      v{c.version} · {c.scope}
                      {c.archivedAt ? ' · archived' : ''}
                    </span>
                  </span>
                  {c.capsuleId === activeCapsuleId ? <Check className="h-3 w-3 text-emerald-600" /> : null}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy}
            className="flex w-full items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-diplomatic-blue hover:bg-slate-100 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            New capsule
          </button>
        </div>
      ) : null}
    </div>
  );
}
