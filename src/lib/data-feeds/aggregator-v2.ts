import { resolveFeedCapabilities, type FeedCapabilityMatrix } from './capabilities';
import {
  getSituationIntelligence,
  type SituationIntelligence,
  type SourceHealth,
} from './feed-aggregator';

export interface UserAwareIntelligence extends SituationIntelligence {
  capabilities: FeedCapabilityMatrix;
  sourceHealth: SourceHealth[];
  coverageGaps: Array<{ provider: string; reason: string; unlockUrl: string | null }>;
}

export interface UserAwareOptions {
  uid: string | null;
  country: string;
  query?: string;
  dateStart?: string;
  limit?: number;
}

export async function getUserAwareIntelligence(opts: UserAwareOptions): Promise<UserAwareIntelligence> {
  const [capabilities, intelligence] = await Promise.all([
    resolveFeedCapabilities(opts.uid),
    getSituationIntelligence(opts),
  ]);
  return {
    ...intelligence,
    capabilities,
    sourceHealth: [{
      name: 'Google Search grounding',
      available: true,
      latencyMs: 0,
      recordCount: intelligence.events.length,
      lastSuccess: intelligence.fetchedAt,
    }],
    coverageGaps: [],
  };
}
