import { getCurrentUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Calendar, Lock, Plus, Sparkles, BarChart3 } from "lucide-react";
import {
  getAllMonths,
  getActiveMonth,
  getMonthDetailById,
} from "@/lib/queries/months";
import { MonthSelector } from "@/components/features/months/MonthSelector";
import { CreateMonthDialog } from "@/components/features/months/CreateMonthDialog";
import {
  CashflowSummaryCard,
  DashboardHubCard,
  ExecutiveSummaryCard,
} from "@/components/features/dashboard";
import {
  BudgetCategoryList,
  type BudgetCategoryItem,
} from "@/components/features/categories/BudgetCategoryList";

/**
 * ==============================================================================
 * Kenzo Treasury — Dashboard Page (Server Component Orchestrator)
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Berkas ini bertindak sebagai Server Component Orchestrator utama untuk panel
 * kerja bulanan. Mengambil sesi pengguna dan data siklus bulan dari database,
 * lalu mendistribusikannya ke komponen-komponen fitur modular terisolasi:
 * 1. MonthSelector & CreateMonthDialog (Navigasi & Generator Siklus)
 * 2. CashflowSummaryCard (3 Metrik Utama Kas)
 * 3. BudgetCategoryList & BudgetCategoryCard (Alokasi 7 Pos Anggaran)
 * 4. DashboardWishlistCard (Sinking Fund Barang Impian)
 * 5. DashboardAnalyticsCard (KPI & Tren Historis)
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

  // Data referensi finansial siklus berjalan (Swiss Functional Invariants)
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
  const savingsBalance = 5000000;
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

  // 7 Pos Anggaran Wajib Bulanan (Fallback Mock untuk First-Time Preview)
  const defaultBudgetCategories: BudgetCategoryItem[] = [
    {
      name: "Bensin & Mobilitas",
      icon: "⛽",
      target: 200000,
      spent: 135000,
      remaining: 65000,
      usagePercent: 68,
      status: "Aman",
    },
    {
      name: "Belanja & Jajan",
      icon: "🍿",
      target: 300000,
      spent: 190000,
      remaining: 110000,
      usagePercent: 63,
      status: "Aman",
    },
    {
      name: "Listrik & Air",
      icon: "⚡",
      target: 450000,
      spent: 0,
      remaining: 450000,
      usagePercent: 0,
      status: "Terkunci",
    },
    {
      name: "Gereja / Persepuluhan",
      icon: "✝️",
      target: 400000,
      spent: 0,
      remaining: 400000,
      usagePercent: 0,
      status: "Terkunci",
    },
    {
      name: "Tabungan Otomatis",
      icon: "💰",
      target: 500000,
      spent: 500000,
      remaining: 0,
      usagePercent: 100,
      status: "Teralokasi",
    },
    {
      name: "Cicilan iPhone (24 bln)",
      icon: "📱",
      target: 735000,
      spent: 0,
      remaining: 735000,
      usagePercent: 0,
      status: "18 Bln Tersisa",
    },
    {
      name: "Talangan Mama (5 bln)",
      icon: "👩‍👦",
      target: 500000,
      spent: 0,
      remaining: 500000,
      usagePercent: 0,
      status: "3 Bln Tersisa",
    },
  ];

  // Susun data pos anggaran: utamakan data dinamis dari database, fallback ke baseline
  const activeCategories: BudgetCategoryItem[] =
    currentMonthDetail && currentMonthDetail.categories.length > 0
      ? currentMonthDetail.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || "📁",
          target: cat.targetBudget,
          spent: cat.spentAmount,
          remaining: cat.remainingBudget,
          usagePercent:
            cat.targetBudget > 0
              ? Math.round((cat.spentAmount / cat.targetBudget) * 100)
              : 0,
          status: cat.status,
        }))
      : defaultBudgetCategories;

  const totalTargetWajib = activeCategories.reduce(
    (sum, c) => sum + c.target,
    0
  );

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* 1. Header Ringkasan: Sapaan Personal, Status Siklus & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-muted-foreground font-medium">
            <Calendar className="size-3.5 text-foreground/70" />
            <span>
              {currentMonthDetail
                ? currentMonthDetail.name
                : "Belum Ada Siklus"}{" "}
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

        {/* Dropdown Pemilih Bulan & 1-Click Generator */}
        <div className="flex items-center gap-2">
          <MonthSelector
            months={monthsList}
            currentMonthId={currentMonthDetail?.id}
            isClosed={currentMonthDetail?.isClosed}
          />
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
        {/* Total Simpanan & Brankas Dana Darurat */}
        <CashflowSummaryCard
          title="Total Brankas Simpanan"
          amount={savingsBalance}
          footer={
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ketahanan Darurat:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                6,2 Bulan Aman
              </span>
            </div>
          }
        />

        {/* Realisasi Pengeluaran Bulan Ini */}
        <CashflowSummaryCard
          title="Realisasi Pengeluaran Kas"
          amount={totalSpent}
          footer={
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Terpakai dari Gaji:
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {usageRatio}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground/80 transition-all duration-300"
                  style={{ width: `${usageRatio}%` }}
                />
              </div>
            </div>
          }
        />

        {/* Sisa Anggaran Bebas / Buffer */}
        <CashflowSummaryCard
          title="Sisa Kuota Uang Bebas"
          amount={remainingCash}
          amountClassName="text-emerald-600 dark:text-emerald-400"
          footer={
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Pemasukan Gaji Pokok:
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                Rp {salaryBase.toLocaleString("id-ID")}
              </span>
            </div>
          }
        />
      </div>

      {/* 3. Seksi 7 Pos Anggaran Wajib */}
      <BudgetCategoryList
        categories={activeCategories}
        salaryBase={salaryBase}
        totalTarget={totalTargetWajib}
      />

      {/* 4. Seksi Sinking Fund & Pelunasan Cicilan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        {/* Hub Wishlist Barang Impian */}
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
                🎯 Target Tabungan Kamera & Lensa
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                50% Tercapai
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-amber-500 w-1/2" />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
              <span>Terkumpul: Rp 6.000.000</span>
              <span>Target: Rp 12.000.000</span>
            </div>
          </div>
        </DashboardHubCard>

        {/* Hub Analitik & Historis Kas */}
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
                28,5%
              </span>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Cicilan Aktif
              </span>
              <span className="text-base font-bold text-foreground tabular-nums">
                2 Pos
              </span>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Kepatuhan Pos
              </span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                100%
              </span>
            </div>
          </div>
        </DashboardHubCard>
      </div>
    </div>
  );
}
