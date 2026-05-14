'use client';

/**
 * CapsuleToolbar — small client island for /app/contexts that owns
 * the active capsule id and renders Fork + Share + LineageTree.
 *
 * Brief: Claude Code CC-8.
 */

import { useEffect, useState } from 'react';
import { ForkButton, CapsuleLineageTree } from '@/components/cores/CapsuleLineageTree';
import { ShareCapsuleButton } from '@/components/cores/ShareCapsuleButton';
import type { PraxisCapsule } from '@/lib/context/capsule-service';

export function CapsuleToolbar() {
  const [capsuleId, setCapsuleId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      fetch('/api/context/capsules', { credentials: 'include' })
        .then((r) => (r.ok ? (r.json() as Promise<{ capsules: PraxisCapsule[] }>) : Promise.reject(new Error(String(r.status)))))
        .then((body) => {
          if (cancelled) return;
          setCapsuleId(body.capsules[0]?.capsuleId ?? null);
        })
        .catch(() => undefined);
    }
    load();
    const onMutated = () => load();
    window.addEventListener('capsule-mutated', onMutated);
    return () => {
      cancelled = true;
      window.removeEventListener('capsule-mutated', onMutated);
    };
  }, []);

  return (
    <section className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A5A00]">Capsule lineage</p>
          <p className="mt-0.5 text-xs text-slate-600">
            Forks and shares stay versioned. Click any node to switch capsule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ForkButton capsuleId={capsuleId} />
          <ShareCapsuleButton capsuleId={capsuleId} />
        </div>
      </header>
      <div className="overflow-x-auto">
        <CapsuleLineageTree capsuleId={capsuleId} />
      </div>
    </section>
  );
}
