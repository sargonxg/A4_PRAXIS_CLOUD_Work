import type { AuthenticatedUser } from '@/lib/api/with-auth';
import { computeContextHealthScore } from '@/lib/context/context-health-score';
import { getSituationAdmin } from '@/lib/firebase/situations';
import type { ContextAdvisory, ContextSnapshot, ContextSpec, ConversationContext, UserContext, WorkspaceContext } from '@/types/context';
import type { Situation } from '@/types/situation';

export interface ContextAwareOptions {
  req: Request;
  user: AuthenticatedUser;
  situationId?: string;
  spec?: ContextSpec;
}

export interface ContextAwareResult {
  snapshot: ContextSnapshot;
  headers: Headers;
}

export async function buildContextSnapshot({
  req,
  user,
  situationId,
  spec,
}: ContextAwareOptions): Promise<ContextSnapshot> {
  const situation = situationId && !user.isDemo
    ? await getSituationAdmin(user.uid, situationId).catch(() => null)
    : null;
  const caseContext = buildCaseContext(user.uid, situationId, situation, spec);
  const userContext = buildUserContext(user, caseContext.ontologyId);
  const workspaceContext = buildWorkspaceContext(userContext);
  const conversationContext = parseConversationContext(req, spec);
  const advisories = buildContextAdvisories(userContext, workspaceContext, caseContext, conversationContext, spec);
  const weakestLayer = inferWeakestLayer(caseContext.contextHealth.score, advisories);

  return {
    user: userContext,
    workspace: workspaceContext,
    case: caseContext,
    conversation: conversationContext,
    composite: {
      health: caseContext.contextHealth.score,
      weakestLayer,
      advisories,
    },
  };
}

export async function withContextAware(options: ContextAwareOptions): Promise<ContextAwareResult> {
  const snapshot = await buildContextSnapshot(options);
  const headers = new Headers();
  headers.set('X-Praxis-Context-Health', String(snapshot.composite.health));
  headers.set('X-Praxis-Context-Weakest-Layer', snapshot.composite.weakestLayer);
  headers.set('X-Praxis-Context-Advisory', snapshot.composite.advisories.map((item) => item.message).join(' | '));
  return { snapshot, headers };
}

function buildUserContext(user: AuthenticatedUser, ontologyId: string): UserContext {
  return {
    uid: user.uid,
    workspaceId: `personal-${user.uid}`,
    identity: {
      displayName: user.name || user.email || 'PRAXIS user',
      role: user.isDemo ? 'analyst' : undefined,
    },
    mandate: {
      typicalOutputs: ontologyId === 'mediation' ? ['mediation-summary'] : ['policy-memo'],
    },
    preferences: {
      preferredOntologies: [ontologyId as never],
      defaultMemoTemplate: ontologyId === 'mediation' ? 'mediation-summary' : 'policy-memo',
      communicationStyle: 'concise',
      confidenceTolerance: 'medium',
    },
    capturedAt: {},
  };
}

function buildWorkspaceContext(userContext: UserContext): WorkspaceContext {
  return {
    workspaceId: userContext.workspaceId,
    ownerUid: userContext.uid,
    label: 'Personal workspace',
    guidelines: [],
    glossary: [],
    methodologyDocs: [],
  };
}

function buildCaseContext(ownerUid: string, situationId: string | undefined, situation: Situation | null, spec: ContextSpec | undefined): ContextSnapshot['case'] {
  const report = computeContextHealthScore({ situation, threshold: spec?.minHealthScore ?? 60 });
  return {
    caseId: situationId ?? situation?.id ?? 'no-active-case',
    ownerUid,
    ontologyId: ((situation?.domain as string | undefined) ?? spec?.caseGraph?.requiredOntology ?? 'conflict') as never,
    frame: {
      name: situation?.name ?? 'No active case',
      region: situation?.region,
      summary: situation?.description ?? situation?.contextNotes,
      domain: situation?.domain,
    },
    sourceCount: (situation?.sourceUrls?.length ?? 0) + (situation?.customSources?.length ?? 0),
    documentCount: situation?.documentCount ?? situation?.initialDocumentIds?.length ?? 0,
    graphNodeCount: situation?.graphEntities ?? 0,
    graphEdgeCount: Array.isArray((situation as { relationships?: unknown[] } | null)?.relationships)
      ? ((situation as { relationships?: unknown[] }).relationships ?? []).length
      : 0,
    contextHealth: {
      score: report.score,
      threshold: report.threshold,
      ready: report.ready,
      lowestDimension: report.lowestDimension,
    },
  };
}

function parseConversationContext(req: Request, spec: ContextSpec | undefined): ConversationContext {
  const fallback: ConversationContext = {
    sessionId: 'request-session',
    startedAt: new Date().toISOString(),
    focusedToolId: spec?.conversation?.focusedToolRequired ? 'unknown-tool' : undefined,
    recentActions: [],
  };
  const raw = req.headers.get('X-Praxis-Conversation');
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<ConversationContext>;
    return {
      ...fallback,
      ...parsed,
      recentActions: Array.isArray(parsed.recentActions) ? parsed.recentActions.slice(-10) as ConversationContext['recentActions'] : [],
    };
  } catch {
    return fallback;
  }
}

function buildContextAdvisories(
  user: UserContext,
  workspace: WorkspaceContext,
  caseContext: ContextSnapshot['case'],
  conversation: ConversationContext,
  spec: ContextSpec | undefined,
): ContextAdvisory[] {
  const advisories: ContextAdvisory[] = [];
  if (spec?.graceful === false) {
    advisories.push({ layer: 'case', severity: 'info', message: 'This tool requested strict context, but PRAXIS records advisory context instead of blocking.' });
  }
  if (spec?.user?.role && !user.identity.role) {
    advisories.push({ layer: 'user', severity: 'warn', message: 'User role is not set; output tone may be generic.', action: 'Set role in preferences.' });
  }
  if (spec?.workspace?.methodologyDocs && (workspace.methodologyDocs?.length ?? 0) === 0) {
    advisories.push({ layer: 'workspace', severity: 'info', message: 'No workspace methodology documents are uploaded yet.', action: 'Add workspace guidelines.' });
  }
  if (spec?.caseGraph?.minNodeCount && caseContext.graphNodeCount < spec.caseGraph.minNodeCount) {
    advisories.push({ layer: 'case', severity: 'warn', message: `Case graph has ${caseContext.graphNodeCount} nodes; this tool prefers ${spec.caseGraph.minNodeCount}.`, action: 'Run ingestion or accept graph proposals.' });
  }
  if (spec?.minHealthScore && caseContext.contextHealth.score < spec.minHealthScore) {
    advisories.push({ layer: 'case', severity: 'warn', message: `Context health is ${caseContext.contextHealth.score}/100; tool will run with advisory context.`, action: 'Use AI assist or add sources.' });
  }
  if (spec?.conversation?.focusedNodeRequired && !conversation.focusedNodeId) {
    advisories.push({ layer: 'conversation', severity: 'info', message: 'No focused graph node was passed with the request.', action: 'Select a node or continue with broader case context.' });
  }
  return advisories;
}

function inferWeakestLayer(score: number, advisories: ContextAdvisory[]): ContextSnapshot['composite']['weakestLayer'] {
  const critical = advisories.find((item) => item.severity === 'critical' || item.severity === 'warn');
  if (critical) return critical.layer;
  if (score < 60) return 'case';
  return advisories[0]?.layer ?? 'conversation';
}
