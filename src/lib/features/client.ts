'use client';

import { useEffect, useState } from 'react';

export interface ClientFeatureFlags {
  praxisV7: {
    enabled: boolean;
    mode: string;
    reason: string;
  };
  cognee: {
    enabled: boolean;
    mode: string;
    reason: string;
  };
  postgresKg: {
    enabled: boolean;
    mode: string;
    reason: string;
  };
  agentEngineSubagents: {
    enabled: boolean;
    mode: string;
    reason: string;
  };
}

const DEFAULT_FEATURES: ClientFeatureFlags = {
  praxisV7: {
    enabled: false,
    mode: 'disabled',
    reason: 'v7 shell disabled by default',
  },
  cognee: {
    enabled: false,
    mode: 'disabled',
    reason: 'unknown; assume off',
  },
  postgresKg: {
    enabled: false,
    mode: 'unset',
    reason: 'unknown; assume off',
  },
  agentEngineSubagents: {
    enabled: false,
    mode: 'unconfigured',
    reason: 'unknown; assume off',
  },
};

let cachedFeatures: { value: ClientFeatureFlags; expiresAt: number } | null = null;

function normalizeFeatures(value: unknown): ClientFeatureFlags {
  if (!value || typeof value !== 'object') return DEFAULT_FEATURES;
  const payload = value as {
    praxisV7?: { enabled?: unknown; mode?: unknown; reason?: unknown };
    cognee?: { enabled?: unknown; mode?: unknown; reason?: unknown };
    postgresKg?: { enabled?: unknown; mode?: unknown; reason?: unknown };
    agentEngineSubagents?: { enabled?: unknown; mode?: unknown; reason?: unknown };
  };
  const praxisV7 = payload.praxisV7;
  const cognee = payload.cognee;
  const postgresKg = payload.postgresKg;
  const agentEngineSubagents = payload.agentEngineSubagents;
  return {
    praxisV7: {
      enabled: praxisV7?.enabled === true,
      mode: typeof praxisV7?.mode === 'string' ? praxisV7.mode : 'disabled',
      reason: typeof praxisV7?.reason === 'string' ? praxisV7.reason : DEFAULT_FEATURES.praxisV7.reason,
    },
    cognee: {
      enabled: cognee?.enabled === true,
      mode: typeof cognee?.mode === 'string' ? cognee.mode : 'disabled',
      reason: typeof cognee?.reason === 'string' ? cognee.reason : DEFAULT_FEATURES.cognee.reason,
    },
    postgresKg: {
      enabled: postgresKg?.enabled === true,
      mode: typeof postgresKg?.mode === 'string' ? postgresKg.mode : 'unset',
      reason: typeof postgresKg?.reason === 'string' ? postgresKg.reason : DEFAULT_FEATURES.postgresKg.reason,
    },
    agentEngineSubagents: {
      enabled: agentEngineSubagents?.enabled === true,
      mode: typeof agentEngineSubagents?.mode === 'string' ? agentEngineSubagents.mode : 'unconfigured',
      reason: typeof agentEngineSubagents?.reason === 'string'
        ? agentEngineSubagents.reason
        : DEFAULT_FEATURES.agentEngineSubagents.reason,
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
