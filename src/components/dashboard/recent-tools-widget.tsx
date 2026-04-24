'use client';

import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { formatRelativeTime } from '@/lib/utils/format';
import { getToolById } from '@/lib/constants/tool-registry';
import { WidgetShell } from './widget-shell';

interface RecentToolItem {
  toolId: string;
  generatedAt: string | null;
  profileVersion: number | null;
  summary: string | null;
}

interface RecentToolsWidgetProps {
  situationId: string;
}

export function RecentToolsWidget({ situationId }: RecentToolsWidgetProps) {
  const [items, setItems] = useState<RecentToolItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setItems(null);

    fetch(`/api/situations/${encodeURIComponent(situationId)}/recent-tools?limit=5`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data: { items: RecentToolItem[] }) => {
        if (!cancelled) setItems(data.items ?? []);
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
      title="Recent tool runs"
      subtitle="Last 5 in this situation"
      loading={items == null && !error}
      error={error}
      onRetry={() => setReloadToken((t) => t + 1)}
      icon={<Layers className="h-4 w-4" />}
    >
      {items && items.length === 0 ? (
        <p className="text-xs text-slate-500">
          No tools run yet. Open any tool from the sidebar to generate analysis.
        </p>
      ) : items ? (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => {
            const def = getToolById(item.toolId);
            const name = def?.name ?? item.toolId;
            const href = def?.id ? `/${def.id}` : '/';
            return (
              <li key={`${item.toolId}-${item.generatedAt ?? ''}`}>
                <PraxisLink
                  href={href}
                  className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs hover:bg-slate-800/60"
                >
                  <span className="truncate text-slate-200">{name}</span>
                  <span className="shrink-0 text-[10px] text-slate-500">
                    {item.generatedAt ? formatRelativeTime(item.generatedAt) : '—'}
                  </span>
                </PraxisLink>
              </li>
            );
          })}
        </ul>
      ) : null}
    </WidgetShell>
  );
}
