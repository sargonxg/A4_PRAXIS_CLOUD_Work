/**
 * PRAXIS Episode Service — Admin SDK helpers for the chronology subcollection.
 *
 * Path: users/{uid}/situations/{sid}/episodes/{episodeId}
 *
 * All reads default to excluding soft-deleted episodes (deletedAt != null).
 * All lists sort by `date` ascending. Server-side only — these helpers require
 * the Firebase Admin SDK.
 *
 * See: docs/superpowers/specs/2026-04-19-generic-route-production-readiness-design.md §6
 */

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from './admin';
import type { Episode } from '@/types/episode';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function episodesCol(uid: string, sid: string) {
  const db = getAdminDbOrThrow();
  return db
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(sid)
    .collection('episodes');
}

function generateEpisodeId(): string {
  return `ep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Convert a Firestore document value to the wire-format Episode used by both
 * the API and the system-prompt renderer. Timestamps become ISO strings.
 */
function toEpisode(
  raw: FirebaseFirestore.DocumentData & { id?: string },
  fallbackId: string,
): Episode {
  const extractedAt =
    raw.extractedAt instanceof Timestamp
      ? raw.extractedAt.toDate().toISOString()
      : typeof raw.extractedAt === 'string'
        ? raw.extractedAt
        : null;
  const deletedAt =
    raw.deletedAt instanceof Timestamp
      ? raw.deletedAt.toDate().toISOString()
      : typeof raw.deletedAt === 'string'
        ? raw.deletedAt
        : null;

  return {
    id: String(raw.id ?? fallbackId),
    title: String(raw.title ?? ''),
    date: String(raw.date ?? ''),
    dateConfidence: (raw.dateConfidence ?? 'approximate') as Episode['dateConfidence'],
    description: String(raw.description ?? ''),
    actors: Array.isArray(raw.actors) ? (raw.actors as string[]) : [],
    importance: typeof raw.importance === 'number' ? raw.importance : 3,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    sources: Array.isArray(raw.sources) ? (raw.sources as Episode['sources']) : [],
    extractedBy: (raw.extractedBy ?? 'ai') as Episode['extractedBy'],
    extractedAt,
    profileVersion:
      typeof raw.profileVersion === 'number' ? raw.profileVersion : 0,
    domainVersion:
      typeof raw.domainVersion === 'number' ? raw.domainVersion : 0,
    deletedAt,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ListEpisodesOptions {
  /** When true, include soft-deleted episodes. Defaults to false. */
  includeDeleted?: boolean;
}

/**
 * List episodes for a situation, sorted by date ascending. By default filters
 * out soft-deleted rows. Never throws — returns `[]` on any failure so callers
 * (e.g. buildCalibratedContext) can fail open.
 */
export async function listEpisodes(
  uid: string,
  sid: string,
  opts: ListEpisodesOptions = {},
): Promise<Episode[]> {
  try {
    const col = episodesCol(uid, sid);
    // Firestore Admin SDK cannot easily filter on `deletedAt == null` in a
    // compound query without an index, so we fetch and filter in-memory. The
    // episodes subcollection is small (≤ 100 docs is the expected cap).
    const snap = await col.get();
    const episodes = snap.docs.map((d) => toEpisode(d.data(), d.id));
    const filtered = opts.includeDeleted
      ? episodes
      : episodes.filter((e) => e.deletedAt === null);
    filtered.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return filtered;
  } catch (err) {
    console.warn('[episodes] listEpisodes failed:', err);
    return [];
  }
}

export interface CreateEpisodeInput {
  title: string;
  date: string;
  dateConfidence: Episode['dateConfidence'];
  description: string;
  actors?: string[];
  importance: number;
  tags?: string[];
  sources?: Episode['sources'];
  extractedBy: Episode['extractedBy'];
  profileVersion: number;
  domainVersion: number;
}

/**
 * Create a new episode. Generates an id, stamps extractedAt with a server
 * timestamp, and sets deletedAt to null.
 */
export async function createEpisode(
  uid: string,
  sid: string,
  data: CreateEpisodeInput,
): Promise<Episode> {
  const id = generateEpisodeId();
  const ref = episodesCol(uid, sid).doc(id);
  const nowIso = new Date().toISOString();
  const doc = {
    id,
    title: data.title,
    date: data.date,
    dateConfidence: data.dateConfidence,
    description: data.description,
    actors: data.actors ?? [],
    importance: data.importance,
    tags: data.tags ?? [],
    sources: data.sources ?? [],
    extractedBy: data.extractedBy,
    extractedAt: FieldValue.serverTimestamp(),
    profileVersion: data.profileVersion,
    domainVersion: data.domainVersion,
    deletedAt: null,
  };
  await ref.set(doc);
  return {
    id,
    title: data.title,
    date: data.date,
    dateConfidence: data.dateConfidence,
    description: data.description,
    actors: data.actors ?? [],
    importance: data.importance,
    tags: data.tags ?? [],
    sources: data.sources ?? [],
    extractedBy: data.extractedBy,
    extractedAt: nowIso,
    profileVersion: data.profileVersion,
    domainVersion: data.domainVersion,
    deletedAt: null,
  };
}

export type UpdateEpisodeInput = Partial<
  Pick<
    Episode,
    | 'title'
    | 'date'
    | 'dateConfidence'
    | 'description'
    | 'actors'
    | 'importance'
    | 'tags'
    | 'sources'
  >
>;

/**
 * Partial update of an episode. Only user-editable fields are accepted.
 */
export async function updateEpisode(
  uid: string,
  sid: string,
  episodeId: string,
  patch: UpdateEpisodeInput,
): Promise<void> {
  const ref = episodesCol(uid, sid).doc(episodeId);
  await ref.update({ ...patch });
}

/**
 * Soft-delete: sets `deletedAt` to a server timestamp. The AI still sees the
 * episode for memory purposes via `listEpisodes({ includeDeleted: true })`, but
 * the default list (and therefore the system-prompt injection) hides it.
 */
export async function deleteEpisode(
  uid: string,
  sid: string,
  episodeId: string,
): Promise<void> {
  const ref = episodesCol(uid, sid).doc(episodeId);
  await ref.update({ deletedAt: FieldValue.serverTimestamp() });
}

export interface EpisodeDayBucket {
  /** ISO date (YYYY-MM-DD) used as the group key. */
  date: string;
  episodes: Episode[];
}

/**
 * Groups live (non-deleted) episodes by calendar day (YYYY-MM-DD), preserving
 * within-day order by Episode.date, and returns the buckets newest-first so the
 * timeline renders without further sorting.
 */
export function aggregateEpisodesByDay(episodes: Episode[]): EpisodeDayBucket[] {
  const byDay = new Map<string, Episode[]>();
  for (const e of episodes) {
    if (e.deletedAt) continue;
    const key = (e.date ?? '').slice(0, 10) || 'undated';
    const bucket = byDay.get(key) ?? [];
    bucket.push(e);
    byDay.set(key, bucket);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a > b ? -1 : a < b ? 1 : 0))
    .map(([date, list]) => ({
      date,
      episodes: list.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0)),
    }));
}
