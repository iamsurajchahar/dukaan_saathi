import mongoose, { Document, Schema } from 'mongoose';

export interface IStoreDocument extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  phone?: string;
  gstNumber?: string;
  settings: {
    currency: string;
    timezone: string;
    lowStockThreshold: number;
    defaultLeadTimeDays: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStoreDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['grocery', 'pharmacy', 'electronics', 'clothing', 'general', 'other'],
      default: 'general',
    },
    address: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    phone: String,
    gstNumber: String,
    settings: {
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      lowStockThreshold: { type: Number, default: 10 },
      defaultLeadTimeDays: { type: Number, default: 3 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storeSchema.index({ ownerId: 1 });

export const Store = mongoose.model<IStoreDocument>('Store', storeSchema);
