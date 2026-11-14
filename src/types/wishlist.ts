/**
 * ==============================================================================
 * Kenzo Treasury — Shared Wishlist & Sinking Fund Types (Fase B10)
 * ==============================================================================
 */

import type {
  Wishlist,
  NewWishlist,
  WishlistAllocation,
  NewWishlistAllocation,
} from "@/db/schema";
import type { WishlistProgress } from "@/lib/financial-calculations";

export type {
  Wishlist,
  NewWishlist,
  WishlistAllocation,
  NewWishlistAllocation,
};

export interface WishlistWithProgress extends Wishlist {
  progress: WishlistProgress;
  allocations: WishlistAllocation[];
}

export interface WishlistsSummary {
  items: WishlistWithProgress[];
  freeSavingsBalance: number;
  totalAllocatedToWishlists: number;
  completedCount: number;
}
