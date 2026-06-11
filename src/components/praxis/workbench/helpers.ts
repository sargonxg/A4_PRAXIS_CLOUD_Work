import {
  DEFAULT_CONTEXT_STACK_ID,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';

export type CapsuleRole = 'user' | 'situation' | 'tool' | 'output' | 'reference';
export type ContextChainBlockId = 'userCore' | 'situation' | 'sources' | 'thinkingDevices' | 'output';

export type ActiveCapsuleChip = {
  id: string;
  label: string;
  code: string;
  role: CapsuleRole;
  toolId?: string;
  templateId?: string;
};

export type ActiveContextBlockCapsulePayload = ActiveCapsuleChip & {
  capsuleId: string;
  primary: boolean;
  order: number;
};

export type ActiveContextBlocksPayload = Record<ContextChainBlockId, ActiveContextBlockCapsulePayload[]>;

export type ActiveContextStackPayload = ActiveContextStackState & {
  stackId: typeof DEFAULT_CONTEXT_STACK_ID;
  capsuleId: string;
  contextBlocks: ActiveContextBlocksPayload;
  evidenceGaps: [];
  canvasLayout: Record<string, never>;
};

export type ActiveContextStackPatch = Pick<
  ActiveContextStackState,
  | 'stackId'
  | 'capsuleId'
  | 'capsuleRefs'
  | 'userModelId'
  | 'situationId'
  | 'sourceIds'
  | 'documentIds'
  | 'outputGoal'
  | 'contextBlocks'
>;

export type SelectedContextCoreIds = {
  userCoreId: string | null;
  situationCoreId: string | null;
  sourceCoreIds: string[];
  documentCoreIds: string[];
  toolCoreIds: string[];
  outputCoreIds: string[];
};

export type ContextHealth = {
  label: 'Baseline' | 'Ready' | 'Grounded' | 'Operational';
  plainState: 'ready' | 'thin' | 'missing sources' | 'stale sources' | 'needs review';
  detail: string;
  tone: string;
};

export type ContextChainBlockLaneModel = {
  id: ContextChainBlockId;
  label: string;
  helper: string;
  action: string;
  addRole: CapsuleRole;
  capsules: ActiveCapsuleChip[];
};

export const MAX_ACTIVE_CONTEXT_CAPSULES = 12;

export function capsuleRoleFromStackRole(
  role: ActiveContextStackState['capsuleRefs'][number]['role'],
  fallbackRole: CapsuleRole,
): CapsuleRole {
  if (role === 'user' || role === 'situation' || role === 'tool' || role === 'output') return role;
  if (role === 'reference' || role === 'comparison') return 'reference';
  return fallbackRole;
}

export function ensureDefaultCapsuleStack(
  activeStack: ActiveCapsuleChip[],
  input: { userCapsules: unknown[]; selectedCapsule: unknown | null },
): ActiveCapsuleChip[] {
  void input;
  return uniqueCapsuleStack(activeStack).slice(0, MAX_ACTIVE_CONTEXT_CAPSULES);
}

export function buildActiveContextBlocks(activeCapsuleStack: ActiveCapsuleChip[]): ActiveContextBlocksPayload {
  return {
    userCore: blockPayloadForRole(activeCapsuleStack, 'user'),
    situation: blockPayloadForRole(activeCapsuleStack, 'situation'),
    sources: blockPayloadForRole(activeCapsuleStack, 'reference'),
    thinkingDevices: blockPayloadForRole(activeCapsuleStack, 'tool'),
    output: blockPayloadForRole(activeCapsuleStack, 'output'),
  };
}

export function buildActiveContextStackPatch(
  capsuleId: string | null,
  activeCapsuleStack: ActiveCapsuleChip[],
  baseStack: ActiveContextStackState,
): ActiveContextStackPatch {
  const contextBlocks = buildActiveContextBlocks(activeCapsuleStack);
  const userCapsule = contextBlocks.userCore[0];
  const situationCapsule = contextBlocks.situation[0];
  const outputCapsule = contextBlocks.output[0];
  const resolvedCapsuleId = capsuleId
    ?? situationCapsule?.id
    ?? activeCapsuleStack[0]?.id
    ?? null;
  return {
    stackId: baseStack.stackId || DEFAULT_CONTEXT_STACK_ID,
    capsuleId: resolvedCapsuleId,
    capsuleRefs: activeCapsuleStack.map((capsule, order) => ({
      capsuleId: capsule.id,
      label: capsule.label,
      role: capsule.role,
      primary: order === 0,
      order,
      version: null,
    })),
    userModelId: userCapsule?.id ?? null,
    situationId: situationCapsule?.id ?? null,
    sourceIds: contextBlocks.sources.map((capsule) => capsule.id),
    documentIds: baseStack.documentIds,
    outputGoal: outputCapsule?.label ?? null,
    contextBlocks,
  };
}

export function buildActiveContextStack(
  currentCapsuleId: string,
  activeCapsuleStack: ActiveCapsuleChip[],
  baseStack: ActiveContextStackState,
): ActiveContextStackPayload {
  const patch = buildActiveContextStackPatch(currentCapsuleId, activeCapsuleStack, baseStack);
  const contextBlocks = buildActiveContextBlocks(activeCapsuleStack);
  return {
    ...baseStack,
    ...patch,
    stackId: DEFAULT_CONTEXT_STACK_ID,
    capsuleId: patch.capsuleId ?? currentCapsuleId,
    contextBlocks,
    evidenceGaps: [],
    canvasLayout: {},
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
  };
}

export function selectedCoreIdsFromContextStack(activeContextStack: ActiveContextStackPayload): SelectedContextCoreIds {
  return {
    userCoreId: activeContextStack.userModelId,
    situationCoreId: activeContextStack.situationId,
    sourceCoreIds: activeContextStack.sourceIds,
    documentCoreIds: activeContextStack.documentIds,
    toolCoreIds: activeContextStack.contextBlocks.thinkingDevices.map((capsule) => capsule.id),
    outputCoreIds: activeContextStack.contextBlocks.output.length
      ? activeContextStack.contextBlocks.output.map((capsule) => capsule.id)
      : activeContextStack.outputGoal ? [activeContextStack.outputGoal] : [],
  };
}

export function buildContextChainBlockLanes(input: {
  contextBlocks: ActiveContextBlocksPayload;
}): ContextChainBlockLaneModel[] {
  return [
    {
      id: 'userCore',
      label: 'User Core',
      helper: 'The analyst posture and model-use baseline.',
      action: 'Swap user',
      addRole: 'user',
      capsules: input.contextBlocks.userCore,
    },
    {
      id: 'situation',
      label: 'Situation',
      helper: 'Add the case, issue, or operating context.',
      action: 'Add context',
      addRole: 'situation',
      capsules: input.contextBlocks.situation,
    },
    {
      id: 'sources',
      label: 'Sources',
      helper: 'Attach source packs, documents, or related capsules.',
      action: 'Attach sources',
      addRole: 'reference',
      capsules: input.contextBlocks.sources,
    },
    {
      id: 'thinkingDevices',
      label: 'Thinking Devices',
      helper: 'Add reasoning tools and checks.',
      action: 'Add checks',
      addRole: 'tool',
      capsules: input.contextBlocks.thinkingDevices,
    },
    {
      id: 'output',
      label: 'Output',
      helper: 'Choose the memo, brief, handover, or artifact goal.',
      action: 'Choose output',
      addRole: 'output',
      capsules: input.contextBlocks.output,
    },
  ];
}

export function contextBlockIdForRole(role: CapsuleRole): ContextChainBlockId {
  if (role === 'user') return 'userCore';
  if (role === 'reference') return 'sources';
  if (role === 'tool') return 'thinkingDevices';
  return role;
}

export function contextRoleForDroppableId(id: string): CapsuleRole | null {
  if (!id.startsWith('context-block:')) return null;
  const blockId = id.replace('context-block:', '') as ContextChainBlockId;
  if (blockId === 'userCore') return 'user';
  if (blockId === 'sources') return 'reference';
  if (blockId === 'thinkingDevices') return 'tool';
  if (blockId === 'situation' || blockId === 'output') return blockId;
  return null;
}

export function getContextHealth(activeCapsuleStack: ActiveCapsuleChip[]): ContextHealth {
  const roles = new Set(activeCapsuleStack.map((capsule) => capsule.role));
  const hasSituation = roles.has('situation');
  const hasSources = roles.has('reference');
  const hasTools = roles.has('tool');
  const hasOutput = roles.has('output');
  const contextHealthPlainStates = ['ready', 'thin', 'missing sources', 'stale sources', 'needs review'] as const;
  if (hasSituation && hasSources && hasTools && hasOutput) {
    return {
      label: 'Operational',
      plainState: contextHealthPlainStates[0],
      detail: 'Situation, references, checks, and output are set for agentic work.',
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    };
  }
  if (hasSituation && hasSources && hasOutput) {
    return {
      label: 'Grounded',
      plainState: contextHealthPlainStates[0],
      detail: 'Situation, references, and output are set for sourced Ask PRAXIS work.',
      tone: 'border-sky-200 bg-sky-50 text-sky-800',
    };
  }
  if (hasSituation && hasOutput) {
    return {
      label: 'Ready',
      plainState: contextHealthPlainStates[2],
      detail: 'Situation and output are set. Add sources or checks for more specific work.',
      tone: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }
  return {
    label: 'Baseline',
    plainState: activeCapsuleStack.length ? contextHealthPlainStates[4] : contextHealthPlainStates[1],
    detail: 'Only model knowledge and the user profile are active.',
    tone: 'border-slate-200 bg-slate-50 text-slate-700',
  };
}

export function applyCapsuleToStack(current: ActiveCapsuleChip[], chip: ActiveCapsuleChip): ActiveCapsuleChip[] {
  const withoutCurrentCapsule = current.filter((item) => item.id !== chip.id);
  const firstRoleIndex = withoutCurrentCapsule.findIndex((item) => item.role === chip.role);
  const next = [...withoutCurrentCapsule];
  if (firstRoleIndex >= 0) {
    next.splice(firstRoleIndex, 0, chip);
  } else {
    next.push(chip);
  }
  return uniqueCapsuleStack(next).slice(0, MAX_ACTIVE_CONTEXT_CAPSULES);
}

export function uniqueCapsuleStack(stack: ActiveCapsuleChip[]): ActiveCapsuleChip[] {
  return stack.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
}

function blockPayloadForRole(activeCapsuleStack: ActiveCapsuleChip[], role: CapsuleRole): ActiveContextBlockCapsulePayload[] {
  return activeCapsuleStack
    .filter((capsule) => capsule.role === role)
    .map((capsule, order) => ({
      ...capsule,
      id: capsule.id,
      capsuleId: capsule.id,
      label: capsule.label,
      role: capsule.role,
      primary: order === 0,
      order,
    }));
}
