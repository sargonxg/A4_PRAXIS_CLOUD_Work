'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';

export type WorkspaceOrchestratorStatus = 'idle' | 'working' | 'paused' | 'error';

export interface WorkspaceOrchestratorEvent {
  id: string;
  caseId: string;
  surfaceKey: string;
  status: WorkspaceOrchestratorStatus;
  message: string;
  createdAt: string;
  payload?: unknown;
}

export function useOrchestratorEvents(surfaceKey: string) {
  const { caseId } = useWorkbenchScope();
  const [events, setEvents] = useState<WorkspaceOrchestratorEvent[]>([]);
  const [status, setStatus] = useState<WorkspaceOrchestratorStatus>('idle');

  const url = useMemo(() => (
    `/api/backend/workspace/events?case_id=${encodeURIComponent(caseId)}&surface_key=${encodeURIComponent(surfaceKey)}`
  ), [caseId, surfaceKey]);

  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined;
    const source = new EventSource(url);

    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as WorkspaceOrchestratorEvent;
        setEvents((current) => [parsed, ...current].slice(0, 30));
        setStatus(parsed.status);
      } catch {
        setStatus('error');
      }
    };

    source.onerror = () => {
      setStatus((current) => current === 'idle' ? 'idle' : 'error');
      source.close();
    };

    return () => source.close();
  }, [url]);

  return { events, status };
}
