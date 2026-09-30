import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ executeWebResearch: vi.fn(), scrapeUrl: vi.fn() }));
vi.mock('@/lib/ai/web-research', () => ({ executeWebResearch: mocks.executeWebResearch, SEARCH_FAILURE_WARNING: 'No live evidence.' }));
vi.mock('@/lib/ai/grounded-research', () => ({ scrapeUrl: mocks.scrapeUrl }));
import { buildLiveSourcePack } from '@/lib/ai/live-source-pack';

describe('live source pack fidelity', () => {
  beforeEach(() => vi.clearAllMocks());
  it('reuses successful and unavailable captures without hidden duplicate fetches', async () => {
    mocks.executeWebResearch.mockResolvedValue([
      { title: 'Generated overview', url: 'https://google.com/search?q=case', content: 'Overview is generated and cannot be source evidence.', source: 'Gemini', provider: 'google-search', reliabilityScore: 0.9, isGroundedSummary: true },
      { title: 'GAO methods', url: 'https://gao.gov/methods', content: 'Authorization does not establish expenditure.', source: 'gao.gov', provider: 'google-search', reliabilityScore: 0.9, originalPassageStatus: 'retrieved', originalPassages: [{ text: 'Authorization does not establish expenditure.', locator: 'extracted-text:chars:0-44', claimSupport: 'unverified' }] },
      { title: 'OECD methods', url: 'https://oecd.org/methods', content: '', source: 'oecd.org', provider: 'google-search', reliabilityScore: 0.9, originalPassageStatus: 'unavailable', originalPassages: [], unavailableReason: 'http-error', generatedGroundingSegments: [{ text: 'An attributed generated segment.', kind: 'generated-grounding-segment', claimSupport: 'provider-attributed-unverified' }] },
    ]);
    const pack = await buildLiveSourcePack({ uid: 'test', situationName: 'synthetic case', query: 'two institutional methods', toolId: 'test', scrapeTop: 2 });
    expect(mocks.scrapeUrl).not.toHaveBeenCalled();
    expect(pack.formatted).not.toContain('Overview is generated and cannot be source evidence.');
    expect(pack.formatted).toContain('Generated grounding segments (not original quotations; claim support unverified)');
    expect(pack.formatted).toContain('extracted-text:chars:0-44');
    expect(pack.gaps).toContain('Original passage unavailable for https://oecd.org/methods: http-error.');
    expect(pack.sourceAudit.checkableUrlCount).toBe(1);
    expect(pack.sourceAudit.confidence).toBe('low');
  });
});
