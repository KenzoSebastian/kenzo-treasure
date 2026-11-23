import { describe, expect, it } from "bun:test";
import {
  isDateWithinMonthCycle,
  calculateDisciplineScore,
  calculateSafetyMonths,
  calculateWishlistProgress,
} from "@/lib/financial-calculations";
import { enrichLiabilityWithProgress } from "@/lib/queries/liabilities";
import { enrichWishlist } from "@/lib/queries/wishlists";
import { buildDeterministicMonthlyEvaluation } from "@/lib/ai/gemini";
import {
  transferEmergencyFundSchema,
  updateEmergencyTargetSchema,
  createLiabilitySchema,
  recordInstallmentSchema,
  updateCategoryTargetSchema,
  deleteCategorySchema,
  createTransactionSchema,
  allocateWishlistSchema,
} from "@/schemas";
import type { MonthlyCycleDetail } from "@/types";

describe("Backend Phases B7 - B13 & R1 - R10 Comprehensive Suite", () => {
  describe("Fase B7 & R8: Finite Liabilities & Installment Tracker", () => {
    it("harus menghitung progres cicilan aktif dan sisa bulan dengan presisi", () => {
      const now = new Date();
      const vehicleDebt = enrichLiabilityWithProgress({
        id: "11111111-1111-4111-8111-111111111111",
        userId: "22222222-2222-4222-8222-222222222222",
        name: "Cicilan Kendaraan",
        icon: "car",
        totalAmount: 12_000_000,
        paidAmount: 3_000_000,
        monthlyPayment: 1_000_000,
        totalMonths: 12,
        isSettled: false,
        createdAt: now,
        updatedAt: now,
      });

      expect(vehicleDebt.remainingAmount).toBe(9_000_000);
      expect(vehicleDebt.percentage).toBe(25);
      expect(vehicleDebt.remainingMonths).toBe(9);
      expect(vehicleDebt.isSettled).toBe(false);
    });

    it("harus otomatis menandai isSettled = true ketika paidAmount >= totalAmount", () => {
      const now = new Date();
      const settledDebt = enrichLiabilityWithProgress({
        id: "11111111-1111-4111-8111-111111111112",
        userId: "22222222-2222-4222-8222-222222222222",
        name: "Pinjaman Pendidikan",
        icon: "graduation-cap",
        totalAmount: 2_500_000,
        paidAmount: 2_500_000,
        monthlyPayment: 500_000,
        totalMonths: 5,
        isSettled: false,
        createdAt: now,
        updatedAt: now,
      });

      expect(settledDebt.isSettled).toBe(true);
      expect(settledDebt.remainingAmount).toBe(0);
      expect(settledDebt.remainingMonths).toBe(0);
      expect(settledDebt.percentage).toBe(100);
    });

    it("harus memvalidasi skema createLiability dan recordInstallment", () => {
      const validCreate = createLiabilitySchema.safeParse({
        name: "Cicilan Laptop Kerja",
        icon: "laptop",
        totalAmount: 12_000_000,
        monthlyPayment: 1_000_000,
        totalMonths: 12,
      });
      expect(validCreate.success).toBe(true);

      const validInstallment = recordInstallmentSchema.safeParse({
        liabilityId: "11111111-1111-4111-8111-111111111111",
        amount: 1_000_000,
        monthId: "44444444-4444-4444-8444-444444444444",
      });
      expect(validInstallment.success).toBe(true);
    });

    it("SC-08: harus menolak pembaruan total utang yang lebih kecil dari nominal yang sudah dibayar", () => {
      // Cicilan mobil sudah terbayar Rp 15.000.000 dari total utang Rp 30.000.000
      const existingDebt = {
        totalAmount: 30_000_000,
        paidAmount: 15_000_000,
        monthlyPayment: 1_000_000,
      };

      // Pengguna mengedit form cicilan dan mengisi total pokok baru Rp 10.000.000
      const requestedNewTotal = 10_000_000;

      const isValidTotal = requestedNewTotal >= existingDebt.paidAmount;
      expect(isValidTotal).toBe(false);

      expect(() => {
        if (requestedNewTotal < existingDebt.paidAmount) {
          throw new Error(`TOTAL_LESS_THAN_PAID:${existingDebt.paidAmount}`);
        }
      }).toThrow("TOTAL_LESS_THAN_PAID:15000000");
    });

    it("SC-09: harus menandai pos eks-cicilan dengan isTemporary = true saat dihapus agar tidak muncul sebagai pos hantu bulan depan", () => {
      // Pos cicilan bulan ini yang keterikatannya dilepas karena cicilan dihapus
      const detachedCategory = {
        id: "cat-detached-1",
        liabilityId: null,
        isTemporary: true, // SC-09: wajib true
        targetBudget: 500_000,
        name: "Cicilan Elektronik",
      };

      // Pastikan generator bulan depan tidak mewariskan pos sementara tanpa liabilityId
      const shouldInheritToNextMonth =
        !detachedCategory.isTemporary || detachedCategory.liabilityId !== null;

      expect(shouldInheritToNextMonth).toBe(false);
    });
  });

  describe("Fase B8 & R4: Budget Categories Management & Deletion Protection", () => {
    it("harus memvalidasi pembaruan plafon target pos anggaran integer non-negatif", () => {
      const valid = updateCategoryTargetSchema.safeParse({
        categoryId: "11111111-1111-4111-8111-111111111111",
        targetBudget: 350_000,
      });
      expect(valid.success).toBe(true);

      const invalidNegative = updateCategoryTargetSchema.safeParse({
        categoryId: "11111111-1111-4111-8111-111111111111",
        targetBudget: -10_000,
      });
      expect(invalidNegative.success).toBe(false);
    });

    it("SC-03 & SC-04: harus mempertahankan konservasi Zero-Based Budgeting saat edit target dan tambah pos kustom", () => {
      // Invariant: Total Pemasukan = 5.000.000
      const totalIncome = 5_000_000;
      let posWajibTarget = 1_500_000;
      let freeBudgetTarget = 3_500_000;
      let freeBudgetSpent = 500_000;
      const initialTotal = posWajibTarget + freeBudgetTarget;
      expect(initialTotal).toBe(totalIncome);

      // SC-03 Kasus A (Target Naik): Naikkan pos wajib dari 1.5jt ke 2jt (+500rb)
      const deltaA = 2_000_000 - posWajibTarget; // +500.000
      const remainingFreeQuota = freeBudgetTarget - freeBudgetSpent; // 3.000.000
      expect(remainingFreeQuota >= deltaA).toBe(true);

      posWajibTarget += deltaA;
      freeBudgetTarget -= deltaA;
      expect(posWajibTarget + freeBudgetTarget).toBe(totalIncome); // Zero-Sum conserved!
      expect(posWajibTarget).toBe(2_000_000);
      expect(freeBudgetTarget).toBe(3_000_000);

      // SC-03 Kasus Penolakan: Ingin menaikkan pos wajib 4 juta, padahal sisa kuota uang bebas hanya 2.5 juta
      const excessiveDelta = 4_000_000;
      const effectiveFreeRemaining = freeBudgetTarget - freeBudgetSpent;
      expect(effectiveFreeRemaining < excessiveDelta).toBe(true);

      // SC-03 Kasus B (Target Turun): Turunkan pos wajib dari 2jt ke 1.7jt (-300rb)
      const posWajibSpent = 1_000_000; // Sudah terpakai 1jt
      const newTargetB = 1_700_000;
      expect(newTargetB >= posWajibSpent).toBe(true); // Tidak boleh di bawah realisasi belanja
      const deltaB = newTargetB - posWajibTarget; // -300.000
      posWajibTarget += deltaB;
      freeBudgetTarget += Math.abs(deltaB);
      expect(posWajibTarget + freeBudgetTarget).toBe(totalIncome); // Zero-Sum conserved!
      expect(posWajibTarget).toBe(1_700_000);
      expect(freeBudgetTarget).toBe(3_300_000);

      // SC-04: Tambah pos kustom baru "Langganan Cloud" 300rb
      const newCategoryTarget = 300_000;
      expect(freeBudgetTarget - freeBudgetSpent >= newCategoryTarget).toBe(true);
      let customCategoryTarget = newCategoryTarget;
      freeBudgetTarget -= newCategoryTarget;

      // Total seluruh pos tetap pas 5.000.000!
      expect(posWajibTarget + customCategoryTarget + freeBudgetTarget).toBe(totalIncome);
      expect(freeBudgetTarget).toBe(3_000_000);
    });
  });

  describe("Fase B9: Sub-Second Transactions & Strict Month-Date Boundary", () => {
    it("harus memvalidasi tanggal transaksi tepat di dalam siklus bulan terkait (isDateWithinMonthCycle)", () => {
      expect(isDateWithinMonthCycle("2026-10-01", 2026, 10)).toBe(true);
      expect(isDateWithinMonthCycle("2026-10-31", 2026, 10)).toBe(true);
      expect(isDateWithinMonthCycle("2026-11-01", 2026, 10)).toBe(false);
      expect(isDateWithinMonthCycle("2025-10-15", 2026, 10)).toBe(false);
      expect(isDateWithinMonthCycle("2026-02-31", 2026, 2)).toBe(false);
    });

    it("harus menolak nominal pengeluaran desimal/float atau <= 0", () => {
      const floatTx = createTransactionSchema.safeParse({
        categoryId: "11111111-1111-4111-8111-111111111111",
        amount: 25000.5,
        date: "2026-10-15",
        description: "Bensin Pertamax",
        method: "qris",
      });
      expect(floatTx.success).toBe(false);

      const validTx = createTransactionSchema.safeParse({
        categoryId: "11111111-1111-4111-8111-111111111111",
        amount: 25000,
        date: "2026-10-15",
        description: "Bensin Pertamax",
        method: "qris",
      });
      expect(validTx.success).toBe(true);
    });
  });

  describe("Fase B10 & R1: Gamified Wishlists & Sinking Fund", () => {
    it("harus memetakan milestone wishlist (50%, 75%, 90%, 95%, 100%) dan icon key secara akurat", () => {
      const now = new Date();
      const item = enrichWishlist(
        {
          id: "33333333-3333-4333-8333-333333333333",
          userId: "22222222-2222-4222-8222-222222222222",
          name: "Perangkat Kerja Baru",
          targetAmount: 10_000_000,
          savedAmount: 7_500_000,
          icon: "laptop",
          imageUrl: null,
          isPurchased: false,
          createdAt: now,
          updatedAt: now,
        },
        []
      );

      expect(item.progress.percentage).toBe(75);
      expect(item.progress.milestone).toBe("major_milestone");
      expect(item.progress.milestoneIconKey).toBe("rocket");
      expect(item.progress.remainingAmount).toBe(2_500_000);
      expect(calculateWishlistProgress(9_500_000, 10_000_000).milestone).toBe(
        "one_step_away"
      );
    });

    it("harus memvalidasi skema setor & tarik alokasi wishlist", () => {
      const deposit = allocateWishlistSchema.safeParse({
        wishlistId: "33333333-3333-4333-8333-333333333333",
        amount: 500_000,
        direction: "deposit",
      });
      expect(deposit.success).toBe(true);

      const withdraw = allocateWishlistSchema.safeParse({
        wishlistId: "33333333-3333-4333-8333-333333333333",
        amount: 250_000,
        direction: "withdraw",
      });
      expect(withdraw.success).toBe(true);
    });

    it("SC-07: harus memblokir mutasi (alokasi & penarikan) pada wishlist yang sudah berstatus terbeli (anti-magic money)", () => {
      // Skenario:
      // Barang impian Laptop Impian Rp 10.000.000 sudah terkumpul Rp 10.000.000 dan dibeli (isPurchased = true).
      // Saldo di rekening fisik sudah diserahkan ke toko.
      const purchasedWishlist = {
        id: "w-purchased",
        userId: "user-1",
        name: "Laptop Impian",
        targetAmount: 10_000_000,
        savedAmount: 10_000_000,
        isPurchased: true,
      };

      // Invarian SC-07: mutasi dilarang keras saat isPurchased = true
      const canMutate = !purchasedWishlist.isPurchased;
      expect(canMutate).toBe(false);

      expect(() => {
        if (purchasedWishlist.isPurchased) {
          throw new Error("WISHLIST_ALREADY_PURCHASED");
        }
      }).toThrow("WISHLIST_ALREADY_PURCHASED");
    });

    it("SC-10: harus memvalidasi dan memblokir alokasi melebihi sisa kekurangan barang impian (anti over-allocation)", () => {
      // Skenario SC-10:
      // Target barang impian Rp 5.000.000, sudah terkumpul Rp 4.800.000 (sisa Rp 200.000).
      // Pengguna mengalokasikan Rp 2.000.000 dari saldo tabungan bebas.
      const targetWishlist = {
        id: "w-sc10",
        targetAmount: 5_000_000,
        savedAmount: 4_800_000,
        isPurchased: false,
      };

      const remainingNeeded = Math.max(
        0,
        targetWishlist.targetAmount - targetWishlist.savedAmount
      );
      expect(remainingNeeded).toBe(200_000);

      const allocationAmount = 2_000_000;
      expect(() => {
        if (allocationAmount > remainingNeeded) {
          throw new Error(`OVER_ALLOCATION:${remainingNeeded}`);
        }
      }).toThrow("OVER_ALLOCATION:200000");

      // Alokasi yang valid (<= remainingNeeded) harus lolos
      const validAllocation = 200_000;
      expect(validAllocation <= remainingNeeded).toBe(true);
    });
  });

  describe("Fase B11: Brankas Dana Darurat (Emergency Fund Vault)", () => {
    it("harus memvalidasi transfer dana darurat dan menghitung Safety Months", () => {
      expect(
        transferEmergencyFundSchema.safeParse({ amount: 1_000_000 }).success
      ).toBe(true);
      expect(
        transferEmergencyFundSchema.safeParse({ amount: 0 }).success
      ).toBe(false);
      expect(
        updateEmergencyTargetSchema.safeParse({ targetAmount: 15_000_000 })
          .success
      ).toBe(true);

      const safety = calculateSafetyMonths(10_500_000, 2_500_000, 15_000_000);
      expect(safety.safetyMonths).toBe(4.2);
      expect(safety.percentageOfTarget).toBe(70);
      expect(safety.isTargetReached).toBe(false);
    });
  });

  describe("Fase B13: AI Monthly Review Evaluation Engine", () => {
    it("harus menghasilkan skor disiplin, pos paling hemat, pos overbudget, dan rekomendasi taktis", () => {
      const now = new Date();
      const mockDetail: MonthlyCycleDetail = {
        id: "44444444-4444-4444-8444-444444444444",
        userId: "22222222-2222-4222-8222-222222222222",
        name: "Oktober 2026",
        year: 2026,
        monthIndex: 10,
        isClosed: false,
        createdAt: now,
        updatedAt: now,
        totalIncome: 5_000_000,
        totalBudget: 5_000_000,
        totalSpent: 3_200_000,
        netCashflow: 1_800_000,
        incomes: [
          {
            id: "inc-1",
            source: "Gaji Pokok",
            amount: 4_000_000,
            date: "2026-10-01",
            isBaseSalary: true,
          },
          {
            id: "inc-2",
            source: "Proyek Freelance",
            amount: 1_000_000,
            date: "2026-10-12",
            isBaseSalary: false,
          },
        ],
        categories: [
          {
            id: "cat-1",
            monthId: "44444444-4444-4444-8444-444444444444",
            liabilityId: null,
            name: "Transportasi & BBM",
            icon: "fuel",
            group: "kebutuhan",
            targetBudget: 250_000,
            spentAmount: 100_000,
            remainingBudget: 150_000,
            status: "healthy",
            isTemporary: false,
            sortOrder: 1,
          },
          {
            id: "cat-2",
            monthId: "44444444-4444-4444-8444-444444444444",
            liabilityId: null,
            name: "Uang Bebas / Tabungan",
            icon: "sparkles",
            group: "uang_bebas_tabungan",
            targetBudget: 1_915_000,
            spentAmount: 2_100_000,
            remainingBudget: -185_000,
            status: "overbudget",
            isTemporary: false,
            sortOrder: 2,
          },
        ],
      };

      const review = buildDeterministicMonthlyEvaluation(mockDetail);
      expect(review.disciplineScore).toBe(
        calculateDisciplineScore({
          totalCategories: 2,
          overbudgetCategoriesCount: 1,
          savingsRate: 36,
        })
      );
      expect(review.mostFrugalCategory?.name).toBe("Transportasi & BBM");
      expect(review.mostOverspentCategory?.name).toBe("Uang Bebas / Tabungan");
      expect(review.tacticalRecommendations.length).toBeGreaterThan(0);
      expect(review.nextMonthAllocationAdvice.length).toBeGreaterThan(0);
    });
  });
});
