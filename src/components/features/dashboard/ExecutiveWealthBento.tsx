"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Executive Wealth Bento (Tier 1 Hero Cockpit)
 * ==============================================================================
 *
 * Menggabungkan Total Brankas Simpanan (Net Wealth) dan Arus Kas Siklus Berjalan
 * ke dalam satu Bento Grid modern tanpa redundansi angka:
 * 1. Kartu Kiri (Hero Brankas): Akumulasi kekayaan likuid, Tabungan Bebas,
 *    Brankas Dana Darurat, dan meter Safety Months.
 * 2. Kartu Kanan (Cockpit Arus Kas): Sisa Kuota Uang Bebas (Surplus),
 *    Pemasukan vs Pengeluaran aktual, dan bar kesehatan anggaran.
 */

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/financial-calculations";
import { cn } from "@/lib/utils";
import type { SavingsVaultSummary } from "@/types/savings";

export interface ExecutiveWealthBentoProps {
  /** Ringkasan akun tabungan & brankas darurat pengguna */
  vault: SavingsVaultSummary;
  /** Total seluruh pemasukan (gaji + freelance) */
  totalIncome: number;
  /** Total pengeluaran aktual terpakai */
  totalSpent: number;
  /** Sisa kuota kas uang bebas / surplus kas */
  remainingCash: number;
  /** Rasio penyerapan kas (%) */
  usageRatio: number;
  /** Nama bulan siklus (misal: "November 2026") */
  monthName?: string;
  /** Status tutup buku siklus */
  isClosed?: boolean;
  /** Gaji pokok rutin baseline */
  baseSalary?: number;
  /** Akumulasi pemasukan freelance */
  additionalIncomes?: number;
  /** Kelas styling tambahan */
  className?: string;
}

export function ExecutiveWealthBento({
  vault,
  totalIncome,
  totalSpent,
  remainingCash,
  usageRatio,
  monthName,
  isClosed = false,
  baseSalary,
  additionalIncomes,
  className,
}: ExecutiveWealthBentoProps) {
  // 1. Status Kesehatan Anggaran
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
      "Pengeluaran melampaui batas aman. Tahan belanja untuk mencegah penarikan darurat.";
  } else if (usageRatio > 70) {
    healthStatus = "warning";
    statusBadgeLabel = "Mendekati Batas >70%";
    statusBadgeColor =
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
    statusBarColor = "bg-amber-500";
    statusAdvice =
      "Waspada: Belanja telah menyerap lebih dari 70% pemasukan bulan ini.";
  }

  const progressPercent = Math.min(100, Math.max(0, usageRatio));

  const safetyMonthsFormatted = vault.safetyMonths.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5", className)}>
      {/* ──────────────────────────────────────────────────────────────────────────
          1. KARTU HERO: TOTAL BRANKAS SIMPANAN (60-65% Lebar di Desktop)
          ────────────────────────────────────────────────────────────────────────── */}
      <Card className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-5">
        {/* Ambient Subtle Accent Glow */}
        <div className="absolute -top-16 -left-16 size-48 rounded-full blur-3xl pointer-events-none opacity-20 bg-emerald-500" />

        <div className="space-y-4 relative z-10">
          {/* Header Row: Label & Safety Months Badge */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Total Brankas Simpanan
                </span>
                <span className="text-xs text-muted-foreground">
                  Akumulasi simpanan riil
                </span>
              </div>
            </div>

            <Badge
              variant="outline"
              className={cn(
                "rounded-full text-[11px] font-semibold gap-1 px-2.5 py-0.5 shrink-0",
                vault.safetyMonths >= 3
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : vault.safetyMonths > 0
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "border-border/70 bg-muted/30 text-muted-foreground"
              )}
            >
              <ShieldCheck className="size-3" />
              <span className="tabular-nums">{safetyMonthsFormatted} Bulan Aman</span>
            </Badge>
          </div>

          {/* Headline Display Numeral */}
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
              {formatRupiah(vault.totalVaultBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total aset kas likuid dan dana darurat yang tersimpan di brankas.
            </p>
          </div>

          {/* Double-Bezel Inset Sub-Cards: Tabungan Bebas vs Dana Darurat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Sub-Card A: Tabungan Bebas (Likuid) */}
            <div className="rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/30 transition-colors p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Wallet className="size-3.5 text-blue-500" />
                  <span>Tabungan Bebas</span>
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                >
                  Likuid
                </Badge>
              </div>
              <div className="text-lg font-bold text-foreground tabular-nums">
                {formatRupiah(vault.freeSavingsBalance)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Siap dialokasikan ke Wishlist Impian
              </p>
            </div>

            {/* Sub-Card B: Dana Darurat (Terkunci) */}
            <div className="rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/30 transition-colors p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Lock className="size-3.5 text-amber-500" />
                  <span>Dana Darurat</span>
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                >
                  Terkunci
                </Badge>
              </div>
              <div className="text-lg font-bold text-foreground tabular-nums">
                {formatRupiah(vault.emergencyFundBalance)}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {vault.emergencyFundTarget > 0
                  ? `Target: ${formatRupiah(vault.emergencyFundTarget)} (${vault.percentageOfTarget}%)`
                  : "Target belum disetel"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-end relative z-10">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
          >
            <Link href="/dashboard/vault">
              <span>Buka Detail Brankas</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </Card>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. KARTU KANAN: COCKPIT ARUS KAS BULAN BERJALAN (35-40% Lebar di Desktop)
          ────────────────────────────────────────────────────────────────────────── */}
      <Card className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4">
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
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3.5">
            <div className="flex items-center gap-2">
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
          <div className="space-y-2 pt-1">
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
    </div>
  );
}
