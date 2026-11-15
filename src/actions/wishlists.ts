"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Gamified Wishlists & Sinking Fund (Fase B10)
 * ==============================================================================
 *
 * Mengelola seluruh mutasi barang impian (`wishlists`) dan buku besar alokasi
 * dana (`wishlist_allocations`) dengan prinsip Transfer Antar-Kantong:
 * 1. `createWishlist`: Menambah target barang impian baru.
 * 2. `allocateSavings`: Memindahkan dana secara atomik dari `savings_account.balance`
 *    ke `wishlists.saved_amount` dan mencatat riwayat di `wishlist_allocations`.
 * 3. `withdrawFromWishlist`: Menarik kembali dana dari wishlist ke tabungan bebas.
 * 4. `markWishlistAsPurchased`: Menandai barang impian sebagai terbeli.
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { wishlists, wishlistAllocations, savingsAccount } from "@/db/schema";
import {
  createWishlistSchema,
  allocateWishlistSchema,
  markWishlistPurchasedSchema,
  type CreateWishlistInput,
  type AllocateWishlistInput,
  type MarkWishlistPurchasedInput,
} from "@/schemas/wishlist.schema";
import { resolveCategoryIconKey } from "@/lib/category-icons";
import { DEFAULT_EMERGENCY_FUND_TARGET } from "@/lib/financial-calculations";
import { resolveAuthenticatedUserId } from "@/lib/queries/months";
import { getWishlists, enrichWishlist } from "@/lib/queries/wishlists";
import { revalidateDashboardRoutes } from "@/lib/revalidate";
import type { ActionResponse, WishlistWithProgress } from "@/types";

export { getWishlists };

/* ══════════════════════════════════════════════════════════════════════════════
   1. SERVER ACTION: createWishlist
   ══════════════════════════════════════════════════════════════════════════════ */

