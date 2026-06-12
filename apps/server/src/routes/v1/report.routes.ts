import { Router } from 'express';
import { reportController } from '../../controllers/report.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStore } from '../../middleware/tenant.middleware';

export const reportRouter = Router();

reportRouter.use(authenticate, requireStore);

reportRouter.post('/generate', reportController.generate);
