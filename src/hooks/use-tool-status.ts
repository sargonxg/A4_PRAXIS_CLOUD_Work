'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export type ToolHealth = 'green' | 'yellow' | 'red';
export type ResearchStatus =
  | 'idle'
  | 'pending'
  | 'fetching-sources'
  | 'synthesizing'
  | 'saving'
  | 'complete'
  | 'failed';

export interface ToolStatusInfo {
  health: ToolHealth;
  researchStatus: ResearchStatus;
  generatedAt: string | null;
  isStale: boolean;
  isFresh: boolean;
  isResearching: boolean;
  confidence: number | null;
  sourcesUsed: string[];
  lastError: string | null;
  refreshTrigger: () => void;
}

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
const FRESH_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
const POLL_INTERVAL_MS = 5_000; // 5 seconds while researching

const ACTIVE_RESEARCH_STATES: ReadonlySet<ResearchStatus> = new Set([
  'pending',
  'fetching-sources',
  'synthesizing',
  'saving',
]);

function isResearchActive(status: ResearchStatus): boolean {
  return ACTIVE_RESEARCH_STATES.has(status);
}

function computeFreshness(generatedAt: string | null): {
  isStale: boolean;
  isFresh: boolean;
} {
  if (!generatedAt) return { isStale: false, isFresh: false };
  const age = Date.now() - new Date(generatedAt).getTime();
  return {
    isStale: age > STALE_THRESHOLD_MS,
    isFresh: age < FRESH_THRESHOLD_MS,
  };
}

function parseToolStatusResponse(raw: Record<string, unknown>): Omit<ToolStatusInfo, 'refreshTrigger'> {
  const health = (raw.health as ToolHealth) ?? 'red';
  const researchStatus = (raw.researchStatus as ResearchStatus) ?? 'idle';
  const generatedAt = (raw.generatedAt as string) ?? null;
  const confidence = typeof raw.confidence === 'number' ? raw.confidence : null;
  const sourcesUsed = Array.isArray(raw.sourcesUsed) ? (raw.sourcesUsed as string[]) : [];
  const lastError = (raw.lastError as string) ?? null;

  const { isStale, isFresh } = computeFreshness(generatedAt);

  return {
    health,
    researchStatus,
    generatedAt,
    isStale,
    isFresh,
    isResearching: isResearchActive(researchStatus),
    confidence,
    sourcesUsed,
    lastError,
  };
}

const DEFAULT_STATUS: Omit<ToolStatusInfo, 'refreshTrigger'> = {
  health: 'red',
  researchStatus: 'idle',
  generatedAt: null,
  isStale: false,
  isFresh: false,
  isResearching: false,
  confidence: null,
  sourcesUsed: [],
  lastError: null,
};

// ---------------------------------------------------------------------------
// Single-tool hook — for use inside tool pages
// ---------------------------------------------------------------------------

export function useToolStatus(
  toolId: string,
  situationId: string | null | undefined
): ToolStatusInfo {
  const [status, setStatus] = useState<Omit<ToolStatusInfo, 'refreshTrigger'>>(DEFAULT_STATUS);
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshTrigger = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!situationId || !toolId) {
      setStatus(DEFAULT_STATUS);
      return;
    }

    let cancelled = false;

    async function fetchStatus() {
      try {
        const url = `/api/tool-status?toolId=${encodeURIComponent(toolId)}&situationId=${encodeURIComponent(situationId!)}`;
        const res = await fetch(url);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (cancelled) return;
        setStatus(parseToolStatusResponse(json));
      } catch {
        // Silently ignore network errors — keep previous status
      }
    }

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, [toolId, situationId, refreshKey]);

  // Set up polling when research is active
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (status.isResearching && situationId && toolId) {
      intervalRef.current = setInterval(() => {
        setRefreshKey((k) => k + 1);
      }, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status.isResearching, situationId, toolId]);

  return { ...status, refreshTrigger };
}

// ---------------------------------------------------------------------------
// Bulk hook — for use in the sidebar (fetches all tool statuses at once)
// ---------------------------------------------------------------------------

export function useAllToolStatuses(
  situationId: string | null
): Record<string, ToolStatusInfo> {
  const [statuses, setStatuses] = useState<Record<string, Omit<ToolStatusInfo, 'refreshTrigger'>>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshAll = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!situationId) {
      setStatuses({});
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      try {
        const url = `/api/tool-status?situationId=${encodeURIComponent(situationId!)}`;
        const res = await fetch(url);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (cancelled) return;

        const result: Record<string, Omit<ToolStatusInfo, 'refreshTrigger'>> = {};
        for (const [toolId, raw] of Object.entries(json)) {
          result[toolId] = parseToolStatusResponse(raw as Record<string, unknown>);
        }
        setStatuses(result);
      } catch {
        // Silently ignore network errors
      }
    }

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [situationId, refreshKey]);

  // Poll if any tool has active research
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const anyResearching = Object.values(statuses).some((s) => s.isResearching);
    if (anyResearching && situationId) {
      intervalRef.current = setInterval(() => {
        setRefreshKey((k) => k + 1);
      }, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [statuses, situationId]);

  // Memoised — a fresh object every render here would fan out to every
  // consumer destructuring this map (e.g. ToolSemaphore), multiplying work.
  return useMemo(() => {
    const result: Record<string, ToolStatusInfo> = {};
    for (const [toolId, s] of Object.entries(statuses)) {
      result[toolId] = { ...s, refreshTrigger: refreshAll };
    }
    return result;
  }, [statuses, refreshAll]);
}
