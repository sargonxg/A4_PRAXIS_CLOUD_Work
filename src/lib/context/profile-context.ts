import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { getSituationById } from '@/lib/firebase/situations';
import { retrieveForProfile } from '@/lib/knowledge/profile-weighted-retrieval';
import {
  renderSystemPromptBlock,
  renderOutputConstraints,
  type OutputConstraints,
  type RetrievedChunk,
} from './system-prompt-block';
import type { AnalystProfile } from '@/types/analyst-profile';
import type { Situation } from '@/types/situation';

export interface ContextBlock {
  systemPromptBlock: string;
  outputConstraints: OutputConstraints;
  toolContext: {
    profile: AnalystProfile | null;
    situation: Situation | null;
    retrievedChunks: RetrievedChunk[];
  };
  provenance: {
    profileVersion: number;
    situationVersion: number | null;
    generatedAt: string;
  };
}

const NEUTRAL_CONSTRAINTS: OutputConstraints = {
  language: 'en',
  audienceTone: 'myself',
  redLineClauses: [],
  styleHint: 'rapid_brief',
};

/**
 * Assembles a calibrated context block for a given user/situation/tool combination.
 *
 * NEVER throws. Every IO operation is individually wrapped in try/catch.
 * Missing profile / missing situation / failing retrieval → neutral fallback block.
 *
 * @param opts.uid           Firebase user ID (required)
 * @param opts.situationId   Active situation ID (optional)
 * @param opts.toolId        Tool being invoked (for future telemetry)
 * @param opts.retrievalQuery  If provided, calls retrieveForProfile to populate retrieved chunks
 * @param opts.retrievalTopK   Max chunks to retrieve (default: 5)
 */
export async function buildCalibratedContext(opts: {
  uid: string;
  situationId?: string;
  toolId: string;
  retrievalQuery?: string;
  retrievalTopK?: number;
}): Promise<ContextBlock> {
  let profile: AnalystProfile | null = null;
  let situation: Situation | null = null;
  let retrievedChunks: RetrievedChunk[] = [];

  // Each read wrapped individually — no single failure should abort the build
  try {
    profile = await getAnalystProfile(opts.uid);
  } catch (err) {
    console.warn('[profile-context] getAnalystProfile failed:', err);
  }

  if (opts.situationId) {
    try {
      situation = await getSituationById(opts.uid, opts.situationId);
    } catch (err) {
      console.warn('[profile-context] getSituationById failed:', err);
    }
  }

  if (opts.retrievalQuery) {
    try {
      retrievedChunks = await retrieveForProfile({
        uid: opts.uid,
        situationId: opts.situationId,
        query: opts.retrievalQuery,
        topK: opts.retrievalTopK ?? 5,
      });
    } catch (err) {
      console.warn('[profile-context] retrieveForProfile failed:', err);
    }
  }

  const systemPromptBlock = renderSystemPromptBlock({ profile, situation, retrievedChunks });
  const outputConstraints = profile ? renderOutputConstraints(profile) : NEUTRAL_CONSTRAINTS;

  return {
    systemPromptBlock,
    outputConstraints,
    toolContext: { profile, situation, retrievedChunks },
    provenance: {
      profileVersion: profile?.meta?.version ?? 0,
      situationVersion: null, // situations don't have explicit versions yet; hook reserved
      generatedAt: new Date().toISOString(),
    },
  };
}
