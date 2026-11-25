"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Budget Discipline & Savings Rate Trend (Tier 4)
 * ==============================================================================
 *
 * 2 Kolom:
 * - Kiri: Target vs Realisasi Anggaran per pos pada periode terpilih.
 * - Kanan: Tren Savings Rate (%) bulanan sepanjang tahun terpilih.
 */

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppCategoryIcon } from "@/components/common/AppCategoryIcon";
import { formatRupiah } from "@/lib/financial-calculations";
import { cn } from "@/lib/utils";
import type {
  CategoryDistributionItem,
  MonthlyCashflowPoint,
} from "@/types/analytics";

export interface BudgetDisciplineSectionProps {
  budgetItems: CategoryDistributionItem[];
  monthlyCashflow: MonthlyCashflowPoint[];
  averageSavingsRate: number;
  selectedYear: number;
}

export function BudgetDisciplineSection({
  budgetItems,
  monthlyCashflow,
  averageSavingsRate,
  selectedYear,
}: BudgetDisciplineSectionProps) {
  const activeBudgetItems = React.useMemo(
    () =>
      budgetItems
        .filter((b) => b.target > 0 || b.amount > 0)
        .sort((a, b) => {
          const ratioA = a.target > 0 ? a.amount / a.target : 0;
          const ratioB = b.target > 0 ? b.amount / b.target : 0;
          return ratioB - ratioA;
        }),
    [budgetItems]
  );

  const hasTrendData = monthlyCashflow.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Kolom Kiri: Target vs Realisasi Anggaran */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <span>Target vs Realisasi Anggaran</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pantau pos yang mendekati atau melewati batas anggaran.
            </p>
          </div>
        </div>

        {activeBudgetItems.length === 0 ? (
          <div className="h-[220px] w-full rounded-xl border border-dashed border-border/70 bg-muted/15 flex flex-col items-center justify-center text-center px-4 gap-1.5">
            <p className="text-xs font-semibold text-foreground">
              Belum ada target pos anggaran
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Atur target anggaran di Dashboard agar perbandingan realisasi muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {activeBudgetItems.map((item) => {
              const usagePct =
                item.target > 0
                  ? Math.round((item.amount / item.target) * 100)
                  : item.amount > 0
                  ? 100
                  : 0;
              const isOver = item.target > 0 && item.amount > item.target;
              const isWarn = !isOver && usagePct > 70;

              return (
                <div
                  key={`${item.categoryId}-${item.categoryName}`}
                  className="space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 tabular-nums">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground min-w-0 truncate">
                      <AppCategoryIcon
                        iconKey={item.icon}
                        group={item.group}
                        size="xs"
                        variant="inline"
                        className="text-muted-foreground"
                      />
                      <span className="truncate">{item.categoryName}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground">
                        {formatRupiah(item.amount)} / {formatRupiah(item.target)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 rounded-full tabular-nums",
                          isOver
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : isWarn
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {usagePct}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        isOver
                          ? "bg-rose-500"
                          : isWarn
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, usagePct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Kolom Kanan: Tren Savings Rate (%) */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              <span>Tren Savings Rate ({selectedYear})</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Persentase pemasukan yang berhasil disisihkan tiap bulan.
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0"
          >
            Rata-rata: {averageSavingsRate}%
          </Badge>
        </div>

        <div className="w-full h-[220px] sm:h-[240px]">
          {!hasTrendData ? (
            <div className="h-full w-full rounded-xl border border-dashed border-border/70 bg-muted/15 flex flex-col items-center justify-center text-center px-4 gap-1.5">
              <p className="text-xs font-semibold text-foreground">
                Belum ada tren savings rate
              </p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                Data rasio tabungan bulanan akan muncul setelah ada minimal satu siklus aktif.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyCashflow}
                margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="savingsRateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  strokeOpacity={0.6}
                />
                <XAxis
                  dataKey="shortMonth"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={6}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<SavingsRateTooltip />} />
                {averageSavingsRate > 0 && (
                  <ReferenceLine
                    y={averageSavingsRate}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeWidth={1.2}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="savingsRate"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#savingsRateGrad)"
                  activeDot={{
                    r: 5,
                    fill: "#10b981",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SavingsRateTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const pt = payload[0].payload as MonthlyCashflowPoint;

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 p-2.5 shadow-md backdrop-blur-md text-xs space-y-1 min-w-[180px]">
      <div className="font-semibold text-foreground border-b border-border/60 pb-1">
        {pt.monthName}
      </div>
      <div className="flex justify-between items-center gap-4">
        <span className="text-muted-foreground">Savings Rate:</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          {pt.savingsRate}%
        </span>
      </div>
      <div className="flex justify-between items-center gap-4">
        <span className="text-muted-foreground">Surplus:</span>
        <span className="font-semibold text-foreground tabular-nums">
          {formatRupiah(pt.netSavings)}
        </span>
      </div>
    </div>
  );
}
