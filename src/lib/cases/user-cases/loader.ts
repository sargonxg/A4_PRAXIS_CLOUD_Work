import { getSituationAdmin } from '@/lib/firebase/situations';
import type { CaseModule } from '@/types/case-module';

export class CaseNotFoundError extends Error {
  constructor(caseId: string) {
    super(`Case not found: ${caseId}`);
    this.name = 'CaseNotFoundError';
  }
}

export async function loadUserCaseModule(uid: string, caseId: string): Promise<CaseModule> {
  const situation = await getSituationAdmin(uid, caseId);
  if (!situation) throw new CaseNotFoundError(caseId);

  return {
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
      source: {
        nodeCount: situation.sourceUrls?.length ?? 0,
        edgeCount: 0,
        confidenceMin: 0,
        confidenceMax: 0,
        lastUpdated: situation.updatedAt,
        provenanceCoverage: 0,
      },
      claim: {
        nodeCount: situation.graphEntities ?? 0,
        edgeCount: getArrayLength(situation, 'relationships'),
        confidenceMin: 0,
        confidenceMax: 0,
        lastUpdated: situation.updatedAt,
        provenanceCoverage: 0,
      },
      evidence: {
        nodeCount: 0,
        edgeCount: 0,
        confidenceMin: 0,
        confidenceMax: 0,
        lastUpdated: situation.updatedAt,
        provenanceCoverage: 0,
      },
      verdict: {
        nodeCount: 0,
        edgeCount: 0,
        confidenceMin: 0,
        confidenceMax: 0,
        lastUpdated: situation.updatedAt,
        provenanceCoverage: 0,
      },
    },
  };
}

function getArrayLength(object: unknown, key: string): number {
  if (!object || typeof object !== 'object') return 0;
  const value = (object as Record<string, unknown>)[key];
  return Array.isArray(value) ? value.length : 0;
}
