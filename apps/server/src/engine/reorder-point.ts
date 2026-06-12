/**
 * Inventory reorder point and order quantity calculations.
 */

import { zScore } from './utils';

/**
 * Calculates safety stock using the standard formula:
 * Safety Stock = Z * stdDev(dailySales) * sqrt(leadTime)
 *
 * @param dailySalesStdDev - Standard deviation of daily sales
 * @param leadTimeDays - Supplier lead time in days
 * @param serviceLevel - Desired service level (default 0.95 = 95%)
 */
export function calculateSafetyStock(
  dailySalesStdDev: number,
  leadTimeDays: number,
  serviceLevel: number = 0.95
): number {
  const z = zScore(serviceLevel);
  return Math.ceil(z * dailySalesStdDev * Math.sqrt(leadTimeDays));
}

/**
 * Calculates the reorder point:
 * ROP = (avgDailySales * leadTime) + safetyStock
 */
export function calculateReorderPoint(
  avgDailySales: number,
  leadTimeDays: number,
  safetyStock: number
): number {
  return Math.ceil(avgDailySales * leadTimeDays + safetyStock);
}

/**
 * Calculates the suggested order quantity using a periodic review model:
 * OrderQty = max(0, avgDailySales * (reviewPeriod + leadTime) + safetyStock - currentStock)
 *
 * This ensures stock covers both the review period and lead time,
 * plus the safety buffer.
 */
export function calculateOrderQuantity(
  avgDailySales: number,
  reviewPeriodDays: number,
  leadTimeDays: number,
  currentStock: number,
  safetyStock: number
): number {
  const targetStock =
    avgDailySales * (reviewPeriodDays + leadTimeDays) + safetyStock;
  return Math.max(0, Math.ceil(targetStock - currentStock));
}

/**
 * Calculates the estimated date when stock will drop to the reorder point.
 * If current stock is already at or below ROP, returns today.
 * If avgDailySales is 0, returns a date far in the future.
 */
export function calculateRestockDate(
  currentStock: number,
  avgDailySales: number,
  reorderPoint: number
): Date {
  if (currentStock <= reorderPoint) {
    return new Date();
  }

  if (avgDailySales <= 0) {
    // No sales — stock won't deplete
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 1);
    return farFuture;
  }

  const daysUntilROP = (currentStock - reorderPoint) / avgDailySales;
  const restockDate = new Date();
  restockDate.setDate(restockDate.getDate() + Math.floor(daysUntilROP));

  return restockDate;
}
