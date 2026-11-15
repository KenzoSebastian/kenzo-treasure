"use client";

import * as React from "react";
import { DashboardSkeleton } from "@/components/layout/DashboardSkeleton";
import { useMonthNavigation } from "./MonthNavigationContext";

export interface DashboardMonthShellProps {
  children: React.ReactNode;
  resolvedMonthId?: string | null;
}

/**
 * Shell klien yang membungkus konten bulan aktif/terpilih di `/dashboard`.
 * Begitu `isSwitching` bernilai `true`, konten lama segera diganti `<DashboardSkeleton hideHeader />`
 * sehingga pengguna tidak pernah melihat data bulan sebelumnya yang basi saat fetching berlangsung.
 */
export function DashboardMonthShell({
  children,
  resolvedMonthId,
}: DashboardMonthShellProps) {
  const { isSwitching, pendingMonthId, clearMonthSwitch } =
    useMonthNavigation();

  React.useEffect(() => {
    if (pendingMonthId && resolvedMonthId === pendingMonthId) {
      clearMonthSwitch();
    }
  }, [pendingMonthId, resolvedMonthId, clearMonthSwitch]);

  if (isSwitching) {
    return <DashboardSkeleton hideHeader />;
  }

  return <>{children}</>;
}
