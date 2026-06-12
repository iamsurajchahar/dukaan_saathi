import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';

export const notificationController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.getAll(String(req.user!._id), req.query as any);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markRead(
        String(req.user!._id),
        req.params.notificationId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAllRead(String(req.user!._id));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.getUnreadCount(String(req.user!._id));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
