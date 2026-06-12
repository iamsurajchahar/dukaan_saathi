import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import { Sale } from '../models/sale.model';
import { Product } from '../models/product.model';
import { BadRequestError, NotFoundError } from '../utils/errors';

interface SaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface RecordSaleInput {
  items: SaleItemInput[];
  saleDate?: string;
  notes?: string;
}

interface PaginationQuery {
  page?: string;
  limit?: string;
  startDate?: string;
  endDate?: string;
}

export const saleService = {
  async record(storeId: string, userId: string, data: RecordSaleInput) {
    const saleItems: {
      productId: unknown;
      sku: string;
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[] = [];

    // Restore stock decremented so far if a later item fails
    const rollback = async () => {
      await Promise.all(
        saleItems.map((item) =>
          Product.findByIdAndUpdate(item.productId, {
            $inc: { currentStock: item.quantity },
          })
        )
      );
    };

    try {
      for (const item of data.items) {
        // Atomic check-and-decrement: only succeeds if enough stock remains,
        // so concurrent sales can never oversell
        const product = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            storeId,
            isActive: true,
            currentStock: { $gte: item.quantity },
          },
          { $inc: { currentStock: -item.quantity } },
          { new: false }
        );

        if (!product) {
          const exists = await Product.findOne({
            _id: item.productId,
            storeId,
            isActive: true,
          });
          if (!exists) {
            throw new NotFoundError(`Product not found: ${item.productId}`);
          }
          throw new BadRequestError(
            `Insufficient stock for ${exists.name}. Available: ${exists.currentStock}, Requested: ${item.quantity}`
          );
        }

        saleItems.push({
          productId: product._id,
          sku: product.sku,
          name: product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        });
      }

      const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0);

      const sale = await Sale.create({
        storeId,
        items: saleItems,
        totalAmount,
        saleDate: data.saleDate ? new Date(data.saleDate) : new Date(),
        recordedBy: userId,
        source: 'manual',
        notes: data.notes,
      });

      return sale;
    } catch (error) {
      await rollback();
      throw error;
    }
  },

  async getAll(storeId: string, query: PaginationQuery) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { storeId };

    if (query.startDate || query.endDate) {
      filter.saleDate = {};
      if (query.startDate) {
        filter.saleDate.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.saleDate.$lte = new Date(query.endDate);
      }
    }

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .sort({ saleDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Sale.countDocuments(filter),
    ]);

    return {
      sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(storeId: string, saleId: string) {
    const sale = await Sale.findOne({ _id: saleId, storeId }).lean();
    if (!sale) {
      throw new NotFoundError('Sale not found');
    }
    return sale;
  },

  async getSummary(
    storeId: string,
    period: 'daily' | 'weekly' | 'monthly',
    startDate?: string,
    endDate?: string
  ) {
    const matchStage: Record<string, any> = {
      storeId: new mongoose.Types.ObjectId(storeId),
    };

    if (startDate || endDate) {
      matchStage.saleDate = {};
      if (startDate) matchStage.saleDate.$gte = new Date(startDate);
      if (endDate) matchStage.saleDate.$lte = new Date(endDate);
    }

    let dateGroupExpression: Record<string, any>;
    switch (period) {
      case 'daily':
        dateGroupExpression = {
          year: { $year: '$saleDate' },
          month: { $month: '$saleDate' },
          day: { $dayOfMonth: '$saleDate' },
        };
        break;
      case 'weekly':
        dateGroupExpression = {
          year: { $isoWeekYear: '$saleDate' },
          week: { $isoWeek: '$saleDate' },
        };
        break;
      case 'monthly':
        dateGroupExpression = {
          year: { $year: '$saleDate' },
          month: { $month: '$saleDate' },
        };
        break;
    }

    const [totals, breakdown, totalProducts] = await Promise.all([
      Sale.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$items.total' },
            totalUnits: { $sum: '$items.quantity' },
            saleCount: { $addToSet: '$_id' },
          },
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1,
            totalUnits: 1,
            saleCount: { $size: '$saleCount' },
          },
        },
      ]),
      Sale.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
          $group: {
            _id: dateGroupExpression,
            revenue: { $sum: '$items.total' },
            units: { $sum: '$items.quantity' },
            saleCount: { $addToSet: '$_id' },
          },
        },
        {
          $project: {
            _id: 0,
            period: '$_id',
            revenue: 1,
            units: 1,
            saleCount: { $size: '$saleCount' },
          },
        },
        { $sort: { 'period.year': 1, 'period.month': 1, 'period.day': 1, 'period.week': 1 } },
      ]),
      Product.countDocuments({ storeId: new mongoose.Types.ObjectId(storeId), isActive: true }),
    ]);

    // Transform breakdown into dailyData with proper date strings
    const dailyData = breakdown.map((entry: any) => {
      let date: string;
      if (entry.period.day) {
        date = new Date(entry.period.year, entry.period.month - 1, entry.period.day).toISOString();
      } else if (entry.period.week) {
        date = `${entry.period.year}-W${entry.period.week}`;
      } else {
        date = new Date(entry.period.year, entry.period.month - 1, 1).toISOString();
      }
      return { date, revenue: entry.revenue, units: entry.units, transactions: entry.saleCount };
    });

    return {
      totalRevenue: totals[0]?.totalRevenue || 0,
      totalUnits: totals[0]?.totalUnits || 0,
      totalTransactions: totals[0]?.saleCount || 0,
      totalProducts,
      dailyData,
      // Keep legacy fields for backward compat
      saleCount: totals[0]?.saleCount || 0,
      breakdown,
    };
  },

  async importCSV(storeId: string, userId: string, csvData: string) {
    let records: Record<string, string>[];
    try {
      records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      throw new BadRequestError('Invalid CSV format');
    }

    const imported: string[] = [];
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        if (!row.productId || !row.quantity || !row.unitPrice) {
          throw new Error(
            'Missing required fields: productId, quantity, unitPrice'
          );
        }

        const product = await Product.findOne({
          _id: row.productId,
          storeId,
          isActive: true,
        });

        if (!product) {
          throw new Error(`Product not found: ${row.productId}`);
        }

        const quantity = parseInt(row.quantity, 10);
        const unitPrice = parseFloat(row.unitPrice);

        if (isNaN(quantity) || quantity < 1) {
          throw new Error('Invalid quantity');
        }
        if (isNaN(unitPrice) || unitPrice < 0) {
          throw new Error('Invalid unit price');
        }

        const total = quantity * unitPrice;

        // Create sale record WITHOUT decrementing stock (historical import)
        await Sale.create({
          storeId,
          items: [
            {
              productId: product._id,
              sku: product.sku,
              name: product.name,
              quantity,
              unitPrice,
              total,
            },
          ],
          totalAmount: total,
          saleDate: row.saleDate ? new Date(row.saleDate) : new Date(),
          recordedBy: userId,
          source: 'csv_import',
          notes: row.notes || undefined,
        });

        imported.push(`row-${i + 2}`);
      } catch (err: any) {
        errors.push({ row: i + 2, message: err.message });
      }
    }

    return { imported: imported.length, errors };
  },
};
