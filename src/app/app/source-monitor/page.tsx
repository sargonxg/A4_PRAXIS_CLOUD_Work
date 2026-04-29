'use client';

import { useState } from 'react';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useSituationStore } from '@/stores/situation-store';
import { Rss, RefreshCw, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';

interface FeedItem {
  title: string;
  url: string;
  source: string;
  date: string;
  relevance?: number;
}

interface FeedStatus {
  name: string;
  description: string;
  endpoint: string;
  tier: 1 | 2 | 3 | 4;
  reliability: number;
  items: FeedItem[];
  loading: boolean;
  error: string;
  lastFetched: string | null;
}

/**
 * Source feeds organized by trustworthiness tier.
 * Reliability scores match the trustworthiness-engine.ts SOURCE_RELIABILITY values.
 *
 * Tier 1 (85-100): Official/institutional — UN agencies, verified datasets
 * Tier 2 (70-84):  Expert/analytical — think tanks, HRW, specialized research
 * Tier 3 (60-74):  Major media — wire services, established outlets
 * Tier 4 (50-64):  Aggregated data — GDELT, encyclopedic
 */
const INITIAL_FEEDS: Omit<FeedStatus, 'items' | 'loading' | 'error' | 'lastFetched'>[] = [
  // Tier 1: Official / Institutional
  { name: 'Google Search Grounding', description: 'Primary checkable live web research through Gemini grounding', endpoint: 'grounded_search', tier: 1, reliability: 88 },
  { name: 'UNHCR', description: 'Refugee and displacement statistics', endpoint: 'unhcr', tier: 1, reliability: 95 },
  { name: 'ReliefWeb', description: 'Humanitarian situation reports and updates', endpoint: 'reliefweb', tier: 1, reliability: 85 },
  { name: 'UN News', description: 'UN Security Council and SG statements', endpoint: 'unnews', tier: 1, reliability: 85 },
  { name: 'UCDP', description: 'Uppsala conflict database — organized violence data', endpoint: 'ucdp', tier: 1, reliability: 90 },
  { name: 'SIPRI', description: 'Arms transfers and military expenditure', endpoint: 'sipri', tier: 1, reliability: 88 },
  // Tier 2: Expert / Analytical
  { name: 'ICG CrisisWatch', description: 'International Crisis Group monthly assessments', endpoint: 'crisiswatch', tier: 2, reliability: 82 },
  { name: 'World Bank', description: 'Economic indicators and governance data', endpoint: 'worldbank', tier: 2, reliability: 90 },
  // Tier 3: Major Media
  // (no direct feeds yet — available via GDELT articles)
  // Tier 4: Aggregated
  { name: 'GDELT', description: 'Global events from 100+ languages in near-real-time', endpoint: 'gdelt', tier: 4, reliability: 55 },
];

export default function SourceMonitorPage() {
  const { showGuard } = useSituationGuard();
  const situation = useSituationStore((s) => s.activeSituation);

  const [feeds, setFeeds] = useState<FeedStatus[]>(
    INITIAL_FEEDS.map((f) => ({ ...f, items: [], loading: false, error: '', lastFetched: null }))
  );
  const [refreshingAll, setRefreshingAll] = useState(false);

  if (showGuard) return <NoSituationState />;

  async function fetchFeed(endpoint: string) {
    const country = situation?.region || situation?.name;
    if (!country) return;

    setFeeds((prev) =>
      prev.map((f) => (f.endpoint === endpoint ? { ...f, loading: true, error: '' } : f))
    );

    try {
      const res = await fetch('/api/data/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          query: situation!.name,
          limit: 20,
          forceGrounded: endpoint === 'grounded_search',
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Map response to generic FeedItem format
      const rawItems = (data.articles || data.events || data.updates || []) as Array<Record<string, unknown>>;
      const feedItems = endpoint === 'grounded_search'
        ? rawItems.filter((item) => item.source === 'grounded_search')
        : rawItems.filter((item) => String(item.source ?? '').toLowerCase() === endpoint.toLowerCase());
      const items: FeedItem[] = (feedItems.length > 0 ? feedItems : rawItems)
        .slice(0, 10)
        .map((item) => ({
          title: String(item.title || item.headline || item.name || 'Untitled'),
          url: String(item.url || item.link || '#'),
          source: String(item.source || endpoint).toUpperCase(),
          date: String(item.date || item.publishedAt || item.eventDate || ''),
          relevance: item.relevance ? parseFloat(String(item.relevance)) : undefined,
        }));

      setFeeds((prev) =>
        prev.map((f) =>
          f.endpoint === endpoint
            ? { ...f, items, loading: false, lastFetched: new Date().toISOString() }
            : f
        )
      );
    } catch (err) {
      setFeeds((prev) =>
        prev.map((f) =>
          f.endpoint === endpoint
            ? { ...f, loading: false, error: err instanceof Error ? err.message : 'Failed' }
            : f
        )
      );
    }
  }

  async function refreshAll() {
    setRefreshingAll(true);
    await Promise.allSettled(feeds.map((f) => fetchFeed(f.endpoint)));
    setRefreshingAll(false);
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900 flex items-center gap-2">
            <Rss className="h-6 w-6 text-diplomatic-blue" />
            Source Monitor
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            Primary grounded web research with GDELT, UCDP, ReliefWeb, UN News, and ICG as corroborating feeds.
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={refreshingAll}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-50 transition-colors"
        >
          {refreshingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh All
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {feeds.map((feed) => (
          <div key={feed.endpoint} className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-app-border)] bg-navy-50/50">
              <div>
                <p className="text-sm font-semibold text-navy-800">{feed.name}</p>
                <p className="text-[10px] text-navy-400">{feed.description}</p>
              </div>
              <button
                onClick={() => fetchFeed(feed.endpoint)}
                disabled={feed.loading}
                className="rounded-md p-1.5 text-navy-400 hover:text-diplomatic-blue hover:bg-diplomatic-blue/10 disabled:opacity-50 transition-colors"
              >
                {feed.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto max-h-64">
              {feed.error && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {feed.error}
                </div>
              )}
              {feed.items.length === 0 && !feed.loading && !feed.error && (
                <p className="text-xs text-navy-400 italic">Click refresh to load feed.</p>
              )}
              {feed.items.map((item, i) => (
                <div key={i} className="border-b border-navy-50 pb-2 last:border-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-navy-700 hover:text-diplomatic-blue line-clamp-2 flex gap-1"
                  >
                    {item.title}
                    <ExternalLink className="h-3 w-3 shrink-0 mt-0.5 text-navy-300" />
                  </a>
                  {item.date && <p className="text-[10px] text-navy-400 mt-0.5">{item.date}</p>}
                </div>
              ))}
            </div>

            {feed.lastFetched && (
              <div className="px-4 py-2 border-t border-[var(--color-app-border)] bg-navy-50/30">
                <p className="text-[10px] text-navy-400">
                  Updated {new Date(feed.lastFetched).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
