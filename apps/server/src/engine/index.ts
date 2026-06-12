/**
 * Demand Forecasting Engine - Orchestrator
 *
 * Full pipeline: data fetch -> model selection -> forecast -> inventory math
 */

import mongoose from 'mongoose';
import { Sale } from '../models/sale.model';
import { Product, IProductDocument } from '../models/product.model';
import { Forecast, IForecastDocument } from '../models/forecast.model';

import { mean, standardDeviation, fillMissingDays, mape, mae, rmse } from './utils';
import { simpleMovingAverage, predictNext } from './moving-average';
import {
  simpleExponentialSmoothing,
  holtWinters,
  optimizeParameters,
} from './exponential-smoothing';
import {
  detectWeeklyPattern,
  detectMonthlyPattern,
  getSeasonalMultiplier,
  SeasonalPatterns,
} from './seasonal';
import {
  calculateSafetyStock,
  calculateReorderPoint,
  calculateOrderQuantity,
  calculateRestockDate,
} from './reorder-point';
import { calculateConfidenceInterval, assignPriority } from './confidence';

interface ForecastResult {
  forecast: IForecastDocument;
  method: string;
  metrics: { mae: number; mape: number; rmse: number };
}

/**
 * Generates a complete demand forecast for a product in a store.
 *
 * Pipeline:
 * 1. Fetch last 90 days of sales
 * 2. Fill missing days with 0
 * 3. Validate minimum data (14 days)
 * 4. Split 80/20 train/test
 * 5. Run SMA(7), SES, and Holt-Winters (if >= 28 days)
 * 6. Evaluate each with MAPE on test set
 * 7. Pick best method
 * 8. Generate 30-day predictions
 * 9. Apply seasonal multipliers
 * 10. Calculate inventory metrics
 * 11. Calculate confidence intervals
 * 12. Assign priority
 * 13. Save and return
 */
