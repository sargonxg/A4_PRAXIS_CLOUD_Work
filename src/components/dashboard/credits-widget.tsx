'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { WidgetShell } from './widget-shell';

export function CreditsWidget() {
  const { credits } = useAuth();
  const [spend7d, setSpend7d] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setSpend7d(null);

    fetch('/api/credits/burn-rate')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data: { last7dSpend: number }) => {
        if (!cancelled) setSpend7d(data.last7dSpend ?? 0);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const daysLeft = spend7d && spend7d > 0
    ? Math.max(0, Math.floor(credits / (spend7d / 7)))
    : null;

  return (
    <WidgetShell
      title="Credits"
      subtitle="Balance + 7-day burn"
      href="/settings#billing"
      loading={spend7d == null && !error}
      error={error}
      onRetry={() => setReloadToken((t) => t + 1)}
      icon={<Zap className="h-4 w-4" />}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xl font-semibold text-slate-100">
          {credits.toLocaleString()} <span className="text-xs font-normal text-slate-500">remaining</span>
        </span>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>7-day spend:</span>
          <span className="text-slate-200">{(spend7d ?? 0).toLocaleString()}</span>
          {daysLeft != null ? (
            <span className="text-slate-500">· ~{daysLeft}d runway</span>
          ) : null}
        </div>
      </div>
    </WidgetShell>
  );
}
