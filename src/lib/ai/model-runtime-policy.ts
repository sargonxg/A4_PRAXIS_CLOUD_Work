import {
  getAskPraxisRuntimePolicyMatrix,
  getModelMatrixEntry,
  type AskRuntimeDepth,
  type TaskKind,
} from '@/lib/ai/model-matrix';

export type RuntimePolicyName = 'askPraxis';
export type ModelLifecycleTier = 'frontier_primary' | 'stable_fallback';

export interface ModelRuntimePolicy {
  name: RuntimePolicyName;
  provider: 'vertex';
  frontierPrimary: {
    chatTaskKind: TaskKind;
    deepTaskKind: TaskKind;
    chatModelId: string;
    deepModelId: string;
  };
  stableFallback: Record<AskRuntimeDepth, string[]>;
  stableModelLabels: Record<string, string>;
  vertexLocationPolicy: {
    frontierGemini3Location: string;
    stableFallbackLocation: string;
  };
}

export interface ModelFallbackCandidate {
  modelId: string;
  lifecycleTier: ModelLifecycleTier;
  reason: 'selected' | 'frontier_primary' | 'stable_fallback';
}

export interface ModelRuntimeHealthCheck {
  ok: boolean;
  provider: 'vertex';
  configuredVertexProject: boolean;
  configuredVertexLocation: string;
  frontierPrimaryModels: string[];
  stableFallbackModels: string[];
  missingMatrixModels: string[];
  warnings: string[];
}

export function getAskPraxisModelRuntimePolicy(): ModelRuntimePolicy {
  const policy = getAskPraxisRuntimePolicyMatrix();
  const chatTaskKind = policy.frontierPrimary.chat;
  const deepTaskKind = policy.frontierPrimary.deep;
  return {
    name: 'askPraxis',
    provider: 'vertex',
    frontierPrimary: {
      chatTaskKind,
      deepTaskKind,
      chatModelId: getModelMatrixEntry(chatTaskKind).model,
      deepModelId: getModelMatrixEntry(deepTaskKind).model,
    },
    stableFallback: policy.stableFallback,
    stableModelLabels: policy.stableModelLabels,
    vertexLocationPolicy: policy.vertexLocationPolicy,
  };
}

export function getAskPraxisRuntimeModelIds(): string[] {
  const policy = getAskPraxisModelRuntimePolicy();
  return unique([
    policy.frontierPrimary.chatModelId,
    policy.frontierPrimary.deepModelId,
    ...policy.stableFallback.deep,
    ...policy.stableFallback.chat,
    ...policy.stableFallback.cheap,
  ]);
}

export function isAskPraxisRuntimeModelId(value: unknown): value is string {
  return typeof value === 'string' && getAskPraxisRuntimeModelIds().includes(value);
}

export function getAskPraxisModelLabel(modelId: string): string {
  const policy = getAskPraxisModelRuntimePolicy();
  if (modelId === policy.frontierPrimary.chatModelId) return 'Gemini 3.5 Flash';
  if (modelId === policy.frontierPrimary.deepModelId) return 'Gemini 3.1 Pro Preview';
  return policy.stableModelLabels[modelId] ?? modelId;
}

export function buildModelFallbackCandidates(input: {
  selectedModelId: string | null | undefined;
  depth: AskRuntimeDepth;
}): ModelFallbackCandidate[] {
  const policy = getAskPraxisModelRuntimePolicy();
  const defaultModelId = input.depth === 'deep'
    ? policy.frontierPrimary.deepModelId
    : policy.frontierPrimary.chatModelId;
  const selected = input.selectedModelId && isAskPraxisRuntimeModelId(input.selectedModelId)
    ? input.selectedModelId
    : defaultModelId;
  const selectedTier: ModelLifecycleTier = selected === policy.frontierPrimary.chatModelId || selected === policy.frontierPrimary.deepModelId
    ? 'frontier_primary'
    : 'stable_fallback';
  const fallbacks = input.depth === 'deep'
    ? policy.stableFallback.deep
    : input.depth === 'cheap'
      ? policy.stableFallback.cheap
      : policy.stableFallback.chat;

  return unique([selected, ...fallbacks]).map((modelId, index) => ({
    modelId,
    lifecycleTier: modelId === policy.frontierPrimary.chatModelId || modelId === policy.frontierPrimary.deepModelId
      ? 'frontier_primary'
      : 'stable_fallback',
    reason: index === 0
      ? 'selected'
      : selectedTier === 'frontier_primary'
        ? 'stable_fallback'
        : 'stable_fallback',
  }));
}

export function buildModelRuntimeHealthCheck(env: NodeJS.ProcessEnv = process.env): ModelRuntimeHealthCheck {
  const policy = getAskPraxisModelRuntimePolicy();
  const stableModels = unique([
    ...policy.stableFallback.chat,
    ...policy.stableFallback.deep,
    ...policy.stableFallback.cheap,
  ]);
  const missingMatrixModels = stableModels.filter((modelId) => !policy.stableModelLabels[modelId]);
  const configuredVertexLocation = env.GOOGLE_VERTEX_GEMINI_LOCATION
    || env.GOOGLE_VERTEX_LOCATION
    || policy.vertexLocationPolicy.frontierGemini3Location;
  const warnings: string[] = [];
  if (!env.GOOGLE_VERTEX_PROJECT) warnings.push('GOOGLE_VERTEX_PROJECT is not configured.');
  if (configuredVertexLocation !== policy.vertexLocationPolicy.frontierGemini3Location) {
    warnings.push(`Gemini 3 frontier policy expects ${policy.vertexLocationPolicy.frontierGemini3Location}; configured ${configuredVertexLocation}.`);
  }
  if (missingMatrixModels.length) warnings.push(`Stable fallback label coverage missing: ${missingMatrixModels.join(', ')}`);

  return {
    ok: warnings.length === 0,
    provider: 'vertex',
    configuredVertexProject: Boolean(env.GOOGLE_VERTEX_PROJECT),
    configuredVertexLocation,
    frontierPrimaryModels: [
      policy.frontierPrimary.chatModelId,
      policy.frontierPrimary.deepModelId,
    ],
    stableFallbackModels: stableModels,
    missingMatrixModels,
    warnings,
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
