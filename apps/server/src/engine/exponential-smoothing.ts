/**
 * Exponential smoothing forecasting methods.
 */

/**
 * Simple Exponential Smoothing (SES).
 * alpha: smoothing factor (0 < alpha < 1).
 * Returns fitted values and a single-step forecast.
 */
export function simpleExponentialSmoothing(
  data: number[],
  alpha: number
): { fitted: number[]; forecast: number } {
  if (data.length === 0) {
    return { fitted: [], forecast: 0 };
  }

  const fitted: number[] = [data[0]]; // Initialize with first observation

  for (let i = 1; i < data.length; i++) {
    const prev = fitted[i - 1];
    fitted.push(alpha * data[i] + (1 - alpha) * prev);
  }

  const forecast = alpha * data[data.length - 1] + (1 - alpha) * fitted[fitted.length - 1];

  return { fitted, forecast };
}

/**
 * Holt's Linear Trend (Double Exponential Smoothing).
 * alpha: level smoothing factor.
 * beta: trend smoothing factor.
 */
export function holtLinear(
  data: number[],
  alpha: number,
  beta: number
): { fitted: number[]; forecast: (h: number) => number } {
  if (data.length < 2) {
    return {
      fitted: [...data],
      forecast: () => (data.length > 0 ? data[0] : 0),
    };
  }

  // Initialize level and trend
  let level = data[0];
  let trend = data[1] - data[0];

  const fitted: number[] = [level];

  for (let i = 1; i < data.length; i++) {
    const prevLevel = level;
    level = alpha * data[i] + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    fitted.push(level + trend);
  }

  const finalLevel = level;
  const finalTrend = trend;

  return {
    fitted,
    forecast: (h: number) => Math.max(0, finalLevel + h * finalTrend),
  };
}

/**
 * Holt-Winters Triple Exponential Smoothing (additive model).
 * alpha: level smoothing factor.
 * beta: trend smoothing factor.
 * gamma: seasonal smoothing factor.
 * seasonLength: number of periods in one season (e.g. 7 for weekly).
 */
export function holtWinters(
  data: number[],
  alpha: number,
  beta: number,
  gamma: number,
  seasonLength: number
): { fitted: number[]; forecast: (h: number) => number } {
  if (data.length < seasonLength * 2) {
    // Fall back to Holt linear if not enough data for seasonal initialization
    return holtLinear(data, alpha, beta);
  }

  // Initialize seasonal components from the first full season
  const firstSeasonMean =
    data.slice(0, seasonLength).reduce((s, v) => s + v, 0) / seasonLength;

  const seasonal: number[] = new Array(seasonLength);
  for (let i = 0; i < seasonLength; i++) {
    seasonal[i] = data[i] - firstSeasonMean;
  }

  // Initialize level and trend
  let level = firstSeasonMean;
  const secondSeasonMean =
    data.slice(seasonLength, seasonLength * 2).reduce((s, v) => s + v, 0) / seasonLength;
  let trend = (secondSeasonMean - firstSeasonMean) / seasonLength;

  const fitted: number[] = [];

  // Fit the first season using initial values
  for (let i = 0; i < seasonLength; i++) {
    fitted.push(level + trend + seasonal[i]);
  }

  // Update components starting from the second season onwards
  for (let i = seasonLength; i < data.length; i++) {
    const seasonIdx = i % seasonLength;
    const prevLevel = level;

    level = alpha * (data[i] - seasonal[seasonIdx]) + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonal[seasonIdx] = gamma * (data[i] - level) + (1 - gamma) * seasonal[seasonIdx];

    fitted.push(level + trend + seasonal[seasonIdx]);
  }

  const finalLevel = level;
  const finalTrend = trend;
  const finalSeasonal = [...seasonal];

  return {
    fitted,
    forecast: (h: number) => {
      const seasonIdx = (data.length + h - 1) % seasonLength;
      return Math.max(0, finalLevel + h * finalTrend + finalSeasonal[seasonIdx]);
    },
  };
}

/**
 * Grid search to find optimal smoothing parameters.
 * Uses MSE on a holdout set (last 20% of data) to select the best parameters.
 * Step size of 0.1 for speed.
 */
export function optimizeParameters(
  data: number[],
  method: 'ses' | 'holt' | 'holt_winters',
  seasonLength?: number
): { alpha: number; beta?: number; gamma?: number } {
  const holdoutSize = Math.max(1, Math.floor(data.length * 0.2));
  const trainData = data.slice(0, data.length - holdoutSize);
  const testData = data.slice(data.length - holdoutSize);

  let bestMSE = Infinity;
  let bestParams: { alpha: number; beta?: number; gamma?: number } = { alpha: 0.3 };

  const steps = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

  if (method === 'ses') {
    for (const alpha of steps) {
      const result = simpleExponentialSmoothing(trainData, alpha);
      const mse = computeHoldoutMSE(result.fitted, trainData, testData, (h) => result.forecast);
      if (mse < bestMSE) {
        bestMSE = mse;
        bestParams = { alpha };
      }
    }
  } else if (method === 'holt') {
    for (const alpha of steps) {
      for (const beta of steps) {
        const result = holtLinear(trainData, alpha, beta);
        const mse = computeForecastMSE(result.forecast, testData);
        if (mse < bestMSE) {
          bestMSE = mse;
          bestParams = { alpha, beta };
        }
      }
    }
  } else if (method === 'holt_winters') {
    const sl = seasonLength ?? 7;
    if (trainData.length < sl * 2) {
      // Not enough data; fall back to Holt
      return optimizeParameters(data, 'holt');
    }
    for (const alpha of steps) {
      for (const beta of steps) {
        for (const gamma of steps) {
          try {
            const result = holtWinters(trainData, alpha, beta, gamma, sl);
            const mse = computeForecastMSE(result.forecast, testData);
            if (isFinite(mse) && mse < bestMSE) {
              bestMSE = mse;
              bestParams = { alpha, beta, gamma };
            }
          } catch {
            // Skip invalid parameter combinations
          }
        }
      }
    }
  }

  return bestParams;
}

/**
 * Compute MSE for SES (single-step forecast repeated).
 */
function computeHoldoutMSE(
  _fitted: number[],
  _trainData: number[],
  testData: number[],
  forecastFn: (h: number) => number
): number {
  let mse = 0;
  const forecastValue = forecastFn(1);
  for (let i = 0; i < testData.length; i++) {
    mse += (testData[i] - forecastValue) ** 2;
  }
  return mse / testData.length;
}

/**
 * Compute MSE for methods with horizon-based forecast.
 */
function computeForecastMSE(
  forecastFn: (h: number) => number,
  testData: number[]
): number {
  let mse = 0;
  for (let i = 0; i < testData.length; i++) {
    const predicted = forecastFn(i + 1);
    mse += (testData[i] - predicted) ** 2;
  }
  return mse / testData.length;
}
