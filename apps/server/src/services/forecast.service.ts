import { generateForecast } from '../engine';
import { Product } from '../models/product.model';
import { Forecast } from '../models/forecast.model';
import { NotFoundError } from '../utils/errors';

export const forecastService = {
  /**
   * Generate a forecast for a single product in a store.
   */
  async generateForProduct(productId: string, storeId: string) {
    const product = await Product.findOne({ _id: productId, storeId });
    if (!product) {
      throw new NotFoundError('Product not found in this store');
    }

    const result = await generateForecast(productId, storeId);
    if (!result) {
      return {
        message: 'Insufficient sales data to generate forecast (need at least 14 days)',
        productId,
      };
    }

    return result;
  },

  /**
   * Generate forecasts for all active products in a store.
   */
  async generateForStore(storeId: string) {
    const products = await Product.find({ storeId, isActive: true }).select('_id');

    const results: {
      productId: string;
      success: boolean;
      method?: string;
      error?: string;
    }[] = [];

    for (const product of products) {
      try {
        const result = await generateForecast(String(product._id), storeId);
        results.push({
          productId: String(product._id),
          success: true,
          method: result?.method ?? 'insufficient_data',
        });
      } catch (error) {
        results.push({
          productId: String(product._id),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      total: products.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },

  /**
   * Get the latest forecast for each product in a store.
   */
  async getLatest(storeId: string) {
    const forecasts = await Forecast.aggregate([
      { $match: { storeId: new (await import('mongoose')).default.Types.ObjectId(storeId) } },
      { $sort: { generatedAt: -1 } },
      {
        $group: {
          _id: '$productId',
          forecast: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$forecast' } },
      { $sort: { priority: 1 } },
    ]);

    // Populate product details
    const populated = await Forecast.populate(forecasts, {
      path: 'productId',
      select: 'name sku category currentStock reorderLevel',
    });

    // Flatten productId into productName + productId string for frontend
    return populated.map((f: any) => {
      const doc = f.toObject ? f.toObject() : f;
      const product = doc.productId;
      return {
        ...doc,
        productId: product?._id?.toString() || doc.productId?.toString(),
        productName: product?.name || 'Unknown Product',
        productSku: product?.sku,
        productCategory: product?.category,
        productStock: product?.currentStock,
        productReorderLevel: product?.reorderLevel,
      };
    });
  },

  /**
   * Get the latest forecast for a specific product.
   */
  async getByProduct(storeId: string, productId: string) {
    const forecast = await Forecast.findOne({
      storeId,
      productId,
    })
      .sort({ generatedAt: -1 })
      .populate('productId', 'name sku category currentStock reorderLevel leadTimeDays');

    if (!forecast) {
      throw new NotFoundError('No forecast found for this product');
    }

    return forecast;
  },

  /**
   * Get forecast accuracy (average MAPE) across all products in a store.
   */
  async getAccuracy(storeId: string) {
    const result = await Forecast.aggregate([
      { $match: { storeId: new (await import('mongoose')).default.Types.ObjectId(storeId) } },
      { $sort: { generatedAt: -1 } },
      {
        $group: {
          _id: '$productId',
          latestMAPE: { $first: '$metrics.mape' },
          latestMAE: { $first: '$metrics.mae' },
          latestRMSE: { $first: '$metrics.rmse' },
          method: { $first: '$method' },
        },
      },
      {
        $group: {
          _id: null,
          avgMAPE: { $avg: '$latestMAPE' },
          avgMAE: { $avg: '$latestMAE' },
          avgRMSE: { $avg: '$latestRMSE' },
          productCount: { $sum: 1 },
          methods: { $push: '$method' },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        avgMape: 0,
        avgMae: 0,
        avgRmse: 0,
        totalForecasts: 0,
        bestMethod: null,
        methodBreakdown: {},
      };
    }

    const { avgMAPE, avgMAE, avgRMSE, productCount, methods } = result[0];

    // Count methods
    const methodBreakdown: Record<string, number> = {};
    for (const m of methods) {
      methodBreakdown[m] = (methodBreakdown[m] || 0) + 1;
    }

    // Find the most common method
    const bestMethod = Object.entries(methodBreakdown).sort(
      (a, b) => (b[1] as number) - (a[1] as number)
    )[0]?.[0] || null;

    return {
      avgMape: Math.round(avgMAPE * 100) / 100,
      avgMae: Math.round(avgMAE * 100) / 100,
      avgRmse: Math.round(avgRMSE * 100) / 100,
      totalForecasts: productCount,
      bestMethod,
      methodBreakdown,
    };
  },
};
