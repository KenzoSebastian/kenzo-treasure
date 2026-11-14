"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Budget Categories Management (Fase B8)
 * ==============================================================================
 *
 * Mengelola seluruh mutasi pos anggaran bulanan (`budget_categories`):
 * 1. `updateCategoryTarget`: Mengubah plafon target anggaran pos pada bulan aktif.
 * 2. `addCustomCategory`: Menambah pos anggaran kustom baru pada bulan aktif.
 * 3. `reorderCategories`: Menyusun ulang urutan (`sortOrder`) pos anggaran.
 */

import { revalidatePath } from "next/cache";
import { eq, and, inArray, desc } from "drizzle-orm";
import { db } from "@/db";
import { budgetCategories, months } from "@/db/schema";
import {
  createCategorySchema,
  updateCategoryTargetSchema,
  reorderCategoriesSchema,
  type CreateCategoryInput,
  type UpdateCategoryTargetInput,
  type ReorderCategoriesInput,
} from "@/schemas/category.schema";
import { resolveAuthenticatedUserId } from "@/lib/queries/months";
import { getCategoriesByMonth } from "@/lib/queries/categories";
import type { ActionResponse, BudgetCategory } from "@/types";

export { getCategoriesByMonth };

/* ══════════════════════════════════════════════════════════════════════════════
   1. SERVER ACTION: updateCategoryTarget
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Memperbarui plafon target anggaran sebuah pos:
 * - Mendukung `updateCategoryTarget(categoryId, newTarget)` atau `updateCategoryTarget({ categoryId, targetBudget })`.
 * - Memastikan siklus bulan induk berstatus aktif (`isClosed = false`).
 */
