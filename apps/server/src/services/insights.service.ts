import mongoose from 'mongoose';
import { Product } from '../models/product.model';
import { Sale } from '../models/sale.model';
import { Forecast } from '../models/forecast.model';

export const insightsService = {
  async getBusinessInsights(storeId: string) {
    const storeObjId = new mongoose.Types.ObjectId(storeId);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      products,
      salesLast30,
      salesPrev30,
      salesToday,
      salesLast7,
      topProducts,
      slowProducts,
    ] = await Promise.all([
      // All active products
      Product.find({ storeId: storeObjId, isActive: true }).lean(),

      // Sales last 30 days
      Sale.aggregate([
        { $match: { storeId: storeObjId, saleDate: { $gte: thirtyDaysAgo } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$items.total' },
            units: { $sum: '$items.quantity' },
            transactions: { $addToSet: '$_id' },
          },
        },
        { $project: { revenue: 1, units: 1, transactions: { $size: '$transactions' } } },
      ]),

      // Sales previous 30 days (for comparison)
      Sale.aggregate([
        { $match: { storeId: storeObjId, saleDate: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$items.total' },
            units: { $sum: '$items.quantity' },
          },
        },
      ]),

      // Today's sales
      Sale.aggregate([
        {
          $match: {
            storeId: storeObjId,
            saleDate: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
          },
        },
        { $unwind: '$items' },
        { $group: { _id: null, revenue: { $sum: '$items.total' }, units: { $sum: '$items.quantity' } } },
      ]),

      // Sales last 7 days
      Sale.aggregate([
        { $match: { storeId: storeObjId, saleDate: { $gte: sevenDaysAgo } } },
        { $unwind: '$items' },
        { $group: { _id: null, revenue: { $sum: '$items.total' }, units: { $sum: '$items.quantity' } } },
      ]),

      // Top 5 selling products (last 30 days)
      Sale.aggregate([
        { $match: { storeId: storeObjId, saleDate: { $gte: thirtyDaysAgo } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            totalRevenue: { $sum: '$items.total' },
            totalQty: { $sum: '$items.quantity' },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
      ]),

      // Slowest 5 products (least sold, last 30 days)
      Sale.aggregate([
        { $match: { storeId: storeObjId, saleDate: { $gte: thirtyDaysAgo } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            totalRevenue: { $sum: '$items.total' },
            totalQty: { $sum: '$items.quantity' },
          },
        },
        { $sort: { totalQty: 1 } },
        { $limit: 5 },
      ]),
    ]);

    // Compute profit estimates
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Calculate estimated cost from last 30 days sales
    const salesWithCost = await Sale.aggregate([
      { $match: { storeId: storeObjId, saleDate: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.total' },
          totalCost: {
            $sum: { $multiply: ['$items.quantity', { $ifNull: ['$product.price.costPrice', 0] }] },
          },
        },
      },
    ]);

    const revenue30d = salesLast30[0]?.revenue || 0;
    const revenuePrev30d = salesPrev30[0]?.revenue || 0;
    const totalCost30d = salesWithCost[0]?.totalCost || 0;
    const grossProfit30d = revenue30d - totalCost30d;
    const profitMargin = revenue30d > 0 ? (grossProfit30d / revenue30d) * 100 : 0;
    const revenueGrowth = revenuePrev30d > 0 ? ((revenue30d - revenuePrev30d) / revenuePrev30d) * 100 : 0;

    // Stock health
    const lowStockProducts = products.filter((p) => p.currentStock <= p.reorderLevel);
    const outOfStockProducts = products.filter((p) => p.currentStock === 0);
    const totalStockValue = products.reduce(
      (sum, p) => sum + p.currentStock * p.price.costPrice,
      0
    );
    const totalRetailValue = products.reduce(
      (sum, p) => sum + p.currentStock * p.price.sellingPrice,
      0
    );

    // Dead stock: products with stock but no sales in 30 days
    const soldProductIds = new Set(
      (await Sale.aggregate([
        { $match: { storeId: storeObjId, saleDate: { $gte: thirtyDaysAgo } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productId' } },
      ])).map((r: any) => r._id.toString())
    );
    const deadStock = products.filter(
      (p) => p.currentStock > 0 && !soldProductIds.has(p._id.toString())
    );

    return {
      revenue: {
        today: salesToday[0]?.revenue || 0,
        last7Days: salesLast7[0]?.revenue || 0,
        last30Days: revenue30d,
        prev30Days: revenuePrev30d,
        growth: Math.round(revenueGrowth * 10) / 10,
      },
      profit: {
        grossProfit30d: Math.round(grossProfit30d),
        totalCost30d: Math.round(totalCost30d),
        margin: Math.round(profitMargin * 10) / 10,
        isProfitable: grossProfit30d > 0,
      },
      sales: {
        unitsLast30: salesLast30[0]?.units || 0,
        transactionsLast30: salesLast30[0]?.transactions || 0,
        avgTransactionValue: salesLast30[0]?.transactions
          ? Math.round(revenue30d / salesLast30[0].transactions)
          : 0,
      },
      stock: {
        totalProducts: products.length,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        deadStockCount: deadStock.length,
        lowStockItems: lowStockProducts.slice(0, 5).map((p) => p.name),
        deadStockItems: deadStock.slice(0, 5).map((p) => p.name),
        totalStockValue: Math.round(totalStockValue),
        totalRetailValue: Math.round(totalRetailValue),
      },
      topProducts: topProducts.map((p: any) => ({
        name: p.name,
        revenue: Math.round(p.totalRevenue),
        quantity: p.totalQty,
      })),
      slowProducts: slowProducts.map((p: any) => ({
        name: p.name,
        revenue: Math.round(p.totalRevenue),
        quantity: p.totalQty,
      })),
    };
  },
};
