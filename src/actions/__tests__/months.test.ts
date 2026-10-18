import { describe, it, expect } from "bun:test";
import {
  BASELINE_CATEGORIES_CONFIG,
  INDONESIAN_MONTH_NAMES,
  DEFAULT_BASE_SALARY,
} from "@/lib/month-generator";
import { createMonthSchema, closeMonthSchema } from "@/schemas/month.schema";

describe("Month Lifecycle & Category Generator (Fase B5 Refactored)", () => {
  describe("Baseline Categories Configuration (Fallback for New Users)", () => {
    it("should contain exactly 7 baseline categories", () => {
      expect(BASELINE_CATEGORIES_CONFIG).toHaveLength(7);
    });

    it("should balance to exactly Rp 4.000.000 (Zero-Based Budget baseline)", () => {
      const totalBaselineBudget = BASELINE_CATEGORIES_CONFIG.reduce(
        (sum, item) => sum + item.baseTarget,
        0
      );
      expect(totalBaselineBudget).toBe(DEFAULT_BASE_SALARY);
      expect(totalBaselineBudget).toBe(4000000);
    });

    it("should correctly partition into the 3 invariant category groups", () => {
      const posWajib = BASELINE_CATEGORIES_CONFIG.filter((c) => c.group === "pos_wajib");
      const kebutuhan = BASELINE_CATEGORIES_CONFIG.filter((c) => c.group === "kebutuhan");
      const uangBebas = BASELINE_CATEGORIES_CONFIG.filter((c) => c.group === "uang_bebas_tabungan");

      expect(posWajib).toHaveLength(4); // Perpuluhan, iPhone, Mama, Listrik
      expect(kebutuhan).toHaveLength(2); // Bensin, Jajan Popo
      expect(uangBebas).toHaveLength(1); // Uang Bebas / Tabungan

      const sumPosWajib = posWajib.reduce((s, c) => s + c.baseTarget, 0);
      const sumKebutuhan = kebutuhan.reduce((s, c) => s + c.baseTarget, 0);
      const sumUangBebas = uangBebas.reduce((s, c) => s + c.baseTarget, 0);

      expect(sumPosWajib).toBe(2635000); // 400k + 735k + 500k + 1000k
      expect(sumKebutuhan).toBe(450000); // 250k + 200k
      expect(sumUangBebas).toBe(915000); // Baseline Uang Bebas

      // Total Pos Wajib + Kebutuhan + Uang Bebas = 4.000.000
      expect(sumPosWajib + sumKebutuhan + sumUangBebas).toBe(4000000);
    });

    it("should have exactly 12 Indonesian month names in order", () => {
      expect(INDONESIAN_MONTH_NAMES).toHaveLength(12);
      expect(INDONESIAN_MONTH_NAMES[0]).toBe("Januari");
      expect(INDONESIAN_MONTH_NAMES[9]).toBe("Oktober");
      expect(INDONESIAN_MONTH_NAMES[11]).toBe("Desember");
    });
  });

  describe("Dynamic Debt Reallocation Logic (Database-Driven Simulation)", () => {
    it("should dynamically add settled liability monthlyPayment from DB to Uang Bebas", () => {
      // Simulasi liabilities yang diambil dari DB
      const mockDbLiabilities = [
        { id: "1", name: "Cicilan iPhone", monthlyPayment: 735000, isSettled: true },
        { id: "2", name: "Talangan Mama", monthlyPayment: 500000, isSettled: false },
      ];

      let reallocatedFromDb = 0;
      for (const l of mockDbLiabilities) {
        if (l.isSettled) {
          reallocatedFromDb += l.monthlyPayment; // Dinamis dari DB, bukan hardcoded!
        }
      }

      expect(reallocatedFromDb).toBe(735000);

      const generatedCategories = [];
      for (const tpl of BASELINE_CATEGORIES_CONFIG) {
        if (tpl.liabilityKeyword === "iphone" && mockDbLiabilities[0].isSettled) continue;

        if (tpl.group === "uang_bebas_tabungan") {
          generatedCategories.push({
            name: tpl.name,
            target: tpl.baseTarget + reallocatedFromDb,
          });
          continue;
        }

        generatedCategories.push({
          name: tpl.name,
          target: tpl.baseTarget,
        });
      }

      expect(generatedCategories).toHaveLength(6);
      const freeCategory = generatedCategories.find((c) => c.name.includes("Uang Bebas"));
      expect(freeCategory?.target).toBe(915000 + 735000); // 1.650.000

      const totalTarget = generatedCategories.reduce((sum, c) => sum + c.target, 0);
      expect(totalTarget).toBe(4000000);
    });

    it("should dynamically handle both liabilities settled from DB", () => {
      const mockDbLiabilities = [
        { id: "1", name: "Cicilan iPhone", monthlyPayment: 735000, isSettled: true },
        { id: "2", name: "Talangan Mama", monthlyPayment: 500000, isSettled: true },
      ];

      let reallocatedFromDb = 0;
      for (const l of mockDbLiabilities) {
        if (l.isSettled) {
          reallocatedFromDb += l.monthlyPayment;
        }
      }

      expect(reallocatedFromDb).toBe(1235000); // 735k + 500k

      const generatedCategories = [];
      for (const tpl of BASELINE_CATEGORIES_CONFIG) {
        if (tpl.liabilityKeyword === "iphone" && mockDbLiabilities[0].isSettled) continue;
        if (tpl.liabilityKeyword === "mama" && mockDbLiabilities[1].isSettled) continue;

        if (tpl.group === "uang_bebas_tabungan") {
          generatedCategories.push({
            name: tpl.name,
            target: tpl.baseTarget + reallocatedFromDb,
          });
          continue;
        }

        generatedCategories.push({
          name: tpl.name,
          target: tpl.baseTarget,
        });
      }

      expect(generatedCategories).toHaveLength(5);
      const freeCategory = generatedCategories.find((c) => c.name.includes("Uang Bebas"));
      expect(freeCategory?.target).toBe(915000 + 1235000); // 2.150.000

      const totalTarget = generatedCategories.reduce((sum, c) => sum + c.target, 0);
      expect(totalTarget).toBe(4000000);
    });
  });

  describe("Zod Validation Contracts for Month Actions", () => {
    it("should validate and coerce valid createMonthSchema", () => {
      const valid = createMonthSchema.safeParse({
        year: 2026,
        monthIndex: 10,
        baseSalary: 4000000,
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.year).toBe(2026);
        expect(valid.data.monthIndex).toBe(10);
        expect(valid.data.baseSalary).toBe(4000000);
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
  });
});
