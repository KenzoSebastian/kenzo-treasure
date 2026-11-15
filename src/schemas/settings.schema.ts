/**
 * ==============================================================================
 * Kenzo Treasury — Zod Settings & Budget Template Management Schemas (Fase R10)
 * ==============================================================================
 */

import { z } from "zod";
import { categoryGroupSchema } from "./category.schema";

export const updateFinanceDefaultsSchema = z.object({
  defaultBaseSalary: z.coerce
    .number({ message: "Gaji pokok default wajib diisi" })
    .int({ message: "Gaji pokok harus berupa integer bulat" })
    .min(0, { message: "Gaji pokok tidak boleh negatif" })
    .nullable(),
  emergencyFundTarget: z.coerce
    .number({ message: "Target dana darurat wajib diisi" })
    .int({ message: "Target dana darurat harus berupa integer bulat" })
    .min(0, { message: "Target dana darurat tidak boleh negatif" }),
});

export const upsertBudgetTemplateSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  templateId: z.string().uuid().optional().nullable(),
  name: z
    .string({ message: "Nama template pos wajib diisi" })
    .trim()
    .min(2, { message: "Nama template minimal 2 karakter" })
    .max(50, { message: "Nama template maksimal 50 karakter" }),
  icon: z
    .string()
    .trim()
    .min(1, { message: "Icon wajib dipilih" })
    .max(50, { message: "Icon maksimal 50 karakter" })
    .default("wallet"),
  group: categoryGroupSchema,
  targetBudget: z.coerce
    .number({ message: "Target anggaran wajib diisi" })
    .int({ message: "Target anggaran harus berupa integer bulat" })
    .min(0, { message: "Target anggaran tidak boleh negatif" }),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const deleteBudgetTemplateSchema = z
  .object({
    id: z.string().uuid().optional(),
    templateId: z.string().uuid().optional(),
  })
  .refine((data) => Boolean(data.templateId || data.id), {
    message: "ID template wajib diisi",
  });

export type UpdateFinanceDefaultsInput = z.infer<
  typeof updateFinanceDefaultsSchema
>;
export type UpsertBudgetTemplateInput = z.infer<
  typeof upsertBudgetTemplateSchema
>;
export type DeleteBudgetTemplateInput = z.infer<
  typeof deleteBudgetTemplateSchema
>;
