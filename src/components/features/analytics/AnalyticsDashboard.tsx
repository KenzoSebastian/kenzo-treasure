"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Recharts Analytics Dashboard (Fase F15)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menyajikan pusat visualisasi data grafis interaktif berbasis Recharts:
 * 1. Toggle Switch antara **Grafik Batang (Bar Chart)** dan **Grafik Garis
 *    (Line Chart)**.
 * 2. Grafik Pertumbuhan Saldo Tabungan dari bulan ke bulan.
 * 3. Grafik Perbandingan Cashflow Bulanan (Pemasukan vs Pengeluaran).
 * 4. Tab perbandingan tahunan (Tahun 2026 vs 2027) & distribusi pos pengeluaran.
 *
 * Seluruh angka menggunakan font sans-serif proporsional dengan `tabular-nums`
 * (bebas `font-mono`).
 */

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/financial-calculations";
import { cn } from "@/lib/utils";
import type { AnalyticsDashboardData } from "@/types/analytics";

interface AnalyticsDashboardProps {
  data: AnalyticsDashboardData;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const [chartType, setChartType] = React.useState<"bar" | "line">("bar");
  const [selectedYear, setSelectedYear] = React.useState<2026 | 2027>(2026);

  const activeYearData = React.useMemo(
    () =>
      data.yearlyComparison.find((y) => y.year === selectedYear) ??
      data.yearlyComparison[0],
    [data.yearlyComparison, selectedYear]
  );

  return (
    <div className="space-y-6">
      {/* Control Strip: Toggle Bar Chart vs Line Chart */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-foreground">
            Mode Visualisasi Grafik Finansial
          </h2>
          <p className="text-xs text-muted-foreground">
            Beralih antara tampilan Grafik Batang (Bar Chart) dan Grafik Garis
            (Line Chart).
          </p>
        </div>

        <div
          className="inline-flex items-center rounded-xl border border-border/70 bg-muted/40 p-1 self-start sm:self-auto"
          role="group"
          aria-label="Pilih tipe grafik"
        >
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              chartType === "bar"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="size-3.5" />
            <span>Grafik Batang (Bar)</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType("line")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              chartType === "line"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LineChartIcon className="size-3.5" />
            <span>Grafik Garis (Line)</span>
          </button>
        </div>
      </div>

      {/* 1. Grafik Perbandingan Cashflow Bulanan (Pemasukan vs Pengeluaran) & Pertumbuhan Tabungan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cashflow Bulanan */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Perbandingan Cashflow Bulanan
              </h3>
              <p className="text-xs text-muted-foreground">
                Pemasukan vs Pengeluaran dari bulan ke bulan
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px] rounded-full">
              Rupiah (Rp)
            </Badge>
          </div>

          <div className="h-68 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={data.monthlyCashflow}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="shortMonth"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000000)}jt`}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => formatRupiah(Number(val ?? 0))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="income"
                    name="Pemasukan"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="Pengeluaran"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={data.monthlyCashflow}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="shortMonth"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000000)}jt`}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => formatRupiah(Number(val ?? 0))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Pemasukan"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="Pengeluaran"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Grafik Pertumbuhan Saldo Tabungan */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Pertumbuhan Saldo Tabungan Kumulatif
              </h3>
              <p className="text-xs text-muted-foreground">
                Akumulasi Net Savings & Surplus Kas Bulanan
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            >
              Tren Kumulatif
            </Badge>
          </div>

          <div className="h-68 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <LineChart data={data.savingsGrowth}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="shortMonth"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000000)}jt`}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => formatRupiah(Number(val ?? 0))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="cumulativeSavings"
                    name="Total Tabungan Kumulatif"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="netSavings"
                    name="Surplus Bulanan"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={data.savingsGrowth}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="shortMonth"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000000)}jt`}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => formatRupiah(Number(val ?? 0))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="cumulativeSavings"
                    name="Total Tabungan Kumulatif"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="netSavings"
                    name="Surplus Bulanan"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 2. Tab Perbandingan Tahunan (Tahun 2026 vs 2027) & Distribusi Pos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Perbandingan Tahunan (2026 vs 2027)
              </h3>
            </div>

            <div className="inline-flex rounded-xl border border-border/70 bg-muted/40 p-1">
              {([2026, 2027] as const).map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs font-bold tabular-nums transition-all",
                    selectedYear === yr
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Tahun {yr}
                </button>
              ))}
            </div>
          </div>

          {activeYearData && (
            <div className="grid grid-cols-2 gap-3 pt-1 tabular-nums">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                <span className="text-[11px] text-muted-foreground block">
                  Total Pemasukan {activeYearData.year}
                </span>
                <span className="text-base font-extrabold text-foreground">
                  {formatRupiah(activeYearData.totalIncome)}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                <span className="text-[11px] text-muted-foreground block">
                  Total Pengeluaran {activeYearData.year}
                </span>
                <span className="text-base font-extrabold text-foreground">
                  {formatRupiah(activeYearData.totalExpense)}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                <span className="text-[11px] text-muted-foreground block">
                  Surplus Bersih Tahunan
                </span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(activeYearData.totalNetSavings)}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                <span className="text-[11px] text-muted-foreground block">
                  Rata-Rata Savings Rate
                </span>
                <span className="text-base font-extrabold text-foreground">
                  {activeYearData.averageSavingsRate}% ({activeYearData.monthsCount}{" "}
                  Bulan)
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Distribusi Pos Pengeluaran */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Distribusi Pengeluaran per Pos Anggaran
            </h3>
            <p className="text-xs text-muted-foreground">
              Komposisi serapan anggaran berdasarkan kategori pos
            </p>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {data.categoryDistribution.map((cat) => (
              <div key={cat.categoryName} className="space-y-1 text-xs">
                <div className="flex items-center justify-between tabular-nums">
                  <span className="font-semibold text-foreground">
                    {cat.icon} {cat.categoryName}
                  </span>
                  <span className="text-muted-foreground">
                    {formatRupiah(cat.amount)} ({cat.percentageOfTotal}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{
                      width: `${Math.min(100, Math.max(4, cat.percentageOfTotal))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
