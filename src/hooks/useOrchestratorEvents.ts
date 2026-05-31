'use client';

import { useEffect, useRef, useState } from 'react';

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

export interface BuildOrchestratorStreamUrlOptions {
  origin?: string;
  limit: number;
  lastEventId?: string | null;
}

const DEFAULT_MAX_EVENTS = 50;
const LEDGER_EVENT_TYPES = [
  'status_transition',
  'praxis.context_resolved',
  'praxis.research.plan_created',
  'praxis.grounding.live_retrieval_started',
  'praxis.grounding.live_retrieval_succeeded',
  'praxis.grounding.live_retrieval_degraded',
  'praxis.grounding.search_evidence_started',
  'praxis.reasoning.plan',
  'praxis.reasoning.act',
  'praxis.reasoning.reflect',
  'praxis.source.discovered',
  'praxis.document.retrieved',
  'praxis.tool.grounded-search.completed',
  'praxis.tool.deep-search-agent.completed',
  'praxis.sourceability.claims_verified',
  'praxis.sourceability.ledger_created',
  'praxis.memo.draft_created',
  'praxis.memo.self_critique_completed',
  'praxis.memo_output_created',
  'praxis.output_created',
  'praxis.artifact.finalized',
  'praxis.workflow.plan_created',
  'praxis.capsule.read_receipt_created',
  'praxis.approval_requested',
] as const;
const ORCHESTRATOR_EVENT_TYPES = ['start', 'step', 'progress', 'complete', 'fail'] as const;
export const LAST_EVENT_ID_HEADER = 'Last-Event-ID';

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

  useEffect(() => {
    terminalRef.current = false;
    lastEventIdRef.current = null;
    // Reset local stream state when the caller switches to a different SSE URL.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(initialState);
  }, [streamUrl]);

  useEffect(() => {
    if (!streamUrl || !enabled || terminalRef.current || typeof EventSource === 'undefined') return;

    const normalizedUrl = buildOrchestratorStreamUrl(streamUrl, {
      origin: typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
      limit,
      lastEventId: lastEventIdRef.current,
    });

    // Mark reconnect posture before opening the next EventSource.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [enabled, limit, maxEvents, streamUrl]);

  return state;
}

export function buildOrchestratorStreamUrl(
  streamUrl: string,
  options: BuildOrchestratorStreamUrlOptions,
): string {
  try {
    const url = new URL(streamUrl, options.origin ?? 'http://localhost');
    url.searchParams.set('limit', String(options.limit));
    if (options.lastEventId) {
      url.searchParams.set('after', options.lastEventId);
      url.searchParams.set('lastEventId', options.lastEventId);
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return streamUrl;
  }
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

export function agentRailStageFromEvent(event: OrchestratorEvent): string {
  const rawType = event.rawType;
  const phase = stringValue(event.data.phase);
  if (event.type === 'fail') return 'Failed';
  if (event.type === 'complete' || rawType.includes('memo_output') || rawType.includes('output_created') || rawType.includes('artifact.finalized') || phase === 'artifact.finalized') return 'Save output';
  if (rawType === 'status_transition' && stringValue(event.data.toStatus) === 'running') return 'Agent started';
  if (rawType.includes('context_resolved') || phase === 'context_resolved') return 'Capsule read';
  if (rawType.includes('research.plan') || rawType.includes('reasoning.plan') || phase === 'research.plan_created' || phase === 'reasoning.plan' || phase === 'plan') return 'Research plan';
  if (rawType.includes('grounding.live_retrieval') || phase?.startsWith('grounding.live_retrieval')) return 'Live retrieval';
  if (rawType.includes('sourceability.claims_verified') || phase === 'sourceability.claims_verified') return 'Sourceability check';
  if (rawType.includes('memo.self_critique') || phase === 'memo.self_critique_completed') return 'Gap review';
  if (rawType.includes('source') || phase === 'source_discovery') return 'Source discovery';
  if (rawType.includes('document') || phase === 'document_retrieval') return 'Document retrieval';
  if (rawType.includes('approval') || phase === 'approval_gate') return 'Approval gate';
  if (rawType.includes('reasoning.act') || phase === 'reasoning.act' || stringValue(event.data.toolId)) return 'Tool call';
  if (rawType.includes('reasoning.reflect') || phase === 'reasoning.reflect') return 'Gap review';
  if (event.type === 'start') return 'Agent started';
  return 'Progress';
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
