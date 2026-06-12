/**
 * Statistical utility functions for the demand forecasting engine.
 */

export function mean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, v) => sum + v, 0) / data.length;
}

export function standardDeviation(data: number[]): number {
  if (data.length < 2) return 0;
  const avg = mean(data);
  const squaredDiffs = data.reduce((sum, v) => sum + (v - avg) ** 2, 0);
  return Math.sqrt(squaredDiffs / (data.length - 1));
}

/**
 * Returns the z-score for common confidence levels.
 * Uses a lookup table for standard values.
 */
export function zScore(confidenceLevel: number): number {
  const table: Record<number, number> = {
    0.90: 1.28,
    0.95: 1.65,
    0.99: 2.33,
  };

  const rounded = Math.round(confidenceLevel * 100) / 100;
  if (table[rounded] !== undefined) {
    return table[rounded];
  }

  // Linear interpolation for values between known points
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (rounded < keys[0]) return table[keys[0]];
  if (rounded > keys[keys.length - 1]) return table[keys[keys.length - 1]];

  for (let i = 0; i < keys.length - 1; i++) {
    if (rounded >= keys[i] && rounded <= keys[i + 1]) {
      const t = (rounded - keys[i]) / (keys[i + 1] - keys[i]);
      return table[keys[i]] + t * (table[keys[i + 1]] - table[keys[i]]);
    }
  }

  return 1.65; // default to 95%
}

/**
 * Mean Absolute Percentage Error.
 * Skips entries where actual is zero to avoid division by zero.
 */
export function mape(actual: number[], predicted: number[]): number {
  const len = Math.min(actual.length, predicted.length);
  let sum = 0;
  let count = 0;

  for (let i = 0; i < len; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      count++;
    }
  }

  return count === 0 ? 0 : (sum / count) * 100;
}

/**
 * Mean Absolute Error.
 */
export function mae(actual: number[], predicted: number[]): number {
  const len = Math.min(actual.length, predicted.length);
  if (len === 0) return 0;

  let sum = 0;
  for (let i = 0; i < len; i++) {
    sum += Math.abs(actual[i] - predicted[i]);
  }
  return sum / len;
}

/**
 * Root Mean Squared Error.
 */
export function rmse(actual: number[], predicted: number[]): number {
  const len = Math.min(actual.length, predicted.length);
  if (len === 0) return 0;

  let sum = 0;
  for (let i = 0; i < len; i++) {
    sum += (actual[i] - predicted[i]) ** 2;
  }
  return Math.sqrt(sum / len);
}

/**
 * Fills missing days in a date range with 0, returning a dense array
 * of daily values from startDate to endDate inclusive.
 */
export function fillMissingDays(
  salesByDate: Map<string, number>,
  startDate: Date,
  endDate: Date
): number[] {
  const result: number[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const key = current.toISOString().split('T')[0];
    result.push(salesByDate.get(key) ?? 0);
    current.setDate(current.getDate() + 1);
  }

  return result;
}
