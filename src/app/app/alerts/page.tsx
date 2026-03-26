'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useNotificationStore } from '@/stores/notification-store';
import { useSituationStore } from '@/stores/situation-store';
import { useState, useCallback } from 'react';
import { Bell, BellOff, Check, Trash2, AlertTriangle, Info, CheckCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';

const TYPE_CONFIG = {
  alert: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  success: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
};

const SEVERITY_LABEL: Record<string, string> = {
  alert: 'Critical',
  warning: 'High',
  info: 'Medium',
  success: 'Low',
};

export default function AlertsPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  if (!isDemo && (showGuard || !situation)) return <NoSituationState />;

  const { notifications, markRead, markAllRead, dismiss, addNotification } = useNotificationStore();
  const { activeSituation } = useSituationStore();

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  // "Check for Updates" — calls AI to scan for latest developments
  const [isChecking, setIsChecking] = useState(false);
  const [updateResult, setUpdateResult] = useState('');

  const checkForUpdates = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);
    setUpdateResult('');

    const situationName = activeSituation?.name || situation?.name || 'the current situation';
    const prompt = `You are monitoring a conflict situation called "${situationName}". Check: what are the latest developments, escalation signals, or significant events for this situation? If there are new developments, summarize them as brief alert items. If nothing significant, say so. Be concise and factual. Format as a brief intelligence update.`;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { accumulated += parsed; setUpdateResult(accumulated); }
        }
      }
    } catch {
      setUpdateResult('Unable to check for updates at this time. Please try again later.');
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, activeSituation?.name, situation?.name]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-semibold text-navy-900">
            <Bell className="h-6 w-6 text-diplomatic-blue" />
            Alert Center
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            {situation?.name ? (
              <>{notifications.length} alerts for <span className="font-medium text-navy-700">{situation.name}</span> &middot; {unread.length} unread</>
            ) : (
              <>{notifications.length} total alerts &middot; {unread.length} unread</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={checkForUpdates}
            disabled={isChecking}
            className="flex items-center gap-1.5 rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-3 py-1.5 text-xs font-medium text-diplomatic-blue hover:bg-diplomatic-blue/10 disabled:opacity-50 transition-colors"
          >
            {isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Check for Updates
          </button>
          {unread.length > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">
              <Check className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* AI Update Result */}
      {(updateResult || isChecking) && (
        <div className="rounded-xl border border-diplomatic-blue/15 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className={cn('h-4 w-4 text-diplomatic-blue', isChecking && 'animate-spin')} />
            <p className="text-sm font-semibold text-navy-900">Latest Developments</p>
          </div>
          {updateResult ? (
            <div className="prose prose-sm max-w-none text-navy-700">
              <MarkdownRenderer content={updateResult} />
              {isChecking && <span className="inline-block h-4 w-0.5 animate-pulse bg-diplomatic-blue ml-0.5" />}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4 text-sm text-navy-400">
              <Loader2 className="h-4 w-4 animate-spin text-diplomatic-blue" />
              Scanning for updates on {situation?.name || 'current situation'}...
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {notifications.length === 0 && !updateResult && !isChecking && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-app-border)] bg-white py-20 px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50">
            <BellOff className="h-8 w-8 text-navy-300" />
          </div>
          <h2 className="mt-5 text-base font-semibold text-navy-900">No alerts yet</h2>
          <p className="mt-2 max-w-md text-center text-sm text-navy-500">
            Alerts appear when PRAXIS detects escalation spikes, media surges, or humanitarian threshold breaches for your active situation.
          </p>
          <div className="mt-6 rounded-lg border border-[var(--color-app-border-light)] bg-[var(--color-app-surface-alt)] px-5 py-4 max-w-md">
            <p className="text-xs font-semibold text-navy-700 mb-2">How alerts work</p>
            <ul className="space-y-1.5 text-[11px] text-navy-500">
              <li className="flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-navy-400" />
                <span>The automated GDELT scan runs daily at <span className="font-mono font-medium text-navy-700">06:00 UTC</span>, checking global event data for your situations.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-navy-400" />
                <span>Escalation spikes, media surges, and humanitarian threshold breaches generate alerts automatically.</span>
              </li>
              <li className="flex items-start gap-2">
                <RefreshCw className="h-3.5 w-3.5 mt-0.5 shrink-0 text-navy-400" />
                <span>Use &ldquo;Check for Updates&rdquo; above to manually scan for the latest developments at any time.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Unread */}
      {unread.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">Unread</h2>
          <div className="space-y-2">
            {unread.map((n) => {
              const config = TYPE_CONFIG[n.type];
              const Icon = config.icon;
              return (
                <div key={n.id} className={cn('flex items-start gap-3 rounded-xl border p-4 bg-white', config.border)}>
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-navy-900">{n.title}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-semibold', config.badge)}>
                        {SEVERITY_LABEL[n.type]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-navy-600">{n.body}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-navy-400">
                        <Clock className="h-3 w-3" />
                        {n.timestamp.toLocaleString()}
                      </span>
                      <button onClick={() => markRead(n.id)} className="text-[10px] text-diplomatic-blue hover:underline">Mark read</button>
                      <button onClick={() => dismiss(n.id)} className="text-[10px] text-red-500 hover:underline">Dismiss</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Read */}
      {read.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">Previous</h2>
          <div className="space-y-1.5">
            {read.map((n) => {
              const config = TYPE_CONFIG[n.type];
              const Icon = config.icon;
              return (
                <div key={n.id} className="flex items-center gap-3 rounded-lg border border-navy-100 bg-white px-4 py-3 opacity-60">
                  <Icon className={cn('h-4 w-4 shrink-0', config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-navy-700 truncate">{n.title}</p>
                      <span className={cn('rounded-full px-1.5 py-0.5 text-[8px] font-medium', config.badge)}>
                        {SEVERITY_LABEL[n.type]}
                      </span>
                    </div>
                    <p className="text-[10px] text-navy-400">{n.timestamp.toLocaleString()}</p>
                  </div>
                  <button onClick={() => dismiss(n.id)} className="text-navy-300 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
