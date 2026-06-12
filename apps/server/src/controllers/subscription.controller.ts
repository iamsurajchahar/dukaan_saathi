import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { logger } from '../config/logger';

export const subscriptionController = {
  async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionService.getCurrent(String(req.user!._id));
      res.json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  },

  async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const { plan } = req.body;
      const order = await subscriptionService.createOrder(String(req.user!._id), plan);
      res.json({ success: true, data: order });
    } catch (error: unknown) {
      logger.error({ error }, 'Checkout error');
      const err = error as { error?: { description?: string }; message?: string };
      if (err.error?.description) {
        res.status(500).json({ success: false, error: err.error.description });
        return;
      }
      next(error);
    }
  },

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan } = req.body;
      const subscription = await subscriptionService.verifyAndActivate(
        String(req.user!._id),
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        plan
      );
      res.json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  },

  async downgrade(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionService.downgradeToFree(String(req.user!._id));
      res.json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  },
};
