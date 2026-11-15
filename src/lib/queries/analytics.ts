/**
 * ==============================================================================
 * Kenzo Treasury — Database Queries: Financial Analytics & Aggregation (Fase B12)
 * ==============================================================================
 */

import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  months,
  incomes,
  budgetCategories,
  transactions,
} from "@/db/schema";
import {
  calculateNetCashflow,
  calculateSavingsRate,
} from "@/lib/financial-calculations";
import { INDONESIAN_MONTH_NAMES } from "@/lib/month-generator";
import { resolveAuthenticatedUserId } from "./months";
import type {
  ActionResponse,
  SavingsGrowthPoint,
  MonthlyCashflowPoint,
  YearlyComparisonItem,
  CategoryDistributionItem,
  AnalyticsDashboardData,
} from "@/types";

const SHORT_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

/**
 * Mengambil tren pertumbuhan tabungan bulanan (akumulasi net savings) dalam satu tahun.
 */
export async function getSavingsGrowthTrend(
  userId?: string,
  year?: number
): Promise<ActionResponse<SavingsGrowthPoint[]>> {
  const cashflowRes = await getMonthlyCashflowSummary(userId, year);
  if (!cashflowRes.success) {
    return {
      success: false,
      error: cashflowRes.error,
    };
  }

  let runningCumulative = 0;
  const points: SavingsGrowthPoint[] = cashflowRes.data.map((pt) => {
    const positiveSurplus = Math.max(0, pt.netSavings);
    runningCumulative += positiveSurplus;
    return {
      monthId: pt.monthId,
      monthName: pt.monthName,
      shortMonth: pt.shortMonth,
      year: pt.year,
      monthIndex: pt.monthIndex,
      netSavings: pt.netSavings,
      cumulativeSavings: runningCumulative,
      savingsRate: pt.savingsRate,
    };
  });

  return {
    success: true,
    data: points,
  };
}

/**
 * Mengambil ringkasan cashflow bulanan (Pemasukan, Pengeluaran, Tabungan Bersih) dalam satu tahun.
 */
export async function getMonthlyCashflowSummary(
  userId?: string,
  year?: number
): Promise<ActionResponse<MonthlyCashflowPoint[]>> {
  const resolvedUserId = await resolveAuthenticatedUserId(userId);
  if (!resolvedUserId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi.",
    };
  }

  const targetYear = year ?? new Date().getFullYear();

  try {
    const userMonths = await db
      .select()
      .from(months)
      .where(and(eq(months.userId, resolvedUserId), eq(months.year, targetYear)))
      .orderBy(asc(months.monthIndex));

    if (userMonths.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const monthIds = userMonths.map((m) => m.id);

    const [allIncomes, allCategories, allTx] = await Promise.all([
      db
        .select()
        .from(incomes)
        .where(
          and(
            eq(incomes.userId, resolvedUserId),
            inArray(incomes.monthId, monthIds)
          )
        ),
      db
        .select()
        .from(budgetCategories)
        .where(inArray(budgetCategories.monthId, monthIds)),
      db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, resolvedUserId),
            eq(transactions.isDeleted, false)
          )
        ),
    ]);

    const catToMonthMap = new Map<string, string>();
    for (const c of allCategories) {
      catToMonthMap.set(c.id, c.monthId);
    }

    const incomeByMonth = new Map<string, number>();
    for (const inc of allIncomes) {
      incomeByMonth.set(
        inc.monthId,
        (incomeByMonth.get(inc.monthId) ?? 0) + inc.amount
      );
    }

    const expenseByMonth = new Map<string, number>();
    for (const tx of allTx) {
      const mId = catToMonthMap.get(tx.categoryId);
      if (mId) {
        expenseByMonth.set(mId, (expenseByMonth.get(mId) ?? 0) + tx.amount);
      }
    }

    const points: MonthlyCashflowPoint[] = userMonths.map((m) => {
      const inc = incomeByMonth.get(m.id) ?? 0;
      const exp = expenseByMonth.get(m.id) ?? 0;
      const net = calculateNetCashflow(inc, exp);
      const rate = calculateSavingsRate(inc, net);
      const shortMonth =
        SHORT_MONTH_LABELS[m.monthIndex - 1] ??
        INDONESIAN_MONTH_NAMES[m.monthIndex - 1]?.slice(0, 3) ??
        "Bln";

      return {
        monthId: m.id,
        monthName: m.name,
        shortMonth,
        year: m.year,
        monthIndex: m.monthIndex,
        income: inc,
        expense: exp,
        netSavings: net,
        savingsRate: rate,
      };
    });

    return {
      success: true,
      data: points,
    };
  } catch (err) {
    console.error("Gagal memuat ringkasan cashflow bulanan:", err);
    return {
      success: false,
      error: "Gagal memuat ringkasan cashflow bulanan.",
    };
  }
}

