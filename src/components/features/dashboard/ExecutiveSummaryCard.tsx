"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Executive Summary Card & Cashflow KPI (Fase F6)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Kartu ringkasan eksekutif (Executive Summary Card) di bagian atas dashboard
 * yang menyajikan 3 metrik KPI arus kas utama secara instan:
 * 1. Total Pemasukan Bulan Berjalan (Gaji Pokok + Freelance)
 * 2. Total Pengeluaran Terpakai (Realisasi Kas)
 * 3. Saldo Tabungan Bersih (Net Savings) & Rasio Tabungan (Savings Rate)
 *
 * Dilengkapi visual bar progress kesehatan anggaran dengan 3 zona status:
 * - 🟢 Healthy (Terpakai <= 70%): Arus kas sehat dan aman.
 * - 🟡 Warning (Terpakai 71% - 90%): Mendekati batas plafon kas.
 * - 🔴 Overbudget / Defisit (> 90% atau Pengeluaran > Pemasukan).
 *
 * Sesuai aturan desain proyek:
 * - Bebas 100% dari font monospace (`font-mono`).
 * - Angka diformat proporsional dengan `tabular-nums`.
 * - Desain responsif mobile-first (1 kolom di HP, 3 kolom di desktop).
 */

import React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatRupiah,
  calculateNetCashflow,
  calculateSavingsRate,
} from "@/lib/financial-calculations";

export interface ExecutiveSummaryCardProps {
  /** Total seluruh pemasukan (gaji + freelance) dalam integer Rupiah */
  totalIncome: number;
  /** Total seluruh pengeluaran terpakai dalam integer Rupiah */
  totalSpent: number;
  /** Surplus / tabungan bersih kas (opsional, otomatis dihitung jika tidak diisi) */
  netSavings?: number;
  /** Persentase rasio tabungan (opsional, otomatis dihitung jika tidak diisi) */
  savingsRate?: number;
  /** Nominal gaji pokok rutin baseline */
  baseSalary?: number;
  /** Akumulasi pemasukan freelance/sampingan */
  additionalIncomes?: number;
  /** Nama bulan siklus (misal: "Oktober 2026") */
  monthName?: string;
  /** Status tutup buku siklus */
  isClosed?: boolean;
  /** Tambahan styling container */
  className?: string;
}

