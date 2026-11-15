"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Finance Defaults & Budget Templates (Fase R10)
 * ==============================================================================
 *
 * Mengelola konfigurasi default finansial pengguna di `/dashboard/settings`:
 * 1. `updateFinanceDefaults`: Mengubah `users.defaultBaseSalary` & `savingsAccount.emergencyFundTarget`.
 * 2. `upsertBudgetTemplate`: Menambah atau mengubah item `user_budget_templates`
 *    (dengan proteksi maksimal 1 pos kelompok `uang_bebas_tabungan`).
 * 3. `deleteBudgetTemplate`: Menghapus item `user_budget_templates`.
 */

import { eq, and, ne, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  savingsAccount,
  userBudgetTemplates,
  type UserBudgetTemplate,
} from "@/db/schema";
import {
  updateFinanceDefaultsSchema,
  upsertBudgetTemplateSchema,
  deleteBudgetTemplateSchema,
  type UpdateFinanceDefaultsInput,
  type UpsertBudgetTemplateInput,
  type DeleteBudgetTemplateInput,
} from "@/schemas/settings.schema";
import { resolveCategoryIconKey } from "@/lib/category-icons";
import { DEFAULT_EMERGENCY_FUND_TARGET } from "@/lib/financial-calculations";
import { resolveAuthenticatedUserId } from "@/lib/queries/months";
import { revalidateDashboardRoutes } from "@/lib/revalidate";
import type { ActionResponse } from "@/types";

/* ══════════════════════════════════════════════════════════════════════════════
   1. SERVER ACTION: updateFinanceDefaults
   ══════════════════════════════════════════════════════════════════════════════ */

export async function updateFinanceDefaults(
  input: UpdateFinanceDefaultsInput,
  explicitUserId?: string
): Promise<
  ActionResponse<{
    defaultBaseSalary: number | null;
    emergencyFundTarget: number;
  }>
