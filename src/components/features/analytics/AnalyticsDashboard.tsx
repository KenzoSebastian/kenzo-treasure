"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Recharts Analytics Dashboard (4-Tier Architecture)
 * ==============================================================================
 *
 * Menyajikan pusat analitik arus kas, pengeluaran, dan disiplin anggaran
 * dengan prinsip 1 Grafik = 1 Pertanyaan Finansial:
 * - Header: Filter Tahun terpadu (?year=...)
 * - Tier 1: 4 Kartu KPI Ringkas (`AnalyticsKpiGrid`)
 * - Tier 2: Grouped Bar Chart Arus Kas Bulanan (`MonthlyCashflowChart`)
 * - Tier 3: Donut Chart & Ranking Pos Pengeluaran (`ExpenseDonutSection`)
 * - Tier 4: Target vs Realisasi Anggaran & Tren Savings Rate (`BudgetDisciplineSection`)
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { SlidingSegmentedControl } from "@/components/common/SlidingSegmentedControl";
import { AnalyticsKpiGrid } from "./AnalyticsKpiGrid";
import { MonthlyCashflowChart } from "./MonthlyCashflowChart";
import { ExpenseDonutSection } from "./ExpenseDonutSection";
import { BudgetDisciplineSection } from "./BudgetDisciplineSection";
import type { AnalyticsDashboardData } from "@/types/analytics";

interface AnalyticsDashboardProps {
  data: AnalyticsDashboardData;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const router = useRouter();

  const availableYears = React.useMemo(() => {
    const years =
      data.availableYears.length > 0
        ? data.availableYears
        : [data.selectedYear];
    return Array.from(new Set(years)).sort((a, b) => a - b);
  }, [data.availableYears, data.selectedYear]);

  const yearOptions = React.useMemo(
    () =>
      availableYears.map((yr) => ({
        value: String(yr),
        label: String(yr),
      })),
    [availableYears]
  );

  const availableMonths = React.useMemo(
    () => data.availableMonths ?? [],
    [data.availableMonths]
  );

  const defaultMonthKey = React.useMemo(() => {
    if (availableMonths.length > 0) {
      return availableMonths[availableMonths.length - 1].id;
    }
    return "all";
  }, [availableMonths]);

  const [selectedMonthKey, setSelectedMonthKey] =
    React.useState<string>(defaultMonthKey);

  // Sinkronkan selectedMonthKey saat data tahun berubah
  React.useEffect(() => {
    setSelectedMonthKey(defaultMonthKey);
  }, [defaultMonthKey]);

  const activeYearSummary = React.useMemo(
    () =>
      data.yearlyComparison.find((y) => y.year === data.selectedYear) ?? {
        year: data.selectedYear,
        totalIncome: 0,
        totalExpense: 0,
        totalNetSavings: 0,
        averageSavingsRate: 0,
        monthsCount: 0,
      },
    [data.yearlyComparison, data.selectedYear]
  );

  const activeCategoryItems = React.useMemo(() => {
    if (
      data.categoryDistributionByMonth &&
      data.categoryDistributionByMonth[selectedMonthKey]
    ) {
      return data.categoryDistributionByMonth[selectedMonthKey];
    }
    return data.categoryDistribution;
  }, [data.categoryDistributionByMonth, data.categoryDistribution, selectedMonthKey]);

  const topCategory = React.useMemo(() => {
    const yearlyAll = data.categoryDistributionByMonth?.["all"] ?? activeCategoryItems;
    const sorted = [...yearlyAll]
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    return sorted[0] ?? null;
  }, [data.categoryDistributionByMonth, activeCategoryItems]);

  const handleYearChange = (nextYear: string) => {
    if (Number(nextYear) === data.selectedYear) return;
    router.push(`/dashboard/analytics?year=${nextYear}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Filter Periode Tahunan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Calendar className="size-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-foreground">
              Periode Analisis Tahun {data.selectedYear}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Seluruh rapor KPI, arus kas, dan tren tabungan mengikuti tahun terpilih.
            </p>
          </div>
        </div>

        <SlidingSegmentedControl
          options={yearOptions}
          value={String(data.selectedYear)}
          onValueChange={handleYearChange}
          role="tablist"
          ariaLabel="Pilih tahun analisis"
          size="sm"
          className="self-start sm:self-auto"
        />
      </div>

      {/* Tier 1: 4 Kartu KPI Ringkas */}
      <AnalyticsKpiGrid
        selectedYear={data.selectedYear}
        yearSummary={activeYearSummary}
        topCategory={topCategory}
      />

      {/* Tier 2: Arus Kas Bulanan (Grouped Bar Chart) */}
      <MonthlyCashflowChart
        data={data.monthlyCashflow}
        selectedYear={data.selectedYear}
      />

      {/* Tier 3: Kemana Uang Pergi (Donut Chart + Ranking Pos) */}
      <ExpenseDonutSection
        availableMonths={availableMonths}
        selectedMonthKey={selectedMonthKey}
        onSelectMonthKey={setSelectedMonthKey}
        items={activeCategoryItems}
        selectedYear={data.selectedYear}
      />

      {/* Tier 4: Disiplin Anggaran & Tren Savings Rate */}
      <BudgetDisciplineSection
        budgetItems={activeCategoryItems}
        monthlyCashflow={data.monthlyCashflow}
        averageSavingsRate={activeYearSummary.averageSavingsRate}
        selectedYear={data.selectedYear}
      />
    </div>
  );
}
