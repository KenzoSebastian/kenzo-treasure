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
  param3?: number,
  explicitAllowUnclosed?: boolean
): Promise<
  ActionResponse<{ monthId: string; name: string; categoriesCreated: number }>
> {
  let userId: string | null = null;
  let year: number;
  let monthIndex: number;
  let explicitBaseSalary: number | undefined;
  let customName: string | undefined;
  let allowUnclosedPrevious = false;

  if (typeof param1 === "string") {
    userId = param1;
    year = param2!;
    monthIndex = param3!;
    allowUnclosedPrevious = Boolean(explicitAllowUnclosed);
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
    allowUnclosedPrevious = Boolean(parsed.data.allowUnclosedPrevious);
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

    // Invarian SC-13: Periksa apakah ada siklus bulan aktif yang belum ditutup buku
    if (!allowUnclosedPrevious) {
      const [unclosedMonth] = await db
        .select({
          id: months.id,
          name: months.name,
          monthIndex: months.monthIndex,
          year: months.year,
        })
        .from(months)
        .where(
          and(
            eq(months.userId, resolvedUserId),
            eq(months.isClosed, false)
          )
        )
        .limit(1);

      if (unclosedMonth) {
        return {
          success: false,
          error: `Siklus "${unclosedMonth.name}" belum ditutup buku. Tutup buku bulan tersebut terlebih dahulu agar saldo disapu ke tabungan, atau konfirmasi untuk tetap membuat bulan baru.`,
        };
      }
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
  input: string | CloseMonthInput,
  explicitUserId?: string
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
  const resolvedUserId = await resolveAuthenticatedUserId(explicitUserId);
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

    // Opsi 1 (SC-14): Surplus kas riil disapu dari (Total Pemasukan - Total Pengeluaran Kas).
    // Pos wajib / kebutuhan yang belum dibelanjakan (kas keluar = 0) tidak menguap,
    // melainkan diakui sebagai sisa uang kas fisik yang disapu ke Tabungan Bebas.
    const netCashSurplus = Math.max(
      0,
      monthDetail.data.totalIncome - monthDetail.data.totalSpent
    );
    const sweptAmount = calculateMonthSweep(netCashSurplus);

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
          sweptAmount:
            sweptAmount > 0 && surplusAction === "sweep_to_savings"
              ? sweptAmount
              : 0,
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
   3. SERVER ACTION: reopenMonth (Anti-Double Counting & Reversal Reopen)
   ══════════════════════════════════════════════════════════════════════════════ */

export async function reopenMonth(
  input: string | ReopenMonthInput,
  explicitUserId?: string
): Promise<
  ActionResponse<{
    monthId: string;
    isClosed: boolean;
    reversedSweptAmount: number;
  }>
> {
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
  const resolvedUserId = await resolveAuthenticatedUserId(explicitUserId);
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

    const previousSwept = targetMonth.sweptAmount ?? 0;

    await db.transaction(async (tx) => {
      // 1. Jika ada nominal yang disapu saat tutup buku sebelumnya, lakukan reversal dari Tabungan Bebas
      if (previousSwept > 0) {
        const [savingsRow] = await tx
          .select()
          .from(savingsAccount)
          .where(eq(savingsAccount.userId, resolvedUserId))
          .for("update")
          .limit(1);

        const currentSavings = savingsRow?.balance ?? 0;

        // Anti-Defisit Guard:
        // Cek apakah saldo tabungan bebas mencukupi untuk ditarik kembali
        if (currentSavings < previousSwept) {
          throw new Error("INSUFFICIENT_SAVINGS_FOR_REOPEN");
        }

        // Potong kembali saldo tabungan bebas sebesar previousSwept
        await tx
          .update(savingsAccount)
          .set({
            balance: currentSavings - previousSwept,
            updatedAt: new Date(),
          })
          .where(eq(savingsAccount.userId, resolvedUserId));
      }

      // 2. Buka kembali siklus bulan dan reset sweptAmount ke 0
      await tx
        .update(months)
        .set({
          isClosed: false,
          sweptAmount: 0,
          updatedAt: new Date(),
        })
        .where(eq(months.id, monthId));
    });

    revalidateDashboardRoutes();
    return {
      success: true,
      data: {
        monthId,
        isClosed: false,
        reversedSweptAmount: previousSwept,
      },
    };
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message === "INSUFFICIENT_SAVINGS_FOR_REOPEN"
    ) {
      return {
        success: false,
        error:
          "Saldo tabungan bebas tidak mencukupi untuk menarik kembali saldo sweep dari tutup buku sebelumnya (kemungkinan sebagian dana sudah dialokasikan ke Wishlist atau Dana Darurat). Silakan tarik kembali dana ke tabungan bebas terlebih dahulu.",
      };
    }
    console.error("Gagal membuka kembali bulan:", err);
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat membuka kembali siklus bulan.",
    };
  }
}
