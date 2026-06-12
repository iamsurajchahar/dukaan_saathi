import { Request, Response, NextFunction } from 'express';
import { insightsService } from '../services/insights.service';

export const insightsController = {
  async getInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await insightsService.getBusinessInsights(req.storeId!);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};
