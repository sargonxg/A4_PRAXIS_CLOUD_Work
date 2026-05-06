import { adminDb } from '@/lib/firebase/admin';
import { AdvisorConfigSchema, type AdvisorConfig, type AdvisorId } from '@/types/advisor';
import { FieldValue } from 'firebase-admin/firestore';
import { FALLBACK_ADVISOR_CONFIGS } from '@/lib/constants/advisor-configs';

const PATH = (id: AdvisorId) => `config/advisors/items/${id}`;
const HISTORY = (id: AdvisorId, v: number) => `config/advisors_history/items/${id}_${v}`;

const cache = new Map<AdvisorId, { value: AdvisorConfig; at: number }>();
const TTL_MS = 5 * 60 * 1000;

export async function getAdvisor(id: AdvisorId): Promise<AdvisorConfig | null> {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  try {
    const snap = await adminDb.doc(PATH(id)).get();
    if (!snap.exists) return FALLBACK_ADVISOR_CONFIGS.find((advisor) => advisor.id === id) ?? null;
    const parsed = AdvisorConfigSchema.safeParse(snap.data());
    if (!parsed.success) return FALLBACK_ADVISOR_CONFIGS.find((advisor) => advisor.id === id) ?? null;
    cache.set(id, { value: parsed.data, at: Date.now() });
    return parsed.data;
  } catch (err) {
    console.warn(`[advisor-service] getAdvisor(${id}) failed:`, err);
    return FALLBACK_ADVISOR_CONFIGS.find((advisor) => advisor.id === id) ?? null;
  }
}

export async function listAdvisors(): Promise<AdvisorConfig[]> {
  try {
    const snap = await adminDb.collection('config/advisors/items').get();
    const advisors = snap.docs
      .map((d) => AdvisorConfigSchema.safeParse(d.data()))
      .filter((r): r is { success: true; data: AdvisorConfig } => r.success)
      .map((r) => r.data);
    return advisors.length > 0 ? advisors : FALLBACK_ADVISOR_CONFIGS;
  } catch (err) {
    console.warn('[advisor-service] listAdvisors failed:', err);
    return FALLBACK_ADVISOR_CONFIGS;
  }
}

export async function saveAdvisor(cfg: AdvisorConfig): Promise<AdvisorConfig> {
  let prev: AdvisorConfig | null = null;
  try {
    const snap = await adminDb.doc(PATH(cfg.id)).get();
    if (snap.exists) {
      const parsed = AdvisorConfigSchema.safeParse(snap.data());
      if (parsed.success) prev = parsed.data;
    }
  } catch (err) {
    console.warn(`[advisor-service] persisted lookup ${cfg.id} failed:`, err);
  }

  if (prev) {
    try {
      await adminDb.doc(HISTORY(cfg.id, prev.version)).set(prev);
    } catch (err) {
      console.warn(`[advisor-service] snapshot ${cfg.id} v${prev.version} failed:`, err);
    }
  }
  const next: AdvisorConfig = {
    ...cfg,
    version: (prev?.version ?? 0) + 1,
    updatedAt: FieldValue.serverTimestamp() as unknown as AdvisorConfig['updatedAt'],
  };
  await adminDb.doc(PATH(cfg.id)).set(next);
  cache.delete(cfg.id);
  return next;
}

export function bustAdvisorCache(): void {
  cache.clear();
}
