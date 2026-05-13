import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedUser } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';
import { createSituationAdmin } from '@/lib/firebase/situations';
import { getV5DemoCaseModule } from '@/lib/cases/v5-demo-contexts';
import {
  SYRIA_DEMO_CANONICAL_GRAPH,
  SYRIA_DEMO_CASE_ID,
  SYRIA_DEMO_SITUATION,
  isSyriaDemoCase,
} from '@/lib/constants/syria-demo-case';
import {
  DEMO_CONTEXT_USER_MODEL_BY_SITUATION,
  getDemoGraphCore,
  getDemoOutputCore,
  getDemoSituationCore,
  getDemoSourceCores,
  getDemoUserCoreForSituation,
} from '@/lib/context/demo-core-objects';
import { sanitizeActiveContextStack } from '@/lib/context/active-context-stack';
import { nextMovesDocId, sanitizeWorkspaceNextMoves } from '@/lib/dashboard/next-moves';
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
  if (!isSupportedDemoCase(parsed.data.demoCaseId)) {
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
  if (!isSupportedDemoCase(parsed.data.demoCaseId)) {
    return NextResponse.json({ error: 'Unsupported demo case' }, { status: 404 });
  }

  const result = await copyDemoCase(user, parsed.data.demoCaseId);
  return NextResponse.json(result);
});

