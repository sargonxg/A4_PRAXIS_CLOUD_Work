'use client';

import { useEffect, useState } from 'react';

export interface ClientFeatureFlags {
  cognee: {
    enabled: boolean;
    mode: string;
    reason?: string;
  };
  postgresKg: {
    enabled: boolean;
    mode: string;
  };
  agentEngineSubagents: {
    enabled: boolean;
    mode: string;
  };
}

const DEFAULT_FEATURES: ClientFeatureFlags = {
  cognee: {
    enabled: false,
    mode: 'disabled',
  },
  postgresKg: {
    enabled: false,
    mode: 'unset',
  },
  agentEngineSubagents: {
    enabled: false,
    mode: 'unconfigured',
  },
};

let cachedFeatures: { value: ClientFeatureFlags; expiresAt: number } | null = null;

function normalizeFeatures(value: unknown): ClientFeatureFlags {
  if (!value || typeof value !== 'object') return DEFAULT_FEATURES;
  const payload = value as {
    cognee?: { enabled?: unknown; mode?: unknown; reason?: unknown };
    postgresKg?: { enabled?: unknown; mode?: unknown };
    agentEngineSubagents?: { enabled?: unknown; mode?: unknown };
  };
  const cognee = payload.cognee;
  const postgresKg = payload.postgresKg;
  const agentEngineSubagents = payload.agentEngineSubagents;
  return {
    cognee: {
      enabled: cognee?.enabled === true,
      mode: typeof cognee?.mode === 'string' ? cognee.mode : 'disabled',
      reason: typeof cognee?.reason === 'string' ? cognee.reason : undefined,
    },
    postgresKg: {
      enabled: postgresKg?.enabled === true,
      mode: typeof postgresKg?.mode === 'string' ? postgresKg.mode : 'unset',
    },
    agentEngineSubagents: {
      enabled: agentEngineSubagents?.enabled === true,
      mode: typeof agentEngineSubagents?.mode === 'string' ? agentEngineSubagents.mode : 'unconfigured',
    },
  };
}

export function useFeatureFlags(): ClientFeatureFlags {
  const [features, setFeatures] = useState<ClientFeatureFlags>(() => {
    if (cachedFeatures && cachedFeatures.expiresAt > Date.now()) return cachedFeatures.value;
    return DEFAULT_FEATURES;
  });

  useEffect(() => {
    if (cachedFeatures && cachedFeatures.expiresAt > Date.now()) {
      setFeatures(cachedFeatures.value);
      return;
    }

    let cancelled = false;
    fetch('/api/health/features', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : DEFAULT_FEATURES))
      .then((payload) => {
        if (cancelled) return;
        const next = normalizeFeatures(payload);
        cachedFeatures = { value: next, expiresAt: Date.now() + 60_000 };
        setFeatures(next);
      })
      .catch(() => {
        if (!cancelled) setFeatures(DEFAULT_FEATURES);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return features;
}

export function useCogneeEnabled(): boolean {
  return useFeatureFlags().cognee.enabled;
}
