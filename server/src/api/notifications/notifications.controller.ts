import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import {
  dismissNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  saveSubscription,
} from '../../services/push/pushService.js';

/**
 * POST /api/notifications/subscribe
 * Save a push subscription for the authenticated user.
 */
export const subscribe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    throw new AppError('A valid push subscription payload is required', 400);
  }

  await saveSubscription(userId, subscription);

  res.status(201).json({
    success: true,
    message: 'Push subscription saved',
  });
});

/**
 * GET /api/notifications
 * Retrieve in-app notifications for the authenticated user.
 */
export const listNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const notifications = await getNotifications(userId);

  res.json({
    success: true,
    notifications,
  });
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read.
 */
export const markRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const { id } = req.params;
  if (!id) {
    throw new AppError('Notification id is required', 400);
  }

  await markNotificationRead(String(userId), String(id));

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user.
 */
export const markAllRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  await markAllNotificationsRead(userId);

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});

/**
 * DELETE /api/notifications/:id
 * Dismiss (delete) a single notification.
 */
export const dismiss = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const { id } = req.params;
  if (!id) {
    throw new AppError('Notification id is required', 400);
  }

  await dismissNotification(String(userId), String(id));

  res.json({
    success: true,
    message: 'Notification dismissed',
  });
});
