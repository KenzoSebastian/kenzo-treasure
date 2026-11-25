import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Skeleton loading terdedikasi untuk sub-halaman Analitik Finansial (`/dashboard/analytics`).
 * Merefleksikan struktur 4-Tier sesuai `AnalyticsDashboard`:
 * - Header halaman + Filter Tahun terpadu.
 * - Tier 1: 4 Kartu KPI Ringkas.
 * - Tier 2: Full-Width Grouped Bar Chart Arus Kas Bulanan.
 * - Tier 3: Donut Chart + Ranking Pos Pengeluaran.
 * - Tier 4: 2 Kartu Bawah (Target vs Realisasi & Tren Savings Rate %).
 */
export function AnalyticsSkeleton() {
  return (
    <div
      data-testid="analytics-skeleton"
      aria-busy="true"
      aria-label="Memuat grafik dan analitik finansial..."
      className="space-y-6 animate-in fade-in-50 duration-200"
    >
      {/* 1. Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-5">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-60 sm:w-80 rounded-lg" />
          <Skeleton className="h-4 w-72 sm:w-96 rounded-md" />
        </div>
        <Skeleton className="h-9 w-40 rounded-xl self-start sm:self-auto shrink-0" />
      </div>

      {/* 2. Header Filter Tahun */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-xl shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-44 rounded-md" />
            <Skeleton className="h-3 w-64 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-8 w-36 rounded-xl self-start sm:self-auto shrink-0" />
      </div>

      {/* 3. Tier 1: 4 Kartu KPI Ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-2.5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <Skeleton className="size-7 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-32 rounded-lg" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </Card>
        ))}
      </div>

      {/* 4. Tier 2: Full-Width Arus Kas Bulanan */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
          <div className="space-y-1">
            <Skeleton className="h-4 w-44 rounded-md" />
            <Skeleton className="h-3 w-64 rounded-md" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-[240px] sm:h-[280px] w-full rounded-xl bg-muted/20" />
      </Card>

      {/* 5. Tier 3: Donut + Ranking Pos */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
          <div className="space-y-1">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-3 w-52 rounded-md" />
          </div>
          <Skeleton className="h-9 w-full sm:w-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <Skeleton className="size-44 rounded-full" />
          </div>
          <div className="lg:col-span-7 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 6. Tier 4: Budget vs Realisasi & Savings Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
          <Skeleton className="h-4 w-48 rounded-md" />
          <Skeleton className="h-[220px] w-full rounded-xl bg-muted/20" />
        </Card>
        <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
          <Skeleton className="h-4 w-48 rounded-md" />
          <Skeleton className="h-[220px] w-full rounded-xl bg-muted/20" />
        </Card>
      </div>
    </div>
  );
}
