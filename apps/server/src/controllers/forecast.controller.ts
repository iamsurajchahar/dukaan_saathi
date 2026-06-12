import { Request, Response, NextFunction } from 'express';
import { forecastService } from '../services/forecast.service';

export const forecastController = {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.body;
      let result;
      if (productId) {
        result = await forecastService.generateForProduct(productId, req.storeId!);
      } else {
        result = await forecastService.generateForStore(req.storeId!);
      }
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await forecastService.getLatest(req.storeId!);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getByProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await forecastService.getByProduct(req.storeId!, req.params.productId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getAccuracy(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await forecastService.getAccuracy(req.storeId!);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
