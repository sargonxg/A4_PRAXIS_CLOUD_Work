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
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  seedWorkspaceNotifications: () => void;
  clearAll: () => void;
}

const WORKSPACE_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'alert',
    title: 'Context health needs review',
    body: 'The active workspace has new source gaps. Review Context health before running another memo agent.',
    href: '/early-warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 18),
    read: false,
  },
  {
    id: 'n2',
    type: 'warning',
    title: 'Memo review pending',
    body: 'A draft memo is ready for source and assumption review.',
    href: '/calendar',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
  },
  {
    id: 'n3',
    type: 'info',
    title: 'Source receipt added',
    body: 'A user-attached document was indexed and is available in Library.',
    href: '/sanctions',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: false,
  },
  {
    id: 'n4',
    type: 'success',
    title: 'Output saved',
    body: 'The latest user workspace output has been saved to Memo Studio.',
    href: '/reports',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
];

let counter = 0;

export const useNotificationStore = create<NotificationStore>((set) => ({
  // Start empty; authenticated workspace events add notifications as work happens.
  notifications: [],
  unreadCount: 0,

  addNotification: (n) =>
    set((state) => {
      const notification: Notification = {
        ...n,
        id: `notif-${Date.now()}-${counter++}`,
        timestamp: new Date(),
        read: false,
      };
      const updated = [notification, ...state.notifications];
      return { notifications: updated, unreadCount: updated.filter((x) => !x.read).length };
    }),

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

  seedWorkspaceNotifications: () =>
    set({
      notifications: WORKSPACE_NOTIFICATIONS,
      unreadCount: WORKSPACE_NOTIFICATIONS.filter((n) => !n.read).length,
    }),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
