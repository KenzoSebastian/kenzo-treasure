"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Finite Liabilities & Installment Tracker (Fase B7 + R8)
 * ==============================================================================
 *
 * Mengelola seluruh mutasi utang/cicilan bertarget lunas (`liabilities`):
 * 1. `createLiability`: Menambah pos cicilan bertarget baru + opsional membuat
 *    pos anggaran `pos_wajib` (`isTemporary = true`) di bulan berjalan dengan
 *    memotong kuota `Uang Bebas` apabila syarat dua lapis terpenuhi.
 * 2. `recordInstallmentPayment`: Mencatat pembayaran cicilan bulanan secara atomik:
 *    - Bila `monthId` disertakan, menyinkronkan ke `transactions` + `budget_categories`
 *      melalui helper atomik `executeCategoryTransactionTx` (`FOR UPDATE`).
 *    - Otomatis menandai `isSettled = true` jika `paidAmount >= totalAmount` dan
 *      menolak overpayment melebihi sisa pokok utang.
 * 3. `updateLiability`: Memperbarui parameter cicilan & menyinkronkan pos bulan aktif.
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  liabilities,
  budgetCategories,
  months,
  incomes,
  transactions,
} from "@/db/schema";
import {
  createLiabilitySchema,
  recordInstallmentSchema,
  updateLiabilitySchema,
  type CreateLiabilityInput,
  type RecordInstallmentInput,
  type UpdateLiabilityInput,
} from "@/schemas/liability.schema";
import { resolveCategoryIconKey } from "@/lib/category-icons";
import { executeCategoryTransactionTx } from "@/lib/category-transaction-tx";
import {
  isDateWithinMonthCycle,
  resolveDefaultCycleDate,
} from "@/lib/financial-calculations";
import { resolveAuthenticatedUserId } from "@/lib/queries/months";
import {
  getLiabilities,
  getLiabilityById,
  enrichLiabilityWithProgress,
} from "@/lib/queries/liabilities";
import { revalidateDashboardRoutes } from "@/lib/revalidate";
import type { ActionResponse, LiabilityWithProgress } from "@/types";

export { getLiabilities, getLiabilityById };

/**
 * Helper internal: memeriksa syarat dua lapis Uang Bebas pada bulan terbuka
 * (`freeCategory.targetBudget >= requiredAmount` DAN `effectiveFreeRemaining >= requiredAmount`).
 */
