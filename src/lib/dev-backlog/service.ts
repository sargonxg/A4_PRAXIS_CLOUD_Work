/**
 * Developer Backlog — service.
 *
 * Server-side helpers for publishing and reading backlog entries.
 * Storage: `dev_backlog/{id}` Firestore collection (root-level for ops
 * visibility — no per-user nesting). TTL on `expiresAt`.
 *
 * Publishing is fire-and-forget; never throws to the caller. Reads return
 * a typed array sorted by severity then recency.
 */

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'crypto';
import {
  DEFAULT_BACKLOG_LIMIT,
  DEFAULT_LOOKBACK_DAYS,
  MAX_BACKLOG_LIMIT,
  type DevBacklogEntry,
  type DevBacklogKind,
  type DevBacklogQuery,
  type DevBacklogSeverity,
  type DevBacklogStatus,
} from './types';

const COLLECTION = 'dev_backlog';

const TTL_DAYS_BY_SEVERITY: Record<DevBacklogSeverity, number> = {
  critical: 365,
  high: 365,
  medium: 90,
  low: 90,
  info: 30,
};

const SEVERITY_ORDER: Record<DevBacklogSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export interface PublishBacklogInput {
  kind: DevBacklogKind;
  source?: 'auto' | 'agent' | 'user';
  severity: DevBacklogSeverity;
  message: string;
  detail?: string;
  toolId?: string;
  situationId?: string;
  uid?: string;
  route?: string;
  httpStatus?: number;
  suggestedFix?: string;
}

/**
 * Publish a backlog entry. Folds duplicates by dedupe key — incrementing
 * `occurrences` on the existing row instead of writing a new one.
 *
 * Never throws. Returns the entry id (existing or newly created) or null
 * if Firestore was unavailable.
 */
export async function publishBacklogEntry(input: PublishBacklogInput): Promise<string | null> {
  if (!adminDb) return null;
  try {
    const dedupeKey = computeDedupeKey(input);
    const col = adminDb.collection(COLLECTION);

    // Fold duplicates by dedupeKey (open or queued only — resolved rows
    // get a fresh entry so re-occurrences after a fix are visible).
    const dupes = await col
      .where('dedupeKey', '==', dedupeKey)
      .where('status', 'in', ['open', 'investigating', 'queued', 'in-progress'])
      .limit(1)
      .get()
      .catch(() => null);

    if (dupes && !dupes.empty) {
      const dupe = dupes.docs[0];
      await dupe.ref.update({
        occurrences: FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
        // Bump severity up only — never down.
        severity: severityHigher(dupe.data().severity, input.severity),
      });
      return dupe.id;
    }

    const now = new Date();
    const entry: Omit<DevBacklogEntry, 'id'> = {
      kind: input.kind,
      source: input.source ?? 'auto',
      severity: input.severity,
      status: 'open',
      message: capString(input.message, 600),
      detail: input.detail ? capString(input.detail, 4000) : undefined,
      toolId: input.toolId,
      situationId: input.situationId,
      uid: input.uid,
      route: input.route,
      httpStatus: input.httpStatus,
      suggestedFix: input.suggestedFix ? capString(input.suggestedFix, 1500) : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: ttlDateFor(input.severity, now).toISOString(),
      dedupeKey,
      occurrences: 1,
    };
    const ref = await col.add(entry);
    return ref.id;
  } catch (err) {
    console.warn('[dev-backlog] publish failed (non-fatal):', err instanceof Error ? err.message : err);
    return null;
  }
}

export interface QueryBacklogResult {
  entries: DevBacklogEntry[];
  /** Capped count returned. Caller can detect "more available" by
   *  comparing against `query.limit`. */
  totalReturned: number;
}

export async function queryBacklog(query: DevBacklogQuery): Promise<QueryBacklogResult> {
  if (!adminDb) return { entries: [], totalReturned: 0 };
  try {
    const limit = clamp(query.limit ?? DEFAULT_BACKLOG_LIMIT, 1, MAX_BACKLOG_LIMIT);
    const sinceDays = clamp(query.sinceDays ?? DEFAULT_LOOKBACK_DAYS, 1, 365);
    const sinceIso = new Date(Date.now() - sinceDays * 86_400_000).toISOString();

    let ref: FirebaseFirestore.Query = adminDb.collection(COLLECTION);
    if (query.kind) ref = ref.where('kind', '==', query.kind);
    if (query.severity) ref = ref.where('severity', '==', query.severity);
    if (query.status) ref = ref.where('status', '==', query.status);
    if (query.toolId) ref = ref.where('toolId', '==', query.toolId);
    if (query.situationId) ref = ref.where('situationId', '==', query.situationId);

    // Always bound the look-back window so unbounded scans are impossible.
    ref = ref.where('updatedAt', '>=', sinceIso);

    const snap = await ref.orderBy('updatedAt', 'desc').limit(limit).get();
    const entries: DevBacklogEntry[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DevBacklogEntry, 'id'>) }));

    // Stable client-side sort: severity asc (critical first), then updatedAt desc.
    entries.sort((a, b) => {
      const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (s !== 0) return s;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

    return { entries, totalReturned: entries.length };
  } catch (err) {
    console.warn('[dev-backlog] query failed:', err instanceof Error ? err.message : err);
    return { entries: [], totalReturned: 0 };
  }
}

export async function setBacklogStatus(id: string, status: DevBacklogStatus, brickId?: string): Promise<boolean> {
  if (!adminDb) return false;
  try {
    await adminDb.collection(COLLECTION).doc(id).update({
      status,
      brickId: brickId ?? null,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.warn('[dev-backlog] setStatus failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Pure helpers (exposed for tests)
// ---------------------------------------------------------------------------

export function computeDedupeKey(input: PublishBacklogInput): string {
  const norm = [
    input.kind,
    input.toolId ?? '',
    input.route ?? '',
    String(input.httpStatus ?? ''),
    normalizeMessage(input.message),
  ].join('|');
  return createHash('sha1').update(norm).digest('hex').slice(0, 24);
}

function normalizeMessage(message: string): string {
  // Strip dynamic IDs, timestamps, and stack frames so similar errors fold.
  return (message || '')
    .toLowerCase()
    .replace(/\b[0-9a-f]{8,}\b/g, '<id>')
    .replace(/\b\d{2,}\b/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

function severityHigher(a: DevBacklogSeverity | undefined, b: DevBacklogSeverity): DevBacklogSeverity {
  if (!a) return b;
  return SEVERITY_ORDER[a] <= SEVERITY_ORDER[b] ? a : b;
}

function ttlDateFor(severity: DevBacklogSeverity, now: Date): Date {
  const days = TTL_DAYS_BY_SEVERITY[severity] ?? 90;
  return new Date(now.getTime() + days * 86_400_000);
}

function capString(value: string, max: number): string {
  if (!value) return value;
  return value.length > max ? value.slice(0, max - 1) + '…' : value;
}

function clamp(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(value) || value < lo) return lo;
  return Math.min(Math.floor(value), hi);
}

export const __test__ = {
  computeDedupeKey,
  normalizeMessage,
  severityHigher,
  ttlDateFor,
  capString,
  clamp,
};
