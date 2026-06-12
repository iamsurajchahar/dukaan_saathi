export type ForecastMethod = 'moving_avg' | 'exp_smoothing' | 'holt_winters' | 'hybrid';
export type RestockPriority = 'critical' | 'warning' | 'ok';

export interface IPrediction {
  date: string;
  predictedDemand: number;
  confidenceLow: number;
  confidenceHigh: number;
}

export interface IForecastMetrics {
  mae: number;
  mape: number;
  rmse: number;
}

export interface IForecast {
  _id: string;
  storeId: string;
  productId: string;
  generatedAt: string;
  method: ForecastMethod;
  parameters: {
    windowSize?: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
  };
  predictions: IPrediction[];
  metrics: IForecastMetrics;
  reorderPoint: number;
  safetyStock: number;
  suggestedOrderQty: number;
  suggestedOrderDate: string;
  priority: RestockPriority;
}

export interface IRestockRecommendation {
  product: {
    _id: string;
    name: string;
    sku: string;
    currentStock: number;
    reorderLevel: number;
  };
  forecast: {
    suggestedOrderQty: number;
    suggestedOrderDate: string;
    priority: RestockPriority;
    confidence: number;
    daysUntilStockout: number;
  };
}
