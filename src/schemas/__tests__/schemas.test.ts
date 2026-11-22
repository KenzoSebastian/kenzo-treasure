import { describe, it, expect } from "bun:test";
import {
  loginSchema,
  registerSchema,
  createMonthSchema,
  closeMonthSchema,
  createIncomeSchema,
  createLiabilitySchema,
  recordInstallmentSchema,
  deleteLiabilitySchema,
  createCategorySchema,
  deleteCategorySchema,
  reorderCategoriesSchema,
  createTransactionSchema,
  softDeleteTransactionSchema,
  createWishlistSchema,
  allocateWishlistSchema,
  onboardingSchema,
  budgetTemplateSchema,
  updateFinanceDefaultsSchema,
} from "../index";

describe("Shared Zod Schemas Validation (Client-Server Contract)", () => {
  describe("Auth Schemas", () => {
    it("should validate valid login credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@treasury.app",
        password: "secretpassword123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@treasury.app");
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
        fullName: "Pengguna Treasury",
        email: "user@treasury.app",
        password: "securepassword",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Month Schemas", () => {
    it("should validate and coerce valid month input including baseSalary 0", () => {
      const result = createMonthSchema.safeParse({
        year: "2026",
        monthIndex: "10",
        baseSalary: "5000000",
        rolloverSavings: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2026);
        expect(result.data.monthIndex).toBe(10);
        expect(result.data.baseSalary).toBe(5000000);
      }

      const zeroSalary = createMonthSchema.safeParse({
        year: 2026,
        monthIndex: 11,
        baseSalary: 0,
      });
      expect(zeroSalary.success).toBe(true);
      if (zeroSalary.success) {
        expect(zeroSalary.data.baseSalary).toBe(0);
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
        source: "Proyek Desain Web",
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

  describe("Liability Schemas (Fase R1 & R8)", () => {
    it("should validate liability creation and enforce monthlyPayment <= totalAmount", () => {
      const valid = createLiabilitySchema.safeParse({
        name: "Cicilan Kendaraan",
        icon: "car",
        totalAmount: 12000000,
        monthlyPayment: 1000000,
        totalMonths: 12,
      });
      expect(valid.success).toBe(true);

      const invalid = createLiabilitySchema.safeParse({
        name: "Cicilan Kendaraan",
        totalAmount: 500000,
        monthlyPayment: 1000000,
      });
      expect(invalid.success).toBe(false);
    });

    it("should require monthId when allocateToCurrentMonth is true", () => {
      const missingMonthId = createLiabilitySchema.safeParse({
        name: "Pinjaman Pendidikan",
        totalAmount: 6000000,
        monthlyPayment: 500000,
        allocateToCurrentMonth: true,
      });
      expect(missingMonthId.success).toBe(false);

      const withMonthId = createLiabilitySchema.safeParse({
        name: "Pinjaman Pendidikan",
        totalAmount: 6000000,
        monthlyPayment: 500000,
        allocateToCurrentMonth: true,
        monthId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(withMonthId.success).toBe(true);
    });

    it("should validate installment recording with optional monthId", () => {
      const result = recordInstallmentSchema.safeParse({
        liabilityId: "550e8400-e29b-41d4-a716-446655440000",
        amount: "1000000",
        monthId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(1000000);
        expect(result.data.monthId).toBe(
          "550e8400-e29b-41d4-a716-446655440001"
        );
      }
    });

    it("should validate deleteLiabilitySchema with valid UUID", () => {
      const valid = deleteLiabilitySchema.safeParse({
        liabilityId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(valid.success).toBe(true);

      const invalid = deleteLiabilitySchema.safeParse({
        liabilityId: "non-uuid",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("Category Schemas & Delete Category Contract (Fase R1 & R4)", () => {
    it("should validate valid category with Lucide icon key and allowed category group", () => {
      const result = createCategorySchema.safeParse({
        monthId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Listrik Rumah",
        icon: "zap",
        group: "pos_wajib",
        targetBudget: "450000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targetBudget).toBe(450000);
        expect(result.data.icon).toBe("zap");
      }
    });

    it("should validate deleteCategorySchema modes and reject self-reassignment", () => {
      const deactivateMode = deleteCategorySchema.safeParse({
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        mode: "deactivate_next_month",
      });
      expect(deactivateMode.success).toBe(true);

      const selfReassign = deleteCategorySchema.safeParse({
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        mode: "permanent_delete",
        targetCategoryId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(selfReassign.success).toBe(false);
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
        description: "Beli Kopi Pagi",
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

  describe("Wishlist, Onboarding & Settings Schemas (Fase R3 & R4)", () => {
    it("should validate wishlist creation with Lucide icon key and sinking fund allocation", () => {
      const wishResult = createWishlistSchema.safeParse({
        name: "Tablet Kerja",
        targetAmount: "8500000",
        icon: "smartphone",
      });
      expect(wishResult.success).toBe(true);
      if (wishResult.success) {
        expect(wishResult.data.targetAmount).toBe(8500000);
        expect(wishResult.data.icon).toBe("smartphone");
      }

      const allocResult = allocateWishlistSchema.safeParse({
        wishlistId: "550e8400-e29b-41d4-a716-446655440000",
        amount: "400000",
        direction: "deposit",
        notes: "Alokasi rutin bulan ini",
      });
      expect(allocResult.success).toBe(true);
    });

    it("should validate onboardingSchema and settings schemas", () => {
      const onboardRes = onboardingSchema.safeParse({
        defaultBaseSalary: 6000000,
        emergencyFundTarget: 18000000,
        budgetTemplates: [
          {
            name: "Tagihan Utilitas",
            icon: "zap",
            group: "pos_wajib",
            targetBudget: 500000,
            sortOrder: 1,
          },
        ],
        liabilities: [],
        createInitialMonth: true,
      });
      expect(onboardRes.success).toBe(true);

      const tplRes = budgetTemplateSchema.safeParse({
        name: "Transportasi & BBM",
        icon: "fuel",
        group: "kebutuhan",
        targetBudget: 300000,
        sortOrder: 2,
        isActive: true,
      });
      expect(tplRes.success).toBe(true);

      const defaultsRes = updateFinanceDefaultsSchema.safeParse({
        defaultBaseSalary: 6500000,
        emergencyFundTarget: 15000000,
      });
      expect(defaultsRes.success).toBe(true);
    });
  });
});
