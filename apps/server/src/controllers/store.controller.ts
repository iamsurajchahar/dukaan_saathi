import { Request, Response, NextFunction } from 'express';
import { storeService } from '../services/store.service';

export const storeController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const store = await storeService.create(
        String(req.user!._id),
        req.body
      );
      res.status(201).json({ success: true, data: store });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const stores = await storeService.getAll(String(req.user!._id));
      res.json({ success: true, data: stores });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const store = await storeService.getById(req.params.storeId);
      res.json({ success: true, data: store });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const store = await storeService.update(req.params.storeId, req.body);
      res.json({ success: true, data: store });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await storeService.delete(req.params.storeId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async switchStore(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await storeService.switchStore(
        String(req.user!._id),
        req.params.storeId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
