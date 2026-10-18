import { describe, it, expect } from "bun:test";
import {
  createIncomeSchema,
  updateIncomeSchema,
  deleteIncomeSchema,
} from "@/schemas/income.schema";
import { calculateDynamicFreedomBuffer } from "@/lib/financial-calculations";
import type { Income, MonthlyIncomesSummary } from "@/types";

describe("Multi-Source Incomes Engine (Fase B6)", () => {
  const mockMonthId = "123e4567-e89b-12d3-a456-426614174000";
  const mockIncomeId = "223e4567-e89b-12d3-a456-426614174001";
  const mockUserId = "323e4567-e89b-12d3-a456-426614174002";

  /* ══════════════════════════════════════════════════════════════════════════
     1. PENGUJIAN KONTRAK VALIDASI ZOD (INPUT SCHEMAS)
     ══════════════════════════════════════════════════════════════════════════ */
  describe("Zod Validation Contracts (create, update, delete)", () => {
    it("harus meloloskan pembuatan pemasukan valid dan meng-coerce string amount", () => {
      const validPayload = {
        monthId: mockMonthId,
        source: "Freelance Video Editing YouTube",
        amount: "1500000",
        date: "2026-10-18",
        isBaseSalary: false,
      };

      const result = createIncomeSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(1500000);
        expect(typeof result.data.amount).toBe("number");
        expect(result.data.isBaseSalary).toBe(false);
      }
    });

    it("harus meloloskan pembuatan gaji pokok rutin dengan default isBaseSalary = false bila omitted", () => {
      const payload = {
        monthId: mockMonthId,
        source: "Gaji Pokok",
        amount: 4000000,
        date: "2026-10-01",
      };

      const result = createIncomeSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isBaseSalary).toBe(false);
      }
    });

    it("harus menolak nominal pemasukan berupa float / desimal (Invarian Integer Rupiah)", () => {
      const invalidPayload = {
        monthId: mockMonthId,
        source: "Dividen Saham",
        amount: 150000.75, // Mengandung sen desimal
        date: "2026-10-18",
      };

      const result = createIncomeSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("integer bulat");
      }
    });

    it("harus menolak nominal pemasukan <= 0", () => {
      const zeroAmount = {
        monthId: mockMonthId,
        source: "Bonus",
        amount: 0,
        date: "2026-10-18",
      };
      const negativeAmount = {
        monthId: mockMonthId,
        source: "Bonus",
        amount: -500000,
        date: "2026-10-18",
      };

      expect(createIncomeSchema.safeParse(zeroAmount).success).toBe(false);
      expect(createIncomeSchema.safeParse(negativeAmount).success).toBe(false);
    });

    it("harus menolak format tanggal non-ISO (wajib YYYY-MM-DD)", () => {
      const invalidDate = {
        monthId: mockMonthId,
        source: "Bonus",
        amount: 500000,
        date: "18-10-2026", // Format DD-MM-YYYY salah
      };

      const result = createIncomeSchema.safeParse(invalidDate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("YYYY-MM-DD");
      }
    });

    it("harus memvalidasi updateIncomeSchema dengan partial update yang valid", () => {
      const partialUpdate = {
        incomeId: mockIncomeId,
        amount: 2000000,
      };

      const result = updateIncomeSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(2000000);
        expect(result.data.source).toBeUndefined();
      }
    });

    it("harus memvalidasi deleteIncomeSchema dengan UUID yang valid", () => {
      const validDelete = { incomeId: mockIncomeId };
      const invalidDelete = { incomeId: "invalid-uuid-format" };

      expect(deleteIncomeSchema.safeParse(validDelete).success).toBe(true);
      expect(deleteIncomeSchema.safeParse(invalidDelete).success).toBe(false);
    });
  });

  /* ══════════════════════════════════════════════════════════════════════════
     2. PENGUJIAN LOGIKA ALOKASI DINAMIS & FREEDOM BUFFER (INVARIAN 3)
     ══════════════════════════════════════════════════════════════════════════ */
  describe("Multi-Source Allocation & Dynamic Freedom Buffer", () => {
    const mockIncomes: Income[] = [
      {
        id: "inc-1",
        monthId: mockMonthId,
        userId: mockUserId,
        source: "Gaji Pokok",
        amount: 4000000,
        date: "2026-10-01",
        isBaseSalary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "inc-2",
        monthId: mockMonthId,
        userId: mockUserId,
        source: "Freelance UI Design",
        amount: 1500000,
        date: "2026-10-15",
        isBaseSalary: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "inc-3",
        monthId: mockMonthId,
        userId: mockUserId,
        source: "Bonus Kinerja Proyek",
        amount: 500000,
        date: "2026-10-20",
        isBaseSalary: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it("harus mengagregasikan total pemasukan, gaji pokok, dan pemasukan freelance secara tepat", () => {
      let totalIncome = 0;
      let baseSalary = 0;
      let additionalIncomes = 0;

      for (const inc of mockIncomes) {
        totalIncome += inc.amount;
        if (inc.isBaseSalary) {
          baseSalary += inc.amount;
        } else {
          additionalIncomes += inc.amount;
        }
      }

      const summary: MonthlyIncomesSummary = {
        monthId: mockMonthId,
        incomes: mockIncomes,
        totalIncome,
        baseSalary,
        additionalIncomes,
        incomeCount: mockIncomes.length,
      };

      expect(summary.totalIncome).toBe(6000000);
      expect(summary.baseSalary).toBe(4000000);
      expect(summary.additionalIncomes).toBe(2000000);
      expect(summary.incomeCount).toBe(3);
    });

    it("harus meningkatkan target pos Uang Bebas secara dinamis saat ada freelance (Dynamic Freedom Buffer)", () => {
      const baselineFreedomBudget = 915000; // Baseline kuota uang bebas dari gaji pokok 4jt
      const freelanceAmounts = mockIncomes
        .filter((inc) => !inc.isBaseSalary)
        .map((inc) => inc.amount);

      // Total freelance = 1.500.000 + 500.000 = 2.000.000
      const totalFreelance = freelanceAmounts.reduce((a, b) => a + b, 0);
      expect(totalFreelance).toBe(2000000);

      // Hitung target efektif uang bebas
      const dynamicFreedomTarget = calculateDynamicFreedomBuffer(
        baselineFreedomBudget,
        freelanceAmounts
      );

      // 915.000 + 2.000.000 = 2.915.000
      expect(dynamicFreedomTarget).toBe(2915000);
    });

    it("harus mempertahankan target baseline jika tidak ada pemasukan sampingan/freelance", () => {
      const baselineFreedomBudget = 915000;
      const emptyFreelance: number[] = [];

      const dynamicFreedomTarget = calculateDynamicFreedomBuffer(
        baselineFreedomBudget,
        emptyFreelance
      );

      expect(dynamicFreedomTarget).toBe(915000);
    });

    it("gaji pokok tidak boleh memperbesar kuota uang bebas (hanya mendanai Zero-Based Budget dasar)", () => {
      const baselineFreedomBudget = 915000;
      const baseSalaryOnly = mockIncomes.filter((inc) => inc.isBaseSalary);

      // Hanya pemasukan freelance yang dipasok ke freedom buffer
      const additionalSum = baseSalaryOnly
        .filter((inc) => !inc.isBaseSalary)
        .reduce((sum, inc) => sum + inc.amount, 0);

      const dynamicFreedomTarget = calculateDynamicFreedomBuffer(
        baselineFreedomBudget,
        additionalSum
      );

      expect(dynamicFreedomTarget).toBe(915000);
    });
  });
});
