import { Router } from 'express';
import { notificationController } from '../../controllers/notification.controller';
import { authenticate } from '../../middleware/auth.middleware';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', notificationController.getAll);
notificationRouter.get('/unread-count', notificationController.getUnreadCount);
notificationRouter.put('/read-all', notificationController.markAllRead);
notificationRouter.put('/:notificationId/read', notificationController.markRead);