export async function generateForecast(
  productId: string,
  storeId: string
): Promise<ForecastResult | null> {
  // 1. Fetch last 90 days of sales
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  startDate.setHours(0, 0, 0, 0);

  const salesAgg = await Sale.aggregate([
    {
      $match: {
        storeId: new mongoose.Types.ObjectId(storeId),
        saleDate: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: '$items' },
    {
      $match: {
        'items.productId': new mongoose.Types.ObjectId(productId),
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$saleDate' },
        },
        totalQty: { $sum: '$items.quantity' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Build date-to-sales map
  const salesByDate = new Map<string, number>();
  for (const entry of salesAgg) {
    salesByDate.set(entry._id, entry.totalQty);
  }

  // 2. Fill missing days
  const dailySales = fillMissingDays(salesByDate, startDate, endDate);

  // Build parallel dates array
  const dates: Date[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  // 3. Insufficient data check
  if (dailySales.length < 14) {
    return null;
  }

  // 4. Split 80/20
  const splitIdx = Math.floor(dailySales.length * 0.8);
  const trainData = dailySales.slice(0, splitIdx);
  const testData = dailySales.slice(splitIdx);

  // 5. Run candidate models on train set
  interface CandidateModel {
    name: string;
    methodEnum: string;
    testPredictions: number[];
    forecastFn: (h: number) => number;
    params: Record<string, number>;
    residuals: number[];
  }

  const candidates: CandidateModel[] = [];

  // --- SMA (7-day) ---
  if (trainData.length >= 7) {
    const smaValues = simpleMovingAverage(trainData, 7);
    // Predict test set using SMA
    const smaPredictions = predictNext(trainData, 7, testData.length);

    // Residuals from train fit
    const smaTrainFitted = smaValues;
    const smaResiduals: number[] = [];
    for (let i = 0; i < smaTrainFitted.length; i++) {
      smaResiduals.push(trainData[i + 6] - smaTrainFitted[i]);
    }

    candidates.push({
      name: 'SMA-7',
      methodEnum: 'moving_avg',
      testPredictions: smaPredictions,
      forecastFn: (_h: number) => {
        // Re-run predictNext with full data for actual forecasting
        return -1; // placeholder, replaced below
      },
      params: { windowSize: 7 },
      residuals: smaResiduals,
    });
  }

  // --- SES ---
  {
    const optSES = optimizeParameters(trainData, 'ses');
    const sesResult = simpleExponentialSmoothing(trainData, optSES.alpha);
    const sesPredictions = new Array(testData.length).fill(sesResult.forecast);

    const sesResiduals: number[] = [];
    for (let i = 0; i < sesResult.fitted.length; i++) {
      sesResiduals.push(trainData[i] - sesResult.fitted[i]);
    }

    candidates.push({
      name: 'SES',
      methodEnum: 'exp_smoothing',
      testPredictions: sesPredictions,
      forecastFn: (_h: number) => sesResult.forecast,
      params: { alpha: optSES.alpha },
      residuals: sesResiduals,
    });
  }

  // --- Holt-Winters (if >= 28 days) ---
  if (trainData.length >= 28) {
    const seasonLength = 7;
    const optHW = optimizeParameters(trainData, 'holt_winters', seasonLength);
    const hwResult = holtWinters(
      trainData,
      optHW.alpha,
      optHW.beta ?? 0.1,
      optHW.gamma ?? 0.1,
      seasonLength
    );

    const hwPredictions: number[] = [];
    for (let h = 1; h <= testData.length; h++) {
      hwPredictions.push(hwResult.forecast(h));
    }

    const hwResiduals: number[] = [];
    for (let i = 0; i < hwResult.fitted.length; i++) {
      hwResiduals.push(trainData[i] - hwResult.fitted[i]);
    }

    candidates.push({
      name: 'Holt-Winters',
      methodEnum: 'holt_winters',
      testPredictions: hwPredictions,
      forecastFn: hwResult.forecast,
      params: {
        alpha: optHW.alpha,
        beta: optHW.beta ?? 0.1,
        gamma: optHW.gamma ?? 0.1,
      },
      residuals: hwResiduals,
    });
  }

  // 6. Evaluate each on test set using MAPE
  let bestCandidate = candidates[0];
  let bestMAPE = Infinity;

  for (const candidate of candidates) {
    const candidateMAPE = mape(testData, candidate.testPredictions);
    if (candidateMAPE < bestMAPE) {
      bestMAPE = candidateMAPE;
      bestCandidate = candidate;
    }
  }

  // 7. Re-fit the best method on the full dataset for final forecasting
  let finalForecastFn: (h: number) => number;
  let finalResiduals: number[];
  let finalParams = bestCandidate.params;

  if (bestCandidate.methodEnum === 'moving_avg') {
    const fullPredictions = predictNext(dailySales, 7, 30);
    finalForecastFn = (h: number) => fullPredictions[h - 1] ?? fullPredictions[fullPredictions.length - 1];
    const fullSMA = simpleMovingAverage(dailySales, 7);
    finalResiduals = [];
    for (let i = 0; i < fullSMA.length; i++) {
      finalResiduals.push(dailySales[i + 6] - fullSMA[i]);
    }
  } else if (bestCandidate.methodEnum === 'exp_smoothing') {
    const fullSES = simpleExponentialSmoothing(dailySales, finalParams.alpha!);
    finalForecastFn = (_h: number) => fullSES.forecast;
    finalResiduals = [];
    for (let i = 0; i < fullSES.fitted.length; i++) {
      finalResiduals.push(dailySales[i] - fullSES.fitted[i]);
    }
  } else {
    // holt_winters
    const sl = 7;
    const fullHW = holtWinters(
      dailySales,
      finalParams.alpha!,
      finalParams.beta ?? 0.1,
      finalParams.gamma ?? 0.1,
      sl
    );
    finalForecastFn = fullHW.forecast;
    finalResiduals = [];
    for (let i = 0; i < fullHW.fitted.length; i++) {
      finalResiduals.push(dailySales[i] - fullHW.fitted[i]);
    }
  }

  // 8. Generate 30-day predictions
  const rawPredictions: number[] = [];
  for (let h = 1; h <= 30; h++) {
    rawPredictions.push(Math.max(0, finalForecastFn(h)));
  }

  // 9. Detect seasonal patterns and apply multipliers
  const weeklyPattern = detectWeeklyPattern(dailySales, dates);
  const monthlyPattern = detectMonthlyPattern(dailySales, dates);
  const patterns: SeasonalPatterns = {
    weekly: weeklyPattern,
    monthly: monthlyPattern,
  };

  const adjustedPredictions: number[] = [];
  const predictionDates: Date[] = [];

  for (let h = 0; h < 30; h++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + h + 1);
    predictionDates.push(futureDate);

    const multiplier = getSeasonalMultiplier(futureDate, patterns);
    adjustedPredictions.push(Math.max(0, rawPredictions[h] * multiplier));
  }

  // 10. Calculate inventory metrics
  const product = await Product.findById(productId);
  if (!product) {
    return null;
  }

  const avgDailySales = mean(dailySales);
  const dailySalesStdDev = standardDeviation(dailySales);
  const leadTimeDays = product.leadTimeDays || 3;

  const safetyStock = calculateSafetyStock(dailySalesStdDev, leadTimeDays);
  const reorderPoint = calculateReorderPoint(avgDailySales, leadTimeDays, safetyStock);
  const suggestedOrderQty = calculateOrderQuantity(
    avgDailySales,
    7, // weekly review period
    leadTimeDays,
    product.currentStock,
    safetyStock
  );
  const suggestedOrderDate = calculateRestockDate(
    product.currentStock,
    avgDailySales,
    reorderPoint
  );

  // 11. Confidence intervals
  const intervals = calculateConfidenceInterval(adjustedPredictions, finalResiduals);

  // 12. Assign priority
  const daysUntilStockout =
    avgDailySales > 0 ? product.currentStock / avgDailySales : 365;
  const priority = assignPriority(product.currentStock, reorderPoint, daysUntilStockout);

  // Calculate test metrics for storage
  const testMetrics = {
    mae: mae(testData, bestCandidate.testPredictions),
    mape: bestMAPE,
    rmse: rmse(testData, bestCandidate.testPredictions),
  };

  // 13. Save forecast
  const predictions = adjustedPredictions.map((pred, i) => ({
    date: predictionDates[i],
    predictedDemand: Math.round(pred * 100) / 100,
    confidenceLow: Math.round(intervals[i].low * 100) / 100,
    confidenceHigh: Math.round(intervals[i].high * 100) / 100,
  }));

  const forecast = await Forecast.create({
    storeId: new mongoose.Types.ObjectId(storeId),
    productId: new mongoose.Types.ObjectId(productId),
    generatedAt: new Date(),
    method: bestCandidate.methodEnum,
    parameters: {
      windowSize: finalParams.windowSize,
      alpha: finalParams.alpha,
      beta: finalParams.beta,
      gamma: finalParams.gamma,
    },
    predictions,
    metrics: {
      mae: Math.round(testMetrics.mae * 100) / 100,
      mape: Math.round(testMetrics.mape * 100) / 100,
      rmse: Math.round(testMetrics.rmse * 100) / 100,
    },
    reorderPoint,
    safetyStock,
    suggestedOrderQty,
    suggestedOrderDate,
    priority,
  });

  return {
    forecast,
    method: bestCandidate.name,
    metrics: testMetrics,
  };
}
