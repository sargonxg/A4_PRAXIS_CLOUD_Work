'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle, Newspaper, FileText, Loader2, RefreshCw, ExternalLink, Clock,
  Sparkles, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Situation } from '@/types/situation';

type FeedSource = 'acled' | 'gdelt' | 'reliefweb' | 'unnews' | 'grounded_search';

interface IntelItem {
  id: string;
  source: FeedSource;
  type: string;
  title: string;
  description: string;
  date: string;
  url?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  actors: string[];
  location?: string;
}

interface SourcesCount {
  acled: number;
  gdelt: number;
  reliefweb: number;
  unnews?: number;
  grounded_search?: number;
}

const SOURCE_ICONS: Record<FeedSource, typeof AlertTriangle> = {
  acled: AlertTriangle,
  gdelt: Newspaper,
  reliefweb: FileText,
  unnews: FileText,
  grounded_search: Sparkles,
};
const SOURCE_LABELS: Record<FeedSource, string> = {
  acled: 'ACLED',
  gdelt: 'GDELT',
  reliefweb: 'ReliefWeb',
  unnews: 'UN News',
  grounded_search: 'AI Search',
};
const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  low: 'bg-navy-50 text-navy-600 border-navy-200',
};

export function IntelligenceFeed({ situation }: { situation: Situation }) {
  const [items, setItems] = useState<IntelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [groundedLoading, setGroundedLoading] = useState(false);
  const [sources, setSources] = useState<SourcesCount>({
    acled: 0, gdelt: 0, reliefweb: 0, unnews: 0, grounded_search: 0,
  });
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | FeedSource>('all');

  const fetchIntel = async (opts?: { forceGrounded?: boolean }) => {
    const isGrounded = !!opts?.forceGrounded;
    if (isGrounded) setGroundedLoading(true);
    else setLoading(true);
    try {
      const res = await fetch('/api/data/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: situation.region || situation.name,
          query: situation.name,
          limit: 30,
          forceGrounded: isGrounded,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (isGrounded) {
          // Merge grounded results in, keep any existing structured items
          const incoming: IntelItem[] = data.events || [];
          setItems((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const merged = [...incoming.filter((i) => !existingIds.has(i.id)), ...prev];
            return merged;
          });
          setSources((prev) => ({
            ...prev,
            grounded_search: (prev.grounded_search ?? 0) + (data.sources?.grounded_search ?? incoming.length),
          }));
          setFallbackUsed(true);
        } else {
          setItems(data.events || []);
          setSources(
            data.sources || { acled: 0, gdelt: 0, reliefweb: 0, unnews: 0, grounded_search: 0 },
          );
          setFallbackUsed(Boolean(data.fallbackUsed));
        }
        setFetchedAt(data.fetchedAt);
      }
    } catch {
      // Silent fail
    } finally {
      if (isGrounded) setGroundedLoading(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [situation.id]);

  const filtered = filter === 'all' ? items : items.filter((i) => i.source === filter);
  const totalItems =
    sources.acled + sources.gdelt + sources.reliefweb +
    (sources.unnews ?? 0) + (sources.grounded_search ?? 0);
  const activeSourceCount = Object.entries(sources).filter(([, v]) => (v ?? 0) > 0).length;
  const allZero = totalItems === 0 && !loading && !groundedLoading;

  const filterChips: Array<'all' | FeedSource> = ['all', 'acled', 'gdelt', 'reliefweb'];
  if ((sources.unnews ?? 0) > 0) filterChips.push('unnews');
  if ((sources.grounded_search ?? 0) > 0) filterChips.push('grounded_search');

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-3">
        <div className="flex items-center gap-3">
          <Newspaper className="h-4 w-4 text-diplomatic-blue" />
          <div>
            <h3 className="text-sm font-semibold text-navy-900">Live Intelligence Feed</h3>
            <p className="text-[10px] text-navy-500">
              {totalItems} items from {activeSourceCount} sources
              {fetchedAt && <> &middot; <Clock className="inline h-3 w-3" /> {new Date(fetchedAt).toLocaleTimeString()}</>}
              {fallbackUsed && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gold-500/10 px-1.5 py-0.5 text-[9px] font-medium text-gold-700">
                  <Sparkles className="h-2.5 w-2.5" /> via AI Search
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchIntel({ forceGrounded: true })}
            disabled={groundedLoading}
            title="Run a Google-Search-grounded Gemini query now"
            className="flex items-center gap-1.5 rounded-lg border border-gold-500/30 bg-gold-500/5 px-2.5 py-1 text-[11px] font-medium text-gold-700 hover:bg-gold-500/10 disabled:opacity-50"
          >
            {groundedLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
            Use AI Search
          </button>
          <button onClick={() => fetchIntel()} disabled={loading} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-600 disabled:opacity-50">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--color-app-border)] px-5 py-2">
        {filterChips.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
              filter === f ? 'bg-diplomatic-blue text-white' : 'text-navy-500 hover:bg-navy-50'
            )}
          >
            {f === 'all'
              ? `All (${items.length})`
              : `${SOURCE_LABELS[f]} (${sources[f as keyof SourcesCount] ?? 0})`}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="max-h-96 overflow-y-auto">
        {loading && items.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-diplomatic-blue" />
            <span className="ml-3 text-sm text-navy-500">Fetching live intelligence...</span>
          </div>
        )}

        {allZero && (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-navy-50">
              <Newspaper className="h-5 w-5 text-navy-400" />
            </div>
            <p className="text-sm font-medium text-navy-700">No feeds configured</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-navy-500">
              Structured feeds returned 0 items. Set <code className="rounded bg-navy-100 px-1 text-[10px]">ACLED_API_KEY</code> in Cloud Run env vars for event data, or click
              {' '}<strong className="text-gold-700">Use AI Search</strong>{' '}
              above to pull recent intelligence via Gemini + Google Search.
            </p>
            <button
              onClick={() => fetchIntel({ forceGrounded: true })}
              disabled={groundedLoading}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold-600 disabled:opacity-50"
            >
              {groundedLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Run AI Search now
            </button>
          </div>
        )}

        {!loading && !allZero && filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-navy-400">
            No items in this filter. Try &ldquo;All&rdquo; or click Refresh.
          </div>
        )}

        {filtered.map((item) => {
          const Icon = SOURCE_ICONS[item.source] ?? Newspaper;
          const label = SOURCE_LABELS[item.source] ?? item.source;
          const isGrounded = item.source === 'grounded_search';
          return (
            <div key={item.id} className="flex items-start gap-3 border-b border-navy-100 px-5 py-3 last:border-0 hover:bg-navy-50/50 transition-colors">
              <div className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded', SEVERITY_COLORS[item.severity])}>
                <Icon className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-navy-900 leading-tight">{item.title}</p>
                  <span className="shrink-0 text-[9px] text-navy-400">{new Date(item.date).toLocaleDateString()}</span>
                </div>
                {item.description && (
                  <p className="mt-0.5 text-[11px] text-navy-500 line-clamp-2">{item.description}</p>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[9px] font-medium text-navy-400">{label}</span>
                  {isGrounded && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-500/10 px-1.5 py-0.5 text-[9px] font-medium text-gold-700">
                      <Sparkles className="h-2 w-2" /> via Google Search
                    </span>
                  )}
                  {item.location && <span className="text-[9px] text-navy-400">{item.location}</span>}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-diplomatic-blue hover:underline flex items-center gap-0.5">
                      Source <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
