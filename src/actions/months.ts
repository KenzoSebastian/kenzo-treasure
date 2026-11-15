"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Month Lifecycle Mutations
 * ==============================================================================
 *
 * Mengelola seluruh operasi mutasi (Server Actions) siklus bulan:
 * 1. `createMonthlyCycle`: Membuat bulan baru, membaca `defaultBaseSalary` pengguna
 *    apabila nominal gaji pokok tidak dispesifikasikan, serta memanggil generator
 *    pos anggaran dinamis dari `src/lib/month-generator.ts`.
 * 2. `closeMonth`: Menutup siklus bulan aktif dan mengeksekusi Automatic Savings Sweep
 *    (memindahkan sisa kuota uang bebas ke saldo tabungan).
 * 3. `reopenMonth`: Membuka kembali bulan yang telah ditutup untuk koreksi catatan.
 */

import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { months, incomes, savingsAccount, users } from "@/db/schema";
import {
  createMonthSchema,
  closeMonthSchema,
  reopenMonthSchema,
  type CreateMonthInput,
  type CloseMonthInput,
  type ReopenMonthInput,
} from "@/schemas/month.schema";
import {
  calculateMonthSweep,
  DEFAULT_EMERGENCY_FUND_TARGET,
} from "@/lib/financial-calculations";
import {
  generateMonthCategories,
  INDONESIAN_MONTH_NAMES,
  DEFAULT_BASE_SALARY,
} from "@/lib/month-generator";
import {
  resolveAuthenticatedUserId,
  getMonthDetailById,
  getActiveMonth,
  getAllMonths,
} from "@/lib/queries/months";
import { revalidateDashboardRoutes } from "@/lib/revalidate";
import type { ActionResponse } from "@/types";

export { getActiveMonth, getAllMonths };

/* ══════════════════════════════════════════════════════════════════════════════
   1. SERVER ACTION: createMonthlyCycle
   ══════════════════════════════════════════════════════════════════════════════ */

export async function createMonthlyCycle(
  param1: string | CreateMonthInput,
  param2?: number,
  param3?: number
): Promise<
  ActionResponse<{ monthId: string; name: string; categoriesCreated: number }>
