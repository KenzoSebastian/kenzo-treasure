import { getCurrentUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Calendar, Lock, Plus, Sparkles, BarChart3 } from "lucide-react";
import {
  getAllMonths,
  getActiveMonth,
  getMonthDetailById,
} from "@/lib/queries/months";
import { getLiabilities } from "@/lib/queries/liabilities";
import { getSavingsAccount } from "@/lib/queries/savings";
import { getWishlists } from "@/lib/queries/wishlists";
import { calculateSavingsRate } from "@/lib/financial-calculations";
import { MonthSelector, CreateMonthDialog } from "@/components/features/months";
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
import type { LiabilityWithProgress } from "@/types/liability";
import type { SavingsVaultSummary } from "@/types/savings";

/**
 * ==============================================================================
 * Kenzo Treasury — Dashboard Page (Server Component Orchestrator)
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Berkas ini bertindak murni sebagai Server Component Orchestrator utama untuk
 * panel kerja bulanan. Mengambil sesi pengguna dan data siklus bulan dari
 * database via `src/lib/queries/*`, lalu mendistribusikannya ke komponen fitur
 * modular terisolasi (F5–F16).
 */

interface DashboardPageProps {
  searchParams?: Promise<{
    month?: string;
  }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  const selectedMonthId = searchParams?.month;

  const userResult = await getCurrentUser();
  const user = userResult.success ? userResult.data : null;
  const firstName = user?.fullName?.split(" ")[0] || "Kenzo";

  // Ambil daftar riwayat seluruh bulan milik pengguna
  const monthsResult = user?.id
    ? await getAllMonths(user.id)
    : { success: false, data: [] };
  const monthsList =
    monthsResult.success && monthsResult.data ? monthsResult.data : [];

  // Ambil detail bulan yang sedang dipilih via URL atau bulan aktif berjalan
  let currentMonthDetail = null;
  if (user?.id) {
    if (selectedMonthId) {
      const detailRes = await getMonthDetailById(selectedMonthId, user.id);
      if (detailRes.success && detailRes.data) {
        currentMonthDetail = detailRes.data;
      }
    }
    if (!currentMonthDetail) {
      const activeRes = await getActiveMonth(user.id);
      if (activeRes.success && activeRes.data) {
        currentMonthDetail = activeRes.data;
      }
    }
  }

  // Ambil data cicilan, brankas dana darurat, dan wishlist secara paralel
  const [liabilitiesRes, savingsRes, wishlistsRes] = user?.id
    ? await Promise.all([
        getLiabilities(user.id),
        getSavingsAccount(user.id),
        getWishlists(user.id),
      ])
    : [
        { success: false as const, error: "" },
        { success: false as const, error: "" },
        { success: false as const, error: "" },
      ];

  // Data referensi finansial siklus berjalan
  const salaryBase = currentMonthDetail
    ? currentMonthDetail.totalIncome
    : 4000000;
  const totalSpent = currentMonthDetail
    ? currentMonthDetail.totalSpent
    : 1420000;
  const remainingCash = currentMonthDetail
    ? Math.max(
        0,
        currentMonthDetail.totalIncome - currentMonthDetail.totalSpent
      )
    : 2580000;
  const usageRatio =
    salaryBase > 0 ? Math.round((totalSpent / salaryBase) * 100) : 0;

  // Breakdown pendapatan gaji vs tambahan
  const baseSalary =
    currentMonthDetail?.incomes?.find((inc) => inc.isBaseSalary)?.amount ??
    4000000;
  const additionalIncomes =
    currentMonthDetail?.incomes
      ?.filter((inc) => !inc.isBaseSalary)
      .reduce((sum, inc) => sum + inc.amount, 0) ?? 0;

  // 7 Pos Anggaran Wajib Bulanan (Fallback Preview saat DB kosong)
  const defaultBudgetCategories: BudgetCategoryItem[] = [
    {
      name: "Bensin & Mobilitas",
      icon: "⛽",
      group: "kebutuhan",
      target: 200000,
      spent: 135000,
      remaining: 65000,
      usagePercent: 68,
      status: "Aman",
    },
    {
      name: "Belanja & Jajan",
      icon: "🍿",
      group: "uang_bebas_tabungan",
      target: 300000,
      spent: 190000,
      remaining: 110000,
      usagePercent: 63,
      status: "Aman",
    },
    {
      name: "Listrik & Air",
      icon: "⚡",
      group: "pos_wajib",
      target: 450000,
      spent: 0,
      remaining: 450000,
      usagePercent: 0,
      status: "Terkunci",
      isLocked: true,
    },
    {
      name: "Gereja / Persepuluhan",
      icon: "✝️",
      group: "pos_wajib",
      target: 400000,
      spent: 0,
      remaining: 400000,
      usagePercent: 0,
      status: "Terkunci",
      isLocked: true,
    },
    {
      name: "Tabungan Otomatis",
      icon: "💰",
      group: "uang_bebas_tabungan",
      target: 500000,
      spent: 500000,
      remaining: 0,
      usagePercent: 100,
      status: "Teralokasi",
      isLocked: true,
    },
    {
      name: "Cicilan iPhone (24 bln)",
      icon: "📱",
      group: "pos_wajib",
      target: 735000,
      spent: 0,
      remaining: 735000,
      usagePercent: 0,
      status: "18 Bln Tersisa",
      isLocked: true,
    },
    {
      name: "Talangan Mama (5 bln)",
      icon: "👩‍👦",
      group: "pos_wajib",
      target: 500000,
      spent: 0,
      remaining: 500000,
      usagePercent: 0,
      status: "3 Bln Tersisa",
      isLocked: true,
    },
  ];

