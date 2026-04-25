'use client';

import { useMemo } from 'react';
import {
  useToolRuns,
  useBackgroundJobs,
  useNotifications,
  type ToolRunRow,
  type BackgroundJobRow,
  type NotificationRow,
} from '@/hooks/use-activity-feed';
import { SemaphoreChip } from './semaphore-chip';
import { cn } from '@/lib/utils/cn';

interface ActivityFeedProps {
  uid: string | null;
  situationId?: string;
  className?: string;
  emptyHint?: string;
}

type FeedItem =
  | { kind: 'tool'; row: ToolRunRow; ts: number }
  | { kind: 'job';  row: BackgroundJobRow; ts: number }
  | { kind: 'notification'; row: NotificationRow; ts: number };

function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ms).toLocaleDateString();
}

export function ActivityFeed({ uid, situationId, className, emptyHint }: ActivityFeedProps) {
  const toolRuns = useToolRuns(uid, situationId, 30);
  const jobs = useBackgroundJobs(uid, situationId, 30);
  const notifications = useNotifications(uid, situationId, 30);

  const items = useMemo<FeedItem[]>(() => {
    const merged: FeedItem[] = [];
    for (const r of toolRuns) merged.push({ kind: 'tool', row: r, ts: r.startedAt?.toMillis?.() ?? 0 });
    for (const j of jobs) merged.push({ kind: 'job', row: j, ts: j.updatedAt?.toMillis?.() ?? 0 });
    for (const n of notifications) merged.push({ kind: 'notification', row: n, ts: n.createdAt?.toMillis?.() ?? 0 });
    return merged.sort((a, b) => b.ts - a.ts).slice(0, 50);
  }, [toolRuns, jobs, notifications]);

  if (!uid) return null;
  if (items.length === 0) {
    return (
      <div className={cn('rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400', className)}>
        {emptyHint ?? 'No activity yet. Tools, ingestions, and analyses will appear here as they run.'}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {items.map((it) => (
        <FeedRow key={`${it.kind}:${rowId(it)}`} item={it} />
      ))}
    </div>
  );
}

function rowId(it: FeedItem): string {
  if (it.kind === 'tool') return it.row.toolRunId;
  if (it.kind === 'job') return it.row.jobId;
  return it.row.notificationId;
}

function FeedRow({ item }: { item: FeedItem }) {
  if (item.kind === 'tool') return <ToolRunRowView row={item.row} />;
  if (item.kind === 'job') return <JobRowView row={item.row} />;
  return <NotificationRowView row={item.row} />;
}

function ToolRunRowView({ row }: { row: ToolRunRow }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950/30 p-3">
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <SemaphoreChip state={row.semaphore} />
          <span className="truncate text-sm font-medium text-zinc-100">{row.toolId}</span>
          <span className="text-xs text-zinc-500">{row.variant}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
          <span>{formatRelative(row.startedAt?.toMillis?.() ?? 0)}</span>
          {row.durationMs ? <span>· {Math.round(row.durationMs / 100) / 10}s</span> : null}
          {row.error ? <span className="text-rose-400">· {row.error.code}</span> : null}
        </div>
      </div>
    </div>
  );
}

function JobRowView({ row }: { row: BackgroundJobRow }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950/30 p-3">
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <SemaphoreChip state={row.semaphore} />
          <span className="truncate text-sm font-medium text-zinc-100">{row.kind}</span>
          {row.attempt > 1 ? (
            <span className="text-xs text-amber-400">attempt {row.attempt}/{row.maxAttempts}</span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
          <span>{formatRelative(row.updatedAt?.toMillis?.() ?? 0)}</span>
          {row.progress ? <span>· {row.progress.message} ({row.progress.percent}%)</span> : null}
          {row.error ? <span className="text-rose-400">· {row.error.message}</span> : null}
        </div>
      </div>
    </div>
  );
}

function NotificationRowView({ row }: { row: NotificationRow }) {
  const Body = row.actionUrl ? 'a' : 'div';
  return (
    <Body
      {...(row.actionUrl ? { href: row.actionUrl } : {})}
      className={cn(
        'block rounded-md border p-3 transition',
        row.read
          ? 'border-zinc-800 bg-zinc-950/30'
          : 'border-zinc-700 bg-zinc-900',
        row.actionUrl && 'hover:border-emerald-700 hover:bg-zinc-800/50 cursor-pointer',
      )}
    >
      <div className="flex items-center gap-2">
        <SemaphoreChip state={row.semaphore} />
        <span className="text-sm font-semibold text-zinc-100">{row.title}</span>
      </div>
      <p className="mt-1 text-xs text-zinc-400">{row.body}</p>
      <div className="mt-1 text-[11px] text-zinc-500">
        {formatRelative(row.createdAt?.toMillis?.() ?? 0)}
      </div>
    </Body>
  );
}
