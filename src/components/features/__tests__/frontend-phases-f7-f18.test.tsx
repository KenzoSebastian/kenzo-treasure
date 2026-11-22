/// <reference types="bun-types" />
import { describe, expect, it, mock } from "bun:test";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
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
import {
  QuickTransactionDrawer,
  resolveMaxCategoryRemaining,
  resolveAutoDescriptionForCategory,
} from "@/components/features/transactions/QuickTransactionDrawer";
import { IncomeSection } from "@/components/features/incomes/IncomeSection";
import { LiabilityTrackerCard } from "@/components/features/liabilities/LiabilityTrackerCard";
import { WishlistCard } from "@/components/features/wishlists/WishlistCard";
import { EmergencyVaultCard } from "@/components/features/savings/EmergencyVaultCard";
import { AnalyticsDashboard } from "@/components/features/analytics/AnalyticsDashboard";
import { AiMonthlyReviewModal } from "@/components/features/ai/AiMonthlyReviewModal";
import { DataExportPanel } from "@/components/features/settings/DataExportPanel";
import { FinanceDefaultsPanel } from "@/components/features/settings/FinanceDefaultsPanel";
import { BudgetTemplateManager } from "@/components/features/settings/BudgetTemplateManager";
import { OnboardingWizard } from "@/components/features/onboarding/OnboardingWizard";
import { MonthSelector } from "@/components/features/months/MonthSelector";
import { AppCategoryIcon } from "@/components/common/AppCategoryIcon";
import { IconPicker } from "@/components/common/IconPicker";
import { SlidingSegmentedControl } from "@/components/common/SlidingSegmentedControl";
import {
  PageSectionSkeleton,
  VaultSkeleton,
  WishlistsSkeleton,
  AnalyticsSkeleton,
  SettingsSkeleton,
} from "@/components/layout/PageSectionSkeleton";
import { DashboardSkeleton } from "@/components/layout/DashboardSkeleton";

const FORBIDDEN_MONO_CLASS = ["font", "mono"].join("-");

