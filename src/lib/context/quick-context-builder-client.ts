import {
  createLightweightContextCoreLite,
  type LightweightContextCoreLite,
} from '@/lib/context/context-core-lite';
import {
  starterContextNotes,
  type StarterContextDomain,
} from '@/lib/context/starter-context-domains';
import type { ActiveContextStackState } from '@/lib/context/active-context-stack';
import type { Situation } from '@/types/situation';

export interface QuickContextBuilderDeps {
  domain: StarterContextDomain;
  addSituation: (situation: Situation) => void;
  setActiveSituation: (situationId: string) => void;
  saveStack: (patch: Partial<ActiveContextStackState>) => Promise<ActiveContextStackState>;
  onProgress?: (message: string) => void;
}

export interface QuickContextBuilderResult {
  situationId: string;
  capsuleId: string;
  contextPackageId: string;
  resolved: boolean;
  coreLite: LightweightContextCoreLite;
}

export async function createQuickContextFromDomain({
  domain,
  addSituation,
  setActiveSituation,
  saveStack,
  onProgress,
}: QuickContextBuilderDeps): Promise<QuickContextBuilderResult> {
  onProgress?.(`Building ${domain.label} situation...`);
  const situationPayload = await postJson<{ situation?: Situation; error?: string }>('/api/situations', {
    name: `${domain.label} Situation Core`,
    type: domain.type,
    description: domain.description,
    region: domain.defaultRegion,
    actors: domain.starterActors,
    userRole: domain.userRole,
    status: 'active',
    domain: domain.domainId,
    domainOverriddenByUser: true,
    ...(domain.pathId ? { pathId: domain.pathId, pathOverriddenByUser: true } : {}),
    contextNotes: starterContextNotes(domain),
    workflowPath: domain.id,
    workflowPathLabel: `${domain.label} context builder`,
    tags: [domain.label, ...domain.graphLenses],
    sourceCategoryOrder: domain.sourceTypes,
  });
  if (!situationPayload.situation) {
    throw new Error(situationPayload.error ?? 'context creation failed');
  }

  const situation = situationPayload.situation;
  addSituation(situation);
  setActiveSituation(situation.id);

  const outputCoreIds = domain.outputFormats
    .slice(0, 2)
    .map((format) => `output:${slugifyContextValue(format)}`);
  const objectiveCoreIds = [`objective:${domain.id}`];
  const graphCoreId = `${situation.id}:graph-lite`;
  const retrievalPolicy = {
    layers: ['sources', 'documents', 'graph', 'tool-output'],
    limit: 12,
    checkFreshness: true,
    freshnessWindowDays: 180,
  };

  onProgress?.('Creating capsule...');
  const capsulePayload = await postJson<{
    capsule?: { capsuleId: string; label?: string; version: number; health?: { score?: number; missingCores?: string[]; warnings?: string[] } };
    error?: string;
  }>('/api/context/capsules', {
    action: 'create',
    label: `${domain.label} Capsule`,
    scope: 'situation',
    coreRefs: {
      situationCoreId: situation.id,
      sourceCoreIds: [],
      documentCoreIds: [],
      graphCoreId,
      outputCoreIds,
      objectiveCoreIds,
    },
    retrievalPolicy,
    activeForSituationIds: [situation.id],
  });
  if (!capsulePayload.capsule) {
    throw new Error(capsulePayload.error ?? 'capsule creation failed');
  }

  onProgress?.('Creating Context Package...');
  const packagePayload = await postJson<{
    package?: { id: string; health?: { score?: number; missingCores?: string[]; warnings?: string[] } };
    error?: string;
  }>('/api/context/packages', {
    label: `${domain.label} Context Package`,
    ownerScope: 'situation',
    coreRefs: {
      situationCoreId: situation.id,
      sourceCoreIds: [],
      documentCoreIds: [],
      graphCoreId,
      outputCoreIds,
    },
    retrievalPolicy,
    active: true,
  });
  if (!packagePayload.package) {
    throw new Error(packagePayload.error ?? 'context package creation failed');
  }

  const capsule = capsulePayload.capsule;
  const contextPackage = packagePayload.package;
  const outputGoal = domain.outputFormats[0] ?? 'memo';

  onProgress?.('Attaching context to Ask PRAXIS...');
  await saveStack({
    stackId: capsule.capsuleId,
    capsuleId: capsule.capsuleId,
    capsuleRefs: [{
      capsuleId: capsule.capsuleId,
      label: capsule.label ?? `${domain.label} Capsule`,
      role: 'primary',
      primary: true,
      order: 0,
      version: capsule.version,
    }],
    contextPackageId: contextPackage.id,
    situationId: situation.id,
    sourceIds: [],
    documentIds: [],
    outputGoal,
    contextBlocks: {
      userCore: [{
        id: `user:${domain.userRole}`,
        capsuleId: capsule.capsuleId,
        label: `${domain.label} ${domain.userRole.replace(/_/g, ' ')} posture`,
        role: 'user',
        primary: true,
        order: 0,
      }],
      situation: [{
        id: situation.id,
        capsuleId: capsule.capsuleId,
        label: situation.name,
        role: 'situation',
        primary: true,
        order: 0,
      }],
      sources: [],
      thinkingDevices: [
        'context-resolve',
        'sourceability-reviewer',
        ...domain.graphLenses.slice(0, 2).map((lens) => `lens:${slugifyContextValue(lens)}`),
      ].map((id, order) => ({
        id,
        capsuleId: capsule.capsuleId,
        label: labelizeContextValue(id),
        role: 'tool',
        primary: order === 0,
        order,
      })),
      output: domain.outputFormats.slice(0, 2).map((format, order) => ({
        id: format,
        capsuleId: capsule.capsuleId,
        label: format,
        role: 'output',
        primary: order === 0,
        order,
      })),
    },
  });

  onProgress?.('Resolving context...');
  const resolveResponse = await fetch('/api/context/resolve', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      situationId: situation.id,
      capsuleId: capsule.capsuleId,
      contextPackageId: contextPackage.id,
      query: `Prepare ${outputGoal} from ${domain.label} context.`,
    }),
  });
  const resolved = resolveResponse.ok;

  const missingCores = Array.from(new Set([
    ...(capsule.health?.missingCores ?? []),
    ...(contextPackage.health?.missingCores ?? []),
  ])).slice(0, 4);
  const warnings = [
    ...(capsule.health?.warnings ?? []),
    ...(contextPackage.health?.warnings ?? []),
  ];

  return {
    situationId: situation.id,
    capsuleId: capsule.capsuleId,
    contextPackageId: contextPackage.id,
    resolved,
    coreLite: createLightweightContextCoreLite({
      id: contextPackage.id,
      title: `${domain.label} Context Core Lite`,
      domain: domain.domainId,
      situationCoreId: situation.id,
      userCoreId: `user:${domain.userRole}`,
      capsuleId: capsule.capsuleId,
      capsuleVersion: capsule.version,
      contextPackageId: contextPackage.id,
      sourceRefs: [],
      documentRefs: [],
      healthScore: contextPackage.health?.score ?? capsule.health?.score ?? 0,
      missingCores,
      assumptions: [
        `${domain.label} domain defaults are starter assumptions until sources are attached.`,
        `Time horizon: ${domain.timeHorizon}.`,
        `Initial actor set: ${domain.starterActors.slice(0, 3).join(', ')}.`,
      ],
      gaps: warnings.length > 0 ? warnings.slice(0, 3) : ['Attach source receipts.', 'Upload documents.', 'Review graph candidates.'],
      status: missingCores.length === 0 ? 'review_ready' : 'draft',
      askResolvable: resolved,
    }),
  };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `${url} failed with ${response.status}`);
  }
  return payload;
}

function slugifyContextValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'context';
}

function labelizeContextValue(value: string): string {
  return value
    .replace(/^lens:/, '')
    .replace(/[-_:]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
