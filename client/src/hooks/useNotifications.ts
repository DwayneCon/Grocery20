import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '../utils/apiClient';
import { useSocketContext } from '../contexts/SocketContext';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | 'meal_reminder'
  | 'deal_alert'
  | 'expiration_warning'
  | 'achievement_unlocked'
  | 'household_update'
  | 'general';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a URL-safe base64 VAPID key to a Uint8Array for the Push API.
 */
const urlBase64ToUint8Array = (base64String: string): BufferSource => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Polling interval for fetching notifications (30 seconds)
const POLL_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useNotifications = () => {
  const { on } = useSocketContext();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track whether the component is still mounted to avoid state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --------------------------------------------------
  // Fetch all notifications from the server
  // --------------------------------------------------
  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get('/notifications');
      if (!mountedRef.current) return;
      if (Array.isArray(response.data?.notifications)) {
        setNotifications(response.data.notifications);
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      logger.error('Failed to fetch notifications', err as Error);
      setError('Failed to fetch notifications');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Periodic polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // --------------------------------------------------
  // Real-time updates via Socket.IO
  // --------------------------------------------------
  useEffect(() => {
    const unsub = on('notification:new', (notification: unknown) => {
      const n = notification as NotificationItem | undefined;
      if (!n?.id) return;
      setNotifications((prev) => {
        // Avoid duplicates
        if (prev.some((existing) => existing.id === n.id)) return prev;
        return [n, ...prev];
      });
    });
    return () => unsub();
  }, [on]);

  // --------------------------------------------------
  // Push subscription registration
  // --------------------------------------------------
  const registerPushSubscription = useCallback(async (requestPermission: boolean) => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return;
      }

      // Request permission if needed
      if (requestPermission && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
      }

      if (Notification.permission !== 'granted') {
        return;
      }

      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
      if (!vapidKey) {
        logger.warn('VITE_VAPID_PUBLIC_KEY not configured, push subscription skipped');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }));

      await apiClient.post('/notifications/subscribe', { subscription });
    } catch (err: unknown) {
      logger.error('Failed to register push subscription', err as Error);
    }
  }, []);

  // Auto-register if permission is already granted
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      registerPushSubscription(false);
    }
  }, [registerPushSubscription]);

  // --------------------------------------------------
  // CRUD operations
  // --------------------------------------------------

  const markRead = useCallback(async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      await apiClient.put(`/notifications/${id}/read`);
    } catch (err: unknown) {
      logger.error('Failed to mark notification read', err as Error);
      // Revert optimistic update
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      await apiClient.put('/notifications/mark-all-read');
    } catch (err: unknown) {
      logger.error('Failed to mark all notifications read', err as Error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const dismiss = useCallback(async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      await apiClient.delete(`/notifications/${id}`);
    } catch (err: unknown) {
      logger.error('Failed to dismiss notification', err as Error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // --------------------------------------------------
  // Derived state
  // --------------------------------------------------

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markRead,
    markAllRead,
    dismiss,
    requestPushPermission: () => registerPushSubscription(true),
  };
};
