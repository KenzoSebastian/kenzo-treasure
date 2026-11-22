import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Skeleton loading terdedikasi untuk sub-halaman Pengaturan & Backup Mandiri (`/dashboard/settings`).
 * Merefleksikan 1 layout utuh sesuai 3 panel konfigurasi:
 * - Header halaman + tombol "Kembali ke Dashboard".
 * - Panel 1: Konfigurasi Gaji Pokok Default & Target Dana Darurat.
 * - Panel 2: Manajemen Template Pos Anggaran Rutin.
 * - Panel 3: Ekspor Data & Kedaulatan Backup Mandiri (3 format unduh).
 */
export function SettingsSkeleton() {
  return (
    <div
      data-testid="settings-skeleton"
      aria-busy="true"
      aria-label="Memuat pengaturan dan backup mandiri..."
      className="space-y-6 animate-in fade-in-50 duration-200"
    >
      {/* 1. Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-5">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-64 sm:w-80 rounded-lg" />
          <Skeleton className="h-4 w-72 sm:w-96 rounded-md" />
        </div>
        <Skeleton className="h-9 w-40 rounded-xl self-start sm:self-auto shrink-0" />
      </div>

      {/* 2. Panel 1: Konfigurasi Gaji Pokok & Target Dana Darurat */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-56 rounded-md" />
              <Skeleton className="h-3 w-72 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-5 w-32 rounded-full self-start sm:self-auto shrink-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-48 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-48 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </Card>

      {/* 3. Panel 2: Manajemen Template Pos Anggaran Rutin */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-56 rounded-md" />
              <Skeleton className="h-3 w-64 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-9 w-36 rounded-xl self-start sm:self-auto shrink-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="size-7 rounded-lg" />
                <Skeleton className="size-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Panel 3: Ekspor Data & Kedaulatan Backup Mandiri */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-60 rounded-md" />
              <Skeleton className="h-3 w-72 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-5 w-36 rounded-full self-start sm:self-auto shrink-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-auto min-h-14 py-3.5 px-4 rounded-xl border border-border/80 bg-card flex flex-col justify-center gap-1.5"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-3.5 w-40 rounded" />
              </div>
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
