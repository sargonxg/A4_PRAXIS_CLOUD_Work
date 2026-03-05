import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || '',
});

export const MODELS = {
  fast: 'gemini-2.5-flash',      // Extraction, terminology, quick tasks
  reasoning: 'gemini-2.5-pro',   // Complex analysis (use sparingly)
} as const;

export type ModelTask = keyof typeof MODELS;

export function getModel(task: ModelTask = 'fast') {
  return gemini(MODELS[task]);
}
