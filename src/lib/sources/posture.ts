import { z } from 'zod';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const SourcePostureSchema = z.object({
  id: z.string().min(1).max(160),
  label: z.string().min(1).max(200).optional(),
  reliability: z.number().min(0).max(1).default(0.65),
  recency: z.number().min(0).max(1).default(0.5),
  conflictFlags: z.array(z.string().min(1).max(120)).max(20).default([]),
  feedOrigin: z.string().min(1).max(120).default('unknown'),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
});

export type SourcePosture = z.infer<typeof SourcePostureSchema>;
export type SourceMixWeight = { feed: string; weight: number };

const DEFAULT_FEED_RELIABILITY: Record<string, number> = {
  ucdp: 0.9,
  gdelt: 0.72,
  grounded_search: 0.68,
  reliefweb: 0.86,
  hdx: 0.86,
  unhcr: 0.86,
  un_news: 0.82,
  world_bank: 0.84,
  treaties: 0.9,
  documents: 0.78,
  osint: 0.58,
};

export async function getSourcePosture(id: string): Promise<SourcePosture> {
  const clean = normalizeSourceId(id);
  try {
    const snap = await getAdminDbOrThrow().collection('sources').doc(clean).get();
    if (snap.exists) {
      const parsed = SourcePostureSchema.safeParse({ id: clean, ...snap.data() });
      if (parsed.success) return parsed.data;
      console.warn('[sources/posture] invalid source posture:', clean, parsed.error.issues);
    }
  } catch (err) {
    console.warn('[sources/posture] read failed:', clean, err);
  }
  return fallbackPosture(clean);
}

export async function getSourcePostureMap(ids: readonly string[]): Promise<Record<string, SourcePosture>> {
  const uniqueIds = Array.from(new Set(ids.map(normalizeSourceId).filter(Boolean)));
  const entries = await Promise.all(uniqueIds.map(async (id) => [id, await getSourcePosture(id)] as const));
  return Object.fromEntries(entries);
}

export function sourcePostureMultiplier(
  posture: SourcePosture | null | undefined,
  sourceMix: readonly SourceMixWeight[] = [],
): number {
  if (!posture) return 1;
  const mixWeight = sourceMix.find((item) => normalizeSourceId(item.feed) === normalizeSourceId(posture.feedOrigin))?.weight ?? 0;
  const trust = 0.65 + posture.reliability * 0.25 + posture.recency * 0.1;
  const pathBoost = 1 + Math.min(0.35, mixWeight);
  const flagPenalty = Math.max(0.65, 1 - posture.conflictFlags.length * 0.08);
  return clamp(trust * pathBoost * flagPenalty, 0.45, 1.45);
}

export function normalizeSourceId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_.:-]/g, '_').slice(0, 160);
}

function fallbackPosture(id: string): SourcePosture {
  const feedOrigin = inferFeedOrigin(id);
  return {
    id,
    label: id,
    reliability: DEFAULT_FEED_RELIABILITY[feedOrigin] ?? 0.62,
    recency: 0.5,
    conflictFlags: [],
    feedOrigin,
  };
}

function inferFeedOrigin(id: string): string {
  const normalized = normalizeSourceId(id);
  for (const feed of Object.keys(DEFAULT_FEED_RELIABILITY)) {
    if (normalized.includes(feed)) return feed;
  }
  if (normalized.includes('worldbank')) return 'world_bank';
  if (normalized.includes('unnews')) return 'un_news';
  return normalized.split(':')[0] || 'unknown';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
