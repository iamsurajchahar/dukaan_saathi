import { Router } from 'express';
import { subscriptionController } from '../../controllers/subscription.controller';
import { authenticate } from '../../middleware/auth.middleware';

export const subscriptionRouter = Router();

subscriptionRouter.get('/current', authenticate, subscriptionController.getCurrent);
subscriptionRouter.post('/checkout', authenticate, subscriptionController.checkout);
subscriptionRouter.post('/verify', authenticate, subscriptionController.verify);
subscriptionRouter.post('/downgrade', authenticate, subscriptionController.downgrade);
