"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Multi-Source Incomes Engine (Fase B6 + R10)
 * ==============================================================================
 *
 * Mengelola seluruh operasi mutasi (Server Actions) pemasukan multi-sumber:
 * 1. `addIncome`: Menambah pemasukan baru (gaji pokok atau freelance/bonus) dengan
 *    validasi Zod dan integrasi Dynamic Freedom Buffer.
 * 2. `updateIncome`: Memperbarui nominal, sumber, atau tanggal pemasukan.
 * 3. `deleteIncome`: Menghapus catatan pemasukan tambahan dengan proteksi bulan aktif
 *    serta memblokir penghapusan baris gaji pokok (`isBaseSalary = true`).
 */

import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { months, incomes, budgetCategories, transactions } from "@/db/schema";
import {
  createIncomeSchema,
  updateIncomeSchema,
  deleteIncomeSchema,
  type CreateIncomeInput,
  type UpdateIncomeInput,
  type DeleteIncomeInput,
} from "@/schemas/income.schema";
import { resolveAuthenticatedUserId } from "@/lib/queries/months";
import { getMonthlyIncomes, getIncomeById } from "@/lib/queries/incomes";
import { revalidateDashboardRoutes } from "@/lib/revalidate";
import { formatRupiah } from "@/lib/financial-calculations";
import type { ActionResponse, Income } from "@/types";

export { getMonthlyIncomes, getIncomeById };

/**
 * SC-06: Memeriksa apakah penghapusan atau pengurangan nominal pemasukan
 * menyebabkan defisit arus kas riil atau defisit kuota Uang Bebas / Tabungan (Shock Deficit).
 */
async function checkShockDeficit(params: {
  userId: string;
  monthId: string;
  targetIncomeId: string;
  nextAmount?: number; // undefined bila income dihapus
}): Promise<{ hasDeficit: boolean; shockDeficit: number }> {
  const { userId, monthId, targetIncomeId, nextAmount } = params;

  // 1. Ambil seluruh pos anggaran di bulan terkait
  const monthCategories = await db
    .select({
      id: budgetCategories.id,
      group: budgetCategories.group,
      targetBudget: budgetCategories.targetBudget,
    })
    .from(budgetCategories)
    .where(eq(budgetCategories.monthId, monthId));

  const categoryIds = monthCategories.map((c) => c.id);

  // 2. Ambil seluruh transaksi aktif (non-deleted) bulan ini
  const monthTransactions =
    categoryIds.length > 0
      ? await db
          .select({
            categoryId: transactions.categoryId,
            amount: transactions.amount,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              inArray(transactions.categoryId, categoryIds),
              eq(transactions.isDeleted, false)
            )
          )
      : [];

  // 3. Ambil seluruh pemasukan di bulan terkait
  const monthIncomes = await db
    .select({
      id: incomes.id,
      amount: incomes.amount,
      isBaseSalary: incomes.isBaseSalary,
    })
    .from(incomes)
    .where(and(eq(incomes.monthId, monthId), eq(incomes.userId, userId)));

  // 4. Hitung ulang total pemasukan baru
  let newTotalIncome = 0;
  let newAdditionalIncomesSum = 0;

  for (const inc of monthIncomes) {
    let effectiveAmount = inc.amount;
    if (inc.id === targetIncomeId) {
      if (nextAmount === undefined) {
        // Dihapus
        continue;
      }
      effectiveAmount = nextAmount;
    }

    newTotalIncome += effectiveAmount;
    if (!inc.isBaseSalary) {
      newAdditionalIncomesSum += effectiveAmount;
    }
  }

  // 5. Cek defisit arus kas riil (Total Belanja > Total Pemasukan Baru)
  const totalSpent = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const cashflowDeficit =
    totalSpent > newTotalIncome ? totalSpent - newTotalIncome : 0;

  // 6. Cek defisit pos Uang Bebas / Tabungan (Dynamic Freedom Buffer susut di bawah realisasi belanja bebas)
  let freeDeficit = 0;
  const freeCategory = monthCategories.find(
    (c) => c.group === "uang_bebas_tabungan"
  );

  if (freeCategory) {
    const freeSpent = monthTransactions
      .filter((tx) => tx.categoryId === freeCategory.id)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const newEffectiveFreeTarget =
      freeCategory.targetBudget + newAdditionalIncomesSum;

    if (freeSpent > newEffectiveFreeTarget) {
      freeDeficit = freeSpent - newEffectiveFreeTarget;
    }
  }

  const shockDeficit = Math.max(cashflowDeficit, freeDeficit);

  return {
    hasDeficit: shockDeficit > 0,
    shockDeficit,
  };
}

/* ══════════════════════════════════════════════════════════════════════════════
   1. SERVER ACTION: addIncome
   ══════════════════════════════════════════════════════════════════════════════ */

