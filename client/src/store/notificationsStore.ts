import { create } from 'zustand';
type NotifState = { notifications: any[]; addNotification: (n: any) => void; dismissNotification: (id: any) => void; markAllRead: () => void; unreadCount: () => number }
export const useNotificationsStore = create<NotifState>()((set, get) => ({
  notifications: [],
  addNotification: (notification) => set((state) => ({ notifications: [{ id: Date.now(), read: false, createdAt: new Date().toISOString(), ...notification }, ...state.notifications] })),
  dismissNotification: (id) => set((state) => ({ notifications: state.notifications.filter((n: any) => n.id !== id) })),
  markAllRead: () => set((state) => ({ notifications: state.notifications.map((n: any) => ({ ...n, read: true })) })),
  unreadCount: () => get().notifications.filter((n: any) => !n.read).length,
}));
