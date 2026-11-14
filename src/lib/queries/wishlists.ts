/**
 * ==============================================================================
 * Kenzo Treasury — Database Queries: Wishlists & Sinking Fund (Fase B10)
 * ==============================================================================
 */

import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { wishlists, wishlistAllocations, savingsAccount } from "@/db/schema";
import { calculateWishlistProgress } from "@/lib/financial-calculations";
import { resolveAuthenticatedUserId } from "./months";
import type {
  ActionResponse,
  WishlistWithProgress,
  WishlistsSummary,
} from "@/types";

export function enrichWishlist(
  item: typeof wishlists.$inferSelect,
  allocations: Array<typeof wishlistAllocations.$inferSelect>
): WishlistWithProgress {
  return {
    ...item,
    progress: calculateWishlistProgress(item.savedAmount, item.targetAmount),
    allocations,
  };
}

/**
 * Mengambil seluruh daftar barang impian (wishlists) pengguna beserta
 * status milestone (50%, 75%, 90%, 95%, 100%), riwayat alokasi sinking fund,
 * dan saldo tabungan bebas saat ini.
 */
export async function getWishlists(
  explicitUserId?: string
): Promise<ActionResponse<WishlistsSummary>> {
  const userId = await resolveAuthenticatedUserId(explicitUserId);
  if (!userId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi. Silakan login terlebih dahulu.",
    };
  }

  try {
    const [records, allocationsList, [savingsRow]] = await Promise.all([
      db
        .select()
        .from(wishlists)
        .where(eq(wishlists.userId, userId))
        .orderBy(asc(wishlists.isPurchased), desc(wishlists.createdAt)),
      db
        .select()
        .from(wishlistAllocations)
        .where(eq(wishlistAllocations.userId, userId))
        .orderBy(desc(wishlistAllocations.createdAt)),
      db
        .select()
        .from(savingsAccount)
        .where(eq(savingsAccount.userId, userId))
        .limit(1),
    ]);

    const allocationsMap = new Map<
      string,
      Array<typeof wishlistAllocations.$inferSelect>
    >();
    for (const alloc of allocationsList) {
      const list = allocationsMap.get(alloc.wishlistId) ?? [];
      list.push(alloc);
      allocationsMap.set(alloc.wishlistId, list);
    }

    const items = records.map((w) =>
      enrichWishlist(w, allocationsMap.get(w.id) ?? [])
    );

    const totalAllocatedToWishlists = items
      .filter((w) => !w.isPurchased)
      .reduce((sum, w) => sum + w.savedAmount, 0);

    const completedCount = items.filter(
      (w) => w.isPurchased || w.progress.isCompleted
    ).length;

    return {
      success: true,
      data: {
        items,
        freeSavingsBalance: savingsRow?.balance ?? 0,
        totalAllocatedToWishlists,
        completedCount,
      },
    };
  } catch (err) {
    console.error("Gagal memuat daftar wishlist:", err);
    return {
      success: false,
      error: "Gagal memuat daftar barang impian.",
    };
  }
}
