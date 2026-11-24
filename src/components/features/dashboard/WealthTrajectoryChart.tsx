"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Wealth Trajectory Chart Component (Fase 4)
 * ==============================================================================
 *
 * Visualisasi time-series akumulasi simpanan riil pengguna:
 * 1. Dual Mode Visualisasi: Area/Garis Halus (`line`) vs Volume Bar (`bar`).
 * 2. 4 Timeframe Fleksibel: Harian (30D), Mingguan (12W), Bulanan (12M), Tahunan (All).
 * 3. 2-Axis Dashed Crosshair: Garis putus-putus pada sumbu X & Y dengan proyeksi
 *    nilai nominal Rupiah saat kursor melayang (hover).
 * 4. Mobile Touch Ergonomics: Readout bar aktif saat jari melakukan drag sentuh.
 * 5. Invarian Tipografi: 100% sans-serif dengan `tabular-nums` (Zero `font-mono`).
 */

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { SlidingSegmentedControl } from "@/components/common/SlidingSegmentedControl";
import { formatRupiah } from "@/lib/financial-calculations";
import { cn } from "@/lib/utils";
import type {
  AllTimeframeSnapshots,
  TimeframeOption,
  WealthSnapshotPoint,
} from "@/types/savings-snapshots";

export interface WealthTrajectoryChartProps {
  /** Dataset lengkap 4 timeframe yang telah di-forward fill dari server */
  snapshotsByTimeframe: AllTimeframeSnapshots;
  /** Timeframe default yang aktif saat komponen pertama kali dimuat */
  initialTimeframe?: TimeframeOption;
  /** Kelas styling tambahan untuk wrapper */
  className?: string;
}

type ChartMode = "line" | "bar";

