"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Wealth Hero Card (Tier 1 Full-Width Command Center)
 * ==============================================================================
 *
 * Menampilkan ringkasan total aset kas likuid dan dana darurat (`Total Brankas Simpanan`)
 * dalam format kartu lebar penuh (Full-Width Viewport-Fitted), terintegrasi dengan:
 * 1. Headline Saldo Total Brankas Simpanan (sans-serif `tabular-nums`).
 * 2. Badge Ketahanan Darurat (*Safety Months*).
 * 3. Sub-Vault Inset Chips (*Tabungan Bebas* vs *Dana Darurat*).
 * 4. Komponen grafik interaktif `WealthTrajectoryChart` (Line & Bar, 4 timeframe, 2-axis crosshair).
 * 5. Tautan langsung navigasi brankas ke `/dashboard/vault`.
 */

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Wallet, Lock, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/financial-calculations";
import { WealthTrajectoryChart } from "./WealthTrajectoryChart";
import { cn } from "@/lib/utils";
import type { SavingsVaultSummary } from "@/types/savings";
import type { AllTimeframeSnapshots } from "@/types/savings-snapshots";

export interface WealthHeroCardProps {
  /** Ringkasan akun tabungan & brankas darurat pengguna */
  vault: SavingsVaultSummary;
  /** Dataset time-series lengkap 4 timeframe untuk grafik */
  snapshotsByTimeframe: AllTimeframeSnapshots;
  /** Kelas styling tambahan */
  className?: string;
}

export function WealthHeroCard({
  vault,
  snapshotsByTimeframe,
  className,
}: WealthHeroCardProps) {
  const safetyMonthsFormatted = vault.safetyMonths.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <Card
      className={cn(
        "w-full rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4 lg:min-h-[480px]",
        className
      )}
    >
      {/* Ambient Subtle Accent Glow */}
      <div className="absolute -top-16 -left-16 size-56 rounded-full blur-3xl pointer-events-none opacity-20 bg-emerald-500" />

      {/* 1. Header Row: Label, Safety Months Badge & Action Link */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Total Brankas Simpanan
            </span>
            <span className="text-xs text-muted-foreground">
              Akumulasi kekayaan kas riil
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
          >
            <Link href="/dashboard/vault">
              <span>Detail Brankas</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Headline Saldo & Sub-Vault Inset Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        <div className="space-y-0.5">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
            {formatRupiah(vault.totalVaultBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total aset kas likuid dan dana darurat yang tersimpan di brankas.
          </p>
        </div>

        {/* Sub-Vault Inset Chips (F-07) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-1.5 flex items-center gap-2 text-xs">
            <Wallet className="size-3.5 text-blue-500 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Tabungan Bebas
              </span>
              <span className="font-bold text-foreground tabular-nums">
                {formatRupiah(vault.freeSavingsBalance)}
              </span>
            </div>
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 ml-1 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
            >
              Likuid
            </Badge>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-1.5 flex items-center gap-2 text-xs">
            <Lock className="size-3.5 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Dana Darurat
              </span>
              <span className="font-bold text-foreground tabular-nums">
                {formatRupiah(vault.emergencyFundBalance)}
              </span>
            </div>
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 ml-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              {vault.percentageOfTarget}% Target
            </Badge>
          </div>
        </div>
      </div>

      {/* 3. Area Kanvas Grafik Histori Time-Series */}
      <div className="pt-2 flex-1 relative z-10">
        <WealthTrajectoryChart
          snapshotsByTimeframe={snapshotsByTimeframe}
          initialTimeframe="monthly"
        />
      </div>
    </Card>
  );
}
