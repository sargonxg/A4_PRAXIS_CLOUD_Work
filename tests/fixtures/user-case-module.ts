import type { CaseModule } from '@/types/case-module';

const now = '2026-05-16T00:00:00.000Z';

export const userCaseModule: CaseModule = {
  id: 'user-case',
  kind: 'user',
  manifest: {
    name: 'User policy workspace',
    region: 'User-defined',
    summary: 'User-owned ContextCapsule workspace for testing graph, memo, and tool contracts.',
    risk: 42,
    glaslStage: 2,
    domain: 'policy',
    tags: ['user-owned', 'policy'],
  },
  situation: {
    id: 'user-case',
    name: 'User policy workspace',
    type: 'international',
    description: 'User-owned policy workspace.',
    region: 'User-defined',
    actors: ['Lead analyst', 'Source owner', 'Decision principal'],
    userRole: 'analyst',
    status: 'active',
    riskScore: 42,
    glaslStage: 2,
    escalationTrend: 'stable',
    actorCount: 3,
    graphEntities: 12,
    documentCount: 3,
    createdAt: now,
    updatedAt: now,
  },
  sources: Array.from({ length: 3 }, (_, index) => ({
    receiptId: `user-source-${index + 1}`,
    sourceId: `user-source-${index + 1}`,
    name: `User source ${index + 1}`,
    title: `User source ${index + 1}`,
    provider: 'User upload',
    source: 'User workspace',
    kind: 'document',
    retrievalMethod: 'user_upload',
    timestamp: now,
    reliabilityScore: 0.76,
    confidence: 'medium',
  })),
  truthLayers: {
    source: { nodeCount: 3, edgeCount: 2, confidenceMin: 0.5, confidenceMax: 0.8, lastUpdated: now, provenanceCoverage: 0.7 },
    claim: { nodeCount: 8, edgeCount: 4, confidenceMin: 0.4, confidenceMax: 0.75, lastUpdated: now, provenanceCoverage: 0.6 },
    evidence: { nodeCount: 5, edgeCount: 4, confidenceMin: 0.4, confidenceMax: 0.72, lastUpdated: now, provenanceCoverage: 0.65 },
    verdict: { nodeCount: 2, edgeCount: 1, confidenceMin: 0.3, confidenceMax: 0.7, lastUpdated: now, provenanceCoverage: 0.5 },
  },
};
