import { googleAI, vertexAI } from '@genkit-ai/google-genai';
import { enableGoogleCloudTelemetry } from '@genkit-ai/google-cloud';
import { genkit } from 'genkit';
import { loadEnvConfig } from '@next/env';
import { modelMatrix } from '@/lib/ai/model-matrix-data';
import { GenkitClassifyPathOutputSchema } from '@/lib/genkit/schemas/classify-path';
import { GenkitSourceabilityOutputSchema } from '@/lib/genkit/schemas/sourceability';
import { GenkitSituationIntelligenceSchema } from '@/lib/genkit/schemas/situation-intelligence';
import { resolveGenkitGoogleProvider } from '@/lib/genkit/provider';

type ModelTaskKind = keyof typeof modelMatrix.taskKinds;

loadEnvConfig(process.cwd());

const shouldExportTelemetry =
  process.env.GENKIT_CLOUD_TELEMETRY === '1' &&
  Boolean(process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_VERTEX_PROJECT);

if (shouldExportTelemetry) {
  void enableGoogleCloudTelemetry({
    projectId: process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GOOGLE_VERTEX_PROJECT,
    forceDevExport: process.env.GENKIT_FORCE_DEV_TELEMETRY === '1',
  }).catch((err) => {
    console.warn('[genkit] Google Cloud telemetry setup failed:', err);
  });
}

export function modelIdForTask(kind: ModelTaskKind): string {
  return modelMatrix.taskKinds[kind].model;
}

export const genkitGoogleProvider = resolveGenkitGoogleProvider();
const genkitGooglePlugin =
  genkitGoogleProvider.kind === 'vertex'
    ? vertexAI({ location: genkitGoogleProvider.location })
    : googleAI({ apiKey: genkitGoogleProvider.apiKey });
const genkitModelProvider = genkitGoogleProvider.kind === 'vertex' ? vertexAI : googleAI;

export const ai = genkit({
  name: 'praxis-js',
  plugins: [genkitGooglePlugin],
  promptDir: 'prompts',
  model: genkitModelProvider.model(modelIdForTask('balanced')),
});

export const gemini25Flash = genkitModelProvider.model(modelIdForTask('balanced'));
export const gemini25Pro = genkitModelProvider.model(modelIdForTask('complex_reasoning'));

ai.defineSchema('SituationIntelligenceSchema', GenkitSituationIntelligenceSchema);
ai.defineSchema('ClassifyPathOutputSchema', GenkitClassifyPathOutputSchema);
ai.defineSchema('SourceabilityOutputSchema', GenkitSourceabilityOutputSchema);
