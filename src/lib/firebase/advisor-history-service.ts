import { adminDb } from '@/lib/firebase/admin';
import type { AdvisorId } from '@/types/advisor';

export interface AdvisorTurn {
  role: 'user' | 'assistant';
  content: string;
  /** ISO 8601 timestamp. */
  at: string;
}

const PATH = (uid: string, sid: string, aid: AdvisorId) =>
  `users/${uid}/situations/${sid}/advisors/${aid}/history`;

export async function appendTurn(
  uid: string,
  sid: string,
  aid: AdvisorId,
  turn: AdvisorTurn,
): Promise<void> {
  try {
    await adminDb.collection(PATH(uid, sid, aid)).add(turn);
  } catch (err) {
    console.warn(`[advisor-history] appendTurn(${aid}) failed:`, err);
  }
}

export async function readRecentTurns(
  uid: string,
  sid: string,
  aid: AdvisorId,
  n: number,
): Promise<AdvisorTurn[]> {
  try {
    const snap = await adminDb
      .collection(PATH(uid, sid, aid))
      .orderBy('at', 'asc')
      .limit(n)
      .get();
    return snap.docs.map((d) => d.data() as AdvisorTurn);
  } catch (err) {
    console.warn(`[advisor-history] readRecentTurns(${aid}) failed:`, err);
    return [];
  }
}
