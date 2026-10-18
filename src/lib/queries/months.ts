/**
 * ==============================================================================
 * Kenzo Treasury — Database Queries: Month Data Access Layer (Read-Only)
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mengisolasi seluruh operasi pembacaan (queries) siklus bulan dari Server Actions.
 * Mengikuti prinsip Next.js App Router: fungsi pembacaan data dapat dikonsumsi
 * langsung oleh React Server Components tanpa overhead Server Action RPC.
 */

import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  months,
  incomes,
  budgetCategories,
  liabilities,
  transactions,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  calculateRemainingBudget,
  getBudgetStatus,
  calculateNetCashflow,
  calculateDynamicFreedomBuffer,
} from "@/lib/financial-calculations";
import type {
  MonthSummary,
  CategoryDetailItem,
  MonthlyCycleDetail,
} from "@/types/month";
import type { ActionResponse } from "@/types";

/* ══════════════════════════════════════════════════════════════════════════════
   HELPER INTERNAL: RESOLUSI PENGGUNA TERAUTENTIKASI
   ══════════════════════════════════════════════════════════════════════════════ */

export async function resolveAuthenticatedUserId(
  explicitUserId?: string
): Promise<string | null> {
  if (explicitUserId) {
    return explicitUserId;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user.id;
  } catch (err) {
    console.error("Gagal verifikasi sesi Supabase Auth:", err);
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   1. QUERY: getActiveMonth
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Mengambil lembar kerja bulan aktif (`isClosed = false`) beserta seluruh
 * agregasi pemasukan, pos anggaran, transaksi terpakai, sisa, dan status kesehatan.
 */
export async function getActiveMonth(
  explicitUserId?: string
): Promise<ActionResponse<MonthlyCycleDetail | null>> {
  const resolvedUserId = await resolveAuthenticatedUserId(explicitUserId);
  if (!resolvedUserId) {
    return {
      success: false,
      error: "Sesi tidak valid. Pengguna wajib login terlebih dahulu.",
    };
  }

  try {
    // 1. Ambil record bulan aktif paling mutakhir
    const [activeMonth] = await db
      .select()
      .from(months)
      .where(and(eq(months.userId, resolvedUserId), eq(months.isClosed, false)))
      .orderBy(desc(months.year), desc(months.monthIndex))
      .limit(1);

    if (!activeMonth) {
      // Jika tidak ada bulan aktif yang terbuka, cari bulan terbaru yang ada
      const [latestMonth] = await db
        .select()
        .from(months)
        .where(eq(months.userId, resolvedUserId))
        .orderBy(desc(months.year), desc(months.monthIndex))
        .limit(1);

      if (!latestMonth) {
        return {
          success: true,
          data: null,
        };
      }
      return getMonthDetailById(latestMonth.id, resolvedUserId);
    }

    return getMonthDetailById(activeMonth.id, resolvedUserId);
  } catch (err: unknown) {
    console.error("Gagal mengambil bulan aktif:", err);
    return {
      success: false,
      error: "Gagal memuat lembar kerja bulan aktif",
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. QUERY: getMonthDetailById
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Mengambil detail lengkap siklus bulan berdasarkan ID beserta kalkulasi otoritatif.
 */
export async function getMonthDetailById(
  monthId: string,
  userId: string
): Promise<ActionResponse<MonthlyCycleDetail>> {
  const [targetMonth] = await db
    .select()
    .from(months)
    .where(and(eq(months.id, monthId), eq(months.userId, userId)))
    .limit(1);

  if (!targetMonth) {
    return {
      success: false,
      error: "Siklus bulan tidak ditemukan",
    };
  }

  // 1. Ambil seluruh pemasukan bulan ini
  const monthIncomes = await db
    .select()
    .from(incomes)
    .where(eq(incomes.monthId, monthId))
    .orderBy(asc(incomes.date));

  // 2. Ambil seluruh pos anggaran bulan ini
  const categoriesList = await db
    .select()
    .from(budgetCategories)
    .where(eq(budgetCategories.monthId, monthId))
    .orderBy(asc(budgetCategories.sortOrder));

  // 3. Ambil agregasi pengeluaran per kategori dari tabel transaksi (non-deleted)
  const spentAggregations = await db
    .select({
      categoryId: transactions.categoryId,
      totalSpent: sql<number>`cast(coalesce(sum(${transactions.amount}), 0) as int)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.isDeleted, false)
      )
    )
    .groupBy(transactions.categoryId);

  const spentMap = new Map<string, number>();
  for (const item of spentAggregations) {
    spentMap.set(item.categoryId, item.totalSpent);
  }

  // 4. Ambil liabilities jika ada pos yang ditautkan ke cicilan
  const liabilityIds = categoriesList
    .map((c) => c.liabilityId)
    .filter((id): id is string => id !== null);

  const liabilitiesMap = new Map<
    string,
    {
      id: string;
      name: string;
      totalAmount: number;
      paidAmount: number;
      monthlyPayment: number;
      isSettled: boolean;
    }
  >();

  if (liabilityIds.length > 0) {
    const matchedLiabilities = await db
      .select({
        id: liabilities.id,
        name: liabilities.name,
        totalAmount: liabilities.totalAmount,
        paidAmount: liabilities.paidAmount,
        monthlyPayment: liabilities.monthlyPayment,
        isSettled: liabilities.isSettled,
      })
      .from(liabilities)
      .where(eq(liabilities.userId, userId));

    for (const l of matchedLiabilities) {
      liabilitiesMap.set(l.id, l);
    }
  }

  // 5. Hitung total pemasukan dan Dynamic Freedom Buffer (Opsi A)
  let totalIncome = 0;
  let additionalIncomesSum = 0;

  for (const inc of monthIncomes) {
    totalIncome += inc.amount;
    if (!inc.isBaseSalary) {
      additionalIncomesSum += inc.amount;
    }
  }

  // 6. Bentuk CategoryDetailItem teragregasi
  let totalBudget = 0;
  let totalSpent = 0;

  const enrichedCategories: CategoryDetailItem[] = categoriesList.map((cat) => {
    let effectiveTarget = cat.targetBudget;

    // Terapkan Dynamic Freedom Buffer untuk pos uang bebas
    if (cat.group === "uang_bebas_tabungan" && additionalIncomesSum > 0) {
      effectiveTarget = calculateDynamicFreedomBuffer(cat.targetBudget, additionalIncomesSum);
    }

    const spent = spentMap.get(cat.id) ?? 0;
    const remaining = calculateRemainingBudget(effectiveTarget, spent);
    const status = getBudgetStatus(effectiveTarget, spent);

    totalBudget += effectiveTarget;
    totalSpent += spent;

    return {
      id: cat.id,
      monthId: cat.monthId,
      liabilityId: cat.liabilityId,
      name: cat.name,
      icon: cat.icon,
      group: cat.group,
      targetBudget: effectiveTarget,
      spentAmount: spent,
      remainingBudget: remaining,
      status,
      isTemporary: cat.isTemporary,
      sortOrder: cat.sortOrder,
      liability: cat.liabilityId ? liabilitiesMap.get(cat.liabilityId) ?? null : null,
    };
  });

  const netCashflow = calculateNetCashflow(totalIncome, totalSpent);

  return {
    success: true,
    data: {
      ...targetMonth,
      incomes: monthIncomes,
      categories: enrichedCategories,
      totalIncome,
      totalBudget,
      totalSpent,
      netCashflow,
    },
  };
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. QUERY: getAllMonths
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Mengambil daftar ringkasan seluruh siklus bulan milik pengguna untuk
 * navigasi dropdown selector atau arsip historis.
 */
export async function getAllMonths(
  explicitUserId?: string
): Promise<ActionResponse<MonthSummary[]>> {
  const resolvedUserId = await resolveAuthenticatedUserId(explicitUserId);
  if (!resolvedUserId) {
    return {
      success: false,
      error: "Sesi tidak valid. Pengguna wajib login terlebih dahulu.",
    };
  }

  try {
    const list = await db
      .select()
      .from(months)
      .where(eq(months.userId, resolvedUserId))
      .orderBy(desc(months.year), desc(months.monthIndex));

    return {
      success: true,
      data: list,
    };
  } catch (err: unknown) {
    console.error("Gagal mengambil daftar riwayat bulan:", err);
    return {
      success: false,
      error: "Gagal memuat daftar riwayat bulan",
    };
  }
}
