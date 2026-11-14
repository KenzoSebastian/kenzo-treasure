/**
 * ==============================================================================
 * Kenzo Treasury — Google Gemini AI Client & Financial Evaluation Engine (Fase B13)
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mengisolasi inisialisasi SDK resmi `@google/genai` dan konstruksi prompt
 * evaluasi tutup buku bulanan.
 *
 * Sesuai `docs/DECISIONS-NEEDED.md` & `docs/REVIEW-AUDIT.md`:
 * - Menggunakan model Gemini yang didukung saat ini (`gemini-2.5-flash` sebagai
 *   default, dapat dikonfigurasi via `process.env.GEMINI_MODEL`).
 * - Menyediakan fallback deterministik presisi tinggi apabila `GEMINI_API_KEY`
 *   belum disetel di environment lokal, sehingga fitur evaluasi bulanan tetap
 *   berfungsi penuh tanpa melempar runtime crash.
 */

import { GoogleGenAI } from "@google/genai";
import {
  formatRupiah,
  calculateBudgetUsagePercentage,
  calculateDisciplineScore,
  calculateSavingsRate,
} from "@/lib/financial-calculations";
import type { MonthlyCycleDetail, MonthlyAiReview, CategoryReviewHighlight } from "@/types";

export const DEFAULT_GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Menghitung metrik evaluasi deterministik dari data siklus bulanan aktual.
 */
export function buildDeterministicMonthlyEvaluation(
  detail: MonthlyCycleDetail
): Omit<MonthlyAiReview, "generatedBy" | "modelUsed" | "generatedAt"> {
  const { id, name, totalIncome, totalSpent, netCashflow, categories } = detail;
  const savingsRate = calculateSavingsRate(totalIncome, netCashflow);

  const overbudgetCategories = categories.filter(
    (c) => c.status === "overbudget"
  );

  const disciplineScore = calculateDisciplineScore({
    totalCategories: categories.length,
    overbudgetCategoriesCount: overbudgetCategories.length,
    savingsRate,
  });

  let statusLabel = "Sangat Disiplin";
  if (disciplineScore < 60) {
    statusLabel = "Perlu Koreksi Kas";
  } else if (disciplineScore < 80) {
    statusLabel = "Cukup Terkendali";
  }

  // Cari pos paling hemat (target > 0, persentase penggunaan terendah)
  const activeCategoriesWithTarget = categories.filter(
    (c) => c.targetBudget > 0
  );

  let mostFrugalCategory: CategoryReviewHighlight | null = null;
  let mostOverspentCategory: CategoryReviewHighlight | null = null;

  if (activeCategoriesWithTarget.length > 0) {
    const sortedByUsageAsc = [...activeCategoriesWithTarget].sort((a, b) => {
      const pctA = calculateBudgetUsagePercentage(a.targetBudget, a.spentAmount);
      const pctB = calculateBudgetUsagePercentage(b.targetBudget, b.spentAmount);
      return pctA - pctB;
    });

    const frugal = sortedByUsageAsc[0];
    if (frugal) {
      mostFrugalCategory = {
        name: frugal.name,
        icon: frugal.icon ?? "💰",
        targetBudget: frugal.targetBudget,
        spentAmount: frugal.spentAmount,
        varianceAmount: Math.max(0, frugal.targetBudget - frugal.spentAmount),
        usagePercent: calculateBudgetUsagePercentage(
          frugal.targetBudget,
          frugal.spentAmount
        ),
      };
    }

    const sortedByUsageDesc = [...activeCategoriesWithTarget].sort((a, b) => {
      const pctA = calculateBudgetUsagePercentage(a.targetBudget, a.spentAmount);
      const pctB = calculateBudgetUsagePercentage(b.targetBudget, b.spentAmount);
      return pctB - pctA;
    });

    const highest = sortedByUsageDesc[0];
    if (highest && highest.spentAmount > 0) {
      mostOverspentCategory = {
        name: highest.name,
        icon: highest.icon ?? "⚠️",
        targetBudget: highest.targetBudget,
        spentAmount: highest.spentAmount,
        varianceAmount: Math.max(0, highest.spentAmount - highest.targetBudget),
        usagePercent: calculateBudgetUsagePercentage(
          highest.targetBudget,
          highest.spentAmount
        ),
      };
    }
  }

  const executiveSummary =
    netCashflow >= 0
      ? `Siklus ${name} mencatat surplus bersih sebesar ${formatRupiah(
          netCashflow
        )} (${savingsRate}% dari total pemasukan ${formatRupiah(
          totalIncome
        )}). Sebanyak ${
          categories.length - overbudgetCategories.length
        } dari ${categories.length} pos anggaran berhasil dijaga dalam batas kuota.`
      : `Siklus ${name} mengalami tekanan arus kas dengan defisit ${formatRupiah(
          Math.abs(netCashflow)
        )}. Total pengeluaran ${formatRupiah(
          totalSpent
        )} melampaui pemasukan ${formatRupiah(totalIncome)}.`;

  const tacticalRecommendations: string[] = [];
  if (overbudgetCategories.length > 0) {
    const names = overbudgetCategories.map((c) => c.name).join(", ");
    tacticalRecommendations.push(
      `Evaluasi ulang plafon pos yang melampaui kuota (${names}) agar tidak menggerus sisa Uang Bebas.`
    );
  } else {
    tacticalRecommendations.push(
      "Seluruh pos anggaran berada di dalam batas aman. Pertahankan pencatatan transaksi harian di bawah 5 detik."
    );
  }

  if (savingsRate >= 20) {
    tacticalRecommendations.push(
      `Rasio tabungan ${savingsRate}% sudah melampaui standar ideal 20%. Sapu surplus Uang Bebas ke Brankas Dana Darurat atau Sinking Fund Wishlist.`
    );
  } else {
    tacticalRecommendations.push(
      `Rasio tabungan saat ini ${savingsRate}%. Targetkan penghematan minimal 10% pada pos kebutuhan fleksibel bulan depan.`
    );
  }

  const nextMonthAllocationAdvice: string[] = [
    "Pertahankan alokasi otomatis 7 pos wajib sejak hari pertama gajian.",
    mostFrugalCategory
      ? `Sisa kuota dari pos ${mostFrugalCategory.name} (${formatRupiah(
          mostFrugalCategory.varianceAmount
        )}) siap disapu ke saldo tabungan bebas saat tutup buku.`
      : "Gunakan fitur Tutup Buku Bulanan untuk menyapu sisa Uang Bebas ke tabungan.",
    "Pastikan seluruh pemasukan freelance tetap dialokasikan ke Dynamic Freedom Buffer tanpa menaikkan biaya hidup tetap.",
  ];

  return {
    monthId: id,
    monthName: name,
    disciplineScore,
    statusLabel,
    totalIncome,
    totalSpent,
    netSavings: netCashflow,
    savingsRate,
    mostFrugalCategory,
    mostOverspentCategory,
    executiveSummary,
    tacticalRecommendations,
    nextMonthAllocationAdvice,
  };
}
