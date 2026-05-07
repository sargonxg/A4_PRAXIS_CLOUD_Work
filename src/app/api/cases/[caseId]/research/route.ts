import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { executeWebResearch } from '@/lib/ai/web-research';
import { buildResearchCandidates, type ResearchDepth } from '@/lib/workbench/research-state';
import { getCaseModule } from '@/lib/cases/registry';
import type { Situation } from '@/types/situation';
import type { CaseModule } from '@/types/case-module';

type RouteContext = { params: Promise<{ caseId: string }> };

const ResearchRequestSchema = z.object({
  question: z.string().min(1).max(500),
  depth: z.enum(['light', 'standard', 'deep']).default('standard'),
  selectedSourceSets: z.array(z.string().min(1).max(40)).max(12).default([]),
  situation: z.custom<Situation>().optional(),
});

export const maxDuration = 30;

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  const { caseId } = await context.params;
  const parsed = ResearchRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid research request', details: parsed.error.flatten() }, { status: 400 });
  }

  const caseModule = getCaseModule(caseId) ?? moduleFromSituation(caseId, parsed.data.situation);
  if (!caseModule) {
    return NextResponse.json({ error: 'Case context required' }, { status: 400 });
  }

  if (user.isDemo) {
    return NextResponse.json({
      mode: 'demo-deterministic',
      results: buildResearchCandidates(caseModule, parsed.data.question, parsed.data.selectedSourceSets, parsed.data.depth),
    });
  }

  try {
    const liveResults = await executeWebResearch(parsed.data.question, caseModule.manifest.name, user.uid, {
      maxResults: parsed.data.depth === 'deep' ? 10 : parsed.data.depth === 'standard' ? 7 : 4,
      favoriteSources: parsed.data.selectedSourceSets,
      researchDepth: parsed.data.depth,
      region: caseModule.manifest.region,
      actors: caseModule.situation.actors,
      description: caseModule.situation.description,
      toolId: 'source-scout',
    });
    return NextResponse.json({
      mode: 'google-grounded',
      results: liveResults.map((result, index) => ({
        id: `live-${index}`,
        title: result.title,
        url: result.url,
        provider: result.source,
        snippet: result.snippet ?? result.content.slice(0, 240),
        relevance: Math.round(result.reliabilityScore * 100),
        sourceSet: result.provider,
      })),
    });
  } catch (err) {
    console.warn('[cases/research] falling back to deterministic results', err);
    return NextResponse.json({
      mode: 'fallback-deterministic',
      results: buildResearchCandidates(caseModule, parsed.data.question, parsed.data.selectedSourceSets, parsed.data.depth as ResearchDepth),
    });
  }
});

function moduleFromSituation(caseId: string, situation?: Situation): CaseModule | null {
  if (!situation) return null;
  return {
    id: caseId,
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
      receiptId: `${caseId}-research-source-${index}`,
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
}
