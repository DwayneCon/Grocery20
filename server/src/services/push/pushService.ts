import * as webpush from 'web-push';
import type { PushSubscription, WebPushError } from 'web-push';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';
import pool from '../../config/database.js';
import type { RowDataPacket } from 'mysql2';

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

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface PushSubscriptionRow extends RowDataPacket {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

interface NotificationRow extends RowDataPacket {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: number;
  action_url: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// VAPID Configuration
// ---------------------------------------------------------------------------

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:noreply@grocery20.com';

let vapidConfigured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigured = true;
} else {
  logger.warn('VAPID keys not configured. Push notifications will be disabled.');
}

/**
 * Generate a new set of VAPID keys. Useful during initial setup.
 * Run once and store the keys in environment variables.
 */
export const generateVapidKeys = (): { publicKey: string; privateKey: string } => {
  return webpush.generateVAPIDKeys();
};

// ---------------------------------------------------------------------------
// In-memory fallback maps (used when DB tables are not yet created)
// ---------------------------------------------------------------------------

const MAX_NOTIFICATIONS = 50;
const memorySubscriptions = new Map<string, PushSubscription>();
const memoryNotifications = new Map<string, InAppNotification[]>();

// Flag to track if DB tables exist. We assume they do and fall back on error.
let dbAvailable = true;

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

async function ensureTablesExist(): Promise<void> {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_push_sub_user (user_id)
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'general',
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        action_url VARCHAR(512) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifications_user (user_id),
        INDEX idx_notifications_read (user_id, is_read),
        INDEX idx_notifications_created (user_id, created_at)
      )
    `);
  } catch (err) {
    logger.warn('Could not create notification tables, falling back to in-memory storage', { metadata: { error: (err as Error).message } });
    dbAvailable = false;
  }
}

// Run once on module load
ensureTablesExist();

// ---------------------------------------------------------------------------
// Subscription Management
// ---------------------------------------------------------------------------

export const saveSubscription = async (
  userId: string,
  subscription: PushSubscription,
): Promise<void> => {
  if (!dbAvailable) {
    memorySubscriptions.set(userId, subscription);
    return;
  }

  try {
    const keys = subscription.keys as Record<string, string> | undefined;
    const p256dh = keys?.p256dh ?? '';
    const auth = keys?.auth ?? '';

    // Upsert: delete old subscription for this user, insert new one
    await pool.execute('DELETE FROM push_subscriptions WHERE user_id = ?', [userId]);
    await pool.execute(
      'INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, subscription.endpoint, p256dh, auth],
    );
  } catch (err) {
    logger.error('Failed to save push subscription to DB, using memory fallback', err as Error);
    memorySubscriptions.set(userId, subscription);
  }
};

const getSubscription = async (userId: string): Promise<PushSubscription | null> => {
  if (!dbAvailable) {
    return memorySubscriptions.get(userId) ?? null;
  }

  try {
    const [rows] = await pool.execute<PushSubscriptionRow[]>(
      'SELECT * FROM push_subscriptions WHERE user_id = ? LIMIT 1',
      [userId],
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    } as PushSubscription;
  } catch (err) {
    logger.error('Failed to retrieve push subscription from DB', err as Error);
    return memorySubscriptions.get(userId) ?? null;
  }
};

const removeSubscription = async (userId: string): Promise<void> => {
  memorySubscriptions.delete(userId);
  if (dbAvailable) {
    try {
      await pool.execute('DELETE FROM push_subscriptions WHERE user_id = ?', [userId]);
    } catch {
      // Silently ignore -- best effort
    }
  }
};

// ---------------------------------------------------------------------------
// Notification CRUD
// ---------------------------------------------------------------------------

export const getNotifications = async (userId: string): Promise<InAppNotification[]> => {
  if (!dbAvailable) {
    return memoryNotifications.get(userId) ?? [];
  }

  try {
    const [rows] = await pool.execute<NotificationRow[]>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, MAX_NOTIFICATIONS],
    );

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type as NotificationType,
      read: row.is_read === 1,
      createdAt: new Date(row.created_at).toISOString(),
      actionUrl: row.action_url ?? undefined,
    }));
  } catch (err) {
    logger.error('Failed to get notifications from DB', err as Error);
    return memoryNotifications.get(userId) ?? [];
  }
};

export const createNotification = async (
  userId: string,
  data: { title: string; message: string; type: NotificationType; actionUrl?: string },
): Promise<InAppNotification> => {
  const entry: InAppNotification = {
    id: uuidv4(),
    userId,
    title: data.title,
    message: data.message,
    type: data.type,
    actionUrl: data.actionUrl,
    read: false,
    createdAt: new Date().toISOString(),
  };

  if (!dbAvailable) {
    const userNotifications = memoryNotifications.get(userId) ?? [];
    userNotifications.unshift(entry);
    if (userNotifications.length > MAX_NOTIFICATIONS) {
      userNotifications.length = MAX_NOTIFICATIONS;
    }
    memoryNotifications.set(userId, userNotifications);
    return entry;
  }

  try {
    await pool.execute(
      'INSERT INTO notifications (id, user_id, title, message, type, action_url) VALUES (?, ?, ?, ?, ?, ?)',
      [entry.id, userId, entry.title, entry.message, entry.type, entry.actionUrl ?? null],
    );

    // Prune old notifications beyond MAX
    await pool.execute(
      `DELETE FROM notifications WHERE user_id = ? AND id NOT IN (
        SELECT id FROM (
          SELECT id FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
        ) AS keep_rows
      )`,
      [userId, userId, MAX_NOTIFICATIONS],
    );
  } catch (err) {
    logger.error('Failed to create notification in DB', err as Error);
    // Still add to memory as fallback
    const userNotifications = memoryNotifications.get(userId) ?? [];
    userNotifications.unshift(entry);
    memoryNotifications.set(userId, userNotifications);
  }

  return entry;
};

export const markNotificationRead = async (userId: string, id: string): Promise<void> => {
  if (!dbAvailable) {
    const userNotifications = memoryNotifications.get(userId) ?? [];
    const entry = userNotifications.find((item) => item.id === id);
    if (entry) entry.read = true;
    return;
  }

  try {
    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId],
    );
  } catch (err) {
    logger.error('Failed to mark notification read in DB', err as Error);
    // Fallback to memory
    const userNotifications = memoryNotifications.get(userId) ?? [];
    const entry = userNotifications.find((item) => item.id === id);
    if (entry) entry.read = true;
  }
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  if (!dbAvailable) {
    const userNotifications = memoryNotifications.get(userId) ?? [];
    userNotifications.forEach((item) => { item.read = true; });
    return;
  }

  try {
    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId],
    );
  } catch (err) {
    logger.error('Failed to mark all notifications read in DB', err as Error);
    const userNotifications = memoryNotifications.get(userId) ?? [];
    userNotifications.forEach((item) => { item.read = true; });
  }
};

export const dismissNotification = async (userId: string, id: string): Promise<void> => {
  if (!dbAvailable) {
    const userNotifications = memoryNotifications.get(userId) ?? [];
    memoryNotifications.set(userId, userNotifications.filter((item) => item.id !== id));
    return;
  }

  try {
    await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId],
    );
  } catch (err) {
    logger.error('Failed to dismiss notification in DB', err as Error);
    const userNotifications = memoryNotifications.get(userId) ?? [];
    memoryNotifications.set(userId, userNotifications.filter((item) => item.id !== id));
  }
};

// ---------------------------------------------------------------------------
// Push Notification Delivery
// ---------------------------------------------------------------------------

export const sendPushNotification = async (
  userId: string,
  notification: InAppNotification,
): Promise<void> => {
  if (!vapidConfigured) return;

  const subscription = await getSubscription(userId);
  if (!subscription) return;

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: notification.title,
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-badge-72x72.png',
        data: {
          actionUrl: notification.actionUrl,
          notificationId: notification.id,
          type: notification.type,
        },
      }),
    );
  } catch (error) {
    const pushError = error as WebPushError;

    // Handle expired or invalid subscriptions (410 Gone or 404 Not Found)
    if (pushError.statusCode === 410 || pushError.statusCode === 404) {
      logger.info(`Removing expired push subscription for user ${userId}`, {
        metadata: { statusCode: pushError.statusCode },
      });
      await removeSubscription(userId);
    } else {
      logger.error('Failed to send push notification', pushError, {
        userId,
        metadata: { statusCode: pushError.statusCode },
      });
    }
  }
};

// ---------------------------------------------------------------------------
// High-level API: create notification + attempt push delivery
// ---------------------------------------------------------------------------

export const notifyUser = async (
  userId: string,
  data: { title: string; message: string; type: NotificationType; actionUrl?: string },
): Promise<InAppNotification> => {
  const notification = await createNotification(userId, data);
  await sendPushNotification(userId, notification);
  return notification;
};
