'use client';

import { useEffect, useMemo, useState } from 'react';
import { defaultActiveContextStack, type ActiveContextStackState } from '@/lib/context/active-context-stack';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';
import { getActiveUserModelId, listPrivateUserModels } from '@/lib/users/api';
import { useSituationStore } from '@/stores/situation-store';
import type { Situation } from '@/types/situation';

export interface WriterSource {
  id: string;
  title: string;
  sourceType: string;
  citation: string;
  excerpt: string;
}

export function useWriterContext() {
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const setActiveSituation = useSituationStore((state) => state.setActiveSituation);
  const [activeStack, setActiveStack] = useState<ActiveContextStackState>(() => defaultActiveContextStack());

  useEffect(() => {
    let cancelled = false;
    fetch('/api/workspace/context-stack')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.stack) return;
        setActiveStack(payload.stack);
        if (payload.stack.situationId) setActiveSituation(payload.stack.situationId);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [setActiveSituation]);

  return useMemo(() => {
    const privateModels = typeof window === 'undefined' ? [] : listPrivateUserModels(window.localStorage);
    const allModels = [...privateModels, ...PUBLIC_USER_MODELS];
    const activeUserModelId = activeStack.userModelId ?? (typeof window === 'undefined' ? null : getActiveUserModelId(window.localStorage));
    const activeUserCore = allModels.find((model) => model.modelId === activeUserModelId) ?? PUBLIC_USER_MODELS[0];
    const fallback = activeStack.situationId ? situations.find((item) => item.id === activeStack.situationId) ?? situations[0] ?? null : situations[0] ?? null;
    const situation = activeSituation ?? fallback;
    const sourceUrls = situation?.sourceUrls ?? [];
    const customSources = situation?.customSources ?? [];
    const sources: WriterSource[] = [
      ...sourceUrls.map((url, index) => ({
        id: `url-${index + 1}`,
        title: url.replace(/^https?:\/\//, '').slice(0, 80),
        sourceType: 'source-url',
        citation: url,
        excerpt: 'Attached source URL from the Situation Core.',
      })),
      ...customSources.map((source) => ({
        id: source.id,
        title: source.name ?? source.url,
        sourceType: source.categoryId,
        citation: source.url,
        excerpt: 'Custom source attached to this Situation Core.',
      })),
    ];

    if (sources.length === 0) {
      sources.push({
        id: 'starter-source-graph',
        title: 'Situation Core source graph',
        sourceType: 'source-graph',
        citation: situation?.id ?? 'no-active-situation',
        excerpt: situation?.contextNotes || situation?.description || 'Attach sources to the Situation Core before export.',
      });
    }

    return {
      activeUserCore,
      activeSituation: situation as Situation | null,
      situationOptions: situations,
      sources,
      activeStack,
    };
  }, [activeSituation, activeStack, situations]);
}
