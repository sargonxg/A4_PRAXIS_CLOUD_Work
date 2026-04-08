/**
 * Client-side tracked fetch hook.
 *
 * Wraps fetch calls to automatically log operations to the ActivityStore
 * (for the activity panel) and the DebugStore (for the debug panel).
 *
 * Usage in tool pages:
 *   const trackedFetch = useTrackedFetch();
 *   const res = await trackedFetch('/api/ai/risk-assessment', {
 *     method: 'POST',
 *     body: JSON.stringify({ ... }),
 *     toolName: 'risk-monitor',
 *   });
 */

'use client';

import { useCallback } from 'react';
import { useActivityStore } from '@/stores/activity-store';
import { useDebugStore } from '@/stores/debug-store';

interface TrackedFetchOptions extends RequestInit {
  toolName: string;
  operationType?: 'ai-generation' | 'data-fetch' | 'research';
  situationId?: string;
  label?: string;
}

export function useTrackedFetch() {
  const startOperation = useActivityStore((s) => s.startOperation);
  const completeOperation = useActivityStore((s) => s.completeOperation);
  const failOperation = useActivityStore((s) => s.failOperation);
  const debugLog = useDebugStore((s) => s.log);

  return useCallback(
    async function trackedFetch(
      url: string,
      options: TrackedFetchOptions,
    ): Promise<Response> {
      const {
        toolName,
        operationType = 'ai-generation',
        situationId,
        label,
        ...fetchOptions
      } = options;

      const opId = `${toolName}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      startOperation({
        id: opId,
        type: operationType,
        tool: toolName,
        label: label || `Generating ${toolName.replace(/-/g, ' ')}`,
        situationId,
      });

      debugLog({
        id: opId,
        type: 'request',
        tool: toolName,
        endpoint: url,
        situation: situationId,
        ts: new Date().toISOString(),
      });

      const startTime = Date.now();

      try {
        const res = await fetch(url, fetchOptions);
        const elapsed = (Date.now() - startTime) / 1000;

        if (res.ok) {
          completeOperation(opId);
          debugLog({
            id: `${opId}-done`,
            type: 'success',
            tool: toolName,
            endpoint: url,
            status: res.status,
            elapsed,
            ts: new Date().toISOString(),
          });
        } else {
          const errorText = await res.clone().text().catch(() => 'Unknown error');
          failOperation(opId, `HTTP ${res.status}: ${errorText.slice(0, 200)}`);
          debugLog({
            id: `${opId}-err`,
            type: 'error',
            tool: toolName,
            endpoint: url,
            status: res.status,
            elapsed,
            error: errorText.slice(0, 200),
            ts: new Date().toISOString(),
          });
        }

        return res;
      } catch (err) {
        const elapsed = (Date.now() - startTime) / 1000;
        const msg = err instanceof Error ? err.message : 'Network error';
        failOperation(opId, msg);
        debugLog({
          id: `${opId}-err`,
          type: 'error',
          tool: toolName,
          elapsed,
          error: msg,
          ts: new Date().toISOString(),
        });
        throw err;
      }
    },
    [startOperation, completeOperation, failOperation, debugLog],
  );
}
