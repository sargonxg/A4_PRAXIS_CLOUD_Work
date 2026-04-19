import { PubSub } from '@google-cloud/pubsub';
import { getAnalystProfile, upsertAnalystProfile } from './analyst-profile-admin';
import { generateEmbedding } from '@/lib/knowledge/embedding-service';

/** Module-level constant — grep target for topic name. */
const TOPIC_NAME = 'profile.events';

let client: PubSub | null = null;

function getClient(): PubSub {
  if (!client) client = new PubSub();
  return client;
}

export type ProfileEventKind =
  | 'created'
  | 'updated'
  | 'completed'
  | 'skipped'
  | 'embedding_refreshed';

export interface ProfileEvent {
  uid: string;
  kind: ProfileEventKind;
  versionId?: string;
  extra?: Record<string, string>;
}

/**
 * Publishes a profile lifecycle event to the `profile.events` Pub/Sub topic.
 * Returns true on success. Never throws — callers must not block on publish success.
 */
export async function publishProfileEvent(event: ProfileEvent): Promise<boolean> {
  try {
    const data = Buffer.from(
      JSON.stringify({ ...event, publishedAt: new Date().toISOString() })
    );
    await getClient().topic(TOPIC_NAME).publishMessage({
      data,
      attributes: {
        uid: event.uid,
        kind: event.kind,
        ...(event.versionId ? { versionId: event.versionId } : {}),
        ...(event.extra ?? {}),
      },
    });
    return true;
  } catch (err) {
    console.warn('[profile-events] publish failed (non-fatal):', err);
    return false;
  }
}

/**
 * Regenerates the profile embedding from mandate + lenses + regions + audience.
 * Called by Pub/Sub subscriber OR lazily by withCalibration when embedding is missing.
 * Returns true only when the 768-dim vector is successfully persisted.
 */
export async function refreshProfileEmbedding(uid: string): Promise<boolean> {
  try {
    const profile = await getAnalystProfile(uid);
    if (!profile) return false;

    const text = [
      profile.perspective.mandate,
      profile.perspective.lenses.length > 0
        ? `Lenses: ${profile.perspective.lenses.join(', ')}`
        : null,
      profile.perspective.regions.length > 0
        ? `Regions: ${profile.perspective.regions.join(', ')}`
        : null,
      `Audience: ${profile.perspective.audience}`,
    ]
      .filter(Boolean)
      .join('\n');

    if (!text.trim()) return false;

    const vector = await generateEmbedding(text);
    if (!vector) return false;

    await upsertAnalystProfile(uid, {
      embedding: {
        vector,
        generatedAt: new Date().toISOString(),
        model: 'gemini-embedding-2-preview',
      },
    });
    return true;
  } catch (err) {
    console.warn('[profile-events] refreshProfileEmbedding failed (non-fatal):', err);
    return false;
  }
}