/**
 * Mengambil perbandingan performa finansial antar-tahun (misal 2026 vs 2027).
 */
export async function getYearlyComparison(
  userId?: string
): Promise<ActionResponse<YearlyComparisonItem[]>> {
  const resolvedUserId = await resolveAuthenticatedUserId(userId);
  if (!resolvedUserId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi.",
    };
  }

  try {
    const userMonths = await db
      .select()
      .from(months)
      .where(eq(months.userId, resolvedUserId))
      .orderBy(asc(months.year), asc(months.monthIndex));

    if (userMonths.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const monthIds = userMonths.map((m) => m.id);
    const [allIncomes, allCategories, allTx] = await Promise.all([
      db
        .select()
        .from(incomes)
        .where(
          and(
            eq(incomes.userId, resolvedUserId),
            inArray(incomes.monthId, monthIds)
          )
        ),
      db
        .select()
        .from(budgetCategories)
        .where(inArray(budgetCategories.monthId, monthIds)),
      db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, resolvedUserId),
            eq(transactions.isDeleted, false)
          )
        ),
    ]);

    const monthToYear = new Map<string, number>();
    const monthsPerYear = new Map<number, number>();
    for (const m of userMonths) {
      monthToYear.set(m.id, m.year);
      monthsPerYear.set(m.year, (monthsPerYear.get(m.year) ?? 0) + 1);
    }

    const catToYear = new Map<string, number>();
    for (const c of allCategories) {
      const y = monthToYear.get(c.monthId);
      if (y !== undefined) {
        catToYear.set(c.id, y);
      }
    }

    const incomePerYear = new Map<number, number>();
    for (const inc of allIncomes) {
      const y = monthToYear.get(inc.monthId);
      if (y !== undefined) {
        incomePerYear.set(y, (incomePerYear.get(y) ?? 0) + inc.amount);
      }
    }

    const expensePerYear = new Map<number, number>();
    for (const tx of allTx) {
      const y = catToYear.get(tx.categoryId);
      if (y !== undefined) {
        expensePerYear.set(y, (expensePerYear.get(y) ?? 0) + tx.amount);
      }
    }

    const years = Array.from(monthsPerYear.keys()).sort((a, b) => a - b);
    const items: YearlyComparisonItem[] = years.map((yr) => {
      const totalIncome = incomePerYear.get(yr) ?? 0;
      const totalExpense = expensePerYear.get(yr) ?? 0;
      const totalNetSavings = calculateNetCashflow(totalIncome, totalExpense);
      const averageSavingsRate = calculateSavingsRate(
        totalIncome,
        totalNetSavings
      );

      return {
        year: yr,
        totalIncome,
        totalExpense,
        totalNetSavings,
        averageSavingsRate,
        monthsCount: monthsPerYear.get(yr) ?? 0,
      };
    });

    return {
      success: true,
      data: items,
    };
  } catch (err) {
    console.error("Gagal memuat perbandingan tahunan:", err);
    return {
      success: false,
      error: "Gagal memuat data perbandingan tahunan.",
    };
  }
}

/**
 * Mengambil distribusi pengeluaran per pos kategori untuk bulan tertentu (atau bulan aktif terbaru).
 */
