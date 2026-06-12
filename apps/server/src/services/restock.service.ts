import mongoose from 'mongoose';
import { Forecast } from '../models/forecast.model';
import { Product } from '../models/product.model';

export const restockService = {
  async getRecommendations(storeId: string) {
    const products = await Product.find({ storeId, isActive: true }).lean();

    const productIds = products.map((p) => p._id);

    // Batch fetch latest forecast per product using aggregation
    // (aggregation does not auto-cast strings to ObjectId)
    const latestForecasts = await Forecast.aggregate([
      {
        $match: {
          storeId: new mongoose.Types.ObjectId(storeId),
          productId: { $in: productIds },
        },
      },
      { $sort: { generatedAt: -1 } },
      {
        $group: {
          _id: '$productId',
          doc: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);

    const forecastMap = new Map(
      latestForecasts.map((f: any) => [f.productId.toString(), f])
    );

    const recommendations = products.map((product) => {
      const forecast = forecastMap.get(product._id.toString());

      const avgDailySales = forecast
        ? forecast.predictions.reduce((sum: number, p: any) => sum + p.predictedDemand, 0) /
          forecast.predictions.length
        : 0;

      const daysUntilStockout =
        avgDailySales > 0
          ? Math.floor(product.currentStock / avgDailySales)
          : 999;

      let priority: 'critical' | 'warning' | 'ok' = 'ok';
      if (
        product.currentStock <= product.reorderLevel ||
        daysUntilStockout < 2
      ) {
        priority = 'critical';
      } else if (daysUntilStockout < 7) {
        priority = 'warning';
      }

      return {
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          currentStock: product.currentStock,
          reorderLevel: product.reorderLevel,
          category: product.category,
          unit: product.unit,
        },
        forecast: {
          suggestedOrderQty: forecast?.suggestedOrderQty ?? product.reorderQuantity,
          suggestedOrderDate: forecast?.suggestedOrderDate ?? new Date(),
          priority,
          confidence: forecast ? Math.max(0, 100 - (forecast.metrics.mape || 50)) : 0,
          daysUntilStockout,
          method: forecast?.method ?? 'none',
        },
      };
    });

    // Sort: critical first, then warning, then ok
    const priorityOrder = { critical: 0, warning: 1, ok: 2 };
    recommendations.sort(
      (a, b) => priorityOrder[a.forecast.priority] - priorityOrder[b.forecast.priority]
    );

    return recommendations;
  },

  async acknowledge(storeId: string, productId: string) {
    // Update product to indicate it's been ordered
    await Product.findOneAndUpdate(
      { _id: productId, storeId },
      { $set: { lastOrderedAt: new Date() } }
    );
    return { message: 'Product marked as ordered' };
  },
};
