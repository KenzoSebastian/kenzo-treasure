/**
 * ==============================================================================
 * Kenzo Treasury — Dashboard Page (Server Component Orchestrator) (Fase F5–F16, R1–R10)
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Berkas ini bertindak murni sebagai Server Component Orchestrator utama untuk
 * panel kerja bulanan:
 * - Membaca sesi terautentikasi ter-cache (`getCachedAuthenticatedSession`).
 * - Tidak memuat data finansial dummy/hardcoded; seluruh angka bersumber 100%
 *   dari database pengguna.
 * - Membungkus konten siklus bulan dengan `MonthNavigationProvider`, `Suspense`
 *   (`DashboardSkeleton`), dan `DashboardMonthShell` untuk pengalaman perpindahan
 *   bulan yang mulus tanpa layar beku.
 * - Menyajikan grid 2x2 simetris di kanan header desktop untuk kontrol siklus.
 */

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Lock,
  Plus,
  Sparkles,
  BarChart3,
  AlertTriangle,
  Settings,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppCategoryIcon } from "@/components/common/AppCategoryIcon";
import { DashboardSkeleton } from "@/components/layout/DashboardSkeleton";
import { getCachedAuthenticatedSession } from "@/lib/queries/auth";
import { getUserFinanceSetup } from "@/lib/queries/settings";
import {
  getAllMonths,
  getActiveMonth,
  getMonthDetailById,
} from "@/lib/queries/months";
import { getLiabilities } from "@/lib/queries/liabilities";
import { getSavingsAccount } from "@/lib/queries/savings";
import { getWishlists } from "@/lib/queries/wishlists";
import {
  calculateSavingsRate,
  formatRupiah,
} from "@/lib/financial-calculations";
import {
  MonthSelector,
  CreateMonthDialog,
  MonthNavigationProvider,
  DashboardMonthShell,
} from "@/components/features/months";
import {
  CashflowSummaryCard,
  DashboardHubCard,
  ExecutiveSummaryCard,
} from "@/components/features/dashboard";
import {
  BudgetCategoryList,
  type BudgetCategoryItem,
} from "@/components/features/categories";
import { QuickTransactionDrawer } from "@/components/features/transactions";
import { IncomeSection } from "@/components/features/incomes";
import { LiabilityTrackerCard } from "@/components/features/liabilities";
import { EmergencyVaultCard } from "@/components/features/savings";
import { AiMonthlyReviewModal } from "@/components/features/ai";
import type { SavingsVaultSummary } from "@/types/savings";

interface DashboardPageProps {
  searchParams?: Promise<{
    month?: string;
  }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  const selectedMonthId = searchParams?.month;

  const sessionRes = await getCachedAuthenticatedSession();
  const userId = sessionRes.success ? sessionRes.data.userId : undefined;
  const firstName = sessionRes.success
    ? sessionRes.data.name.split(" ")[0] || "Pengguna"
    : "Pengguna";

  return (
    <MonthNavigationProvider>
      <React.Suspense fallback={<DashboardSkeleton />}>
        <DashboardMonthContent
          userId={userId}
          firstName={firstName}
          selectedMonthId={selectedMonthId}
        />
      </React.Suspense>
    </MonthNavigationProvider>
  );
}

interface DashboardMonthContentProps {
  userId?: string;
  firstName: string;
  selectedMonthId?: string;
}

