'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getToolById } from '@/lib/constants/tool-registry';

interface UsePersistedToolDataReturn {
  data: unknown | null;
  metadata: Record<string, unknown> | null;
  sourceReceipts: unknown[];
  profileVersion?: number;
  toolRunId?: string | null;
  isLoading: boolean;
  generatedAt: string | null;
  version: number;
  isStale: boolean;
  save: (data: unknown) => Promise<void>;
  clear: () => Promise<void>;
}

export function usePersistedToolData(
  toolId: string,
  situationId: string | undefined
): UsePersistedToolDataReturn {
  const [data, setData] = useState<unknown | null>(null);
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);
  const [sourceReceipts, setSourceReceipts] = useState<unknown[]>([]);
  const [profileVersion, setProfileVersion] = useState<number | undefined>(undefined);
  const [toolRunId, setToolRunId] = useState<string | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [version, setVersion] = useState<number>(1);
  const fetchedRef = useRef<string | null>(null);

  const staleAfterHours = useMemo(() => getToolById(toolId)?.staleAfterHours, [toolId]);

  // Use primitive dep (number | undefined) instead of object ref — rerender-dependencies
  const isStale = useMemo(() => {
    if (!generatedAt || !staleAfterHours) return false;
    const ageMs = Date.now() - new Date(generatedAt).getTime();
    return ageMs > staleAfterHours * 60 * 60 * 1000;
  }, [generatedAt, staleAfterHours]);

  // Fetch persisted data on mount / when situationId changes
  useEffect(() => {
    if (!situationId || !toolId) {
      setData(null);
      setMetadata(null);
      setSourceReceipts([]);
      setProfileVersion(undefined);
      setToolRunId(undefined);
      setGeneratedAt(null);
      setVersion(1);
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
          setMetadata(result.metadata ?? null);
          setSourceReceipts(Array.isArray(result.sourceReceipts) ? result.sourceReceipts : []);
          setProfileVersion(typeof result.profileVersion === 'number' ? result.profileVersion : undefined);
          setToolRunId(typeof result.toolRunId === 'string' ? result.toolRunId : result.toolRunId === null ? null : undefined);
          setGeneratedAt(result.generatedAt ?? null);
          setVersion(result.version ?? 1);
        } else {
          setData(null);
          setMetadata(null);
          setSourceReceipts([]);
          setProfileVersion(undefined);
          setToolRunId(undefined);
          setGeneratedAt(null);
          setVersion(1);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setMetadata(null);
          setSourceReceipts([]);
          setProfileVersion(undefined);
          setToolRunId(undefined);
          setGeneratedAt(null);
          setVersion(1);
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
      setMetadata(null);
      setSourceReceipts([]);
      setProfileVersion(undefined);
      setToolRunId(undefined);
      const now = new Date().toISOString();
      setGeneratedAt(now);
      setVersion(v => v + 1);

      try {
        const res = await fetch('/api/tool-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId, situationId, data: newData }),
        });
        if (res.ok) {
          const result = await res.json().catch(() => null);
          if (result?.version) setVersion(result.version);
          if (result?.generatedAt) setGeneratedAt(result.generatedAt);
        }
      } catch (err) {
        console.error('[use-persisted-tool-data] Save failed:', err);
      }
    },
    [toolId, situationId]
  );

  const clear = useCallback(async () => {
    if (!situationId || !toolId) return;

    setData(null);
    setMetadata(null);
    setSourceReceipts([]);
    setProfileVersion(undefined);
    setToolRunId(undefined);
    setGeneratedAt(null);
    setVersion(1);
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

  return {
    data,
    metadata,
    sourceReceipts,
    profileVersion,
    toolRunId,
    isLoading,
    generatedAt,
    version,
    isStale,
    save,
    clear,
  };
}
