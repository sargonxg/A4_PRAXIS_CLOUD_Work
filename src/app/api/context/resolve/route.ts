import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { localKnowledgeAdapter } from '@/lib/knowledge/context-engine';
import { resolveInjectableContext } from '@/lib/context/context-injection';
import { buildTurnCapsule, compileEffectiveCapsule } from '@/lib/ai/context-kernel';
import type { ActiveContextStackState } from '@/lib/context/active-context-stack';

const RequestSchema = z.object({
  capsuleId: z.string().optional(),
  contextPackageId: z.string().optional(),
  situationId: z.string().min(1).optional(),
  query: z.string().max(2000).optional(),
  activeContextStack: z.unknown().optional(),
  coreRefs: z.object({
    userCoreId: z.string().optional(),
    teamCoreId: z.string().optional(),
    situationCoreId: z.string().optional(),
    sourceCoreIds: z.array(z.string()).optional(),
    documentCoreIds: z.array(z.string()).optional(),
    graphCoreId: z.string().optional(),
    timeCoreId: z.string().optional(),
    outputCoreIds: z.array(z.string()).optional(),
    toolCoreIds: z.array(z.string()).optional(),
    objectiveCoreIds: z.array(z.string()).optional(),
    productCoreIds: z.array(z.string()).optional(),
    memoryCoreId: z.string().optional(),
  }).optional(),
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot resolve private context packages' }, { status: 403 });
    }
    const raw = await request.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    const injectable = await resolveInjectableContext({
      uid: user.uid,
      capsuleId: parsed.data.capsuleId,
      contextPackageId: parsed.data.contextPackageId,
      activeContextStack: isRecord(parsed.data.activeContextStack)
        ? parsed.data.activeContextStack as Partial<ActiveContextStackState>
        : null,
      situationId: parsed.data.situationId,
    });
    const turnCapsule = await buildTurnCapsule({
      uid: user.uid,
      capsuleId: parsed.data.capsuleId,
      contextPackageId: parsed.data.contextPackageId,
      activeContextStack: isRecord(parsed.data.activeContextStack)
        ? parsed.data.activeContextStack as Partial<ActiveContextStackState>
        : null,
      situationId: parsed.data.situationId,
      query: parsed.data.query,
    });
    const effectiveCapsule = compileEffectiveCapsule(turnCapsule, parsed.data.query);
    const situationId = parsed.data.situationId ?? injectable.stack.situationId;
    if (!situationId) {
      return NextResponse.json({ injectable, effectiveCapsule });
    }

    const context = await localKnowledgeAdapter.buildContextPack({
      uid: user.uid,
      contextPackageId: parsed.data.contextPackageId,
      situationId,
      query: parsed.data.query,
      coreRefs: parsed.data.coreRefs,
    });
    return NextResponse.json({ ...context, injectable, effectiveCapsule });
  } catch (err) {
    return handleRouteError(err, 'context/resolve');
  }
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
