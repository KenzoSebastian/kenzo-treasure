"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Dropdown Pemilih Bulan & Status Siklus (MonthSelector)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menyediakan antarmuka navigasi antar-siklus bulan (aktif vs arsip historis).
 * Mengintegrasikan:
 * 1. Dropdown pemilih bulan dengan status badge visual (`🟢 Aktif` vs `🔒 Diarsipkan`).
 * 2. URL search parameters sinkronisasi (`/dashboard?month=<id>`).
 * 3. Tombol pemicu modal 1-Click Month Generator (`CreateMonthDialog`).
 */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown, Check, Lock, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateMonthDialog } from "./CreateMonthDialog";
import type { MonthSummary } from "@/types/month";

interface MonthSelectorProps {
  /**
   * Seluruh daftar siklus bulan milik pengguna dari database.
   */
  months: MonthSummary[];
  /**
   * ID bulan yang saat ini sedang aktif atau sedang dilihat.
   */
  currentMonthId?: string;
  /**
   * Status apakah bulan saat ini berstatus tertutup/arsip.
   */
  isClosed?: boolean;
}

export function MonthSelector({
  months,
  currentMonthId,
  isClosed = false,
}: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Cari objek bulan yang saat ini terpilih
  const selectedMonth = React.useMemo(() => {
    if (!currentMonthId) return months[0] || null;
    return months.find((m) => m.id === currentMonthId) || months[0] || null;
  }, [months, currentMonthId]);

  // Pisahkan bulan aktif vs bulan arsip
  const activeMonths = React.useMemo(
    () => months.filter((m) => !m.isClosed),
    [months]
  );
  const archivedMonths = React.useMemo(
    () => months.filter((m) => m.isClosed),
    [months]
  );

  const handleSelectMonth = (monthId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", monthId);
    router.push(`/dashboard?${params.toString()}`);
  };

  // Informasi bulan terbaru untuk referensi pembuatan bulan baru
  const latestMonth = months.length > 0 ? months[0] : null;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* 1. Tombol Dropdown Pemilih Bulan */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 gap-2 rounded-xl border-border/80 bg-background hover:bg-muted/50 font-medium text-xs shadow-2xs"
          >
            <Calendar className="size-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">
              {selectedMonth ? selectedMonth.name : "Pilih Bulan"}
            </span>

            {/* Badge Status Mini */}
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
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-64 rounded-xl border-border/80 p-1.5 shadow-md"
        >
          {/* Kelompok Bulan Aktif */}
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

          {/* Kelompok Bulan Diarsipkan */}
          {archivedMonths.length > 0 && (
            <>
              {activeMonths.length > 0 && <DropdownMenuSeparator className="my-1" />}
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

      {/* 2. Tombol Shortcut Buat Bulan Baru */}
      <CreateMonthDialog latestMonth={latestMonth} />
    </div>
  );
}
