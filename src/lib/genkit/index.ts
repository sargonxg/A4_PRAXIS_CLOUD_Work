import { googleAI } from '@genkit-ai/google-genai';
import { enableGoogleCloudTelemetry } from '@genkit-ai/google-cloud';
import { genkit } from 'genkit';
import { loadEnvConfig } from '@next/env';
import modelMatrix from '@/lib/ai/MODEL_MATRIX.json';
import { GenkitSituationIntelligenceSchema } from '@/lib/genkit/schemas/situation-intelligence';

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

export const ai = genkit({
  name: 'praxis-js',
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_AI_API_KEY,
    }),
  ],
  promptDir: 'prompts',
  model: googleAI.model(modelIdForTask('balanced')),
});

export const gemini25Flash = googleAI.model(modelIdForTask('balanced'));
export const gemini25Pro = googleAI.model(modelIdForTask('complex_reasoning'));

ai.defineSchema('SituationIntelligenceSchema', GenkitSituationIntelligenceSchema);
