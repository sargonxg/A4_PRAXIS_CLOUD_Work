import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { buildContextSnapshot } from '@/lib/api/with-context-aware';
import { buildPromptHealthReport } from '@/lib/context/prompt-health';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return withAuth(async (request, user) => {
    const url = new URL(request.url);
    const situationId = url.searchParams.get('situationId') ?? undefined;
    const toolId = url.searchParams.get('toolId') ?? 'hero-tool';
    const snapshot = await buildContextSnapshot({
      req: request,
      user,
      situationId,
      spec: promptHealthSpec(toolId),
    });
    const promptHealth = buildPromptHealthReport(snapshot);
    return NextResponse.json({ promptHealth, snapshot: summarizeSnapshot(snapshot) }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  })(req);
}

export function POST(req: NextRequest) {
  return withAuth(async (request, user) => {
    const body = await request.json().catch(() => ({})) as {
      situationId?: unknown;
      toolId?: unknown;
    };
    const situationId = typeof body.situationId === 'string' ? body.situationId : undefined;
    const toolId = typeof body.toolId === 'string' ? body.toolId : 'hero-tool';
    const snapshot = await buildContextSnapshot({
      req: request,
      user,
      situationId,
      spec: promptHealthSpec(toolId),
    });
    const promptHealth = buildPromptHealthReport(snapshot);
    return NextResponse.json({ promptHealth, snapshot: summarizeSnapshot(snapshot) }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  })(req);
}

function promptHealthSpec(toolId: string) {
  return {
    user: { role: true, preferences: true },
    workspace: { methodologyDocs: true },
    caseGraph: { minNodeCount: toolId === 'dashboard' ? 0 : 1 },
    minHealthScore: 60,
    graceful: true,
  } as const;
}

function summarizeSnapshot(snapshot: Awaited<ReturnType<typeof buildContextSnapshot>>) {
  return {
    score: snapshot.composite.health,
    weakestLayer: snapshot.composite.weakestLayer,
    case: {
      caseId: snapshot.case.caseId,
      name: snapshot.case.frame.name,
      sources: snapshot.case.sourceCount,
      documents: snapshot.case.documentCount,
      graphNodes: snapshot.case.graphNodeCount,
      graphEdges: snapshot.case.graphEdgeCount,
      lowestDimension: snapshot.case.contextHealth.lowestDimension,
    },
  };
}
