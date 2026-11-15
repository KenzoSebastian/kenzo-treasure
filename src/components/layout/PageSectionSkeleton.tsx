import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export interface PageSectionSkeletonProps {
  cardsCount?: number;
}

/**
 * Skeleton bersama untuk sub-halaman dashboard (`/dashboard/vault`, `/dashboard/wishlists`,
 * `/dashboard/analytics`, `/dashboard/settings`) agar transisi antar-tab terasa instan.
 */
export function PageSectionSkeleton({
  cardsCount = 3,
}: PageSectionSkeletonProps = {}) {
  return (
    <div
      data-testid="page-section-skeleton"
      aria-busy="true"
      aria-label="Memuat halaman..."
      className="space-y-6 animate-in fade-in-50 duration-200"
    >
      <div className="space-y-2 border-b border-border/60 pb-5">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-full max-w-xl rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {Array.from({ length: cardsCount }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-border/70 bg-card p-5 space-y-3 shadow-xs"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
