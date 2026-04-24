/**
 * Per-advisor model resolver.
 *
 * Each AdvisorConfig declares a `modelTier` (gemini-3-flash | gemini-3-pro |
 * gemini-3-pro-deepthink | claude-sonnet-4). This module translates the tier
 * into a ready-to-call LanguageModel, honouring the Vertex-ADC-first auth
 * priority of the rest of the platform.
 *
 * When a premium provider is unreachable (e.g. Claude without ANTHROPIC_API_KEY),
 * we fall back gracefully: claude-sonnet-4 → gemini-3-pro (analysis-equivalent).
 */

import type { LanguageModel } from 'ai';
import { getAnalysisModel, getDeepThinkModel, getModel, getProModel } from './providers';
import type { AdvisorModelTier } from '@/types/advisor';

export function resolveAdvisorModel(tier: AdvisorModelTier): LanguageModel {
  switch (tier) {
    case 'gemini-3-flash':
      return getModel();
    case 'gemini-3-pro':
      return getProModel();
    case 'gemini-3-pro-deepthink':
      // Deep Think is the Pro model with high thinking level — callers set
      // `providerOptions: { google: { thinkingLevel: 'high' } }` on the request.
      return getDeepThinkModel('high');
    case 'claude-sonnet-4':
      return getAnalysisModel();
    default:
      return getProModel();
  }
}
