'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';

export type WorkspaceOrchestratorStatus = 'idle' | 'working' | 'paused' | 'error';
type WorkspaceSseEventName = 'start' | 'step' | 'progress' | 'complete' | 'fail';

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
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const url = useMemo(() => (
    `/api/backend/workspace/events?case_id=${encodeURIComponent(caseId)}&surface_key=${encodeURIComponent(surfaceKey)}`
  ), [caseId, surfaceKey]);

  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined;
    const source = new EventSource(url);

    const handleEvent = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as WorkspaceOrchestratorEvent;
        setEvents((current) => [parsed, ...current].slice(0, 30));
        setStatus(parsed.status);
        setLastEventAt(new Date().toISOString());
        setIsReconnecting(false);
      } catch {
        setStatus('error');
      }
    };

    const eventNames: WorkspaceSseEventName[] = ['start', 'step', 'progress', 'complete', 'fail'];
    for (const eventName of eventNames) {
      source.addEventListener(eventName, handleEvent as EventListener);
    }
    source.onmessage = handleEvent;

    source.onerror = () => {
      // Do not close here: browser EventSource auto-reconnects and sends
      // Last-Event-ID when the server has emitted SSE id fields.
      setStatus((current) => current === 'idle' ? 'idle' : 'error');
      setIsReconnecting(true);
    };

    return () => {
      for (const eventName of eventNames) {
        source.removeEventListener(eventName, handleEvent as EventListener);
      }
      source.close();
    };
  }, [url]);

  async function dismiss(id: string) {
    await fetch(`/api/backend/workspace/suggestions/${encodeURIComponent(id)}/dismiss`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ case_id: caseId }),
    }).catch(() => null);
    setEvents((current) => current.filter((event) => event.id !== id));
  }

  async function confirm(id: string, payload: Record<string, unknown> = {}) {
    const response = await fetch(`/api/backend/workspace/suggestions/${encodeURIComponent(id)}/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ case_id: caseId, payload }),
    }).catch(() => null);
    return response?.ok ?? false;
  }

  return { events, status, dismiss, confirm, lastEventAt, isReconnecting };
}
