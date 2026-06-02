'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, CheckCheck, AlertCircle, AlertTriangle, Info, CheckCircle, Settings, Users, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { type NotificationType } from '@/stores/notification-store';
import { useLiveNotifications, type LiveNotification } from '@/hooks/use-live-notifications';

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type NotificationDisplayConfig = {
  icon: React.ElementType;
  color: string;
  bg: string;
  label?: string;
};

const typeConfig: Record<NotificationType, NotificationDisplayConfig> = {
  alert: { icon: AlertCircle, color: 'text-crimson', bg: 'bg-crimson/8' },
  warning: { icon: AlertTriangle, color: 'text-gold-600', bg: 'bg-gold-500/8' },
  info: { icon: Info, color: 'text-diplomatic-blue', bg: 'bg-diplomatic-blue/8' },
  success: { icon: CheckCircle, color: 'text-teal', bg: 'bg-teal/8' },
};

const categoryConfig: Record<NonNullable<LiveNotification['category']>, NotificationDisplayConfig> = {
  operational: { icon: CheckCircle, color: 'text-teal', bg: 'bg-teal/8', label: 'Operational' },
  analytical: { icon: Info, color: 'text-diplomatic-blue', bg: 'bg-diplomatic-blue/8', label: 'Analytical' },
  administrative: { icon: AlertTriangle, color: 'text-gold-700', bg: 'bg-gold-500/10', label: 'Administrative' },
  collaborative: { icon: Users, color: 'text-diplomatic-blue', bg: 'bg-diplomatic-blue/8', label: 'Collaborative' },
  personal: { icon: UserRound, color: 'text-navy-600', bg: 'bg-navy-100', label: 'Personal' },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  // Switched 2026-04-26 round 5 (Brick #52) from useNotificationStore (demo
  // Zustand only) to useLiveNotifications which reads users/{uid}/notifications
  // from Firestore for authenticated users and keeps demo behaviour for the
  // demo cookie. Mark-read fires PATCH /api/notifications/[id] in the live path.
  const { notifications, unreadCount, markRead, markAllRead, dismiss, act } = useLiveNotifications();

  const handleClick = (id: string, href?: string) => {
    if (href) act(id);
    else markRead(id);
    if (href) {
      router.push(href);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-navy-400 transition-colors hover:bg-[var(--color-app-surface-alt)] hover:text-navy-600"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-crimson text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-96 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-app-border)] bg-white shadow-[var(--shadow-float)]">
            <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-navy-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-crimson/10 px-2 py-0.5 text-[10px] font-bold text-crimson">{unreadCount} new</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] text-navy-500 hover:text-navy-700 transition-colors">
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => { router.push('/app'); setOpen(false); }}
                  className="rounded-md p-1 text-navy-500 transition-colors hover:bg-[var(--color-app-surface-alt)] hover:text-navy-800"
                  aria-label="Notification settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-[var(--color-app-border-light)]">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-medium text-navy-800">You&apos;re caught up.</p>
                  <p className="mt-1 text-xs text-navy-500">Actionable case updates and review prompts will show up here.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const cfg = n.category ? categoryConfig[n.category] : typeConfig[n.type];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        'group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--color-app-surface-alt)]',
                        !n.read && 'bg-diplomatic-blue/3'
                      )}
                      onClick={() => handleClick(n.id, n.href)}
                    >
                      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5', cfg.bg)}>
                        <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-xs font-semibold leading-tight', n.read ? 'text-navy-700' : 'text-navy-900')}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-navy-400">{formatRelative(n.timestamp)}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                              className="opacity-0 group-hover:opacity-100 text-navy-300 hover:text-navy-500 transition-all"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {cfg.label && (
                            <span className={cn('text-[10px] font-semibold uppercase tracking-wide', cfg.color)}>{cfg.label}</span>
                          )}
                          {n.actionVerb && (
                            <span className="text-[10px] font-semibold text-navy-600">{n.actionVerb}</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-navy-500 leading-relaxed line-clamp-2">{n.body}</p>
                        {n.href && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleClick(n.id, n.href); }}
                            className="mt-2 rounded-md border border-[var(--color-app-border)] px-2 py-1 text-[11px] font-semibold text-navy-700 transition-colors hover:border-diplomatic-blue/40 hover:text-diplomatic-blue"
                          >
                            {n.actionVerb ?? 'Open'}
                          </button>
                        )}
                      </div>
                      {!n.read && (
                        <div className="h-2 w-2 shrink-0 rounded-full bg-diplomatic-blue mt-1.5" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
