import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { buildContextSnapshot } from '@/lib/context/context-aware';
import { createContextProvider } from '@/lib/tools/context-provider';
import { getMarketplaceTool } from '@/lib/tools/marketplace/registry';
import { buildMarketplaceToolRun } from '@/lib/tools/marketplace/runner';
import {
  buildToolRunArtifact,
  persistToolRunArtifact,
  summarizeToolRunArtifact,
  type ToolRunArtifactRecord,
} from '@/lib/tools/marketplace/run-artifact';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const LooseObject = z.record(z.string(), z.unknown());

const RunBodySchema = z.object({
  toolId: z.string().min(1),
  caseId: z.string().min(1).optional(),
  prompt: z.string().max(8000).optional(),
  context: LooseObject.optional(),
  toolRunId: z.string().min(1).max(160).optional(),
}).passthrough();

export const GET = withAuth(async (req, user) => {
  try {
    const url = new URL(req.url);
    const caseId = url.searchParams.get('caseId')?.trim();
    const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') ?? '8') || 8));

    if (!caseId) {
      return NextResponse.json({ error: 'caseId required' }, { status: 400 });
    }

    if (user.isDemo) {
      return NextResponse.json({ items: [] });
    }

    const db = getAdminDbOrThrow();
    const snap = await db
      .collection('users')
      .doc(user.uid)
      .collection('situations')
      .doc(caseId)
      .collection('toolRunArtifacts')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const items = snap.docs.map((doc) => {
      const record = { id: doc.id, ...doc.data() } as ToolRunArtifactRecord;
      return summarizeToolRunArtifact(record);
    });

    return NextResponse.json({ items });
  } catch (err) {
    return handleRouteError(err, 'tools/marketplace/run/history');
  }
});

export const POST = withAuth(async (req, user) => {
  try {
    const startedAt = new Date();
    const startedMs = Date.now();
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
    const completedAt = new Date();
    const runTelemetry = {
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: Date.now() - startedMs,
      costClass: tool.costClass,
      estimatedRuntimeMs: tool.estimatedRuntimeMs,
      providerCostUsd: null,
      telemetryStage: 'deterministic-unmetered',
    };
    const artifactInput = {
      uid: user.uid,
      situationId,
      toolId: tool.id,
      toolRunId: parsed.data.toolRunId,
      prompt: parsed.data.prompt,
      rawText: result.rawText,
      structuredOutput: result.structuredOutput,
      contextDump: result.contextDump,
      metadata: {
        ...result.metadata,
        runTelemetry,
      },
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
      telemetry: runTelemetry,
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
