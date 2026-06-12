import mongoose, { Document, Schema } from 'mongoose';

export interface ISaleDocument extends Document {
  storeId: mongoose.Types.ObjectId;
  items: {
    productId: mongoose.Types.ObjectId;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  totalAmount: number;
  saleDate: Date;
  recordedBy: mongoose.Types.ObjectId;
  source: string;
  notes?: string;
  createdAt: Date;
}

const saleSchema = new Schema<ISaleDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        sku: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    saleDate: { type: Date, required: true, default: Date.now },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    source: {
      type: String,
      enum: ['manual', 'csv_import', 'pos'],
      default: 'manual',
    },
    notes: String,
  },
  { timestamps: true }
);

saleSchema.index({ storeId: 1, saleDate: -1 });
saleSchema.index({ storeId: 1, 'items.productId': 1, saleDate: -1 });

export const Sale = mongoose.model<ISaleDocument>('Sale', saleSchema);
