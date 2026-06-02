'use client';

import { useState } from 'react';
import { Loader2, Plus, Wand2 } from 'lucide-react';
import { createQuickContextFromDomain } from '@/lib/context/quick-context-builder-client';
import {
  STARTER_CONTEXT_DOMAINS,
  getStarterContextDomain,
  type StarterContextDomainId,
} from '@/lib/context/starter-context-domains';
import type { ActiveContextStackState } from '@/lib/context/active-context-stack';
import type { LightweightContextCoreLite } from '@/lib/context/context-core-lite';
import { useSituationStore } from '@/stores/situation-store';
import { cn } from '@/lib/utils/cn';

export function InlineQuickContextBuilder({
  className,
  onCreated,
  saveStack,
  variant = 'light',
}: {
  className?: string;
  onCreated?: (result: { capsuleId: string; situationId: string; contextPackageId: string }) => void;
  saveStack: (patch: Partial<ActiveContextStackState>) => Promise<ActiveContextStackState>;
  variant?: 'light' | 'dark';
}) {
  const addSituation = useSituationStore((state) => state.addSituation);
  const setActiveSituation = useSituationStore((state) => state.setActiveSituation);
  const [selected, setSelected] = useState<StarterContextDomainId>('policy');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('Choose a starter context, then attach it to this Ask thread.');
  const [coreLite, setCoreLite] = useState<LightweightContextCoreLite | null>(null);
  const domain = getStarterContextDomain(selected);
  const dark = variant === 'dark';

  async function createAndAttach() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await createQuickContextFromDomain({
        domain,
        addSituation,
        setActiveSituation,
        saveStack,
        onProgress: setNote,
      });
      setCoreLite(result.coreLite);
      setNote(`${domain.label} context attached to Ask PRAXIS.`);
      onCreated?.({
        capsuleId: result.capsuleId,
        situationId: result.situationId,
        contextPackageId: result.contextPackageId,
      });
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Could not build context.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      data-testid="ask-inline-context-builder"
      className={cn(
        'rounded-[var(--radius-md)] border p-3',
        dark
          ? 'border-slate-700 bg-slate-900 text-slate-100'
          : 'border-slate-200 bg-white text-slate-900',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('text-[10px] font-bold uppercase tracking-[0.14em]', dark ? 'text-[color:var(--color-gold-300)]' : 'text-[color:var(--color-gold-700)]')}>
            Build context
          </p>
          <h3 className={cn('mt-1 text-sm font-semibold', dark ? 'text-white' : 'text-slate-950')}>
            Create a reviewable capsule without leaving Ask.
          </h3>
        </div>
        <Wand2 className={cn('h-4 w-4', dark ? 'text-[color:var(--color-gold-300)]' : 'text-[color:var(--color-gold-700)]')} />
      </div>

      <div className="mt-3 flex gap-1 overflow-x-auto pb-1" aria-label="Context starter domains">
        {STARTER_CONTEXT_DOMAINS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item.id)}
            aria-pressed={selected === item.id}
            className={cn(
              'shrink-0 rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-[11px] font-semibold transition',
              selected === item.id
                ? dark
                  ? 'border-[color:var(--color-gold-400)] bg-[color:var(--color-gold-400)]/15 text-[color:var(--color-gold-100)]'
                  : 'border-slate-950 bg-slate-950 text-white'
                : dark
                  ? 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <BuilderCell label="User" value={domain.userRole.replace(/_/g, ' ')} dark={dark} />
        <BuilderCell label="Situation" value={domain.label} dark={dark} />
        <BuilderCell label="Tools" value="sourceability + context resolve" dark={dark} />
        <BuilderCell label="Output" value={domain.outputFormats[0] ?? 'memo'} dark={dark} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className={cn('max-w-xl text-xs leading-5', dark ? 'text-slate-300' : 'text-slate-600')}>
          {coreLite ? `${coreLite.title} / ${coreLite.healthScore}/100 / ${coreLite.askResolvable ? 'resolvable' : 'needs review'}` : note}
        </p>
        <button
          type="button"
          onClick={() => void createAndAttach()}
          disabled={busy}
          className={cn(
            'inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] px-3 text-xs font-semibold transition disabled:opacity-60',
            dark ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-950 text-white hover:bg-slate-800',
          )}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Create and attach
        </button>
      </div>
    </section>
  );
}

function BuilderCell({ dark, label, value }: { dark: boolean; label: string; value: string }) {
  return (
    <div className={cn('rounded-[var(--radius-sm)] border px-2.5 py-2', dark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
      <p className={cn('text-[10px] font-bold uppercase tracking-[0.12em]', dark ? 'text-slate-500' : 'text-slate-500')}>{label}</p>
      <p className={cn('mt-1 truncate text-xs font-semibold capitalize', dark ? 'text-slate-100' : 'text-slate-900')}>{value}</p>
    </div>
  );
}
