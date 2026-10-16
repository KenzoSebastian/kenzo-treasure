import { describe, it, expect } from "bun:test";
import {
  loginSchema,
  registerSchema,
  createMonthSchema,
  closeMonthSchema,
  createIncomeSchema,
  createLiabilitySchema,
  recordInstallmentSchema,
  createCategorySchema,
  reorderCategoriesSchema,
  createTransactionSchema,
  softDeleteTransactionSchema,
  createWishlistSchema,
  allocateWishlistSchema,
} from "../index";

describe("Shared Zod Schemas Validation (Client-Server Contract)", () => {
  describe("Auth Schemas", () => {
    it("should validate valid login credentials", () => {
      const result = loginSchema.safeParse({
        email: "kenzo@treasury.app",
        password: "secretpassword123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("kenzo@treasury.app");
      }
    });

    it("should reject invalid email and short password", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "123",
      });
      expect(result.success).toBe(false);
    });

    it("should validate valid register payload", () => {
      const result = registerSchema.safeParse({
        fullName: "Kenzo Sebastian",
        email: "kenzo@treasury.app",
        password: "securepassword",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Month Schemas", () => {
    it("should validate and coerce valid month input", () => {
      const result = createMonthSchema.safeParse({
        year: "2026",
        monthIndex: "10",
        baseSalary: "4000000",
        rolloverSavings: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2026);
        expect(result.data.monthIndex).toBe(10);
        expect(result.data.baseSalary).toBe(4000000);
      }
    });

    it("should reject month index out of range 1-12", () => {
      const result = createMonthSchema.safeParse({
        year: 2026,
        monthIndex: 13,
      });
      expect(result.success).toBe(false);
    });

    it("should validate month closing schema", () => {
      const result = closeMonthSchema.safeParse({
        monthId: "550e8400-e29b-41d4-a716-446655440000",
        surplusAction: "sweep_to_savings",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Income Schemas", () => {
    it("should validate valid income and coerce string amount", () => {
      const result = createIncomeSchema.safeParse({
        monthId: "550e8400-e29b-41d4-a716-446655440000",
        source: "Freelance Project Video",
        amount: "1500000",
        date: "2026-10-15",
        isBaseSalary: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(1500000);
      }
    });

    it("should reject non-positive or decimal income amount", () => {
      const zeroResult = createIncomeSchema.safeParse({
        monthId: "550e8400-e29b-41d4-a716-446655440000",
        source: "Bonus",
        amount: 0,
        date: "2026-10-15",
      });
      expect(zeroResult.success).toBe(false);

      const decimalResult = createIncomeSchema.safeParse({
        monthId: "550e8400-e29b-41d4-a716-446655440000",
        source: "Bonus",
        amount: 150000.5,
        date: "2026-10-15",
      });
      expect(decimalResult.success).toBe(false);
    });
  });

  describe("Liability Schemas", () => {
    it("should validate liability creation and enforce monthlyPayment <= totalAmount", () => {
      const valid = createLiabilitySchema.safeParse({
        name: "Cicilan iPhone 15",
        totalAmount: 17640000,
        monthlyPayment: 735000,
        totalMonths: 24,
      });
      expect(valid.success).toBe(true);

      const invalid = createLiabilitySchema.safeParse({
        name: "Cicilan iPhone 15",
        totalAmount: 500000,
        monthlyPayment: 1000000,
      });
      expect(invalid.success).toBe(false);
    });

    it("should validate installment recording", () => {
      const result = recordInstallmentSchema.safeParse({
        liabilityId: "550e8400-e29b-41d4-a716-446655440000",
        amount: "735000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(735000);
      }
    });
  });

  describe("Category Schemas", () => {
    it("should validate valid category with allowed category group", () => {
      const result = createCategorySchema.safeParse({
        monthId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Listrik Rumah",
        icon: "⚡",
        group: "pos_wajib",
        targetBudget: "500000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targetBudget).toBe(500000);
      }
    });

    it("should reject invalid category group", () => {
      const result = createCategorySchema.safeParse({
        monthId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Belanja",
        group: "kelompok_palsu",
        targetBudget: 100000,
      });
      expect(result.success).toBe(false);
    });

    it("should validate reorder categories list", () => {
      const result = reorderCategoriesSchema.safeParse({
        monthId: "550e8400-e29b-41d4-a716-446655440000",
        categoryIds: [
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440002",
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Transaction Schemas", () => {
    it("should validate expense transaction with valid method and date", () => {
      const result = createTransactionSchema.safeParse({
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        amount: "25000",
        date: "2026-10-15",
        description: "Beli Kopi Kenangan",
        method: "qris",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(25000);
        expect(result.data.method).toBe("qris");
      }
    });

    it("should validate soft delete transaction schema", () => {
      const result = softDeleteTransactionSchema.safeParse({
        transactionId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Wishlist Schemas", () => {
    it("should validate wishlist creation and sinking fund allocation", () => {
      const wishResult = createWishlistSchema.safeParse({
        name: "iPad Air M2",
        targetAmount: "12000000",
        icon: "📱",
      });
      expect(wishResult.success).toBe(true);
      if (wishResult.success) {
        expect(wishResult.data.targetAmount).toBe(12000000);
      }

      const allocResult = allocateWishlistSchema.safeParse({
        wishlistId: "550e8400-e29b-41d4-a716-446655440000",
        amount: "500000",
        direction: "deposit",
        notes: "Tabungan sisa jajan bulan Oktober",
      });
      expect(allocResult.success).toBe(true);
    });
  });
});