export async function createWishlist(
  input: CreateWishlistInput,
  explicitUserId?: string
): Promise<ActionResponse<WishlistWithProgress>> {
  try {
    const parsed = createWishlistSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Validasi data barang impian gagal.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi. Silakan login terlebih dahulu.",
      };
    }

    const [created] = await db
      .insert(wishlists)
      .values({
        userId,
        name: parsed.data.name,
        targetAmount: parsed.data.targetAmount,
        savedAmount: 0,
        icon: resolveCategoryIconKey(parsed.data.icon, "kebutuhan"),
        imageUrl: parsed.data.imageUrl || null,
        isPurchased: false,
      })
      .returning();

    revalidateDashboardRoutes();

    return {
      success: true,
      data: enrichWishlist(created, []),
    };
  } catch (err) {
    console.error("Gagal membuat wishlist baru:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan barang impian baru.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. SERVER ACTION: allocateSavings
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Mengalokasikan dana dari Saldo Tabungan Bebas (`savings_account.balance`) ke Wishlist:
 * - Mendukung `allocateSavings(wishlistId, amount, notes?)` atau `allocateSavings(input)`.
 * - Menolak mutasi jika saldo tabungan bebas tidak mencukupi (Anti-Defisit Invariant 5).
 */
export async function allocateSavings(
  inputOrWishlistId: string | AllocateWishlistInput,
  amountArg?: number,
  notesArg?: string | null,
  explicitUserId?: string
): Promise<ActionResponse<WishlistWithProgress>> {
  try {
    const rawPayload =
      typeof inputOrWishlistId === "string"
        ? {
            wishlistId: inputOrWishlistId,
            amount: amountArg,
            direction: "deposit" as const,
            notes: notesArg ?? null,
          }
        : inputOrWishlistId;

    const parsed = allocateWishlistSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "Validasi nominal alokasi gagal.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    if (parsed.data.direction === "withdraw") {
      return withdrawFromWishlist(
        parsed.data.wishlistId,
        parsed.data.amount,
        parsed.data.notes ?? undefined,
        explicitUserId
      );
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const { wishlistId, amount, notes } = parsed.data;

    const result = await db.transaction(async (tx) => {
      const [targetWishlist] = await tx
        .select()
        .from(wishlists)
        .where(and(eq(wishlists.id, wishlistId), eq(wishlists.userId, userId)))
        .limit(1);

      if (!targetWishlist) {
        throw new Error("WISHLIST_NOT_FOUND");
      }

      const [savingsRow] = await tx
        .select()
        .from(savingsAccount)
        .where(eq(savingsAccount.userId, userId))
        .limit(1);

      const availableBalance = savingsRow?.balance ?? 0;
      if (availableBalance < amount) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // 1. Kurangi saldo tabungan bebas
      await tx
        .update(savingsAccount)
        .set({
          balance: availableBalance - amount,
          updatedAt: new Date(),
        })
        .where(eq(savingsAccount.userId, userId));

      // 2. Tambah saved_amount di wishlists
      const [updatedWishlist] = await tx
        .update(wishlists)
        .set({
          savedAmount: targetWishlist.savedAmount + amount,
          updatedAt: new Date(),
        })
        .where(eq(wishlists.id, wishlistId))
        .returning();

      // 3. Catat riwayat di wishlist_allocations (+)
      await tx.insert(wishlistAllocations).values({
        wishlistId,
        userId,
        amount,
        notes: notes || "Setoran alokasi dari tabungan bebas",
      });

      const allocations = await tx
        .select()
        .from(wishlistAllocations)
        .where(eq(wishlistAllocations.wishlistId, wishlistId))
        .orderBy(desc(wishlistAllocations.createdAt));

      return enrichWishlist(updatedWishlist, allocations);
    });

    revalidateDashboardRoutes();

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    if (err instanceof Error && err.message === "WISHLIST_NOT_FOUND") {
      return {
        success: false,
        error: "Barang impian tidak ditemukan.",
      };
    }
    if (err instanceof Error && err.message === "INSUFFICIENT_FUNDS") {
      return {
        success: false,
        error:
          "Saldo tabungan bebas tidak mencukupi untuk alokasi nominal tersebut.",
      };
    }
    console.error("Gagal mengalokasikan tabungan ke wishlist:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat mengalokasikan dana ke wishlist.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. SERVER ACTION: withdrawFromWishlist
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Menarik kembali dana dari Wishlist ke Saldo Tabungan Bebas (`savings_account.balance`).
 */
export async function withdrawFromWishlist(
  wishlistId: string,
  amount: number,
  notes?: string,
  explicitUserId?: string
): Promise<ActionResponse<WishlistWithProgress>> {
  try {
    const parsed = allocateWishlistSchema.safeParse({
      wishlistId,
      amount,
      direction: "withdraw",
      notes: notes ?? null,
    });

    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Validasi nominal penarikan gagal.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const result = await db.transaction(async (tx) => {
      const [targetWishlist] = await tx
        .select()
        .from(wishlists)
        .where(
          and(
            eq(wishlists.id, parsed.data.wishlistId),
            eq(wishlists.userId, userId)
          )
        )
        .limit(1);

      if (!targetWishlist) {
        throw new Error("WISHLIST_NOT_FOUND");
      }

      if (targetWishlist.savedAmount < parsed.data.amount) {
        throw new Error("INSUFFICIENT_WISHLIST_BALANCE");
      }

      // Pastikan akun tabungan ada
      let [savingsRow] = await tx
        .select()
        .from(savingsAccount)
        .where(eq(savingsAccount.userId, userId))
        .limit(1);

      if (!savingsRow) {
        const [createdSavings] = await tx
          .insert(savingsAccount)
          .values({
            userId,
            balance: 0,
            emergencyFundTarget: DEFAULT_EMERGENCY_FUND_TARGET,
            emergencyFundBalance: 0,
          })
          .returning();
        savingsRow = createdSavings;
      }

      // 1. Kurangi saved_amount di wishlists
      const [updatedWishlist] = await tx
        .update(wishlists)
        .set({
          savedAmount: targetWishlist.savedAmount - parsed.data.amount,
          updatedAt: new Date(),
        })
        .where(eq(wishlists.id, parsed.data.wishlistId))
        .returning();

      // 2. Kembalikan ke saldo tabungan bebas
      await tx
        .update(savingsAccount)
        .set({
          balance: (savingsRow?.balance ?? 0) + parsed.data.amount,
          updatedAt: new Date(),
        })
        .where(eq(savingsAccount.userId, userId));

      // 3. Catat entri negatif (-) di wishlist_allocations
      await tx.insert(wishlistAllocations).values({
        wishlistId: parsed.data.wishlistId,
        userId,
        amount: -parsed.data.amount,
        notes: parsed.data.notes || "Penarikan kembali ke tabungan bebas",
      });

      const allocations = await tx
        .select()
        .from(wishlistAllocations)
        .where(eq(wishlistAllocations.wishlistId, parsed.data.wishlistId))
        .orderBy(desc(wishlistAllocations.createdAt));

      return enrichWishlist(updatedWishlist, allocations);
    });

    revalidateDashboardRoutes();

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    if (err instanceof Error && err.message === "WISHLIST_NOT_FOUND") {
      return {
        success: false,
        error: "Barang impian tidak ditemukan.",
      };
    }
    if (
      err instanceof Error &&
      err.message === "INSUFFICIENT_WISHLIST_BALANCE"
    ) {
      return {
        success: false,
        error:
          "Nominal penarikan melebihi dana yang terkumpul pada barang impian ini.",
      };
    }
    console.error("Gagal menarik dana dari wishlist:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menarik dana dari wishlist.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   4. SERVER ACTION: markWishlistAsPurchased
   ══════════════════════════════════════════════════════════════════════════════ */

export async function markWishlistAsPurchased(
  inputOrId: string | MarkWishlistPurchasedInput,
  explicitUserId?: string
): Promise<ActionResponse<WishlistWithProgress>> {
  try {
    const rawPayload =
      typeof inputOrId === "string"
        ? { wishlistId: inputOrId }
        : inputOrId;

    const parsed = markWishlistPurchasedSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "ID wishlist tidak valid.",
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const [targetWishlist] = await db
      .select()
      .from(wishlists)
      .where(
        and(
          eq(wishlists.id, parsed.data.wishlistId),
          eq(wishlists.userId, userId)
        )
      )
      .limit(1);

    if (!targetWishlist) {
      return {
        success: false,
        error: "Barang impian tidak ditemukan.",
      };
    }

    if (targetWishlist.savedAmount < targetWishlist.targetAmount) {
      return {
        success: false,
        error:
          "Dana tabungan barang impian belum mencapai 100% dari target harga.",
      };
    }

    const [updated] = await db
      .update(wishlists)
      .set({
        isPurchased: true,
        updatedAt: new Date(),
      })
      .where(eq(wishlists.id, parsed.data.wishlistId))
      .returning();

    const allocations = await db
      .select()
      .from(wishlistAllocations)
      .where(eq(wishlistAllocations.wishlistId, parsed.data.wishlistId))
      .orderBy(desc(wishlistAllocations.createdAt));

    revalidateDashboardRoutes();

    return {
      success: true,
      data: enrichWishlist(updated, allocations),
    };
  } catch (err) {
    console.error("Gagal menandai wishlist sebagai dibeli:", err);
    return {
      success: false,
      error: "Gagal memperbarui status pembelian barang impian.",
    };
  }
}
