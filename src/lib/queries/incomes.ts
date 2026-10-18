/**
 * ==============================================================================
 * Kenzo Treasury — Database Queries: Income Data Access Layer (Read-Only)
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mengisolasi operasi pembacaan data pemasukan (queries) dari Server Actions mutasi.
 * Mengikuti prinsip Next.js App Router dan Clean Page Architecture: fungsi query
 * read-only dapat dikonsumsi langsung oleh React Server Components tanpa RPC overhead.
 */

import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { months, incomes } from "@/db/schema";
import { resolveAuthenticatedUserId } from "@/lib/queries/months";
import type { Income, MonthlyIncomesSummary, ActionResponse } from "@/types";

/* ══════════════════════════════════════════════════════════════════════════════
   1. QUERY: getMonthlyIncomes
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Mengambil seluruh data pemasukan pada bulan tertentu beserta rekapitulasi agregat:
 * - `totalIncome`: Total nominal seluruh pemasukan dalam bulan berjalan.
 * - `baseSalary`: Nominal pemasukan gaji pokok rutin (`isBaseSalary = true`).
 * - `additionalIncomes`: Akumulasi pemasukan sampingan/freelance (`isBaseSalary = false`).
 * - `incomeCount`: Jumlah entri transaksi pemasukan.
 *
 * @param monthId ID UUID siklus bulan yang ingin dibaca.
 * @param explicitUserId ID pengguna eksplisit (berguna untuk testing atau impersonation aman).
 */
export async function getMonthlyIncomes(
  monthId: string,
  explicitUserId?: string
): Promise<ActionResponse<MonthlyIncomesSummary>> {
  try {
    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi. Silakan login terlebih dahulu.",
      };
    }

    if (!monthId) {
      return {
        success: false,
        error: "ID bulan wajib disertakan.",
      };
    }

    // 1. Verifikasi kepemilikan bulan oleh user
    const [monthRecord] = await db
      .select({ id: months.id })
      .from(months)
      .where(and(eq(months.id, monthId), eq(months.userId, userId)))
      .limit(1);

    if (!monthRecord) {
      return {
        success: false,
        error: "Data siklus bulan tidak ditemukan atau bukan milik pengguna ini.",
      };
    }

    // 2. Query seluruh catatan pemasukan terurut berdasarkan tanggal dan tanggal pencatatan
    const incomeRecords = await db
      .select()
      .from(incomes)
      .where(and(eq(incomes.monthId, monthId), eq(incomes.userId, userId)))
      .orderBy(asc(incomes.date), asc(incomes.createdAt));

    // 3. Agregasi total pemasukan secara akurat (integer Rupiah)
    let totalIncome = 0;
    let baseSalary = 0;
    let additionalIncomes = 0;

    for (const record of incomeRecords) {
      totalIncome += record.amount;
      if (record.isBaseSalary) {
        baseSalary += record.amount;
      } else {
        additionalIncomes += record.amount;
      }
    }

    return {
      success: true,
      data: {
        monthId,
        incomes: incomeRecords,
        totalIncome,
        baseSalary,
        additionalIncomes,
        incomeCount: incomeRecords.length,
      },
    };
  } catch (error) {
    console.error("Gagal membaca data pemasukan bulanan:", error);
    return {
      success: false,
      error: "Terjadi kesalahan internal saat membaca data pemasukan bulanan.",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. QUERY: getIncomeById
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Mengambil satu entri catatan pemasukan spesifik berdasarkan ID dengan validasi kepemilikan.
 */
export async function getIncomeById(
  incomeId: string,
  explicitUserId?: string
): Promise<ActionResponse<Income>> {
  try {
    const userId = await resolveAuthenticatedUserId(explicitUserId);
    if (!userId) {
      return {
        success: false,
        error: "Pengguna tidak terautentikasi.",
      };
    }

    const [incomeRecord] = await db
      .select()
      .from(incomes)
      .where(and(eq(incomes.id, incomeId), eq(incomes.userId, userId)))
      .limit(1);

    if (!incomeRecord) {
      return {
        success: false,
        error: "Catatan pemasukan tidak ditemukan.",
      };
    }

    return {
      success: true,
      data: incomeRecord,
    };
  } catch (error) {
    console.error("Gagal membaca catatan pemasukan:", error);
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat mencari catatan pemasukan.",
    };
  }
}