async function copyDemoCase(user: AuthenticatedUser, demoCaseId: string) {
  const v5Demo = getV5DemoCaseModule(demoCaseId);
  if (v5Demo) return copyV5DemoCase(user, demoCaseId);

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

async function copyV5DemoCase(user: AuthenticatedUser, demoCaseId: string) {
  const caseModule = getV5DemoCaseModule(demoCaseId);
  const demoUserCore = getDemoUserCoreForSituation(demoCaseId);
  const demoSituationCore = getDemoSituationCore(demoCaseId);
  if (!caseModule || !demoUserCore || !demoSituationCore) {
    return {
      caseId: demoCaseId,
      redirectUrl: '/app/contexts',
      copied: false,
      reason: 'unsupported-v5-demo',
    };
  }

  if (user.isDemo) {
    return {
      caseId: demoCaseId,
      redirectUrl: `/login?next=${encodeURIComponent(`/api/situations/copy-from-demo?demoCaseId=${encodeURIComponent(demoCaseId)}`)}`,
      copied: false,
      reason: 'demo-session',
    };
  }

  const situation = caseModule.situation;
  const input: CreateSituationInput = {
    name: `${situation.name} (workspace copy)`,
    type: situation.type,
    description: situation.description,
    region: situation.region,
    actors: situation.actors,
    userRole: situation.userRole,
    status: 'active',
    sourceUrls: situation.sourceUrls,
    contextNotes: `${situation.contextNotes ?? ''}\n\nCopied from PRAXIS demo core ${demoCaseId} on ${new Date().toISOString()}.`.trim(),
    initialDocumentIds: situation.initialDocumentIds,
    ontology: situation.ontology,
    ontologyId: situation.ontologyId,
    ontologyIds: situation.ontologyIds,
    primaryOntologyId: situation.primaryOntologyId,
    ontologyConfidence: situation.ontologyConfidence,
    ontologyRationale: situation.ontologyRationale,
    caseType: situation.caseType,
    caseTypeSecondary: situation.caseTypeSecondary,
    caseTypeConfidence: situation.caseTypeConfidence,
    caseTypeLocked: situation.caseTypeLocked,
    domain: situation.domain,
    domainConfidence: situation.domainConfidence,
    domainOverriddenByUser: situation.domainOverriddenByUser,
    riskScore: situation.riskScore,
    glaslStage: situation.glaslStage,
    escalationTrend: situation.escalationTrend,
    sourceCategoriesEnabled: situation.sourceCategoriesEnabled,
    sourceCategoryOrder: situation.sourceCategoryOrder,
    workflowPath: situation.workflowPath,
    workflowPathLabel: situation.workflowPathLabel,
    customSources: situation.customSources,
    semanticaContextGraph: situation.semanticaContextGraph,
    semanticaLayer: situation.semanticaLayer,
  };

  const created = await createSituationAdmin(user.uid, input);
  const now = new Date().toISOString();
  const userModelId = DEMO_CONTEXT_USER_MODEL_BY_SITUATION[demoCaseId] ?? 'foreign-policy-analyst';
  const sourceCores = getDemoSourceCores(demoCaseId).slice(0, 18);
  const graphCore = getDemoGraphCore(demoCaseId);
  const outputCore = getDemoOutputCore(demoCaseId);
  const userCoreId = `user-core:${created.id}:${userModelId}`;
  const situationCoreId = `situation-core:${created.id}`;
  const sourceCoreIds = sourceCores.map((core) => `source-core:${created.id}:${core.id.split(':').pop() ?? core.id}`);
  const graphCoreId = graphCore ? `graph-core:${created.id}` : null;
  const outputCoreId = outputCore ? `output-core:${created.id}:memo` : null;

  const batch = adminDb.batch();
  const userRef = adminDb.collection('users').doc(user.uid);
  const coresRef = userRef.collection('cores');

  batch.set(coresRef.doc(userCoreId), forkCore(demoUserCore, user.uid, userCoreId, now));
  batch.set(coresRef.doc(situationCoreId), forkCore(demoSituationCore, user.uid, situationCoreId, now, { situationId: created.id }));
  sourceCores.forEach((core, index) => {
    const id = sourceCoreIds[index];
    batch.set(coresRef.doc(id), forkCore(core, user.uid, id, now, { situationId: created.id }));
    batch.set(userRef.collection('situations').doc(created.id).collection('sources').doc(id), {
      ...forkCore(core, user.uid, id, now, { situationId: created.id }),
      sourceReceiptId: core.id,
    });
  });
  if (graphCore && graphCoreId) batch.set(coresRef.doc(graphCoreId), forkCore(graphCore, user.uid, graphCoreId, now, { situationId: created.id }));
  if (outputCore && outputCoreId) batch.set(coresRef.doc(outputCoreId), forkCore(outputCore, user.uid, outputCoreId, now, { situationId: created.id }));

  batch.set(userRef.collection('situations').doc(created.id).collection('graph').doc('main'), {
    nodes: [
      ...created.actors.map((actor) => ({ id: `actor:${actor}`, label: actor, type: 'actor' })),
      ...caseModule.sources.slice(0, 12).map((source) => ({ id: `source:${source.receiptId}`, label: source.title, type: 'source' })),
      ...(caseModule.episodes ?? []).slice(0, 10).map((episode) => ({ id: `episode:${episode.episodeId}`, label: episode.title, type: episode.strand })),
    ],
    edges: caseModule.sources.slice(0, 12).map((source, index) => ({
      id: `edge:${index + 1}`,
      source: `source:${source.receiptId}`,
      target: `actor:${created.actors[index % Math.max(1, created.actors.length)]}`,
      label: 'informs',
    })),
    sourceDemoCaseId: demoCaseId,
    copiedAt: now,
    graphCoreId,
  });

  const stack = sanitizeActiveContextStack({
    stackId: 'default',
    userModelId,
    situationId: created.id,
    sourceIds: sourceCoreIds,
    documentIds: [],
    outputGoal: outputCore?.title ?? `Memo from ${created.name}`,
    canvasLayout: graphCore?.layout ?? {},
  });
  batch.set(userRef.collection('contextStacks').doc('default'), stack, { merge: true });

  const moves = sanitizeWorkspaceNextMoves({
    situationId: created.id,
    userModelId,
    now,
    moves: demoSituationCore.nextMoves.map((label, index) => ({
      id: `demo-next-${index + 1}`,
      label,
      detail: index === 0 ? 'Start by asking PRAXIS with the copied cores attached.' : 'Use the copied demo structure as a starting point, then replace demo evidence with your own receipts.',
      href: index === 1 ? `/app/workbench/${created.id}?tab=library` : index === 2 ? '/app/write' : '/app/assistant',
      emphasis: index === 0 ? 'primary' : 'secondary',
      status: 'open',
    })),
  });
  if (moves) {
    batch.set(userRef.collection('workspace-next-moves').doc(nextMovesDocId(created.id, userModelId)), moves, { merge: true });
  }

  await batch.commit();

  await emitTelemetrySafe({
    eventName: 'case.create',
    uid: user.uid,
    orgId: orgIdOf(user),
    caseId: created.id,
    route: '/api/situations/copy-from-demo',
    status: 'ok',
    details: {
      source: 'v5-demo-core-copy',
      demoCaseId,
      coreCount: 2 + sourceCores.length + (graphCore ? 1 : 0) + (outputCore ? 1 : 0),
      sourceReceiptCount: caseModule.sources.length,
    },
  });

  return {
    caseId: created.id,
    redirectUrl: `/app/workbench/${encodeURIComponent(created.id)}?source=demo-core`,
    situation: created,
    copied: true,
    cores: {
      userCoreId,
      situationCoreId,
      sourceCoreIds,
      graphCoreId,
      outputCoreId,
    },
  };
}

function isSupportedDemoCase(demoCaseId: string) {
  return isSyriaDemoCase(demoCaseId) || Boolean(getV5DemoCaseModule(demoCaseId));
}

function forkCore<T extends { ownerUid: string; id: string; status: string; isDemo: boolean; sourceDemoId?: string | null; updatedAt: string; provenance: { notes?: string } }>(
  core: T,
  ownerUid: string,
  id: string,
  now: string,
  extra?: Record<string, unknown>,
): T & Record<string, unknown> {
  return {
    ...JSON.parse(JSON.stringify(core)),
    ...extra,
    id,
    ownerUid,
    status: 'active',
    isDemo: false,
    sourceDemoId: core.sourceDemoId ?? core.id,
    updatedAt: now,
    provenance: {
      ...core.provenance,
      source: 'public-demo',
      notes: `${core.provenance.notes ?? ''} Forked into user workspace on ${now}.`.trim(),
    },
  };
}

function orgIdOf(user: AuthenticatedUser): string | null {
  return (user as AuthenticatedUser & { orgId?: string }).orgId ?? null;
}
