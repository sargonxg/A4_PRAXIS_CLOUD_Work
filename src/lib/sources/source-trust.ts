export type SourceReliabilityTier = 1 | 2 | 3;

export interface SourceTrustInput {
  reliabilityTier?: unknown;
  date?: string | null;
  stale?: boolean | null;
}

export function resolveSourceTier(input: SourceTrustInput | unknown): SourceReliabilityTier | null {
  const value = isRecord(input) && 'reliabilityTier' in input
    ? input.reliabilityTier
    : input;
  if (value === 1 || value === '1') return 1;
  if (value === 2 || value === '2') return 2;
  if (value === 3 || value === '3') return 3;
  return null;
}

export function sourceTierSortRank(tier: SourceReliabilityTier | null): number {
  if (tier === 1) return 0;
  if (tier === 2) return 1;
  if (tier === 3) return 2;
  return 3;
}

export function compareSourcesByTierThenRecency(a: SourceTrustInput, b: SourceTrustInput): number {
  const tierDiff = sourceTierSortRank(resolveSourceTier(a)) - sourceTierSortRank(resolveSourceTier(b));
  if (tierDiff !== 0) return tierDiff;
  const aTime = sourceDateTimestamp(a.date);
  const bTime = sourceDateTimestamp(b.date);
  if (aTime !== null && bTime !== null && aTime !== bTime) return bTime - aTime;
  if (aTime !== null && bTime === null) return -1;
  if (aTime === null && bTime !== null) return 1;
  return 0;
}

export function sortSourcesByTierThenRecency<T extends SourceTrustInput>(sources: T[]): T[] {
  return sources
    .map((source, index) => ({ source, index }))
    .sort((a, b) => compareSourcesByTierThenRecency(a.source, b.source) || a.index - b.index)
    .map((item) => item.source);
}

export function formatSourceFreshness(input: SourceTrustInput, now: Date = new Date()): string {
  const timestamp = sourceDateTimestamp(input.date);
  if (timestamp === null) return input.stale ? 'stale, undated' : 'undated';
  const isoDate = new Date(timestamp).toISOString().slice(0, 10);
  if (input.stale) return `stale ${isoDate}`;
  const days = Math.floor((startOfUtcDay(now).getTime() - startOfUtcDay(new Date(timestamp)).getTime()) / 86_400_000);
  if (!Number.isFinite(days)) return isoDate;
  if (days < 0) return `${isoDate} future-dated`;
  if (days === 0) return `${isoDate} today`;
  return `${isoDate} ${days}d old`;
}

function sourceDateTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
