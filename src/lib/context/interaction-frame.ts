import { adminDb } from '@/lib/firebase/admin';
import type { InteractionFrame } from '@/types/interaction';

/**
 * Derives an InteractionFrame from recent tool outputs for the given user/situation.
 *
 * Reads up to 10 most-recent entries from
 * `users/{uid}/situations/{situationId}/tool_outputs`, ordered by `ranAt` desc.
 *
 * NEVER throws. Returns an empty frame on any error (missing situation, Firestore
 * unavailable, permission error, etc.) to match the `buildCalibratedContext`
 * "never abort the build" contract.
 *
 * @param uid          Firebase user ID
 * @param situationId  Active situation ID (null/undefined → returns empty frame)
 */
export async function deriveInteractionFrame(
  uid: string,
  situationId: string | null,
): Promise<InteractionFrame> {
  if (!situationId) return { recentTools: [], activeSituationDrafts: 0 };
  try {
    const snap = await adminDb
      .collection(`users/${uid}/situations/${situationId}/tool_outputs`)
      .orderBy('ranAt', 'desc')
      .limit(10)
      .get();
    const recentTools = snap.docs.map((d) => {
      const x = d.data() as { toolId: string; ranAt: string; summary?: string };
      return { toolId: x.toolId, ranAt: x.ranAt, summary: x.summary ?? '' };
    });
    return { recentTools, activeSituationDrafts: 0 };
  } catch {
    return { recentTools: [], activeSituationDrafts: 0 };
  }
}
