/**
 * ==============================================================================
 * Kenzo Treasury — Shared Analytics & Aggregation Types (Fase B12)
 * ==============================================================================
 */

import type { CategoryGroup } from "@/db/schema";

export interface SavingsGrowthPoint {
  monthId: string;
  monthName: string;
  shortMonth: string;
  year: number;
  monthIndex: number;
  netSavings: number;
  cumulativeSavings: number;
  savingsRate: number;
}

export interface MonthlyCashflowPoint {
  monthId: string;
  monthName: string;
  shortMonth: string;
  year: number;
  monthIndex: number;
  income: number;
  expense: number;
  netSavings: number;
  savingsRate: number;
}

export interface YearlyComparisonItem {
  year: number;
  totalIncome: number;
  totalExpense: number;
  totalNetSavings: number;
  averageSavingsRate: number;
  monthsCount: number;
}

export interface CategoryDistributionItem {
  categoryId: string;
  categoryName: string;
  icon: string;
  group: CategoryGroup;
  amount: number;
  target: number;
  percentageOfTotal: number;
}

export interface AnalyticsMonthOption {
  id: string;
  name: string;
  shortMonth: string;
  monthIndex: number;
}

export interface AnalyticsDashboardData {
  selectedYear: number;
  availableYears: number[];
  availableMonths?: AnalyticsMonthOption[];
  savingsGrowth: SavingsGrowthPoint[];
  monthlyCashflow: MonthlyCashflowPoint[];
  yearlyComparison: YearlyComparisonItem[];
  categoryDistribution: CategoryDistributionItem[];
  categoryDistributionByMonth?: Record<string, CategoryDistributionItem[]>;
}
