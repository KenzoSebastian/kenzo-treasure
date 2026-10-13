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
  calculateSafetyMonths,
  calculateFreeSavings,
  calculateWishlistProgress,
  calculateNetCashflow,
  calculateSavingsRate,
  calculateMonthSweep,
  DEFAULT_EMERGENCY_FUND_TARGET,
} from "../financial-calculations";

describe("Financial Calculation Engine (Kenzo Treasury Invariants)", () => {
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
      expect(formatRupiah(735000, { space: false })).toBe("Rp735.000");
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
      // Healthy (< 80%)
      expect(getBudgetStatus(1000000, 0)).toBe("healthy");
      expect(getBudgetStatus(1000000, 790000)).toBe("healthy");

      // Warning (80% - 100%)
      expect(getBudgetStatus(1000000, 800000)).toBe("warning");
      expect(getBudgetStatus(1000000, 950000)).toBe("warning");
      expect(getBudgetStatus(1000000, 1000000)).toBe("warning");

      // Overbudget (> 100%)
      expect(getBudgetStatus(1000000, 1000001)).toBe("overbudget");
      expect(getBudgetStatus(1000000, 1500000)).toBe("overbudget");

      // Zero target edge case
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
      const additionalIncomes = [500000, 750000]; // e.g. freelance video editing
      const result = calculateDynamicFreedomBuffer(baseBudget, additionalIncomes);

      expect(result).toBe(2165000); // 915.000 + 1.250.000
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
      const totalAmount = 17640000; // iPhone 24 months @ 735.000
      const paidAmount = 5145000; // 7 months paid

      const progress = calculateDebtProgress(paidAmount, totalAmount);

      expect(progress.paidAmount).toBe(5145000);
      expect(progress.totalAmount).toBe(17640000);
      expect(progress.remainingAmount).toBe(12495000);
      expect(progress.percentage).toBe(29);
      expect(progress.isSettled).toBe(false);
    });

    it("should mark debt as settled when paid reaches or exceeds total", () => {
      const total = 2500000; // Mama
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
      // 12.495.000 / 735.000 = exactly 17 months
      expect(calculateRemainingDebtMonths(12495000, 735000)).toBe(17);

      // Remaining 1.000.000 with 300.000 monthly payment = ceil(3.33) = 4 months
      expect(calculateRemainingDebtMonths(1000000, 300000)).toBe(4);

      // Remaining 0 should return 0
      expect(calculateRemainingDebtMonths(0, 500000)).toBe(0);

      // Guard monthly payment = 0
      expect(calculateRemainingDebtMonths(500000, 0)).toBe(0);
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
     5. Emergency Fund & Safety Months
     ────────────────────────────────────────────────────────────────────────── */
  describe("calculateSafetyMonths", () => {
    it("should calculate safety months with 1 decimal precision", () => {
      const emergencyBalance = 9000000;
      const monthlyFixedExpense = 2000000; // 9jt / 2jt = 4.5 months

      const result = calculateSafetyMonths(emergencyBalance, monthlyFixedExpense);

      expect(result.safetyMonths).toBe(4.5);
      expect(result.percentageOfTarget).toBe(50); // 9jt / 18jt default = 50%
      expect(result.isTargetReached).toBe(false);
    });

    it("should indicate target reached when balance equals or exceeds target", () => {
      const result = calculateSafetyMonths(18000000, 3000000, DEFAULT_EMERGENCY_FUND_TARGET);

      expect(result.safetyMonths).toBe(6.0);
      expect(result.percentageOfTarget).toBe(100);
      expect(result.isTargetReached).toBe(true);
    });

    it("should handle zero expenses safely without division by zero", () => {
      const result = calculateSafetyMonths(5000000, 0);
      expect(result.safetyMonths).toBe(0);
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
     6. Free Savings & Wishlist Sinking Fund
     ────────────────────────────────────────────────────────────────────────── */
  describe("calculateFreeSavings & calculateWishlistProgress", () => {
    it("should separate free savings from emergency fund balance", () => {
      expect(calculateFreeSavings(15000000, 5000000)).toBe(10000000);
      // Guard against emergency fund exceeding total balance
      expect(calculateFreeSavings(3000000, 5000000)).toBe(0);
    });

    it("should map wishlist gamification milestones correctly according to PRD FR-10.4", () => {
      const target = 10000000;

      // < 50% -> started
      const p1 = calculateWishlistProgress(3000000, target);
      expect(p1.percentage).toBe(30);
      expect(p1.milestone).toBe("started");
      expect(p1.isCompleted).toBe(false);

      // 50% - 74% -> halfway_hero (50%)
      const p2 = calculateWishlistProgress(5000000, target);
      expect(p2.percentage).toBe(50);
      expect(p2.milestone).toBe("halfway_hero");

      // 75% - 89% -> major_milestone (75%)
      const p3 = calculateWishlistProgress(8000000, target);
      expect(p3.percentage).toBe(80);
      expect(p3.milestone).toBe("major_milestone");

      // 90% - 94% -> final_stretch (90%)
      const p4 = calculateWishlistProgress(9200000, target);
      expect(p4.percentage).toBe(92);
      expect(p4.milestone).toBe("final_stretch");

      // 95% - 99% -> one_step_away (95%)
      const p5 = calculateWishlistProgress(9700000, target);
      expect(p5.percentage).toBe(97);
      expect(p5.milestone).toBe("one_step_away");

      // 100% -> unlocked (100%)
      const p6 = calculateWishlistProgress(10000000, target);
      expect(p6.percentage).toBe(100);
      expect(p6.milestone).toBe("unlocked");
      expect(p6.isCompleted).toBe(true);

      // > 100% -> unlocked
      const p7 = calculateWishlistProgress(12000000, target);
      expect(p7.percentage).toBe(100);
      expect(p7.milestone).toBe("unlocked");
      expect(p7.remainingAmount).toBe(0);
    });
  });

  /* ──────────────────────────────────────────────────────────────────────────
     7. Monthly Cashflow & Month Sweep
     ────────────────────────────────────────────────────────────────────────── */
  describe("calculateNetCashflow, calculateSavingsRate, calculateMonthSweep", () => {
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
      // Positive remainder -> sweep to savings
      expect(calculateMonthSweep(450000)).toBe(450000);

      // Zero remainder -> 0
      expect(calculateMonthSweep(0)).toBe(0);

      // Overbudget deficit -> 0 (no negative sweep into savings)
      expect(calculateMonthSweep(-150000)).toBe(0);
    });
  });
});
