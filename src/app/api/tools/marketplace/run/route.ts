import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { buildContextSnapshot } from '@/lib/context/context-aware';
import { createContextProvider } from '@/lib/tools/context-provider';
import { getMarketplaceTool } from '@/lib/tools/marketplace/registry';
import { buildMarketplaceToolRun } from '@/lib/tools/marketplace/runner';
import { buildToolRunArtifact, persistToolRunArtifact } from '@/lib/tools/marketplace/run-artifact';

export const dynamic = 'force-dynamic';

const LooseObject = z.record(z.string(), z.unknown());

const RunBodySchema = z.object({
  toolId: z.string().min(1),
  caseId: z.string().min(1).optional(),
  prompt: z.string().max(8000).optional(),
  context: LooseObject.optional(),
  toolRunId: z.string().min(1).max(160).optional(),
}).passthrough();

export const POST = withAuth(async (req, user) => {
  try {
    const parsed = RunBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid marketplace run request', details: parsed.error.flatten() }, { status: 400 });
    }

    const tool = getMarketplaceTool(parsed.data.toolId);
    if (!tool) {
      return NextResponse.json({ error: 'Unknown marketplace tool', toolId: parsed.data.toolId }, { status: 404 });
    }

    const situationId = parsed.data.caseId ?? tool.canaryCaseIds[0] ?? 'no-active-case';
    const snapshot = await buildContextSnapshot({
      req,
      user,
      situationId,
      spec: tool.contextSpec,
    });
    const runContext = createContextProvider({ snapshot }).forTool(tool);
    const result = buildMarketplaceToolRun({
      tool,
      runContext,
      prompt: parsed.data.prompt,
      analystContext: parsed.data.context,
    });
    const artifactInput = {
      uid: user.uid,
      situationId,
      toolId: tool.id,
      toolRunId: parsed.data.toolRunId,
      prompt: parsed.data.prompt,
      rawText: result.rawText,
      structuredOutput: result.structuredOutput,
      contextDump: result.contextDump,
      metadata: result.metadata,
    };
    const artifact = buildToolRunArtifact(artifactInput);
    const persistence = user.isDemo
      ? { persisted: false, artifactId: artifact.id, reason: 'demo_mode' }
      : await persistToolRunArtifact(artifactInput);

    return NextResponse.json({
      success: true,
      tool,
      artifact,
      persistence,
      runContext: {
        health: snapshot.composite.health,
        weakestLayer: snapshot.composite.weakestLayer,
        advisories: snapshot.composite.advisories,
        projection: runContext.projection,
      },
    });
  } catch (err) {
    return handleRouteError(err, 'tools/marketplace/run');
  }
});
