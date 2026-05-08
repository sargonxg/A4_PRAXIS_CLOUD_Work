import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedUser } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';
import { createSituationAdmin } from '@/lib/firebase/situations';
import {
  SYRIA_DEMO_CANONICAL_GRAPH,
  SYRIA_DEMO_CASE_ID,
  SYRIA_DEMO_SITUATION,
  isSyriaDemoCase,
} from '@/lib/constants/syria-demo-case';
import { emitTelemetrySafe } from '@/lib/telemetry/emit';
import type { CreateSituationInput } from '@/types/situation';

export const dynamic = 'force-dynamic';

const CopySchema = z.object({
  demoCaseId: z.string().min(1),
});

export const GET = withAuth(async (request, user) => {
  const url = new URL(request.url);
  const parsed = CopySchema.safeParse({ demoCaseId: url.searchParams.get('demoCaseId') ?? SYRIA_DEMO_CASE_ID });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid demo case request', details: parsed.error.flatten() }, { status: 400 });
  }
  if (!isSyriaDemoCase(parsed.data.demoCaseId)) {
    return NextResponse.json({ error: 'Unsupported demo case' }, { status: 404 });
  }

  const result = await copyDemoCase(user, parsed.data.demoCaseId);
  return NextResponse.redirect(new URL(result.redirectUrl, request.url), { status: 303 });
});

export const POST = withAuth(async (request, user) => {
  const parsed = CopySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid demo case request', details: parsed.error.flatten() }, { status: 400 });
  }
  if (!isSyriaDemoCase(parsed.data.demoCaseId)) {
    return NextResponse.json({ error: 'Unsupported demo case' }, { status: 404 });
  }

  const result = await copyDemoCase(user, parsed.data.demoCaseId);
  return NextResponse.json(result);
});

async function copyDemoCase(user: AuthenticatedUser, demoCaseId: string) {
  if (user.isDemo) {
    return {
      caseId: SYRIA_DEMO_CASE_ID,
      redirectUrl: `/login?next=${encodeURIComponent(`/api/situations/copy-from-demo?demoCaseId=${encodeURIComponent(demoCaseId)}`)}`,
      copied: false,
      reason: 'demo-session',
    };
  }

  const input: CreateSituationInput = {
    name: `${SYRIA_DEMO_SITUATION.name} (workspace copy)`,
    type: SYRIA_DEMO_SITUATION.type,
    description: SYRIA_DEMO_SITUATION.description,
    region: SYRIA_DEMO_SITUATION.region,
    actors: SYRIA_DEMO_SITUATION.actors,
    userRole: SYRIA_DEMO_SITUATION.userRole,
    status: 'active',
    sourceUrls: SYRIA_DEMO_SITUATION.sourceUrls,
    contextNotes: `${SYRIA_DEMO_SITUATION.contextNotes ?? ''}\n\nCopied from the public Syria demo on ${new Date().toISOString()}.`.trim(),
    ontology: SYRIA_DEMO_SITUATION.ontology,
    ontologyId: SYRIA_DEMO_SITUATION.ontologyId,
    ontologyIds: SYRIA_DEMO_SITUATION.ontologyIds,
    primaryOntologyId: SYRIA_DEMO_SITUATION.primaryOntologyId,
    ontologyConfidence: SYRIA_DEMO_SITUATION.ontologyConfidence,
    ontologyRationale: SYRIA_DEMO_SITUATION.ontologyRationale,
    caseType: SYRIA_DEMO_SITUATION.caseType,
    caseTypeSecondary: SYRIA_DEMO_SITUATION.caseTypeSecondary,
    caseTypeConfidence: SYRIA_DEMO_SITUATION.caseTypeConfidence,
    caseTypeLocked: SYRIA_DEMO_SITUATION.caseTypeLocked,
    domain: SYRIA_DEMO_SITUATION.domain,
    domainConfidence: SYRIA_DEMO_SITUATION.domainConfidence,
    domainOverriddenByUser: SYRIA_DEMO_SITUATION.domainOverriddenByUser,
    riskScore: SYRIA_DEMO_SITUATION.riskScore,
    glaslStage: SYRIA_DEMO_SITUATION.glaslStage,
    escalationTrend: SYRIA_DEMO_SITUATION.escalationTrend,
    sourceCategoriesEnabled: SYRIA_DEMO_SITUATION.sourceCategoriesEnabled,
    sourceCategoryOrder: SYRIA_DEMO_SITUATION.sourceCategoryOrder,
    workflowPath: SYRIA_DEMO_SITUATION.workflowPath,
    workflowPathLabel: SYRIA_DEMO_SITUATION.workflowPathLabel,
    customSources: SYRIA_DEMO_SITUATION.customSources,
  };

  const created = await createSituationAdmin(user.uid, input);
  await adminDb
    .collection('users')
    .doc(user.uid)
    .collection('situations')
    .doc(created.id)
    .collection('graph')
    .doc('main')
    .set({
      ...JSON.parse(JSON.stringify(SYRIA_DEMO_CANONICAL_GRAPH)),
      sourceDemoCaseId: SYRIA_DEMO_CASE_ID,
      copiedAt: new Date().toISOString(),
    });

  await emitTelemetrySafe({
    eventName: 'case.create',
    uid: user.uid,
    orgId: orgIdOf(user),
    caseId: created.id,
    route: '/api/situations/copy-from-demo',
    status: 'ok',
    details: {
      source: 'demo-copy',
      demoCaseId: SYRIA_DEMO_CASE_ID,
      graphNodeCount: SYRIA_DEMO_CANONICAL_GRAPH.nodes.length,
      graphEdgeCount: SYRIA_DEMO_CANONICAL_GRAPH.edges.length,
    },
  });

  return {
    caseId: created.id,
    redirectUrl: `/app/workbench/${encodeURIComponent(created.id)}?source=demo`,
    situation: created,
    copied: true,
  };
}

function orgIdOf(user: AuthenticatedUser): string | null {
  return (user as AuthenticatedUser & { orgId?: string }).orgId ?? null;
}
