/**
 * Per-advisor model resolver.
 *
 * Each AdvisorConfig declares a Gemini model tier. This module translates the tier
 * into a ready-to-call LanguageModel, honouring the Vertex-ADC-first auth
 * priority of the rest of the platform.
 *
 * Gemini is the only provider; analysis tiers resolve through providers.ts.
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
    case 'gemini-analysis':
      return getAnalysisModel();
    default:
      return getProModel();
  }
}
