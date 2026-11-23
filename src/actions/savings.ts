"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Brankas Dana Darurat (Emergency Fund Vault) (Fase B11)
 * ==============================================================================
 *
 * Mengelola seluruh mutasi akun tabungan & dana darurat (`savings_account`):
 * 1. `transferToEmergencyFund`: Memindahkan dana dari saldo tabungan bebas ke
 *    brankas dana darurat (atau menyetor ke dana darurat).
 * 2. `withdrawFromEmergencyFund`: Menarik dana dari brankas dana darurat kembali
 *    ke saldo tabungan bebas.
 * 3. `updateEmergencyFundTarget`: Mengubah target nominal dana darurat ideal.
 * 4. `topUpFreeSavings`: Menambah saldo tabungan bebas (opsional untuk penyesuaian saldo awal).
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { savingsAccount } from "@/db/schema";
import {
  transferEmergencyFundSchema,
  updateEmergencyTargetSchema,
} from "@/schemas/savings.schema";
import { DEFAULT_EMERGENCY_FUND_TARGET } from "@/lib/financial-calculations";
import { resolveAuthenticatedUserId } from "@/lib/queries/months";
import { getSavingsAccount } from "@/lib/queries/savings";
import { revalidateDashboardRoutes } from "@/lib/revalidate";
import type { ActionResponse, SavingsVaultSummary } from "@/types";

export { getSavingsAccount };

/**
 * Helper internal: resolves `(userId, amount)` or `(amount)` or `({ amount })`
 */
function parseAmountAndUserArgs(
  arg1: string | number | { amount: number; allowOverTarget?: boolean },
  arg2?: number,
  arg3?: boolean
): { rawAmount: unknown; allowOverTarget?: boolean; explicitUserId?: string } {
  if (typeof arg1 === "string" && arg2 !== undefined) {
    return { rawAmount: arg2, allowOverTarget: arg3, explicitUserId: arg1 };
  }
  if (typeof arg1 === "object" && arg1 !== null && "amount" in arg1) {
    return { rawAmount: arg1.amount, allowOverTarget: arg1.allowOverTarget };
  }
  return { rawAmount: arg1 };
}

/* ══════════════════════════════════════════════════════════════════════════════
   1. SERVER ACTION: transferToEmergencyFund
   ══════════════════════════════════════════════════════════════════════════════ */

