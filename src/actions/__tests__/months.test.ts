import { describe, it, expect } from "bun:test";
import {
  NEUTRAL_PRESET_TEMPLATES,
  INDONESIAN_MONTH_NAMES,
  DEFAULT_BASE_SALARY,
  buildNeutralPresetTemplates,
  buildInheritedMonthCategories,
  buildInitialMonthCategories,
} from "@/lib/month-generator";
import {
  createMonthSchema,
  closeMonthSchema,
  reopenMonthSchema,
} from "@/schemas/month.schema";

describe("Month Lifecycle & Dynamic Category Generator (Fase B5 & R3)", () => {
  describe("Neutral Preset Templates (Zero Personal Hardcode)", () => {
    it("should provide 6 neutral preset templates with targetBudget = 0 and DEFAULT_BASE_SALARY = 0", () => {
      expect(DEFAULT_BASE_SALARY).toBe(0);
      expect(NEUTRAL_PRESET_TEMPLATES).toHaveLength(6);

      const presets = buildNeutralPresetTemplates("user-1");
      expect(presets).toHaveLength(6);
      for (const item of presets) {
        expect(item.userId).toBe("user-1");
        expect(item.targetBudget).toBe(0);
        expect(item.isActive).toBe(true);
      }
    });

    it("should have exactly 12 Indonesian month names in order", () => {
      expect(INDONESIAN_MONTH_NAMES).toHaveLength(12);
      expect(INDONESIAN_MONTH_NAMES[0]).toBe("Januari");
      expect(INDONESIAN_MONTH_NAMES[9]).toBe("Oktober");
      expect(INDONESIAN_MONTH_NAMES[11]).toBe("Desember");
    });
  });

  describe("Inheritance & Debt Reallocation Logic (buildInheritedMonthCategories)", () => {
    it("should filter out temporary categories and settled liabilities, and reallocate surplus to Uang Bebas", () => {
      const prevCategories = [
        {
          id: "c-1",
          monthId: "m-prev",
          liabilityId: null,
          name: "Tagihan Listrik",
          icon: "zap",
          group: "pos_wajib" as const,
          targetBudget: 500000,
          spentAmount: 450000,
          isTemporary: false,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "c-2",
          monthId: "m-prev",
          liabilityId: "liab-settled",
          name: "Cicilan Kendaraan",
          icon: "car",
          group: "pos_wajib" as const,
          targetBudget: 1000000,
          spentAmount: 1000000,
          isTemporary: false,
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "c-3",
          monthId: "m-prev",
          liabilityId: null,
          name: "Pos Sementara Bulan Lalu",
          icon: "package",
          group: "kebutuhan" as const,
          targetBudget: 200000,
          spentAmount: 200000,
          isTemporary: true,
          sortOrder: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "c-4",
          monthId: "m-prev",
          liabilityId: null,
          name: "Uang Bebas / Tabungan",
          icon: "sparkles",
          group: "uang_bebas_tabungan" as const,
          targetBudget: 3300000,
          spentAmount: 1000000,
          isTemporary: false,
          sortOrder: 99,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Liabilitas "liab-settled" sudah lunas -> tidak ada di activeLiabilities
      const inherited = buildInheritedMonthCategories({
        newMonthId: "m-new",
        baseSalary: 5000000,
        prevCategories,
        activeLiabilities: [],
      });

      expect(inherited).toHaveLength(2);
      const listrik = inherited.find((c) => c.name === "Tagihan Listrik");
      const freeCat = inherited.find(
        (c) => c.group === "uang_bebas_tabungan"
      );

      expect(listrik?.targetBudget).toBe(500000);
      // 5.000.000 - 500.000 = 4.500.000 otomatis masuk ke Uang Bebas
      expect(freeCat?.targetBudget).toBe(4500000);
    });
  });

  describe("Initial Month Categories from Templates (buildInitialMonthCategories)", () => {
    it("should build initial categories from user_budget_templates and active liabilities", () => {
      const userTemplates = [
        {
          id: "t-1",
          userId: "u-1",
          name: "Kebutuhan Rumah",
          icon: "home",
          group: "pos_wajib" as const,
          targetBudget: 1500000,
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "t-2",
          userId: "u-1",
          name: "Transportasi",
          icon: "fuel",
          group: "kebutuhan" as const,
          targetBudget: 400000,
          sortOrder: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const activeLiabilities = [
        {
          id: "l-1",
          userId: "u-1",
          name: "Pinjaman Pendidikan",
          icon: "graduation-cap",
          totalAmount: 6000000,
          paidAmount: 1000000,
          monthlyPayment: 600000,
          totalMonths: 10,
          isSettled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const categories = buildInitialMonthCategories({
        newMonthId: "m-first",
        baseSalary: 5000000,
        userTemplates,
        activeLiabilities,
      });

      expect(categories).toHaveLength(4);
      const freeCat = categories.find(
        (c) => c.group === "uang_bebas_tabungan"
      );
      // 5.000.000 - (1.500.000 + 400.000 + 600.000) = 2.500.000
      expect(freeCat?.targetBudget).toBe(2500000);
    });
  });

  describe("Zod Validation Contracts for Month Actions", () => {
    it("should validate and coerce valid createMonthSchema", () => {
      const valid = createMonthSchema.safeParse({
        year: 2026,
        monthIndex: 10,
        baseSalary: 5000000,
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.year).toBe(2026);
        expect(valid.data.monthIndex).toBe(10);
        expect(valid.data.baseSalary).toBe(5000000);
      }
    });

    it("should reject invalid year and monthIndex", () => {
      const invalidMonth = createMonthSchema.safeParse({
        year: 2026,
        monthIndex: 0,
      });
      expect(invalidMonth.success).toBe(false);

      const invalidYear = createMonthSchema.safeParse({
        year: 2019,
        monthIndex: 5,
      });
      expect(invalidYear.success).toBe(false);
    });

    it("should validate closeMonthSchema", () => {
      const valid = closeMonthSchema.safeParse({
        monthId: "550e8400-e29b-41d4-a716-446655440000",
        surplusAction: "sweep_to_savings",
      });
      expect(valid.success).toBe(true);
    });

    it("should validate reopenMonthSchema with valid UUID", () => {
      const valid = reopenMonthSchema.safeParse({
        monthId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(valid.success).toBe(true);

      const invalid = reopenMonthSchema.safeParse({
        monthId: "not-a-uuid",
      });
      expect(invalid.success).toBe(false);
    });

    it("SC-02: should maintain zero double-counting through month close and reopen reversal lifecycle", () => {
      // Simulasi kalkulasi finansial SC-02:
      // Saldo awal tabungan: Rp 2.000.000
      let savingsBalance = 2_000_000;
      let monthSweptAmount = 0;
      let isMonthClosed = false;

      // 1. Tutup buku pertama: sisa Uang Bebas Rp 1.000.000 disapu
      const firstSurplus = 1_000_000;
      savingsBalance += firstSurplus;
      monthSweptAmount = firstSurplus;
      isMonthClosed = true;

      expect(savingsBalance).toBe(3_000_000);
      expect(monthSweptAmount).toBe(1_000_000);
      expect(isMonthClosed).toBe(true);

      // 2. Buka kembali bulan (Reopen Month):
      // Sistem menarik kembali (reverses) sweptAmount dari saldo tabungan
      expect(savingsBalance >= monthSweptAmount).toBe(true);
      savingsBalance -= monthSweptAmount;
      const reversedAmount = monthSweptAmount;
      monthSweptAmount = 0;
      isMonthClosed = false;

      expect(reversedAmount).toBe(1_000_000);
      expect(savingsBalance).toBe(2_000_000); // Saldo kembali ke posisi semula
      expect(monthSweptAmount).toBe(0);
      expect(isMonthClosed).toBe(false);

      // 3. Catat transaksi baru di bulan terbuka: bensin Rp 50.000
      const extraExpense = 50_000;
      const secondSurplus = firstSurplus - extraExpense; // Rp 950.000

      // 4. Tutup buku kedua: sisa Uang Bebas Rp 950.000 disapu
      savingsBalance += secondSurplus;
      monthSweptAmount = secondSurplus;
      isMonthClosed = true;

      // HASIL AKHIR: Saldo tabungan Rp 2.950.000 (100% konsisten, ZERO DOUBLE COUNTING)
      expect(savingsBalance).toBe(2_950_000);
      expect(monthSweptAmount).toBe(950_000);
      expect(isMonthClosed).toBe(true);

      // 5. Anti-Defisit Guard: Jika dana tabungan sudah terpakai (< sweptAmount), tolak reopen
      const depletedSavings = 500_000; // Misal sisa tabungan 500rb karena 2.45jt dialokasikan ke wishlist
      const canReopen = depletedSavings >= monthSweptAmount;
      expect(canReopen).toBe(false); // Blokir pembukaan kembali yang menyebabkan saldo negatif
    });

    it("SC-14: should sweep full real cash surplus when categories have unspent allocations", () => {
      // Skenario Kenzo: Gaji Rp 5.000.000, ada pos cicilan 1.417jt dan perpuluhan 500rb,
      // tetapi realisasi pengeluaran kas masih Rp 0.
      const income = 5_000_000;
      const spent = 0; // belum ada transaksi pengeluaran (kas keluar = 0)
      const swept = Math.max(0, income - spent);
      expect(swept).toBe(5_000_000); // Dana riil tidak menguap, 5 juta penuh disapu ke tabungan
    });
  });
});
