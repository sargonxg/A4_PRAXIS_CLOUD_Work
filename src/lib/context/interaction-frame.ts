import { adminDb } from '@/lib/firebase/admin';
import type { InteractionFrame } from '@/types/interaction';

/**
 * Derives an InteractionFrame from recent tool outputs for the given user/situation.
 *
 * Reads up to 10 most-recent docs from `users/{uid}/situations/{situationId}/tools`
 * (the path `saveToolOutput` writes to), ordered by `generatedAt` desc.
 *
 * Normalizes each row into `{ toolId, ranAt, summary }` for the prompt block:
 *   - `ranAt` comes from the Firestore server timestamp `generatedAt`
 *   - `summary` is a short, model-friendly preview derived from `output`
 *
 * NEVER throws. Returns an empty frame on any error.
 */
export async function deriveInteractionFrame(
  uid: string,
  situationId: string | null,
): Promise<InteractionFrame> {
  if (!situationId) return { recentTools: [], activeSituationDrafts: 0 };
  try {
    const snap = await adminDb
      .collection(`users/${uid}/situations/${situationId}/tools`)
      .orderBy('generatedAt', 'desc')
      .limit(10)
      .get();
    const recentTools = snap.docs.map((d) => {
      const x = d.data() as {
        toolId?: string;
        generatedAt?: { toDate?: () => Date } | string | null;
        output?: unknown;
        summary?: string;
      };
      return {
        toolId: x.toolId ?? d.id,
        ranAt: toIso(x.generatedAt),
        summary: x.summary ?? summarizeOutput(x.output),
      };
    });
    return { recentTools, activeSituationDrafts: 0 };
  } catch {
    return { recentTools: [], activeSituationDrafts: 0 };
  }
}

function toIso(ts: { toDate?: () => Date } | string | null | undefined): string {
  if (!ts) return '';
  if (typeof ts === 'string') return ts;
  if (typeof ts === 'object' && typeof ts.toDate === 'function') {
    try {
      return ts.toDate().toISOString();
    } catch {
      return '';
    }
  }
  return '';
}

function summarizeOutput(output: unknown): string {
  if (!output) return '';
  if (typeof output === 'string') return truncate(output, 140);
  if (typeof output !== 'object') return '';
  const obj = output as Record<string, unknown>;
  for (const key of ['summary', 'headline', 'title', 'overview', 'executiveSummary']) {
    const v = obj[key];
    if (typeof v === 'string' && v.trim()) return truncate(v, 140);
  }
  for (const v of Object.values(obj)) {
    if (typeof v === 'string' && v.trim()) return truncate(v, 140);
  }
  return '';
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}
