/**
 * PRAXIS Feed Layer — TTL-cached grounded-research accessor.
 * Reads from Firestore feed-cache subcollection.
 * TTL: per-feed configuration. Returns stale indicator.
 */

import { adminDb } from '@/lib/firebase/admin';
import type { FeedCacheEntry } from './types';

const FEED_TTL_HOURS: Record<string, number> = {
  grounded_search: 4,
  documents: 24,
};

export class FeedLayer {
  constructor(private uid: string, private situationId: string) {}

  private feedCacheRef() {
    return adminDb
      .collection('users').doc(this.uid)
      .collection('situations').doc(this.situationId)
      .collection('feed-cache');
  }

  async getFeedData(feedName: string): Promise<FeedCacheEntry | null> {
    try {
      const doc = await this.feedCacheRef().doc(feedName).get();
      if (!doc.exists) return null;
      const data = doc.data()!;
      const ttlExpires = new Date(data.ttlExpires);
      return {
        feedName,
        data: data.data,
        fetchedAt: data.fetchedAt,
        ttlExpires: data.ttlExpires,
        isStale: new Date() > ttlExpires,
        country: data.country ?? '',
      };
    } catch {
      return null;
    }
  }

  async getMultipleFeedData(feedNames: string[]): Promise<Record<string, FeedCacheEntry>> {
    const results: Record<string, FeedCacheEntry> = {};
    await Promise.all(feedNames.map(async (name) => {
      const entry = await this.getFeedData(name);
      if (entry && entry.data) results[name] = entry;
    }));
    return results;
  }

  async saveFeedData(feedName: string, data: unknown, country: string): Promise<void> {
    const ttlHours = FEED_TTL_HOURS[feedName] ?? 24;
    const now = new Date();
    const ttlExpires = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
    await this.feedCacheRef().doc(feedName).set({
      data,
      country,
      fetchedAt: now.toISOString(),
      ttlExpires: ttlExpires.toISOString(),
    });
  }

  async getToolRelevantFeeds(toolId: string): Promise<Record<string, FeedCacheEntry>> {
    const toolFeedMap: Record<string, string[]> = {
      'risk-monitor': ['grounded_search', 'documents'],
      'early-warning': ['grounded_search', 'documents'],
      'humanitarian': ['grounded_search', 'documents'],
      'timeline': ['grounded_search', 'documents'],
      'argus': ['grounded_search', 'documents'],
      'media-compass': ['grounded_search', 'documents'],
      'media-roundup': ['grounded_search', 'documents'],
      'geospatial-monitor': ['grounded_search', 'documents'],
      'sanctions': ['grounded_search', 'documents'],
      'actor-profiles': ['grounded_search', 'documents'],
      'power-map': ['grounded_search', 'documents'],
      'info-environment': ['grounded_search', 'documents'],
      'alert-center': ['grounded_search', 'documents'],
      'dashboard': ['grounded_search', 'documents'],
      'sources-library': ['grounded_search', 'documents'],
    };
    const feeds = toolFeedMap[toolId] ?? ['grounded_search', 'documents'];
    return this.getMultipleFeedData(feeds);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const snap = await this.feedCacheRef().limit(1).get();
      return true; // Firestore is accessible
    } catch {
      return false;
    }
  }
}
