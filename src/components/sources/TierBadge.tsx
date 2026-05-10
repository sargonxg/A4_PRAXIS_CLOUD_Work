import { getTierDefinition, type SourceTier } from '@/lib/sources/tiers';

export function SourceTierBadge({ tier }: { tier?: SourceTier | null }) {
  const definition = getTierDefinition(tier);
  return (
    <span
      title={`${definition.label}: ${definition.description}`}
      className={`inline-flex h-6 items-center border px-2 text-xs font-medium ${definition.className}`}
    >
      {definition.tier} {definition.label}
    </span>
  );
}
