import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { getCaseModule } from '@/lib/cases/registry';
import { buildResearchPlan } from '@/lib/workbench/research-state';
import type { CaseModule } from '@/types/case-module';
import type { Situation } from '@/types/situation';

type RouteContext = { params: Promise<{ caseId: string }> };

const ResearchPlanRequestSchema = z.object({
  question: z.string().min(1).max(500),
  situation: z.custom<Situation>().optional(),
});

export const POST = withAuth<RouteContext>(async (request, _user, context) => {
  const { caseId } = await context.params;
  const parsed = ResearchPlanRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid research plan request', details: parsed.error.flatten() }, { status: 400 });
  }

  const caseModule = getCaseModule(caseId) ?? moduleFromSituation(caseId, parsed.data.situation);
  if (!caseModule) return NextResponse.json({ error: 'Case context required' }, { status: 400 });

  return NextResponse.json({
    mode: 'deterministic-research-planner',
    planner: 'research_planner',
    plan: buildResearchPlan(caseModule, parsed.data.question),
  });
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
    sources: [],
    truthLayers: {
      source: { nodeCount: situation.sourceUrls?.length ?? 0, edgeCount: 0, confidenceMin: 0, confidenceMax: 0, lastUpdated: situation.updatedAt, provenanceCoverage: 0 },
      claim: { nodeCount: situation.graphEntities ?? 0, edgeCount: 0, confidenceMin: 0, confidenceMax: 0, lastUpdated: situation.updatedAt, provenanceCoverage: 0 },
      evidence: { nodeCount: 0, edgeCount: 0, confidenceMin: 0, confidenceMax: 0, lastUpdated: situation.updatedAt, provenanceCoverage: 0 },
      verdict: { nodeCount: 0, edgeCount: 0, confidenceMin: 0, confidenceMax: 0, lastUpdated: situation.updatedAt, provenanceCoverage: 0 },
    },
  };
}