describe("Frontend Phases F7–F18 & R1–R10 Component Suite", () => {
  it("Fase F7 & R1: BudgetCategoryCard renders Lucide AppCategoryIcon, target, spent, remaining, status badge, delete button, and zero monospace", () => {
    const html = renderToString(
      <BudgetCategoryCard
        category={{
          id: "cat-1",
          name: "Transportasi & Mobilitas",
          icon: "fuel",
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

    expect(html).toContain("Transportasi &amp; Mobilitas");
    expect(html).toContain("Rp 200.000");
    expect(html).toContain("Rp 170.000");
    expect(html).toContain("Rp 30.000");
    expect(html).toContain("Mendekati Limit &gt;80%");
    expect(html).toContain('data-slot="dialog-trigger"');
    expect(html).toContain(
      'aria-label="Hapus pos anggaran Transportasi &amp; Mobilitas"'
    );
    expect(html).toContain(
      'aria-label="Buka rincian transaksi pos Transportasi &amp; Mobilitas (0 transaksi)"'
    );
    expect(html).toContain("tabular-nums");
    expect(html).not.toContain(FORBIDDEN_MONO_CLASS);

    const modalPanelHtml = renderToString(
      <BudgetCategoryDetailsPanel
        category={{
          id: "cat-1",
          name: "Transportasi & Mobilitas",
          icon: "fuel",
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
    expect(modalPanelHtml).not.toContain(FORBIDDEN_MONO_CLASS);

    // Verifikasi perlindungan pos cicilan (pos terikat kontrak utang terkunci dari edit target)
    const debtCatHtml = renderToString(
      <BudgetCategoryCard
        category={{
          id: "cat-debt",
          name: "Cicilan Laptop",
          icon: "laptop",
          group: "pos_wajib",
          liabilityId: "l-debt-1",
          target: 1000000,
          spent: 0,
          remaining: 1000000,
          usagePercent: 0,
          status: "Aman",
          isLocked: true,
          transactions: [],
        }}
      />
    );
    expect(debtCatHtml).not.toContain("Kontrak Utang");
    expect(debtCatHtml).not.toContain(
      'aria-label="Ubah target alokasi Cicilan Laptop"'
    );

    // Verifikasi status semantik "Target Terpenuhi" saat spent === target (100% pas)
    const targetMetHtml = renderToString(
      <BudgetCategoryCard
        category={{
          id: "cat-met",
          name: "Cicilan Motor",
          icon: "bike",
          group: "pos_wajib",
          target: 1000000,
          spent: 1000000,
          remaining: 0,
          usagePercent: 100,
          status: "healthy",
          transactions: [],
        }}
      />
    );
    expect(targetMetHtml).toContain("Target Terpenuhi");
    expect(targetMetHtml).not.toContain("Mendekati Limit");
  });

  it("Fase F8, F9 & R7: QuickTransactionDrawer & TransactionSubList render cleanly and pure helpers work", () => {
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
    expect(subListHtml).not.toContain(FORBIDDEN_MONO_CLASS);

    const categories = [
      {
        id: "cat-1",
        name: "Transportasi",
        icon: "fuel",
        remaining: 150000,
        group: "kebutuhan" as const,
      },
      {
        id: "cat-2",
        name: "Uang Bebas / Tabungan",
        icon: "sparkles",
        remaining: -20000,
        group: "uang_bebas_tabungan" as const,
      },
    ];

    expect(resolveMaxCategoryRemaining(categories, "cat-1")).toBe(150000);
    expect(resolveMaxCategoryRemaining(categories, "cat-2")).toBe(0);
    expect(resolveAutoDescriptionForCategory(categories[0])).toBe(
      "Transportasi"
    );
    expect(resolveAutoDescriptionForCategory(categories[1])).toBe("");

    const drawerHtml = renderToString(
      <QuickTransactionDrawer monthId="m-1" categories={categories} />
    );
    expect(drawerHtml).toContain("+ Catat Pengeluaran");
    expect(drawerHtml).not.toContain(FORBIDDEN_MONO_CLASS);
  });

  it("Fase F10: IncomeSection renders base salary vs freelance dynamic buffer without emojis", () => {
    const html = renderToString(
      <IncomeSection
        monthId="m-1"
        baseSalary={5000000}
        incomes={[
          {
            id: "inc-1",
            source: "Gaji Pokok",
            amount: 5000000,
            date: "2026-10-01",
            isBaseSalary: true,
          },
          {
            id: "inc-2",
            source: "Proyek Freelance",
            amount: 1200000,
            date: "2026-10-14",
            isBaseSalary: false,
          },
        ]}
      />
    );

    expect(html).toContain("Gaji Pokok: Rp 5.000.000");
    expect(html).toContain("Proyek Freelance");
    expect(html).toContain("+Rp 1.200.000");
    expect(html).not.toContain(FORBIDDEN_MONO_CLASS);
  });

  it("Fase F11 & R8: LiabilityTrackerCard renders active & settled liabilities with Lucide icons", () => {
    const html = renderToString(
      <LiabilityTrackerCard
        monthId="m-1"
        freeBudgetRemaining={1500000}
        liabilities={[
          {
            id: "l-1",
            userId: "u-1",
            name: "Cicilan Kendaraan",
            icon: "car",
            totalAmount: 12000000,
            paidAmount: 3000000,
            monthlyPayment: 1000000,
            totalMonths: 12,
            isSettled: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            remainingAmount: 9000000,
            percentage: 25,
            remainingMonths: 9,
          },
          {
            id: "l-2",
            userId: "u-1",
            name: "Pinjaman Pendidikan",
            icon: "graduation-cap",
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

    expect(html).toContain("Cicilan Kendaraan");
    expect(html).toContain("9 Bulan Tersisa");
    expect(html).toContain("100% LUNAS");
    expect(html).toContain('aria-label="Ubah cicilan Cicilan Kendaraan"');
    expect(html).toContain('aria-label="Hapus cicilan Cicilan Kendaraan"');
    expect(html).not.toContain(FORBIDDEN_MONO_CLASS);
  });

  it("Fase F12 & F13: WishlistCard renders milestone badge and sinking fund progress without emojis", () => {
    const html = renderToString(
      <WishlistCard
        freeSavingsBalance={2500000}
        wishlist={{
          id: "w-1",
          userId: "u-1",
          name: "Perangkat Kerja Baru",
          targetAmount: 10000000,
          savedAmount: 7500000,
          icon: "laptop",
          imageUrl: null,
          isPurchased: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          progress: calculateWishlistProgress(7500000, 10000000),
          allocations: [],
        }}
      />
    );

    expect(html).toContain("Perangkat Kerja Baru");
    expect(html).toContain("Milestone 75%");
    expect(html).toContain("Rp 7.500.000");
    expect(html).not.toContain(FORBIDDEN_MONO_CLASS);
  });

  it("Fase F14: EmergencyVaultCard renders safety months meter and target cleanly", () => {
    const html = renderToString(
      <EmergencyVaultCard
        vault={{
          id: "v-1",
          userId: "u-1",
          freeSavingsBalance: 2500000,
          emergencyFundBalance: 10500000,
          emergencyFundTarget: 15000000,
          totalVaultBalance: 13000000,
          percentageOfTarget: 70,
          isTargetReached: false,
          safetyMonths: 4.2,
          monthlyFixedExpense: 2500000,
          updatedAt: new Date(),
        }}
      />
    );

    expect(html).toContain("Brankas Dana Darurat");
    expect(html).toContain("Rp 10.500.000");
    expect(html).toContain("Rp 15.000.000");
    expect(html).toContain("4,2 Bulan");
    expect(html).not.toContain(FORBIDDEN_MONO_CLASS);
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
          ],
          categoryDistribution: [],
        }}
      />
    );
    expect(analyticsHtml).toContain("Grafik Batang (Bar)");
    expect(analyticsHtml).toContain("Grafik Garis (Line)");
    expect(analyticsHtml).not.toContain(FORBIDDEN_MONO_CLASS);

    const aiHtml = renderToString(
      <AiMonthlyReviewModal
        monthName="Oktober 2026"
        totalIncome={5000000}
        totalSpent={2500000}
        categories={[]}
      />
    );
    expect(aiHtml).toContain("Evaluasi AI");
    expect(aiHtml).not.toContain(FORBIDDEN_MONO_CLASS);

    const exportHtml = renderToString(<DataExportPanel />);
    expect(exportHtml).toContain("Download CSV Transaksi Bulanan");
    expect(exportHtml).toContain("Download Excel (.xlsx) Rekap Keuangan");
    expect(exportHtml).toContain("Full JSON Backup (Kedaulatan Data)");
    expect(exportHtml).not.toContain(FORBIDDEN_MONO_CLASS);
  });

  it("Fase R1, R3, R4, R6, R10: New Primitives (AppCategoryIcon, IconPicker, SlidingSegmentedControl, OnboardingWizard, Settings, PageSectionSkeleton) render cleanly", () => {
    const iconHtml = renderToString(
      <AppCategoryIcon iconKey="fuel" group="kebutuhan" size="md" />
    );
    expect(iconHtml).toContain("<svg");

    const pickerHtml = renderToString(
      <IconPicker value="fuel" onChange={() => {}} />
    );
    expect(pickerHtml).toContain('role="radiogroup"');
    expect(pickerHtml).toContain("Transportasi");

    const segHtml = renderToString(
      <SlidingSegmentedControl
        options={[
          { value: "qris", label: "QRIS" },
          { value: "cash", label: "Tunai" },
        ]}
        value="qris"
        onValueChange={() => {}}
        role="radiogroup"
        ariaLabel="Metode bayar"
      />
    );
    expect(segHtml).toContain('role="radiogroup"');
    expect(segHtml).toContain('type="button"');
    expect(segHtml).toContain("duration-200");

    const onboardHtml = renderToString(
      <OnboardingWizard
        userName="Pengguna"
        initialBaseSalary={0}
        initialEmergencyFundTarget={0}
      />
    );
    expect(onboardHtml).toContain("Lewati untuk Sekarang");
    expect(onboardHtml).toContain("Langkah 1: Gaji Pokok");
    expect(onboardHtml).not.toContain(FORBIDDEN_MONO_CLASS);

    const defaultsHtml = renderToString(
      <FinanceDefaultsPanel defaultBaseSalary={5000000} emergencyFundTarget={15000000} />
    );
    expect(defaultsHtml).toContain("Konfigurasi Gaji Pokok");
    expect(defaultsHtml).toContain("3x Gaji");
    expect(defaultsHtml).toContain("6x Gaji");
    expect(defaultsHtml).not.toContain(FORBIDDEN_MONO_CLASS);

    const tplHtml = renderToString(
      <BudgetTemplateManager templates={[]} defaultBaseSalary={5000000} />
    );
    expect(tplHtml).toContain("Manajemen Template Pos Anggaran Rutin");
    expect(tplHtml).not.toContain(FORBIDDEN_MONO_CLASS);

    const skelHtml = renderToString(<PageSectionSkeleton />);
    expect(skelHtml).toContain('aria-busy="true"');

    // Dedicated Page Skeletons (1 layout per halaman, zero monospace)
    const dashSkelHtml = renderToString(<DashboardSkeleton />);
    expect(dashSkelHtml).toContain('data-testid="dashboard-skeleton"');
    expect(dashSkelHtml).toContain('aria-busy="true"');
    expect(dashSkelHtml).not.toContain(FORBIDDEN_MONO_CLASS);

    const vaultSkelHtml = renderToString(<VaultSkeleton />);
    expect(vaultSkelHtml).toContain('data-testid="vault-skeleton"');
    expect(vaultSkelHtml).toContain('aria-busy="true"');
    expect(vaultSkelHtml).not.toContain(FORBIDDEN_MONO_CLASS);

    const wishSkelHtml = renderToString(<WishlistsSkeleton />);
    expect(wishSkelHtml).toContain('data-testid="wishlists-skeleton"');
    expect(wishSkelHtml).toContain('aria-busy="true"');
    expect(wishSkelHtml).not.toContain(FORBIDDEN_MONO_CLASS);

    const analyticsSkelHtml = renderToString(<AnalyticsSkeleton />);
    expect(analyticsSkelHtml).toContain('data-testid="analytics-skeleton"');
    expect(analyticsSkelHtml).toContain('aria-busy="true"');
    expect(analyticsSkelHtml).not.toContain(FORBIDDEN_MONO_CLASS);

    const settingsSkelHtml = renderToString(<SettingsSkeleton />);
    expect(settingsSkelHtml).toContain('data-testid="settings-skeleton"');
    expect(settingsSkelHtml).toContain('aria-busy="true"');
    expect(settingsSkelHtml).not.toContain(FORBIDDEN_MONO_CLASS);

    // Fase R7: MonthSelector showCreateButton={false} vs true
    const monthSelectorCleanHtml = renderToString(
      <MonthSelector
        months={[
          {
            id: "m-1",
            userId: "u-1",
            name: "Oktober 2026",
            year: 2026,
            monthIndex: 10,
            isClosed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]}
        showCreateButton={false}
      />
    );
    expect(monthSelectorCleanHtml).toContain("Oktober 2026");
    expect(monthSelectorCleanHtml).not.toContain("+ Buat Bulan Baru");

    const monthSelectorFullHtml = renderToString(
      <MonthSelector
        months={[]}
        showCreateButton={true}
      />
    );
    expect(monthSelectorFullHtml).toContain("Pilih Bulan");
    expect(monthSelectorFullHtml).toContain("Buat Bulan Baru");
  });

  it("Automated Audit (Fase R1 & R3): Codebase src/ must be 100% free of literal emojis, monospace utility, and personal dummy figures", () => {
    const emojiRegex =
      /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/u;
    const dummyRegex =
      /\b(iPhone|Mama|Popo|Kamera|17\.?640\.?000|17_640_000|735\.?000|735_000)\b/i;

    const emojiViolations: string[] = [];
    const dummyViolations: string[] = [];
    const fontMonoViolations: string[] = [];

    function scanDir(dir: string) {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) {
          scanDir(full);
        } else if (full.endsWith(".ts") || full.endsWith(".tsx")) {
          // Skip this test file's own regex definition lines
          const isSelfTest = full.endsWith("frontend-phases-f7-f18.test.tsx");
          const lines = readFileSync(full, "utf8").split("\n");
          lines.forEach((line, idx) => {
            if (emojiRegex.test(line)) {
              emojiViolations.push(`${full}:${idx + 1}: ${line.trim()}`);
            }
            if (!isSelfTest && dummyRegex.test(line)) {
              dummyViolations.push(`${full}:${idx + 1}: ${line.trim()}`);
            }
            if (!isSelfTest && line.includes(FORBIDDEN_MONO_CLASS)) {
              fontMonoViolations.push(`${full}:${idx + 1}: ${line.trim()}`);
            }
          });
        }
      }
    }

    scanDir("src");
    expect(emojiViolations).toEqual([]);
    expect(dummyViolations).toEqual([]);
    expect(fontMonoViolations).toEqual([]);
  });
});
