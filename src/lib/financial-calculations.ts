/**
 * ==============================================================================
 * Kenzo Treasury — Financial Calculation Engine (Single Source of Truth)
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Berkas ini adalah SATU-SATUNYA sumber kebenaran (Single Source of Truth) untuk
 * seluruh rumus finansial di Kenzo Treasury, sesuai aturan `.agents/rules/financial-domain.md`.
 *
 * Dilarang keras menduplikasi atau menghitung rumus finansial di komponen UI
 * atau sembarang file. Seluruh Server Actions, hooks, mutasi, dan visualisasi
 * wajib memanggil fungsi-fungsi murni (pure functions) di sini.
 *
 * ── Aturan Mutlak Finansial ──────────────────────────────────────────────────
 * 1. Integer Rupiah: Seluruh nominal uang adalah integer murni tanpa pecahan sen/desimal.
 * 2. Deterministic Rounding: Operasi pembagian dibulatkan secara deterministik
 *    (`Math.round`, `Math.floor`, atau `Math.ceil`).
 * 3. Non-Negative Balance & Guards: Validasi batas bawah nol untuk mencegah saldo negatif
 *    dan division by zero.
 */

/* ══════════════════════════════════════════════════════════════════════════════
   1. TIPE & KONTRAK DATA FINANSIAL
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Status kesehatan anggaran pos:
 * - `healthy`: Pengeluaran < 80% target (Aman 🟢)
 * - `warning`: Pengeluaran 80% - 100% target (Waspada 🟡)
 * - `overbudget`: Pengeluaran > 100% target (Overbudget 🔴)
 */
export type BudgetStatus = "healthy" | "warning" | "overbudget";

/**
 * Progres pelunasan utang/cicilan (finite lifetime).
 */
export interface DebtProgress {
  paidAmount: number;
  totalAmount: number;
  remainingAmount: number;
  percentage: number;
  isSettled: boolean;
}

/**
 * Hasil perhitungan ketahanan hidup dana darurat (Safety Months).
 */
export interface SafetyMonthsResult {
  safetyMonths: number;
  percentageOfTarget: number;
  isTargetReached: boolean;
}

/**
 * Milestone gamifikasi barang impian (Wishlist Sinking Fund).
 */
export type WishlistMilestone =
  | "started"
  | "halfway_hero" // >= 50%
  | "major_milestone" // >= 75%
  | "final_stretch" // >= 90%
  | "one_step_away" // >= 95%
  | "unlocked"; // >= 100%

/**
 * Detail progres dan status gamifikasi barang impian.
 */
