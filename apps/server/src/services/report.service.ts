import mongoose from 'mongoose';
import { Product } from '../models/product.model';
import { Sale } from '../models/sale.model';
import { Forecast } from '../models/forecast.model';
import { BadRequestError } from '../utils/errors';

export const reportService = {
  async generate(storeId: string, type: string, format: string) {
    switch (type) {
      case 'inventory_valuation':
        return generateInventoryValuation(storeId, format);
      case 'sales_trend':
        return generateSalesTrend(storeId, format);
      case 'forecast_accuracy':
        return generateForecastAccuracy(storeId, format);
      default:
        throw new BadRequestError(`Unknown report type: ${type}`);
    }
  },
};

async function generateInventoryValuation(storeId: string, format: string) {
  const products = await Product.find({
    storeId: new mongoose.Types.ObjectId(storeId),
    isActive: true,
  })
    .select('sku name category unit price currentStock reorderLevel')
    .sort({ category: 1, name: 1 })
    .lean();

  const rows = products.map((p: any) => ({
    SKU: p.sku,
    Name: p.name,
    Category: p.category,
    Unit: p.unit,
    'Cost Price': p.price?.costPrice || 0,
    'Selling Price': p.price?.sellingPrice || 0,
    MRP: p.price?.mrp || 0,
    'Current Stock': p.currentStock,
    'Reorder Level': p.reorderLevel,
    'Stock Value (Cost)': (p.price?.costPrice || 0) * p.currentStock,
    'Stock Value (Selling)': (p.price?.sellingPrice || 0) * p.currentStock,
  }));

  const totalCostValue = rows.reduce((sum, r) => sum + r['Stock Value (Cost)'], 0);
  const totalSellingValue = rows.reduce((sum, r) => sum + r['Stock Value (Selling)'], 0);

  // Add totals row
  rows.push({
    SKU: '',
    Name: 'TOTAL',
    Category: '',
    Unit: '',
    'Cost Price': 0,
    'Selling Price': 0,
    MRP: 0,
    'Current Stock': products.reduce((sum: number, p: any) => sum + p.currentStock, 0),
    'Reorder Level': 0,
    'Stock Value (Cost)': totalCostValue,
    'Stock Value (Selling)': totalSellingValue,
  });

  return { rows, filename: 'inventory_valuation_report' };
}

async function generateSalesTrend(storeId: string, format: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const objectStoreId = new mongoose.Types.ObjectId(storeId);

  // Daily revenue for last 30 days
  const dailySales = await Sale.aggregate([
    {
      $match: {
        storeId: objectStoreId,
        saleDate: { $gte: thirtyDaysAgo },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
        },
        revenue: { $sum: '$items.total' },
        unitsSold: { $sum: '$items.quantity' },
        transactions: { $addToSet: '$_id' },
      },
    },
    {
      $project: {
        _id: 0,
        Date: '$_id.date',
        Revenue: '$revenue',
        'Units Sold': '$unitsSold',
        Transactions: { $size: '$transactions' },
      },
    },
    { $sort: { Date: 1 } },
  ]);

  // Top products by revenue
  const topProducts = await Sale.aggregate([
    {
      $match: {
        storeId: objectStoreId,
        saleDate: { $gte: thirtyDaysAgo },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        revenue: { $sum: '$items.total' },
        unitsSold: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 20 },
    {
      $project: {
        _id: 0,
        Product: '$_id',
        Revenue: '$revenue',
        'Units Sold': '$unitsSold',
      },
    },
  ]);

  // Combine: daily data first, then a separator, then top products
  const rows = [
    ...dailySales.map((d: any) => ({
      Date: d.Date,
      Revenue: d.Revenue,
      'Units Sold': d['Units Sold'],
      Transactions: d.Transactions,
      'Top Product': '',
      'Product Revenue': '',
    })),
  ];

  // Add total row
  const totalRevenue = dailySales.reduce((s: number, d: any) => s + d.Revenue, 0);
  const totalUnits = dailySales.reduce((s: number, d: any) => s + d['Units Sold'], 0);
  rows.push({
    Date: 'TOTAL (30 days)',
    Revenue: totalRevenue,
    'Units Sold': totalUnits,
    Transactions: dailySales.reduce((s: number, d: any) => s + d.Transactions, 0),
    'Top Product': '',
    'Product Revenue': '',
  });

  // Add blank separator then top products
  rows.push({ Date: '', Revenue: '' as any, 'Units Sold': '' as any, Transactions: '' as any, 'Top Product': 'TOP PRODUCTS', 'Product Revenue': '' });
  topProducts.forEach((tp: any) => {
    rows.push({
      Date: '',
      Revenue: '' as any,
      'Units Sold': '' as any,
      Transactions: '' as any,
      'Top Product': tp.Product,
      'Product Revenue': tp.Revenue,
    });
  });

  return { rows, filename: 'sales_trend_report' };
}

async function generateForecastAccuracy(storeId: string, format: string) {
  const objectStoreId = new mongoose.Types.ObjectId(storeId);

  const forecasts = await Forecast.aggregate([
    { $match: { storeId: objectStoreId } },
    { $sort: { generatedAt: -1 } },
    {
      $group: {
        _id: '$productId',
        method: { $first: '$method' },
        mape: { $first: '$metrics.mape' },
        mae: { $first: '$metrics.mae' },
        rmse: { $first: '$metrics.rmse' },
        priority: { $first: '$priority' },
        reorderPoint: { $first: '$inventory.reorderPoint' },
        safetyStock: { $first: '$inventory.safetyStock' },
        suggestedOrderQty: { $first: '$inventory.suggestedOrderQty' },
        generatedAt: { $first: '$generatedAt' },
      },
    },
  ]);

  // Get product names
  const productIds = forecasts.map((f: any) => f._id);
  const products = await Product.find({ _id: { $in: productIds } }).select('name sku').lean();
  const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

  const rows = forecasts.map((f: any) => {
    const product = productMap.get(f._id.toString());
    return {
      Product: product?.name || 'Unknown',
      SKU: product?.sku || '',
      Method: f.method,
      'MAPE (%)': f.mape ? Math.round(f.mape * 100) / 100 : 'N/A',
      'MAE': f.mae ? Math.round(f.mae * 100) / 100 : 'N/A',
      'RMSE': f.rmse ? Math.round(f.rmse * 100) / 100 : 'N/A',
      Priority: f.priority,
      'Reorder Point': f.reorderPoint || 'N/A',
      'Safety Stock': f.safetyStock || 'N/A',
      'Suggested Order': f.suggestedOrderQty || 'N/A',
      'Generated': f.generatedAt ? new Date(f.generatedAt).toLocaleDateString() : '',
    };
  });

  // Sort by MAPE ascending (best accuracy first)
  rows.sort((a: any, b: any) => {
    const aMape = typeof a['MAPE (%)'] === 'number' ? a['MAPE (%)'] : 999;
    const bMape = typeof b['MAPE (%)'] === 'number' ? b['MAPE (%)'] : 999;
    return aMape - bMape;
  });

  return { rows, filename: 'forecast_accuracy_report' };
}
