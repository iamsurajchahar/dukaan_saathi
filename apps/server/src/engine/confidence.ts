/**
 * Confidence interval calculation and priority assignment.
 */

import { zScore, standardDeviation } from './utils';

/**
 * Calculates confidence intervals for predictions based on residuals.
 *
 * @param predictions - Array of predicted values
 * @param residuals - Array of (actual - predicted) residuals from the training fit
 * @param level - Confidence level (default 0.95)
 * @returns Array of { low, high } intervals for each prediction
 */
export function calculateConfidenceInterval(
  predictions: number[],
  residuals: number[],
  level: number = 0.95
): { low: number; high: number }[] {
  const z = zScore(level);
  const residualStdDev = standardDeviation(residuals);

  return predictions.map((pred) => {
    const margin = z * residualStdDev;
    return {
      low: Math.max(0, pred - margin),
      high: pred + margin,
    };
  });
}

/**
 * Assigns a priority level based on stock position relative to the reorder point
 * and projected days until stockout.
 *
 * - critical: current stock is below ROP, or stockout in less than 2 days
 * - warning: stockout in less than 7 days
 * - ok: otherwise
 */
export function assignPriority(
  currentStock: number,
  reorderPoint: number,
  daysUntilStockout: number
): 'critical' | 'warning' | 'ok' {
  if (currentStock <= reorderPoint || daysUntilStockout < 2) {
    return 'critical';
  }

  if (daysUntilStockout < 7) {
    return 'warning';
  }

  return 'ok';
}
