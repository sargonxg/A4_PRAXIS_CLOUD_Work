import matrix from './MODEL_MATRIX.json';

export type TaskKind = keyof typeof matrix.taskKinds;
export type AIProviderRuntime = 'vertex' | 'google';
export type CostClass = 'cheap' | 'medium' | 'expensive' | 'expensive_long';

export interface ModelMatrixEntry {
  provider: 'vertex';
  model: string;
  maxTokens?: number;
  temperature?: number;
  dimensions?: number;
  costClass: CostClass;
}

export interface PlatformPosture {
  enterpriseAgentPlatform: string;
  developerModelRuntime: string;
  agentRuntime: string;
  localDeveloperFallback: string;
  defaultRegion: string;
  vectorSearchPosture: string;
}

export const MODEL_MATRIX = matrix;
export const AI_PLATFORM_POSTURE = matrix.platform as PlatformPosture;

export function getModelMatrixEntry(taskKind: TaskKind): ModelMatrixEntry {
  return matrix.taskKinds[taskKind] as ModelMatrixEntry;
}

export function getModelIdForTask(taskKind: TaskKind): string {
  return getModelMatrixEntry(taskKind).model;
}

export function getTaskKinds(): TaskKind[] {
  return Object.keys(matrix.taskKinds) as TaskKind[];
}

export function isTaskKind(value: string): value is TaskKind {
  return Object.prototype.hasOwnProperty.call(matrix.taskKinds, value);
}

export type AskRuntimeDepth = 'chat' | 'deep' | 'cheap';

export interface AskPraxisRuntimePolicyMatrix {
  frontierPrimary: Record<'chat' | 'deep', TaskKind>;
  stableFallback: Record<AskRuntimeDepth, string[]>;
  stableModelLabels: Record<string, string>;
  vertexLocationPolicy: {
    frontierGemini3Location: string;
    stableFallbackLocation: string;
  };
}

export function getAskPraxisRuntimePolicyMatrix(): AskPraxisRuntimePolicyMatrix {
  return matrix.runtimePolicies.askPraxis as AskPraxisRuntimePolicyMatrix;
}