export async function transferToEmergencyFund(
  userIdOrAmount: string | number | { amount: number; allowOverTarget?: boolean },
  amountArg?: number,
  allowOverTargetArg?: boolean
): Promise<ActionResponse<SavingsVaultSummary>> {
  try {
    const { rawAmount, allowOverTarget, explicitUserId } = parseAmountAndUserArgs(
      userIdOrAmount,
      amountArg,
      allowOverTargetArg
    );

    const parsed = transferEmergencyFundSchema.safeParse({
      amount: rawAmount,
      allowOverTarget,
    });
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Nominal setoran dana darurat tidak valid.",
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi. Silakan login terlebih dahulu.",
      };
    }

    const { amount } = parsed.data;

    await db.transaction(async (tx) => {
      let [account] = await tx
        .select()
        .from(savingsAccount)
        .where(eq(savingsAccount.userId, userId))
        .limit(1);

      if (!account) {
        const [created] = await tx
          .insert(savingsAccount)
          .values({
            userId,
            balance: 0,
            emergencyFundTarget: DEFAULT_EMERGENCY_FUND_TARGET,
            emergencyFundBalance: 0,
          })
          .returning();
        account = created;
      }

      // Invarian SC-15: Guard saat target Rp 0 atau sudah 100% tercapai
      if (account.emergencyFundTarget <= 0) {
        throw new Error("TARGET_ZERO");
      }

      if (
        account.emergencyFundBalance >= account.emergencyFundTarget &&
        !parsed.data.allowOverTarget
      ) {
        throw new Error("TARGET_ALREADY_REACHED");
      }

      if (account.balance < amount) {
        throw new Error("INSUFFICIENT_FREE_SAVINGS");
      }

      await tx
        .update(savingsAccount)
        .set({
          balance: account.balance - amount,
          emergencyFundBalance: account.emergencyFundBalance + amount,
          updatedAt: new Date(),
        })
        .where(eq(savingsAccount.userId, userId));
    });

    revalidateDashboardRoutes();

    return getSavingsAccount(userId);
  } catch (err) {
    if (err instanceof Error && err.message === "TARGET_ZERO") {
      return {
        success: false,
        error:
          "Target Dana Darurat belum ditentukan (Rp 0). Tentukan target nominal dana darurat Anda terlebih dahulu.",
      };
    }
    if (err instanceof Error && err.message === "TARGET_ALREADY_REACHED") {
      return {
        success: false,
        error:
          "Target Dana Darurat sudah tercapai 100%. Naikkan target dana darurat atau konfirmasi untuk tetap menambahkan cadangan ekstra.",
      };
    }
    if (err instanceof Error && err.message === "INSUFFICIENT_FREE_SAVINGS") {
      return {
        success: false,
        error:
          "Saldo tabungan bebas tidak mencukupi untuk dipindahkan ke Brankas Dana Darurat.",
      };
    }
    console.error("Gagal menyetor ke dana darurat:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyetor ke Brankas Dana Darurat.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. SERVER ACTION: withdrawFromEmergencyFund
   ══════════════════════════════════════════════════════════════════════════════ */

export async function withdrawFromEmergencyFund(
  userIdOrAmount: string | number | { amount: number },
  amountArg?: number
): Promise<ActionResponse<SavingsVaultSummary>> {
  try {
    const { rawAmount, explicitUserId } = parseAmountAndUserArgs(
      userIdOrAmount,
      amountArg
    );

    const parsed = transferEmergencyFundSchema.safeParse({ amount: rawAmount });
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Nominal penarikan dana darurat tidak valid.",
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const { amount } = parsed.data;

    await db.transaction(async (tx) => {
      const [account] = await tx
        .select()
        .from(savingsAccount)
        .where(eq(savingsAccount.userId, userId))
        .limit(1);

      if (!account || account.emergencyFundBalance < amount) {
        throw new Error("INSUFFICIENT_EMERGENCY_BALANCE");
      }

      await tx
        .update(savingsAccount)
        .set({
          emergencyFundBalance: account.emergencyFundBalance - amount,
          balance: account.balance + amount,
          updatedAt: new Date(),
        })
        .where(eq(savingsAccount.userId, userId));
    });

    revalidateDashboardRoutes();

    return getSavingsAccount(userId);
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "INSUFFICIENT_EMERGENCY_BALANCE"
    ) {
      return {
        success: false,
        error:
          "Nominal penarikan melebihi saldo yang tersedia di Brankas Dana Darurat.",
      };
    }
    console.error("Gagal menarik dana darurat:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menarik dana darurat.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. SERVER ACTION: updateEmergencyFundTarget
   ══════════════════════════════════════════════════════════════════════════════ */

export async function updateEmergencyFundTarget(
  userIdOrTarget: string | number | { targetAmount: number },
  newTargetArg?: number
): Promise<ActionResponse<SavingsVaultSummary>> {
  try {
    let rawTarget: unknown = userIdOrTarget;
    let explicitUserId: string | undefined;

    if (typeof userIdOrTarget === "string" && newTargetArg !== undefined) {
      explicitUserId = userIdOrTarget;
      rawTarget = newTargetArg;
    } else if (
      typeof userIdOrTarget === "object" &&
      userIdOrTarget !== null &&
      "targetAmount" in userIdOrTarget
    ) {
      rawTarget = userIdOrTarget.targetAmount;
    }

    const parsed = updateEmergencyTargetSchema.safeParse({
      targetAmount: rawTarget,
    });
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Target dana darurat tidak valid.",
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    await db
      .insert(savingsAccount)
      .values({
        userId,
        balance: 0,
        emergencyFundTarget: parsed.data.targetAmount,
        emergencyFundBalance: 0,
      })
      .onConflictDoUpdate({
        target: savingsAccount.userId,
        set: {
          emergencyFundTarget: parsed.data.targetAmount,
          updatedAt: new Date(),
        },
      });

    revalidateDashboardRoutes();

    return getSavingsAccount(userId);
  } catch (err) {
    console.error("Gagal memperbarui target dana darurat:", err);
    return {
      success: false,
      error: "Gagal memperbarui target dana darurat.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   4. SERVER ACTION: topUpFreeSavings (Setor Saldo Tabungan Bebas)
   ══════════════════════════════════════════════════════════════════════════════ */

export async function topUpFreeSavings(
  amount: number,
  explicitUserId?: string
): Promise<ActionResponse<SavingsVaultSummary>> {
  try {
    const parsed = transferEmergencyFundSchema.safeParse({ amount });
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "Nominal setoran tidak valid.",
      };
    }

    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(savingsAccount)
        .where(eq(savingsAccount.userId, userId))
        .limit(1);

      if (!existing) {
        await tx.insert(savingsAccount).values({
          userId,
          balance: parsed.data.amount,
          emergencyFundTarget: DEFAULT_EMERGENCY_FUND_TARGET,
          emergencyFundBalance: 0,
        });
      } else {
        await tx
          .update(savingsAccount)
          .set({
            balance: existing.balance + parsed.data.amount,
            updatedAt: new Date(),
          })
          .where(eq(savingsAccount.userId, userId));
      }
    });

    revalidateDashboardRoutes();

    return getSavingsAccount(userId);
  } catch (err) {
    console.error("Gagal menambah saldo tabungan bebas:", err);
    return {
      success: false,
      error: "Gagal menambah saldo tabungan bebas.",
    };
  }
}
