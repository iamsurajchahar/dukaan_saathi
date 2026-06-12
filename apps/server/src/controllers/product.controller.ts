import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';

export const productController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.create(req.storeId!, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.getAll(req.storeId!, req.query as any);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getById(
        req.storeId!,
        req.params.productId
      );
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.update(
        req.storeId!,
        req.params.productId,
        req.body
      );
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.delete(
        req.storeId!,
        req.params.productId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await productService.getLowStock(req.storeId!);
      res.json({ success: true, data: products });
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
      const result = await productService.importCSV(req.storeId!, csvData);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async exportCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await productService.exportCSV(req.storeId!);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="products.csv"'
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },
};
