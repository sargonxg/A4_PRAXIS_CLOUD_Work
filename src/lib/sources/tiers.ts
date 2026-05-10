export type SourceTier = 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7';

export interface SourceTierDefinition {
  tier: SourceTier;
  label: string;
  description: string;
  confidenceCap: number;
  citationWeight: number;
  canPromoteToVerdict: boolean;
  className: string;
}

export const TIER_DEFINITIONS: Record<SourceTier, SourceTierDefinition> = {
  T0: { tier: 'T0', label: 'Direct upload', description: 'User-provided primary material awaiting review.', confidenceCap: 0.9, citationWeight: 0.9, canPromoteToVerdict: true, className: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  T1: { tier: 'T1', label: 'Primary authority', description: 'Official record, statute, filing, transcript, or signed primary-source material.', confidenceCap: 0.95, citationWeight: 1, canPromoteToVerdict: true, className: 'border-emerald-400 bg-emerald-100 text-emerald-900' },
  T2: { tier: 'T2', label: 'Structured dataset', description: 'Reputable structured dataset or validated institutional data feed.', confidenceCap: 0.85, citationWeight: 0.85, canPromoteToVerdict: true, className: 'border-teal-300 bg-teal-50 text-teal-800' },
  T3: { tier: 'T3', label: 'Expert analysis', description: 'Credible expert, academic, or research-organization analysis.', confidenceCap: 0.75, citationWeight: 0.7, canPromoteToVerdict: true, className: 'border-yellow-300 bg-yellow-50 text-yellow-800' },
  T4: { tier: 'T4', label: 'Reported source', description: 'Journalistic or NGO reporting with identifiable provenance.', confidenceCap: 0.65, citationWeight: 0.55, canPromoteToVerdict: false, className: 'border-amber-300 bg-amber-50 text-amber-800' },
  T5: { tier: 'T5', label: 'Open web', description: 'Open-web material that needs corroboration before strong claims.', confidenceCap: 0.55, citationWeight: 0.4, canPromoteToVerdict: false, className: 'border-amber-400 bg-amber-100 text-amber-900' },
  T6: { tier: 'T6', label: 'Unreviewed extraction', description: 'Machine extraction or weakly attributed source not yet reviewed.', confidenceCap: 0.4, citationWeight: 0.2, canPromoteToVerdict: false, className: 'border-orange-300 bg-orange-50 text-orange-800' },
  T7: { tier: 'T7', label: 'AI assessment', description: 'AI-generated assessment or synthesis; never sufficient for verdict-layer writes.', confidenceCap: 0.25, citationWeight: 0.1, canPromoteToVerdict: false, className: 'border-red-300 bg-red-50 text-red-800' },
};

export function getTierDefinition(tier: SourceTier | null | undefined): SourceTierDefinition {
  return TIER_DEFINITIONS[tier ?? 'T7'];
}

export function canPromoteToVerdict(tier: SourceTier, reviewed: boolean): boolean {
  const definition = getTierDefinition(tier);
  return definition.canPromoteToVerdict && (tier === 'T0' ? reviewed : true);
}

export function confidenceCapForTier(tier: SourceTier): number {
  return getTierDefinition(tier).confidenceCap;
}

export function normalizeSourceTier(value: unknown): SourceTier {
  return typeof value === 'string' && value in TIER_DEFINITIONS ? value as SourceTier : 'T7';
}
