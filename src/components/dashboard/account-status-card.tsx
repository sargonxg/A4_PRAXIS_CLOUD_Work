'use client';

/**
 * AccountStatusCard — subscription tier + credits + premium key status.
 * Honest surface for what the user has unlocked vs what they could unlock,
 * with click-through to upgrade or to the API keys settings page.
 */

import { useEffect, useState } from 'react';
import { Crown, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { PraxisLink } from '@/components/shared/praxis-link';
import { WidgetShell } from './widget-shell';

interface KeyStatus {
  provider: 'google_ai' | 'ucdp';
  present: boolean;
  effective: boolean;
}

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'text-navy-500' },
  analyst: { label: 'Analyst', color: 'text-emerald-700' },
  team: { label: 'Team', color: 'text-diplomatic-blue' },
  enterprise: { label: 'Enterprise', color: 'text-gold-600' },
};

export function AccountStatusCard() {
  const { user, credits } = useAuth();
  const [keys, setKeys] = useState<KeyStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.isDemo) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/settings/api-keys', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = (await res.json()) as { statuses?: Record<string, { present: boolean; effective: boolean }> };
        const items: KeyStatus[] = (Object.entries(data.statuses ?? {}) as Array<[KeyStatus['provider'], { present: boolean; effective: boolean }]>)
          .filter(([k]) => k === 'google_ai' || k === 'ucdp')
          .map(([k, v]) => ({ provider: k, present: v.present, effective: v.effective }));
        if (!cancelled) setKeys(items);
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const tier = user?.subscription ?? 'free';
  const tierStyle = TIER_LABELS[tier] ?? TIER_LABELS.free;
  const isPaid = tier !== 'free';

  return (
    <WidgetShell
      title="Account status"
      subtitle="Plan · credits · keys"
      icon={<Crown className="h-4 w-4" />}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Plan</p>
            <p className={`text-sm font-semibold ${tierStyle.color}`}>{tierStyle.label}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Credits</p>
            <p className="text-sm font-semibold text-navy-900">{credits.toLocaleString()}</p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Premium keys</p>
          {loading ? (
            <p className="text-xs text-navy-400">Loading…</p>
          ) : keys.length === 0 ? (
            <p className="text-xs text-navy-500">
              <KeyRound className="mr-1 inline h-3 w-3" />
              Google AI and UCDP can be configured from API keys.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {keys.map((k) => (
                <li key={k.provider} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-navy-700">{k.provider}</span>
                  <span
                    className={
                      k.effective
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }
                  >
                    {k.effective ? 'connected' : 'not connected'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <PraxisLink
            href="/app/settings/api-keys"
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-navy-700 hover:bg-slate-50"
          >
            <KeyRound className="h-3 w-3" /> Manage keys
          </PraxisLink>
          {!isPaid ? (
            <PraxisLink
              href="/pricing"
              className="inline-flex items-center gap-1 rounded-md bg-gold-500/15 px-2.5 py-1 text-[11px] font-semibold text-gold-700 ring-1 ring-inset ring-gold-500/30 hover:bg-gold-500/25"
            >
              <Sparkles className="h-3 w-3" /> Upgrade
            </PraxisLink>
          ) : null}
        </div>
      </div>
    </WidgetShell>
  );
}
