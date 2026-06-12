import mongoose, { Document, Schema } from 'mongoose';

export interface IForecastDocument extends Document {
  storeId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  generatedAt: Date;
  method: string;
  parameters: {
    windowSize?: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
  };
  predictions: {
    date: Date;
    predictedDemand: number;
    confidenceLow: number;
    confidenceHigh: number;
  }[];
  metrics: {
    mae: number;
    mape: number;
    rmse: number;
  };
  reorderPoint: number;
  safetyStock: number;
  suggestedOrderQty: number;
  suggestedOrderDate: Date;
  priority: string;
  expiresAt: Date;
}

const forecastSchema = new Schema<IForecastDocument>({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  generatedAt: { type: Date, default: Date.now },
  method: {
    type: String,
    enum: ['moving_avg', 'exp_smoothing', 'holt_winters', 'hybrid'],
    required: true,
  },
  parameters: {
    windowSize: Number,
    alpha: Number,
    beta: Number,
    gamma: Number,
  },
  predictions: [
    {
      date: { type: Date, required: true },
      predictedDemand: { type: Number, required: true },
      confidenceLow: { type: Number, required: true },
      confidenceHigh: { type: Number, required: true },
    },
  ],
  metrics: {
    mae: { type: Number, required: true },
    mape: { type: Number, required: true },
    rmse: { type: Number, required: true },
  },
  reorderPoint: { type: Number, required: true },
  safetyStock: { type: Number, required: true },
  suggestedOrderQty: { type: Number, required: true },
  suggestedOrderDate: { type: Date, required: true },
  priority: {
    type: String,
    enum: ['critical', 'warning', 'ok'],
    required: true,
  },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
});

forecastSchema.index({ storeId: 1, productId: 1, generatedAt: -1 });
forecastSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Forecast = mongoose.model<IForecastDocument>('Forecast', forecastSchema);