> {
  let userId: string | null = null;
  let year: number;
  let monthIndex: number;
  let explicitBaseSalary: number | undefined;
  let customName: string | undefined;

  if (typeof param1 === "string") {
    userId = param1;
    year = param2!;
    monthIndex = param3!;
  } else {
    const parsed = createMonthSchema.safeParse(param1);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "Input pembuatan bulan tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    year = parsed.data.year;
    monthIndex = parsed.data.monthIndex;
    explicitBaseSalary = parsed.data.baseSalary;
    customName = parsed.data.name;
  }

  const resolvedUserId = await resolveAuthenticatedUserId(userId ?? undefined);
  if (!resolvedUserId) {
    return {
      success: false,
      error: "Sesi tidak valid. Pengguna wajib login terlebih dahulu.",
    };
  }

  const monthName =
    customName ||
    `${INDONESIAN_MONTH_NAMES[monthIndex - 1] ?? "Bulan"} ${year}`;

  try {
    const existingMonth = await db
      .select({ id: months.id })
      .from(months)
      .where(
        and(
          eq(months.userId, resolvedUserId),
          eq(months.year, year),
          eq(months.monthIndex, monthIndex)
        )
      )
      .limit(1);

    if (existingMonth.length > 0) {
      return {
        success: false,
        error: `Siklus bulan untuk ${monthName} sudah pernah dibuat.`,
      };
    }

    const result = await db.transaction(async (tx) => {
      // Baca defaultBaseSalary pengguna jika baseSalary belum dispesifikasikan
      let resolvedBaseSalary = explicitBaseSalary;
      if (resolvedBaseSalary === undefined) {
        const [userRow] = await tx
          .select({ defaultBaseSalary: users.defaultBaseSalary })
          .from(users)
          .where(eq(users.id, resolvedUserId))
          .limit(1);
        resolvedBaseSalary = userRow?.defaultBaseSalary ?? DEFAULT_BASE_SALARY;
      }

      // Pastikan akun tabungan terinisialisasi dengan target netral (0)
      await tx
        .insert(savingsAccount)
        .values({
          userId: resolvedUserId,
          balance: 0,
          emergencyFundTarget: DEFAULT_EMERGENCY_FUND_TARGET,
          emergencyFundBalance: 0,
        })
        .onConflictDoNothing();

      // Buat baris bulan di tabel `months`
      const [newMonth] = await tx
        .insert(months)
        .values({
          userId: resolvedUserId,
          name: monthName,
          year,
          monthIndex,
          isClosed: false,
        })
        .returning();

      // Buat baris gaji pokok di tabel `incomes` jika nominal > 0
      const firstDayOfMonth = `${year}-${String(monthIndex).padStart(2, "0")}-01`;
      if (resolvedBaseSalary > 0) {
        await tx.insert(incomes).values({
          monthId: newMonth.id,
          userId: resolvedUserId,
          source: "Gaji Pokok",
          amount: resolvedBaseSalary,
          date: firstDayOfMonth,
          isBaseSalary: true,
        });
      }

      // Simpan gaji pokok terbaru sebagai defaultBaseSalary pengguna bila belum terisi
      if (resolvedBaseSalary > 0) {
        await tx
          .update(users)
          .set({
            defaultBaseSalary: resolvedBaseSalary,
          })
          .where(
            and(
              eq(users.id, resolvedUserId),
              sql`${users.defaultBaseSalary} IS NULL`
            )
          );
      }

      // Generate pos anggaran secara dinamis dari database (templates, liabilities & previous month)
      const { categoriesCreated } = await generateMonthCategories({
        tx,
        userId: resolvedUserId,
        newMonthId: newMonth.id,
        year,
        monthIndex,
        baseSalary: resolvedBaseSalary,
      });

      return {
        monthId: newMonth.id,
        name: newMonth.name,
        categoriesCreated,
      };
    });

    revalidateDashboardRoutes();
    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    console.error("Gagal membuat siklus bulanan baru:", err);
    const errorMessage =
      err instanceof Error
        ? err.message
        : "Terjadi kesalahan sistem saat membuat bulan baru";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. SERVER ACTION: closeMonth
   ══════════════════════════════════════════════════════════════════════════════ */

export async function closeMonth(
  input: string | CloseMonthInput
): Promise<
  ActionResponse<{ monthId: string; isClosed: boolean; sweptAmount: number }>
> {
  const parsed =
    typeof input === "string"
      ? closeMonthSchema.safeParse({ monthId: input })
      : closeMonthSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "Input penutupan bulan tidak valid",
    };
  }

  const { monthId, surplusAction } = parsed.data;
  const resolvedUserId = await resolveAuthenticatedUserId();
  if (!resolvedUserId) {
    return {
      success: false,
      error: "Sesi tidak valid. Pengguna wajib login terlebih dahulu.",
    };
  }

  try {
    const [targetMonth] = await db
      .select()
      .from(months)
      .where(and(eq(months.id, monthId), eq(months.userId, resolvedUserId)))
      .limit(1);

    if (!targetMonth) {
      return {
        success: false,
        error: "Siklus bulan tidak ditemukan atau bukan milik Anda",
      };
    }

    if (targetMonth.isClosed) {
      return {
        success: false,
        error: "Siklus bulan ini sudah ditutup sebelumnya.",
      };
    }

    const monthDetail = await getMonthDetailById(monthId, resolvedUserId);
    if (!monthDetail.success) {
      return {
        success: false,
        error: monthDetail.error,
      };
    }

    const freeBudgetCategory = monthDetail.data.categories.find(
      (c) => c.group === "uang_bebas_tabungan"
    );

    const remainingFree = freeBudgetCategory
      ? freeBudgetCategory.remainingBudget
      : 0;
    const sweptAmount = calculateMonthSweep(remainingFree);

    await db.transaction(async (tx) => {
      if (sweptAmount > 0 && surplusAction === "sweep_to_savings") {
        await tx
          .update(savingsAccount)
          .set({
            balance: sql`${savingsAccount.balance} + ${sweptAmount}`,
            updatedAt: new Date(),
          })
          .where(eq(savingsAccount.userId, resolvedUserId));
      }

      await tx
        .update(months)
        .set({
          isClosed: true,
          updatedAt: new Date(),
        })
        .where(eq(months.id, monthId));
    });

    revalidateDashboardRoutes();
    return {
      success: true,
      data: {
        monthId,
        isClosed: true,
        sweptAmount,
      },
    };
  } catch (err: unknown) {
    console.error("Gagal menutup siklus bulan:", err);
    return {
      success: false,
      error: "Terjadi kesalahan saat memproses tutup buku bulan.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. SERVER ACTION: reopenMonth
   ══════════════════════════════════════════════════════════════════════════════ */

export async function reopenMonth(
  input: string | ReopenMonthInput
): Promise<ActionResponse<{ monthId: string; isClosed: boolean }>> {
  const parsed =
    typeof input === "string"
      ? reopenMonthSchema.safeParse({ monthId: input })
      : reopenMonthSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "Input pembukaan bulan tidak valid",
    };
  }

  const { monthId } = parsed.data;
  const resolvedUserId = await resolveAuthenticatedUserId();
  if (!resolvedUserId) {
    return {
      success: false,
      error: "Sesi tidak valid. Pengguna wajib login terlebih dahulu.",
    };
  }

  try {
    const [targetMonth] = await db
      .select()
      .from(months)
      .where(and(eq(months.id, monthId), eq(months.userId, resolvedUserId)))
      .limit(1);

    if (!targetMonth) {
      return {
        success: false,
        error: "Siklus bulan tidak ditemukan",
      };
    }

    if (!targetMonth.isClosed) {
      return {
        success: false,
        error: "Siklus bulan ini memang sedang aktif/terbuka.",
      };
    }

    await db
      .update(months)
      .set({
        isClosed: false,
        updatedAt: new Date(),
      })
      .where(eq(months.id, monthId));

    revalidateDashboardRoutes();
    return {
      success: true,
      data: {
        monthId,
        isClosed: false,
      },
    };
  } catch (err: unknown) {
    console.error("Gagal membuka kembali bulan:", err);
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat membuka kembali siklus bulan.",
    };
  }
}
