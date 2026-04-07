/**
 * useToolData — real-time Firestore subscription for tool output data.
 *
 * Usage in any tool page:
 *   const { data, loading, hasData } = useToolData<ScenarioData>('scenario_analysis');
 */
'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/auth-context';
import { subscribeToolData, type ToolName } from '@/lib/services/tool-data-service';
import { useSituationStore } from '@/stores/situation-store';

interface UseToolDataResult<T> {
  data: T | null;
  loading: boolean;
  hasData: boolean;
  situationId: string | null;
  uid: string | null;
}

export function useToolData<T = unknown>(toolName: ToolName): UseToolDataResult<T> {
  const { user } = useAuth();
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const uid = user?.id ?? null;
  const situationId = activeSituation?.id ?? null;

  useEffect(() => {
    if (!uid || !situationId) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToolData<T>(uid, situationId, toolName, (incoming) => {
      setData(incoming);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid, situationId, toolName]);

  return {
    data,
    loading,
    hasData: data !== null,
    situationId,
    uid,
  };
}
