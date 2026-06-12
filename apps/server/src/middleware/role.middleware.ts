import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

type Role = 'owner' | 'manager' | 'staff';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    const storeId = req.storeId;
    if (storeId) {
      // Check store-specific role
      const userStore = req.user.stores.find(
        (s) => s.storeId.toString() === storeId
      );
      if (!userStore || !allowedRoles.includes(userStore.role as Role)) {
        next(new ForbiddenError('Insufficient permissions for this store'));
        return;
      }
    } else {
      // Check global role
      if (!allowedRoles.includes(req.user.role as Role)) {
        next(new ForbiddenError('Insufficient permissions'));
        return;
      }
    }

    next();
  };
};