export function ExecutiveSummaryCard({
  totalIncome,
  totalSpent,
  netSavings: explicitNetSavings,
  savingsRate: explicitSavingsRate,
  baseSalary,
  additionalIncomes,
  monthName,
  isClosed = false,
  className,
}: ExecutiveSummaryCardProps) {
  // 1. Kalkulasi murni finansial via single source of truth
  const netSavings =
    explicitNetSavings !== undefined
      ? explicitNetSavings
      : calculateNetCashflow(totalIncome, totalSpent);

  const savingsRate =
    explicitSavingsRate !== undefined
      ? explicitSavingsRate
      : calculateSavingsRate(totalIncome, netSavings);

  const usageRatio =
    totalIncome > 0 ? Math.round((totalSpent / totalIncome) * 100) : 0;

  // 2. Klasifikasi Status Kesehatan Anggaran
  type BudgetHealth = "healthy" | "warning" | "overbudget";

  let healthStatus: BudgetHealth = "healthy";
  let statusBadgeLabel = "Anggaran Sehat";
  let statusBadgeColor =
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  let statusDotColor = "bg-emerald-500";
  let statusIcon = ShieldCheck;
  let summaryAdvice =
    "Kondisi arus kas sangat prima. Pengeluaran terkendali di bawah 70% pemasukan, surplus kas siap dialokasikan ke tabungan.";

  if (totalSpent > totalIncome || usageRatio > 90) {
    healthStatus = "overbudget";
    statusBadgeLabel = totalSpent > totalIncome ? "Defisit Kas" : "Overbudget";
    statusBadgeColor =
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30";
    statusDotColor = "bg-rose-500";
    statusIcon = ShieldAlert;
    summaryAdvice =
      "Peringatan: Realisasi pengeluaran melampaui batas aman. Tahan pengeluaran pos bebas untuk mencegah penarikan dana darurat.";
  } else if (usageRatio > 70) {
    healthStatus = "warning";
    statusBadgeLabel = "Mendekati Batas (70%+)";
    statusBadgeColor =
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
    statusDotColor = "bg-amber-500";
    statusIcon = AlertTriangle;
    summaryAdvice =
      "Waspada: Pengeluaran telah menyerap lebih dari 70% pemasukan. Prioritaskan pos wajib hingga akhir periode siklus.";
  }

  const HealthIcon = statusIcon;
  const progressPercent = Math.min(100, Math.max(0, usageRatio));

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all",
        className
      )}
    >
      {/* Background Accent Subtle Glow */}
      <div
        className={cn(
          "absolute -top-16 -right-16 size-48 rounded-full blur-3xl pointer-events-none opacity-20",
          healthStatus === "healthy" && "bg-emerald-500",
          healthStatus === "warning" && "bg-amber-500",
          healthStatus === "overbudget" && "bg-rose-500"
        )}
      />

      {/* Header: Label Siklus & Status Kesehatan Anggaran */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              Executive Cashflow KPI
            </h2>
            <p className="text-xs text-muted-foreground">
              {monthName ? `Siklus ${monthName}` : "Ringkasan Finansial Bulanan"}{" "}
              {isClosed && "• Arsip Tutup Buku"}
            </p>
          </div>
        </div>

        {/* Badge Status Kesehatan */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border self-start sm:self-auto",
            statusBadgeColor
          )}
        >
          <span
            className={cn("size-2 rounded-full animate-pulse", statusDotColor)}
          />
          <HealthIcon className="size-3.5" />
          <span>{statusBadgeLabel}</span>
        </div>
      </div>

      {/* Tiga Pilar Metrik Finansial Utama (KPI Strip) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 py-5">
        {/* 1. Total Pemasukan */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <div className="size-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="size-3.5" />
            </div>
            <span>Total Pemasukan</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight tabular-nums">
            {formatRupiah(totalIncome)}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {baseSalary !== undefined && additionalIncomes !== undefined ? (
              <>
                Gaji: <span className="tabular-nums font-medium text-foreground/80">{formatRupiah(baseSalary)}</span>
                {additionalIncomes > 0 && (
                  <> • Freelance: <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{`+${formatRupiah(additionalIncomes)}`}</span></>
                )}
              </>
            ) : (
              "Akumulasi gaji dan pendapatan sampingan"
            )}
          </p>
        </div>

        {/* 2. Total Pengeluaran */}
        <div className="space-y-1.5 sm:border-x sm:border-border/60 sm:px-6">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <div className="size-5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="size-3.5" />
            </div>
            <span>Realisasi Kas Keluar</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight tabular-nums">
            {formatRupiah(totalSpent)}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Terserap <span className="tabular-nums font-semibold text-foreground/80">{`${usageRatio}%`}</span> dari total pemasukan
          </p>
        </div>

        {/* 3. Saldo Tabungan Bersih (Net Savings) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <div className="size-5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <PiggyBank className="size-3.5" />
            </div>
            <span>Net Tabungan (Surplus)</span>
          </div>
          <div
            className={cn(
              "text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums",
              netSavings >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {netSavings >= 0 ? `+${formatRupiah(netSavings)}` : formatRupiah(netSavings)}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Rasio Tabungan: <span className="tabular-nums font-semibold text-foreground/80">{`${savingsRate}%`}</span>
          </p>
        </div>
      </div>

      {/* Visual Bar Progress Kesehatan Anggaran (Health Progress Bar) */}
      <div className="pt-4 border-t border-border/60 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground flex items-center gap-1">
            <span>Penyerapan Anggaran:</span>
            <strong className="text-foreground font-bold tabular-nums">
              {`${usageRatio}%`}
            </strong>
          </span>
          <span className="text-[11px] text-muted-foreground">
            Batas Maksimal Kas: <span className="tabular-nums font-medium text-foreground/80">{formatRupiah(totalIncome)}</span>
          </span>
        </div>

        {/* Multi-Zone Track Bar */}
        <div className="relative h-2.5 w-full bg-muted/60 rounded-full overflow-hidden">
          {/* Active Fill Bar */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              healthStatus === "healthy" && "bg-emerald-500",
              healthStatus === "warning" && "bg-amber-500",
              healthStatus === "overbudget" && "bg-rose-500"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Threshold Markers & Advice Footnote */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1">
          <p className="leading-relaxed flex-1">{summaryAdvice}</p>
          <div className="flex items-center gap-3 shrink-0 text-[10px] text-muted-foreground/80">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" /> &le;70% Sehat
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-amber-500" /> &gt;70% Waspada
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-rose-500" /> &gt;90% Defisit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
