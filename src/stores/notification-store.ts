import { create } from 'zustand';

export type NotificationType = 'alert' | 'warning' | 'info' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'alert',
    title: 'Ceasefire Violation Detected',
    body: 'UNMN reports artillery fire in Nordalia Eastern Province. Risk score elevated to HIGH.',
    href: '/early-warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 18),
    read: false,
  },
  {
    id: 'n2',
    type: 'warning',
    title: 'UNSC Mandate Renewal — 12 Days',
    body: 'UNMN mandate expires March 17. Draft renewal resolution circulating. Position paper needed.',
    href: '/calendar',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
  },
  {
    id: 'n3',
    type: 'info',
    title: 'New UNSC Resolution Adopted',
    body: 'S/RES/2731 adopted: Humanitarian access provisions for eastern Nordalia. 14-0-1.',
    href: '/sanctions',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: false,
  },
  {
    id: 'n4',
    type: 'warning',
    title: 'Open Debate Tomorrow — 10:00',
    body: 'UNSC Open Debate: Protection of Civilians. Prepare talking points and delegation list.',
    href: '/calendar',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    read: false,
  },
  {
    id: 'n5',
    type: 'success',
    title: 'Report Published',
    body: 'Q1 Nordalia Situation Report has been finalized and shared with team.',
    href: '/reports',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
  {
    id: 'n6',
    type: 'alert',
    title: 'Risk Score Increase: Sahel',
    body: 'ACLED data shows 40% increase in violent incidents in Burkina Faso. Early warning threshold breached.',
    href: '/early-warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36),
    read: true,
  },
];

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: SEED_NOTIFICATIONS,
  unreadCount: SEED_NOTIFICATIONS.filter((n) => !n.read).length,
  markRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
    }),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  dismiss: (id) =>
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
    }),
}));
