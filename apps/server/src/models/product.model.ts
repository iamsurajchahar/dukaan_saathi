import mongoose, { Document, Schema } from 'mongoose';

export interface IProductDocument extends Document {
  storeId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  category: string;
  subcategory?: string;
  unit: string;
  price: {
    costPrice: number;
    sellingPrice: number;
    mrp: number;
  };
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  leadTimeDays: number;
  barcode?: string;
  isActive: boolean;
  tags: string[];
  lastOrderedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProductDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    sku: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    subcategory: { type: String, trim: true },
    unit: {
      type: String,
      enum: ['piece', 'kg', 'litre', 'pack', 'dozen'],
      default: 'piece',
    },
    price: {
      costPrice: { type: Number, required: true, min: 0 },
      sellingPrice: { type: Number, required: true, min: 0 },
      mrp: { type: Number, required: true, min: 0 },
    },
    currentStock: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 10, min: 0 },
    reorderQuantity: { type: Number, default: 50, min: 0 },
    leadTimeDays: { type: Number, default: 3, min: 0 },
    barcode: String,
    isActive: { type: Boolean, default: true },
    tags: [{ type: String, trim: true }],
    lastOrderedAt: Date,
  },
  { timestamps: true }
);

productSchema.index({ storeId: 1, sku: 1 }, { unique: true });
productSchema.index({ storeId: 1, category: 1 });
productSchema.index({ storeId: 1, currentStock: 1 });
productSchema.index({ storeId: 1, name: 'text' });

export const Product = mongoose.model<IProductDocument>('Product', productSchema);
