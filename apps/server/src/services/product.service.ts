import { parse } from 'csv-parse/sync';
import { Product } from '../models/product.model';
import { Subscription } from '../models/subscription.model';
import { User } from '../models/user.model';
import {
  BadRequestError,
  NotFoundError,
  PaymentRequiredError,
} from '../utils/errors';

interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export const productService = {
  async create(storeId: string, data: Record<string, any>) {
    // Check subscription limits by looking up the store owner
    const store = await (await import('../models/store.model')).Store.findById(storeId);
    if (store) {
      const user = await User.findById(store.ownerId);
      if (user?.subscriptionId) {
        const subscription = await Subscription.findById(user.subscriptionId);
        if (subscription) {
          const currentSkuCount = await Product.countDocuments({
            storeId,
            isActive: true,
          });
          if (currentSkuCount >= subscription.limits.maxSkusPerStore) {
            throw new PaymentRequiredError(
              `Your plan allows a maximum of ${subscription.limits.maxSkusPerStore} SKUs per store. Please upgrade to add more.`
            );
          }
        }
      }
    }

    const product = await Product.create({
      ...data,
      storeId,
    });

    return product;
  },

  async getAll(storeId: string, query: PaginationQuery) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { storeId, isActive: true };

    if (query.search) {
      // Escape regex metacharacters so user input is matched literally
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' };
    }

    if (query.category) {
      filter.category = query.category;
    }

    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(storeId: string, productId: string) {
    const product = await Product.findOne({
      _id: productId,
      storeId,
      isActive: true,
    }).lean();

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  },

  async update(storeId: string, productId: string, data: Record<string, any>) {
    const product = await Product.findOneAndUpdate(
      { _id: productId, storeId, isActive: true },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  },

  async delete(storeId: string, productId: string) {
    const product = await Product.findOneAndUpdate(
      { _id: productId, storeId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return { message: 'Product deleted successfully' };
  },

  async getLowStock(storeId: string) {
    const products = await Product.find({
      storeId,
      isActive: true,
      $expr: { $lte: ['$currentStock', '$reorderLevel'] },
    }).lean();

    return products;
  },

  async importCSV(storeId: string, csvData: string) {
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
        if (!row.sku || !row.name || !row.category) {
          throw new Error('Missing required fields: sku, name, category');
        }

        const productData: Record<string, any> = {
          storeId,
          sku: row.sku,
          name: row.name,
          category: row.category,
          subcategory: row.subcategory || undefined,
          unit: row.unit || 'piece',
          price: {
            costPrice: parseFloat(row.costPrice) || 0,
            sellingPrice: parseFloat(row.sellingPrice) || 0,
            mrp: parseFloat(row.mrp) || 0,
          },
          currentStock: parseFloat(row.currentStock) || 0,
          reorderLevel: parseFloat(row.reorderLevel) || 10,
          reorderQuantity: parseFloat(row.reorderQuantity) || 50,
          leadTimeDays: row.leadTimeDays
            ? parseFloat(row.leadTimeDays)
            : undefined,
          barcode: row.barcode || undefined,
          tags: row.tags ? row.tags.split(';').map((t: string) => t.trim()) : [],
          isActive: true,
        };

        await Product.findOneAndUpdate(
          { storeId, sku: row.sku },
          { $set: productData },
          { upsert: true, new: true, runValidators: true }
        );

        imported.push(row.sku);
      } catch (err: any) {
        errors.push({ row: i + 2, message: err.message });
      }
    }

    return { imported: imported.length, errors };
  },

  async exportCSV(storeId: string) {
    const products = await Product.find({ storeId, isActive: true }).lean();

    const headers = [
      'sku',
      'name',
      'category',
      'subcategory',
      'unit',
      'costPrice',
      'sellingPrice',
      'mrp',
      'currentStock',
      'reorderLevel',
      'reorderQuantity',
      'leadTimeDays',
      'barcode',
      'tags',
    ];

    const rows = products.map((p) => [
      csvEscape(p.sku),
      csvEscape(p.name),
      csvEscape(p.category),
      csvEscape(p.subcategory || ''),
      csvEscape(p.unit),
      p.price.costPrice,
      p.price.sellingPrice,
      p.price.mrp,
      p.currentStock,
      p.reorderLevel,
      p.reorderQuantity,
      p.leadTimeDays,
      csvEscape(p.barcode || ''),
      csvEscape((p.tags || []).join(';')),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csv;
  },
};

function csvEscape(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
