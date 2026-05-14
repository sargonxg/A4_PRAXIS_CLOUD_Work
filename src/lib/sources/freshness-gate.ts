import { readdir } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export interface SourceFreshnessGate {
  feedId: string;
  lastPollAt: string | null;
  staleSeconds: number | null;
  suggestedAction: 'ok' | 'poll' | 'rotate-token' | 'configure-feed';
}

export async function getSourceFreshnessGate(feedIds?: string[]): Promise<SourceFreshnessGate[]> {
  const ids = feedIds?.length ? feedIds : await configuredFeedIds();
  const db = getAdminDbOrThrow();
  const now = Date.now();
  const gates = await Promise.all(ids.map(async (feedId) => {
    const [configSnap, healthSnap] = await Promise.all([
      db.collection('config').doc('sources').collection('feeds').doc(feedId).get().catch(() => null),
      db.collection('source_health').doc(feedId).get().catch(() => null),
    ]);
    const config = configSnap?.exists ? configSnap.data() ?? {} : {};
    const health = healthSnap?.exists ? healthSnap.data() ?? {} : {};
    const lastPollAt = stringField(health.lastPollAt) ?? stringField(config.lastPollAt);
    const staleAfterSeconds = numberField(config.staleAfterSeconds) ?? 86_400;
    const staleSeconds = lastPollAt ? Math.max(0, Math.floor((now - Date.parse(lastPollAt)) / 1000)) : null;
    const tokenStatus = stringField(config.tokenStatus);
    return {
      feedId,
      lastPollAt,
      staleSeconds,
      suggestedAction: tokenStatus === 'rotation_required'
        ? 'rotate-token'
        : staleSeconds === null
          ? 'configure-feed'
          : staleSeconds > staleAfterSeconds
            ? 'poll'
            : 'ok',
    } satisfies SourceFreshnessGate;
  }));
  return gates.sort((a, b) => a.feedId.localeCompare(b.feedId));
}

async function configuredFeedIds(): Promise<string[]> {
  try {
    const entries = await readdir(join(process.cwd(), 'config', 'sources'), { withFileTypes: true });
    const ids = entries
      .filter((entry) => entry.isFile())
      .map((entry) => parse(entry.name).name)
      .filter(Boolean);
    if (ids.length > 0) return ids;
  } catch {
    // Firestore config is the fallback in deployed environments.
  }
  const snap = await getAdminDbOrThrow().collection('config').doc('sources').collection('feeds').limit(100).get().catch(() => null);
  return snap?.docs.map((doc) => doc.id) ?? [];
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function numberField(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
