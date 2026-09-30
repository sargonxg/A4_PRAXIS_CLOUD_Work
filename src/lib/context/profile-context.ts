import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { getSituationById } from '@/lib/firebase/situations';
import { listEpisodes } from '@/lib/firebase/episodes';
import { retrieveForProfile } from '@/lib/knowledge/profile-weighted-retrieval';
import { getPreferences } from '@/lib/firebase/preferences-service';
import { readRecentTurns } from '@/lib/firebase/advisor-history-service';
import { type PraxisCapsule } from '@/lib/context/capsule-service';
import { CapsuleVersionConflictError, resolveCapsuleReference, validateCapsuleVersionPins } from './capsule-version-resolution';
import { sanitizeActiveContextStack, type ActiveCapsuleRef } from '@/lib/context/active-context-stack';
import { deriveInteractionFrame } from './interaction-frame';
import { ADVISOR_IDS, type AdvisorId } from '@/types/advisor';
import {
  renderSystemPromptBlock,
  renderOutputConstraints,
  type CapsulePromptFrame,
  type OutputConstraints,
  type RetrievedChunk,
} from './system-prompt-block';
import {
  buildSituationContextHealthPrompt,
  computeSituationContextHealth,
  type SituationContextHealthReport,
} from './situation-context-health';
import {
  resolveUserDomain,
  resolveDomain,
  mergeUserAndSituationDomains,
} from '@/lib/domain/resolve';
import { resolvePath } from '@/lib/path/resolve';
import type { AnalystProfile } from '@/types/analyst-profile';
import type { Situation } from '@/types/situation';
import type { MergedDomainConfig } from '@/types/domain';
import type { MergedPathConfig } from '@/lib/path/types';
import type { Episode } from '@/types/episode';
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '@/types/preferences';
import type { InteractionFrame } from '@/types/interaction';
import type { AdvisorFrame } from '@/types/advisor';
import { computeContextReadiness, type ContextReadiness } from '@/lib/context/readiness';

