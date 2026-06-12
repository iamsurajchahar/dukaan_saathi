/**
 * Moving average forecasting methods.
 */

/**
 * Simple Moving Average.
 * Returns an array of length (data.length - windowSize + 1).
 * Each value is the mean of the preceding `windowSize` data points.
 */
export function simpleMovingAverage(data: number[], windowSize: number): number[] {
  if (windowSize <= 0 || windowSize > data.length) return [];

  const result: number[] = [];
  let windowSum = 0;

  for (let i = 0; i < windowSize; i++) {
    windowSum += data[i];
  }
  result.push(windowSum / windowSize);

  for (let i = windowSize; i < data.length; i++) {
    windowSum += data[i] - data[i - windowSize];
    result.push(windowSum / windowSize);
  }

  return result;
}

/**
 * Weighted Moving Average.
 * Weights array should have the same length as the window.
 * Weights are applied so that the last weight corresponds to the most recent value.
 * Returns an array of length (data.length - weights.length + 1).
 */
export function weightedMovingAverage(data: number[], weights: number[]): number[] {
  const windowSize = weights.length;
  if (windowSize <= 0 || windowSize > data.length) return [];

  const weightSum = weights.reduce((s, w) => s + w, 0);
  if (weightSum === 0) return [];

  const normalizedWeights = weights.map((w) => w / weightSum);
  const result: number[] = [];

  for (let i = windowSize - 1; i < data.length; i++) {
    let value = 0;
    for (let j = 0; j < windowSize; j++) {
      value += data[i - windowSize + 1 + j] * normalizedWeights[j];
    }
    result.push(value);
  }

  return result;
}

/**
 * Projects forward N days using a simple moving average.
 * Each new predicted value is appended to the window and used
 * in subsequent predictions.
 */
export function predictNext(
  data: number[],
  windowSize: number,
  horizon: number
): number[] {
  if (data.length < windowSize || windowSize <= 0) return [];

  const extended = [...data];
  const predictions: number[] = [];

  for (let h = 0; h < horizon; h++) {
    const window = extended.slice(extended.length - windowSize);
    const avg = window.reduce((s, v) => s + v, 0) / windowSize;
    const predicted = Math.max(0, avg);
    predictions.push(predicted);
    extended.push(predicted);
  }

  return predictions;
}
