/// <reference types="bun-types" />
import { describe, expect, it } from "bun:test";
import {
  toIntegerRupiah,
  formatRupiah,
  parseRupiah,
  calculateRemainingBudget,
  calculateBudgetUsagePercentage,
  getBudgetStatus,
  calculateDynamicFreedomBuffer,
  calculateDebtProgress,
  calculateRemainingDebtMonths,
  calculateMonthlyInstallment,
  calculateTenorFromMonthly,
  calculateSafetyMonths,
  calculateFreeSavings,
  calculateWishlistProgress,
  calculateNetCashflow,
  calculateSavingsRate,
  calculateMonthSweep,
  resolveDefaultCycleDate,
  DEFAULT_EMERGENCY_FUND_TARGET,
} from "../financial-calculations";
import {
  resolveCategoryIconKey,
  stripEmojiPrefix,
  getCategoryIconLabel,
  CURATED_CATEGORY_ICONS,
} from "../category-icons";

describe("Financial Calculation Engine & Icon Registry (Kenzo Treasury Invariants)", () => {
  /* ──────────────────────────────────────────────────────────────────────────
     1. Integer Rupiah Operations & Formatters
     ────────────────────────────────────────────────────────────────────────── */
  describe("toIntegerRupiah, formatRupiah, parseRupiah", () => {
    it("should round floating numbers to pure integer Rupiah", () => {
      expect(toIntegerRupiah(1000.4)).toBe(1000);
      expect(toIntegerRupiah(1000.6)).toBe(1001);
      expect(toIntegerRupiah(-500.5)).toBe(-500);
      expect(toIntegerRupiah(NaN)).toBe(0);
      expect(toIntegerRupiah(Infinity)).toBe(0);
    });

    it("should format Rupiah currency properly with Indonesian thousand separator", () => {
      expect(formatRupiah(4000000)).toBe("Rp 4.000.000");
      expect(formatRupiah(0)).toBe("Rp 0");
      expect(formatRupiah(-50000)).toBe("-Rp 50.000");
      expect(formatRupiah(915000, { prefix: false })).toBe("915.000");
      expect(formatRupiah(750000, { space: false })).toBe("Rp750.000");
      expect(formatRupiah(-125000, { prefix: false })).toBe("-125.000");
    });

    it("should parse formatted Rupiah string back to exact integer", () => {
      expect(parseRupiah("Rp 4.000.000")).toBe(4000000);
      expect(parseRupiah("Rp4.000.000")).toBe(4000000);
      expect(parseRupiah("-Rp 50.000")).toBe(-50000);
      expect(parseRupiah("915.000")).toBe(915000);
      expect(parseRupiah("")).toBe(0);
      expect(parseRupiah(12345)).toBe(12345);
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
     2. Budget Category Calculations & Status
     ────────────────────────────────────────────────────────────────────────── */
  describe("calculateRemainingBudget, calculateBudgetUsagePercentage, getBudgetStatus", () => {
    it("should calculate remaining budget accurately (target - spent)", () => {
      expect(calculateRemainingBudget(1000000, 400000)).toBe(600000);
      expect(calculateRemainingBudget(500000, 500000)).toBe(0);
      expect(calculateRemainingBudget(300000, 350000)).toBe(-50000);
    });

    it("should calculate budget usage percentage correctly", () => {
      expect(calculateBudgetUsagePercentage(1000000, 400000)).toBe(40);
      expect(calculateBudgetUsagePercentage(1000000, 800000)).toBe(80);
      expect(calculateBudgetUsagePercentage(1000000, 1200000)).toBe(120);
      expect(calculateBudgetUsagePercentage(0, 0)).toBe(0);
      expect(calculateBudgetUsagePercentage(0, 50000)).toBe(100);
    });

    it("should classify budget status correctly according to FR-5.1 thresholds", () => {
      expect(getBudgetStatus(1000000, 0)).toBe("healthy");
      expect(getBudgetStatus(1000000, 790000)).toBe("healthy");

      expect(getBudgetStatus(1000000, 800000)).toBe("warning");
      expect(getBudgetStatus(1000000, 950000)).toBe("warning");
      expect(getBudgetStatus(1000000, 1000000)).toBe("warning");

      expect(getBudgetStatus(1000000, 1000001)).toBe("overbudget");
      expect(getBudgetStatus(1000000, 1500000)).toBe("overbudget");

      expect(getBudgetStatus(0, 0)).toBe("healthy");
      expect(getBudgetStatus(0, 10000)).toBe("overbudget");
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
     3. Dynamic Freedom Buffer (Multi-Source Incomes)
     ────────────────────────────────────────────────────────────────────────── */
  describe("calculateDynamicFreedomBuffer", () => {
    it("should add additional incomes to base budget dynamically", () => {
      const baseBudget = 915000;
      const additionalIncomes = [500000, 750000];
      const result = calculateDynamicFreedomBuffer(
        baseBudget,
        additionalIncomes
      );

      expect(result).toBe(2165000);
    });

    it("should support single number input as additional income", () => {
      expect(calculateDynamicFreedomBuffer(915000, 350000)).toBe(1265000);
    });

    it("should handle empty or zero additional income gracefully", () => {
      expect(calculateDynamicFreedomBuffer(915000, [])).toBe(915000);
      expect(calculateDynamicFreedomBuffer(915000, 0)).toBe(915000);
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
     4. Liabilities & Finite Debt Tracking
     ────────────────────────────────────────────────────────────────────────── */
  describe("calculateDebtProgress & calculateRemainingDebtMonths", () => {
    it("should calculate active debt progress and remaining amount", () => {
      const totalAmount = 12000000;
      const paidAmount = 3000000;

      const progress = calculateDebtProgress(paidAmount, totalAmount);

      expect(progress.paidAmount).toBe(3000000);
      expect(progress.totalAmount).toBe(12000000);
      expect(progress.remainingAmount).toBe(9000000);
      expect(progress.percentage).toBe(25);
      expect(progress.isSettled).toBe(false);
    });

    it("should mark debt as settled when paid reaches or exceeds total", () => {
      const total = 2500000;
      const settled = calculateDebtProgress(2500000, total);
      expect(settled.isSettled).toBe(true);
      expect(settled.remainingAmount).toBe(0);
      expect(settled.percentage).toBe(100);

      const overpaid = calculateDebtProgress(2600000, total);
      expect(overpaid.isSettled).toBe(true);
      expect(overpaid.remainingAmount).toBe(0);
      expect(overpaid.percentage).toBe(100);
    });

    it("should handle zero total debt edge case safely", () => {
      const result = calculateDebtProgress(0, 0);
      expect(result.isSettled).toBe(true);
      expect(result.percentage).toBe(100);
      expect(result.remainingAmount).toBe(0);
    });

    it("should calculate remaining debt months using ceiling division", () => {
      expect(calculateRemainingDebtMonths(9000000, 1000000)).toBe(9);
      expect(calculateRemainingDebtMonths(1000000, 300000)).toBe(4);
      expect(calculateRemainingDebtMonths(0, 500000)).toBe(0);
      expect(calculateRemainingDebtMonths(500000, 0)).toBe(0);
    });

    it("should calculate monthly installment rounded up to nearest thousand Rupiah", () => {
      // 4jt / 12 bln = 333.333,33 -> dibulatkan ke ribuan ke atas menjadi 334.000
      expect(calculateMonthlyInstallment(4000000, 12)).toBe(334000);
      // 17jt / 12 bln = 1.416.666,66 -> 1.417.000
      expect(calculateMonthlyInstallment(17000000, 12)).toBe(1417000);
      // 12jt / 12 bln = 1.000.000 bulat
      expect(calculateMonthlyInstallment(12000000, 12)).toBe(1000000);
      // Edge cases
      expect(calculateMonthlyInstallment(0, 12)).toBe(0);
      expect(calculateMonthlyInstallment(4000000, 0)).toBe(0);
      // Tenor 1 bln
      expect(calculateMonthlyInstallment(4000000, 1)).toBe(4000000);

      // Tenor from monthly
      expect(calculateTenorFromMonthly(4000000, 334000)).toBe(12);
      expect(calculateTenorFromMonthly(17000000, 200000)).toBe(85);
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
     5. Emergency Fund & Safety Months (Zero-Dummy Default = 0)
     ────────────────────────────────────────────────────────────────────────── */
  describe("calculateSafetyMonths", () => {
    it("should default emergencyFundTarget to 0 (no hardcoded dummy target)", () => {
      expect(DEFAULT_EMERGENCY_FUND_TARGET).toBe(0);
      const result = calculateSafetyMonths(9000000, 2000000);
      expect(result.safetyMonths).toBe(4.5);
      expect(result.targetAmount).toBe(0);
      expect(result.percentageOfTarget).toBe(0);
      expect(result.isTargetReached).toBe(false);
    });

    it("should calculate percentage and target reached when explicit target > 0 is provided", () => {
      const result = calculateSafetyMonths(12000000, 2000000, 12000000);
      expect(result.safetyMonths).toBe(6.0);
      expect(result.percentageOfTarget).toBe(100);
      expect(result.isTargetReached).toBe(true);
    });

    it("should handle zero expenses safely without division by zero", () => {
      const result = calculateSafetyMonths(5000000, 0, 10000000);
      expect(result.safetyMonths).toBe(0);
      expect(result.percentageOfTarget).toBe(50);
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
     6. Free Savings & Wishlist Sinking Fund Milestones + Icon Keys
     ────────────────────────────────────────────────────────────────────────── */
  describe("calculateFreeSavings & calculateWishlistProgress", () => {
    it("should separate free savings from emergency fund balance", () => {
      expect(calculateFreeSavings(15000000, 5000000)).toBe(10000000);
      expect(calculateFreeSavings(3000000, 5000000)).toBe(0);
    });

    it("should map wishlist gamification milestones & milestoneIconKey accurately", () => {
      const target = 10000000;

      const p1 = calculateWishlistProgress(3000000, target);
      expect(p1.percentage).toBe(30);
      expect(p1.milestone).toBe("started");
      expect(p1.milestoneIconKey).toBe("target");
      expect(p1.isCompleted).toBe(false);

      const p2 = calculateWishlistProgress(5000000, target);
      expect(p2.percentage).toBe(50);
      expect(p2.milestone).toBe("halfway_hero");
      expect(p2.milestoneIconKey).toBe("sparkles");

      const p3 = calculateWishlistProgress(8000000, target);
      expect(p3.percentage).toBe(80);
      expect(p3.milestone).toBe("major_milestone");
      expect(p3.milestoneIconKey).toBe("rocket");

      const p4 = calculateWishlistProgress(9200000, target);
      expect(p4.percentage).toBe(92);
      expect(p4.milestone).toBe("final_stretch");
      expect(p4.milestoneIconKey).toBe("zap");

      const p5 = calculateWishlistProgress(9700000, target);
      expect(p5.percentage).toBe(97);
      expect(p5.milestone).toBe("one_step_away");
      expect(p5.milestoneIconKey).toBe("flame");

      const p6 = calculateWishlistProgress(10000000, target);
      expect(p6.percentage).toBe(100);
      expect(p6.milestone).toBe("unlocked");
      expect(p6.milestoneIconKey).toBe("trophy");
      expect(p6.isCompleted).toBe(true);
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
     7. Monthly Cashflow, Month Sweep & Cycle Date Resolution
     ────────────────────────────────────────────────────────────────────────── */
  describe("calculateNetCashflow, calculateSavingsRate, calculateMonthSweep, resolveDefaultCycleDate", () => {
    it("should calculate net cashflow properly (income - expenses)", () => {
      expect(calculateNetCashflow(4000000, 3085000)).toBe(915000);
      expect(calculateNetCashflow(4000000, 4500000)).toBe(-500000);
    });

    it("should calculate savings rate percentage and cap at 100%", () => {
      expect(calculateSavingsRate(4000000, 1000000)).toBe(25);
      expect(calculateSavingsRate(4000000, 0)).toBe(0);
      expect(calculateSavingsRate(4000000, -200000)).toBe(0);
      expect(calculateSavingsRate(0, 500000)).toBe(0);
    });

    it("should sweep positive remaining free budget to savings account, and 0 for deficit", () => {
      expect(calculateMonthSweep(450000)).toBe(450000);
      expect(calculateMonthSweep(0)).toBe(0);
      expect(calculateMonthSweep(-150000)).toBe(0);
    });

    it("should resolve default cycle date to today in Asia/Jakarta for current cycle or 01 for other cycles", () => {
      const refNow = new Date("2026-10-18T10:00:00+07:00");
      expect(resolveDefaultCycleDate(2026, 10, refNow)).toBe("2026-10-18");
      expect(resolveDefaultCycleDate(2026, 8, refNow)).toBe("2026-08-01");
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
     8. Curated Lucide Category Icon Registry (Fase R1)
     ────────────────────────────────────────────────────────────────────────── */
  describe("Category Icon Registry & Legacy Fallback", () => {
    it("should contain 36 curated semantic Lucide icons (6x6 grid)", () => {
      expect(CURATED_CATEGORY_ICONS).toHaveLength(36);
    });

    it("should resolve valid icon keys, legacy escaped emoji strings, and group fallbacks", () => {
      expect(resolveCategoryIconKey("fuel")).toBe("fuel");
      expect(resolveCategoryIconKey("\u26FD")).toBe("fuel");
      expect(resolveCategoryIconKey("unknown-key", "pos_wajib")).toBe(
        "shield-check"
      );
      expect(
        resolveCategoryIconKey("unknown-key", "pos_wajib", "liab-123")
      ).toBe("credit-card");
      expect(getCategoryIconLabel("piggy-bank")).toBe("Tabungan");
      expect(stripEmojiPrefix("\u26FD Bensin & Mobilitas")).toBe(
        "Bensin & Mobilitas"
      );
    });
  });
});
