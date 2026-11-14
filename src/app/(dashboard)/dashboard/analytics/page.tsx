import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/actions/auth";
import { getAnalyticsDashboardData } from "@/lib/queries/analytics";
import { AnalyticsDashboard } from "@/components/features/analytics";
import type { AnalyticsDashboardData } from "@/types/analytics";

export const metadata = {
  title: "Analitik Finansial • Kenzo Treasury",
  description: "Grafik historis dan analisis arus kas bulanan.",
};

export default async function AnalyticsPage() {
  const userRes = await getCurrentUser();
  const userId = userRes.success ? userRes.data?.id : undefined;

  const analyticsRes = userId
    ? await getAnalyticsDashboardData(userId, 2026)
    : { success: false as const, error: "" };

  const fallbackAnalytics: AnalyticsDashboardData = {
    selectedYear: 2026,
    availableYears: [2026, 2027],
    savingsGrowth: [
      {
        monthId: "m-1",
        monthName: "Agustus 2026",
        shortMonth: "Agu 26",
        year: 2026,
        monthIndex: 8,
        netSavings: 1150000,
        cumulativeSavings: 3150000,
        savingsRate: 28,
      },
      {
        monthId: "m-2",
        monthName: "September 2026",
        shortMonth: "Sep 26",
        year: 2026,
        monthIndex: 9,
        netSavings: 1450000,
        cumulativeSavings: 4600000,
        savingsRate: 32,
      },
      {
        monthId: "m-3",
        monthName: "Oktober 2026",
        shortMonth: "Okt 26",
        year: 2026,
        monthIndex: 10,
        netSavings: 1580000,
        cumulativeSavings: 6180000,
        savingsRate: 35,
      },
    ],
    monthlyCashflow: [
      {
        monthId: "m-1",
        monthName: "Agustus 2026",
        shortMonth: "Agu 26",
        year: 2026,
        monthIndex: 8,
        income: 4000000,
        expense: 2850000,
        netSavings: 1150000,
        savingsRate: 28,
      },
      {
        monthId: "m-2",
        monthName: "September 2026",
        shortMonth: "Sep 26",
        year: 2026,
        monthIndex: 9,
        income: 4500000,
        expense: 3050000,
        netSavings: 1450000,
        savingsRate: 32,
      },
      {
        monthId: "m-3",
        monthName: "Oktober 2026",
        shortMonth: "Okt 26",
        year: 2026,
        monthIndex: 10,
        income: 4500000,
        expense: 2920000,
        netSavings: 1580000,
        savingsRate: 35,
      },
    ],
    yearlyComparison: [
      {
        year: 2026,
        totalIncome: 13000000,
        totalExpense: 8820000,
        totalNetSavings: 4180000,
        averageSavingsRate: 32,
        monthsCount: 3,
      },
      {
        year: 2027,
        totalIncome: 48000000,
        totalExpense: 31200000,
        totalNetSavings: 16800000,
        averageSavingsRate: 35,
        monthsCount: 12,
      },
    ],
    categoryDistribution: [
      {
        categoryId: "c-1",
        categoryName: "Cicilan iPhone",
        icon: "📱",
        group: "pos_wajib",
        amount: 735000,
        target: 735000,
        percentageOfTotal: 25,
      },
      {
        categoryId: "c-2",
        categoryName: "Tabungan Otomatis",
        icon: "💰",
        group: "uang_bebas_tabungan",
        amount: 500000,
        target: 500000,
        percentageOfTotal: 17,
      },
      {
        categoryId: "c-3",
        categoryName: "Talangan Mama",
        icon: "👩‍👦",
        group: "pos_wajib",
        amount: 500000,
        target: 500000,
        percentageOfTotal: 17,
      },
      {
        categoryId: "c-4",
        categoryName: "Listrik & Air",
        icon: "⚡",
        group: "pos_wajib",
        amount: 450000,
        target: 450000,
        percentageOfTotal: 15,
      },
      {
        categoryId: "c-5",
        categoryName: "Gereja / Persepuluhan",
        icon: "✝️",
        group: "pos_wajib",
        amount: 400000,
        target: 400000,
        percentageOfTotal: 14,
      },
      {
        categoryId: "c-6",
        categoryName: "Belanja & Jajan",
        icon: "🍿",
        group: "uang_bebas_tabungan",
        amount: 200000,
        target: 300000,
        percentageOfTotal: 7,
      },
      {
        categoryId: "c-7",
        categoryName: "Bensin & Mobilitas",
        icon: "⛽",
        group: "kebutuhan",
        amount: 135000,
        target: 200000,
        percentageOfTotal: 5,
      },
    ],
  };

  const activeData =
    analyticsRes.success &&
    analyticsRes.data &&
    analyticsRes.data.monthlyCashflow.length > 0
      ? analyticsRes.data
      : fallbackAnalytics;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Grafik & Analitik Finansial
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Visualisasi interaktif tren tabungan, perbandingan arus kas bulanan,
            dan rekap tahunan 2026 vs 2027.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs self-start sm:self-auto rounded-xl"
        >
          <Link href="/dashboard">
            <ArrowLeft className="size-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </Button>
      </div>

      <AnalyticsDashboard data={activeData} />
    </div>
  );
}
