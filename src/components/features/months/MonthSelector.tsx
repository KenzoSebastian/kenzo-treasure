"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Dropdown Pemilih Bulan & Status Siklus (MonthSelector)
 * ==============================================================================
 *
 * Menyediakan antarmuka navigasi antar-siklus bulan (aktif vs arsip historis):
 * 1. Dropdown pemilih bulan dengan indikator status bersih (`Aktif` vs `Arsip`).
 * 2. Integrasi `useMonthNavigation` (`startMonthSwitch`) untuk menampilkan
 *    `<DashboardSkeleton hideHeader />` secara instan (`0 ms`) saat berpindah bulan.
 * 3. Mendukung `showCreateButton?: boolean` (default `true`): ketika `false`,
 *    merender langsung `<DropdownMenu>` tanpa wrapper `div` agar menyatu mulus
 *    pada grid `2x2` di header `/dashboard`.
 */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown, Check, Lock, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CreateMonthDialog } from "./CreateMonthDialog";
import { useMonthNavigation } from "./MonthNavigationContext";
import type { MonthSummary } from "@/types/month";

export interface MonthSelectorProps {
  months: MonthSummary[];
  currentMonthId?: string;
  isClosed?: boolean;
  showCreateButton?: boolean;
  defaultBaseSalary?: number | null;
  templateCount?: number;
}

export function MonthSelector({
  months,
  currentMonthId,
  showCreateButton = true,
  defaultBaseSalary,
  templateCount,
}: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSwitching, pendingMonthName, startMonthSwitch } =
    useMonthNavigation();

  const selectedMonth = React.useMemo(() => {
    if (!currentMonthId) return months[0] || null;
    return months.find((m) => m.id === currentMonthId) || months[0] || null;
  }, [months, currentMonthId]);

  const activeMonths = React.useMemo(
    () => months.filter((m) => !m.isClosed),
    [months]
  );
  const archivedMonths = React.useMemo(
    () => months.filter((m) => m.isClosed),
    [months]
  );

  const handleSelectMonth = (monthId: string) => {
    const activeId = selectedMonth?.id ?? currentMonthId;
    if (monthId === activeId) {
      return;
    }

    const targetMonth = months.find((m) => m.id === monthId);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("month", monthId);

    startMonthSwitch(monthId, targetMonth?.name, () => {
      router.push(`/dashboard?${params.toString()}`);
    });
  };

  const latestMonth = months.length > 0 ? months[0] : null;

  const dropdownElement = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isSwitching}
          className="h-9 px-3 gap-2 rounded-xl border-border/80 bg-background hover:bg-muted/50 font-medium text-xs shadow-2xs"
        >
          {isSwitching ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              <span className="font-semibold text-foreground">
                {pendingMonthName
                  ? `Memuat ${pendingMonthName}...`
                  : "Memuat..."}
              </span>
            </>
          ) : (
            <>
              <Calendar className="size-3.5 text-muted-foreground" />
              <span className="font-semibold text-foreground">
                {selectedMonth ? selectedMonth.name : "Pilih Bulan"}
              </span>

              {selectedMonth && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                    selectedMonth.isClosed
                      ? "bg-muted text-muted-foreground"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {selectedMonth.isClosed ? (
                    <>
                      <Lock className="size-2.5" />
                      <span>Arsip</span>
                    </>
                  ) : (
                    <>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <span>Aktif</span>
                    </>
                  )}
                </span>
              )}

              <ChevronDown className="size-3.5 text-muted-foreground ml-0.5 opacity-60" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-64 rounded-xl border-border/80 p-1.5 shadow-md"
      >
        {activeMonths.length > 0 && (
          <>
            <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
              Siklus Berjalan (Aktif)
            </DropdownMenuLabel>
            {activeMonths.map((m) => {
              const isSelected = selectedMonth?.id === m.id;
              return (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => handleSelectMonth(m.id)}
                  className="flex items-center justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-medium text-foreground">{m.name}</span>
                  </div>
                  {isSelected && (
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {archivedMonths.length > 0 && (
          <>
            {activeMonths.length > 0 && (
              <DropdownMenuSeparator className="my-1" />
            )}
            <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
              Riwayat Arsip (Tutup Buku)
            </DropdownMenuLabel>
            {archivedMonths.map((m) => {
              const isSelected = selectedMonth?.id === m.id;
              return (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => handleSelectMonth(m.id)}
                  className="flex items-center justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer opacity-80 hover:opacity-100"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="size-3 text-muted-foreground" />
                    <span className="font-normal text-muted-foreground">
                      {m.name}
                    </span>
                  </div>
                  {isSelected && <Check className="size-3.5 text-foreground" />}
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {months.length === 0 && (
          <div className="p-3 text-center text-xs text-muted-foreground">
            Belum ada lembar kerja siklus bulan.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (!showCreateButton) {
    return dropdownElement;
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {dropdownElement}
      <CreateMonthDialog
        latestMonth={latestMonth}
        defaultBaseSalary={defaultBaseSalary}
        templateCount={templateCount}
      />
    </div>
  );
}
