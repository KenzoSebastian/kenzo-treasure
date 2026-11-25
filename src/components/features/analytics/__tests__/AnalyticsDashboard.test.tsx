/// <reference types="bun-types" />
import { describe, expect, it, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
  }),
}));

import { AnalyticsDashboard } from "../AnalyticsDashboard";
import { ExpenseDonutSection } from "../ExpenseDonutSection";
import type { AnalyticsDashboardData } from "@/types/analytics";

function stripHtmlComments(str: string): string {
  return str.replace(/<!--.*?-->/g, "");
}

const mockAnalyticsData: AnalyticsDashboardData = {
  selectedYear: 2026,
  availableYears: [2025, 2026],
  availableMonths: [
    { id: "m-nov", name: "November 2026", shortMonth: "Nov", monthIndex: 11 },
  ],
  savingsGrowth: [],
  monthlyCashflow: [
    {
      monthId: "m-nov",
      monthName: "November 2026",
      shortMonth: "Nov",
      year: 2026,
      monthIndex: 11,
      income: 5_000_000,
      expense: 2_000_000,
      netSavings: 3_000_000,
      savingsRate: 60,
    },
  ],
  yearlyComparison: [
    {
      year: 2026,
      totalIncome: 5_000_000,
      totalExpense: 2_000_000,
      totalNetSavings: 3_000_000,
      averageSavingsRate: 60,
      monthsCount: 1,
    },
  ],
  categoryDistribution: [
    {
      categoryId: "c-1",
      categoryName: "Makan & Minum",
      icon: "utensils",
      group: "kebutuhan",
      amount: 1_200_000,
      target: 1_500_000,
      percentageOfTotal: 60,
    },
    {
      categoryId: "c-2",
      categoryName: "Tagihan Listrik",
      icon: "zap",
      group: "pos_wajib",
      amount: 800_000,
      target: 700_000,
      percentageOfTotal: 40,
    },
  ],
  categoryDistributionByMonth: {
    "m-nov": [
      {
        categoryId: "c-1",
        categoryName: "Makan & Minum",
        icon: "utensils",
        group: "kebutuhan",
        amount: 1_200_000,
        target: 1_500_000,
        percentageOfTotal: 60,
      },
      {
        categoryId: "c-2",
        categoryName: "Tagihan Listrik",
        icon: "zap",
        group: "pos_wajib",
        amount: 800_000,
        target: 700_000,
        percentageOfTotal: 40,
      },
    ],
    all: [
      {
        categoryId: "c-1",
        categoryName: "Makan & Minum",
        icon: "utensils",
        group: "kebutuhan",
        amount: 1_200_000,
        target: 1_500_000,
        percentageOfTotal: 60,
      },
      {
        categoryId: "c-2",
        categoryName: "Tagihan Listrik",
        icon: "zap",
        group: "pos_wajib",
        amount: 800_000,
        target: 700_000,
        percentageOfTotal: 40,
      },
    ],
  },
};

describe("AnalyticsDashboard (4-Tier Architecture)", () => {
  it("renders all 4 tiers cleanly with KPIs, Cashflow, Donut, and Budget Discipline", () => {
    const html = stripHtmlComments(
      renderToString(<AnalyticsDashboard data={mockAnalyticsData} />)
    );

    // Header Filter Tahun
    expect(html).toContain("Periode Analisis Tahun 2026");
    expect(html).toContain("2025");
    expect(html).toContain("2026");

    // Tier 1: 4 KPI Cards
    expect(html).toContain("Rata-rata Savings Rate");
    expect(html).toContain("60%");
    expect(html).toContain("Surplus Bersih (2026)");
    expect(html).toContain("+Rp 3.000.000");
    expect(html).toContain("Rata-rata Belanja / Bulan");
    expect(html).toContain("Rp 2.000.000");
    expect(html).toContain("Pos Terbesar");
    expect(html).toContain("Makan &amp; Minum");

    // Tier 2: Arus Kas Bulanan
    expect(html).toContain("Arus Kas Bulanan (2026)");

    // Tier 3: Kemana Uang Pergi
    expect(html).toContain("Kemana Uang Pergi");
    expect(html).toContain("Total Belanja");
    expect(html).toContain("Tagihan Listrik");

    // Tier 4: Disiplin Anggaran & Tren Savings Rate
    expect(html).toContain("Target vs Realisasi Anggaran");
    expect(html).toContain("Tren Savings Rate (2026)");

    // Invarian Tipografi: tabular-nums & zero monospace
    expect(html).toContain("tabular-nums");
    const forbiddenMono = ["font", "mono"].join("-");
    expect(html).not.toContain(forbiddenMono);
  });

  it("groups categories beyond top 5 into Lainnya note and enforces empty state cleanly", () => {
    const sevenItems = Array.from({ length: 7 }, (_, i) => ({
      categoryId: `cat-${i}`,
      categoryName: `Pos ${i + 1}`,
      icon: "wallet",
      group: "kebutuhan" as const,
      amount: (7 - i) * 100_000,
      target: 1_000_000,
      percentageOfTotal: 14,
    }));

    const donutHtml = stripHtmlComments(
      renderToString(
        <ExpenseDonutSection
          availableMonths={[]}
          selectedMonthKey="all"
          onSelectMonthKey={() => {}}
          items={sevenItems}
          selectedYear={2026}
        />
      )
    );
    expect(donutHtml).toContain("+1 pos lainnya tergabung di irisan Lainnya.");

    const emptyHtml = stripHtmlComments(
      renderToString(
        <ExpenseDonutSection
          availableMonths={[]}
          selectedMonthKey="all"
          onSelectMonthKey={() => {}}
          items={[]}
          selectedYear={2026}
        />
      )
    );
    expect(emptyHtml).toContain("Belum ada pengeluaran tercatat");
  });
});
