import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export interface DashboardSkeletonProps {
  /**
   * Sembunyikan skeleton baris navigasi atas ketika dipakai di dalam
   * `DashboardMonthShell` / `<Suspense>` di bawah kontrol pemilih bulan.
   */
  hideHeader?: boolean;
}

/**
 * Komponen Skeleton loading terpadu untuk dashboard utama Kenzo Treasury (`/dashboard`).
 * Merefleksikan struktur aktual modul dashboard:
 * 1. Header: Sapaan Personal di kiri, dan kontrol 2 baris (Month Selector + 3 Action Buttons) di kanan.
 * 2. Hero Executive Summary Card & Cashflow KPI.
 * 3. 3 Kartu Pilar Arus Kas (Total Brankas Simpanan, Realisasi Kas, Sisa Uang Bebas).
 * 4. Grid Pos Anggaran Bulanan (6 kartu kategori).
 * 5. Hub Bawah: Sinking Fund Wishlist & Analitik Historis.
 */
export function DashboardSkeleton({
  hideHeader = false,
}: DashboardSkeletonProps = {}) {
  return (
    <div
      data-testid="dashboard-skeleton"
      aria-busy="true"
      aria-label="Memuat dashboard keuangan..."
      className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200"
    >
      {/* 1. Baris Navigasi Bulan & Aksi Cepat */}
      {!hideHeader ? (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 border-b border-border/60 pb-5">
          {/* Kiri: Sapaan & Status Siklus */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-3.5 rounded shrink-0" />
              <Skeleton className="h-4 w-44 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-44 sm:w-56 rounded-lg" />
            <Skeleton className="h-4 w-72 sm:w-96 rounded-md" />
          </div>

          {/* Kanan: Kontrol 2 Baris (Baris 1 Selector Bulan, Baris 2 Tiga Action Buttons) */}
          <div className="flex flex-col gap-2 w-full sm:w-[360px] shrink-0">
            {/* Baris 1: Selector Bulan Lebar Penuh */}
            <Skeleton className="h-10 w-full rounded-xl" />

            {/* Baris 2: 3 Action Buttons Simetris (Bulan Baru, Evaluasi AI, Transaksi) */}
            <div className="grid grid-cols-3 gap-2 w-full">
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. Tier 1: Full-Width Wealth Hero Card with Interactive Trajectory Chart Skeleton */}
      <Card className="w-full rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs lg:min-h-[480px]">
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-xl shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-32 rounded-md" />
              <Skeleton className="h-3.5 w-24 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>

        {/* Display Numeral & Sub-Vault Inset Chips */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-10 w-56 rounded-xl" />
            <Skeleton className="h-3.5 w-72 rounded-md" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-1.5 flex items-center gap-2">
              <Skeleton className="size-4 rounded shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-2.5 w-16 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-1.5 flex items-center gap-2">
              <Skeleton className="size-4 rounded shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-2.5 w-16 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Canvas Skeleton Area */}
        <div className="pt-2 flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-44 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-[220px] sm:h-[260px] w-full rounded-xl bg-muted/20" />
        </div>
      </Card>

      {/* 3. Tier 2: Full-Width Cashflow Cockpit Card Skeleton */}
      <Card className="w-full rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-xl shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <div className="space-y-1.5">
          <Skeleton className="h-3 w-36 rounded-md" />
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-3 w-60 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="flex justify-between items-center rounded-xl border border-border/60 bg-muted/20 p-2.5 px-3">
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <div className="flex justify-between items-center rounded-xl border border-border/60 bg-muted/20 p-2.5 px-3">
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-2.5 w-28 rounded-md" />
            <Skeleton className="h-2.5 w-24 rounded-md" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-2.5 w-full rounded-md" />
        </div>
      </Card>

      {/* 4. Grid Pos Anggaran Bulanan */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/70 bg-card p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-8 rounded-lg shrink-0" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between pt-1">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Seksi Bawah: Wishlist Hub & Analitik Hub Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-md shrink-0" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-3 w-full max-w-sm rounded-md" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-md shrink-0" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-3 w-full max-w-sm rounded-md" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
