'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';

type RuntimeHealthStatus = 'ok' | 'degraded' | 'down';
type RuntimeHealthPayload = {
  status: RuntimeHealthStatus;
  summary: string;
  checkedAt: string;
  debugHref: '/app/settings?tab=system';
};

const statusStyles: Record<RuntimeHealthStatus | 'loading', string> = {
  ok: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-rose-600',
  loading: 'bg-slate-400',
};

export function RuntimeHealthSemaphore({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [payload, setPayload] = useState<RuntimeHealthPayload | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch('/api/health/runtime', { cache: 'no-store' });
        const next = await response.json();
        if (cancelled) return;
        if (!response.ok || !isRuntimeHealthPayload(next)) {
          setFetchFailed(true);
          return;
        }
        setPayload(next);
        setFetchFailed(false);
      } catch {
        if (!cancelled) setFetchFailed(true);
      }
    }

    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const status = fetchFailed ? 'degraded' : payload?.status ?? 'loading';
  const label = fetchFailed ? 'Some systems degraded' : payload?.summary ?? 'Checking systems';
  const href = useMemo(() => {
    const target = '/app/settings?tab=system';
    return isAuthenticated ? target : `/login?redirect=${encodeURIComponent(target)}`;
  }, [isAuthenticated]);

  return (
    <Link
      href={href}
      data-testid="runtime-health-semaphore-link"
      className="od-praxis-control inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950"
    >
      <span className={cn('h-2 w-2 rounded-full', statusStyles[status])} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

function isRuntimeHealthPayload(value: unknown): value is RuntimeHealthPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<RuntimeHealthPayload>;
  return (
    (candidate.status === 'ok' || candidate.status === 'degraded' || candidate.status === 'down') &&
    typeof candidate.summary === 'string' &&
    typeof candidate.checkedAt === 'string'
  );
}
