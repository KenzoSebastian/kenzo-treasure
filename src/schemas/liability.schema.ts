/**
 * ==============================================================================
 * Kenzo Treasury — Zod Liability & Installment Schemas
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mendefinisikan kontrak validasi untuk utang/cicilan bertarget lunas (`liabilities`).
 * Memastikan cicilan memiliki batas akhir yang pasti (finite debt lifetime),
 * nominal integer Rupiah murni, dan pencatatan pembayaran cicilan bulanan yang
 * terhubung ke pos anggaran.
 */

import { z } from "zod";

/**
 * Validasi penambahan pos utang/cicilan baru.
 */
export const createLiabilitySchema = z
  .object({
    name: z
      .string({ message: "Nama utang/cicilan wajib diisi" })
      .trim()
      .min(2, { message: "Nama utang minimal 2 karakter" })
      .max(100, { message: "Nama utang maksimal 100 karakter" }),
    totalAmount: z.coerce
      .number({ message: "Total kewajiban wajib diisi" })
      .int({ message: "Total kewajiban harus berupa integer bulat" })
      .positive({ message: "Total kewajiban harus lebih besar dari 0" }),
    monthlyPayment: z.coerce
      .number({ message: "Cicilan per bulan wajib diisi" })
      .int({ message: "Cicilan per bulan harus berupa integer bulat" })
      .positive({ message: "Cicilan per bulan harus lebih besar dari 0" }),
    totalMonths: z.coerce
      .number()
      .int({ message: "Estimasi durasi bulan harus integer bulat" })
      .positive({ message: "Estimasi durasi minimal 1 bulan" })
      .optional()
      .nullable(),
    paidAmount: z.coerce
      .number()
      .int({ message: "Akumulasi terbayar harus integer bulat" })
      .min(0, { message: "Akumulasi terbayar tidak boleh negatif" })
      .default(0),
  })
  .refine((data) => data.monthlyPayment <= data.totalAmount, {
    message: "Cicilan bulanan tidak boleh melebihi total kewajiban utang",
    path: ["monthlyPayment"],
  });

/**
 * Validasi pencatatan setoran cicilan bulanan.
 */
export const recordInstallmentSchema = z.object({
  liabilityId: z
    .string({ message: "ID utang/cicilan wajib diisi" })
    .uuid({ message: "Format ID utang tidak valid" }),
  amount: z.coerce
    .number({ message: "Nominal pembayaran cicilan wajib diisi" })
    .int({ message: "Nominal pembayaran harus berupa integer bulat" })
    .positive({ message: "Nominal pembayaran harus lebih besar dari 0" }),
  transactionId: z
    .string()
    .uuid({ message: "Format ID transaksi tidak valid" })
    .optional()
    .nullable(),
});

/**
 * Validasi pembaruan data utang/cicilan.
 */
export const updateLiabilitySchema = z.object({
  liabilityId: z
    .string({ message: "ID utang/cicilan wajib diisi" })
    .uuid({ message: "Format ID utang tidak valid" }),
  name: z
    .string()
    .trim()
    .min(2, { message: "Nama utang minimal 2 karakter" })
    .max(100, { message: "Nama utang maksimal 100 karakter" })
    .optional(),
  totalAmount: z.coerce
    .number()
    .int({ message: "Total kewajiban harus berupa integer bulat" })
    .positive({ message: "Total kewajiban harus lebih besar dari 0" })
    .optional(),
  monthlyPayment: z.coerce
    .number()
    .int({ message: "Cicilan per bulan harus berupa integer bulat" })
    .positive({ message: "Cicilan per bulan harus lebih besar dari 0" })
    .optional(),
  totalMonths: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
});

export type CreateLiabilityInput = z.infer<typeof createLiabilitySchema>;
export type RecordInstallmentInput = z.infer<typeof recordInstallmentSchema>;
export type UpdateLiabilityInput = z.infer<typeof updateLiabilitySchema>;
