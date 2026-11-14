"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Sub-Second Transactions & Undo 5s (Fase B9)
 * ==============================================================================
 *
 * Mengelola seluruh mutasi pengeluaran harian (`transactions`) dengan integritas tinggi:
 * 1. `createTransaction`:
 *    - Validasi integer nominal > 0 dan format tanggal YYYY-MM-DD.
 *    - Validasi *Strict Month-Date Boundary* (`isDateWithinMonthCycle`).
 *    - Rekonsiliasi atomik: bila pos terikat `liabilityId`, otomatis menambah
 *      `liabilities.paidAmount` dan mengecek status pelunasan (`isSettled`).
 * 2. `softDeleteTransaction`:
 *    - Mengubah flag `isDeleted = true` untuk mendukung fitur Undo 5 detik.
 *    - Rekonsiliasi balik `liabilities.paidAmount` jika pos terikat cicilan.
 * 3. `restoreTransaction`:
 *    - Mengembalikan `isDeleted = false` saat pengguna menekan tombol Undo.
 *    - Rekonsiliasi ulang `liabilities.paidAmount` secara atomik.
 * 4. `hardDeleteExpiredTransactions`:
 *    - Membersihkan transaksi yang sudah di-soft-delete dan melewati window undo.
 */

import { revalidatePath } from "next/cache";
import { eq, and, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  transactions,
  budgetCategories,
  months,
  liabilities,
} from "@/db/schema";
import {
  createTransactionSchema,
  softDeleteTransactionSchema,
  restoreTransactionSchema,
  type CreateTransactionInput,
  type SoftDeleteTransactionInput,
  type RestoreTransactionInput,
} from "@/schemas/transaction.schema";
import { isDateWithinMonthCycle } from "@/lib/financial-calculations";
import { resolveAuthenticatedUserId } from "@/lib/queries/months";
import {
  getTransactionsByMonth,
  getTransactionsByCategory,
} from "@/lib/queries/transactions";
import type { ActionResponse, Transaction } from "@/types";

export { getTransactionsByMonth, getTransactionsByCategory };

/* ══════════════════════════════════════════════════════════════════════════════
   1. SERVER ACTION: createTransaction
   ══════════════════════════════════════════════════════════════════════════════ */

