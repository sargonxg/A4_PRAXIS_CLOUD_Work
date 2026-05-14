'use client';

/**
 * useQuota — read the user's monthly subscription quota.
 *
 * Brief: Claude Code CC-10. Reads /api/billing/quota (Codex CX-9).
 * Falls back to a safe "free tier" default while the endpoint isn't
 * shipped so the QuotaIndicator UI doesn't 500 on first paint.
 */

import { useEffect, useState } from 'react';

export interface Quota {
  tier: 'free' | 'practitioner' | 'team';
  flowsUsed: number;
  flowsLimit: number;
  tokensUsed: number;
  tokensLimit: number;
  pathsUnlocked: number;
  pathsLimit: number;
  resetAt: string;
}

const FALLBACK: Quota = {
  tier: 'free',
  flowsUsed: 0,
  flowsLimit: 50,
  tokensUsed: 0,
  tokensLimit: 100_000,
  pathsUnlocked: 5,
  pathsLimit: 5,
  resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export function useQuota(): { quota: Quota; loading: boolean; error: string | null; refresh: () => void } {
  const [quota, setQuota] = useState<Quota>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/billing/quota', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return (await r.json()) as Quota;
      })
      .then((q) => {
        if (!cancelled) setQuota(q);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Endpoint not shipped yet — keep fallback, set error for diagnostics.
        setError(err instanceof Error ? err.message : 'quota fetch failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { quota, loading, error, refresh: () => setTick((t) => t + 1) };
}
