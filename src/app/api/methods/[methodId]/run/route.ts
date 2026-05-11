import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { buildContextSnapshot } from '@/lib/context/context-aware';
import { getMethodById, getMethodSourceTool } from '@/lib/methods/catalog';
import { MethodRunInputSchema, runMvpMethod } from '@/lib/methods/runtime';
import {
  buildToolRunArtifact,
  persistToolRunArtifact,
} from '@/lib/tools/marketplace/run-artifact';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ methodId: string }> };

export const POST = withAuth<RouteContext>(async (req, user, context) => {
  try {
    const startedAt = new Date();
    const startedMs = Date.now();
    const { methodId } = await context.params;
    const method = getMethodById(methodId);
    if (!method) {
      return NextResponse.json({ error: 'Unknown method', methodId }, { status: 404 });
    }

    const parsed = MethodRunInputSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid method run request', details: parsed.error.flatten() }, { status: 400 });
    }

    const sourceTool = getMethodSourceTool(method);
    const snapshot = await buildContextSnapshot({
      req,
      user,
      situationId: parsed.data.caseId,
      spec: sourceTool?.contextSpec ?? {
        user: { role: true, preferences: true },
        workspace: { methodologyDocs: true },
        caseGraph: { minNodeCount: 1 },
        conversation: { focusedNodeRequired: false },
        minHealthScore: 1,
        graceful: true,
      },
    });
    const output = runMvpMethod({
      method,
      snapshot,
      prompt: parsed.data.prompt,
      analystInput: parsed.data.input,
    });
    const runTelemetry = {
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
      costClass: output.runtime.costClass,
      providerCostUsd: null,
      telemetryStage: output.runtime.handlerStage,
    };
    const artifactInput = {
      uid: user.uid,
      situationId: parsed.data.caseId,
      toolId: method.runtimeId,
      toolRunId: parsed.data.toolRunId,
      prompt: parsed.data.prompt,
      rawText: output.summary,
      structuredOutput: output,
      contextDump: {
        snapshot,
        method: { id: method.id, runtimeId: method.runtimeId },
      },
      metadata: {
        handlerStage: output.runtime.handlerStage,
        runTelemetry,
      },
    };
    const artifact = buildToolRunArtifact(artifactInput);
    const persistence = user.isDemo
      ? { persisted: false, artifactId: artifact.id, reason: 'demo_mode' }
      : await persistToolRunArtifact(artifactInput);

    return NextResponse.json({
      success: true,
      method,
      output,
      artifact,
      persistence,
      telemetry: runTelemetry,
    });
  } catch (err) {
    return handleRouteError(err, 'methods/run');
  }
});
