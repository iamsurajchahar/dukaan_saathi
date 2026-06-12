/**
 * Seasonal pattern detection for demand forecasting.
 */

import { mean } from './utils';

export interface WeeklyPattern {
  dayOfWeekFactors: number[]; // index 0 = Sunday, 6 = Saturday
  isSignificant: boolean;
}

export interface MonthlyPattern {
  weekOfMonthFactors: number[]; // index 0 = week 1, up to 4 weeks
  isSignificant: boolean;
}

export interface FestivalPeriod {
  start: string;
  end: string;
  multiplier: number;
}

export interface SeasonalPatterns {
  weekly?: WeeklyPattern;
  monthly?: MonthlyPattern;
  festivals?: FestivalPeriod[];
}

/**
 * Detects weekly patterns by comparing per-day-of-week averages
 * against the overall mean.
 * Significant if max factor > 1.3 or min factor < 0.7.
 */
export function detectWeeklyPattern(
  dailySales: number[],
  dates: Date[]
): WeeklyPattern {
  const dayBuckets: number[][] = [[], [], [], [], [], [], []]; // Sun-Sat

  const len = Math.min(dailySales.length, dates.length);
  for (let i = 0; i < len; i++) {
    const dayOfWeek = new Date(dates[i]).getDay();
    dayBuckets[dayOfWeek].push(dailySales[i]);
  }

  const overallMean = mean(dailySales);
  if (overallMean === 0) {
    return {
      dayOfWeekFactors: new Array(7).fill(1),
      isSignificant: false,
    };
  }

  const dayOfWeekFactors = dayBuckets.map((bucket) => {
    if (bucket.length === 0) return 1;
    return mean(bucket) / overallMean;
  });

  const maxFactor = Math.max(...dayOfWeekFactors);
  const minFactor = Math.min(...dayOfWeekFactors);
  const isSignificant = maxFactor > 1.3 || minFactor < 0.7;

  return { dayOfWeekFactors, isSignificant };
}

/**
 * Detects monthly patterns by comparing per-week-of-month averages
 * against the overall mean.
 * Week of month is determined by: floor((dayOfMonth - 1) / 7).
 * Significant if max factor > 1.3 or min factor < 0.7.
 */
export function detectMonthlyPattern(
  dailySales: number[],
  dates: Date[]
): MonthlyPattern {
  const weekBuckets: number[][] = [[], [], [], [], []]; // up to 5 weeks

  const len = Math.min(dailySales.length, dates.length);
  for (let i = 0; i < len; i++) {
    const d = new Date(dates[i]);
    const weekOfMonth = Math.min(4, Math.floor((d.getDate() - 1) / 7));
    weekBuckets[weekOfMonth].push(dailySales[i]);
  }

  const overallMean = mean(dailySales);
  if (overallMean === 0) {
    return {
      weekOfMonthFactors: new Array(5).fill(1),
      isSignificant: false,
    };
  }

  const weekOfMonthFactors = weekBuckets.map((bucket) => {
    if (bucket.length === 0) return 1;
    return mean(bucket) / overallMean;
  });

  const maxFactor = Math.max(...weekOfMonthFactors);
  const minFactor = Math.min(...weekOfMonthFactors);
  const isSignificant = maxFactor > 1.3 || minFactor < 0.7;

  return { weekOfMonthFactors, isSignificant };
}

/**
 * Detects festival/spike seasons where sales exceed 2x the rolling 30-day mean.
 * Returns contiguous periods with their multiplier relative to the rolling mean.
 */
export function detectFestivalSeasons(
  dailySales: number[],
  dates: Date[]
): { periods: FestivalPeriod[] } {
  const periods: FestivalPeriod[] = [];
  if (dailySales.length < 30) return { periods };

  // Compute rolling 30-day mean for each day
  const rollingMean: number[] = [];
  let windowSum = 0;

  for (let i = 0; i < 30; i++) {
    windowSum += dailySales[i];
  }

  for (let i = 0; i < 30; i++) {
    rollingMean.push(windowSum / 30);
  }

  for (let i = 30; i < dailySales.length; i++) {
    windowSum += dailySales[i] - dailySales[i - 30];
    rollingMean.push(windowSum / 30);
  }

  // Find contiguous windows where sales exceed 2x the rolling mean
  let periodStart: number | null = null;
  let periodSalesSum = 0;
  let periodRollingSum = 0;
  let periodDays = 0;

  for (let i = 0; i < dailySales.length; i++) {
    const threshold = rollingMean[i] * 2;
    const isSpike = rollingMean[i] > 0 && dailySales[i] > threshold;

    if (isSpike) {
      if (periodStart === null) {
        periodStart = i;
        periodSalesSum = 0;
        periodRollingSum = 0;
        periodDays = 0;
      }
      periodSalesSum += dailySales[i];
      periodRollingSum += rollingMean[i];
      periodDays++;
    } else if (periodStart !== null) {
      // End of spike period
      const startDate = new Date(dates[periodStart]);
      const endDate = new Date(dates[i - 1]);
      const multiplier =
        periodRollingSum > 0 ? periodSalesSum / periodRollingSum : 1;

      periods.push({
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        multiplier: Math.round(multiplier * 100) / 100,
      });

      periodStart = null;
    }
  }

  // Handle trailing spike
  if (periodStart !== null) {
    const startDate = new Date(dates[periodStart]);
    const endDate = new Date(dates[dailySales.length - 1]);
    const multiplier =
      periodRollingSum > 0 ? periodSalesSum / periodRollingSum : 1;

    periods.push({
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      multiplier: Math.round(multiplier * 100) / 100,
    });
  }

  return { periods };
}

/**
 * Returns a seasonal multiplier for a future date based on detected patterns.
 * Combines weekly and monthly factors multiplicatively if both are significant.
 */
export function getSeasonalMultiplier(
  date: Date,
  patterns: SeasonalPatterns
): number {
  let multiplier = 1;

  if (patterns.weekly?.isSignificant) {
    const dayOfWeek = date.getDay();
    multiplier *= patterns.weekly.dayOfWeekFactors[dayOfWeek];
  }

  if (patterns.monthly?.isSignificant) {
    const weekOfMonth = Math.min(4, Math.floor((date.getDate() - 1) / 7));
    multiplier *= patterns.monthly.weekOfMonthFactors[weekOfMonth];
  }

  // Check festival periods — if the date falls within a known festival window,
  // apply the festival multiplier
  if (patterns.festivals && patterns.festivals.length > 0) {
    const dateStr = date.toISOString().split('T')[0];
    for (const period of patterns.festivals) {
      if (dateStr >= period.start && dateStr <= period.end) {
        multiplier *= period.multiplier;
        break;
      }
    }
  }

  return Math.max(0, multiplier);
}