export async function addIncome(
  monthIdOrInput: string | CreateIncomeInput,
  dataOrUserId?: Omit<CreateIncomeInput, "monthId"> | string,
  explicitUserId?: string
): Promise<ActionResponse<Income>> {
  try {
    let rawPayload: unknown;
    let targetUserId = explicitUserId;

    if (typeof monthIdOrInput === "string") {
      rawPayload = {
        monthId: monthIdOrInput,
        ...(typeof dataOrUserId === "object" ? dataOrUserId : {}),
      };
    } else {
      rawPayload = monthIdOrInput;
      if (typeof dataOrUserId === "string") {
        targetUserId = dataOrUserId;
      }
    }

    const parsed = createIncomeSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "Validasi data pemasukan gagal.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const userId = await resolveAuthenticatedUserId(targetUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi. Silakan login terlebih dahulu.",
      };
    }

    const [monthRecord] = await db
      .select({
        id: months.id,
        isClosed: months.isClosed,
      })
      .from(months)
      .where(
        and(eq(months.id, parsed.data.monthId), eq(months.userId, userId))
      )
      .limit(1);

    if (!monthRecord) {
      return {
        success: false,
        error: "Siklus bulan tidak ditemukan atau bukan milik akun Anda.",
      };
    }

    if (monthRecord.isClosed) {
      return {
        success: false,
        error:
          "Tidak dapat menambah pemasukan pada siklus bulan yang telah ditutup (arsip).",
      };
    }

    if (parsed.data.isBaseSalary) {
      const [existingBaseSalary] = await db
        .select({ id: incomes.id })
        .from(incomes)
        .where(
          and(
            eq(incomes.monthId, parsed.data.monthId),
            eq(incomes.userId, userId),
            eq(incomes.isBaseSalary, true)
          )
        )
        .limit(1);

      if (existingBaseSalary) {
        return {
          success: false,
          error:
            "Bulan ini sudah memiliki catatan gaji pokok. Gunakan tipe pemasukan sampingan/freelance untuk pemasukan tambahan.",
        };
      }
    }

    const [newIncome] = await db
      .insert(incomes)
      .values({
        monthId: parsed.data.monthId,
        userId,
        source: parsed.data.source,
        amount: parsed.data.amount,
        date: parsed.data.date,
        isBaseSalary: parsed.data.isBaseSalary,
      })
      .returning();

    revalidateDashboardRoutes();

    return {
      success: true,
      data: newIncome,
    };
  } catch (error) {
    console.error("Gagal menambahkan pemasukan:", error);
    return {
      success: false,
      error: "Terjadi kesalahan internal pada server saat menyimpan pemasukan.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. SERVER ACTION: updateIncome
   ══════════════════════════════════════════════════════════════════════════════ */

export async function updateIncome(
  inputOrId: string | UpdateIncomeInput,
  dataOrUserId?: Partial<Omit<UpdateIncomeInput, "incomeId">> | string,
  explicitUserId?: string
): Promise<ActionResponse<Income>> {
  try {
    let rawPayload: unknown;
    let targetUserId = explicitUserId;

    if (typeof inputOrId === "string") {
      rawPayload = {
        incomeId: inputOrId,
        ...(typeof dataOrUserId === "object" ? dataOrUserId : {}),
      };
    } else {
      rawPayload = inputOrId;
      if (typeof dataOrUserId === "string") {
        targetUserId = dataOrUserId;
      }
    }

    const parsed = updateIncomeSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Validasi data pembaruan pemasukan gagal.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const userId = await resolveAuthenticatedUserId(targetUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const [existingIncome] = await db
      .select({
        id: incomes.id,
        monthId: incomes.monthId,
        amount: incomes.amount,
        isBaseSalary: incomes.isBaseSalary,
        isClosed: months.isClosed,
      })
      .from(incomes)
      .innerJoin(months, eq(incomes.monthId, months.id))
      .where(
        and(eq(incomes.id, parsed.data.incomeId), eq(incomes.userId, userId))
      )
      .limit(1);

    if (!existingIncome) {
      return {
        success: false,
        error: "Catatan pemasukan tidak ditemukan atau bukan milik akun Anda.",
      };
    }

    if (existingIncome.isClosed) {
      return {
        success: false,
        error:
          "Tidak dapat mengubah catatan pemasukan pada bulan yang telah ditutup (arsip).",
      };
    }

    if (parsed.data.isBaseSalary === true && !existingIncome.isBaseSalary) {
      const [otherBaseSalary] = await db
        .select({ id: incomes.id })
        .from(incomes)
        .where(
          and(
            eq(incomes.monthId, existingIncome.monthId),
            eq(incomes.userId, userId),
            eq(incomes.isBaseSalary, true)
          )
        )
        .limit(1);

      if (otherBaseSalary) {
        return {
          success: false,
          error: "Siklus bulan ini sudah memiliki gaji pokok lain yang aktif.",
        };
      }
    }

    // Invarian SC-06: Shock Deficit Guard saat nominal pemasukan dikurangi
    if (
      parsed.data.amount !== undefined &&
      parsed.data.amount < existingIncome.amount
    ) {
      const { hasDeficit, shockDeficit } = await checkShockDeficit({
        userId,
        monthId: existingIncome.monthId,
        targetIncomeId: parsed.data.incomeId,
        nextAmount: parsed.data.amount,
      });

      if (hasDeficit && !parsed.data.allowDeficit) {
        return {
          success: false,
          error: `Pemasukan ini telah terpakai untuk belanja. Mengurangi nominalnya akan menyebabkan defisit anggaran sebesar -Rp ${shockDeficit.toLocaleString("id-ID")}. Harap konfirmasi untuk melanjutkan.`,
          fieldErrors: {
            allowDeficit: [`SHOCK_DEFICIT:${shockDeficit}`],
          },
        };
      }
    }

    const updateData: Partial<typeof incomes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.source !== undefined) updateData.source = parsed.data.source;
    if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount;
    if (parsed.data.date !== undefined) updateData.date = parsed.data.date;
    if (parsed.data.isBaseSalary !== undefined)
      updateData.isBaseSalary = parsed.data.isBaseSalary;

    const [updatedIncome] = await db
      .update(incomes)
      .set(updateData)
      .where(
        and(eq(incomes.id, parsed.data.incomeId), eq(incomes.userId, userId))
      )
      .returning();

    revalidateDashboardRoutes();

    return {
      success: true,
      data: updatedIncome,
    };
  } catch (error) {
    console.error("Gagal memperbarui catatan pemasukan:", error);
    return {
      success: false,
      error: "Terjadi kesalahan internal saat memperbarui data pemasukan.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. SERVER ACTION: deleteIncome
   ══════════════════════════════════════════════════════════════════════════════ */

export async function deleteIncome(
  inputOrId: string | DeleteIncomeInput,
  explicitUserId?: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const rawPayload =
      typeof inputOrId === "string" ? { incomeId: inputOrId } : inputOrId;

    const parsed = deleteIncomeSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "Validasi ID pemasukan gagal.",
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

    const [existingIncome] = await db
      .select({
        id: incomes.id,
        monthId: incomes.monthId,
        amount: incomes.amount,
        isBaseSalary: incomes.isBaseSalary,
        isClosed: months.isClosed,
      })
      .from(incomes)
      .innerJoin(months, eq(incomes.monthId, months.id))
      .where(
        and(eq(incomes.id, parsed.data.incomeId), eq(incomes.userId, userId))
      )
      .limit(1);

    if (!existingIncome) {
      return {
        success: false,
        error: "Catatan pemasukan tidak ditemukan.",
      };
    }

    if (existingIncome.isClosed) {
      return {
        success: false,
        error:
          "Tidak dapat menghapus pemasukan pada bulan yang telah ditutup (arsip).",
      };
    }

    // Invarian R10: Gaji pokok bulan aktif tidak dapat dihapus (hanya bisa diubah nominalnya)
    if (existingIncome.isBaseSalary) {
      return {
        success: false,
        error:
          "Gaji pokok tidak dapat dihapus. Silakan ubah nominalnya apabila terdapat penyesuaian.",
      };
    }

    // Invarian SC-06: Shock Deficit Guard saat pemasukan dihapus
    const { hasDeficit, shockDeficit } = await checkShockDeficit({
      userId,
      monthId: existingIncome.monthId,
      targetIncomeId: parsed.data.incomeId,
      nextAmount: undefined,
    });

    if (hasDeficit && !parsed.data.allowDeficit) {
      return {
        success: false,
        error: `Pemasukan ini telah terpakai untuk belanja. Menghapusnya akan menyebabkan defisit anggaran sebesar -Rp ${shockDeficit.toLocaleString("id-ID")}. Harap konfirmasi jika Anda tetap ingin melanjutkan.`,
        fieldErrors: {
          allowDeficit: [`SHOCK_DEFICIT:${shockDeficit}`],
        },
      };
    }

    await db
      .delete(incomes)
      .where(
        and(eq(incomes.id, parsed.data.incomeId), eq(incomes.userId, userId))
      );

    revalidateDashboardRoutes();

    return {
      success: true,
      data: { id: parsed.data.incomeId },
    };
  } catch (error) {
    console.error("Gagal menghapus catatan pemasukan:", error);
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat menghapus catatan pemasukan.",
    };
  }
}
