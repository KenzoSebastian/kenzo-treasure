"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Analytics & Financial Aggregation Engine (Fase B12)
 * ==============================================================================
 *
 * Menyediakan antarmuka Server Actions untuk agregasi data grafik Recharts:
 * - `getSavingsGrowthTrend(userId, year)`
 * - `getMonthlyCashflowSummary(userId, year)`
 * - `getYearlyComparison(userId)`
 * - `getCategoryExpenseDistribution(monthId, userId)`
 * - `getAnalyticsDashboardData(userId, year)`
 */

import {
  getSavingsGrowthTrend,
  getMonthlyCashflowSummary,
  getYearlyComparison,
  getCategoryExpenseDistribution,
  getAnalyticsDashboardData,
} from "@/lib/queries/analytics";

export {
  getSavingsGrowthTrend,
  getMonthlyCashflowSummary,
  getYearlyComparison,
  getCategoryExpenseDistribution,
  getAnalyticsDashboardData,
};
