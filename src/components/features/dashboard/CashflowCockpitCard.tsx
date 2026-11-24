"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Cashflow Cockpit Card (Tier 2 Full-Width Monthly Overview)
 * ==============================================================================
 *
 * Menampilkan ringkasan arus kas siklus berjalan dalam format kartu lebar penuh
 * (Full-Width Viewport-Fitted):
 * 1. Header: Nama Siklus, Subtitle Zero-Based Budgeting, Badge Status Kesehatan Anggaran.
 * 2. Headline: Sisa Kuota Uang Bebas (Surplus) dengan tipografi sans-serif tabular-nums.
 * 3. 2-Row Breakdown: Total Pemasukan (Gaji + Freelance) vs Realisasi Belanja aktual.
 * 4. Meter Progress Bar: Rasio penyerapan anggaran dan semantic financial advice.
 */

import * as React from "react";
import { ArrowDownLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/financial-calculations";
import { cn } from "@/lib/utils";

export interface CashflowCockpitCardProps {
  /** Nama bulan siklus (misal: "November 2026") */
  monthName?: string;
  /** Status tutup buku siklus */
  isClosed?: boolean;
  /** Total seluruh pemasukan (gaji + freelance) */
  totalIncome: number;
  /** Total pengeluaran aktual terpakai */
  totalSpent: number;
  /** Sisa kuota kas uang bebas / surplus kas */
  remainingCash: number;
  /** Rasio penyerapan kas (%) */
  usageRatio: number;
  /** Gaji pokok rutin baseline */
  baseSalary?: number;
  /** Akumulasi pemasukan freelance */
  additionalIncomes?: number;
  /** Kelas styling tambahan */
  className?: string;
}

export function CashflowCockpitCard({
  monthName,
  isClosed = false,
  totalIncome,
  totalSpent,
  remainingCash,
  usageRatio,
  baseSalary,
  additionalIncomes,
  className,
}: CashflowCockpitCardProps) {
  // 1. Evaluasi Status Kesehatan Anggaran
  type BudgetHealth = "healthy" | "warning" | "overbudget";
  let healthStatus: BudgetHealth = "healthy";
  let statusBadgeLabel = "Anggaran Sehat";
  let statusBadgeColor =
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  let statusBarColor = "bg-emerald-500";
  let statusAdvice =
    "Kondisi kas prima, pengeluaran terkendali di bawah 70% pemasukan.";

  if (totalSpent > totalIncome || usageRatio > 90) {
    healthStatus = "overbudget";
    statusBadgeLabel = totalSpent > totalIncome ? "Defisit Kas" : "Overbudget";
    statusBadgeColor =
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30";
    statusBarColor = "bg-rose-500";
    statusAdvice =
      "Pengeluaran melampaui batas aman. Tahan belanja untuk mencegah defisit kas.";
  } else if (usageRatio > 70) {
    healthStatus = "warning";
    statusBadgeLabel = "Mendekati Batas >70%";
    statusBadgeColor =
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
    statusBarColor = "bg-amber-500";
    statusAdvice =
      "Waspada: Belanja telah menyerap lebih dari 70% batas kas bulan ini.";
  }

  const progressPercent = Math.min(100, Math.max(0, usageRatio));

  return (
    <Card
      className={cn(
        "w-full rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4",
        className
      )}
    >
      {/* Ambient Glow Sesuai Status Kesehatan */}
      <div
        className={cn(
          "absolute -top-16 -right-16 size-48 rounded-full blur-3xl pointer-events-none opacity-20",
          healthStatus === "healthy" && "bg-emerald-500",
          healthStatus === "warning" && "bg-amber-500",
          healthStatus === "overbudget" && "bg-rose-500"
        )}
      />

      <div className="space-y-4 relative z-10">
        {/* Header Row: Nama Siklus & Badge Kesehatan */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                Arus Kas {monthName ?? "Bulan Ini"}
              </span>
              <span className="text-xs text-muted-foreground">
                {isClosed ? "Arsip Tutup Buku" : "Zero-Based Budgeting"}
              </span>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "rounded-full text-[11px] font-semibold px-2.5 py-0.5 shrink-0 border",
              statusBadgeColor
            )}
          >
            {statusBadgeLabel}
          </Badge>
        </div>

        {/* Headline Surplus: Sisa Kuota Uang Bebas */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground block font-medium">
            Sisa Kuota Uang Bebas (Surplus)
          </span>
          <div
            className={cn(
              "text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums",
              remainingCash >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {remainingCash >= 0 ? `+${formatRupiah(remainingCash)}` : formatRupiah(remainingCash)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Dana yang belum terpakai dan siap disapu ke tabungan di akhir bulan.
          </p>
        </div>

        {/* Clean 2-Row Inflow vs Outflow Mini-Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Row 1: Pemasukan Kas */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-2.5 px-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="size-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-foreground block truncate">
                  Total Pemasukan
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Gaji: {formatRupiah(baseSalary ?? totalIncome)}
                  {additionalIncomes ? ` • Freelance: +${formatRupiah(additionalIncomes)}` : ""}
                </span>
              </div>
            </div>
            <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums shrink-0">
              {formatRupiah(totalIncome)}
            </span>
          </div>

          {/* Row 2: Pengeluaran Kas */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-2.5 px-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="size-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-foreground block truncate">
                  Realisasi Belanja
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Terserap {usageRatio}% dari batas kas
                </span>
              </div>
            </div>
            <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums shrink-0">
              {formatRupiah(totalSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Advice */}
      <div className="pt-2 border-t border-border/60 space-y-1.5 relative z-10">
        <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>Penyerapan Anggaran: {usageRatio}%</span>
          <span>Batas Kas: {formatRupiah(totalIncome)}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", statusBarColor)}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground pt-0.5 leading-snug">
          {statusAdvice}
        </p>
      </div>
    </Card>
  );
}
