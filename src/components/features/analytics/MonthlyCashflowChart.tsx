"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Monthly Cashflow Chart (Tier 2 Arus Kas Bulanan)
 * ==============================================================================
 *
 * Grouped Bar Chart (Pemasukan vs Pengeluaran) per bulan dengan dark-aware
 * custom tooltip yang langsung menampilkan selisih Surplus/Defisit.
 */

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/financial-calculations";
import { cn } from "@/lib/utils";
import type { MonthlyCashflowPoint } from "@/types/analytics";

export interface MonthlyCashflowChartProps {
  data: MonthlyCashflowPoint[];
  selectedYear: number;
}

export function MonthlyCashflowChart({
  data,
  selectedYear,
}: MonthlyCashflowChartProps) {
  const hasData = data.length > 0 && data.some((d) => d.income > 0 || d.expense > 0);

  const formatYAxis = (val: number) => {
    if (val >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}M`;
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}jt`;
    }
    if (val >= 1_000) {
      return `${Math.round(val / 1_000)}rb`;
    }
    return String(val);
  };

  return (
    <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            Arus Kas Bulanan ({selectedYear})
          </h3>
          <p className="text-xs text-muted-foreground">
            Perbandingan Pemasukan vs Pengeluaran tiap bulan untuk memastikan arus kas tetap surplus.
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px] rounded-full shrink-0">
          Rupiah (Rp)
        </Badge>
      </div>

      <div className="w-full h-[240px] sm:h-[280px]">
        {!hasData ? (
          <div className="h-full w-full rounded-xl border border-dashed border-border/70 bg-muted/15 flex flex-col items-center justify-center text-center px-4 gap-2">
            <div className="size-10 rounded-full bg-muted/40 border border-border/60 flex items-center justify-center text-muted-foreground">
              <BarChart3 className="size-4" />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                Belum ada data arus kas di tahun {selectedYear}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                Buat siklus bulan dan catat transaksi agar perbandingan pemasukan dan pengeluaran muncul di sini.
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -12, bottom: 0 }}
            >
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
                tickFormatter={formatYAxis}
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", fillOpacity: 0.25 }}
                content={<CashflowTooltip />}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar
                dataKey="income"
                name="Pemasukan"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="expense"
                name="Pengeluaran"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CashflowTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const pt = payload[0].payload as MonthlyCashflowPoint;
  const isSurplus = pt.netSavings >= 0;

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 p-3 shadow-md backdrop-blur-md text-xs space-y-1.5 min-w-[220px]">
      <div className="font-semibold text-foreground border-b border-border/60 pb-1">
        {pt.monthName}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center gap-4 text-muted-foreground">
          <span>Pemasukan:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatRupiah(pt.income)}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4 text-muted-foreground">
          <span>Pengeluaran:</span>
          <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatRupiah(pt.expense)}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4 pt-1 border-t border-border/50 font-bold">
          <span className="text-foreground">Surplus Bersih:</span>
          <span
            className={cn(
              "tabular-nums",
              isSurplus
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {isSurplus && pt.netSavings > 0
              ? `+${formatRupiah(pt.netSavings)}`
              : formatRupiah(pt.netSavings)}
          </span>
        </div>
      </div>
    </div>
  );
}
