'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSituationStore } from '@/stores/situation-store';
import type { Situation } from '@/types/situation';

export function DemoClaimButton({ demoCaseId, className }: { demoCaseId: string; className?: string }) {
  const router = useRouter();
  const addSituation = useSituationStore((state) => state.addSituation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyToWorkspace() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/situations/copy-from-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoCaseId }),
      });

      if (response.status === 401) {
        const next = `/api/situations/copy-from-demo?demoCaseId=${encodeURIComponent(demoCaseId)}`;
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      if (!response.ok) throw new Error(`Copy failed (${response.status})`);
      const payload = await response.json() as { redirectUrl?: string; situation?: Situation };
      if (payload.situation) addSituation(payload.situation);
      router.push(payload.redirectUrl ?? '/app/workbench');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not copy this demo case.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={() => void copyToWorkspace()}
        disabled={loading}
        className={className}
      >
        {loading ? 'Copying case...' : 'Use this case in my own workspace'}
      </button>
      {error ? <span className="text-xs font-medium text-red-200">{error}</span> : null}
    </div>
  );
}
