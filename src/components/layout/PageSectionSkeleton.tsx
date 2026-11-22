import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VaultSkeleton } from "./VaultSkeleton";
import { WishlistsSkeleton } from "./WishlistsSkeleton";
import { AnalyticsSkeleton } from "./AnalyticsSkeleton";
import { SettingsSkeleton } from "./SettingsSkeleton";

export {
  VaultSkeleton,
  WishlistsSkeleton,
  AnalyticsSkeleton,
  SettingsSkeleton,
};

export interface PageSectionSkeletonProps {
  cardsCount?: number;
  variant?: "default" | "vault" | "wishlists" | "analytics" | "settings";
}

/**
 * Skeleton bersama untuk sub-halaman dashboard (`/dashboard/vault`, `/dashboard/wishlists`,
 * `/dashboard/analytics`, `/dashboard/settings`) agar transisi antar-tab terasa instan.
 *
 * Mendukung varian terdedikasi per halaman sehingga wireframe 100% presisi dan
 * mengeliminasi isu render ganda (2 layout).
 */
export function PageSectionSkeleton({
  cardsCount = 3,
  variant = "default",
}: PageSectionSkeletonProps = {}) {
  if (variant === "vault") {
    return <VaultSkeleton />;
  }

  if (variant === "wishlists") {
    return <WishlistsSkeleton />;
  }

  if (variant === "analytics") {
    return <AnalyticsSkeleton />;
  }

  if (variant === "settings") {
    return <SettingsSkeleton />;
  }

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
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
