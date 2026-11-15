/**
 * ==============================================================================
 * Kenzo Treasury — Zod Onboarding Wizard Schemas (Fase R3 & R10)
 * ==============================================================================
 */

import { z } from "zod";
import { categoryGroupSchema } from "./category.schema";

export const onboardingSalarySchema = z.object({
  defaultBaseSalary: z.coerce
    .number({ message: "Gaji pokok wajib berupa angka" })
    .int({ message: "Gaji pokok harus berupa integer bulat" })
    .min(0, { message: "Gaji pokok tidak boleh negatif" })
    .nullable(),
});

export const onboardingSalaryStepSchema = z.object({
  defaultBaseSalary: z.coerce
    .number({ message: "Gaji pokok wajib berupa angka" })
    .int({ message: "Gaji pokok harus berupa integer bulat" })
    .min(0, { message: "Gaji pokok tidak boleh negatif" })
    .default(0),
});

export const budgetTemplateItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string({ message: "Nama pos wajib diisi" })
    .trim()
    .min(2, { message: "Nama pos minimal 2 karakter" })
    .max(50, { message: "Nama pos maksimal 50 karakter" }),
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
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true).optional(),
});

export const budgetTemplateSchema = budgetTemplateItemSchema;

export const onboardingTemplatesListSchema = z
  .array(budgetTemplateItemSchema)
  .refine(
    (items) =>
      items.filter((item) => item.group === "uang_bebas_tabungan").length <= 1,
    {
      message:
        "Maksimal hanya boleh ada 1 pos dalam kelompok Uang Bebas / Tabungan",
    }
  );

export const onboardingTemplatesStepSchema = z.object({
  templates: onboardingTemplatesListSchema,
});

export const onboardingVaultSchema = z.object({
  balance: z.coerce
    .number()
    .int()
    .min(0, { message: "Saldo tabungan tidak boleh negatif" })
    .default(0),
  emergencyFundBalance: z.coerce
    .number()
    .int()
    .min(0, { message: "Saldo dana darurat tidak boleh negatif" })
    .default(0),
  emergencyFundTarget: z.coerce
    .number()
    .int()
    .min(0, { message: "Target dana darurat tidak boleh negatif" })
    .default(0),
});

export const onboardingInitialLiabilityItemSchema = z.object({
  name: z.string().trim().min(2).max(100),
  icon: z.string().trim().min(1).max(50).default("credit-card"),
  totalAmount: z.coerce.number().int().min(1),
  paidAmount: z.coerce.number().int().min(0).default(0),
  monthlyPayment: z.coerce.number().int().min(1),
  totalMonths: z.coerce.number().int().min(1).optional(),
});

export const onboardingVaultAndLiabilityStepSchema = z.object({
  currentBalance: z.coerce.number().int().min(0).default(0),
  emergencyFundTarget: z.coerce.number().int().min(0).default(0),
  initialLiability: onboardingInitialLiabilityItemSchema.optional().nullable(),
});

export const onboardingSchema = z.object({
  defaultBaseSalary: z.coerce.number().int().min(0).default(0),
  emergencyFundTarget: z.coerce.number().int().min(0).default(0),
  budgetTemplates: onboardingTemplatesListSchema.default([]),
  liabilities: z.array(onboardingInitialLiabilityItemSchema).default([]),
  createInitialMonth: z.boolean().default(true).optional(),
});

export type OnboardingSalaryInput = z.infer<typeof onboardingSalarySchema>;
export type OnboardingSalaryStepInput = z.infer<
  typeof onboardingSalaryStepSchema
>;
export type BudgetTemplateItemInput = z.infer<typeof budgetTemplateItemSchema>;
export type BudgetTemplateInput = z.infer<typeof budgetTemplateSchema>;
export type OnboardingTemplatesStepInput = z.infer<
  typeof onboardingTemplatesStepSchema
>;
export type OnboardingVaultInput = z.infer<typeof onboardingVaultSchema>;
export type OnboardingVaultAndLiabilityStepInput = z.infer<
  typeof onboardingVaultAndLiabilityStepSchema
>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