> {
  try {
    const parsed = updateFinanceDefaultsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Data pengaturan finansial tidak valid.",
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

    const { defaultBaseSalary, emergencyFundTarget } = parsed.data;

    await db.transaction(async (tx) => {
      if (defaultBaseSalary !== undefined) {
        await tx
          .update(users)
          .set({
            defaultBaseSalary,
          })
          .where(eq(users.id, userId));
      }

      if (emergencyFundTarget !== undefined) {
        await tx
          .insert(savingsAccount)
          .values({
            userId,
            balance: 0,
            emergencyFundTarget,
            emergencyFundBalance: 0,
          })
          .onConflictDoUpdate({
            target: savingsAccount.userId,
            set: {
              emergencyFundTarget,
              updatedAt: new Date(),
            },
          });
      }
    });

    const [[userRow], [savingsRow]] = await Promise.all([
      db
        .select({ defaultBaseSalary: users.defaultBaseSalary })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select({ emergencyFundTarget: savingsAccount.emergencyFundTarget })
        .from(savingsAccount)
        .where(eq(savingsAccount.userId, userId))
        .limit(1),
    ]);

    revalidateDashboardRoutes();

    return {
      success: true,
      data: {
        defaultBaseSalary: userRow?.defaultBaseSalary ?? null,
        emergencyFundTarget:
          savingsRow?.emergencyFundTarget ?? DEFAULT_EMERGENCY_FUND_TARGET,
      },
    };
  } catch (err) {
    console.error("Gagal memperbarui pengaturan default finansial:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan pengaturan default finansial.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. SERVER ACTION: upsertBudgetTemplate
   ══════════════════════════════════════════════════════════════════════════════ */

export async function upsertBudgetTemplate(
  input: UpsertBudgetTemplateInput,
  explicitUserId?: string
): Promise<ActionResponse<UserBudgetTemplate>> {
  try {
    const parsed = upsertBudgetTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Data template pos anggaran tidak valid.",
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

    const { name, icon, group, targetBudget, sortOrder } = parsed.data;
    const templateId = parsed.data.templateId ?? parsed.data.id ?? null;

    const normalizedIcon = resolveCategoryIconKey(icon, group, null);

    const saved = await db.transaction(async (tx) => {
      // Invarian: Maksimal 1 template kelompok uang_bebas_tabungan per pengguna
      if (group === "uang_bebas_tabungan") {
        const whereClause = templateId
          ? and(
              eq(userBudgetTemplates.userId, userId),
              eq(userBudgetTemplates.group, "uang_bebas_tabungan"),
              ne(userBudgetTemplates.id, templateId)
            )
          : and(
              eq(userBudgetTemplates.userId, userId),
              eq(userBudgetTemplates.group, "uang_bebas_tabungan")
            );

        const [existingFree] = await tx
          .select({ id: userBudgetTemplates.id })
          .from(userBudgetTemplates)
          .where(whereClause)
          .limit(1);

        if (existingFree) {
          throw new Error("MAX_ONE_FREE_BUDGET_TEMPLATE");
        }
      }

      if (templateId) {
        const [updated] = await tx
          .update(userBudgetTemplates)
          .set({
            name: name.trim(),
            icon: normalizedIcon,
            group,
            targetBudget,
            ...(sortOrder !== undefined ? { sortOrder } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userBudgetTemplates.id, templateId),
              eq(userBudgetTemplates.userId, userId)
            )
          )
          .returning();

        if (!updated) {
          throw new Error("NOT_FOUND");
        }
        return updated;
      }

      let nextSortOrder = sortOrder;
      if (!nextSortOrder || nextSortOrder <= 0) {
        const [lastTpl] = await tx
          .select({ sortOrder: userBudgetTemplates.sortOrder })
          .from(userBudgetTemplates)
          .where(eq(userBudgetTemplates.userId, userId))
          .orderBy(desc(userBudgetTemplates.sortOrder))
          .limit(1);
        nextSortOrder = (lastTpl?.sortOrder ?? 0) + 1;
      }

      const [inserted] = await tx
        .insert(userBudgetTemplates)
        .values({
          userId,
          name: name.trim(),
          icon: normalizedIcon,
          group,
          targetBudget,
          sortOrder: nextSortOrder,
        })
        .returning();

      return inserted;
    });

    revalidateDashboardRoutes();

    return {
      success: true,
      data: saved,
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "MAX_ONE_FREE_BUDGET_TEMPLATE") {
        return {
          success: false,
          error:
            "Maksimal hanya boleh ada 1 template pos untuk kelompok Uang Bebas / Tabungan.",
        };
      }
      if (err.message === "NOT_FOUND") {
        return {
          success: false,
          error: "Template pos anggaran tidak ditemukan.",
        };
      }
    }
    console.error("Gagal menyimpan template pos anggaran:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan template pos anggaran.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. SERVER ACTION: deleteBudgetTemplate
   ══════════════════════════════════════════════════════════════════════════════ */

export async function deleteBudgetTemplate(
  inputOrId: string | DeleteBudgetTemplateInput,
  explicitUserId?: string
): Promise<ActionResponse<{ deletedId: string }>> {
  try {
    const rawPayload =
      typeof inputOrId === "string" ? { templateId: inputOrId } : inputOrId;

    const parsed = deleteBudgetTemplateSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "ID template pos anggaran tidak valid.",
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const resolvedTemplateId = parsed.data.templateId ?? parsed.data.id!;

    const [deleted] = await db
      .delete(userBudgetTemplates)
      .where(
        and(
          eq(userBudgetTemplates.id, resolvedTemplateId),
          eq(userBudgetTemplates.userId, userId)
        )
      )
      .returning({ id: userBudgetTemplates.id });

    if (!deleted) {
      return {
        success: false,
        error: "Template pos anggaran tidak ditemukan.",
      };
    }

    revalidateDashboardRoutes();

    return {
      success: true,
      data: { deletedId: deleted.id },
    };
  } catch (err) {
    console.error("Gagal menghapus template pos anggaran:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menghapus template pos anggaran.",
    };
  }
}