export async function updateCategoryTarget(
  categoryIdOrInput: string | UpdateCategoryTargetInput,
  newTarget?: number,
  explicitUserId?: string
): Promise<ActionResponse<BudgetCategory>> {
  try {
    const rawPayload =
      typeof categoryIdOrInput === "string"
        ? { categoryId: categoryIdOrInput, targetBudget: newTarget }
        : categoryIdOrInput;

    const parsed = updateCategoryTargetSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Validasi perubahan target anggaran gagal.",
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

    const [catWithMonth] = await db
      .select({
        id: budgetCategories.id,
        monthId: budgetCategories.monthId,
        isClosed: months.isClosed,
      })
      .from(budgetCategories)
      .innerJoin(months, eq(budgetCategories.monthId, months.id))
      .where(
        and(
          eq(budgetCategories.id, parsed.data.categoryId),
          eq(months.userId, userId)
        )
      )
      .limit(1);

    if (!catWithMonth) {
      return {
        success: false,
        error: "Pos anggaran tidak ditemukan atau bukan milik akun Anda.",
      };
    }

    if (catWithMonth.isClosed) {
      return {
        success: false,
        error:
          "Tidak dapat mengubah target pos anggaran pada siklus bulan yang telah ditutup (arsip).",
      };
    }

    const [updated] = await db
      .update(budgetCategories)
      .set({
        targetBudget: parsed.data.targetBudget,
        updatedAt: new Date(),
      })
      .where(eq(budgetCategories.id, parsed.data.categoryId))
      .returning();

    revalidatePath("/dashboard");

    return {
      success: true,
      data: updated,
    };
  } catch (err) {
    console.error("Gagal memperbarui target pos anggaran:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat memperbarui target pos anggaran.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. SERVER ACTION: addCustomCategory
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Menambahkan pos anggaran kustom baru ke siklus bulan aktif:
 * - Mendukung `addCustomCategory(monthId, data)` atau `addCustomCategory(input)`.
 */
export async function addCustomCategory(
  monthIdOrInput: string | CreateCategoryInput,
  data?: Omit<CreateCategoryInput, "monthId">,
  explicitUserId?: string
): Promise<ActionResponse<BudgetCategory>> {
  try {
    const rawPayload =
      typeof monthIdOrInput === "string"
        ? { monthId: monthIdOrInput, ...(data ?? {}) }
        : monthIdOrInput;

    const parsed = createCategorySchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Validasi pos anggaran baru gagal.",
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

    const [monthRow] = await db
      .select({
        id: months.id,
        isClosed: months.isClosed,
      })
      .from(months)
      .where(
        and(eq(months.id, parsed.data.monthId), eq(months.userId, userId))
      )
      .limit(1);

    if (!monthRow) {
      return {
        success: false,
        error: "Siklus bulan tidak ditemukan.",
      };
    }

    if (monthRow.isClosed) {
      return {
        success: false,
        error:
          "Tidak dapat menambah pos anggaran pada siklus bulan yang telah ditutup.",
      };
    }

    // Hitung sortOrder berikutnya jika belum dispesifikasikan
    let sortOrder = parsed.data.sortOrder;
    if (!sortOrder || sortOrder <= 0) {
      const [lastCat] = await db
        .select({ sortOrder: budgetCategories.sortOrder })
        .from(budgetCategories)
        .where(eq(budgetCategories.monthId, parsed.data.monthId))
        .orderBy(desc(budgetCategories.sortOrder))
        .limit(1);
      sortOrder = (lastCat?.sortOrder ?? 0) + 1;
    }

    const [created] = await db
      .insert(budgetCategories)
      .values({
        monthId: parsed.data.monthId,
        liabilityId: parsed.data.liabilityId ?? null,
        name: parsed.data.name,
        icon: parsed.data.icon,
        group: parsed.data.group,
        targetBudget: parsed.data.targetBudget,
        isTemporary: parsed.data.isTemporary,
        sortOrder,
      })
      .returning();

    revalidatePath("/dashboard");

    return {
      success: true,
      data: created,
    };
  } catch (err) {
    console.error("Gagal menambah pos anggaran kustom:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menambahkan pos anggaran baru.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. SERVER ACTION: reorderCategories
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Menyusun ulang urutan tampilan (`sortOrder`) pos anggaran:
 * - Mendukung `reorderCategories(categoryIds)` maupun `reorderCategories({ monthId, categoryIds })`.
 */
export async function reorderCategories(
  inputOrIds: string[] | ReorderCategoriesInput,
  explicitUserId?: string
): Promise<ActionResponse<{ updatedCount: number }>> {
  try {
    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    let categoryIds: string[] = [];
    if (Array.isArray(inputOrIds)) {
      if (inputOrIds.length === 0) {
        return {
          success: false,
          error: "Daftar urutan kategori tidak boleh kosong.",
        };
      }
      categoryIds = inputOrIds;
    } else {
      const parsed = reorderCategoriesSchema.safeParse(inputOrIds);
      if (!parsed.success) {
        return {
          success: false,
          error:
            parsed.error.issues[0]?.message ??
            "Validasi urutan kategori gagal.",
        };
      }
      categoryIds = parsed.data.categoryIds;
    }

    // Verifikasi kepemilikan seluruh categoryIds
    const matched = await db
      .select({
        id: budgetCategories.id,
        isClosed: months.isClosed,
      })
      .from(budgetCategories)
      .innerJoin(months, eq(budgetCategories.monthId, months.id))
      .where(
        and(
          inArray(budgetCategories.id, categoryIds),
          eq(months.userId, userId)
        )
      );

    if (matched.length === 0) {
      return {
        success: false,
        error: "Pos anggaran tidak ditemukan.",
      };
    }

    if (matched.some((m) => m.isClosed)) {
      return {
        success: false,
        error:
          "Tidak dapat mengubah urutan pos pada bulan yang telah ditutup.",
      };
    }

    const validIds = new Set(matched.map((m) => m.id));
    await db.transaction(async (tx) => {
      let order = 1;
      for (const id of categoryIds) {
        if (!validIds.has(id)) continue;
        await tx
          .update(budgetCategories)
          .set({ sortOrder: order++, updatedAt: new Date() })
          .where(eq(budgetCategories.id, id));
      }
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: { updatedCount: validIds.size },
    };
  } catch (err) {
    console.error("Gagal menyusun ulang urutan kategori:", err);
    return {
      success: false,
      error: "Gagal menyimpan urutan pos anggaran.",
    };
  }
}
