import type { ReactNode } from 'react';
import type { CanonicalSourceReceipt } from '@/types/source-receipt';
import type { ContextEpisode } from '@/types/episode';
import type { Situation } from '@/types/situation';
import type { WorkbenchChapterId } from '@/lib/workbench/chapter-flow';

export type CaseModuleKind = 'example' | 'user';

export interface TruthLayerSnapshot {
  nodeCount: number;
  edgeCount: number;
  confidenceMin: number;
  confidenceMax: number;
  lastUpdated: string;
  provenanceCoverage: number;
}

export interface CaseModule {
  id: string;
  kind: CaseModuleKind;
  manifest: {
    name: string;
    region: string;
    summary: string;
    risk: number;
    glaslStage: number;
    domain: string;
    tags: string[];
  };
  situation: Situation;
  sources: CanonicalSourceReceipt[];
  episodes?: ContextEpisode[];
  cachedResponses?: Array<{
    questionId: string;
    question: string;
    response: string;
    targetPath: string;
    latencyTargetMs: number;
  }>;
  chapters?: Partial<Record<WorkbenchChapterId, () => ReactNode>>;
  truthLayers: {
    source: TruthLayerSnapshot;
    claim: TruthLayerSnapshot;
    evidence: TruthLayerSnapshot;
    verdict: TruthLayerSnapshot;
  };
}

export interface LandingCaseCard {
  id: string;
  title: string;
  region: string;
  summary: string;
  risk: number;
  glaslStage: number;
  tags: string[];
}
