import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * ==============================================================================
 * Kenzo Treasury — Cashflow Summary Card Primitive (CashflowSummaryCard)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menyediakan layout dasar kartu metrik arus kas yang reusable dan konsisten
 * untuk ringkasan KPI di dashboard (Total Simpanan, Realisasi Kas, Sisa Kuota Uang Bebas).
 * Mencegah duplikasi markup card, padding, dan typography di level halaman.
 */

export interface CashflowSummaryCardProps {
  /**
   * Judul label metrik (e.g. "Total Brankas Simpanan", "Realisasi Pengeluaran Kas").
   */
  title: string;
  /**
   * Nominal atau nilai utama metrik (bisa berupa angka integer Rupiah atau teks terformat).
   */
  amount: number | string;
  /**
   * Kelas styling tambahan khusus untuk nilai nominal (misal text-emerald-600).
   */
  amountClassName?: string;
  /**
   * Bagian footer bawah (indikator ketahanan darurat, progress bar, atau info pemasukan).
   */
  footer: React.ReactNode;
  /**
   * Kelas container opsional.
   */
  className?: string;
}

export function CashflowSummaryCard({
  title,
  amount,
  amountClassName,
  footer,
  className,
}: CashflowSummaryCardProps) {
  const displayAmount =
    typeof amount === "number"
      ? `Rp ${amount.toLocaleString("id-ID")}`
      : amount;

  return (
    <Card
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
        <div
          className={cn(
            "text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums",
            amountClassName
          )}
        >
          {displayAmount}
        </div>
      </div>
      <div className="pt-4 border-t border-border/50 mt-4">
        {footer}
      </div>
    </Card>
  );
}
