/// <reference types="bun-types" />
import { describe, expect, it, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

// Mock next/navigation
mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
  }),
}));

import { ExecutiveWealthBento } from "../ExecutiveWealthBento";
import type { SavingsVaultSummary } from "@/types/savings";

const mockVault: SavingsVaultSummary = {
  id: "v-test-1",
  userId: "u-test-1",
  freeSavingsBalance: 4_500_000,
  emergencyFundBalance: 5_000_000,
  emergencyFundTarget: 15_000_000,
  totalVaultBalance: 9_500_000,
  percentageOfTarget: 33,
  isTargetReached: false,
  safetyMonths: 3.5,
  monthlyFixedExpense: 1_420_000,
  updatedAt: new Date(),
};

describe("ExecutiveWealthBento (Tier 1 Hero Cockpit)", () => {
  it("renders Total Brankas Simpanan and Cashflow Cockpit cleanly without redundant metrics", () => {
    const html = renderToString(
      <ExecutiveWealthBento
        vault={mockVault}
        totalIncome={5_000_000}
        totalSpent={1_932_000}
        remainingCash={3_068_000}
        usageRatio={39}
        monthName="November 2026"
        baseSalary={5_000_000}
        additionalIncomes={0}
      />
    );

    // 1. Verifikasi Hero Brankas Simpanan
    expect(html).toContain("Total Brankas Simpanan");
    expect(html).toContain("Rp 9.500.000");
    expect(html).toContain("Tabungan Bebas");
    expect(html).toContain("Rp 4.500.000");
    expect(html).toContain("Dana Darurat");
    expect(html).toContain("Rp 5.000.000");
    expect(html).toContain("3,5");
    expect(html).toContain("Bulan Aman");

    // 2. Verifikasi Cockpit Arus Kas Bulan Berjalan
    expect(html).toContain("Arus Kas");
    expect(html).toContain("November 2026");
    expect(html).toContain("Sisa Kuota Uang Bebas (Surplus)");
    expect(html).toContain("+Rp 3.068.000");
    expect(html).toContain("Anggaran Sehat");
    expect(html).toContain("Total Pemasukan");
    expect(html).toContain("Rp 5.000.000");
    expect(html).toContain("Realisasi Belanja");
    expect(html).toContain("Rp 1.932.000");
    expect(html).toContain("39");
    expect(html).toContain("dari batas kas");

    // 3. Verifikasi Tombol Navigasi ke Halaman Detail Brankas
    expect(html).toContain("Buka Detail Brankas");
    expect(html).not.toContain("Kelola &amp; Setor Brankas");

    // 4. Invarian Desain: Zero monospace
    expect(html).toContain("tabular-nums");
    const forbiddenMono = ["font", "mono"].join("-");
    expect(html).not.toContain(forbiddenMono);
  });

  it("renders warning status when usage is between 71% and 90%", () => {
    const html = renderToString(
      <ExecutiveWealthBento
        vault={mockVault}
        totalIncome={5_000_000}
        totalSpent={4_000_000}
        remainingCash={1_000_000}
        usageRatio={80}
        monthName="November 2026"
      />
    );

    expect(html).toContain("Mendekati Batas &gt;70%");
    expect(html).toContain("border-amber-500");
    expect(html).toContain("+Rp 1.000.000");
  });

  it("renders overbudget/deficit status when spending exceeds income", () => {
    const html = renderToString(
      <ExecutiveWealthBento
        vault={mockVault}
        totalIncome={5_000_000}
        totalSpent={5_500_000}
        remainingCash={-500_000}
        usageRatio={110}
        monthName="November 2026"
      />
    );

    expect(html).toContain("Defisit Kas");
    expect(html).toContain("border-rose-500");
    expect(html).toContain("-Rp 500.000");
  });
});
