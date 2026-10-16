/**
 * ==============================================================================
 * Kenzo Treasury — Zod Budget Category Schemas
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mendefinisikan kontrak validasi untuk pos anggaran bulanan (`budget_categories`).
 * Memastikan alokasi dana diklasifikasikan ke salah satu dari 3 kelompok invarian:
 * `pos_wajib`, `kebutuhan`, atau `uang_bebas_tabungan`, serta menegakkan nominal
 * target anggaran dalam integer Rupiah non-negatif.
 */

import { z } from "zod";

/**
 * Validasi kelompok pos anggaran.
 */
export const categoryGroupSchema = z.enum(
  ["pos_wajib", "kebutuhan", "uang_bebas_tabungan"],
  {
    message: "Kelompok pos anggaran harus 'pos_wajib', 'kebutuhan', atau 'uang_bebas_tabungan'",
  }
);

/**
 * Validasi pembuatan pos anggaran baru.
 */
export const createCategorySchema = z.object({
  monthId: z
    .string({ message: "ID bulan wajib diisi" })
    .uuid({ message: "Format ID bulan tidak valid" }),
  name: z
    .string({ message: "Nama pos anggaran wajib diisi" })
    .trim()
    .min(2, { message: "Nama pos minimal 2 karakter" })
    .max(50, { message: "Nama pos maksimal 50 karakter" }),
  icon: z
    .string()
    .trim()
    .min(1, { message: "Icon wajib dipilih" })
    .max(10, { message: "Icon maksimal 10 karakter" })
    .default("💰"),
  group: categoryGroupSchema,
  targetBudget: z.coerce
    .number({ message: "Target anggaran wajib diisi" })
    .int({ message: "Target anggaran harus berupa integer bulat" })
    .min(0, { message: "Target anggaran tidak boleh bernilai negatif" }),
  liabilityId: z
    .string()
    .uuid({ message: "Format ID utang/cicilan tidak valid" })
    .optional()
    .nullable(),
  isTemporary: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

/**
 * Validasi pembaruan plafon target anggaran (quick update).
 */
export const updateCategoryTargetSchema = z.object({
  categoryId: z
    .string({ message: "ID pos anggaran wajib diisi" })
    .uuid({ message: "Format ID pos anggaran tidak valid" }),
  targetBudget: z.coerce
    .number({ message: "Target anggaran wajib diisi" })
    .int({ message: "Target anggaran harus berupa integer bulat" })
    .min(0, { message: "Target anggaran tidak boleh bernilai negatif" }),
});

/**
 * Validasi pembaruan detail pos anggaran.
 */
export const updateCategorySchema = z.object({
  categoryId: z
    .string({ message: "ID pos anggaran wajib diisi" })
    .uuid({ message: "Format ID pos anggaran tidak valid" }),
  name: z
    .string()
    .trim()
    .min(2, { message: "Nama pos minimal 2 karakter" })
    .max(50, { message: "Nama pos maksimal 50 karakter" })
    .optional(),
  icon: z.string().trim().min(1).max(10).optional(),
  group: categoryGroupSchema.optional(),
  targetBudget: z.coerce
    .number()
    .int({ message: "Target anggaran harus berupa integer bulat" })
    .min(0, { message: "Target anggaran tidak boleh bernilai negatif" })
    .optional(),
  liabilityId: z
    .string()
    .uuid({ message: "Format ID utang tidak valid" })
    .optional()
    .nullable(),
  sortOrder: z.coerce.number().int().optional(),
});

/**
 * Validasi penyusunan ulang urutan pos anggaran (drag & drop reorder).
 */
export const reorderCategoriesSchema = z.object({
  monthId: z
    .string({ message: "ID bulan wajib diisi" })
    .uuid({ message: "Format ID bulan tidak valid" }),
  categoryIds: z
    .array(
      z.string().uuid({ message: "Format ID kategori dalam list tidak valid" })
    )
    .min(1, { message: "Daftar urutan kategori tidak boleh kosong" }),
});

export type CategoryGroup = z.infer<typeof categoryGroupSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryTargetInput = z.infer<typeof updateCategoryTargetSchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
