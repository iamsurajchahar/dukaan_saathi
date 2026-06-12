import { Router } from 'express';
import { storeController } from '../../controllers/store.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStore } from '../../middleware/tenant.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createStoreSchema,
  updateStoreSchema,
} from '../../validators/store.validator';

export const storeRouter = Router();

storeRouter.post(
  '/',
  authenticate,
  validate(createStoreSchema),
  storeController.create
);

storeRouter.get('/', authenticate, storeController.getAll);

storeRouter.get('/:storeId', authenticate, storeController.getById);

storeRouter.put(
  '/:storeId',
  authenticate,
  requireStore,
  requireRole('owner'),
  validate(updateStoreSchema),
  storeController.update
);

storeRouter.delete(
  '/:storeId',
  authenticate,
  requireStore,
  requireRole('owner'),
  storeController.delete
);

storeRouter.post(
  '/:storeId/switch',
  authenticate,
  storeController.switchStore
);