export interface WishlistProgress {
  savedAmount: number;
  targetAmount: number;
  remainingAmount: number;
  percentage: number;
  isCompleted: boolean;
  milestone: WishlistMilestone;
  milestoneLabel: string;
  milestoneMessage: string;
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. OPERASI DASAR INTEGER RUPIAH & PEMFORMAT
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Memastikan nilai angka selalu berupa integer Rupiah yang aman (bebas pecahan float/NaN).
 */
export function toIntegerRupiah(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

/**
 * Memformat nominal integer Rupiah ke format lokal standar Indonesia:
 * Contoh: 4000000 -> "Rp 4.000.000", -50000 -> "-Rp 50.000"
 */
export function formatRupiah(
  amount: number,
  options?: {
    prefix?: boolean;
    space?: boolean;
  }
): string {
  const safeInt = toIntegerRupiah(amount);
  const isNegative = safeInt < 0;
  const absInt = Math.abs(safeInt);

  const formattedAbs = new Intl.NumberFormat("id-ID").format(absInt);

  const prefix = options?.prefix ?? true;
  const space = options?.space ?? true;

  if (!prefix) {
    return isNegative ? `-${formattedAbs}` : formattedAbs;
  }

  const symbol = space ? "Rp " : "Rp";
  return isNegative ? `-${symbol}${formattedAbs}` : `${symbol}${formattedAbs}`;
}

/**
 * Mengonversi string format Rupiah atau angka tak teratur kembali ke integer Rupiah murni.
 * Contoh: "Rp 4.000.000" -> 4000000, "-Rp 50.000" -> -50000, "" -> 0
 */
export function parseRupiah(value: string | number): number {
  if (typeof value === "number") {
    return toIntegerRupiah(value);
  }
  if (!value || typeof value !== "string") {
    return 0;
  }

  const isNegative = value.trim().startsWith("-");
  const cleanDigits = value.replace(/[^\d]/g, "");

  if (!cleanDigits) return 0;
  const parsed = parseInt(cleanDigits, 10);
  return isNegative ? -parsed : parsed;
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. FORMULA ANGGARAN POS & DYNAMIC BUFFER
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Menghitung sisa anggaran suatu pos pengeluaran.
 * Formula: Target - Terpakai.
 * Nilai negatif menandakan defisit/overbudget.
 */
export function calculateRemainingBudget(target: number, spent: number): number {
  const safeTarget = toIntegerRupiah(target);
  const safeSpent = toIntegerRupiah(spent);
  return safeTarget - safeSpent;
}

/**
 * Menghitung persentase pemakaian anggaran pos (0 - 100+%).
 * Jika target <= 0, mengembalikan 0 (atau 100 jika ada pengeluaran).
 */
export function calculateBudgetUsagePercentage(target: number, spent: number): number {
  const safeTarget = toIntegerRupiah(target);
  const safeSpent = Math.max(0, toIntegerRupiah(spent));

  if (safeTarget <= 0) {
    return safeSpent > 0 ? 100 : 0;
  }

  return Math.round((safeSpent / safeTarget) * 100);
}

/**
 * Menentukan status kesehatan anggaran berdasarkan batas FR-5.1:
 * - `healthy`: Terpakai < 80% Target
 * - `warning`: 80% Target <= Terpakai <= 100% Target
 * - `overbudget`: Terpakai > 100% Target
 */
export function getBudgetStatus(target: number, spent: number): BudgetStatus {
  const safeTarget = toIntegerRupiah(target);
  const safeSpent = Math.max(0, toIntegerRupiah(spent));

  if (safeTarget <= 0) {
    return safeSpent > 0 ? "overbudget" : "healthy";
  }

  if (safeSpent > safeTarget) {
    return "overbudget";
  }

  const warningThreshold = Math.round(safeTarget * 0.8);
  if (safeSpent >= warningThreshold) {
    return "warning";
  }

  return "healthy";
}

/**
 * Menghitung kuota target pos `🍿 Uang Bebas / Tabungan` secara dinamis.
 * Sesuai Invarian 3: Pemasukan tambahan (freelance, bonus) otomatis menambah buffer uang bebas,
 * tanpa menaikkan pos wajib atau kebutuhan operasional.
 *
 * Formula: Base Budget + Sum(Additional Incomes)
 */
export function calculateDynamicFreedomBuffer(
  baseBudget: number,
  additionalIncomes: number | number[]
): number {
  const safeBase = Math.max(0, toIntegerRupiah(baseBudget));

  let totalAdditional = 0;
  if (Array.isArray(additionalIncomes)) {
    totalAdditional = additionalIncomes.reduce((acc, curr) => {
      const val = Math.max(0, toIntegerRupiah(curr));
      return acc + val;
    }, 0);
  } else {
    totalAdditional = Math.max(0, toIntegerRupiah(additionalIncomes));
  }

  return safeBase + totalAdditional;
}

/* ══════════════════════════════════════════════════════════════════════════════
   4. FORMULA CICILAN & FINITE LIABILITIES
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Menghitung progres pelunasan utang/cicilan:
 * - `remainingAmount`: Sisa pokok utang (tidak boleh negatif)
 * - `percentage`: Persentase terbayar (0 - 100%)
 * - `isSettled`: true jika paidAmount >= totalAmount
 */
export function calculateDebtProgress(paidAmount: number, totalAmount: number): DebtProgress {
  const safePaid = Math.max(0, toIntegerRupiah(paidAmount));
  const safeTotal = Math.max(0, toIntegerRupiah(totalAmount));

  if (safeTotal <= 0) {
    return {
      paidAmount: safePaid,
      totalAmount: 0,
      remainingAmount: 0,
      percentage: 100,
      isSettled: true,
    };
  }

  const remaining = Math.max(0, safeTotal - safePaid);
  const isSettled = safePaid >= safeTotal;
  const percentage = Math.min(100, Math.round((safePaid / safeTotal) * 100));

  return {
    paidAmount: safePaid,
    totalAmount: safeTotal,
    remainingAmount: remaining,
    percentage,
    isSettled,
  };
}

/**
 * Menghitung estimasi sisa bulan pelunasan cicilan:
 * Formula: ceil(Sisa Utang / Cicilan Per Bulan)
 */
export function calculateRemainingDebtMonths(
  remainingAmount: number,
  monthlyPayment: number
): number {
  const safeRemaining = Math.max(0, toIntegerRupiah(remainingAmount));
  const safeMonthly = Math.max(0, toIntegerRupiah(monthlyPayment));

  if (safeRemaining === 0) return 0;
  if (safeMonthly === 0) return 0;

  return Math.ceil(safeRemaining / safeMonthly);
}

/* ══════════════════════════════════════════════════════════════════════════════
   5. DANA DARURAT & KETAHANAN FINANSIAL (SAFETY MONTHS)
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Target default dana darurat: Rp 18.000.000 (~6x biaya wajib bulanan)
 */
export const DEFAULT_EMERGENCY_FUND_TARGET = 18_000_000;

/**
 * Menghitung meteran ketahanan hidup dana darurat (Safety Months):
 * - `safetyMonths`: Jumlah bulan bertahan jika tanpa pemasukan sama sekali
 *   (Dibulatkan ke 1 desimal, misal: 4.2 bulan).
 * - `percentageOfTarget`: Capaian terhadap target dana darurat (0 - 100%).
 * - `isTargetReached`: true jika saldo >= target.
 */
export function calculateSafetyMonths(
  emergencyFundBalance: number,
  monthlyFixedExpense: number,
  target: number = DEFAULT_EMERGENCY_FUND_TARGET
): SafetyMonthsResult {
  const safeBalance = Math.max(0, toIntegerRupiah(emergencyFundBalance));
  const safeExpense = Math.max(0, toIntegerRupiah(monthlyFixedExpense));
  const safeTarget = Math.max(0, toIntegerRupiah(target));

  let safetyMonths = 0;
  if (safeExpense > 0) {
    safetyMonths = Math.round((safeBalance / safeExpense) * 10) / 10;
  }

  let percentageOfTarget = 0;
  if (safeTarget > 0) {
    percentageOfTarget = Math.min(100, Math.round((safeBalance / safeTarget) * 100));
  }

  const isTargetReached = safeTarget > 0 && safeBalance >= safeTarget;

  return {
    safetyMonths,
    percentageOfTarget,
    isTargetReached,
  };
}

/* ══════════════════════════════════════════════════════════════════════════════
   6. SALDO TABUNGAN BEBAS & SINKING FUND WISHLIST
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Menghitung saldo tabungan bebas yang aman digunakan (tidak mengganggu dana darurat).
 * Sesuai Invarian 5: Dana darurat dipisahkan dari dana konsumtif/wishlist.
 *
 * Formula: max(0, Total Saldo Tabungan - Saldo Dana Darurat)
 */
export function calculateFreeSavings(
  totalSavingsBalance: number,
  emergencyFundBalance: number
): number {
  const safeTotal = Math.max(0, toIntegerRupiah(totalSavingsBalance));
  const safeEmergency = Math.max(0, toIntegerRupiah(emergencyFundBalance));

  return Math.max(0, safeTotal - safeEmergency);
}

/**
 * Menghitung progres dan milestone gamifikasi wishlist barang impian sesuai FR-10.4:
 * - >= 100%: 🏆 DREAM UNLOCKED!
 * - >= 95%: ⚡ One Step Away
 * - >= 90%: 🔥 Final Stretch
 * - >= 75%: 🥇 Major Milestone
 * - >= 50%: 🥈 Halfway Hero
 * - < 50%: 🎯 Langkah Awal
 */
export function calculateWishlistProgress(
  savedAmount: number,
  targetAmount: number
): WishlistProgress {
  const safeSaved = Math.max(0, toIntegerRupiah(savedAmount));
  const safeTarget = Math.max(0, toIntegerRupiah(targetAmount));

  if (safeTarget <= 0) {
    return {
      savedAmount: safeSaved,
      targetAmount: 0,
      remainingAmount: 0,
      percentage: 100,
      isCompleted: true,
      milestone: "unlocked",
      milestoneLabel: "🏆 DREAM UNLOCKED!",
      milestoneMessage: "Target tercapai sempurna!",
    };
  }

  const remaining = Math.max(0, safeTarget - safeSaved);
  const percentage = Math.min(100, Math.round((safeSaved / safeTarget) * 100));
  const isCompleted = safeSaved >= safeTarget;

  let milestone: WishlistMilestone = "started";
  let milestoneLabel = "🎯 Langkah Awal";
  let milestoneMessage = "Setiap rupiah membawa lebih dekat ke impian.";

  if (isCompleted || percentage >= 100) {
    milestone = "unlocked";
    milestoneLabel = "🏆 DREAM UNLOCKED! (100%)";
    milestoneMessage = "Impian berhasil tercapai! Saatnya merayakan hasil disiplin finansial!";
  } else if (percentage >= 95) {
    milestone = "one_step_away";
    milestoneLabel = "⚡ One Step Away (95%)";
    milestoneMessage = "Dikit lagi kebeli, jangan kendor!";
  } else if (percentage >= 90) {
    milestone = "final_stretch";
    milestoneLabel = "🔥 Final Stretch (90%)";
    milestoneMessage = "90%! Bau-bau barang impian udah kecium!";
  } else if (percentage >= 75) {
    milestone = "major_milestone";
    milestoneLabel = "🥇 Major Milestone (75%)";
    milestoneMessage = "Tinggal 25% lagi, garis finish makin deket!";
  } else if (percentage >= 50) {
    milestone = "halfway_hero";
    milestoneLabel = "🥈 Halfway Hero (50%)";
    milestoneMessage = "Setengah jalan lagi! Momentumnya dapet banget!";
  }

  return {
    savedAmount: safeSaved,
    targetAmount: safeTarget,
    remainingAmount: remaining,
    percentage,
    isCompleted,
    milestone,
    milestoneLabel,
    milestoneMessage,
  };
}

/* ══════════════════════════════════════════════════════════════════════════════
   7. ARUS KAS BULANAN & TUTUP BUKU (END-OF-MONTH SWEEP)
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Menghitung arus kas bersih (Net Cashflow) bulan berjalan:
 * Formula: Total Pemasukan - Total Pengeluaran.
 */
export function calculateNetCashflow(totalIncome: number, totalExpenses: number): number {
  const safeIncome = Math.max(0, toIntegerRupiah(totalIncome));
  const safeExpenses = Math.max(0, toIntegerRupiah(totalExpenses));
  return safeIncome - safeExpenses;
}

/**
 * Menghitung rasio tabungan bulanan (Savings Rate %):
 * Formula: (Net Tabungan / Total Pemasukan) * 100%.
 * Jika pemasukan 0 atau net savings negatif, mengembalikan 0%.
 */
export function calculateSavingsRate(totalIncome: number, netSavings: number): number {
  const safeIncome = Math.max(0, toIntegerRupiah(totalIncome));
  const safeSavings = toIntegerRupiah(netSavings);

  if (safeIncome <= 0 || safeSavings <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((safeSavings / safeIncome) * 100));
}

/**
 * Menghitung nominal yang disapu bersih ke `savings_account.balance` saat tutup buku.
 * Sesuai Invarian 6: Hanya sisa kuota uang bebas yang bernilai positif yang disapu.
 * Jika minus (overbudget), tidak ada uang yang disapu (mengembalikan 0).
 */
export function calculateMonthSweep(remainingFreeBudget: number): number {
  const safeRemaining = toIntegerRupiah(remainingFreeBudget);
  return Math.max(0, safeRemaining);
}
