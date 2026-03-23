'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Newspaper, FileText, Loader2, RefreshCw, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Situation } from '@/types/situation';

interface IntelItem {
  id: string;
  source: 'acled' | 'gdelt' | 'reliefweb';
  type: string;
  title: string;
  description: string;
  date: string;
  url?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  actors: string[];
  location?: string;
}

const SOURCE_ICONS = { acled: AlertTriangle, gdelt: Newspaper, reliefweb: FileText };
const SOURCE_LABELS = { acled: 'ACLED', gdelt: 'GDELT', reliefweb: 'ReliefWeb' };
const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  low: 'bg-navy-50 text-navy-600 border-navy-200',
};

export function IntelligenceFeed({ situation }: { situation: Situation }) {
  const [items, setItems] = useState<IntelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState({ acled: 0, gdelt: 0, reliefweb: 0 });
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'acled' | 'gdelt' | 'reliefweb'>('all');

  const fetchIntel = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: situation.region || situation.name,
          query: situation.name,
          limit: 30,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.events || []);
        setSources(data.sources || { acled: 0, gdelt: 0, reliefweb: 0 });
        setFetchedAt(data.fetchedAt);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [situation.id]);

  const filtered = filter === 'all' ? items : items.filter((i) => i.source === filter);

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-3">
        <div className="flex items-center gap-3">
          <Newspaper className="h-4 w-4 text-diplomatic-blue" />
          <div>
            <h3 className="text-sm font-semibold text-navy-900">Live Intelligence Feed</h3>
            <p className="text-[10px] text-navy-500">
              {sources.acled + sources.gdelt + sources.reliefweb} items from {Object.values(sources).filter(Boolean).length} sources
              {fetchedAt && <> &middot; <Clock className="inline h-3 w-3" /> {new Date(fetchedAt).toLocaleTimeString()}</>}
            </p>
          </div>
        </div>
        <button onClick={fetchIntel} disabled={loading} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-600 disabled:opacity-50">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 border-b border-[var(--color-app-border)] px-5 py-2">
        {(['all', 'acled', 'gdelt', 'reliefweb'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
              filter === f ? 'bg-diplomatic-blue text-white' : 'text-navy-500 hover:bg-navy-50'
            )}
          >
            {f === 'all' ? `All (${items.length})` : `${SOURCE_LABELS[f]} (${sources[f]})`}
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

        {!loading && filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-navy-400">
            No intelligence data available. GDELT and ReliefWeb are free — try refreshing.
          </div>
        )}

        {filtered.map((item) => {
          const Icon = SOURCE_ICONS[item.source];
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
                  <span className="text-[9px] font-medium text-navy-400">{SOURCE_LABELS[item.source]}</span>
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