export interface ContextBlock {
  systemPromptBlock: string;
  outputConstraints: OutputConstraints;
  toolContext: {
    profile: AnalystProfile | null;
    situation: Situation | null;
    retrievedChunks: RetrievedChunk[];
    episodes: Episode[];
    capsules?: PraxisCapsule[];
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
   * Deterministic health snapshot for the context attached to this model call.
   * Lets tools qualify confidence when source, graph, retrieval, or situation
   * context is thin.
   */
  contextHealth: SituationContextHealthReport;
  readiness: ContextReadiness;
  /**
   * Effective merged domain: user.primary + user.secondaries + situation.domain.
   * Always populated — never null. Falls back to the `generic` seed if every
   * read failed. Tools can read `domain.frameworks`, `domain.preferredFeeds`,
   * and `domain.promptOverrides[toolId]` directly.
   */
  domain: MergedDomainConfig;
  /**
   * Effective Path Core overlay: user/situation/domain choose the baseline,
   * then the path adds ordered tools, framework path, source mix, prompt voice,
   * output defaults, and credit multiplier.
   */
  path: MergedPathConfig | null;
  provenance: {
    profileVersion: number;
    situationVersion: number | null;
    domainId: string;
    domainVersion: number;
    pathId: string | null;
    pathVersion: number | null;
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
 * Optional profile/situation/retrieval reads may use neutral fallbacks. Explicit
 * capsule pins must resolve exactly or throw a recoverable context conflict.
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
  /** False disables situation/history/corpus retrieval, while retaining selected capsules. */
  allowWorkspaceRetrieval?: boolean;
  retrievalTopK?: number;
  /**
   * If provided and valid, populates `advisor` on the returned ContextBlock
   * with a rolling summary of the most recent turns for that (uid, situation,
   * advisor) thread. Unknown advisor ids are ignored silently.
   */
  advisorId?: string;
  pathId?: string;
  capsuleId?: string | null;
  activeContextStack?: unknown;
}): Promise<ContextBlock> {
  validateCapsuleVersionPins(opts.activeContextStack);
  let profile: AnalystProfile | null = null;
  let situation: Situation | null = null;
  let retrievedChunks: RetrievedChunk[] = [];
  let episodes: Episode[] = [];
  let preferences: UserPreferences = DEFAULT_USER_PREFERENCES;
  let interaction: InteractionFrame | null = null;
  let advisor: AdvisorFrame | null = null;
  let path: MergedPathConfig | null = null;
  const attachedCapsules = await loadAttachedCapsules({
    uid: opts.uid, capsuleId: opts.capsuleId, activeContextStack: opts.activeContextStack,
  });

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

  if (opts.situationId && opts.allowWorkspaceRetrieval !== false) {
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

  try {
    path = await resolvePath(opts.pathId ?? situation?.pathId ?? null, domain.id);
  } catch (err) {
    console.warn('[profile-context] path resolution failed:', err);
    path = null;
  }

  const defaultRetrievalQuery = buildDefaultRetrievalQuery({
    situation,
    profile,
    toolId: opts.toolId,
  });
  const retrievalQuery = opts.retrievalQuery ?? defaultRetrievalQuery;

  if (retrievalQuery && opts.allowWorkspaceRetrieval !== false) {
    try {
      const hits = await retrieveForProfile({
        uid: opts.uid,
        situationId: opts.situationId,
        query: retrievalQuery,
        topK: opts.retrievalTopK ?? 5,
        sourceMix: path?.sourceMix,
      });
      retrievedChunks = Array.isArray(hits) ? hits : [];
    } catch (err) {
      console.warn('[profile-context] retrieveForProfile failed:', err);
    }
  }

  const baseSystemPromptBlock = renderSystemPromptBlock({
    profile,
    situation,
    retrievedChunks,
    domain,
    path,
    toolId: opts.toolId,
    episodes,
    preferences,
    interaction,
    advisor,
    capsuleFrames: attachedCapsules.map(capsuleToPromptFrame),
  });
  const contextHealth = computeSituationContextHealth({
    profile,
    situation,
    expectedToolIds: [opts.toolId],
    retrievalCount: retrievedChunks.length,
    episodeCount: episodes.length,
  });
  const readiness = computeContextReadiness({ profile, situation, path, retrievedChunks, episodes });
  const systemPromptBlock = [
    baseSystemPromptBlock,
    ...(opts.allowWorkspaceRetrieval === false ? [] : [
      buildSituationContextHealthPrompt(contextHealth),
      `<context-readiness score="${readiness.score}" freshness="${readiness.freshnessScore}" lensCoveragePct="${readiness.lensCoveragePct}">\n  gaps: ${readiness.sourceGapFlags.join(', ') || 'none'}\n</context-readiness>`,
    ]),
  ].join('\n\n');
  const outputConstraints = profile ? renderOutputConstraints(profile) : NEUTRAL_CONSTRAINTS;

  return {
    systemPromptBlock,
    outputConstraints,
    toolContext: { profile, situation, retrievedChunks, episodes, capsules: attachedCapsules.map((item) => item.capsule) },
    preferences,
    interaction,
    advisor,
    contextHealth,
    readiness,
    domain,
    path,
    provenance: {
      profileVersion: profile?.meta?.version ?? 0,
      situationVersion: situation ? Date.parse(situation.updatedAt ?? '') || null : null,
      domainId: domain.id,
      domainVersion: domain.version,
      pathId: path?.id ?? null,
      pathVersion: path?.version ?? null,
      generatedAt: new Date().toISOString(),
    },
  };
}

interface AttachedCapsuleContext {
  ref: ActiveCapsuleRef;
  capsule: PraxisCapsule;
}

async function loadAttachedCapsules(input: {
  uid: string;
  capsuleId?: string | null;
  activeContextStack?: unknown;
}): Promise<AttachedCapsuleContext[]> {
  const refs = capsuleRefsForCalibration(input.capsuleId, input.activeContextStack);
  const capsules: AttachedCapsuleContext[] = [];
  for (const ref of refs) {
    try {
      const capsule = await resolveCapsuleReference(input.uid, ref);
      if (!capsule) continue;
      capsules.push({ ref, capsule });
    } catch (err) {
      if (err instanceof CapsuleVersionConflictError) throw err;
      console.warn('[profile-context] getCapsule failed:', err);
    }
  }
  return capsules;
}

function capsuleRefsForCalibration(capsuleId: string | null | undefined, activeContextStack: unknown): ActiveCapsuleRef[] {
  const requestedCapsuleId = cleanString(capsuleId);
  const stackInput = isRecord(activeContextStack) ? activeContextStack : {};
  const stack = sanitizeActiveContextStack({
    ...stackInput,
    capsuleId: requestedCapsuleId ?? stringFromRecord(stackInput, 'capsuleId'),
  });
  if (!requestedCapsuleId) return stack.capsuleRefs;
  if (stack.capsuleRefs[0]?.capsuleId === requestedCapsuleId) return stack.capsuleRefs;
  return sanitizeActiveContextStack({
    ...stack,
    capsuleId: requestedCapsuleId,
    capsuleRefs: [
      { capsuleId: requestedCapsuleId, role: 'primary', primary: true },
      ...stack.capsuleRefs.filter((ref) => ref.capsuleId !== requestedCapsuleId),
    ],
  }).capsuleRefs;
}

function capsuleToPromptFrame(input: AttachedCapsuleContext): CapsulePromptFrame {
  const { capsule, ref } = input;
  const v3 = capsule.v3;
  const sourceRefs = sourceRefsFor(capsule);
  const sourceById = new Map(sourceRefs.map((source) => [source.sourceId, source]));
  const claims = claimsFor(capsule).slice(0, 8).map((claim) => ({
    claimId: claim.claimId,
    text: claim.text,
    support: claim.support,
    receipts: claim.sourceRefIds.flatMap((sourceId) => {
      const source = sourceById.get(sourceId);
      return source ? [source] : [];
    }),
  }));

  return {
    capsuleId: capsule.capsuleId,
    label: ref.label ?? capsule.label,
    role: ref.role,
    version: capsule.version ?? null,
    order: ref.order,
    ontologyBinding: v3?.grounding?.ontologyBinding
      ? {
          domainId: v3.grounding.ontologyBinding.domainId,
          taxonomyPath: v3.grounding.ontologyBinding.taxonomyPath,
          ontologyIds: v3.grounding.ontologyBinding.ontologyIds,
          acoPrimitives: v3.grounding.ontologyBinding.acoPrimitives,
          bindingRationale: v3.grounding.ontologyBinding.bindingRationale,
        }
      : null,
    validityWindow: v3?.grounding?.temporality
      ? {
          asOf: v3.grounding.temporality.asOf,
          validFrom: v3.grounding.temporality.validFrom,
          validUntil: v3.grounding.temporality.validUntil,
        }
      : null,
    claims,
    agentOperatingContract: v3?.agentOperatingContract
      ? {
          allowedActions: v3.agentOperatingContract.allowedActions,
          forbiddenActions: v3.agentOperatingContract.forbiddenActions,
          sourceRequirements: v3.agentOperatingContract.sourceRequirements,
          reviewCheckpoints: v3.agentOperatingContract.reviewCheckpoints,
          toolRecommendations: v3.agentOperatingContract.toolRecommendations,
          bestNextAction: v3.agentOperatingContract.bestNextAction,
          handoffInstructions: v3.agentOperatingContract.handoffInstructions,
          stopConditions: v3.agentOperatingContract.stopConditions,
        }
      : null,
  };
}

function sourceRefsFor(capsule: PraxisCapsule): CapsulePromptFrame['claims'][number]['receipts'] {
  const v3Sources = capsule.v3?.sourceSpine?.sourceRefs ?? [];
  const fallbackSources = Array.isArray(capsule.sourceRefs) ? capsule.sourceRefs : [];
  return [...v3Sources, ...fallbackSources].flatMap((source) => {
    if (!isRecord(source)) return [];
    const sourceId = cleanString(source.sourceId) ?? cleanString(source.id);
    if (!sourceId) return [];
    return [{
      sourceId,
      label: cleanString(source.label) ?? cleanString(source.name) ?? cleanString(source.title) ?? sourceId,
      url: cleanString(source.url),
      date: cleanString(source.date) ?? cleanString(source.publishedAt) ?? cleanString(source.retrievedAt),
      reliabilityTier: typeof source.reliabilityTier === 'number' && Number.isFinite(source.reliabilityTier)
        ? source.reliabilityTier
        : null,
    }];
  });
}

function claimsFor(capsule: PraxisCapsule): Array<{
  claimId: string;
  text: string;
  support: string;
  sourceRefIds: string[];
}> {
  const v3Claims = capsule.v3?.claimLedger?.allClaims ?? [];
  const fallbackClaims = Array.isArray(capsule.claimLedger) ? capsule.claimLedger : [];
  return [...v3Claims, ...fallbackClaims].flatMap((claim, index) => {
    if (!isRecord(claim)) return [];
    const text = cleanString(claim.text) ?? cleanString(claim.claim);
    if (!text) return [];
    return [{
      claimId: cleanString(claim.claimId) ?? cleanString(claim.id) ?? `claim-${index + 1}`,
      text,
      support: cleanString(claim.support) ?? cleanString(claim.verdict) ?? 'needs_source',
      sourceRefIds: stringArray(claim.sourceRefIds).length
        ? stringArray(claim.sourceRefIds)
        : stringArray(claim.sourceIds),
    }];
  });
}

function buildDefaultRetrievalQuery(input: {
  situation: Situation | null;
  profile: AnalystProfile | null;
  toolId: string;
}): string | undefined {
  const situation = input.situation;
  if (!situation?.id) return undefined;

  const parts = [
    input.toolId,
    situation.name,
    situation.region,
    situation.domain,
    situation.pathId,
    situation.workflowPathLabel,
    situation.description,
    ...(situation.actors ?? []).slice(0, 8),
    ...(input.profile?.perspective.lenses ?? []).slice(0, 4),
    input.profile?.perspective.audience,
  ]
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean);

  return parts.length ? parts.join(' | ').slice(0, 1200) : undefined;
}

function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, 240) : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim().slice(0, 240));
}

function stringFromRecord(value: Record<string, unknown>, key: string): string | null {
  return cleanString(value[key]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
