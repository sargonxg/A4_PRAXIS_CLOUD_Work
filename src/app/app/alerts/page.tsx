'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useNotificationStore } from '@/stores/notification-store';
import { Bell, BellOff, Check, Trash2, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const TYPE_CONFIG = {
  alert: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  success: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

export default function AlertsPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  if (!isDemo && (showGuard || !situation)) return <NoSituationState />;

  const { notifications, markRead, markAllRead, dismiss } = useNotificationStore();

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-semibold text-navy-900">
            <Bell className="h-6 w-6 text-diplomatic-blue" />
            Alert Center
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            {notifications.length} total alerts &middot; {unread.length} unread
          </p>
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">
            <Check className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <BellOff className="h-12 w-12 text-navy-200" />
          <h2 className="mt-4 text-base font-semibold text-navy-900">No alerts yet</h2>
          <p className="mt-2 max-w-sm text-center text-sm text-navy-500">
            Alerts will appear here when PRAXIS detects escalation spikes, media surges, or humanitarian threshold breaches for your active situation.
          </p>
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
                    <p className="text-sm font-medium text-navy-900">{n.title}</p>
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
                    <p className="text-xs font-medium text-navy-700 truncate">{n.title}</p>
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
