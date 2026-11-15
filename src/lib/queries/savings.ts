/**
 * ==============================================================================
 * Kenzo Treasury — Database Queries: Emergency Fund Vault & Savings (Fase B11)
 * ==============================================================================
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { savingsAccount, months, budgetCategories } from "@/db/schema";
import {
  calculateSafetyMonths,
  DEFAULT_EMERGENCY_FUND_TARGET,
} from "@/lib/financial-calculations";
import { resolveAuthenticatedUserId } from "./months";
import type { ActionResponse, SavingsVaultSummary } from "@/types";

export const DEFAULT_MONTHLY_FIXED_EXPENSE = 0;

/**
 * Mengambil (atau menginisialisasi) akun brankas tabungan & dana darurat pengguna
 * beserta kalkulasi *Safety Months* terhadap biaya hidup wajib bulanan.
 */
export async function getSavingsAccount(
  explicitUserId?: string
): Promise<ActionResponse<SavingsVaultSummary>> {
  const userId = await resolveAuthenticatedUserId(explicitUserId);
  if (!userId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi. Silakan login terlebih dahulu.",
    };
  }

  try {
    let [account] = await db
      .select()
      .from(savingsAccount)
      .where(eq(savingsAccount.userId, userId))
      .limit(1);

    if (!account) {
      const [created] = await db
        .insert(savingsAccount)
        .values({
          userId,
          balance: 0,
          emergencyFundTarget: DEFAULT_EMERGENCY_FUND_TARGET,
          emergencyFundBalance: 0,
        })
        .onConflictDoNothing()
        .returning();

      if (created) {
        account = created;
      } else {
        [account] = await db
          .select()
          .from(savingsAccount)
          .where(eq(savingsAccount.userId, userId))
          .limit(1);
      }
    }

    // Hitung biaya hidup wajib bulanan dari siklus bulan terbaru pengguna di DB
    let monthlyFixedExpense = DEFAULT_MONTHLY_FIXED_EXPENSE;

    const [latestMonth] = await db
      .select({ id: months.id })
      .from(months)
      .where(eq(months.userId, userId))
      .orderBy(desc(months.year), desc(months.monthIndex))
      .limit(1);

    if (latestMonth) {
      const categoriesList = await db
        .select({
          group: budgetCategories.group,
          targetBudget: budgetCategories.targetBudget,
        })
        .from(budgetCategories)
        .where(eq(budgetCategories.monthId, latestMonth.id));

      const fixedSum = categoriesList
        .filter((c) => c.group === "pos_wajib" || c.group === "kebutuhan")
        .reduce((sum, c) => sum + c.targetBudget, 0);

      if (fixedSum > 0) {
        monthlyFixedExpense = fixedSum;
      }
    }

    const freeSavingsBalance = account?.balance ?? 0;
    const emergencyFundBalance = account?.emergencyFundBalance ?? 0;
    const emergencyFundTarget =
      account?.emergencyFundTarget ?? DEFAULT_EMERGENCY_FUND_TARGET;

    const safetyResult = calculateSafetyMonths(
      emergencyFundBalance,
      monthlyFixedExpense,
      emergencyFundTarget
    );

    return {
      success: true,
      data: {
        id: account?.id ?? "",
        userId,
        freeSavingsBalance,
        emergencyFundBalance,
        emergencyFundTarget,
        totalVaultBalance: freeSavingsBalance + emergencyFundBalance,
        monthlyFixedExpense,
        safetyMonths: safetyResult.safetyMonths,
        percentageOfTarget: safetyResult.percentageOfTarget,
        isTargetReached: safetyResult.isTargetReached,
        updatedAt: account?.updatedAt ?? new Date(),
      },
    };
  } catch (err) {
    console.error("Gagal memuat brankas tabungan & dana darurat:", err);
    return {
      success: false,
      error: "Gagal memuat data brankas dana darurat.",
    };
  }
}