async function DashboardMonthContent({
  userId,
  firstName,
  selectedMonthId,
}: DashboardMonthContentProps) {
  const [monthsResult, liabilitiesRes, savingsRes, wishlistsRes, setup] =
    userId
      ? await Promise.all([
          getAllMonths(userId),
          getLiabilities(userId),
          getSavingsAccount(userId),
          getWishlists(userId),
          getUserFinanceSetup(userId).catch(() => null),
        ])
      : [
          { success: false as const, error: "", data: [] },
          { success: false as const, error: "" },
          { success: false as const, error: "" },
          { success: false as const, error: "" },
          null,
        ];

  const monthsList =
    monthsResult.success && monthsResult.data ? monthsResult.data : [];

  let currentMonthDetail = null;
  if (userId) {
    if (selectedMonthId) {
      const detailRes = await getMonthDetailById(selectedMonthId, userId);
      if (detailRes.success && detailRes.data) {
        currentMonthDetail = detailRes.data;
      }
    }
    if (!currentMonthDetail) {
      const activeRes = await getActiveMonth(userId);
      if (activeRes.success && activeRes.data) {
        currentMonthDetail = activeRes.data;
      }
    }
  }

  const defaultSalary = setup?.defaultBaseSalary ?? 0;
  const isSetupIncomplete =
    monthsList.length === 0 &&
    (setup?.defaultBaseSalary === null || (setup?.templatesCount ?? 0) === 0);

  const salaryBase = currentMonthDetail ? currentMonthDetail.totalIncome : 0;
  const totalSpent = currentMonthDetail ? currentMonthDetail.totalSpent : 0;
  const remainingCash = currentMonthDetail
    ? Math.max(
        0,
        currentMonthDetail.totalIncome - currentMonthDetail.totalSpent
      )
    : 0;
  const usageRatio =
    salaryBase > 0 ? Math.round((totalSpent / salaryBase) * 100) : 0;

  const baseSalary =
    currentMonthDetail?.incomes?.find((inc) => inc.isBaseSalary)?.amount ?? 0;
  const additionalIncomes =
    currentMonthDetail?.incomes
      ?.filter((inc) => !inc.isBaseSalary)
      .reduce((sum, inc) => sum + inc.amount, 0) ?? 0;

  const activeCategories: BudgetCategoryItem[] = currentMonthDetail
    ? currentMonthDetail.categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || "wallet",
        group: cat.group,
        liabilityId: cat.liabilityId,
        isTemporary: cat.isTemporary,
        target: cat.targetBudget,
        spent: cat.spentAmount,
        remaining: cat.remainingBudget,
        usagePercent:
          cat.targetBudget > 0
            ? Math.round((cat.spentAmount / cat.targetBudget) * 100)
            : 0,
        status: cat.status,
        isLocked: cat.group === "pos_wajib",
        transactions: cat.transactions,
      }))
    : [];

  const totalTargetWajib = activeCategories.reduce(
    (sum, c) => sum + c.target,
    0
  );

  const freeBudgetCategory = activeCategories.find(
    (cat) => cat.group === "uang_bebas_tabungan"
  );

  const activeLiabilities =
    liabilitiesRes.success && liabilitiesRes.data
      ? liabilitiesRes.data.items
      : [];

  const emptyVault: SavingsVaultSummary = {
    id: "empty-vault",
    userId: userId ?? "anonymous",
    freeSavingsBalance: 0,
    emergencyFundBalance: 0,
    emergencyFundTarget: setup?.emergencyFundTarget ?? 0,
    totalVaultBalance: 0,
    percentageOfTarget: 0,
    isTargetReached: false,
    safetyMonths: 0,
    monthlyFixedExpense: 0,
    updatedAt: new Date(),
  };

  const activeVault =
    savingsRes.success && savingsRes.data ? savingsRes.data : emptyVault;

  const topWishlist =
    wishlistsRes.success && wishlistsRes.data.items.length > 0
      ? wishlistsRes.data.items[0]
      : null;

  const currentSavingsRate = currentMonthDetail
    ? calculateSavingsRate(
        currentMonthDetail.totalIncome,
        currentMonthDetail.netCashflow
      )
    : 0;

  const quickCategories = activeCategories
    .filter((c) => Boolean(c.id))
    .map((c) => ({
      id: c.id!,
      name: c.name,
      icon: c.icon,
      remaining: c.remaining,
      group: c.group,
      liabilityId: c.liabilityId,
    }));

  return (
    <DashboardMonthShell>
      <div className="space-y-8 animate-in fade-in-50 duration-200">
        {/* 1. Header Ringkasan: Sapaan Personal & 2x2 Desktop Right Action Grid */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 border-b border-border/60 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Calendar className="size-3.5 text-foreground/70" />
              <span>
                {currentMonthDetail
                  ? currentMonthDetail.name
                  : "Belum Ada Siklus Aktif"}{" "}
                • Siklus Mandiri
              </span>
              <span className="text-border">•</span>
              {currentMonthDetail?.isClosed ? (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Lock className="size-3" />
                  Tutup Buku (Arsip)
                </span>
              ) : currentMonthDetail ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Aktif Berjalan
                </span>
              ) : (
                <span className="text-muted-foreground">Siap Dimulai</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Halo, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              Ikhtisar arus kas, alokasi pos anggaran, dan ketahanan dana
              darurat Anda bulan ini.
            </p>
          </div>

          {/* Right Header Controls: 2x2 Grid Simetris (Mobile & Desktop) */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-[420px] shrink-0">
            {/* 1. Selector Bulan */}
            <MonthSelector
              showCreateButton={false}
              months={monthsList}
              currentMonthId={currentMonthDetail?.id}
              isClosed={currentMonthDetail?.isClosed}
              defaultBaseSalary={defaultSalary}
            />

            {/* 2. Dialog Buat Bulan Baru */}
            <CreateMonthDialog
              latestMonth={monthsList[0] ?? null}
              defaultBaseSalary={defaultSalary}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold w-full justify-center border-border/80 bg-background hover:bg-muted/50 text-foreground shadow-2xs"
                >
                  <Plus className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">+ Bulan Baru</span>
                </Button>
              }
            />

            {/* 3. Modal Evaluasi AI */}
            {currentMonthDetail ? (
              <AiMonthlyReviewModal
                monthId={currentMonthDetail.id}
                monthName={currentMonthDetail.name}
                isClosed={currentMonthDetail.isClosed}
                totalIncome={salaryBase}
                totalSpent={totalSpent}
                categories={activeCategories}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-foreground shadow-2xs w-full justify-center"
                  >
                    <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">Evaluasi AI</span>
                  </Button>
                }
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                title="Buat siklus bulan terlebih dahulu untuk evaluasi AI"
                className="h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold border-border/60 bg-muted/20 text-muted-foreground/60 shadow-2xs w-full justify-center opacity-60 cursor-not-allowed"
              >
                <Sparkles className="size-3.5 text-muted-foreground/60 shrink-0" />
                <span className="truncate">Evaluasi AI</span>
              </Button>
            )}

            {/* 4. Drawer Catat Transaksi Cepat (Selalu isi sel ke-4 agar grid 2x2 simetris) */}
            {currentMonthDetail &&
            !currentMonthDetail.isClosed &&
            quickCategories.length > 0 ? (
              <QuickTransactionDrawer
                monthId={currentMonthDetail.id}
                isClosed={currentMonthDetail.isClosed}
                cycleYear={currentMonthDetail.year}
                cycleMonthIndex={currentMonthDetail.monthIndex}
                categories={quickCategories}
                trigger={
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-3 rounded-xl gap-1.5 font-semibold text-xs shadow-xs w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Zap className="size-3.5 shrink-0" />
                    <span className="truncate">+ Catat Transaksi</span>
                  </Button>
                }
              />
            ) : (
              <Button
                type="button"
                size="sm"
                disabled
                title={
                  !currentMonthDetail
                    ? "Buat siklus bulan terlebih dahulu untuk mencatat transaksi"
                    : currentMonthDetail.isClosed
                      ? "Siklus bulan telah diarsipkan"
                      : "Belum ada pos anggaran aktif"
                }
                className="h-9 px-3 rounded-xl gap-1.5 font-semibold text-xs shadow-xs w-full justify-center opacity-50 cursor-not-allowed border border-border/60 bg-muted/20 text-muted-foreground/60"
              >
                <Zap className="size-3.5 shrink-0" />
                <span className="truncate">+ Catat Transaksi</span>
              </Button>
            )}
          </div>
        </div>

        {/* 1b. Incomplete Setup Warning Card atau Zero-State Banner */}
        {isSetupIncomplete && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  Setup Keuangan Belum Lengkap
                </h3>
                <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                  Anda belum mengatur gaji pokok default atau template pos
                  anggaran rutin. Lengkapi setup awal agar pembuatan siklus
                  bulanan terisi otomatis sesuai profil Anda.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                asChild
                size="sm"
                className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-1.5"
              >
                <Link href="/onboarding">
                  <Sparkles className="size-3.5" />
                  <span>Lengkapi via Wizard</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3.5 rounded-xl text-xs font-medium gap-1.5"
              >
                <Link href="/dashboard/settings">
                  <Settings className="size-3.5" />
                  <span>Buka Settings</span>
                </Link>
              </Button>
            </div>
          </div>
        )}

        {monthsList.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/80 p-6 bg-muted/20 text-center space-y-3">
            <div className="mx-auto size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                Mulai Siklus Anggaran Pertama Anda
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Belum ada lembar kerja siklus bulanan di database. Klik tombol di
                bawah untuk membuat siklus bulan pertama Anda.
              </p>
            </div>
            <CreateMonthDialog
              defaultBaseSalary={defaultSalary}
              trigger={
                <Button
                  size="sm"
                  className="h-9 px-4 rounded-xl gap-1.5 font-medium"
                >
                  <Plus className="size-4" />
                  <span>Buat Lembar Bulan Pertama</span>
                </Button>
              }
            />
          </div>
        )}

        {/* 2. Executive Summary Card & Cashflow KPI (Fase F6) */}
        <ExecutiveSummaryCard
          totalIncome={salaryBase}
          totalSpent={totalSpent}
          baseSalary={baseSalary}
          additionalIncomes={additionalIncomes}
          monthName={currentMonthDetail?.name}
          isClosed={currentMonthDetail?.isClosed}
        />

        {/* 3. Kartu Pilar Arus Kas (Cashflow Summary Breakdown) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CashflowSummaryCard
            title="Total Brankas Simpanan"
            amount={activeVault.totalVaultBalance}
            footer={
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Ketahanan Darurat:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {activeVault.safetyMonths.toLocaleString("id-ID")} Bulan Aman
                </span>
              </div>
            }
          />

          <CashflowSummaryCard
            title="Realisasi Pengeluaran Kas"
            amount={totalSpent}
            footer={
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Terpakai dari Pemasukan:
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {usageRatio}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground/80 transition-all duration-300"
                    style={{ width: `${Math.min(100, usageRatio)}%` }}
                  />
                </div>
              </div>
            }
          />

          <CashflowSummaryCard
            title="Sisa Kuota Uang Bebas"
            amount={remainingCash}
            amountClassName="text-emerald-600 dark:text-emerald-400"
            footer={
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Total Pemasukan Bulan Ini:
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatRupiah(salaryBase)}
                </span>
              </div>
            }
          />
        </div>

        {/* 4. Seksi Pemasukan: Gaji Pokok vs Freelance (Fase F10) */}
        <IncomeSection
          monthId={currentMonthDetail?.id}
          isClosed={currentMonthDetail?.isClosed}
          baseSalary={baseSalary}
          incomes={currentMonthDetail?.incomes}
          cycleYear={currentMonthDetail?.year}
          cycleMonthIndex={currentMonthDetail?.monthIndex}
        />

        {/* 5. Seksi Pos Anggaran & Sub-List Transaksi (Fase F7 & F9) */}
        <BudgetCategoryList
          categories={activeCategories}
          salaryBase={salaryBase}
          totalTarget={totalTargetWajib}
          monthId={currentMonthDetail?.id}
          isClosed={currentMonthDetail?.isClosed}
        />

        {/* 6. Seksi Tracking Cicilan / Utang Bertarget Lunas (Fase F11 & R8) */}
        <LiabilityTrackerCard
          liabilities={activeLiabilities}
          monthId={currentMonthDetail?.id}
          freeBudgetRemaining={freeBudgetCategory?.remaining}
          isClosed={currentMonthDetail?.isClosed}
        />

        {/* 7. Seksi Brankas Dana Darurat & Safety Months Meter (Fase F14) */}
        <EmergencyVaultCard vault={activeVault} />

        {/* 8. Seksi Hub Sinking Fund & Analitik */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <DashboardHubCard
            icon={<Sparkles className="size-4 text-amber-500" />}
            title="Wishlist Barang Impian"
            description="Sinking fund mandiri yang terkumpul bertahap dari sisa uang bebas tanpa menyentuh dana darurat."
            href="/dashboard/wishlists"
            linkText="Buka Hub"
          >
            {topWishlist ? (
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <AppCategoryIcon
                      iconKey={topWishlist.icon}
                      size="xs"
                      variant="inline"
                    />
                    <span>{topWishlist.name}</span>
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {topWishlist.progress.percentage}% Tercapai
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{
                      width: `${topWishlist.progress.percentage}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
                  <span>Terkumpul: {formatRupiah(topWishlist.savedAmount)}</span>
                  <span>Target: {formatRupiah(topWishlist.targetAmount)}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/15 p-3.5 text-xs text-muted-foreground">
                Belum ada barang impian aktif. Tambahkan target impian pertama
                Anda di halaman Wishlist.
              </div>
            )}
          </DashboardHubCard>

          <DashboardHubCard
            icon={<BarChart3 className="size-4 text-blue-500" />}
            title="Analitik & Historis Kas"
            description="Pantau kestabilan rasio tabungan, tren pengeluaran mingguan, dan proyeksi pelunasan cicilan Anda."
            href="/dashboard/analytics"
            linkText="Lihat Tren"
          >
            <div className="flex items-center justify-around gap-2 rounded-xl border border-border/60 bg-muted/20 p-3.5 text-center">
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Rasio Tabungan
                </span>
                <span className="text-base font-bold text-foreground tabular-nums">
                  {currentSavingsRate}%
                </span>
              </div>
              <div className="h-8 w-px bg-border/60" />
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Cicilan Aktif
                </span>
                <span className="text-base font-bold text-foreground tabular-nums">
                  {activeLiabilities.filter((l) => !l.isSettled).length} Pos
                </span>
              </div>
              <div className="h-8 w-px bg-border/60" />
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Ketahanan Darurat
                </span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {activeVault.safetyMonths.toLocaleString("id-ID")} Bln
                </span>
              </div>
            </div>
          </DashboardHubCard>
        </div>

        {/* Floating Quick Transaction Trigger untuk Mobile */}
        {currentMonthDetail && (
          <QuickTransactionDrawer
            monthId={currentMonthDetail.id}
            isClosed={currentMonthDetail.isClosed}
            cycleYear={currentMonthDetail.year}
            cycleMonthIndex={currentMonthDetail.monthIndex}
            categories={quickCategories}
            floatingMobile
          />
        )}
      </div>
    </DashboardMonthShell>
  );
}
