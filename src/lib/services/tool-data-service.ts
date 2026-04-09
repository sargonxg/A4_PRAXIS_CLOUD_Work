/**
 * Client-side tool data service.
 * Reads and writes tool outputs to Firestore using the client SDK (not Admin SDK).
 * Provides real-time subscriptions via onSnapshot.
 *
 * Firestore path: users/{uid}/situations/{sitId}/tools/{toolName}
 */
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';

export type ToolName =
  | 'scenario_analysis'
  | 'dossier'
  | 'briefing'
  | 'talking_points'
  | 'negotiation_prep'
  | 'mediation_design'
  | 'risk_assessment'
  | 'escalation_scan'
  | 'media_analysis'
  | 'media_roundup'
  | 'sanctions_scan'
  | 'treaty_analysis'
  | 'commitment_scan'
  | 'stakeholder_map'
  | 'early_warning'
  | 'un_toolkit'
  | 'deep_research'
  | 'actor_enrichment'
  | 'info_environment'
  | 'historical_parallels'
  | 'calendar'
  | 'game_theory'
  | 'poc_assessment'
  | 'power_map'
  | 'policy_memo'
  | 'compare'
  // Group 8 — New tools (v6.0) — hyphenated to match route writeToolDataServer keys
  | 'legal-tracker'
  | 'external-actors'
  | 'economic-impact'
  | 'peacebuilding-index'
  | 'human-rights'
  | 'electoral-risk';

function toolRef(uid: string, sitId: string, tool: ToolName) {
  return doc(db, 'users', uid, 'situations', sitId, 'tools', tool);
}

/** Read tool data once. Returns null if no data exists. */
export async function readToolData<T = unknown>(
  uid: string,
  sitId: string,
  tool: ToolName,
): Promise<T | null> {
  const snap = await getDoc(toolRef(uid, sitId, tool));
  return snap.exists() ? (snap.data() as T) : null;
}

/** Write tool data to Firestore. Always adds generatedAt timestamp. */
export async function writeToolData(
  uid: string,
  sitId: string,
  tool: ToolName,
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(
    toolRef(uid, sitId, tool),
    { ...data, generatedAt: new Date().toISOString() },
    { merge: true },
  );
}

/** Subscribe to real-time tool data updates. Returns an unsubscribe function. */
export function subscribeToolData<T = unknown>(
  uid: string,
  sitId: string,
  tool: ToolName,
  callback: (data: T | null) => void,
): Unsubscribe {
  return onSnapshot(toolRef(uid, sitId, tool), (snap) => {
    callback(snap.exists() ? (snap.data() as T) : null);
  });
}
