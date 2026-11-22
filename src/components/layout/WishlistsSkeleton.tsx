import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Skeleton loading terdedikasi untuk sub-halaman Wishlist Impian (`/dashboard/wishlists`).
 * Merefleksikan 1 layout utuh sesuai `WishlistGrid` & `WishlistCard`:
 * - Header halaman + tombol "Kembali ke Dashboard".
 * - Top Banner Ringkasan Sinking Fund & tombol "Tambah Barang Impian Baru".
 * - Katalog 6 kartu Wishlist (thumbnail foto WebP, milestone badge, progress bar, nominal).
 */
export function WishlistsSkeleton() {
  return (
    <div
      data-testid="wishlists-skeleton"
      aria-busy="true"
      aria-label="Memuat wishlist barang impian..."
      className="space-y-6 animate-in fade-in-50 duration-200"
    >
      {/* 1. Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-5">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-56 sm:w-72 rounded-lg" />
          <Skeleton className="h-4 w-72 sm:w-96 rounded-md" />
        </div>
        <Skeleton className="h-9 w-40 rounded-xl self-start sm:self-auto shrink-0" />
      </div>

      {/* 2. Banner Ringkasan Sinking Fund & Tombol Tambah */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-3.5 w-52 rounded" />
          </div>
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-3 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl self-start sm:self-auto shrink-0" />
      </div>

      {/* 3. Grid Kartu Barang Impian */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card
            key={i}
            className="rounded-2xl border border-border/80 bg-card overflow-hidden flex flex-col justify-between shadow-xs"
          >
            <div>
              {/* Thumbnail Foto Barang */}
              <div className="relative h-44 w-full bg-muted/40 border-b border-border/60 flex items-center justify-center">
                <Skeleton className="size-12 rounded-xl" />
                <div className="absolute top-3 right-3">
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>

              {/* Detail Konten & Progres */}
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-36 rounded" />
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
                <div className="flex justify-between pt-1">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
            </div>

            {/* Footer Tombol Aksi */}
            <div className="p-4 pt-0 grid grid-cols-2 gap-2">
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
