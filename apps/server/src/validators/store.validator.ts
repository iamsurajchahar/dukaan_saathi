import { z } from 'zod';

const storeCategory = z.enum([
  'grocery',
  'pharmacy',
  'electronics',
  'clothing',
  'general',
  'other',
]);

const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required').max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().min(1, 'Pincode is required').max(10),
});

export const createStoreSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Store name is required').max(100),
    category: storeCategory.optional().default('general'),
    address: addressSchema,
    phone: z.string().max(20).optional(),
    gstNumber: z.string().max(20).optional(),
  }),
});

export const updateStoreSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Store name is required').max(100).optional(),
    category: storeCategory.optional(),
    address: addressSchema.partial().optional(),
    phone: z.string().max(20).optional(),
    gstNumber: z.string().max(20).optional(),
  }),
  params: z.object({
    storeId: z.string().min(1),
  }),
});
