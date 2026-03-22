'use client';

import { useState, useCallback } from 'react';

interface UsePraxisApiOptions {
  maxRetries?: number;
}

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function usePraxisApi<T>(options?: UsePraxisApiOptions) {
  const maxRetries = options?.maxRetries ?? 3;
  const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: false });

  const execute = useCallback(async (url: string, init?: RequestInit): Promise<T | null> => {
    setState({ data: null, error: null, loading: true });

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(url, init);

        if (res.status === 402 || res.status === 429) {
          const body = await res.json().catch(() => ({ error: 'Request failed' }));
          setState({ data: null, error: body.error, loading: false });
          return null;
        }

        if (!res.ok) {
          if (attempt < maxRetries && res.status >= 500) {
            await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
            continue;
          }
          const body = await res.json().catch(() => ({ error: 'Request failed' }));
          setState({ data: null, error: body.error || `HTTP ${res.status}`, loading: false });
          return null;
        }

        const data = await res.json() as T;
        setState({ data, error: null, loading: false });
        return data;
      } catch {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
          continue;
        }
        setState({ data: null, error: 'Network error. Please try again.', loading: false });
        return null;
      }
    }

    return null;
  }, [maxRetries]);

  return { ...state, execute };
}
