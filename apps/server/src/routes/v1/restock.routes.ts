import { Router } from 'express';
import { restockController } from '../../controllers/restock.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStore } from '../../middleware/tenant.middleware';

export const restockRouter = Router();

restockRouter.use(authenticate, requireStore);

restockRouter.get('/recommendations', restockController.getRecommendations);
restockRouter.post('/acknowledge/:productId', restockController.acknowledge);
