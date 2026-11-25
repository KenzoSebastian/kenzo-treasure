"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Analytics KPI Grid (Tier 1 Rapor Cepat)
 * ==============================================================================
 *
 * Menampilkan 4 metrik ringkasan utama untuk tahun/periode terpilih:
 * 1. Rata-rata Savings Rate (%)
 * 2. Surplus Bersih Tahunan (Pemasukan - Pengeluaran)
 * 3. Rata-rata Belanja / Bulan (Burn Rate)
 * 4. Pos Pengeluaran Terbesar
 */

import * as React from "react";
import { Percent, TrendingUp, Flame, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/financial-calculations";
import { cn } from "@/lib/utils";
import type { CategoryDistributionItem, YearlyComparisonItem } from "@/types/analytics";

export interface AnalyticsKpiGridProps {
  selectedYear: number;
  yearSummary?: YearlyComparisonItem;
  topCategory?: CategoryDistributionItem | null;
}

export function AnalyticsKpiGrid({
  selectedYear,
  yearSummary,
  topCategory,
}: AnalyticsKpiGridProps) {
  const totalIncome = yearSummary?.totalIncome ?? 0;
  const totalExpense = yearSummary?.totalExpense ?? 0;
  const totalNetSavings = yearSummary?.totalNetSavings ?? 0;
  const averageSavingsRate = yearSummary?.averageSavingsRate ?? 0;
  const monthsCount = yearSummary?.monthsCount ?? 0;
  const avgMonthlyExpense =
    monthsCount > 0 ? Math.round(totalExpense / monthsCount) : 0;

  const isSurplus = totalNetSavings >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Rata-rata Savings Rate */}
      <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">Rata-rata Savings Rate</span>
          <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Percent className="size-3.5" />
          </div>
        </div>
        <div className="text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
          {averageSavingsRate}%
        </div>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {monthsCount > 0
            ? `Rata-rata dari ${monthsCount} siklus di ${selectedYear}`
            : `Belum ada siklus di ${selectedYear}`}
        </p>
      </Card>

      {/* 2. Surplus Bersih Tahunan */}
      <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">Surplus Bersih ({selectedYear})</span>
          <div
            className={cn(
              "size-7 rounded-lg flex items-center justify-center shrink-0",
              isSurplus
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}
          >
            <TrendingUp className="size-3.5" />
          </div>
        </div>
        <div
          className={cn(
            "text-2xl font-extrabold tracking-tight tabular-nums",
            isSurplus
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          )}
        >
          {isSurplus && totalNetSavings > 0
            ? `+${formatRupiah(totalNetSavings)}`
            : formatRupiah(totalNetSavings)}
        </div>
        <p className="text-[11px] text-muted-foreground tabular-nums truncate">
          Masuk {formatRupiah(totalIncome)} • Keluar {formatRupiah(totalExpense)}
        </p>
      </Card>

      {/* 3. Rata-rata Belanja / Bulan */}
      <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">Rata-rata Belanja / Bulan</span>
          <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="size-3.5" />
          </div>
        </div>
        <div className="text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
          {formatRupiah(avgMonthlyExpense)}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Rata-rata pengeluaran aktual bulanan
        </p>
      </Card>

      {/* 4. Pos Pengeluaran Terbesar */}
      <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">Pos Terbesar</span>
          <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Award className="size-3.5" />
          </div>
        </div>
        {topCategory && topCategory.amount > 0 ? (
          <>
            <div className="text-xl font-extrabold tracking-tight text-foreground truncate">
              {topCategory.categoryName}
            </div>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {formatRupiah(topCategory.amount)} ({topCategory.percentageOfTotal}% dari belanja)
            </p>
          </>
        ) : (
          <>
            <div className="text-xl font-extrabold tracking-tight text-muted-foreground">
              Belum ada
            </div>
            <p className="text-[11px] text-muted-foreground">
              Belum ada transaksi tercatat
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
