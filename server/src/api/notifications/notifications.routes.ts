import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import {
  dismiss,
  listNotifications,
  markAllRead,
  markRead,
  subscribe,
} from './notifications.controller.js';

const router = Router();

router.use(authenticateToken);

router.post('/subscribe', subscribe);
router.get('/', listNotifications);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', dismiss);

export default router;
