/**
 * PRAXIS Feed Layer — TTL-cached data feed accessor.
 * Reads from Firestore feed-cache subcollection.
 * TTL: per-feed configuration. Returns stale indicator.
 */

import { adminDb } from '@/lib/firebase/admin';
import type { FeedCacheEntry } from './types';

// TTL per feed (in hours)
const FEED_TTL_HOURS: Record<string, number> = {
  gdelt: 1,
  hdx: 6,
  reliefweb: 6,
  unhcr: 12,
  ucdp: 24,
  worldbank: 48,
  unnews: 4,
  icg: 24,
  sipri: 168, // weekly
  opensanctions: 24,
  vdem: 720, // monthly
  icews: 168,
  acaps: 24,
  'ace-electoral': 720,
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
      'risk-monitor': ['gdelt', 'hdx', 'ucdp'],
      'early-warning': ['gdelt', 'icews', 'ucdp'],
      'humanitarian': ['hdx', 'unhcr', 'reliefweb', 'acaps'],
      'timeline': ['gdelt', 'unnews', 'ucdp'],
      'argus': ['gdelt', 'icews', 'ucdp'],
      'media-compass': ['gdelt', 'reliefweb', 'unnews'],
      'media-roundup': ['gdelt', 'unnews', 'reliefweb'],
      'geospatial-monitor': ['gdelt', 'hdx', 'unhcr'],
      'sanctions': ['opensanctions'],
      'actor-profiles': ['gdelt', 'opensanctions'],
      'power-map': ['gdelt', 'vdem'],
      'info-environment': ['gdelt', 'unnews'],
      'alert-center': ['gdelt', 'hdx'],
      'dashboard': ['gdelt', 'hdx', 'reliefweb'],
      'sources-library': ['gdelt', 'reliefweb', 'unnews'],
    };
    const feeds = toolFeedMap[toolId] ?? ['gdelt'];
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
