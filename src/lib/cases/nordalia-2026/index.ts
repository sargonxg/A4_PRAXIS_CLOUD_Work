import type { CaseModule } from '@/types/case-module';
import type { CanonicalSourceReceipt } from '@/types/source-receipt';
import type { Situation } from '@/types/situation';
import { DEMO_CONFLICT } from '@/lib/constants/demo-conflict';
import { nordalia2026Chapters } from '@/lib/cases/nordalia-2026/chapters';

const updatedAt = `${DEMO_CONFLICT.lastUpdated}T12:00:00.000Z`;

const situation: Situation = {
  id: 'nordalia-2026',
  name: 'Nordalia NDC Simulation',
  type: 'international',
  description: DEMO_CONFLICT.description,
  region: DEMO_CONFLICT.region,
  actors: DEMO_CONFLICT.actors.slice(0, 8).map((actor) => actor.name),
  userRole: 'analyst',
  status: 'active',
  riskScore: DEMO_CONFLICT.riskScore,
  glaslStage: DEMO_CONFLICT.glaslStage,
  escalationTrend: DEMO_CONFLICT.escalationTrend,
  actorCount: DEMO_CONFLICT.actors.length,
  graphEntities: DEMO_CONFLICT.actors.length + DEMO_CONFLICT.events.length + DEMO_CONFLICT.commitments.length,
  documentCount: 3,
  sourceUrls: [],
  contextNotes: 'Synthetic Nordalia case used to verify the workbench abstraction against a non-Syria example.',
  createdAt: updatedAt,
  updatedAt,
  latestEventDate: DEMO_CONFLICT.lastUpdated,
  tags: ['synthetic', 'nordalia', 'mediation', 'peace-process'],
  analysisPhase: 'assessment',
  domain: 'international-dispute',
  domainConfidence: 0.9,
  workflowPath: 'peace-security',
  workflowPathLabel: 'Peace and security decision support',
};

const sources: CanonicalSourceReceipt[] = [
  {
    receiptId: 'nordalia-2026-sim-1',
    sourceId: 'nordalia-synthetic-case-file',
    name: 'Nordalia synthetic case file',
    title: 'Nordalia NDC simulation seed graph',
    provider: 'PRAXIS synthetic fixture',
    source: 'DEMO_CONFLICT',
    kind: 'structured-data',
    retrievalMethod: 'structured_data',
    timestamp: updatedAt,
    reliabilityScore: 0.88,
    confidence: 'high',
    excerpt: 'Synthetic actors, events, narratives, commitments, and leverage points for product validation.',
    contentHash: 'nordalia-demo-conflict',
    graphPath: ['synthetic-source', 'case-file', 'workbench'],
    toolRunId: 'nordalia-2026-example-seed',
  },
];

export const nordalia2026CaseModule: CaseModule = {
  id: 'nordalia-2026',
  kind: 'example',
  manifest: {
    name: 'Nordalia NDC Simulation',
    region: DEMO_CONFLICT.region,
    summary: 'Synthetic peace-process simulation with external patrons, mediation tracks, and resource constraints.',
    risk: Math.round(DEMO_CONFLICT.riskScore * 10),
    glaslStage: DEMO_CONFLICT.glaslStage,
    domain: 'international-dispute',
    tags: situation.tags ?? [],
  },
  situation,
  sources,
  chapters: nordalia2026Chapters,
  truthLayers: {
    source: { nodeCount: 1, edgeCount: 1, confidenceMin: 0.88, confidenceMax: 0.88, lastUpdated: updatedAt, provenanceCoverage: 100 },
    claim: { nodeCount: DEMO_CONFLICT.actors.length + DEMO_CONFLICT.events.length, edgeCount: DEMO_CONFLICT.relationships.length, confidenceMin: 0.62, confidenceMax: 0.9, lastUpdated: updatedAt, provenanceCoverage: 100 },
    evidence: { nodeCount: DEMO_CONFLICT.leverage.length, edgeCount: DEMO_CONFLICT.leverage.length, confidenceMin: 0.55, confidenceMax: 0.86, lastUpdated: updatedAt, provenanceCoverage: 100 },
    verdict: { nodeCount: DEMO_CONFLICT.commitments.length, edgeCount: DEMO_CONFLICT.commitments.length, confidenceMin: 0.58, confidenceMax: 0.82, lastUpdated: updatedAt, provenanceCoverage: 100 },
  },
};
