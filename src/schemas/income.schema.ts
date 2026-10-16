/**
 * ==============================================================================
 * Kenzo Treasury — Zod Income Validation Schemas
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mendefinisikan kontrak validasi pencatatan pemasukan (`incomes`).
 * Menegakkan aturan nominal integer Rupiah murni > 0, pembedaan antara gaji pokok
 * rutin (`isBaseSalary = true`) dan pendapatan freelance/sampingan yang menjadi
 * Dynamic Freedom Buffer ke pos `uang_bebas_tabungan`.
 */

import { z } from "zod";

/**
 * Validasi pembuatan pemasukan baru.
 */
export const createIncomeSchema = z.object({
  monthId: z
    .string({ message: "ID bulan wajib diisi" })
    .uuid({ message: "Format ID bulan tidak valid" }),
  source: z
    .string({ message: "Sumber pemasukan wajib diisi" })
    .trim()
    .min(2, { message: "Sumber pemasukan minimal 2 karakter" })
    .max(100, { message: "Sumber pemasukan maksimal 100 karakter" }),
  amount: z.coerce
    .number({ message: "Nominal pemasukan wajib diisi" })
    .int({ message: "Nominal pemasukan harus berupa integer bulat tanpa desimal" })
    .positive({ message: "Nominal pemasukan harus lebih besar dari 0" }),
  date: z
    .string({ message: "Tanggal pemasukan wajib diisi" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Format tanggal harus YYYY-MM-DD",
    }),
  isBaseSalary: z.boolean().default(false),
});

/**
 * Validasi pembaruan data pemasukan.
 */
export const updateIncomeSchema = z.object({
  incomeId: z
    .string({ message: "ID pemasukan wajib diisi" })
    .uuid({ message: "Format ID pemasukan tidak valid" }),
  source: z
    .string()
    .trim()
    .min(2, { message: "Sumber pemasukan minimal 2 karakter" })
    .max(100, { message: "Sumber pemasukan maksimal 100 karakter" })
    .optional(),
  amount: z.coerce
    .number()
    .int({ message: "Nominal pemasukan harus berupa integer bulat" })
    .positive({ message: "Nominal pemasukan harus lebih besar dari 0" })
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Format tanggal harus YYYY-MM-DD",
    })
    .optional(),
  isBaseSalary: z.boolean().optional(),
});

/**
 * Validasi penghapusan pemasukan.
 */
export const deleteIncomeSchema = z.object({
  incomeId: z
    .string({ message: "ID pemasukan wajib diisi" })
    .uuid({ message: "Format ID pemasukan tidak valid" }),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type DeleteIncomeInput = z.infer<typeof deleteIncomeSchema>;
