import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Komponen Skeleton loading terpadu untuk dashboard Kenzo Treasury.
 * Merefleksikan struktur aktual modul dashboard (Top selector, Hero Summary, 7 Pos Wajib, dan Cicilan/Wishlist).
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 1. Baris Navigasi Bulan & Aksi Cepat */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-2">
          {/* Skeleton Dropdown Bulan */}
          <Skeleton className="h-10 w-44 rounded-xl" />
          {/* Status Badge Bulan */}
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        {/* Tombol Buat Bulan Baru */}
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* 2. Kartu Hero Executive Summary & Cashflow KPI */}
      <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-9 w-52 sm:w-64" />
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Progress bar pengeluaran */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>

          {/* 3 Kotak Metrik Arus Kas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-1.5"
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. Grid 7 Pos Anggaran Wajib */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/70 bg-card p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>

              {/* Baris Progress Pos */}
              <div className="space-y-1">
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between pt-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Seksi Bawah: Cicilan & Wishlist Hub Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
