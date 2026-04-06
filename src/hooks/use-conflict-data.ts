'use client';

import { useState, useEffect } from 'react';
import type { DemoCase } from '@/lib/constants/demo-cases';
import type { CaseOntology } from '@/lib/constants/case-registry';

// ============================================================================
// Types
// ============================================================================

export interface ConflictListItem extends DemoCase {
  hasOntology: boolean;
}

export interface ConflictDetail {
  meta: DemoCase;
  ontology?: CaseOntology;
  archetype?: string;
  suitableFor?: string[];
  /** Raw DEMO_CONFLICT shape — only present for Nordalia */
  demoConflict?: {
    id: string;
    name: string;
    region: string;
    status: string;
    startDate: string;
    riskScore: number;
    glaslStage: number;
    escalationTrend: string;
    lastUpdated: string;
    description: string;
    actors: unknown[];
    claims: unknown[];
    interests: unknown[];
    constraints: unknown[];
    leverage: unknown[];
    commitments: unknown[];
    events: unknown[];
    narratives: unknown[];
    relationships: unknown[];
    [key: string]: unknown;
  };
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Module-level cache (persists across navigations within the SPA)
// ============================================================================

const listCache: { data: ConflictListItem[] | null; promise: Promise<ConflictListItem[]> | null } = {
  data: null,
  promise: null,
};

const detailCache = new Map<string, ConflictDetail>();
const detailInflight = new Map<string, Promise<ConflictDetail>>();

// ============================================================================
// useConflictList
// ============================================================================

export function useConflictList(): FetchState<ConflictListItem[]> {
  const [state, setState] = useState<FetchState<ConflictListItem[]>>({
    data: listCache.data,
    loading: !listCache.data,
    error: null,
  });

  useEffect(() => {
    if (listCache.data) {
      setState({ data: listCache.data, loading: false, error: null });
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        // Deduplicate in-flight requests
        if (!listCache.promise) {
          listCache.promise = fetch('/api/data/conflicts')
            .then((res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json() as Promise<ConflictListItem[]>;
            })
            .then((data) => {
              listCache.data = data;
              listCache.promise = null;
              return data;
            })
            .catch((err) => {
              listCache.promise = null;
              throw err;
            });
        }

        const data = await listCache.promise;
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ data: null, loading: false, error: (err as Error).message });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}

// ============================================================================
// useConflictDetail
// ============================================================================

export function useConflictDetail(id: string | null | undefined): FetchState<ConflictDetail> {
  const cached = id ? detailCache.get(id) ?? null : null;

  const [state, setState] = useState<FetchState<ConflictDetail>>({
    data: cached,
    loading: !!id && !cached,
    error: null,
  });

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const existing = detailCache.get(id);
    if (existing) {
      setState({ data: existing, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    async function load() {
      try {
        // Deduplicate in-flight requests for the same ID
        if (!detailInflight.has(id!)) {
          const promise = fetch(`/api/data/conflicts?id=${encodeURIComponent(id!)}`)
            .then((res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json() as Promise<ConflictDetail>;
            })
            .then((data) => {
              detailCache.set(id!, data);
              detailInflight.delete(id!);
              return data;
            })
            .catch((err) => {
              detailInflight.delete(id!);
              throw err;
            });
          detailInflight.set(id!, promise);
        }

        const data = await detailInflight.get(id!)!;
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ data: null, loading: false, error: (err as Error).message });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  return state;
}
