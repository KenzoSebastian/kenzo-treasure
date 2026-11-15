/**
 * ==============================================================================
 * Kenzo Treasury — Shared Transactional Helper: Category & Liability Mutation (Fase R8)
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Menyatukan mutasi atomik pembuatan transaksi pengeluaran pos (`transactions`)
 * sekaligus rekonsiliasi pembayaran cicilan (`liabilities`) dengan row-level locking
 * (`FOR UPDATE`) agar terhindar dari:
 * 1. Double-counting atau ketidakcocokan antara pembayaran cicilan via
 *    `QuickTransactionDrawer` (`createTransaction`) dan `LiabilityTrackerCard`
 *    (`recordInstallmentPayment`).
 * 2. Race condition pada klik ganda konkuren yang berpotensi menyebabkan overpay
 *    melebihi `remainingAmount` atau menembus `isSettled = true`.
 */

import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  budgetCategories,
  liabilities,
  transactions,
  type Liability,
  type Transaction,
} from "@/db/schema";
import * as schema from "@/db/schema";

export interface ExecuteCategoryTransactionTxParams {
  tx: PostgresJsDatabase<typeof schema>;
  userId: string;
  categoryId: string;
  amount: number;
  date: string;
  description: string;
  method: "cash" | "debit" | "qris" | "transfer";
}

export interface ExecuteCategoryTransactionTxResult {
  transaction: Transaction;
  updatedLiability: Liability | null;
}

/**
 * Mengeksekusi insert `transactions` + update `liabilities` (bila pos terikat `liabilityId`)
 * di dalam satu transaksi database dengan penguncian baris (`FOR UPDATE`).
 */
export async function executeCategoryTransactionTx({
  tx,
  userId,
  categoryId,
  amount,
  date,
  description,
  method,
}: ExecuteCategoryTransactionTxParams): Promise<ExecuteCategoryTransactionTxResult> {
  // 1. Kunci baris budget_categories dengan FOR UPDATE
  const [lockedCategory] = await tx
    .select()
    .from(budgetCategories)
    .where(eq(budgetCategories.id, categoryId))
    .for("update");

  if (!lockedCategory) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  let updatedLiability: Liability | null = null;

  // 2. Jika pos terikat ke cicilan (`liabilityId`), kunci baris liabilities dengan FOR UPDATE & cek batas sisa
  if (lockedCategory.liabilityId) {
    const [lockedLiability] = await tx
      .select()
      .from(liabilities)
      .where(
        and(
          eq(liabilities.id, lockedCategory.liabilityId),
          eq(liabilities.userId, userId)
        )
      )
      .for("update");

    if (!lockedLiability) {
      throw new Error("LIABILITY_NOT_FOUND");
    }

    const remainingDebt = Math.max(
      0,
      lockedLiability.totalAmount - lockedLiability.paidAmount
    );

    if (lockedLiability.isSettled || remainingDebt <= 0) {
      throw new Error("LIABILITY_ALREADY_SETTLED");
    }

    if (amount > remainingDebt) {
      throw new Error("LIABILITY_OVERPAYMENT");
    }

    const nextPaid = lockedLiability.paidAmount + amount;
    const nextSettled = nextPaid >= lockedLiability.totalAmount;

    const [updated] = await tx
      .update(liabilities)
      .set({
        paidAmount: nextPaid,
        isSettled: nextSettled,
        updatedAt: new Date(),
      })
      .where(eq(liabilities.id, lockedLiability.id))
      .returning();

    updatedLiability = updated;

    if (nextSettled) {
      await tx
        .update(budgetCategories)
        .set({
          isTemporary: true,
          updatedAt: new Date(),
        })
        .where(eq(budgetCategories.liabilityId, lockedLiability.id));
    }
  }

  // 3. Simpan baris transaksi pengeluaran
  const [insertedTx] = await tx
    .insert(transactions)
    .values({
      userId,
      categoryId,
      amount,
      date,
      description,
      method,
      isDeleted: false,
    })
    .returning();

  return {
    transaction: insertedTx,
    updatedLiability,
  };
}
