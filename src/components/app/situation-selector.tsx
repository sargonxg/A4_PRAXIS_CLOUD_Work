'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { usePraxisRoute } from '@/lib/utils/routes';
import { useSituationStore } from '@/stores/situation-store';
import { cn } from '@/lib/utils/cn';
import { ChevronDown, Plus, Globe, Loader2, Trash2, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { SYRIA_DEMO_CASE_ID } from '@/lib/constants/syria-demo-case';
import { DEMO_TEMPLATES, getDemoTemplate, type DemoTemplate } from '@/lib/constants/demo-templates';
import type { Situation } from '@/types/situation';

interface SituationSelectorProps {
  collapsed?: boolean;
  activeSituationId: string | null;
  onSelect: (id: string) => void;
}

function dedupeSyriaSituations(list: Situation[]) {
  const seen = new Set<string>();
  return list.filter((s) => {
    const isSyria =
      s.id === SYRIA_DEMO_CASE_ID ||
      /syria/i.test(s.name) ||
      /syrian arab republic/i.test(s.region ?? '');
    const key = isSyria ? 'canonical-syria-case' : s.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function SituationSelector({ collapsed, activeSituationId, onSelect }: SituationSelectorProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const route = usePraxisRoute();
  const situations = useSituationStore((s) => s.situations);
  const setSituations = useSituationStore((s) => s.setSituations);
  const removeSituation = useSituationStore((s) => s.removeSituation);
  const setStoreLoading = useSituationStore((s) => s.setLoading);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const activeCaseParam = searchParams.get('case');
  const activeTemplate = getDemoTemplate(activeCaseParam);

  useEffect(() => {
    if (user?.isDemo) {
      setLoading(false);
      setStoreLoading(false);
      return;
    }

    fetch('/api/situations')
      .then((res) => {
        if (!res.ok) return { situations: [] };
        return res.json();
      })
      .then((data) => {
        const list = dedupeSyriaSituations(data.situations || []);
        setSituations(list);
        if (!activeSituationId && list.length > 0) {
          onSelect(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setStoreLoading(false); });
  }, [user, activeSituationId, onSelect, setSituations, setStoreLoading]);

  /** Switch to a demo template — navigate to its default route, preserve recording flag. */
  const switchTemplate = (template: DemoTemplate) => {
    const recording = searchParams.get('recording') === '1' ? '&recording=1' : '';
    const sep = template.defaultRoute.includes('?') ? '&' : '?';
    const url = `${route(template.defaultRoute.split('?')[0])}${sep}case=${template.id}${recording}`;
    router.push(url);
    setOpen(false);
  };

  const visibleSituations = dedupeSyriaSituations(situations);
  const activeSituation = visibleSituations.find((s) => s.id === activeSituationId) ?? visibleSituations[0];

  /** Active label = template if `?case=` is set, else current situation. */
  const activeLabel = activeTemplate
    ? activeTemplate.shortName
    : activeSituation?.name ?? 'Select workspace';
  const activeSubLabel = activeTemplate
    ? activeTemplate.region
    : activeSituation?.region ?? '';

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

  if (collapsed) {
    return (
      <div className="mx-2 mb-3 flex items-center justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-diplomatic-blue/10 text-diplomatic-blue">
          {activeTemplate ? (
            <span className="text-sm">{activeTemplate.flag}</span>
          ) : (
            <Globe className="h-4 w-4" />
          )}
        </div>
      </div>
    );
  }

  const isDemoUser = Boolean(user?.isDemo);
  const showTemplateGroup = isDemoUser || visibleSituations.length === 0 || Boolean(activeTemplate);

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
          {activeTemplate ? (
            <span className="text-sm shrink-0" aria-hidden>{activeTemplate.flag}</span>
          ) : (
            <Globe className="h-3.5 w-3.5 shrink-0 text-diplomatic-blue" />
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-navy-900">{activeLabel}</p>
            {activeSubLabel && (
              <p className="truncate text-[10px] text-navy-500">{activeSubLabel}</p>
            )}
          </div>
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-navy-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[var(--color-app-border)] bg-white shadow-lg">
          <div className="max-h-72 overflow-y-auto py-1">
            {/* My workspaces (real users) */}
            {!isDemoUser && visibleSituations.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-navy-400">My workspaces</p>
                {visibleSituations.map((sit) => (
                  <div key={sit.id} className="flex items-center">
                    <button
                      onClick={() => { onSelect(sit.id); setOpen(false); }}
                      className={cn(
                        'flex flex-1 items-center gap-2 px-3 py-2 text-left transition-colors',
                        sit.id === activeSituationId && !activeTemplate
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(route(`/situations/${sit.id}/settings`));
                        setOpen(false);
                      }}
                      className="shrink-0 p-2 text-navy-300 hover:text-diplomatic-blue transition-colors"
                      title="Edit situation settings"
                    >
                      <SettingsIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`Delete "${sit.name}"? This cannot be undone.`)) return;
                        await fetch(`/api/situations/${sit.id}`, { method: 'DELETE' });
                        removeSituation(sit.id);
                      }}
                      className="shrink-0 p-2 text-navy-300 hover:text-red-500 transition-colors"
                      title="Delete situation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Demo templates */}
            {showTemplateGroup && (
              <>
                <div className="mt-1 flex items-center gap-1 px-3 pt-2 pb-1">
                  <Sparkles className="h-3 w-3 text-gold-500" />
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-gold-700">Demo templates</p>
                </div>
                {DEMO_TEMPLATES.map((tpl) => {
                  const isActive = activeTemplate?.id === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => switchTemplate(tpl)}
                      className={cn(
                        'flex w-full items-start gap-2 px-3 py-2 text-left transition-colors',
                        isActive
                          ? 'bg-gold-500/10 text-gold-800'
                          : 'text-navy-700 hover:bg-gold-500/5'
                      )}
                    >
                      <span className="text-base leading-tight" aria-hidden>{tpl.flag}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{tpl.name}</p>
                        <p className="truncate text-[10px] text-navy-500">{tpl.persona}</p>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {!isDemoUser && (
            <div className="border-t border-[var(--color-app-border)] p-1">
              <button
                onClick={() => { router.push(route('/situations/new')); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-medium text-gold-700 transition-colors hover:bg-gold-500/5"
              >
                <Plus className="h-3.5 w-3.5" />
                Create new workspace
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
