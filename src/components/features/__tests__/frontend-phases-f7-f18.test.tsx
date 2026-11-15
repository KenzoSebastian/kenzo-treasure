/// <reference types="bun-types" />
import { describe, expect, it, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

// Mock next/navigation untuk pengujian SSR di lingkungan Bun test
mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

import {
  BudgetCategoryCard,
  BudgetCategoryDetailsPanel,
} from "@/components/features/categories/BudgetCategoryCard";
import { calculateWishlistProgress } from "@/lib/financial-calculations";
import { TransactionSubList } from "@/components/features/transactions/TransactionSubList";
import { QuickTransactionDrawer } from "@/components/features/transactions/QuickTransactionDrawer";
import { IncomeSection } from "@/components/features/incomes/IncomeSection";
import { LiabilityTrackerCard } from "@/components/features/liabilities/LiabilityTrackerCard";
import { WishlistCard } from "@/components/features/wishlists/WishlistCard";
import { EmergencyVaultCard } from "@/components/features/savings/EmergencyVaultCard";
import { AnalyticsDashboard } from "@/components/features/analytics/AnalyticsDashboard";
import { AiMonthlyReviewModal } from "@/components/features/ai/AiMonthlyReviewModal";
import { DataExportPanel } from "@/components/features/settings/DataExportPanel";

describe("Frontend Phases F7–F18 Component Suite", () => {
  it("Fase F7: BudgetCategoryCard renders target, spent, remaining, status badge, modal trigger, and zero font-mono", () => {
    const html = renderToString(
      <BudgetCategoryCard
        category={{
          id: "cat-1",
          name: "Bensin & Mobilitas",
          icon: "⛽",
          group: "kebutuhan",
          target: 200000,
          spent: 170000,
          remaining: 30000,
          usagePercent: 85,
          status: "Waspada",
          transactions: [],
        }}
      />
    );

    expect(html).toContain("Bensin &amp; Mobilitas");
    expect(html).toContain("Rp 200.000");
    expect(html).toContain("Rp 170.000");
    expect(html).toContain("Rp 30.000");
    expect(html).toContain("Mendekati Limit &gt;80%");
    expect(html).toContain('data-slot="dialog-trigger"');
    expect(html).toContain(
      'aria-label="Buka rincian transaksi pos Bensin &amp; Mobilitas (0 transaksi)"'
    );
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain("Belum ada catatan transaksi di pos ini.");
    expect(html).toContain("tabular-nums");
    expect(html).not.toContain("font-mono");

    const modalPanelHtml = renderToString(
      <BudgetCategoryDetailsPanel
        category={{
          id: "cat-1",
          name: "Bensin & Mobilitas",
          icon: "⛽",
          group: "kebutuhan",
          target: 200000,
          spent: 225000,
          remaining: -25000,
          usagePercent: 113,
          status: "Overbudget",
          transactions: [
            {
              id: "tx-modal-1",
              categoryId: "cat-1",
              userId: "u-1",
              description: "Shell Super Full Tank",
              amount: 225000,
              method: "qris",
              date: "2026-10-15",
              isDeleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        }}
        isOverbudget={true}
      />
    );

    expect(modalPanelHtml).toContain("Target");
    expect(modalPanelHtml).toContain("Rp 200.000");
    expect(modalPanelHtml).toContain("Terpakai");
    expect(modalPanelHtml).toContain("Rp 225.000");
    expect(modalPanelHtml).toContain("Overbudget");
    expect(modalPanelHtml).toContain("-Rp 25.000");
    expect(modalPanelHtml).toContain("Shell Super Full Tank");
    expect(modalPanelHtml).toContain("QRIS");
    expect(modalPanelHtml).not.toContain("font-mono");
  });

  it("Fase F8 & F9: QuickTransactionDrawer & TransactionSubList render cleanly without font-mono", () => {
    const subListHtml = renderToString(
      <TransactionSubList
        transactions={[
          {
            id: "tx-1",
            categoryId: "cat-1",
            userId: "u-1",
            description: "Isi Pertamax",
            amount: 50000,
            method: "qris",
            date: "2026-10-12",
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]}
      />
    );

    expect(subListHtml).toContain("Isi Pertamax");
    expect(subListHtml).toContain("QRIS");
    expect(subListHtml).toContain("Rp 50.000");
    expect(subListHtml).not.toContain("font-mono");

    const drawerHtml = renderToString(
      <QuickTransactionDrawer
        monthId="m-1"
        categories={[
          { id: "cat-1", name: "Bensin", icon: "⛽", remaining: 150000 },
        ]}
      />
    );
    expect(drawerHtml).toContain("+ Catat Pengeluaran");
    expect(drawerHtml).not.toContain("font-mono");
  });

  it("Fase F10: IncomeSection renders base salary vs freelance dynamic buffer", () => {
    const html = renderToString(
      <IncomeSection
        monthId="m-1"
        baseSalary={4000000}
        incomes={[
          {
            id: "inc-1",
            source: "Gaji Pokok",
            amount: 4000000,
            date: "2026-10-01",
            isBaseSalary: true,
          },
          {
            id: "inc-2",
            source: "Freelance Edit Video",
            amount: 1200000,
            date: "2026-10-14",
            isBaseSalary: false,
          },
        ]}
      />
    );

    expect(html).toContain("Gaji Pokok: Rp 4.000.000");
    expect(html).toContain("Freelance Edit Video");
    expect(html).toContain("+Rp 1.200.000");
    expect(html).not.toContain("font-mono");
  });

  it("Fase F11: LiabilityTrackerCard renders active & settled liabilities with progress", () => {
    const html = renderToString(
      <LiabilityTrackerCard
        liabilities={[
          {
            id: "l-1",
            userId: "u-1",
            name: "Cicilan iPhone",
            totalAmount: 17640000,
            paidAmount: 4410000,
            monthlyPayment: 735000,
            totalMonths: 24,
            isSettled: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            remainingAmount: 13230000,
            percentage: 25,
            remainingMonths: 18,
          },
          {
            id: "l-2",
            userId: "u-1",
            name: "Talangan Mama",
            totalAmount: 2500000,
            paidAmount: 2500000,
            monthlyPayment: 500000,
            totalMonths: 5,
            isSettled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            remainingAmount: 0,
            percentage: 100,
            remainingMonths: 0,
          },
        ]}
      />
    );

    expect(html).toContain("Cicilan iPhone");
    expect(html).toContain("18 Bulan Tersisa");
    expect(html).toContain("🏆 100% LUNAS");
    expect(html).not.toContain("font-mono");
  });

  it("Fase F12 & F13: WishlistCard renders milestone badge and sinking fund progress", () => {
    const html = renderToString(
      <WishlistCard
        freeSavingsBalance={2500000}
        wishlist={{
          id: "w-1",
          userId: "u-1",
          name: "Kamera Mirrorless",
          targetAmount: 10000000,
          savedAmount: 7500000,
          icon: "📷",
          imageUrl: null,
          isPurchased: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          progress: calculateWishlistProgress(7500000, 10000000),
          allocations: [],
        }}
      />
    );

    expect(html).toContain("Kamera Mirrorless");
    expect(html).toContain("🚀 Milestone 75%");
    expect(html).toContain("Rp 7.500.000");
    expect(html).not.toContain("font-mono");
  });

  it("Fase F14: EmergencyVaultCard renders safety months meter and target Rp 18.000.000", () => {
    const html = renderToString(
      <EmergencyVaultCard
        vault={{
          id: "v-1",
          userId: "u-1",
          freeSavingsBalance: 2500000,
          emergencyFundBalance: 12600000,
          emergencyFundTarget: 18000000,
          totalVaultBalance: 15100000,
          percentageOfTarget: 70,
          isTargetReached: false,
          safetyMonths: 4.2,
          monthlyFixedExpense: 3000000,
          updatedAt: new Date(),
        }}
      />
    );

    expect(html).toContain("Brankas Dana Darurat");
    expect(html).toContain("Rp 12.600.000");
    expect(html).toContain("Rp 18.000.000");
    expect(html).toContain("4,2 Bulan");
    expect(html).not.toContain("font-mono");
  });

  it("Fase F15, F16 & F17: AnalyticsDashboard, AiMonthlyReviewModal & DataExportPanel render cleanly", () => {
    const analyticsHtml = renderToString(
      <AnalyticsDashboard
        data={{
          selectedYear: 2026,
          availableYears: [2026, 2027],
          savingsGrowth: [],
          monthlyCashflow: [],
          yearlyComparison: [
            {
              year: 2026,
              totalIncome: 12000000,
              totalExpense: 8000000,
              totalNetSavings: 4000000,
              averageSavingsRate: 33,
              monthsCount: 3,
            },
            {
              year: 2027,
              totalIncome: 0,
              totalExpense: 0,
              totalNetSavings: 0,
              averageSavingsRate: 0,
              monthsCount: 0,
            },
          ],
          categoryDistribution: [],
        }}
      />
    );
    expect(analyticsHtml).toContain("Grafik Batang (Bar)");
    expect(analyticsHtml).toContain("Grafik Garis (Line)");
    expect(analyticsHtml).not.toContain("font-mono");

    const aiHtml = renderToString(
      <AiMonthlyReviewModal
        monthName="Oktober 2026"
        totalIncome={4000000}
        totalSpent={2500000}
        categories={[]}
      />
    );
    expect(aiHtml).toContain("✨ Evaluasi Bulan Ini dengan AI");
    expect(aiHtml).not.toContain("font-mono");

    const exportHtml = renderToString(<DataExportPanel />);
    expect(exportHtml).toContain("📥 Download CSV Transaksi Bulanan");
    expect(exportHtml).toContain("📊 Download Excel (.xlsx) Rekap Keuangan");
    expect(exportHtml).toContain("💾 Full JSON Backup (Kedaulatan Data)");
    expect(exportHtml).not.toContain("font-mono");
  });
});
