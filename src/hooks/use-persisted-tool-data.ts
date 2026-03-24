'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePersistedToolDataReturn {
  data: unknown | null;
  isLoading: boolean;
  generatedAt: string | null;
  save: (data: unknown) => Promise<void>;
  clear: () => Promise<void>;
}

export function usePersistedToolData(
  toolId: string,
  situationId: string | undefined
): UsePersistedToolDataReturn {
  const [data, setData] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);

  // Fetch persisted data on mount / when situationId changes
  useEffect(() => {
    if (!situationId || !toolId) {
      setData(null);
      setGeneratedAt(null);
      return;
    }

    // Avoid refetching for the same situation+tool combo
    const cacheKey = `${situationId}:${toolId}`;
    if (fetchedRef.current === cacheKey) return;

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/tool-data?toolId=${encodeURIComponent(toolId)}&situationId=${encodeURIComponent(situationId)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((result) => {
        if (cancelled) return;
        fetchedRef.current = cacheKey;
        if (result.data != null) {
          setData(result.data);
          setGeneratedAt(result.generatedAt ?? null);
        } else {
          setData(null);
          setGeneratedAt(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setGeneratedAt(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [toolId, situationId]);

  const save = useCallback(
    async (newData: unknown) => {
      if (!situationId || !toolId) return;

      setData(newData);
      const now = new Date().toISOString();
      setGeneratedAt(now);

      try {
        await fetch('/api/tool-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId, situationId, data: newData }),
        });
      } catch (err) {
        console.error('[use-persisted-tool-data] Save failed:', err);
      }
    },
    [toolId, situationId]
  );

  const clear = useCallback(async () => {
    if (!situationId || !toolId) return;

    setData(null);
    setGeneratedAt(null);
    // Reset the fetch ref so next mount will re-fetch
    fetchedRef.current = null;

    try {
      await fetch(
        `/api/tool-data?toolId=${encodeURIComponent(toolId)}&situationId=${encodeURIComponent(situationId)}`,
        { method: 'DELETE' }
      );
    } catch (err) {
      console.error('[use-persisted-tool-data] Delete failed:', err);
    }
  }, [toolId, situationId]);

  return { data, isLoading, generatedAt, save, clear };
}
