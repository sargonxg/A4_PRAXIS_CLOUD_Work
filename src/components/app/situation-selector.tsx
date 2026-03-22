'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { usePraxisRoute } from '@/lib/utils/routes';
import { useSituationStore } from '@/stores/situation-store';
import { cn } from '@/lib/utils/cn';
import { ChevronDown, Plus, Globe, Loader2 } from 'lucide-react';

interface SituationSelectorProps {
  collapsed?: boolean;
  activeSituationId: string | null;
  onSelect: (id: string) => void;
}

export function SituationSelector({ collapsed, activeSituationId, onSelect }: SituationSelectorProps) {
  const { user } = useAuth();
  const router = useRouter();
  const route = usePraxisRoute();
  const { situations, setSituations, setLoading: setStoreLoading } = useSituationStore();
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user?.isDemo) {
      setLoading(false);
      return;
    }

    fetch('/api/situations')
      .then((res) => res.json())
      .then((data) => {
        const list = data.situations || [];
        setSituations(list);
        if (!activeSituationId && list.length > 0) {
          onSelect(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setStoreLoading(false); });
  }, [user, activeSituationId, onSelect, setSituations, setStoreLoading]);

  if (user?.isDemo) return null;

  const activeSituation = situations.find((s) => s.id === activeSituationId);

  if (loading) {
    return (
      <div className="mx-2 mb-3 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-navy-400" />
          {!collapsed && <span className="text-xs text-navy-400">Loading...</span>}
        </div>
      </div>
    );
  }

  if (situations.length === 0) {
    return (
      <div className="mx-2 mb-3">
        <button
          onClick={() => router.push(route('/situations/new'))}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border border-dashed border-gold-500/30 bg-gold-500/5 px-3 py-2.5',
            'text-xs font-medium text-gold-700 transition-colors hover:bg-gold-500/10 hover:border-gold-500/50'
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          {!collapsed && <span>Create Your First Situation</span>}
        </button>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="mx-2 mb-3 flex items-center justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-diplomatic-blue/10 text-diplomatic-blue">
          <Globe className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-2 mb-3 relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2.5',
          'text-left transition-colors hover:bg-[var(--color-app-surface-alt)]'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="h-3.5 w-3.5 shrink-0 text-diplomatic-blue" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-navy-900">
              {activeSituation?.name || 'Select Situation'}
            </p>
            {activeSituation && (
              <p className="truncate text-[10px] text-navy-500">{activeSituation.region}</p>
            )}
          </div>
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-navy-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[var(--color-app-border)] bg-white shadow-lg">
          <div className="max-h-48 overflow-y-auto py-1">
            {situations.map((sit) => (
              <button
                key={sit.id}
                onClick={() => { onSelect(sit.id); setOpen(false); }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors',
                  sit.id === activeSituationId
                    ? 'bg-diplomatic-blue/5 text-diplomatic-blue'
                    : 'text-navy-700 hover:bg-[var(--color-app-surface-alt)]'
                )}
              >
                <Globe className="h-3 w-3 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{sit.name}</p>
                  <p className="truncate text-[10px] text-navy-500">{sit.region} · {sit.actorCount} actors</p>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-[var(--color-app-border)] p-1">
            <button
              onClick={() => { router.push(route('/situations/new')); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-medium text-gold-700 transition-colors hover:bg-gold-500/5"
            >
              <Plus className="h-3.5 w-3.5" />
              Create New Situation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
