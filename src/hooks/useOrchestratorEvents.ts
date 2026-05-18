'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type OrchestratorEventKind = 'start' | 'step' | 'progress' | 'complete' | 'fail';

export interface OrchestratorEvent {
  id: string;
  runId: string | null;
  type: OrchestratorEventKind;
  rawType: string;
  message: string | null;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface OrchestratorEventState {
  events: OrchestratorEvent[];
  lastEventId: string | null;
  isConnected: boolean;
  isReconnecting: boolean;
  lastEventAt: string | null;
  terminalEvent: OrchestratorEvent | null;
  error: string | null;
}

export interface UseOrchestratorEventsOptions {
  enabled?: boolean;
  limit?: number;
  maxEvents?: number;
}

export interface RawSseEvent {
  id?: string | null;
  type: string;
  data?: string | null;
}

const DEFAULT_MAX_EVENTS = 50;
const LEDGER_EVENT_TYPES = [
  'status_transition',
  'praxis.context_resolved',
  'praxis.reasoning.plan',
  'praxis.reasoning.act',
  'praxis.reasoning.reflect',
  'praxis.memo_output_created',
  'praxis.output_created',
  'praxis.approval_requested',
] as const;
const ORCHESTRATOR_EVENT_TYPES = ['start', 'step', 'progress', 'complete', 'fail'] as const;

const initialState: OrchestratorEventState = {
  events: [],
  lastEventId: null,
  isConnected: false,
  isReconnecting: false,
  lastEventAt: null,
  terminalEvent: null,
  error: null,
};

export function useOrchestratorEvents(
  streamUrl: string | null | undefined,
  options: UseOrchestratorEventsOptions = {},
): OrchestratorEventState {
  const { enabled = true, limit = 100, maxEvents = DEFAULT_MAX_EVENTS } = options;
  const [state, setState] = useState<OrchestratorEventState>(initialState);
  const lastEventIdRef = useRef<string | null>(null);
  const terminalRef = useRef(false);

  const normalizedUrl = useMemo(() => {
    if (!streamUrl || !enabled) return null;
    try {
      const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
      const url = new URL(streamUrl, origin);
      url.searchParams.set('limit', String(limit));
      if (lastEventIdRef.current) {
        url.searchParams.set('after', lastEventIdRef.current);
        url.searchParams.set('lastEventId', lastEventIdRef.current);
      }
      return `${url.pathname}${url.search}`;
    } catch {
      return streamUrl;
    }
  }, [enabled, limit, streamUrl]);

  useEffect(() => {
    terminalRef.current = false;
    lastEventIdRef.current = null;
    setState(initialState);
  }, [streamUrl]);

  useEffect(() => {
    if (!normalizedUrl || terminalRef.current || typeof EventSource === 'undefined') return;

    setState((current) => ({
      ...current,
      isConnected: false,
      isReconnecting: Boolean(current.lastEventId),
      error: null,
    }));

    const source = new EventSource(normalizedUrl, { withCredentials: true });
    const handlers = new Map<string, EventListener>();

    const handleOpen = () => {
      setState((current) => ({ ...current, isConnected: true, isReconnecting: false, error: null }));
    };
    const handleError = () => {
      setState((current) => ({
        ...current,
        isConnected: false,
        isReconnecting: !terminalRef.current && Boolean(current.lastEventId),
        error: terminalRef.current ? current.error : 'Agent event stream reconnecting.',
      }));
    };
    const handleEvent = (event: MessageEvent<string>) => {
      const normalized = normalizeOrchestratorEvent({
        id: event.lastEventId || null,
        type: event.type,
        data: event.data,
      });
      lastEventIdRef.current = normalized.id;
      setState((current) => {
        const next = applyOrchestratorEvent(current, normalized, maxEvents);
        terminalRef.current = Boolean(next.terminalEvent);
        return next;
      });
      if (normalized.type === 'complete' || normalized.type === 'fail') {
        source.close();
      }
    };

    source.addEventListener('open', handleOpen);
    source.addEventListener('error', handleError);
    for (const eventType of [...ORCHESTRATOR_EVENT_TYPES, ...LEDGER_EVENT_TYPES]) {
      const handler: EventListener = (event) => handleEvent(event as MessageEvent<string>);
      handlers.set(eventType, handler);
      source.addEventListener(eventType, handler);
    }

    return () => {
      source.removeEventListener('open', handleOpen);
      source.removeEventListener('error', handleError);
      for (const [eventType, handler] of handlers) {
        source.removeEventListener(eventType, handler);
      }
      source.close();
    };
  }, [maxEvents, normalizedUrl]);

  return state;
}

export function normalizeOrchestratorEvent(input: RawSseEvent): OrchestratorEvent {
  const data = parseEventData(input.data);
  const rawType = stringValue(data.eventType) ?? input.type;
  const id = stringValue(data.id) ?? input.id ?? stableEventId(rawType, data);
  const createdAt = stringValue(data.createdAt) ?? new Date().toISOString();
  return {
    id,
    runId: stringValue(data.runId),
    type: eventKindFrom(rawType, data),
    rawType,
    message: stringValue(data.message),
    data,
    createdAt,
  };
}

export function applyOrchestratorEvent(
  state: OrchestratorEventState,
  event: OrchestratorEvent,
  maxEvents = DEFAULT_MAX_EVENTS,
): OrchestratorEventState {
  const events = [...state.events.filter((item) => item.id !== event.id), event].slice(-Math.max(1, maxEvents));
  const terminalEvent = event.type === 'complete' || event.type === 'fail' ? event : state.terminalEvent;
  return {
    events,
    lastEventId: event.id,
    isConnected: true,
    isReconnecting: false,
    lastEventAt: event.createdAt,
    terminalEvent,
    error: event.type === 'fail' ? event.message ?? 'Agent event stream failed.' : null,
  };
}

function parseEventData(data: string | null | undefined): Record<string, unknown> {
  if (!data) return {};
  try {
    const parsed = JSON.parse(data) as unknown;
    return isRecord(parsed) ? parsed : { value: parsed };
  } catch {
    return { message: data };
  }
}

function eventKindFrom(rawType: string, data: Record<string, unknown>): OrchestratorEventKind {
  if (rawType === 'start' || rawType === 'step' || rawType === 'progress' || rawType === 'complete' || rawType === 'fail') {
    return rawType;
  }
  const toStatus = stringValue(data.toStatus);
  if (toStatus === 'succeeded') return 'complete';
  if (toStatus === 'failed' || toStatus === 'cancelled' || toStatus === 'expired') return 'fail';
  if (rawType === 'status_transition' && toStatus === 'running') return 'start';
  if (rawType.includes('approval') || rawType.includes('reasoning.act') || rawType.includes('memo_output')) return 'step';
  return 'progress';
}

function stableEventId(rawType: string, data: Record<string, unknown>): string {
  return [
    stringValue(data.runId) ?? 'run',
    rawType,
    stringValue(data.createdAt) ?? Date.now().toString(36),
  ].join(':');
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
