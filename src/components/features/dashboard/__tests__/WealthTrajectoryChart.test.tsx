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

import { WealthTrajectoryChart } from "../WealthTrajectoryChart";
import { WealthHeroCard } from "../WealthHeroCard";
import { CashflowCockpitCard } from "../CashflowCockpitCard";
import type { SavingsVaultSummary } from "@/types/savings";
import type { AllTimeframeSnapshots } from "@/types/savings-snapshots";

const mockSnapshots: AllTimeframeSnapshots = {
  daily: [
    {
      date: "2026-11-01",
      label: "01 Nov",
      freeSavings: 4_000_000,
      emergencyFund: 5_000_000,
      totalWealth: 9_000_000,
      delta: 0,
    },
    {
      date: "2026-11-15",
      label: "15 Nov",
      freeSavings: 4_500_000,
      emergencyFund: 5_000_000,
      totalWealth: 9_500_000,
      delta: 500_000,
    },
  ],
  weekly: [
    {
      date: "2026-11-03",
      label: "W45",
      freeSavings: 4_000_000,
      emergencyFund: 5_000_000,
      totalWealth: 9_000_000,
      delta: 0,
    },
    {
      date: "2026-11-10",
      label: "W46",
      freeSavings: 4_500_000,
      emergencyFund: 5_000_000,
      totalWealth: 9_500_000,
      delta: 500_000,
    },
  ],
  monthly: [
    {
      date: "2026-10-01",
      label: "Okt",
      freeSavings: 4_000_000,
      emergencyFund: 5_000_000,
      totalWealth: 9_000_000,
      delta: 0,
    },
    {
      date: "2026-11-01",
      label: "Nov",
      freeSavings: 4_500_000,
      emergencyFund: 5_000_000,
      totalWealth: 9_500_000,
      delta: 500_000,
    },
  ],
  yearly: [
    {
      date: "2025-01-01",
      label: "2025",
      freeSavings: 2_000_000,
      emergencyFund: 3_000_000,
      totalWealth: 5_000_000,
      delta: 0,
    },
    {
      date: "2026-01-01",
      label: "2026",
      freeSavings: 4_500_000,
      emergencyFund: 5_000_000,
      totalWealth: 9_500_000,
      delta: 4_500_000,
    },
  ],
};

const mockVault: SavingsVaultSummary = {
  id: "vault-test-1",
  userId: "user-test-1",
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

function stripHtmlComments(str: string): string {
  return str.replace(/<!--.*?-->/g, "");
}

describe("WealthTrajectoryChart (Interactive Recharts)", () => {
  it("renders SSR chart component with controls and labels cleanly", () => {
    const rawHtml = renderToString(
      <WealthTrajectoryChart
        snapshotsByTimeframe={mockSnapshots}
        initialTimeframe="monthly"
      />
    );
    const html = stripHtmlComments(rawHtml);

    // Verifikasi kontrol timeframe
    expect(html).toContain("Harian");
    expect(html).toContain("Mingguan");
    expect(html).toContain("Bulanan");
    expect(html).toContain("Tahunan");

    // Verifikasi mode toggle
    expect(html).toContain("Garis");
    expect(html).toContain("Batang");

    // Invarian Tipografi: zero monospace
    const forbiddenMono = ["font", "mono"].join("-");
    expect(html).not.toContain(forbiddenMono);
  });

  it("renders informative empty state when no wealth history exists", () => {
    const emptySnapshots: AllTimeframeSnapshots = {
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
    };
    const rawHtml = renderToString(
      <WealthTrajectoryChart
        snapshotsByTimeframe={emptySnapshots}
        initialTimeframe="monthly"
      />
    );
    const html = stripHtmlComments(rawHtml);

    expect(html).toContain("Belum ada data riwayat simpanan");
    expect(html).toContain("Grafik akan terisi otomatis");
  });
});

describe("WealthHeroCard (Full-Width Tier 1 Hero)", () => {
  it("renders total vault balance, safety months, sub-vault inset chips, and trajectory chart", () => {
    const rawHtml = renderToString(
      <WealthHeroCard
        vault={mockVault}
        snapshotsByTimeframe={mockSnapshots}
      />
    );
    const html = stripHtmlComments(rawHtml);

    // 1. Headline Saldo & Label
    expect(html).toContain("Total Brankas Simpanan");
    expect(html).toContain("Rp 9.500.000");

    // 2. Safety Months Badge & Action Link
    expect(html).toContain("3,5");
    expect(html).toContain("Bulan Aman");
    expect(html).toContain("Detail Brankas");

    // 3. Sub-Vault Inset Chips (Tabungan Bebas vs Dana Darurat)
    expect(html).toContain("Tabungan Bebas");
    expect(html).toContain("Rp 4.500.000");
    expect(html).toContain("Likuid");

    expect(html).toContain("Dana Darurat");
    expect(html).toContain("Rp 5.000.000");
    expect(html).toContain("33% Target");

    // 4. Invarian Tipografi
    expect(html).toContain("tabular-nums");
    const forbiddenMono = ["font", "mono"].join("-");
    expect(html).not.toContain(forbiddenMono);
  });
});

describe("CashflowCockpitCard (Full-Width Tier 2 Overview)", () => {
  it("renders healthy budget status with green surplus", () => {
    const rawHtml = renderToString(
      <CashflowCockpitCard
        monthName="November 2026"
        totalIncome={5_000_000}
        totalSpent={1_932_000}
        remainingCash={3_068_000}
        usageRatio={39}
        baseSalary={5_000_000}
        additionalIncomes={0}
      />
    );
    const html = stripHtmlComments(rawHtml);

    expect(html).toContain("Arus Kas");
    expect(html).toContain("November 2026");
    expect(html).toContain("Anggaran Sehat");
    expect(html).toContain("Sisa Kuota Uang Bebas (Surplus)");
    expect(html).toContain("+Rp 3.068.000");
    expect(html).toContain("Total Pemasukan");
    expect(html).toContain("Rp 5.000.000");
    expect(html).toContain("Realisasi Belanja");
    expect(html).toContain("Rp 1.932.000");
    expect(html).toContain("Penyerapan Anggaran: 39%");

    // Invarian Tipografi
    expect(html).toContain("tabular-nums");
    const forbiddenMono = ["font", "mono"].join("-");
    expect(html).not.toContain(forbiddenMono);
  });

  it("renders warning status when budget usage is high (>70%)", () => {
    const rawHtml = renderToString(
      <CashflowCockpitCard
        monthName="November 2026"
        totalIncome={5_000_000}
        totalSpent={4_000_000}
        remainingCash={1_000_000}
        usageRatio={80}
        baseSalary={5_000_000}
      />
    );
    const html = stripHtmlComments(rawHtml);

    expect(html).toContain("Mendekati Batas &gt;70%");
    expect(html).toContain("border-amber-500");
    expect(html).toContain("+Rp 1.000.000");
  });

  it("renders overbudget/deficit status when spending exceeds income", () => {
    const rawHtml = renderToString(
      <CashflowCockpitCard
        monthName="November 2026"
        totalIncome={5_000_000}
        totalSpent={5_500_000}
        remainingCash={-500_000}
        usageRatio={110}
        baseSalary={5_000_000}
      />
    );
    const html = stripHtmlComments(rawHtml);

    expect(html).toContain("Defisit Kas");
    expect(html).toContain("border-rose-500");
    expect(html).toContain("text-rose-600");
  });
});