export function WealthTrajectoryChart({
  snapshotsByTimeframe,
  initialTimeframe = "monthly",
  className,
}: WealthTrajectoryChartProps) {
  const [timeframe, setTimeframe] =
    React.useState<TimeframeOption>(initialTimeframe);
  const [chartMode, setChartMode] = React.useState<ChartMode>("line");
  const [hoveredValue, setHoveredValue] = React.useState<number | null>(null);
  const [hoveredPoint, setHoveredPoint] =
    React.useState<WealthSnapshotPoint | null>(null);

  const activeData = React.useMemo(() => {
    return snapshotsByTimeframe[timeframe] || [];
  }, [snapshotsByTimeframe, timeframe]);

  // Hitung min dan max domain Y untuk padding visual yang proporsional
  const { minDomain, maxDomain } = React.useMemo(() => {
    if (activeData.length === 0) {
      return { minDomain: 0, maxDomain: 10_000_000 };
    }
    const values = activeData.map((d) => d.totalWealth);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = Math.max(500_000, Math.round((maxVal - minVal) * 0.15));
    return {
      minDomain: Math.max(0, minVal - padding),
      maxDomain: maxVal + padding,
    };
  }, [activeData]);

  // Handler interaksi mouse move untuk crosshair 2-axis
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = React.useCallback((state: any) => {
    if (
      state?.isTooltipActive &&
      state?.activePayload?.[0]?.value !== undefined
    ) {
      const val = Number(state.activePayload[0].value);
      setHoveredValue(val);
      setHoveredPoint(state.activePayload[0].payload as WealthSnapshotPoint);
    }
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setHoveredValue(null);
    setHoveredPoint(null);
  }, []);

  const formatYAxisTick = (val: number) => {
    if (val >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toLocaleString("id-ID", {
        maximumFractionDigits: 1,
      })}M`;
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toLocaleString("id-ID", {
        maximumFractionDigits: 1,
      })}jt`;
    }
    if (val >= 1_000) {
      return `${(val / 1_000).toLocaleString("id-ID", {
        maximumFractionDigits: 0,
      })}rb`;
    }
    return String(val);
  };

  const timeframeOptions = [
    {
      value: "daily" as const,
      label: (
        <span className="tabular-nums">
          <span className="hidden sm:inline">Harian (30D)</span>
          <span className="inline sm:hidden">30D</span>
        </span>
      ),
    },
    {
      value: "weekly" as const,
      label: (
        <span className="tabular-nums">
          <span className="hidden sm:inline">Mingguan (12W)</span>
          <span className="inline sm:hidden">12W</span>
        </span>
      ),
    },
    {
      value: "monthly" as const,
      label: (
        <span className="tabular-nums">
          <span className="hidden sm:inline">Bulanan (12M)</span>
          <span className="inline sm:hidden">12M</span>
        </span>
      ),
    },
    {
      value: "yearly" as const,
      label: (
        <span className="tabular-nums">
          <span className="hidden sm:inline">Tahunan (All)</span>
          <span className="inline sm:hidden">All</span>
        </span>
      ),
    },
  ];

  const modeOptions = [
    {
      value: "line" as const,
      label: (
        <span className="inline-flex items-center gap-1.5 font-medium">
          <TrendingUp className="size-3.5" />
          <span className="hidden sm:inline">Garis</span>
        </span>
      ),
    },
    {
      value: "bar" as const,
      label: (
        <span className="inline-flex items-center gap-1.5 font-medium">
          <BarChart3 className="size-3.5" />
          <span className="hidden sm:inline">Batang</span>
        </span>
      ),
    },
  ];

  return (
    <div className={cn("space-y-3.5 flex flex-col justify-between h-full", className)}>
      {/* 1. Bar Kontrol: Timeframe Selector (Kiri) & Mode Toggle (Kanan) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <SlidingSegmentedControl<TimeframeOption>
          options={timeframeOptions}
          value={timeframe}
          onValueChange={(val) => {
            setTimeframe(val);
            setHoveredValue(null);
            setHoveredPoint(null);
          }}
          size="sm"
        />

        <div className="flex items-center gap-2">
          <SlidingSegmentedControl<ChartMode>
            options={modeOptions}
            value={chartMode}
            onValueChange={(val) => {
              setChartMode(val);
              setHoveredValue(null);
              setHoveredPoint(null);
            }}
            size="sm"
          />
        </div>
      </div>

      {/* 2. Interactive Readout Strip (Muncul saat hover/touch scrub) */}
      <div className="min-h-[28px] flex items-center justify-between text-xs px-1 border-b border-border/40 pb-1.5">
        {hoveredPoint ? (
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Calendar className="size-3 text-muted-foreground" />
              <span>{hoveredPoint.label} ({hoveredPoint.date})</span>
            </span>
            <span className="text-foreground font-bold tabular-nums">
              {formatRupiah(hoveredPoint.totalWealth)}
            </span>
            {hoveredPoint.delta !== 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md",
                  hoveredPoint.delta > 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {hoveredPoint.delta > 0 ? (
                  <ArrowUpRight className="size-3 shrink-0" />
                ) : (
                  <ArrowDownLeft className="size-3 shrink-0" />
                )}
                <span>
                  {hoveredPoint.delta > 0 ? "+" : ""}
                  {formatRupiah(hoveredPoint.delta)}
                </span>
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Layers className="size-3 text-muted-foreground/80" />
            <span>Arahkan kursor atau sentuh grafik untuk melihat riwayat nominal saldo</span>
          </span>
        )}

        {hoveredValue !== null && (
          <span className="hidden sm:inline text-[11px] font-semibold text-primary tabular-nums">
            Sumbu Y: {formatRupiah(hoveredValue)}
          </span>
        )}
      </div>

      {/* 3. Kanvas Recharts Responsive */}
      <div className="w-full flex-1 min-h-[190px] sm:min-h-[240px] lg:min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === "line" ? (
            <AreaChart
              data={activeData}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(142.1 76.2% 36.3%)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(142.1 76.2% 36.3%)"
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                strokeOpacity={0.6}
              />

              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={6}
                interval="preserveStartEnd"
              />

              <YAxis
                domain={[minDomain, maxDomain]}
                tickFormatter={formatYAxisTick}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={-4}
              />

              <Tooltip
                cursor={{
                  stroke: "hsl(var(--muted-foreground))",
                  strokeDasharray: "4 4",
                  strokeWidth: 1.5,
                }}
                content={<WealthChartCustomTooltip />}
                isAnimationActive={false}
              />

              {hoveredValue !== null && (
                <ReferenceLine
                  y={hoveredValue}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}

              <Area
                type="monotone"
                dataKey="totalWealth"
                stroke="hsl(142.1 76.2% 36.3%)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#wealthGradient)"
                activeDot={{
                  r: 5,
                  fill: "hsl(142.1 76.2% 36.3%)",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={activeData}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                strokeOpacity={0.6}
              />

              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={6}
                interval="preserveStartEnd"
              />

              <YAxis
                domain={[minDomain, maxDomain]}
                tickFormatter={formatYAxisTick}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={-4}
              />

              <Tooltip
                cursor={{
                  fill: "hsl(var(--muted)/0.3)",
                }}
                content={<WealthChartCustomTooltip />}
                isAnimationActive={false}
              />

              {hoveredValue !== null && (
                <ReferenceLine
                  y={hoveredValue}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}

              <Bar
                dataKey="totalWealth"
                fill="hsl(142.1 76.2% 36.3%)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Custom Floating Tooltip Recharts dengan styling modern dan sans-serif tabular-nums
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WealthChartCustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as WealthSnapshotPoint;

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 p-3 shadow-md backdrop-blur-md text-xs space-y-1.5 min-w-[190px]">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1">
        <span className="font-semibold text-foreground">{data.label}</span>
        <span className="text-[10px] text-muted-foreground">{data.date}</span>
      </div>

      <div className="space-y-1 pt-0.5">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Tabungan Bebas:</span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatRupiah(data.freeSavings)}
          </span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>Dana Darurat:</span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatRupiah(data.emergencyFund)}
          </span>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-border/50 text-foreground font-bold">
          <span>Total Simpanan:</span>
          <span className="text-primary tabular-nums">
            {formatRupiah(data.totalWealth)}
          </span>
        </div>
      </div>
    </div>
  );
}
