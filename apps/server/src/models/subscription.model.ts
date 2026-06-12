import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  plan: string;
  status: string;
  limits: {
    maxStores: number;
    maxSkusPerStore: number;
  };
  paymentProvider?: string;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'past_due', 'cancelled', 'trialing'],
      default: 'active',
    },
    limits: {
      maxStores: { type: Number, default: 1 },
      maxSkusPerStore: { type: Number, default: 50 },
    },
    paymentProvider: {
      type: String,
      enum: ['razorpay'],
    },
    providerSubscriptionId: String,
    providerCustomerId: String,
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelledAt: Date,
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ providerSubscriptionId: 1 });

export const Subscription = mongoose.model<ISubscriptionDocument>('Subscription', subscriptionSchema);
