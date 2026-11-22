"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Budget Categories Management (Fase B8 + R10)
 * ==============================================================================
 *
 * Mengelola seluruh mutasi pos anggaran bulanan (`budget_categories`):
 * 1. `updateCategoryTarget`: Mengubah plafon target anggaran pos pada bulan aktif.
 * 2. `addCustomCategory`: Menambah pos anggaran kustom baru pada bulan aktif
 *    (dengan proteksi maksimal 1 pos kelompok `uang_bebas_tabungan`).
 * 3. `reorderCategories`: Menyusun ulang urutan (`sortOrder`) pos anggaran.
 * 4. `deleteCategory`: Menghapus atau menghentikan pos anggaran bulan aktif
 *    secara aman di bawah `ON DELETE RESTRICT` tanpa menghilangkan riwayat cashflow.
 */

import { eq, and, inArray, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import { budgetCategories, months, transactions, incomes } from "@/db/schema";
import { formatRupiah } from "@/lib/financial-calculations";
import {
  createCategorySchema,
  updateCategoryTargetSchema,
  reorderCategoriesSchema,
  deleteCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryTargetInput,
  type ReorderCategoriesInput,
  type DeleteCategoryInput,
} from "@/schemas/category.schema";
import { resolveCategoryIconKey } from "@/lib/category-icons";
import { resolveAuthenticatedUserId } from "@/lib/queries/months";
import { getCategoriesByMonth } from "@/lib/queries/categories";
import { revalidateDashboardRoutes } from "@/lib/revalidate";
import type { ActionResponse, BudgetCategory } from "@/types";

export { getCategoriesByMonth };

export interface DeleteCategoryResult {
  deletedCategoryId: string;
  modeUsed: "deactivate_next_month" | "permanent_delete";
  movedTransactionsCount: number;
  reallocatedBudget: number;
}

/* ══════════════════════════════════════════════════════════════════════════════
   1. SERVER ACTION: updateCategoryTarget
   ══════════════════════════════════════════════════════════════════════════════ */

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

    const updated = await db.transaction(async (tx) => {
      // 1. Ambil target pos dengan lock FOR UPDATE dan verifikasi kepemilikan akun
      const [catWithMonth] = await tx
        .select({
          id: budgetCategories.id,
          monthId: budgetCategories.monthId,
          liabilityId: budgetCategories.liabilityId,
          group: budgetCategories.group,
          targetBudget: budgetCategories.targetBudget,
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
        .for("update")
        .limit(1);

      if (!catWithMonth) {
        throw new Error("NOT_FOUND");
      }

      if (catWithMonth.isClosed) {
        throw new Error("MONTH_CLOSED");
      }

      if (catWithMonth.liabilityId) {
        throw new Error("LINKED_TO_LIABILITY");
      }

      if (catWithMonth.group === "uang_bebas_tabungan") {
        throw new Error("CANNOT_EDIT_FREE_BUDGET_DIRECTLY");
      }

      const delta = parsed.data.targetBudget - catWithMonth.targetBudget;

      // Jika target tidak berubah, langsung kembalikan data eksisting
      if (delta === 0) {
        const [existing] = await tx
          .select()
          .from(budgetCategories)
          .where(eq(budgetCategories.id, parsed.data.categoryId));
        return existing;
      }

      // 2. Kunci pos Uang Bebas / Tabungan di bulan yang sama untuk rebalancing ZBB
      const [freeCategory] = await tx
        .select()
        .from(budgetCategories)
        .where(
          and(
            eq(budgetCategories.monthId, catWithMonth.monthId),
            eq(budgetCategories.group, "uang_bebas_tabungan")
          )
        )
        .for("update")
        .limit(1);

      if (!freeCategory) {
        throw new Error("FREE_CATEGORY_NOT_FOUND");
      }

      // 3. Kasus A: Target NAIK (delta > 0) -> Memotong kuota dari Uang Bebas
      if (delta > 0) {
        const [monthIncomes, freeTransactions] = await Promise.all([
          tx
            .select({ amount: incomes.amount, isBaseSalary: incomes.isBaseSalary })
            .from(incomes)
            .where(
              and(
                eq(incomes.monthId, catWithMonth.monthId),
                eq(incomes.userId, userId)
              )
            ),
          tx
            .select({ amount: transactions.amount })
            .from(transactions)
            .where(
              and(
                eq(transactions.categoryId, freeCategory.id),
                eq(transactions.userId, userId),
                eq(transactions.isDeleted, false)
              )
            ),
        ]);

        const additionalIncomesSum = monthIncomes
          .filter((inc) => !inc.isBaseSalary)
          .reduce((sum, inc) => sum + inc.amount, 0);
        const freeSpentSum = freeTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );
        const effectiveFreeRemaining =
          freeCategory.targetBudget + additionalIncomesSum - freeSpentSum;

        if (
          freeCategory.targetBudget < delta ||
          effectiveFreeRemaining < delta
        ) {
          throw new Error(
            `INSUFFICIENT_FREE_BUDGET:${Math.max(
              0,
              effectiveFreeRemaining
            )}:${delta}`
          );
        }

        // Potong target Uang Bebas sebesar delta
        await tx
          .update(budgetCategories)
          .set({
            targetBudget: freeCategory.targetBudget - delta,
            updatedAt: new Date(),
          })
          .where(eq(budgetCategories.id, freeCategory.id));
      } else {
        // 4. Kasus B: Target TURUN (delta < 0) -> Mengembalikan surplus ke Uang Bebas
        // Validasi: target baru tidak boleh lebih kecil dari uang yang sudah dibelanjakan di pos ini
        const targetTransactions = await tx
          .select({ amount: transactions.amount })
          .from(transactions)
          .where(
            and(
              eq(transactions.categoryId, catWithMonth.id),
              eq(transactions.userId, userId),
              eq(transactions.isDeleted, false)
            )
          );

        const targetSpentSum = targetTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );
        if (parsed.data.targetBudget < targetSpentSum) {
          throw new Error(
            `TARGET_BELOW_EXPENSES:${targetSpentSum}:${parsed.data.targetBudget}`
          );
        }

        // Kembalikan selisih |delta| ke Uang Bebas
        await tx
          .update(budgetCategories)
          .set({
            targetBudget: freeCategory.targetBudget + Math.abs(delta),
            updatedAt: new Date(),
          })
          .where(eq(budgetCategories.id, freeCategory.id));
      }

      // 5. Perbarui target pos yang bersangkutan
      const [updatedRow] = await tx
        .update(budgetCategories)
        .set({
          targetBudget: parsed.data.targetBudget,
          updatedAt: new Date(),
        })
        .where(eq(budgetCategories.id, parsed.data.categoryId))
        .returning();

      return updatedRow;
    });

    revalidateDashboardRoutes();

    return {
      success: true,
      data: updated,
    };
  } catch (err: unknown) {
    console.error("Gagal memperbarui target pos anggaran:", err);
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND") {
        return {
          success: false,
          error: "Pos anggaran tidak ditemukan atau bukan milik akun Anda.",
        };
      }
      if (err.message === "MONTH_CLOSED") {
        return {
          success: false,
          error:
            "Tidak dapat mengubah target pos anggaran pada siklus bulan yang telah ditutup (arsip).",
        };
      }
      if (err.message === "LINKED_TO_LIABILITY") {
        return {
          success: false,
          error:
            "Pos anggaran ini terikat pada kontrak cicilan. Ubah nominal tagihan melalui menu Tracking Cicilan di bawah.",
        };
      }
      if (err.message === "CANNOT_EDIT_FREE_BUDGET_DIRECTLY") {
        return {
          success: false,
          error:
            "Target Uang Bebas / Tabungan diatur otomatis sebagai penyeimbang anggaran Zero-Based Budgeting.",
        };
      }
      if (err.message === "FREE_CATEGORY_NOT_FOUND") {
        return {
          success: false,
          error: "Pos Uang Bebas / Tabungan tidak ditemukan pada siklus bulan ini.",
        };
      }
      if (err.message.startsWith("INSUFFICIENT_FREE_BUDGET:")) {
        const [, remainingStr, neededStr] = err.message.split(":");
        const remainingNum = parseInt(remainingStr ?? "0", 10);
        const neededNum = parseInt(neededStr ?? "0", 10);
        return {
          success: false,
          error: `Sisa kuota Uang Bebas tidak mencukupi untuk menambah target pos ini (Tersedia: ${formatRupiah(
            remainingNum
          )}, Dibutuhkan: ${formatRupiah(neededNum)}).`,
        };
      }
      if (err.message.startsWith("TARGET_BELOW_EXPENSES:")) {
        const [, spentStr, targetStr] = err.message.split(":");
        const spentNum = parseInt(spentStr ?? "0", 10);
        const targetNum = parseInt(targetStr ?? "0", 10);
        return {
          success: false,
          error: `Target baru tidak boleh lebih kecil dari realisasi belanja saat ini (Sudah terpakai: ${formatRupiah(
            spentNum
          )}, Target baru: ${formatRupiah(targetNum)}).`,
        };
      }
    }
    return {
      success: false,
      error: "Terjadi kesalahan saat memperbarui target pos anggaran.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. SERVER ACTION: addCustomCategory (Fase B8, R10 & SC-04 ZBB Conservation)
   ══════════════════════════════════════════════════════════════════════════════ */

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

    const created = await db.transaction(async (tx) => {
      // 1. Verifikasi status bulan
      const [monthRow] = await tx
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
        throw new Error("MONTH_NOT_FOUND");
      }

      if (monthRow.isClosed) {
        throw new Error("MONTH_CLOSED");
      }

      // Invarian: Maksimal 1 pos kelompok uang_bebas_tabungan per siklus bulan
      if (parsed.data.group === "uang_bebas_tabungan") {
        const [existingFree] = await tx
          .select({ id: budgetCategories.id })
          .from(budgetCategories)
          .where(
            and(
              eq(budgetCategories.monthId, parsed.data.monthId),
              eq(budgetCategories.group, "uang_bebas_tabungan")
            )
          )
          .limit(1);

        if (existingFree) {
          throw new Error("DUPLICATE_FREE_CATEGORY");
        }
      }

      // 2. SC-04: Jika target pos baru > 0, wajib potong kuota dari Uang Bebas secara atomik (ZBB Conservation)
      if (
        parsed.data.targetBudget > 0 &&
        parsed.data.group !== "uang_bebas_tabungan"
      ) {
        const [freeCategory] = await tx
          .select()
          .from(budgetCategories)
          .where(
            and(
              eq(budgetCategories.monthId, parsed.data.monthId),
              eq(budgetCategories.group, "uang_bebas_tabungan")
            )
          )
          .for("update")
          .limit(1);

        if (!freeCategory) {
          throw new Error("FREE_CATEGORY_NOT_FOUND");
        }

        const [monthIncomes, freeTransactions] = await Promise.all([
          tx
            .select({
              amount: incomes.amount,
              isBaseSalary: incomes.isBaseSalary,
            })
            .from(incomes)
            .where(
              and(
                eq(incomes.monthId, parsed.data.monthId),
                eq(incomes.userId, userId)
              )
            ),
          tx
            .select({ amount: transactions.amount })
            .from(transactions)
            .where(
              and(
                eq(transactions.categoryId, freeCategory.id),
                eq(transactions.userId, userId),
                eq(transactions.isDeleted, false)
              )
            ),
        ]);

        const additionalIncomesSum = monthIncomes
          .filter((inc) => !inc.isBaseSalary)
          .reduce((sum, inc) => sum + inc.amount, 0);
        const freeSpentSum = freeTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );
        const effectiveFreeRemaining =
          freeCategory.targetBudget + additionalIncomesSum - freeSpentSum;

        if (
          freeCategory.targetBudget < parsed.data.targetBudget ||
          effectiveFreeRemaining < parsed.data.targetBudget
        ) {
          throw new Error(
            `INSUFFICIENT_FREE_BUDGET:${Math.max(
              0,
              effectiveFreeRemaining
            )}:${parsed.data.targetBudget}`
          );
        }

        await tx
          .update(budgetCategories)
          .set({
            targetBudget: freeCategory.targetBudget - parsed.data.targetBudget,
            updatedAt: new Date(),
          })
          .where(eq(budgetCategories.id, freeCategory.id));
      }

      let sortOrder = parsed.data.sortOrder;
      if (!sortOrder || sortOrder <= 0) {
        const [lastCat] = await tx
          .select({ sortOrder: budgetCategories.sortOrder })
          .from(budgetCategories)
          .where(eq(budgetCategories.monthId, parsed.data.monthId))
          .orderBy(desc(budgetCategories.sortOrder))
          .limit(1);
        sortOrder = (lastCat?.sortOrder ?? 0) + 1;
      }

      const normalizedIcon = resolveCategoryIconKey(
        parsed.data.icon,
        parsed.data.group,
        parsed.data.liabilityId
      );

      const [createdRow] = await tx
        .insert(budgetCategories)
        .values({
          monthId: parsed.data.monthId,
          liabilityId: parsed.data.liabilityId ?? null,
          name: parsed.data.name,
          icon: normalizedIcon,
          group: parsed.data.group,
          targetBudget: parsed.data.targetBudget,
          isTemporary: parsed.data.isTemporary,
          sortOrder,
        })
        .returning();

      return createdRow;
    });

    revalidateDashboardRoutes();

    return {
      success: true,
      data: created,
    };
  } catch (err: unknown) {
    console.error("Gagal menambah pos anggaran kustom:", err);
    if (err instanceof Error) {
      if (err.message === "MONTH_NOT_FOUND") {
        return { success: false, error: "Siklus bulan tidak ditemukan." };
      }
      if (err.message === "MONTH_CLOSED") {
        return {
          success: false,
          error:
            "Tidak dapat menambah pos anggaran pada siklus bulan yang telah ditutup.",
        };
      }
      if (err.message === "DUPLICATE_FREE_CATEGORY") {
        return {
          success: false,
          error:
            "Setiap siklus bulan hanya boleh memiliki maksimal 1 pos kelompok Uang Bebas / Tabungan.",
        };
      }
      if (err.message === "FREE_CATEGORY_NOT_FOUND") {
        return {
          success: false,
          error: "Pos Uang Bebas / Tabungan tidak ditemukan pada siklus bulan ini.",
        };
      }
      if (err.message.startsWith("INSUFFICIENT_FREE_BUDGET:")) {
        const [, remainingStr, neededStr] = err.message.split(":");
        const remainingNum = parseInt(remainingStr ?? "0", 10);
        const neededNum = parseInt(neededStr ?? "0", 10);
        return {
          success: false,
          error: `Sisa kuota Uang Bebas tidak mencukupi untuk membuat pos anggaran baru (Tersedia: ${formatRupiah(
            remainingNum
          )}, Dibutuhkan: ${formatRupiah(neededNum)}).`,
        };
      }
    }
    return {
      success: false,
      error: "Terjadi kesalahan internal saat menambah pos anggaran.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. SERVER ACTION: reorderCategories
   ══════════════════════════════════════════════════════════════════════════════ */

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

    revalidateDashboardRoutes();

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

/* ══════════════════════════════════════════════════════════════════════════════
   4. SERVER ACTION: deleteCategory (Anti-Cascade & 1-Click Bulk Reassign)
   ══════════════════════════════════════════════════════════════════════════════ */

export async function deleteCategory(
  inputOrId: string | DeleteCategoryInput,
  explicitUserId?: string
): Promise<ActionResponse<DeleteCategoryResult>> {
  try {
    const rawPayload =
      typeof inputOrId === "string"
        ? { categoryId: inputOrId, mode: "deactivate_next_month" as const }
        : inputOrId;

    const parsed = deleteCategorySchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Validasi penghapusan pos anggaran gagal.",
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

    const { categoryId, mode, reassignToCategoryId } = parsed.data;

    const result = await db.transaction(async (tx) => {
      const [targetWithMonth] = await tx
        .select({
          id: budgetCategories.id,
          monthId: budgetCategories.monthId,
          liabilityId: budgetCategories.liabilityId,
          group: budgetCategories.group,
          targetBudget: budgetCategories.targetBudget,
          isClosed: months.isClosed,
        })
        .from(budgetCategories)
        .innerJoin(months, eq(budgetCategories.monthId, months.id))
        .where(
          and(
            eq(budgetCategories.id, categoryId),
            eq(months.userId, userId)
          )
        )
        .limit(1);

      if (!targetWithMonth) {
        throw new Error("NOT_FOUND");
      }

      if (targetWithMonth.isClosed) {
        throw new Error("MONTH_CLOSED");
      }

      if (targetWithMonth.liabilityId !== null) {
        throw new Error("LINKED_TO_LIABILITY");
      }

      if (targetWithMonth.group === "uang_bebas_tabungan") {
        throw new Error("CANNOT_DELETE_FREE_BUDGET");
      }

      // Kunci seluruh pos pada bulan yang sama untuk konservasi saldo & verifikasi jumlah pos
      const monthCategories = await tx
        .select()
        .from(budgetCategories)
        .where(eq(budgetCategories.monthId, targetWithMonth.monthId))
        .orderBy(asc(budgetCategories.sortOrder))
        .for("update");

      if (monthCategories.length <= 1) {
        throw new Error("MIN_ONE_CATEGORY");
      }

      const freeCategory = monthCategories.find(
        (c) =>
          c.group === "uang_bebas_tabungan" && c.id !== targetWithMonth.id
      );

      // Ambil seluruh transaksi pada pos ini (aktif maupun soft-deleted)
      const txRows = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.categoryId, targetWithMonth.id));

      // KASUS 1: Pos kosong tanpa riwayat transaksi sama sekali -> langsung hapus & relokasi kuota ke Uang Bebas
      if (txRows.length === 0) {
        if (freeCategory && targetWithMonth.targetBudget > 0) {
          await tx
            .update(budgetCategories)
            .set({
              targetBudget:
                freeCategory.targetBudget + targetWithMonth.targetBudget,
              updatedAt: new Date(),
            })
            .where(eq(budgetCategories.id, freeCategory.id));
        }

        await tx
          .delete(budgetCategories)
          .where(eq(budgetCategories.id, targetWithMonth.id));

        return {
          deletedCategoryId: targetWithMonth.id,
          modeUsed: "permanent_delete" as const,
          movedTransactionsCount: 0,
          reallocatedBudget: targetWithMonth.targetBudget,
        };
      }

      // KASUS 2: Pos memiliki transaksi -> cek jendela Undo < 10 detik terlebih dahulu
      const nowMs = Date.now();
      const hasActiveUndoWindow = txRows.some(
        (row) =>
          row.isDeleted &&
          nowMs - new Date(row.updatedAt).getTime() < 10_000
      );

      if (hasActiveUndoWindow) {
        throw new Error("ACTIVE_UNDO_WINDOW");
      }

      // Opsi Default Non-Destruktif: Hentikan Mulai Bulan Depan (`targetBudget = 0, isTemporary = true`)
      if (mode === "deactivate_next_month") {
        if (freeCategory && targetWithMonth.targetBudget > 0) {
          await tx
            .update(budgetCategories)
            .set({
              targetBudget:
                freeCategory.targetBudget + targetWithMonth.targetBudget,
              updatedAt: new Date(),
            })
            .where(eq(budgetCategories.id, freeCategory.id));
        }

        await tx
          .update(budgetCategories)
          .set({
            targetBudget: 0,
            isTemporary: true,
            updatedAt: new Date(),
          })
          .where(eq(budgetCategories.id, targetWithMonth.id));

        return {
          deletedCategoryId: targetWithMonth.id,
          modeUsed: "deactivate_next_month" as const,
          movedTransactionsCount: 0,
          reallocatedBudget: targetWithMonth.targetBudget,
        };
      }

      // Opsi Hapus Permanen + 1-Click Bulk Reassign ke pos tujuan di bulan yang sama
      const destinationId = reassignToCategoryId ?? freeCategory?.id ?? null;
      if (!destinationId) {
        throw new Error("INVALID_REASSIGN_TARGET");
      }

      const destinationCategory = monthCategories.find(
        (c) => c.id === destinationId
      );

      if (
        !destinationCategory ||
        destinationCategory.id === targetWithMonth.id ||
        destinationCategory.liabilityId !== null
      ) {
        throw new Error("INVALID_REASSIGN_TARGET");
      }

      // Pindahkan seluruh transaksi (aktif + soft-deleted expired) secara atomik
      await tx
        .update(transactions)
        .set({
          categoryId: destinationCategory.id,
          updatedAt: new Date(),
        })
        .where(eq(transactions.categoryId, targetWithMonth.id));

      // Konservasi saldo anggaran bulanan ke pos tujuan
      if (targetWithMonth.targetBudget > 0) {
        await tx
          .update(budgetCategories)
          .set({
            targetBudget:
              destinationCategory.targetBudget + targetWithMonth.targetBudget,
            updatedAt: new Date(),
          })
          .where(eq(budgetCategories.id, destinationCategory.id));
      }

      // Hapus pos sumber secara aman di bawah ON DELETE RESTRICT
      await tx
        .delete(budgetCategories)
        .where(eq(budgetCategories.id, targetWithMonth.id));

      const activeMovedCount = txRows.filter((row) => !row.isDeleted).length;

      return {
        deletedCategoryId: targetWithMonth.id,
        modeUsed: "permanent_delete" as const,
        movedTransactionsCount: activeMovedCount,
        reallocatedBudget: targetWithMonth.targetBudget,
      };
    });

    revalidateDashboardRoutes();

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND") {
        return {
          success: false,
          error: "Pos anggaran tidak ditemukan atau bukan milik akun Anda.",
        };
      }
      if (err.message === "MONTH_CLOSED") {
        return {
          success: false,
          error:
            "Tidak dapat menghapus pos anggaran pada siklus bulan yang telah ditutup.",
        };
      }
      if (err.message === "LINKED_TO_LIABILITY") {
        return {
          success: false,
          error:
            "Pos anggaran yang terikat cicilan aktif dikelola melalui Pelacak Utang.",
        };
      }
      if (err.message === "CANNOT_DELETE_FREE_BUDGET") {
        return {
          success: false,
          error: "Pos utama Uang Bebas / Tabungan tidak dapat dihapus.",
        };
      }
      if (err.message === "MIN_ONE_CATEGORY") {
        return {
          success: false,
          error: "Siklus bulan harus memiliki minimal 1 pos anggaran.",
        };
      }
      if (err.message === "ACTIVE_UNDO_WINDOW") {
        return {
          success: false,
          error:
            "Terdapat transaksi yang baru dihapus kurang dari 10 detik lalu (jendela Undo aktif). Tunggu beberapa detik sebelum menghapus pos ini.",
        };
      }
      if (err.message === "INVALID_REASSIGN_TARGET") {
        return {
          success: false,
          error:
            "Pos tujuan pemindahan transaksi tidak valid. Pilih pos reguler lain pada bulan yang sama.",
        };
      }
    }
    console.error("Gagal menghapus pos anggaran:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menghapus pos anggaran.",
    };
  }
}
