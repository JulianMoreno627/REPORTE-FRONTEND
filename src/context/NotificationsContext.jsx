import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { notificationsApi } from '../api/endpoints.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [connected, setConnected] = useState(false);

  const refresh = useCallback(async (signal) => {
    const data = await notificationsApi.list({ signal });
    setItems(data.items);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      return undefined;
    }
    const controller = new AbortController();
    refresh(controller.signal).catch(() => {});

    const source = new EventSource(notificationsApi.streamUrl());
    source.addEventListener('ready', () => setConnected(true));
    source.addEventListener('notification', (event) => {
      const notification = JSON.parse(event.data);
      setItems((list) => [notification, ...list.filter((item) => item.id !== notification.id)]);
      toast.info(notification.message, { title: notification.title, duration: 8000 });
      if (document.visibilityState === 'hidden' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, { body: notification.message, icon: '/icons/icon.svg', tag: notification.id });
      }
    });
    source.onerror = () => setConnected(false);

    return () => {
      controller.abort();
      source.close();
      setConnected(false);
    };
  }, [isAuthenticated, refresh, toast]);

  const markRead = useCallback(async (id) => {
    setItems((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item)));
    await notificationsApi.markRead(id).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = items.filter((item) => !item.read);
    setItems((list) => list.map((item) => ({ ...item, read: true })));
    await Promise.allSettled(unread.map((item) => notificationsApi.markRead(item.id)));
  }, [items]);

  const value = useMemo(() => ({
    items,
    unread: items.filter((item) => !item.read).length,
    connected,
    refresh,
    markRead,
    markAllRead,
  }), [items, connected, refresh, markRead, markAllRead]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => useContext(NotificationsContext);
