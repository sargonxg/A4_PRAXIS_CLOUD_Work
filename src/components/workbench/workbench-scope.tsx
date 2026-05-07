'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { getCaseModule } from '@/lib/cases/registry';
import type { CaseModule } from '@/types/case-module';
import type { Situation } from '@/types/situation';
import { useSituationStore } from '@/stores/situation-store';
import type { WorkbenchTabId } from '@/types/workbench';

interface WorkbenchScopeValue {
  caseId: string;
  caseModule: CaseModule;
  situation: Situation;
  user: ReturnType<typeof useAuth>['user'];
  analystProfile: ReturnType<typeof useAuth>['analystProfile'];
  activeTab: WorkbenchTabId | null;
  isExampleCase: boolean;
}

const WorkbenchScopeContext = createContext<WorkbenchScopeValue | null>(null);

export function WorkbenchScopeProvider({
  caseId,
  activeTab,
  children,
}: {
  caseId: string;
  activeTab: WorkbenchTabId | null;
  children: ReactNode;
}) {
  const { user, analystProfile } = useAuth();
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);

  const value = useMemo<WorkbenchScopeValue | null>(() => {
    const example = getCaseModule(caseId);
    if (example) {
      return {
        caseId,
        caseModule: example,
        situation: example.situation,
        user,
        analystProfile,
        activeTab,
        isExampleCase: true,
      };
    }

    const situation = situations.find((item) => item.id === caseId) ?? (activeSituation?.id === caseId ? activeSituation : null);
    if (!situation) return null;

    const userCase: CaseModule = {
      id: situation.id,
      kind: 'user',
      manifest: {
        name: situation.name,
        region: situation.region,
        summary: situation.description,
        risk: Math.round((situation.riskScore ?? 0) * 10),
        glaslStage: situation.glaslStage ?? 0,
        domain: situation.domain ?? 'custom',
        tags: situation.tags ?? [],
      },
      situation,
      sources: (situation.customSources ?? []).map((source, index) => ({
        receiptId: `${situation.id}-source-${index + 1}`,
        sourceId: source.id,
        name: source.name ?? source.url,
        title: source.name ?? source.url,
        url: source.url,
        provider: 'User supplied source',
        source: source.name ?? source.url,
        kind: 'web-result',
        retrievalMethod: 'user_upload',
        timestamp: situation.updatedAt,
        reliabilityScore: 0.7,
        confidence: 'medium',
      })),
      truthLayers: {
        source: { nodeCount: situation.sourceUrls?.length ?? 0, edgeCount: 0, confidenceMin: 0, confidenceMax: 0, lastUpdated: situation.updatedAt, provenanceCoverage: 0 },
        claim: { nodeCount: situation.graphEntities ?? 0, edgeCount: 0, confidenceMin: 0, confidenceMax: 0, lastUpdated: situation.updatedAt, provenanceCoverage: 0 },
        evidence: { nodeCount: 0, edgeCount: 0, confidenceMin: 0, confidenceMax: 0, lastUpdated: situation.updatedAt, provenanceCoverage: 0 },
        verdict: { nodeCount: 0, edgeCount: 0, confidenceMin: 0, confidenceMax: 0, lastUpdated: situation.updatedAt, provenanceCoverage: 0 },
      },
    };

    return {
      caseId,
      caseModule: userCase,
      situation,
      user,
      analystProfile,
      activeTab,
      isExampleCase: false,
    };
  }, [activeSituation, activeTab, analystProfile, caseId, situations, user]);

  if (!value) notFound();

  return <WorkbenchScopeContext.Provider value={value}>{children}</WorkbenchScopeContext.Provider>;
}

export function useWorkbenchScope() {
  const value = useContext(WorkbenchScopeContext);
  if (!value) throw new Error('useWorkbenchScope must be used inside WorkbenchScopeProvider');
  return value;
}
