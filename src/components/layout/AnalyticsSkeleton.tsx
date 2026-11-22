import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Skeleton loading terdedikasi untuk sub-halaman Analitik Finansial (`/dashboard/analytics`).
 * Merefleksikan 1 layout utuh sesuai `AnalyticsDashboard`:
 * - Header halaman + tombol "Kembali ke Dashboard".
 * - Control Strip mode visualisasi grafik (Bar vs Line).
 * - 2 Kartu Grafik Lebar (Perbandingan Cashflow Bulanan & Pertumbuhan Tabungan Kumulatif).
 * - 2 Kartu Grid Bawah (Perbandingan Tahunan & Distribusi Pos Anggaran).
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

      {/* 2. Control Strip: Mode Visualisasi Grafik */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="space-y-1">
          <Skeleton className="h-4 w-52 rounded-md" />
          <Skeleton className="h-3 w-64 rounded-md" />
        </div>
        <Skeleton className="h-9 w-52 rounded-xl self-start sm:self-auto shrink-0" />
      </div>

      {/* 3. Dua Kartu Grafik Lebar (Pemasukan/Pengeluaran & Net Savings) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cashflow Bulanan */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-48 rounded-md" />
              <Skeleton className="h-3 w-56 rounded-md" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="h-68 w-full rounded-xl bg-muted/15 p-4 flex flex-col justify-end gap-3">
            <div className="flex items-end justify-between gap-2 h-48 pt-4">
              {[40, 65, 55, 80, 70, 90].map((h, idx) => (
                <div key={idx} className="flex-1 flex items-end justify-center gap-1.5 h-full">
                  <Skeleton className="w-full max-w-[20px] rounded-t-sm" style={{ height: `${h}%` }} />
                  <Skeleton className="w-full max-w-[20px] rounded-t-sm" style={{ height: `${Math.max(20, h - 20)}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-1">
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
          </div>
        </Card>

        {/* Pertumbuhan Saldo Tabungan Kumulatif */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-56 rounded-md" />
              <Skeleton className="h-3 w-52 rounded-md" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="h-68 w-full rounded-xl bg-muted/15 p-4 flex flex-col justify-end gap-3">
            <div className="flex items-end justify-between gap-2 h-48 pt-4">
              {[30, 45, 60, 72, 85, 95].map((h, idx) => (
                <div key={idx} className="flex-1 flex items-end justify-center h-full">
                  <Skeleton className="w-full max-w-[32px] rounded-t-sm" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-1">
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Tab Perbandingan Tahunan & Distribusi Pos Anggaran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Perbandingan Tahunan */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1.5"
              >
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-6 w-32 rounded-md" />
              </div>
            ))}
          </div>
        </Card>

        {/* Distribusi Pos Pengeluaran */}
        <Card className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
          <div className="space-y-1">
            <Skeleton className="h-4 w-56 rounded-md" />
            <Skeleton className="h-3 w-52 rounded-md" />
          </div>

          <div className="space-y-3 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-5 rounded-md" />
                    <Skeleton className="h-3.5 w-24 rounded" />
                  </div>
                  <Skeleton className="h-3.5 w-20 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
