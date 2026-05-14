'use client';

import { useEffect, useState } from 'react';
import type { PraxisCapsule } from '@/lib/context/capsule-service';

export function useCapsuleHistory(capsuleId: string | null | undefined, limit = 10) {
  const [versions, setVersions] = useState<PraxisCapsule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!capsuleId) {
      setVersions([]);
      setLoading(false);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/history?limit=${Math.max(1, Math.min(limit, 25))}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`capsule_history_${response.status}`);
        return response.json() as Promise<{ versions?: PraxisCapsule[] }>;
      })
      .then((payload) => setVersions(Array.isArray(payload.versions) ? payload.versions : []))
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : String(err));
        setVersions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [capsuleId, limit]);

  return { versions, loading, error };
}
