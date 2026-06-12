import { z } from 'zod';

const unitEnum = z.enum(['piece', 'kg', 'litre', 'pack', 'dozen']);

const priceSchema = z.object({
  costPrice: z.number().min(0, 'Cost price must be >= 0'),
  sellingPrice: z.number().min(0, 'Selling price must be >= 0'),
  mrp: z.number().min(0, 'MRP must be >= 0'),
});

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'SKU is required').max(50),
    name: z.string().min(1, 'Product name is required').max(200),
    category: z.string().min(1, 'Category is required').max(100),
    subcategory: z.string().max(100).optional(),
    unit: unitEnum.optional().default('piece'),
    price: priceSchema,
    currentStock: z.number().min(0).optional().default(0),
    reorderLevel: z.number().min(0).optional().default(10),
    reorderQuantity: z.number().min(0).optional().default(50),
    leadTimeDays: z.number().min(0).optional(),
    barcode: z.string().max(50).optional(),
    tags: z.array(z.string().max(50)).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(200).optional(),
    category: z.string().min(1).max(100).optional(),
    subcategory: z.string().max(100).optional(),
    unit: unitEnum.optional(),
    price: priceSchema.partial().optional(),
    currentStock: z.number().min(0).optional(),
    reorderLevel: z.number().min(0).optional(),
    reorderQuantity: z.number().min(0).optional(),
    leadTimeDays: z.number().min(0).optional(),
    barcode: z.string().max(50).optional(),
    tags: z.array(z.string().max(50)).optional(),
  }),
  params: z.object({
    productId: z.string().min(1),
  }),
});