  // Susun data pos anggaran: utamakan data dinamis dari database, fallback ke baseline
  const activeCategories: BudgetCategoryItem[] =
    currentMonthDetail && currentMonthDetail.categories.length > 0
      ? currentMonthDetail.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || "📁",
          group: cat.group,
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
      : defaultBudgetCategories;

  const totalTargetWajib = activeCategories.reduce(
    (sum, c) => sum + c.target,
    0
  );

  // Data cicilan: utamakan DB, fallback ke preview jika DB kosong
  const fallbackLiabilities: LiabilityWithProgress[] = [
    {
      id: "preview-iphone",
      userId: user?.id ?? "preview",
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
      id: "preview-mama",
      userId: user?.id ?? "preview",
      name: "Talangan Mama",
      totalAmount: 2500000,
      paidAmount: 1000000,
      monthlyPayment: 500000,
      totalMonths: 5,
      isSettled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      remainingAmount: 1500000,
      percentage: 40,
      remainingMonths: 3,
    },
  ];

  const activeLiabilities =
    liabilitiesRes.success && liabilitiesRes.data.items.length > 0
      ? liabilitiesRes.data.items
      : fallbackLiabilities;

  // Data brankas simpanan & dana darurat
  const fallbackVault: SavingsVaultSummary = {
    id: "preview-vault",
    userId: user?.id ?? "preview",
    freeSavingsBalance: 2500000,
    emergencyFundBalance: 12600000,
    emergencyFundTarget: 18000000,
    totalVaultBalance: 15100000,
    percentageOfTarget: 70,
    isTargetReached: false,
    safetyMonths: 4.2,
    monthlyFixedExpense: 3000000,
    updatedAt: new Date(),
  };

  const activeVault =
    savingsRes.success && savingsRes.data ? savingsRes.data : fallbackVault;

  const topWishlist =
    wishlistsRes.success && wishlistsRes.data.items.length > 0
      ? wishlistsRes.data.items[0]
      : null;

  const currentSavingsRate = currentMonthDetail
    ? calculateSavingsRate(
        currentMonthDetail.totalIncome,
        currentMonthDetail.netCashflow
      )
    : 28.5;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* 1. Header Ringkasan: Sapaan Personal, Status Siklus & Month Selector */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-muted-foreground font-medium">
            <Calendar className="size-3.5 text-foreground/70" />
            <span>
              {currentMonthDetail
                ? currentMonthDetail.name
                : "Oktober 2026 (Preview)"}{" "}
              • Siklus Mandiri
            </span>
            <span className="text-border">•</span>
            {currentMonthDetail?.isClosed ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Lock className="size-3" />
                Tutup Buku (Arsip)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Aktif Berjalan
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Halo, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
            Ikhtisar arus kas, kuota 7 pos anggaran terproteksi, dan ketahanan
            dana darurat Anda bulan ini.
          </p>
        </div>

        {/* Dropdown Pemilih Bulan, AI Review Modal & Quick Transaction Drawer */}
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelector
            months={monthsList}
            currentMonthId={currentMonthDetail?.id}
            isClosed={currentMonthDetail?.isClosed}
          />
          <AiMonthlyReviewModal
            monthId={currentMonthDetail?.id}
            monthName={currentMonthDetail?.name ?? "Oktober 2026"}
            isClosed={currentMonthDetail?.isClosed}
            totalIncome={salaryBase}
            totalSpent={totalSpent}
            categories={activeCategories}
          />
          {currentMonthDetail && (
            <QuickTransactionDrawer
              monthId={currentMonthDetail.id}
              isClosed={currentMonthDetail.isClosed}
              cycleYear={currentMonthDetail.year}
              cycleMonthIndex={currentMonthDetail.monthIndex}
              categories={activeCategories
                .filter((c) => Boolean(c.id))
                .map((c) => ({
                  id: c.id!,
                  name: c.name,
                  icon: c.icon,
                  remaining: c.remaining,
                }))}
            />
          )}
        </div>
      </div>

      {/* 1b. Fail-Closed Zero-State Banner jika belum ada bulan di DB */}
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
              bawah untuk membuat bulan pertama dengan 7 pos pengeluaran baseline
              terproteksi.
            </p>
          </div>
          <CreateMonthDialog
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
                Rp {salaryBase.toLocaleString("id-ID")}
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

      {/* 5. Seksi 7 Pos Anggaran Wajib & Sub-List Transaksi (Fase F7 & F9) */}
      <BudgetCategoryList
        categories={activeCategories}
        salaryBase={salaryBase}
        totalTarget={totalTargetWajib}
        monthId={currentMonthDetail?.id}
        isClosed={currentMonthDetail?.isClosed}
      />

      {/* 6. Seksi Tracking Cicilan / Utang Bertarget Lunas (Fase F11) */}
      <LiabilityTrackerCard
        liabilities={activeLiabilities}
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
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">
                🎯 {topWishlist ? topWishlist.name : "Target Tabungan Kamera & Lensa"}
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {topWishlist ? topWishlist.progress.percentage : 50}% Tercapai
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{
                  width: `${topWishlist ? topWishlist.progress.percentage : 50}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
              <span>
                Terkumpul: Rp{" "}
                {(topWishlist ? topWishlist.savedAmount : 6000000).toLocaleString(
                  "id-ID"
                )}
              </span>
              <span>
                Target: Rp{" "}
                {(topWishlist ? topWishlist.targetAmount : 12000000).toLocaleString(
                  "id-ID"
                )}
              </span>
            </div>
          </div>
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
    </div>
  );
}
