import type { CaseModule } from '@/types/case-module';
import type { CanonicalSourceReceipt } from '@/types/source-receipt';
import { SYRIA_DEMO_SITUATION } from '@/lib/constants/syria-demo-case';
import { syria2026Chapters } from '@/lib/cases/syria-2026/chapters';

const sources: CanonicalSourceReceipt[] = (SYRIA_DEMO_SITUATION.customSources ?? []).map((source, index) => ({
  receiptId: `syria-2026-source-${index + 1}`,
  sourceId: source.id,
  name: source.name ?? source.url,
  title: source.name ?? source.url,
  url: source.url,
  provider: 'Public web source',
  source: source.name ?? source.url,
  kind: 'web-result',
  retrievalMethod: 'web_search',
  timestamp: SYRIA_DEMO_SITUATION.updatedAt,
  reliabilityScore: source.categoryId === 'local-media' ? 0.72 : 0.92,
  confidence: source.categoryId === 'local-media' ? 'medium' : 'high',
  excerpt: 'Example-case source receipt included with the public Syria transition workspace.',
  contentHash: source.id,
  graphPath: ['source', source.categoryId, 'case-file'],
  toolRunId: 'syria-2026-example-seed',
}));

export const syria2026CaseModule: CaseModule = {
  id: 'syria-2026',
  kind: 'example',
  manifest: {
    name: 'Syria Transition',
    region: SYRIA_DEMO_SITUATION.region,
    summary: 'Northeast integration, humanitarian strain, and regional spillover in a public-source transition case.',
    risk: 78,
    glaslStage: SYRIA_DEMO_SITUATION.glaslStage ?? 5,
    domain: SYRIA_DEMO_SITUATION.domain ?? 'conflict-prevention',
    tags: SYRIA_DEMO_SITUATION.tags ?? [],
  },
  situation: { ...SYRIA_DEMO_SITUATION, id: 'syria-2026' },
  sources,
  chapters: syria2026Chapters,
  truthLayers: {
    source: { nodeCount: sources.length, edgeCount: sources.length, confidenceMin: 0.72, confidenceMax: 0.96, lastUpdated: SYRIA_DEMO_SITUATION.updatedAt, provenanceCoverage: 100 },
    claim: { nodeCount: 18, edgeCount: 31, confidenceMin: 0.6, confidenceMax: 0.9, lastUpdated: SYRIA_DEMO_SITUATION.updatedAt, provenanceCoverage: 94 },
    evidence: { nodeCount: 12, edgeCount: 22, confidenceMin: 0.58, confidenceMax: 0.86, lastUpdated: SYRIA_DEMO_SITUATION.updatedAt, provenanceCoverage: 92 },
    verdict: { nodeCount: 5, edgeCount: 9, confidenceMin: 0.64, confidenceMax: 0.82, lastUpdated: SYRIA_DEMO_SITUATION.updatedAt, provenanceCoverage: 100 },
  },
};
