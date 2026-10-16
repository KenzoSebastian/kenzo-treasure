/**
 * ==============================================================================
 * Kenzo Treasury — Zod Month Lifecycle Schemas
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mendefinisikan kontrak validasi untuk inisialisasi lembar kerja bulanan (`months`),
 * pemilihan bulan aktif, dan proses tutup buku (Month Closing / Sweep).
 * Menjaga invarian siklus bulanan terisolasi (Isolated Monthly Cycles).
 */

import { z } from "zod";

/**
 * Validasi pembuatan siklus bulan baru (Zero-Based Budgeting baseline).
 */
export const createMonthSchema = z.object({
  year: z.coerce
    .number({ message: "Tahun wajib diisi" })
    .int({ message: "Tahun harus berupa integer bulat" })
    .min(2020, { message: "Tahun minimal 2020" })
    .max(2100, { message: "Tahun maksimal 2100" }),
  monthIndex: z.coerce
    .number({ message: "Bulan wajib diisi" })
    .int({ message: "Indeks bulan harus integer bulat" })
    .min(1, { message: "Indeks bulan minimal 1 (Januari)" })
    .max(12, { message: "Indeks bulan maksimal 12 (Desember)" }),
  name: z
    .string()
    .trim()
    .min(3, { message: "Nama bulan minimal 3 karakter" })
    .optional(),
  baseSalary: z.coerce
    .number()
    .int({ message: "Gaji pokok harus berupa integer bulat" })
    .positive({ message: "Gaji pokok harus bernilai positif" })
    .default(4000000),
  rolloverSavings: z.boolean().default(true),
});

/**
 * Validasi penutupan buku siklus bulanan (End-of-Month Sweep).
 */
export const closeMonthSchema = z.object({
  monthId: z
    .string({ message: "ID bulan wajib diisi" })
    .uuid({ message: "Format ID bulan tidak valid" }),
  surplusAction: z
    .enum(["sweep_to_savings", "keep"], {
      message: "Aksi surplus harus 'sweep_to_savings' atau 'keep'",
    })
    .default("sweep_to_savings"),
});

/**
 * Validasi pembukaan kembali siklus bulanan yang telah ditutup (Reopen Month).
 */
export const reopenMonthSchema = z.object({
  monthId: z
    .string({ message: "ID bulan wajib diisi" })
    .uuid({ message: "Format ID bulan tidak valid" }),
});

export type CreateMonthInput = z.infer<typeof createMonthSchema>;
export type CloseMonthInput = z.infer<typeof closeMonthSchema>;
export type ReopenMonthInput = z.infer<typeof reopenMonthSchema>;
