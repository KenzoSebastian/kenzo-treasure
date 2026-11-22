import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Skeleton loading terdedikasi untuk sub-halaman Brankas Dana Darurat (`/dashboard/vault`).
 * Merefleksikan 1 layout utuh sesuai `EmergencyVaultCard`:
 * - Header halaman + tombol "Kembali ke Dashboard".
 * - Kartu Brankas dengan header proteksi keamanan & tombol mutasi.
 * - 3 Pilar Angka (Dana Darurat, Tabungan Bebas, Safety Months Meter).
 * - Progress bar menuju target ideal.
 */
export function VaultSkeleton() {
  return (
    <div
      data-testid="vault-skeleton"
      aria-busy="true"
      aria-label="Memuat brankas dana darurat..."
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

      {/* 2. Kartu Tunggal EmergencyVaultCard */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
        {/* Header Brankas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-2xl shrink-0" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-52 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-64 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-9 w-44 rounded-xl self-start sm:self-auto shrink-0" />
        </div>

        {/* 3 Pilar Angka Brankas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="size-3.5 rounded" />
                <Skeleton className="h-3.5 w-32 rounded" />
              </div>
              <Skeleton className="h-8 w-40 rounded-lg" />
              <Skeleton className="h-3 w-44 rounded" />
            </div>
          ))}
        </div>

        {/* Progress Bar Menuju Target Ideal */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-36 rounded" />
            <Skeleton className="h-3.5 w-12 rounded" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
      </Card>
    </div>
  );
}
