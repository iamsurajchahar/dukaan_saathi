import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStore } from '../../middleware/tenant.middleware';
import { insightsController } from '../../controllers/insights.controller';

export const insightsRouter = Router();

insightsRouter.use(authenticate, requireStore);

insightsRouter.get('/', insightsController.getInsights);
