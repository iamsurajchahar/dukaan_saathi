import { Request, Response, NextFunction } from 'express';
import { saleService } from '../services/sale.service';

export const saleController = {
  async record(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await saleService.record(
        req.storeId!,
        String(req.user!._id),
        req.body
      );
      res.status(201).json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await saleService.getAll(req.storeId!, req.query as any);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await saleService.getById(req.storeId!, req.params.saleId);
      res.json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  },

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as string) || 'daily';
      let startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const days = req.query.days as string | undefined;

      // Support `days` param: convert to startDate
      if (days && !startDate) {
        const d = new Date();
        d.setDate(d.getDate() - parseInt(days, 10));
        startDate = d.toISOString();
      }

      const summary = await saleService.getSummary(
        req.storeId!,
        period as 'daily' | 'weekly' | 'monthly',
        startDate,
        endDate
      );
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  },

  async importCSV(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No CSV file uploaded' });
        return;
      }
      const csvData = req.file.buffer.toString('utf-8');
      const result = await saleService.importCSV(
        req.storeId!,
        String(req.user!._id),
        csvData
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
