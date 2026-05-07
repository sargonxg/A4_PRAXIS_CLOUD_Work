import type { CaseModule } from '@/types/case-module';

export type CaseDensity = 'empty' | 'thin' | 'populated';

export function computeCaseDensity(caseModule: CaseModule): CaseDensity {
  const graphNodes =
    caseModule.truthLayers.source.nodeCount +
    caseModule.truthLayers.claim.nodeCount +
    caseModule.truthLayers.evidence.nodeCount +
    caseModule.truthLayers.verdict.nodeCount;
  const actorNodes = caseModule.situation.actors.length;
  const sourceNodes = caseModule.sources.length + (caseModule.situation.sourceUrls?.length ?? 0);
  const documentNodes = caseModule.situation.documentCount ?? 0;
  const total = graphNodes + actorNodes + sourceNodes + documentNodes;

  if (total <= 5) return 'empty';
  if (total <= 20) return 'thin';
  return 'populated';
}
