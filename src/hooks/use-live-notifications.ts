'use client';

/**
 * Bridge hook — Brick #52 round 5.
 *
 * Returns a unified shape the `<NotificationBell />` consumes regardless
 * of whether the user is in demo mode (reads the existing
 * `notification-store` Zustand state) or authenticated (reads
 * `users/{uid}/notifications` via `useNotifications` from
 * `use-activity-feed`).
 *
 * Live notifications populated by the operational spine — every
 * `withCalibration` 5xx publishes a notification (see
 * `src/lib/api/with-calibration.ts`). Demo mode keeps the existing
 * seeded fixture for marketing screenshots.
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useNotificationStore, type Notification as DemoNotification, type NotificationType } from '@/stores/notification-store';
import { useNotifications, type NotificationRow } from './use-activity-feed';

export interface LiveNotification {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  type: NotificationType;
  category?: 'operational' | 'analytical' | 'administrative' | 'collaborative' | 'personal';
  actionVerb?: string;
  read: boolean;
  href?: string;
}

interface BackendNotification {
  id?: string;
  notificationId: string;
  title: string;
  body: string;
  createdAt: string;
  type: string;
  category?: LiveNotification['category'];
  state?: string;
  read?: boolean;
  actionUrl?: string | null;
  actionVerb?: string;
}

function fromDemo(n: DemoNotification): LiveNotification {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    timestamp: n.timestamp,
    type: n.type,
    read: n.read,
    href: n.href,
  };
}

function semaphoreToType(semaphore: NotificationRow['semaphore']): NotificationType {
  if (semaphore === 'red') return 'alert';
  if (semaphore === 'yellow') return 'warning';
  if (semaphore === 'green') return 'success';
  return 'info';
}

function fromFirestore(n: NotificationRow): LiveNotification {
  const ts = n.createdAt?.toDate?.() ?? new Date();
  return {
    id: n.notificationId,
    title: n.title,
    body: n.body ?? '',
    timestamp: ts,
    type: semaphoreToType(n.semaphore),
    read: n.read === true,
    href: n.actionUrl ?? undefined,
  };
}

function categoryToType(category?: BackendNotification['category']): NotificationType {
  if (category === 'administrative') return 'warning';
  if (category === 'operational') return 'success';
  if (category === 'collaborative') return 'info';
  if (category === 'personal') return 'info';
  return 'info';
}

function fromBackend(n: BackendNotification): LiveNotification {
  return {
    id: n.notificationId || n.id || '',
    title: n.title,
    body: n.body ?? '',
    timestamp: n.createdAt ? new Date(n.createdAt) : new Date(),
    type: categoryToType(n.category),
    category: n.category,
    actionVerb: n.actionVerb,
    read: n.read === true || n.state === 'read' || n.state === 'acted',
    href: n.actionUrl ?? undefined,
  };
}

export interface LiveNotificationsResult {
  notifications: LiveNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  /** Whether the current source is the live Firestore feed. */
  live: boolean;
  act: (id: string) => void;
}

export function useLiveNotifications(): LiveNotificationsResult {
  const { user } = useAuth();
  const isDemo = user?.isDemo ?? false;
  const uid = user?.id ?? null;

  // Always subscribe to demo store (cheap), and to Firestore feed when not demo.
  const demoNotifications = useNotificationStore((s) => s.notifications);
  const demoUnread = useNotificationStore((s) => s.unreadCount);
  const demoMarkRead = useNotificationStore((s) => s.markRead);
  const demoMarkAllRead = useNotificationStore((s) => s.markAllRead);
  const demoDismiss = useNotificationStore((s) => s.dismiss);
  const liveRows = useNotifications(isDemo ? null : uid, undefined, 50);
  const [backendRows, setBackendRows] = useState<BackendNotification[]>([]);

  useEffect(() => {
    if (!uid || isDemo) {
      return;
    }
    let closed = false;
    const es = new EventSource('/api/backend/notifications/stream');
    es.addEventListener('snapshot', (event) => {
      if (closed) return;
      try {
        const parsed = JSON.parse((event as MessageEvent).data) as { notifications?: BackendNotification[] };
        setBackendRows(parsed.notifications ?? []);
      } catch {
        setBackendRows([]);
      }
    });
    es.onerror = () => {
      es.close();
      if (!closed) {
        void fetch('/api/backend/notifications')
          .then((res) => res.ok ? res.json() : { notifications: [] })
          .then((data: { notifications?: BackendNotification[] }) => {
            if (!closed) setBackendRows(data.notifications ?? []);
          })
          .catch(() => {
            if (!closed) setBackendRows([]);
          });
      }
    };
    return () => {
      closed = true;
      es.close();
    };
  }, [uid, isDemo]);

  const postSignal = (id: string, signal: 'read' | 'acted' | 'dismissed') => {
    void fetch(`/api/backend/notifications/${encodeURIComponent(id)}/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signal }),
    }).catch(() => {});
  };

  const result = useMemo<LiveNotificationsResult>(() => {
    if (isDemo) {
      return {
        notifications: demoNotifications.map(fromDemo),
        unreadCount: demoUnread,
        markRead: demoMarkRead,
        markAllRead: demoMarkAllRead,
        dismiss: demoDismiss,
        act: demoMarkRead,
        live: false,
      };
    }
    const live = backendRows.length > 0 ? backendRows.map(fromBackend) : liveRows.map(fromFirestore);
    const unread = live.filter((n) => !n.read).length;
    return {
      notifications: live,
      unreadCount: unread,
      // Mark-read is wired to the existing PATCH /api/notifications/[id]
      // endpoint via fire-and-forget. Demo store still receives the
      // markRead call as a no-op in case the same id appears in seeded
      // demo state (it won't, but keeps the contract identical).
      markRead: (id: string) => {
        demoMarkRead(id);
        postSignal(id, 'read');
        void fetch(`/api/notifications/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true }),
        }).catch(() => {});
      },
      markAllRead: () => {
        demoMarkAllRead();
        // Mark all unread server-side. Loop is intentional — no batch
        // endpoint today; future BIG #28 may add one.
        for (const n of live.filter((x) => !x.read)) {
          void fetch(`/api/notifications/${encodeURIComponent(n.id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true }),
          }).catch(() => {});
        }
      },
      dismiss: (id: string) => {
        demoDismiss(id);
        postSignal(id, 'dismissed');
        void fetch(`/api/notifications/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true }),
        }).catch(() => {});
      },
      act: (id: string) => {
        demoMarkRead(id);
        postSignal(id, 'acted');
      },
      live: true,
    };
  }, [isDemo, demoNotifications, demoUnread, demoMarkRead, demoMarkAllRead, demoDismiss, backendRows, liveRows]);

  return result;
}
