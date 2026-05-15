'use client';

import { useState } from 'react';
import { CoreLibraryRail } from '@/components/cores/CoreLibraryRail';
import { CapsuleBoard } from '@/components/cores/capsule-board';
import { CapsuleReadinessRail } from '@/components/cores/CapsuleReadinessRail';
import { CapsuleListPicker } from '@/components/cores/CapsuleListPicker';
import { CapsuleManagerMenu } from '@/components/cores/CapsuleManagerMenu';
import { CapsuleLineageTree } from '@/components/cores/CapsuleLineageTree';
import type { PraxisCapsule } from '@/lib/context/capsule-service';

interface ContextBuilderRoomProps {
  situationId?: string;
}

export function ContextBuilderRoom({ situationId }: ContextBuilderRoomProps) {
  const [activeCapsule, setActiveCapsule] = useState<PraxisCapsule | null>(null);
  const [override, setOverride] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/85 px-5 py-4 shadow-sm shadow-navy-950/5 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Context Builder</p>
          <CapsuleListPicker
            activeCapsuleId={activeCapsule?.capsuleId ?? null}
            onSelect={(id) => setOverride(id)}
            refreshKey={refreshKey}
          />
          {activeCapsule ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
              v{activeCapsule.version} · {activeCapsule.scope}
            </span>
          ) : null}
        </div>
        <CapsuleManagerMenu
          capsule={activeCapsule}
          onChanged={(next) => {
            if (!next) {
              setOverride(null);
              setActiveCapsule(null);
            }
            setRefreshKey((k) => k + 1);
          }}
        />
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="hidden lg:block">
          <CoreLibraryRail />
        </aside>
        <div className="min-w-0 flex-1">
          <CapsuleBoard
            situationId={situationId}
            hideLibraryRail
            hideHeader
            capsuleIdOverride={override}
            onActiveCapsuleChange={setActiveCapsule}
          />
          <section className="mt-4 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm shadow-navy-950/5 backdrop-blur">
            <header className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">Lineage</p>
              <p className="text-[10px] text-slate-500">Forks and shares stay versioned.</p>
            </header>
            <div className="overflow-x-auto">
              <CapsuleLineageTree capsuleId={activeCapsule?.capsuleId ?? null} />
            </div>
          </section>
        </div>
        <CapsuleReadinessRail capsule={activeCapsule} />
      </div>
    </main>
  );
}
