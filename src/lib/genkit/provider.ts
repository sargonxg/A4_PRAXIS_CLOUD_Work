import { modelMatrix } from '@/lib/ai/model-matrix-data';

export type GenkitGoogleProviderKind = 'vertex' | 'google-ai';

export interface GenkitGoogleProviderConfig {
  kind: GenkitGoogleProviderKind;
  apiKey?: string;
  projectId?: string;
  location: string;
  reason: string;
}

type GenkitProviderEnv = Record<string, string | undefined>;

export function resolveGenkitGoogleProvider(env: GenkitProviderEnv = process.env): GenkitGoogleProviderConfig {
  const providerOverride = normalizeProviderOverride(env.GENKIT_GOOGLE_PROVIDER ?? env.AI_PROVIDER);
  const apiKey = env.GOOGLE_GENAI_API_KEY ?? env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY ?? env.GOOGLE_AI_API_KEY;
  const projectId = env.GOOGLE_VERTEX_PROJECT ?? env.GOOGLE_CLOUD_PROJECT ?? env.GCLOUD_PROJECT;
  const location = env.GOOGLE_VERTEX_LOCATION ?? env.GCLOUD_LOCATION ?? modelMatrix.platform.defaultRegion;

  if (providerOverride === 'vertex') {
    return {
      kind: 'vertex',
      projectId,
      location,
      reason: projectId
        ? 'forced by GENKIT_GOOGLE_PROVIDER/AI_PROVIDER=vertex'
        : 'forced to Vertex; expecting ADC/project from the Google runtime',
    };
  }

  if (providerOverride === 'google-ai') {
    return {
      kind: 'google-ai',
      apiKey,
      location,
      reason: 'forced by GENKIT_GOOGLE_PROVIDER/AI_PROVIDER=google-ai',
    };
  }

  if (projectId && !apiKey) {
    return {
      kind: 'vertex',
      projectId,
      location,
      reason: 'using Vertex because a Google Cloud project is configured and no API-key fallback is present',
    };
  }

  return {
    kind: 'google-ai',
    apiKey,
    projectId,
    location,
    reason: apiKey
      ? 'using Google AI Studio key fallback'
      : 'defaulting to Google AI Studio path; set GOOGLE_GENAI_API_KEY or GOOGLE_VERTEX_PROJECT',
  };
}

function normalizeProviderOverride(value: string | undefined): GenkitGoogleProviderKind | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (['vertex', 'vertex-ai', 'google-vertex'].includes(normalized)) return 'vertex';
  if (['google', 'google-ai', 'googleai', 'ai-studio', 'gemini-api'].includes(normalized)) return 'google-ai';
  return null;
}
