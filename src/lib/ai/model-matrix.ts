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
export const V7_USER_CORE_MODEL_DEFAULTS = {
  quick: 'gemini-3-flash',
  deep: 'gemini-3.1-pro-preview',
  memo: 'gemini-3.1-pro-preview',
} as const;
export const V7_USER_CORE_MODEL_OPTIONS = [
  V7_USER_CORE_MODEL_DEFAULTS.quick,
  V7_USER_CORE_MODEL_DEFAULTS.deep,
] as const;

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