async function verifyAndLockFreeBudgetForLiability(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  monthId: string,
  userId: string,
  requiredAmount: number
) {
  const [freeCategory] = await tx
    .select()
    .from(budgetCategories)
    .where(
      and(
        eq(budgetCategories.monthId, monthId),
        eq(budgetCategories.group, "uang_bebas_tabungan")
      )
    )
    .for("update");

  if (!freeCategory) {
    throw new Error("FREE_CATEGORY_NOT_FOUND");
  }

  const [monthIncomes, freeTransactions] = await Promise.all([
    tx
      .select({ amount: incomes.amount, isBaseSalary: incomes.isBaseSalary })
      .from(incomes)
      .where(and(eq(incomes.monthId, monthId), eq(incomes.userId, userId))),
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
  const freeSpentSum = freeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const effectiveFreeRemaining =
    freeCategory.targetBudget + additionalIncomesSum - freeSpentSum;

  if (
    freeCategory.targetBudget < requiredAmount ||
    effectiveFreeRemaining < requiredAmount
  ) {
    throw new Error("INSUFFICIENT_FREE_BUDGET");
  }

  return freeCategory;
}

/* ══════════════════════════════════════════════════════════════════════════════
   1. SERVER ACTION: createLiability
   ══════════════════════════════════════════════════════════════════════════════ */

export async function createLiability(
  input: CreateLiabilityInput,
  explicitUserId?: string
): Promise<ActionResponse<LiabilityWithProgress>> {
  try {
    const parsed = createLiabilitySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "Validasi data cicilan gagal.",
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

    const {
      name,
      totalAmount,
      monthlyPayment,
      totalMonths,
      paidAmount,
      icon,
      monthId,
      addToCurrentMonthBudget,
    } = parsed.data;
    const isSettled = paidAmount >= totalAmount;
    const normalizedIcon = resolveCategoryIconKey(icon, "pos_wajib", "liability");

    const created = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(liabilities)
        .values({
          userId,
          name,
          icon: normalizedIcon,
          totalAmount,
          paidAmount,
          monthlyPayment,
          totalMonths:
            totalMonths ?? Math.ceil(Math.max(1, totalAmount / monthlyPayment)),
          isSettled,
        })
        .returning();

      // Jika diminta mengalokasikan langsung ke bulan berjalan yang terbuka
      if (monthId && addToCurrentMonthBudget && !isSettled) {
        const [targetMonth] = await tx
          .select()
          .from(months)
          .where(and(eq(months.id, monthId), eq(months.userId, userId)))
          .limit(1);

        if (!targetMonth) {
          throw new Error("MONTH_NOT_FOUND");
        }
        if (targetMonth.isClosed) {
          throw new Error("MONTH_CLOSED");
        }

        const freeCategory = await verifyAndLockFreeBudgetForLiability(
          tx,
          targetMonth.id,
          userId,
          monthlyPayment
        );

        await tx
          .update(budgetCategories)
          .set({
            targetBudget: freeCategory.targetBudget - monthlyPayment,
            updatedAt: new Date(),
          })
          .where(eq(budgetCategories.id, freeCategory.id));

        const [lastCat] = await tx
          .select({ sortOrder: budgetCategories.sortOrder })
          .from(budgetCategories)
          .where(eq(budgetCategories.monthId, targetMonth.id))
          .orderBy(desc(budgetCategories.sortOrder))
          .limit(1);

        await tx.insert(budgetCategories).values({
          monthId: targetMonth.id,
          liabilityId: inserted.id,
          name: inserted.name,
          icon: normalizedIcon,
          group: "pos_wajib",
          targetBudget: inserted.monthlyPayment,
          isTemporary: true,
          sortOrder: (lastCat?.sortOrder ?? 0) + 1,
        });
      }

      return inserted;
    });

    revalidateDashboardRoutes();

    return {
      success: true,
      data: enrichLiabilityWithProgress(created),
    };
  } catch (err) {
    if (err instanceof Error) {
      if (
        err.message === "INSUFFICIENT_FREE_BUDGET" ||
        err.message === "FREE_CATEGORY_NOT_FOUND"
      ) {
        return {
          success: false,
          error:
            "Kuota atau sisa Uang Bebas bulan berjalan tidak mencukupi untuk menyerap cicilan bulanan ini. Matikan opsi alokasi bulan berjalan atau sesuaikan kuota Uang Bebas.",
        };
      }
      if (err.message === "MONTH_CLOSED") {
        return {
          success: false,
          error:
            "Tidak dapat mengalokasikan pos cicilan ke siklus bulan yang telah ditutup.",
        };
      }
      if (err.message === "MONTH_NOT_FOUND") {
        return {
          success: false,
          error: "Siklus bulan berjalan tidak ditemukan.",
        };
      }
    }
    console.error("Gagal membuat pos cicilan baru:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan pos cicilan baru.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. SERVER ACTION: recordInstallmentPayment
   ══════════════════════════════════════════════════════════════════════════════ */

export async function recordInstallmentPayment(
  inputOrLiabilityId: string | RecordInstallmentInput,
  amountArg?: number,
  transactionIdArg?: string | null,
  explicitUserId?: string
): Promise<ActionResponse<LiabilityWithProgress>> {
  try {
    const rawPayload =
      typeof inputOrLiabilityId === "string"
        ? {
            liabilityId: inputOrLiabilityId,
            amount: amountArg,
            transactionId: transactionIdArg ?? null,
          }
        : inputOrLiabilityId;

    const parsed = recordInstallmentSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Validasi nominal pembayaran cicilan gagal.",
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

    const {
      liabilityId,
      amount,
      transactionId,
      monthId,
      method,
      description,
      date,
    } = parsed.data;

    const updatedRecord = await db.transaction(async (tx) => {
      // Jalur terintegrasi bulan berjalan (sinkron ke transactions + budget_categories)
      if (monthId && !transactionId) {
        const [targetMonth] = await tx
          .select()
          .from(months)
          .where(and(eq(months.id, monthId), eq(months.userId, userId)))
          .limit(1);

        if (!targetMonth) {
          throw new Error("MONTH_NOT_FOUND");
        }
        if (targetMonth.isClosed) {
          throw new Error("MONTH_CLOSED");
        }

        const txDate =
          date ??
          resolveDefaultCycleDate(targetMonth.year, targetMonth.monthIndex);

        if (
          !isDateWithinMonthCycle(
            txDate,
            targetMonth.year,
            targetMonth.monthIndex
          )
        ) {
          throw new Error("INVALID_CYCLE_DATE");
        }

        const [existingLiability] = await tx
          .select()
          .from(liabilities)
          .where(
            and(
              eq(liabilities.id, liabilityId),
              eq(liabilities.userId, userId)
            )
          )
          .limit(1);

        if (!existingLiability) {
          throw new Error("NOT_FOUND");
        }

        // Cari pos anggaran yang terhubung ke liability ini pada bulan berjalan
        let [linkedCategory] = await tx
          .select()
          .from(budgetCategories)
          .where(
            and(
              eq(budgetCategories.monthId, targetMonth.id),
              eq(budgetCategories.liabilityId, liabilityId)
            )
          )
          .limit(1);

        // Jika belum ada posnya di bulan terbuka ini, auto-create dengan memotong Uang Bebas
        if (!linkedCategory) {
          const requiredQuota = Math.min(
            existingLiability.monthlyPayment,
            Math.max(
              amount,
              existingLiability.totalAmount - existingLiability.paidAmount
            )
          );
          const freeCategory = await verifyAndLockFreeBudgetForLiability(
            tx,
            targetMonth.id,
            userId,
            requiredQuota
          );

          await tx
            .update(budgetCategories)
            .set({
              targetBudget: freeCategory.targetBudget - requiredQuota,
              updatedAt: new Date(),
            })
            .where(eq(budgetCategories.id, freeCategory.id));

          const [lastCat] = await tx
            .select({ sortOrder: budgetCategories.sortOrder })
            .from(budgetCategories)
            .where(eq(budgetCategories.monthId, targetMonth.id))
            .orderBy(desc(budgetCategories.sortOrder))
            .limit(1);

          const [createdCat] = await tx
            .insert(budgetCategories)
            .values({
              monthId: targetMonth.id,
              liabilityId: existingLiability.id,
              name: existingLiability.name,
              icon: resolveCategoryIconKey(
                existingLiability.icon,
                "pos_wajib",
                existingLiability.id
              ),
              group: "pos_wajib",
              targetBudget: requiredQuota,
              isTemporary: true,
              sortOrder: (lastCat?.sortOrder ?? 0) + 1,
            })
            .returning();

          linkedCategory = createdCat;
        }

        const txResult = await executeCategoryTransactionTx({
          tx,
          userId,
          categoryId: linkedCategory.id,
          amount,
          date: txDate,
          description:
            description?.trim() || `Cicilan ${existingLiability.name}`,
          method: method ?? "transfer",
        });

        if (!txResult.updatedLiability) {
          throw new Error("NOT_FOUND");
        }

        return txResult.updatedLiability;
      }

      // Jalur langsung tanpa monthId (tetap memakai FOR UPDATE & guard anti-overpayment)
      const [existing] = await tx
        .select()
        .from(liabilities)
        .where(
          and(eq(liabilities.id, liabilityId), eq(liabilities.userId, userId))
        )
        .for("update");

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const remainingDebt = Math.max(
        0,
        existing.totalAmount - existing.paidAmount
      );

      if (existing.isSettled || remainingDebt <= 0) {
        throw new Error("LIABILITY_ALREADY_SETTLED");
      }

      if (amount > remainingDebt) {
        throw new Error("LIABILITY_OVERPAYMENT");
      }

      const nextPaidAmount = existing.paidAmount + amount;
      const nextIsSettled = nextPaidAmount >= existing.totalAmount;

      const [updated] = await tx
        .update(liabilities)
        .set({
          paidAmount: nextPaidAmount,
          isSettled: nextIsSettled,
          updatedAt: new Date(),
        })
        .where(
          and(eq(liabilities.id, liabilityId), eq(liabilities.userId, userId))
        )
        .returning();

      if (nextIsSettled) {
        await tx
          .update(budgetCategories)
          .set({
            isTemporary: true,
            updatedAt: new Date(),
          })
          .where(eq(budgetCategories.liabilityId, liabilityId));
      }

      return updated;
    });

    revalidateDashboardRoutes();

    return {
      success: true,
      data: enrichLiabilityWithProgress(updatedRecord),
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND") {
        return {
          success: false,
          error: "Data cicilan tidak ditemukan atau bukan milik akun Anda.",
        };
      }
      if (err.message === "LIABILITY_ALREADY_SETTLED") {
        return {
          success: false,
          error: "Cicilan ini sudah lunas. Tidak dapat mencatat pembayaran lagi.",
        };
      }
      if (err.message === "LIABILITY_OVERPAYMENT") {
        return {
          success: false,
          error:
            "Nominal pembayaran melebihi sisa pokok cicilan yang belum dibayar.",
        };
      }
      if (err.message === "MONTH_CLOSED") {
        return {
          success: false,
          error:
            "Tidak dapat mencatat pembayaran cicilan pada siklus bulan yang telah ditutup.",
        };
      }
      if (err.message === "INVALID_CYCLE_DATE") {
        return {
          success: false,
          error:
            "Tanggal pembayaran harus berada di dalam rentang siklus bulan terpilih.",
        };
      }
      if (
        err.message === "INSUFFICIENT_FREE_BUDGET" ||
        err.message === "FREE_CATEGORY_NOT_FOUND"
      ) {
        return {
          success: false,
          error:
            "Pos cicilan belum tersedia di bulan berjalan dan kuota Uang Bebas tidak mencukupi untuk membuat pos otomatis.",
        };
      }
    }
    console.error("Gagal mencatat pembayaran cicilan:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat mencatat pembayaran cicilan.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. SERVER ACTION: updateLiability
   ══════════════════════════════════════════════════════════════════════════════ */

export async function updateLiability(
  inputOrId: string | UpdateLiabilityInput,
  data?: Partial<Omit<UpdateLiabilityInput, "liabilityId">>,
  explicitUserId?: string
): Promise<ActionResponse<LiabilityWithProgress>> {
  try {
    const rawPayload =
      typeof inputOrId === "string"
        ? { liabilityId: inputOrId, ...(data ?? {}) }
        : inputOrId;

    const parsed = updateLiabilitySchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "Validasi pembaruan cicilan gagal.",
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
      const [existing] = await tx
        .select()
        .from(liabilities)
        .where(
          and(
            eq(liabilities.id, parsed.data.liabilityId),
            eq(liabilities.userId, userId)
          )
        )
        .for("update");

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const nextTotal = parsed.data.totalAmount ?? existing.totalAmount;
      const nextMonthly = parsed.data.monthlyPayment ?? existing.monthlyPayment;
      if (nextMonthly > nextTotal) {
        throw new Error("MONTHLY_EXCEEDS_TOTAL");
      }

      const nextIsSettled = existing.paidAmount >= nextTotal;
      const nextName = parsed.data.name ?? existing.name;
      const nextIcon = parsed.data.icon
        ? resolveCategoryIconKey(parsed.data.icon, "pos_wajib", existing.id)
        : existing.icon;

      const [updatedRow] = await tx
        .update(liabilities)
        .set({
          name: nextName,
          icon: nextIcon,
          totalAmount: nextTotal,
          monthlyPayment: nextMonthly,
          totalMonths:
            parsed.data.totalMonths !== undefined
              ? parsed.data.totalMonths
              : existing.totalMonths,
          isSettled: nextIsSettled,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(liabilities.id, parsed.data.liabilityId),
            eq(liabilities.userId, userId)
          )
        )
        .returning();

      // Sinkronkan pos anggaran terkait pada siklus bulan yang masih terbuka
      const openLinkedCategories = await tx
        .select({
          id: budgetCategories.id,
          monthId: budgetCategories.monthId,
          targetBudget: budgetCategories.targetBudget,
        })
        .from(budgetCategories)
        .innerJoin(months, eq(budgetCategories.monthId, months.id))
        .where(
          and(
            eq(budgetCategories.liabilityId, updatedRow.id),
            eq(months.userId, userId),
            eq(months.isClosed, false)
          )
        );

      for (const linkedCat of openLinkedCategories) {
        const delta = nextMonthly - linkedCat.targetBudget;
        if (delta > 0) {
          const freeCat = await verifyAndLockFreeBudgetForLiability(
            tx,
            linkedCat.monthId,
            userId,
            delta
          );
          await tx
            .update(budgetCategories)
            .set({
              targetBudget: freeCat.targetBudget - delta,
              updatedAt: new Date(),
            })
            .where(eq(budgetCategories.id, freeCat.id));
        } else if (delta < 0) {
          const [freeCat] = await tx
            .select()
            .from(budgetCategories)
            .where(
              and(
                eq(budgetCategories.monthId, linkedCat.monthId),
                eq(budgetCategories.group, "uang_bebas_tabungan")
              )
            )
            .for("update");

          if (freeCat) {
            await tx
              .update(budgetCategories)
              .set({
                targetBudget: freeCat.targetBudget + Math.abs(delta),
                updatedAt: new Date(),
              })
              .where(eq(budgetCategories.id, freeCat.id));
          }
        }

        await tx
          .update(budgetCategories)
          .set({
            name: nextName,
            icon: nextIcon,
            targetBudget: nextMonthly,
            isTemporary: true,
            updatedAt: new Date(),
          })
          .where(eq(budgetCategories.id, linkedCat.id));
      }

      return updatedRow;
    });

    revalidateDashboardRoutes();

    return {
      success: true,
      data: enrichLiabilityWithProgress(updated),
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND") {
        return {
          success: false,
          error: "Data cicilan tidak ditemukan.",
        };
      }
      if (err.message === "MONTHLY_EXCEEDS_TOTAL") {
        return {
          success: false,
          error: "Cicilan per bulan tidak boleh melebihi total kewajiban utang.",
        };
      }
      if (
        err.message === "INSUFFICIENT_FREE_BUDGET" ||
        err.message === "FREE_CATEGORY_NOT_FOUND"
      ) {
        return {
          success: false,
          error:
            "Kenaikan cicilan bulanan melebihi sisa kuota Uang Bebas pada bulan berjalan.",
        };
      }
    }
    console.error("Gagal memperbarui data cicilan:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat memperbarui data cicilan.",
    };
  }
}
