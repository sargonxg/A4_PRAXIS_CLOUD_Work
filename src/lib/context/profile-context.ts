import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { getSituationById } from '@/lib/firebase/situations';
import { listEpisodes } from '@/lib/firebase/episodes';
import { retrieveForProfile } from '@/lib/knowledge/profile-weighted-retrieval';
import { getPreferences } from '@/lib/firebase/preferences-service';
import { readRecentTurns } from '@/lib/firebase/advisor-history-service';
import { deriveInteractionFrame } from './interaction-frame';
import { ADVISOR_IDS, type AdvisorId } from '@/types/advisor';
import {
  renderSystemPromptBlock,
  renderOutputConstraints,
  type OutputConstraints,
  type RetrievedChunk,
} from './system-prompt-block';
import {
  resolveUserDomain,
  resolveDomain,
  mergeUserAndSituationDomains,
} from '@/lib/domain/resolve';
import type { AnalystProfile } from '@/types/analyst-profile';
import type { Situation } from '@/types/situation';
import type { MergedDomainConfig } from '@/types/domain';
import type { Episode } from '@/types/episode';
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '@/types/preferences';
import type { InteractionFrame } from '@/types/interaction';
import type { AdvisorFrame } from '@/types/advisor';

export interface ContextBlock {
  systemPromptBlock: string;
  outputConstraints: OutputConstraints;
  toolContext: {
    profile: AnalystProfile | null;
    situation: Situation | null;
    retrievedChunks: RetrievedChunk[];
    episodes: Episode[];
  };
  /**
   * User-level preferences (citation style, default language, preferred advisor, etc.).
   * Always populated — falls back to `DEFAULT_USER_PREFERENCES` when the read fails.
   */
  preferences: UserPreferences;
  /**
   * Interaction frame — recent tool usage and active-draft counters.
   * Populated when `situationId` is provided via `deriveInteractionFrame`;
   * `null` for situation-less builds.
   */
  interaction: InteractionFrame | null;
  /**
   * Advisor frame — selected advisor persona with rolling summary. Populated by Task 6.5;
   * currently always `null`.
   */
  advisor: AdvisorFrame | null;
  /**
   * Effective merged domain: user.primary + user.secondaries + situation.domain.
   * Always populated — never null. Falls back to the `generic` seed if every
   * read failed. Tools can read `domain.frameworks`, `domain.preferredFeeds`,
   * and `domain.promptOverrides[toolId]` directly.
   */
  domain: MergedDomainConfig;
  provenance: {
    profileVersion: number;
    situationVersion: number | null;
    domainId: string;
    domainVersion: number;
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
  /**
   * If provided and valid, populates `advisor` on the returned ContextBlock
   * with a rolling summary of the most recent turns for that (uid, situation,
   * advisor) thread. Unknown advisor ids are ignored silently.
   */
  advisorId?: string;
}): Promise<ContextBlock> {
  let profile: AnalystProfile | null = null;
  let situation: Situation | null = null;
  let retrievedChunks: RetrievedChunk[] = [];
  let episodes: Episode[] = [];
  let preferences: UserPreferences = DEFAULT_USER_PREFERENCES;
  let interaction: InteractionFrame | null = null;
  let advisor: AdvisorFrame | null = null;

  // Each read wrapped individually — no single failure should abort the build
  try {
    profile = await getAnalystProfile(opts.uid);
  } catch (err) {
    console.warn('[profile-context] getAnalystProfile failed:', err);
  }

  try {
    preferences = await getPreferences(opts.uid);
  } catch (err) {
    console.warn('[profile-context] getPreferences failed:', err);
  }

  if (opts.situationId) {
    try {
      situation = await getSituationById(opts.uid, opts.situationId);
    } catch (err) {
      console.warn('[profile-context] getSituationById failed:', err);
    }
    try {
      episodes = await listEpisodes(opts.uid, opts.situationId);
    } catch (err) {
      console.warn('[profile-context] listEpisodes failed:', err);
    }
    try {
      interaction = await deriveInteractionFrame(opts.uid, opts.situationId);
    } catch (err) {
      console.warn('[profile-context] deriveInteractionFrame failed:', err);
    }
    if (opts.advisorId && (ADVISOR_IDS as readonly string[]).includes(opts.advisorId)) {
      try {
        const aid = opts.advisorId as AdvisorId;
        const turns = await readRecentTurns(opts.uid, opts.situationId, aid, 8);
        if (turns.length > 0) {
          const summaryLines = turns
            .slice(-6)
            .map((t) => `${t.role}: ${t.content.slice(0, 140)}`)
            .join(' · ');
          advisor = {
            advisorId: aid,
            rollingSummary: summaryLines,
            lastTurnAt: turns[turns.length - 1].at,
          };
        } else {
          advisor = { advisorId: aid, rollingSummary: '', lastTurnAt: new Date().toISOString() };
        }
      } catch (err) {
        console.warn('[profile-context] advisor frame failed:', err);
      }
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

  // Resolve effective domain: user primary+secondaries, then merge situation.
  let domain: MergedDomainConfig;
  try {
    const userDomain = profile
      ? await resolveUserDomain(profile)
      : await resolveDomain('generic');
    if (situation?.domain && situation.domain !== userDomain.id) {
      const situationDomain = await resolveDomain(situation.domain);
      domain = mergeUserAndSituationDomains(userDomain, situationDomain);
    } else {
      domain = userDomain;
    }
  } catch (err) {
    console.warn('[profile-context] domain resolution failed, using generic:', err);
    domain = await resolveDomain('generic');
  }

  const systemPromptBlock = renderSystemPromptBlock({
    profile,
    situation,
    retrievedChunks,
    domain,
    toolId: opts.toolId,
    episodes,
    preferences,
    interaction,
    advisor,
  });
  const outputConstraints = profile ? renderOutputConstraints(profile) : NEUTRAL_CONSTRAINTS;

  return {
    systemPromptBlock,
    outputConstraints,
    toolContext: { profile, situation, retrievedChunks, episodes },
    preferences,
    interaction,
    advisor,
    domain,
    provenance: {
      profileVersion: profile?.meta?.version ?? 0,
      situationVersion: situation ? Date.parse(situation.updatedAt ?? '') || null : null,
      domainId: domain.id,
      domainVersion: domain.version,
      generatedAt: new Date().toISOString(),
    },
  };
}
