import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { BadRequestError, ForbiddenError } from '../utils/errors';

export const requireStore = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const storeId = req.headers['x-store-id'] as string;

  if (!storeId) {
    next(new BadRequestError('x-store-id header is required'));
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(storeId)) {
    next(new BadRequestError('Invalid store ID'));
    return;
  }

  // Verify user belongs to this store
  const userStore = req.user?.stores.find(
    (s) => s.storeId.toString() === storeId
  );

  if (!userStore) {
    next(new ForbiddenError('You do not have access to this store'));
    return;
  }

  req.storeId = storeId;
  next();
};
