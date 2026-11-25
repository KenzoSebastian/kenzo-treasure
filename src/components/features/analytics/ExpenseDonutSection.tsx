"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Expense Donut & Category Ranking (Tier 3 Kemana Uang Pergi)
 * ==============================================================================
 *
 * Menampilkan komposisi pengeluaran dalam Donut Chart (maksimal Top 5 + Lainnya)
 * dengan Total Pengeluaran di tengah donat, dipasangkan dengan daftar ranking
 * kategori berikon (`AppCategoryIcon`) serta selector bulan instan.
 */

import * as React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieChartIcon, Calendar, ChevronDown, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppCategoryIcon } from "@/components/common/AppCategoryIcon";
import { formatRupiah } from "@/lib/financial-calculations";
import type {
  AnalyticsMonthOption,
  CategoryDistributionItem,
} from "@/types/analytics";

const DONUT_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#f43f5e", // rose
  "#64748b", // slate (Lainnya)
];

export interface ExpenseDonutSectionProps {
  availableMonths: AnalyticsMonthOption[];
  selectedMonthKey: string;
  onSelectMonthKey: (key: string) => void;
  items: CategoryDistributionItem[];
  selectedYear: number;
}

interface DonutSlice {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export function ExpenseDonutSection({
  availableMonths,
  selectedMonthKey,
  onSelectMonthKey,
  items,
  selectedYear,
}: ExpenseDonutSectionProps) {
  const spentItems = React.useMemo(
    () => items.filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount),
    [items]
  );

  const totalSpent = React.useMemo(
    () => spentItems.reduce((sum, item) => sum + item.amount, 0),
    [spentItems]
  );

  // Kelompokkan maksimal 5 kategori teratas + "Lainnya" agar donut tetap bersih
  const donutSlices: DonutSlice[] = React.useMemo(() => {
    if (spentItems.length === 0 || totalSpent === 0) return [];

    const top = spentItems.slice(0, 5);
    const rest = spentItems.slice(5);
    const slices: DonutSlice[] = top.map((item, idx) => ({
      name: item.categoryName,
      value: item.amount,
      percentage: item.percentageOfTotal,
      color: DONUT_COLORS[idx % DONUT_COLORS.length],
    }));

    if (rest.length > 0) {
      const restAmount = rest.reduce((s, r) => s + r.amount, 0);
      const restPct = Math.round((restAmount / totalSpent) * 100);
      slices.push({
        name: "Lainnya",
        value: restAmount,
        percentage: restPct,
        color: DONUT_COLORS[5],
      });
    }

    return slices;
  }, [spentItems, totalSpent]);

  return (
    <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Header + Selector Bulan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            Kemana Uang Pergi
          </h3>
          <p className="text-xs text-muted-foreground">
            Komposisi pengeluaran riil per pos anggaran.
          </p>
        </div>

        {availableMonths.length > 0 && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full sm:w-52 justify-between rounded-xl border-border/80 bg-background/60 px-3 text-xs font-medium text-foreground shadow-2xs"
              >
                <span className="inline-flex items-center gap-2 truncate">
                  <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {selectedMonthKey === "all"
                      ? `Semua Bulan (${selectedYear})`
                      : availableMonths.find((m) => m.id === selectedMonthKey)?.name ??
                        "Pilih Periode"}
                  </span>
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground opacity-60 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="z-30 w-52 rounded-xl border-border/80 p-1.5 shadow-md"
            >
              <DropdownMenuItem
                onClick={() => onSelectMonthKey("all")}
                className="flex items-center justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer"
              >
                <span className="font-medium text-foreground">
                  Semua Bulan ({selectedYear})
                </span>
                {selectedMonthKey === "all" && (
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
              </DropdownMenuItem>
              {availableMonths.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => onSelectMonthKey(m.id)}
                  className="flex items-center justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer"
                >
                  <span className="font-medium text-foreground truncate">
                    {m.name}
                  </span>
                  {selectedMonthKey === m.id && (
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {donutSlices.length === 0 ? (
        <div className="h-[220px] w-full rounded-xl border border-dashed border-border/70 bg-muted/15 flex flex-col items-center justify-center text-center px-4 gap-2">
          <div className="size-10 rounded-full bg-muted/40 border border-border/60 flex items-center justify-center text-muted-foreground">
            <PieChartIcon className="size-4" />
          </div>
          <div className="space-y-1 max-w-sm">
            <p className="text-xs sm:text-sm font-semibold text-foreground">
              Belum ada pengeluaran tercatat
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              Catat transaksi belanja pada siklus bulan ini untuk melihat proporsi pos pengeluaran.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Kiri: Donut Chart dengan Total Belanja di tengah */}
          <div className="lg:col-span-5 relative h-[230px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutSlices}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={64}
                  outerRadius={92}
                  paddingAngle={2.5}
                  stroke="none"
                >
                  {donutSlices.map((slice) => (
                    <Cell key={slice.name} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Total Belanja
              </span>
              <span className="text-sm sm:text-base font-extrabold text-foreground tabular-nums">
                {formatRupiah(totalSpent)}
              </span>
            </div>
          </div>

          {/* Kanan: Ranked Horizontal Bar List */}
          <div className="lg:col-span-7 space-y-3">
            {spentItems.slice(0, 6).map((cat, idx) => {
              const barColor =
                idx < 5 ? DONUT_COLORS[idx] : DONUT_COLORS[5];
              return (
                <div key={`${cat.categoryId}-${cat.categoryName}`} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-3 tabular-nums">
                    <span className="inline-flex items-center gap-2 font-semibold text-foreground min-w-0 truncate">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: barColor }}
                      />
                      <AppCategoryIcon
                        iconKey={cat.icon}
                        group={cat.group}
                        size="xs"
                        variant="inline"
                        className="text-muted-foreground"
                      />
                      <span className="truncate">{cat.categoryName}</span>
                    </span>
                    <span className="text-foreground font-semibold shrink-0">
                      {formatRupiah(cat.amount)}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({cat.percentageOfTotal}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(4, cat.percentageOfTotal))}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {spentItems.length > 6 && (
              <p className="text-[11px] text-muted-foreground pt-1">
                +{spentItems.length - 6} pos lainnya tergabung di irisan Lainnya.
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DonutTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const slice = payload[0].payload as DonutSlice;

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 p-2.5 shadow-md backdrop-blur-md text-xs space-y-0.5 min-w-[170px]">
      <div className="flex items-center gap-1.5 font-semibold text-foreground">
        <span
          className="size-2 rounded-full shrink-0"
          style={{ backgroundColor: slice.color }}
        />
        <span>{slice.name}</span>
      </div>
      <div className="text-foreground font-bold tabular-nums">
        {formatRupiah(slice.value)}{" "}
        <span className="text-muted-foreground font-normal">({slice.percentage}%)</span>
      </div>
    </div>
  );
}
