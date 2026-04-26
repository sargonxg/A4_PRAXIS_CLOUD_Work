'use client';

import { useEffect, useState } from 'react';
import { Bell, ExternalLink, MessageSquare } from 'lucide-react';
import { WidgetShell } from './widget-shell';
import { formatRelativeTime } from '@/lib/utils/format';
import { PraxisLink } from '@/components/shared/praxis-link';

interface FeedAlertItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string | null;
  url?: string | null;
  salience?: number;
}

interface FeedAlertsWidgetProps {
  situationId: string;
  /** Accepted for API compatibility with earlier dashboard wiring; no longer read here. */
  region?: string;
}

export function FeedAlertsWidget({ situationId }: FeedAlertsWidgetProps) {
  const [items, setItems] = useState<FeedAlertItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setItems(null);

    const params = new URLSearchParams({
      window: '24h',
      limit: '3',
    });

    fetch(`/api/situations/${encodeURIComponent(situationId)}/feed-alerts?${params.toString()}`)
      .then((res) => {
        if (res.status === 404) {
          if (!cancelled) setItems([]);
          return null;
        }
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data: { items?: FeedAlertItem[] } | null) => {
        if (cancelled || !data) return;
        const alerts = (data.items ?? []).slice(0, 3);
        setItems(alerts);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [situationId, reloadToken]);

  return (
    <WidgetShell
      title="Feed alerts"
      subtitle="Last 24 hours"
      href="/alerts"
      loading={items == null && !error}
      error={error}
      onRetry={() => setReloadToken((t) => t + 1)}
      icon={<Bell className="h-4 w-4" />}
    >
      {items && items.length === 0 ? (
        <p className="text-xs text-slate-500">
          No high-salience events ingested for this window.
        </p>
      ) : items ? (
        <ul className="flex flex-col gap-1.5">
          {items.map((it) => (
            <li key={it.id} className="flex flex-col gap-0.5 rounded px-1.5 py-1 hover:bg-slate-800/60">
              <span className="truncate text-xs text-slate-200">{it.title}</span>
              <span className="text-[10px] text-slate-500">
                {it.source}{it.publishedAt ? ` · ${formatRelativeTime(it.publishedAt)}` : ''}
              </span>
              <span className="mt-1 flex flex-wrap gap-2 text-[10px]">
                {it.url ? (
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-100"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open source
                  </a>
                ) : null}
                <PraxisLink
                  href={`/assistant?prompt=${encodeURIComponent(`Assess this feed alert for the active situation: ${it.title} (${it.source}).`)}`}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-100"
                >
                  <MessageSquare className="h-3 w-3" />
                  Ask PRAXIS
                </PraxisLink>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </WidgetShell>
  );
}
