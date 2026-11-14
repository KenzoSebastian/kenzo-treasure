/**
 * ==============================================================================
 * Kenzo Treasury — Database Queries: Liabilities & Installment Tracker (Fase B7)
 * ==============================================================================
 */

import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { liabilities } from "@/db/schema";
import {
  calculateDebtProgress,
  calculateRemainingDebtMonths,
} from "@/lib/financial-calculations";
import { resolveAuthenticatedUserId } from "./months";
import type {
  ActionResponse,
  LiabilitiesSummary,
  LiabilityWithProgress,
} from "@/types";

export function enrichLiabilityWithProgress(
  item: typeof liabilities.$inferSelect
): LiabilityWithProgress {
  const progress = calculateDebtProgress(item.paidAmount, item.totalAmount);
  const remainingMonths = calculateRemainingDebtMonths(
    progress.remainingAmount,
    item.monthlyPayment
  );

  return {
    ...item,
    isSettled: item.isSettled || progress.isSettled,
    remainingAmount: progress.remainingAmount,
    percentage: progress.percentage,
    remainingMonths,
  };
}

/**
 * Mengambil seluruh daftar utang/cicilan pengguna (aktif vs sudah lunas)
 * beserta kalkulasi progres pelunasan dan sisa bulan.
 */
export async function getLiabilities(
  explicitUserId?: string
): Promise<ActionResponse<LiabilitiesSummary>> {
  const userId = await resolveAuthenticatedUserId(explicitUserId);
  if (!userId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi. Silakan login terlebih dahulu.",
    };
  }

  try {
    const records = await db
      .select()
      .from(liabilities)
      .where(eq(liabilities.userId, userId))
      .orderBy(asc(liabilities.isSettled), asc(liabilities.createdAt));

    const items = records.map(enrichLiabilityWithProgress);
    const activeLiabilities = items.filter((item) => !item.isSettled);
    const settledLiabilities = items.filter((item) => item.isSettled);

    const totalDebtRemaining = activeLiabilities.reduce(
      (sum, item) => sum + item.remainingAmount,
      0
    );
    const totalPaidAmount = items.reduce(
      (sum, item) => sum + item.paidAmount,
      0
    );
    const totalMonthlyCommitment = activeLiabilities.reduce(
      (sum, item) => sum + item.monthlyPayment,
      0
    );

    return {
      success: true,
      data: {
        items,
        activeLiabilities,
        settledLiabilities,
        totalDebtRemaining,
        totalPaidAmount,
        totalMonthlyCommitment,
      },
    };
  } catch (err) {
    console.error("Gagal mengambil daftar cicilan/utang:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat memuat daftar cicilan.",
    };
  }
}

/**
 * Mengambil satu record cicilan spesifik beserta progresnya.
 */
export async function getLiabilityById(
  liabilityId: string,
  explicitUserId?: string
): Promise<ActionResponse<LiabilityWithProgress>> {
  const userId = await resolveAuthenticatedUserId(explicitUserId);
  if (!userId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi.",
    };
  }

  try {
    const [record] = await db
      .select()
      .from(liabilities)
      .where(and(eq(liabilities.id, liabilityId), eq(liabilities.userId, userId)))
      .limit(1);

    if (!record) {
      return {
        success: false,
        error: "Data cicilan tidak ditemukan.",
      };
    }

    return {
      success: true,
      data: enrichLiabilityWithProgress(record),
    };
  } catch (err) {
    console.error("Gagal mengambil detail cicilan:", err);
    return {
      success: false,
      error: "Gagal memuat detail cicilan.",
    };
  }
}
