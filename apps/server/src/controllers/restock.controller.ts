import { Request, Response, NextFunction } from 'express';
import { restockService } from '../services/restock.service';

export const restockController = {
  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await restockService.getRecommendations(req.storeId!);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async acknowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await restockService.acknowledge(req.storeId!, req.params.productId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