export async function getCategoryExpenseDistribution(
  monthId?: string,
  userId?: string
): Promise<ActionResponse<CategoryDistributionItem[]>> {
  const resolvedUserId = await resolveAuthenticatedUserId(userId);
  if (!resolvedUserId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi.",
    };
  }

  try {
    let targetMonthId = monthId;
    if (!targetMonthId) {
      const [latestMonth] = await db
        .select({ id: months.id })
        .from(months)
        .where(eq(months.userId, resolvedUserId))
        .orderBy(desc(months.year), desc(months.monthIndex))
        .limit(1);

      if (!latestMonth) {
        return {
          success: true,
          data: [],
        };
      }
      targetMonthId = latestMonth.id;
    }

    const categoriesList = await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.monthId, targetMonthId))
      .orderBy(asc(budgetCategories.sortOrder));

    if (categoriesList.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const categoryIds = categoriesList.map((c) => c.id);
    const txRows = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, resolvedUserId),
          inArray(transactions.categoryId, categoryIds),
          eq(transactions.isDeleted, false)
        )
      );

    const spentByCat = new Map<string, number>();
    let grandTotalSpent = 0;
    for (const tx of txRows) {
      spentByCat.set(
        tx.categoryId,
        (spentByCat.get(tx.categoryId) ?? 0) + tx.amount
      );
      grandTotalSpent += tx.amount;
    }

    const items: CategoryDistributionItem[] = categoriesList.map((cat) => {
      const amount = spentByCat.get(cat.id) ?? 0;
      const percentageOfTotal =
        grandTotalSpent > 0 ? Math.round((amount / grandTotalSpent) * 100) : 0;

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        icon: cat.icon ?? "wallet",
        group: cat.group,
        amount,
        target: cat.targetBudget,
        percentageOfTotal,
      };
    });

    return {
      success: true,
      data: items,
    };
  } catch (err) {
    console.error("Gagal memuat distribusi pengeluaran kategori:", err);
    return {
      success: false,
      error: "Gagal memuat distribusi pengeluaran per kategori.",
    };
  }
}

/**
 * Mengambil bundel lengkap data analitik untuk halaman AnalyticsDashboard.
 */
export async function getAnalyticsDashboardData(
  userId?: string,
  year?: number
): Promise<ActionResponse<AnalyticsDashboardData>> {
  const resolvedUserId = await resolveAuthenticatedUserId(userId);
  if (!resolvedUserId) {
    return {
      success: false,
      error: "Pengguna tidak terautentikasi.",
    };
  }

  const currentYear = year ?? new Date().getFullYear();

  const [cashflowRes, yearlyRes, categoryDistRes] = await Promise.all([
    getMonthlyCashflowSummary(resolvedUserId, currentYear),
    getYearlyComparison(resolvedUserId),
    getCategoryExpenseDistribution(undefined, resolvedUserId),
  ]);

  if (!cashflowRes.success || !yearlyRes.success || !categoryDistRes.success) {
    return {
      success: false,
      error: "Gagal memuat sebagian data analitik finansial.",
    };
  }

  let runningCumulative = 0;
  const savingsGrowth: SavingsGrowthPoint[] = cashflowRes.data.map((pt) => {
    runningCumulative += Math.max(0, pt.netSavings);
    return {
      monthId: pt.monthId,
      monthName: pt.monthName,
      shortMonth: pt.shortMonth,
      year: pt.year,
      monthIndex: pt.monthIndex,
      netSavings: pt.netSavings,
      cumulativeSavings: runningCumulative,
      savingsRate: pt.savingsRate,
    };
  });

  const availableYearsSet = new Set<number>([
    currentYear,
    currentYear + 1,
    ...yearlyRes.data.map((y) => y.year),
  ]);
  const availableYears = Array.from(availableYearsSet).sort((a, b) => a - b);

  return {
    success: true,
    data: {
      selectedYear: currentYear,
      availableYears,
      savingsGrowth,
      monthlyCashflow: cashflowRes.data,
      yearlyComparison: yearlyRes.data,
      categoryDistribution: categoryDistRes.data,
    },
  };
}