export async function createTransaction(
  input: CreateTransactionInput,
  explicitUserId?: string
): Promise<ActionResponse<Transaction>> {
  try {
    const parsed = createTransactionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "Validasi data transaksi gagal.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi. Silakan login terlebih dahulu.",
      };
    }

    // 1. Ambil pos anggaran beserta bulan induknya untuk validasi kepemilikan & batas tanggal
    const [targetCategory] = await db
      .select({
        categoryId: budgetCategories.id,
        liabilityId: budgetCategories.liabilityId,
        monthId: months.id,
        monthName: months.name,
        year: months.year,
        monthIndex: months.monthIndex,
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

    if (!targetCategory) {
      return {
        success: false,
        error: "Pos anggaran tidak ditemukan atau bukan milik akun Anda.",
      };
    }

    if (targetCategory.isClosed) {
      return {
        success: false,
        error:
          "Tidak dapat mencatat pengeluaran pada siklus bulan yang telah ditutup (arsip).",
      };
    }

    // 2. Validasi Strict Month-Date Boundary
    const withinBoundary = isDateWithinMonthCycle(
      parsed.data.date,
      targetCategory.year,
      targetCategory.monthIndex
    );

    if (!withinBoundary) {
      return {
        success: false,
        error: `Tanggal transaksi (${parsed.data.date}) harus berada di dalam periode siklus ${targetCategory.monthName}.`,
        fieldErrors: {
          date: [
            `Tanggal wajib berada pada periode ${targetCategory.monthName}`,
          ],
        },
      };
    }

    // 3. Eksekusi mutasi atomik: simpan transaksi + rekonsiliasi cicilan bila pos terikat utang
    const createdTx = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(transactions)
        .values({
          userId,
          categoryId: parsed.data.categoryId,
          amount: parsed.data.amount,
          date: parsed.data.date,
          description: parsed.data.description,
          method: parsed.data.method,
          isDeleted: false,
        })
        .returning();

      if (targetCategory.liabilityId) {
        const [liabilityRow] = await tx
          .select()
          .from(liabilities)
          .where(
            and(
              eq(liabilities.id, targetCategory.liabilityId),
              eq(liabilities.userId, userId)
            )
          )
          .limit(1);

        if (liabilityRow) {
          const nextPaid = liabilityRow.paidAmount + parsed.data.amount;
          const nextSettled = nextPaid >= liabilityRow.totalAmount;

          await tx
            .update(liabilities)
            .set({
              paidAmount: nextPaid,
              isSettled: nextSettled,
              updatedAt: new Date(),
            })
            .where(eq(liabilities.id, liabilityRow.id));
        }
      }

      return inserted;
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: createdTx,
    };
  } catch (err) {
    console.error("Gagal mencatat transaksi pengeluaran:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan transaksi pengeluaran.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. SERVER ACTION: softDeleteTransaction (Undo 5s Support)
   ══════════════════════════════════════════════════════════════════════════════ */

export async function softDeleteTransaction(
  inputOrId: string | SoftDeleteTransactionInput,
  explicitUserId?: string
): Promise<ActionResponse<Transaction>> {
  try {
    const rawPayload =
      typeof inputOrId === "string"
        ? { transactionId: inputOrId }
        : inputOrId;

    const parsed = softDeleteTransactionSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "ID transaksi tidak valid.",
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const updatedTx = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          txRow: transactions,
          liabilityId: budgetCategories.liabilityId,
          isClosed: months.isClosed,
        })
        .from(transactions)
        .innerJoin(
          budgetCategories,
          eq(transactions.categoryId, budgetCategories.id)
        )
        .innerJoin(months, eq(budgetCategories.monthId, months.id))
        .where(
          and(
            eq(transactions.id, parsed.data.transactionId),
            eq(transactions.userId, userId)
          )
        )
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      if (existing.isClosed) {
        throw new Error("MONTH_CLOSED");
      }

      if (existing.txRow.isDeleted) {
        return existing.txRow;
      }

      const [softDeleted] = await tx
        .update(transactions)
        .set({
          isDeleted: true,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, parsed.data.transactionId))
        .returning();

      // Rekonsiliasi balik akumulasi cicilan jika transaksi terikat ke liability
      if (existing.liabilityId) {
        const [liabilityRow] = await tx
          .select()
          .from(liabilities)
          .where(
            and(
              eq(liabilities.id, existing.liabilityId),
              eq(liabilities.userId, userId)
            )
          )
          .limit(1);

        if (liabilityRow) {
          const nextPaid = Math.max(
            0,
            liabilityRow.paidAmount - existing.txRow.amount
          );
          const nextSettled = nextPaid >= liabilityRow.totalAmount;

          await tx
            .update(liabilities)
            .set({
              paidAmount: nextPaid,
              isSettled: nextSettled,
              updatedAt: new Date(),
            })
            .where(eq(liabilities.id, liabilityRow.id));
        }
      }

      return softDeleted;
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: updatedTx,
    };
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return {
        success: false,
        error: "Transaksi tidak ditemukan.",
      };
    }
    if (err instanceof Error && err.message === "MONTH_CLOSED") {
      return {
        success: false,
        error:
          "Tidak dapat menghapus transaksi pada siklus bulan yang telah ditutup.",
      };
    }
    console.error("Gagal menghapus transaksi:", err);
    return {
      success: false,
      error: "Gagal menghapus transaksi.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. SERVER ACTION: restoreTransaction (Undo Action)
   ══════════════════════════════════════════════════════════════════════════════ */

export async function restoreTransaction(
  inputOrId: string | RestoreTransactionInput,
  explicitUserId?: string
): Promise<ActionResponse<Transaction>> {
  try {
    const rawPayload =
      typeof inputOrId === "string"
        ? { transactionId: inputOrId }
        : inputOrId;

    const parsed = restoreTransactionSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "ID transaksi tidak valid.",
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const restoredTx = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          txRow: transactions,
          liabilityId: budgetCategories.liabilityId,
          isClosed: months.isClosed,
        })
        .from(transactions)
        .innerJoin(
          budgetCategories,
          eq(transactions.categoryId, budgetCategories.id)
        )
        .innerJoin(months, eq(budgetCategories.monthId, months.id))
        .where(
          and(
            eq(transactions.id, parsed.data.transactionId),
            eq(transactions.userId, userId)
          )
        )
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      if (existing.isClosed) {
        throw new Error("MONTH_CLOSED");
      }

      if (!existing.txRow.isDeleted) {
        return existing.txRow;
      }

      const [restored] = await tx
        .update(transactions)
        .set({
          isDeleted: false,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, parsed.data.transactionId))
        .returning();

      // Pulihkan kembali akumulasi cicilan jika transaksi terikat ke liability
      if (existing.liabilityId) {
        const [liabilityRow] = await tx
          .select()
          .from(liabilities)
          .where(
            and(
              eq(liabilities.id, existing.liabilityId),
              eq(liabilities.userId, userId)
            )
          )
          .limit(1);

        if (liabilityRow) {
          const nextPaid = liabilityRow.paidAmount + existing.txRow.amount;
          const nextSettled = nextPaid >= liabilityRow.totalAmount;

          await tx
            .update(liabilities)
            .set({
              paidAmount: nextPaid,
              isSettled: nextSettled,
              updatedAt: new Date(),
            })
            .where(eq(liabilities.id, liabilityRow.id));
        }
      }

      return restored;
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: restoredTx,
    };
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return {
        success: false,
        error: "Transaksi tidak ditemukan.",
      };
    }
    if (err instanceof Error && err.message === "MONTH_CLOSED") {
      return {
        success: false,
        error:
          "Tidak dapat memulihkan transaksi pada siklus bulan yang telah ditutup.",
      };
    }
    console.error("Gagal memulihkan transaksi (Undo):", err);
    return {
      success: false,
      error: "Gagal memulihkan transaksi.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   4. SERVER ACTION: hardDeleteExpiredTransactions
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Menghapus permanen transaksi yang telah berstatus `isDeleted = true` dan
 * melewati jendela waktu undo (`retentionSeconds`, default 30 detik).
 */
export async function hardDeleteExpiredTransactions(
  retentionSeconds = 30,
  explicitUserId?: string
): Promise<ActionResponse<{ deletedCount: number }>> {
  try {
    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const cutoffDate = new Date(Date.now() - retentionSeconds * 1000);

    const deletedRows = await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.isDeleted, true),
          lt(transactions.updatedAt, cutoffDate)
        )
      )
      .returning({ id: transactions.id });

    return {
      success: true,
      data: { deletedCount: deletedRows.length },
    };
  } catch (err) {
    console.error("Gagal membersihkan transaksi expired:", err);
    return {
      success: false,
      error: "Gagal membersihkan transaksi yang telah dihapus.",
    };
  }
}
