/**
 * ==============================================================================
 * Kenzo Treasury — Zod Transaction Schemas
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mendefinisikan kontrak validasi pencatatan pengeluaran harian (`transactions`).
 * Menegakkan nominal pengeluaran integer positif (> 0), format tanggal ISO YYYY-MM-DD,
 * metode pembayaran multi-channel, serta aksi soft-delete dan restore untuk fitur
 * undo pengeluaran 5 detik.
 */

import { z } from "zod";

/**
 * Validasi metode pembayaran transaksi.
 */
export const transactionMethodSchema = z.enum(
  ["cash", "debit", "qris", "transfer"],
  {
    message: "Metode pembayaran harus 'cash', 'debit', 'qris', atau 'transfer'",
  }
);

/**
 * Validasi pencatatan transaksi pengeluaran harian baru.
 */
export const createTransactionSchema = z.object({
  categoryId: z
    .string({ message: "Pos anggaran wajib dipilih" })
    .uuid({ message: "Format ID pos anggaran tidak valid" }),
  amount: z.coerce
    .number({ message: "Nominal pengeluaran wajib diisi" })
    .int({ message: "Nominal pengeluaran harus berupa integer bulat tanpa desimal" })
    .positive({ message: "Nominal pengeluaran harus lebih besar dari 0" }),
  date: z
    .string({ message: "Tanggal transaksi wajib diisi" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Format tanggal harus YYYY-MM-DD",
    }),
  description: z
    .string({ message: "Keterangan transaksi wajib diisi" })
    .trim()
    .min(1, { message: "Keterangan transaksi tidak boleh kosong" })
    .max(200, { message: "Keterangan transaksi maksimal 200 karakter" }),
  method: transactionMethodSchema.default("qris"),
});

/**
 * Validasi pembaruan data transaksi pengeluaran.
 */
export const updateTransactionSchema = z.object({
  transactionId: z
    .string({ message: "ID transaksi wajib diisi" })
    .uuid({ message: "Format ID transaksi tidak valid" }),
  categoryId: z
    .string()
    .uuid({ message: "Format ID pos anggaran tidak valid" })
    .optional(),
  amount: z.coerce
    .number()
    .int({ message: "Nominal pengeluaran harus berupa integer bulat" })
    .positive({ message: "Nominal pengeluaran harus lebih besar dari 0" })
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Format tanggal harus YYYY-MM-DD",
    })
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, { message: "Keterangan transaksi tidak boleh kosong" })
    .max(200, { message: "Keterangan transaksi maksimal 200 karakter" })
    .optional(),
  method: transactionMethodSchema.optional(),
});

/**
 * Validasi soft-delete transaksi (untuk Undo toast 5 detik).
 */
export const softDeleteTransactionSchema = z.object({
  transactionId: z
    .string({ message: "ID transaksi wajib diisi" })
    .uuid({ message: "Format ID transaksi tidak valid" }),
});

/**
 * Validasi restore transaksi yang telah di-soft-delete (fitur Undo).
 */
export const restoreTransactionSchema = z.object({
  transactionId: z
    .string({ message: "ID transaksi wajib diisi" })
    .uuid({ message: "Format ID transaksi tidak valid" }),
});

export type TransactionMethod = z.infer<typeof transactionMethodSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type SoftDeleteTransactionInput = z.infer<typeof softDeleteTransactionSchema>;
export type RestoreTransactionInput = z.infer<typeof restoreTransactionSchema>;
