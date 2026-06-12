import { Router } from 'express';
import { productController } from '../../controllers/product.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStore } from '../../middleware/tenant.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { upload } from '../../middleware/upload.middleware';
import {
  createProductSchema,
  updateProductSchema,
} from '../../validators/product.validator';

export const productRouter = Router();

// All product routes require authentication and a store context
productRouter.use(authenticate, requireStore);

productRouter.get('/', productController.getAll);

productRouter.post(
  '/',
  requireRole('owner', 'manager'),
  validate(createProductSchema),
  productController.create
);

productRouter.get('/low-stock', productController.getLowStock);

productRouter.get('/export', productController.exportCSV);

productRouter.post(
  '/import',
  requireRole('owner', 'manager'),
  upload.single('file'),
  productController.importCSV
);

productRouter.get('/:productId', productController.getById);

productRouter.put(
  '/:productId',
  requireRole('owner', 'manager'),
  validate(updateProductSchema),
  productController.update
);

productRouter.delete(
  '/:productId',
  requireRole('owner'),
  productController.delete
);
