import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || '',
});

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export type AITask = 'research' | 'write' | 'extract' | 'search' | 'analyze';

/**
 * Select the optimal AI provider and model for a given task.
 *
 * - research: Gemini 2.5 Pro for deep research and reasoning
 * - write: Claude Sonnet 4.5 for nuanced diplomatic writing
 * - extract: Gemini 2.5 Flash for fast structured extraction
 * - search: null (handled by external search APIs)
 * - analyze: Claude Sonnet 4.5 for analytical assessment
 */
export function selectProvider(task: AITask) {
  switch (task) {
    case 'research':
      return google('gemini-2.5-pro-preview');
    case 'write':
      return anthropic('claude-sonnet-4-5-20250929');
    case 'extract':
      return google('gemini-2.5-flash-preview');
    case 'search':
      return null;
    case 'analyze':
      return anthropic('claude-sonnet-4-5-20250929');
  }
}
