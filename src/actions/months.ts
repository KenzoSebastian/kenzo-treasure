"use server";

/**
 * ==============================================================================
 * Kenzo Treasury — Server Actions: Month Lifecycle Mutations
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mengelola seluruh operasi mutasi (Server Actions) siklus bulan:
 * 1. `createMonthlyCycle`: Membuat bulan baru, generate gaji pokok default,
 *    dan memanggil generator pos anggaran terisolasi dari domain service.
 * 2. `closeMonth`: Menutup siklus bulan aktif dan mengeksekusi Automatic Savings Sweep
 *    (memindahkan sisa kuota uang bebas ke saldo tabungan).
 * 3. `reopenMonth`: Membuka kembali bulan yang telah ditutup untuk koreksi catatan.
 *
 * Catatan Arsitektur:
 * Operasi pembacaan data (queries) diisolasi di `src/lib/queries/months.ts` dan logika
 * generator pos dinamis diisolasi di `src/lib/month-generator.ts`.
 */

import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { months, incomes, savingsAccount } from "@/db/schema";
import {
  createMonthSchema,
  closeMonthSchema,
  reopenMonthSchema,
  type CreateMonthInput,
  type CloseMonthInput,
  type ReopenMonthInput,
} from "@/schemas/month.schema";
import { calculateMonthSweep } from "@/lib/financial-calculations";
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
import type { ActionResponse } from "@/types";

// Re-export query functions untuk kemudahan import caller
export { getActiveMonth, getAllMonths };

/* ══════════════════════════════════════════════════════════════════════════════
   1. SERVER ACTION: createMonthlyCycle
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Membuat siklus bulan baru dengan Zero-Based Budgeting:
 * - Mendukung pemanggilan fleksibel: `createMonthlyCycle(userId, year, monthIndex)`
 *   atau `createMonthlyCycle(input, targetUserId)`.
 * - Memanggil `generateMonthCategories` yang 100% dinamis membaca cicilan dari DB
 *   atau mewarisi pos anggaran dari bulan sebelumnya di DB.
 */
export async function createMonthlyCycle(
  param1: string | CreateMonthInput,
  param2?: number,
  param3?: number
): Promise<ActionResponse<{ monthId: string; name: string; categoriesCreated: number }>> {
  let userId: string | null = null;
  let year: number;
  let monthIndex: number;
  let baseSalary = DEFAULT_BASE_SALARY;
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
        error: parsed.error.issues[0]?.message ?? "Input pembuatan bulan tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    year = parsed.data.year;
    monthIndex = parsed.data.monthIndex;
    baseSalary = parsed.data.baseSalary;
    customName = parsed.data.name;
  }

  // Resolusi ID user terautentikasi
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
    // 1. Cek apakah siklus bulan untuk (userId, year, monthIndex) sudah ada di DB
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

    // 2. Eksekusi transaksi atomik database
    const result = await db.transaction(async (tx) => {
      // Pastikan akun tabungan terinisialisasi
      await tx
        .insert(savingsAccount)
        .values({
          userId: resolvedUserId,
          balance: 0,
          emergencyFundTarget: 18000000,
          emergencyFundBalance: 0,
        })
        .onConflictDoNothing();

      // 3. Buat baris bulan di tabel `months`
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

      // 4. Buat baris gaji pokok di tabel `incomes`
      const firstDayOfMonth = `${year}-${String(monthIndex).padStart(2, "0")}-01`;
      await tx.insert(incomes).values({
        monthId: newMonth.id,
        userId: resolvedUserId,
        source: "💵 Gaji Pokok",
        amount: baseSalary,
        date: firstDayOfMonth,
        isBaseSalary: true,
      });

      // 5. Generate pos anggaran secara dinamis dari database (liabilities & previous month)
      const { categoriesCreated } = await generateMonthCategories({
        tx,
        userId: resolvedUserId,
        newMonthId: newMonth.id,
        year,
        monthIndex,
      });

      return {
        monthId: newMonth.id,
        name: newMonth.name,
        categoriesCreated,
      };
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    console.error("Gagal membuat siklus bulanan baru:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Terjadi kesalahan sistem saat membuat bulan baru";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. SERVER ACTION: closeMonth
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Menutup lembar siklus bulan berjalan (End-of-Month Sweep):
 * - Menandai status bulan menjadi `isClosed = true`.
 * - Menghitung sisa kuota pos `uang_bebas_tabungan` yang belum terpakai.
 * - Jika surplus > 0 dan opsi `surplusAction === "sweep_to_savings"`, nominal sisa
 *   disapu bersih dan ditambahkan ke saldo tabungan bebas (`savings_account.balance`).
 */
export async function closeMonth(
  input: string | CloseMonthInput
): Promise<ActionResponse<{ monthId: string; isClosed: boolean; sweptAmount: number }>> {
  const parsed =
    typeof input === "string"
      ? closeMonthSchema.safeParse({ monthId: input })
      : closeMonthSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Input penutupan bulan tidak valid",
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

    // Ambil detail bulan untuk kalkulasi sweep
    const monthDetail = await getMonthDetailById(monthId, resolvedUserId);
    if (!monthDetail.success) {
      return {
        success: false,
        error: monthDetail.error,
      };
    }

    // Cari pos Uang Bebas / Tabungan
    const freeBudgetCategory = monthDetail.data.categories.find(
      (c) => c.group === "uang_bebas_tabungan"
    );

    const remainingFree = freeBudgetCategory ? freeBudgetCategory.remainingBudget : 0;
    const sweptAmount = calculateMonthSweep(remainingFree);

    // Jalankan mutasi atomik: update status bulan dan kredit tabungan jika ada surplus
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

    revalidatePath("/dashboard");
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

/**
 * Membuka kembali siklus bulan yang telah ditutup untuk keperluan koreksi transaksi.
 */
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
      error: parsed.error.issues[0]?.message ?? "Input pembukaan bulan tidak valid",
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

    revalidatePath("/dashboard");
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
