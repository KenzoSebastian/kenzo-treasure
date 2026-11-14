/**
 * ==============================================================================
 * Kenzo Treasury — Database Queries: Transactions (Fase B9)
 * ==============================================================================
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { transactions, budgetCategories, months } from "@/db/schema";
import { resolveAuthenticatedUserId } from "./months";
import type { ActionResponse, TransactionItem } from "@/types";

/**
 * Mengambil seluruh transaksi aktif (non-deleted) dalam satu siklus bulan.
 */
export async function getTransactionsByMonth(
  monthId: string,
  explicitUserId?: string
): Promise<ActionResponse<TransactionItem[]>> {
  const userId = await resolveAuthenticatedUserId(explicitUserId);
  if (!userId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi.",
    };
  }

  try {
    const rows = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        categoryId: transactions.categoryId,
        categoryName: budgetCategories.name,
        categoryIcon: budgetCategories.icon,
        amount: transactions.amount,
        date: transactions.date,
        description: transactions.description,
        method: transactions.method,
        isDeleted: transactions.isDeleted,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions)
      .innerJoin(
        budgetCategories,
        eq(transactions.categoryId, budgetCategories.id)
      )
      .innerJoin(months, eq(budgetCategories.monthId, months.id))
      .where(
        and(
          eq(months.id, monthId),
          eq(months.userId, userId),
          eq(transactions.userId, userId),
          eq(transactions.isDeleted, false)
        )
      )
      .orderBy(desc(transactions.date), desc(transactions.createdAt));

    return {
      success: true,
      data: rows,
    };
  } catch (err) {
    console.error("Gagal memuat transaksi bulanan:", err);
    return {
      success: false,
      error: "Gagal memuat daftar transaksi bulanan.",
    };
  }
}

/**
 * Mengambil seluruh transaksi aktif (non-deleted) untuk satu pos kategori anggaran.
 */
export async function getTransactionsByCategory(
  categoryId: string,
  explicitUserId?: string
): Promise<ActionResponse<TransactionItem[]>> {
  const userId = await resolveAuthenticatedUserId(explicitUserId);
  if (!userId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi.",
    };
  }

  try {
    const rows = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        categoryId: transactions.categoryId,
        categoryName: budgetCategories.name,
        categoryIcon: budgetCategories.icon,
        amount: transactions.amount,
        date: transactions.date,
        description: transactions.description,
        method: transactions.method,
        isDeleted: transactions.isDeleted,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions)
      .innerJoin(
        budgetCategories,
        eq(transactions.categoryId, budgetCategories.id)
      )
      .innerJoin(months, eq(budgetCategories.monthId, months.id))
      .where(
        and(
          eq(transactions.categoryId, categoryId),
          eq(transactions.userId, userId),
          eq(months.userId, userId),
          eq(transactions.isDeleted, false)
        )
      )
      .orderBy(desc(transactions.date), desc(transactions.createdAt));

    return {
      success: true,
      data: rows,
    };
  } catch (err) {
    console.error("Gagal memuat transaksi per pos:", err);
    return {
      success: false,
      error: "Gagal memuat daftar transaksi pos anggaran.",
    };
  }
}
