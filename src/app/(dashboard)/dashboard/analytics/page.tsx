import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalyticsSkeleton } from "@/components/layout/AnalyticsSkeleton";
import { getCachedAuthenticatedSession } from "@/lib/queries/auth";
import { getAnalyticsDashboardData } from "@/lib/queries/analytics";
import { AnalyticsDashboard } from "@/components/features/analytics";
import type { AnalyticsDashboardData } from "@/types/analytics";

export const metadata = {
  title: "Analitik Finansial • Kenzo Treasury",
  description: "Grafik arus kas, komposisi pengeluaran, dan disiplin anggaran.",
};

interface AnalyticsPageProps {
  searchParams?: Promise<{
    year?: string;
  }>;
}

export default async function AnalyticsPage(props: AnalyticsPageProps) {
  const searchParams = await props.searchParams;
  const parsedYear = searchParams?.year ? Number(searchParams.year) : NaN;
  const currentYear =
    Number.isInteger(parsedYear) && parsedYear >= 2020 && parsedYear <= 2100
      ? parsedYear
      : new Date().getFullYear();

  return (
    <React.Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsPageContent targetYear={currentYear} />
    </React.Suspense>
  );
}

async function AnalyticsPageContent({ targetYear }: { targetYear: number }) {
  const sessionRes = await getCachedAuthenticatedSession();
  const userId = sessionRes.success ? sessionRes.data.userId : undefined;

  const analyticsRes = userId
    ? await getAnalyticsDashboardData(userId, targetYear)
    : { success: false as const, error: "" };

  const emptyAnalytics: AnalyticsDashboardData = {
    selectedYear: targetYear,
    availableYears: [targetYear],
    availableMonths: [],
    savingsGrowth: [],
    monthlyCashflow: [],
    yearlyComparison: [
      {
        year: targetYear,
        totalIncome: 0,
        totalExpense: 0,
        totalNetSavings: 0,
        averageSavingsRate: 0,
        monthsCount: 0,
      },
    ],
    categoryDistribution: [],
    categoryDistributionByMonth: {},
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
            Pantau arus kas bulanan, komposisi pos pengeluaran, dan konsistensi menabung Anda.
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
