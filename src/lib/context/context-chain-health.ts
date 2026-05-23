import {
  normalizeContextCapsuleV2,
  type ContextCapsuleNormalizeOptions,
  type ContextCapsuleV2,
} from '@/lib/context/capsule-v2';
import { deriveHumanGateStatus } from '@/lib/context/human-gate';

export type ContextChainStrength = 'strong' | 'usable' | 'weak' | 'blocked';
export type ContextChainSafeUseLabel = 'final_memo_ready' | 'exploratory_only' | 'review_required';

export interface ContextChainHealthInput extends ContextCapsuleNormalizeOptions {
  activeCapsule: ContextCapsuleV2 | unknown;
  referenceCapsules?: Array<ContextCapsuleV2 | unknown>;
  outputIntent?: 'final_output' | 'source_intake' | 'exploratory';
}

export interface ContextChainHealthResult {
  chainStrength: ContextChainStrength;
  diagnostics: string[];
  recommendedNextAction: string;
  safeUseLabel: ContextChainSafeUseLabel;
}

export function deriveContextChainHealth(input: ContextChainHealthInput): ContextChainHealthResult {
  const activeCapsule = normalizeContextCapsuleV2(input.activeCapsule, input);
  const referenceCapsules = (input.referenceCapsules ?? []).map((capsule) => normalizeContextCapsuleV2(capsule, input));
  const capsules = [activeCapsule, ...referenceCapsules];
  const diagnostics: string[] = [];

  const hasSituation = capsules.some((capsule) => capsule.capsuleClass === 'situation' || Boolean(capsule.coreRefs.situationCoreId));
  const hasSourcePack = capsules.some((capsule) => capsule.capsuleClass === 'source_pack' || capsule.sourceRefs.length > 0);
  const hasThinkingDevice = capsules.some((capsule) => capsule.capsuleClass === 'thinking_device' || capsule.coreRefs.toolCoreIds.length > 0);
  const hasArtifact = capsules.some((capsule) => capsule.capsuleClass === 'artifact' || capsule.outputContracts.length > 0 || capsule.coreRefs.outputCoreIds.length > 0 || capsule.coreRefs.productCoreIds.length > 0);
  const unsupportedClaims = capsules.flatMap((capsule) => capsule.claimLedger.filter((claim) => claim.support === 'unsupported' || claim.support === 'needs_source' || claim.sourceRefIds.length === 0));
  const staleHumanGates = capsules.filter((capsule) => {
    const status = deriveHumanGateStatus(capsule, input);
    return status === 'stale' || status === 'blocked';
  });

  if (!hasSituation) diagnostics.push('Missing situation capsule for the active chain.');
  if (!hasSourcePack) diagnostics.push('Missing source pack or source refs.');
  if (!hasThinkingDevice) diagnostics.push('Missing thinking device or reasoning tool.');
  if (!hasArtifact) diagnostics.push('Missing artifact/output capsule.');
  if (unsupportedClaims.length) diagnostics.push('Unsupported claims block final-output readiness.');
  if (staleHumanGates.length) diagnostics.push('Stale human-gated capsule requires renewed review.');

  if (unsupportedClaims.length || staleHumanGates.length) {
    return {
      chainStrength: 'blocked',
      diagnostics,
      recommendedNextAction: staleHumanGates.length ? 'Refresh human review before final output.' : 'Run sourceability and convert unsupported claims before final output.',
      safeUseLabel: 'review_required',
    };
  }

  if (!hasSourcePack && input.outputIntent !== 'source_intake') {
    return {
      chainStrength: 'weak',
      diagnostics,
      recommendedNextAction: 'Attach a source pack or run source intake before drafting.',
      safeUseLabel: 'exploratory_only',
    };
  }

  if (hasSituation && hasSourcePack && hasThinkingDevice && hasArtifact) {
    return {
      chainStrength: 'strong',
      diagnostics,
      recommendedNextAction: activeCapsule.bestNextAction || 'Proceed to reviewed output with evidence annex.',
      safeUseLabel: 'final_memo_ready',
    };
  }

  if (hasSituation && hasSourcePack) {
    return {
      chainStrength: 'usable',
      diagnostics,
      recommendedNextAction: hasThinkingDevice ? 'Add output contract before final handoff.' : 'Add a thinking device before final handoff.',
      safeUseLabel: 'review_required',
    };
  }

  return {
    chainStrength: 'weak',
    diagnostics,
    recommendedNextAction: 'Add situation, sources, reasoning device, and output contract.',
    safeUseLabel: 'exploratory_only',
  };
}
