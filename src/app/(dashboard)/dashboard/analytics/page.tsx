import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCachedAuthenticatedSession } from "@/lib/queries/auth";
import { getAnalyticsDashboardData } from "@/lib/queries/analytics";
import { AnalyticsDashboard } from "@/components/features/analytics";
import type { AnalyticsDashboardData } from "@/types/analytics";

export const metadata = {
  title: "Analitik Finansial • Kenzo Treasury",
  description: "Grafik historis dan analisis arus kas bulanan.",
};

export default async function AnalyticsPage() {
  const sessionRes = await getCachedAuthenticatedSession();
  const userId = sessionRes.success ? sessionRes.data.userId : undefined;
  const currentYear = new Date().getFullYear();

  const analyticsRes = userId
    ? await getAnalyticsDashboardData(userId, currentYear)
    : { success: false as const, error: "" };

  const emptyAnalytics: AnalyticsDashboardData = {
    selectedYear: currentYear,
    availableYears: [currentYear],
    savingsGrowth: [],
    monthlyCashflow: [],
    yearlyComparison: [
      {
        year: currentYear,
        totalIncome: 0,
        totalExpense: 0,
        totalNetSavings: 0,
        averageSavingsRate: 0,
        monthsCount: 0,
      },
    ],
    categoryDistribution: [],
  };

  const activeData =
    analyticsRes.success && analyticsRes.data
      ? analyticsRes.data
      : emptyAnalytics;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Grafik & Analitik Finansial
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Visualisasi interaktif tren tabungan, perbandingan arus kas bulanan,
            dan rekap tahunan.
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
