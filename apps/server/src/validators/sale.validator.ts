import { z } from 'zod';

const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be >= 0'),
});

export const recordSaleSchema = z.object({
  body: z.object({
    items: z
      .array(saleItemSchema)
      .min(1, 'At least one item is required'),
    saleDate: z.string().datetime().optional(),
    notes: z.string().max(500).optional(),
  }),
});
