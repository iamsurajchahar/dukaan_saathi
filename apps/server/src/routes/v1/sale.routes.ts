import { Router } from 'express';
import { saleController } from '../../controllers/sale.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStore } from '../../middleware/tenant.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { upload } from '../../middleware/upload.middleware';
import { recordSaleSchema } from '../../validators/sale.validator';

export const saleRouter = Router();

// All sale routes require authentication and a store context
saleRouter.use(authenticate, requireStore);

saleRouter.post('/', validate(recordSaleSchema), saleController.record);

saleRouter.get('/', saleController.getAll);

saleRouter.get('/summary', saleController.getSummary);

saleRouter.post(
  '/import',
  requireRole('owner', 'manager'),
  upload.single('file'),
  saleController.importCSV
);

saleRouter.get('/:saleId', saleController.getById);
