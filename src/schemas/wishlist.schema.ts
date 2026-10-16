/**
 * ==============================================================================
 * Kenzo Treasury — Zod Wishlist & Sinking Fund Schemas
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mendefinisikan kontrak validasi untuk barang impian (`wishlists`) dan alokasi
 * sinking fund (`wishlist_allocations`).
 * Memastikan target barang bernilai positif, pemindahan dana antara tabungan bebas
 * dan pos barang impian tercatat dengan presisi tanpa menciptakan/menghilangkan uang.
 */

import { z } from "zod";

/**
 * Validasi pembuatan wishlist baru.
 */
export const createWishlistSchema = z.object({
  name: z
    .string({ message: "Nama barang impian wajib diisi" })
    .trim()
    .min(2, { message: "Nama barang impian minimal 2 karakter" })
    .max(100, { message: "Nama barang impian maksimal 100 karakter" }),
  targetAmount: z.coerce
    .number({ message: "Target harga wajib diisi" })
    .int({ message: "Target harga harus berupa integer bulat tanpa desimal" })
    .positive({ message: "Target harga harus lebih besar dari 0" }),
  icon: z
    .string()
    .trim()
    .min(1, { message: "Icon wajib dipilih" })
    .max(10, { message: "Icon maksimal 10 karakter" })
    .default("🎯"),
  imageUrl: z
    .string()
    .url({ message: "Format URL gambar tidak valid" })
    .optional()
    .or(z.literal(""))
    .nullable(),
});

/**
 * Validasi pembaruan data wishlist.
 */
export const updateWishlistSchema = z.object({
  wishlistId: z
    .string({ message: "ID wishlist wajib diisi" })
    .uuid({ message: "Format ID wishlist tidak valid" }),
  name: z
    .string()
    .trim()
    .min(2, { message: "Nama barang impian minimal 2 karakter" })
    .max(100, { message: "Nama barang impian maksimal 100 karakter" })
    .optional(),
  targetAmount: z.coerce
    .number()
    .int({ message: "Target harga harus berupa integer bulat" })
    .positive({ message: "Target harga harus lebih besar dari 0" })
    .optional(),
  icon: z.string().trim().min(1).max(10).optional(),
  imageUrl: z
    .string()
    .url({ message: "Format URL gambar tidak valid" })
    .optional()
    .or(z.literal(""))
    .nullable(),
});

/**
 * Validasi mutasi setor atau tarik dana tabungan impian (Sinking Fund Ledger).
 */
export const allocateWishlistSchema = z.object({
  wishlistId: z
    .string({ message: "ID wishlist wajib diisi" })
    .uuid({ message: "Format ID wishlist tidak valid" }),
  amount: z.coerce
    .number({ message: "Nominal alokasi wajib diisi" })
    .int({ message: "Nominal alokasi harus berupa integer bulat" })
    .positive({ message: "Nominal alokasi harus lebih besar dari 0" }),
  direction: z
    .enum(["deposit", "withdraw"], {
      message: "Arah mutasi harus 'deposit' (setor) atau 'withdraw' (tarik)",
    })
    .default("deposit"),
  notes: z
    .string()
    .trim()
    .max(200, { message: "Catatan maksimal 200 karakter" })
    .optional()
    .nullable(),
});

/**
 * Validasi penandaan wishlist sebagai sudah terbeli (Milestone 100% Achieved).
 */
export const markWishlistPurchasedSchema = z.object({
  wishlistId: z
    .string({ message: "ID wishlist wajib diisi" })
    .uuid({ message: "Format ID wishlist tidak valid" }),
});

export type CreateWishlistInput = z.infer<typeof createWishlistSchema>;
export type UpdateWishlistInput = z.infer<typeof updateWishlistSchema>;
export type AllocateWishlistInput = z.infer<typeof allocateWishlistSchema>;
export type MarkWishlistPurchasedInput = z.infer<typeof markWishlistPurchasedSchema>;
