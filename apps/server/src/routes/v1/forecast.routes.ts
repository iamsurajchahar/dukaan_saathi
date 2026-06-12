import { Router } from 'express';
import { forecastController } from '../../controllers/forecast.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStore } from '../../middleware/tenant.middleware';
import { requireRole } from '../../middleware/role.middleware';

export const forecastRouter = Router();

forecastRouter.use(authenticate, requireStore);

forecastRouter.post('/generate', requireRole('owner', 'manager'), forecastController.generate);
forecastRouter.get('/', forecastController.getAll);
forecastRouter.get('/accuracy', forecastController.getAccuracy);
forecastRouter.get('/:productId', forecastController.getByProduct);
