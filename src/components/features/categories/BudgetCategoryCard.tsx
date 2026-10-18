import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * ==============================================================================
 * Kenzo Treasury — Budget Category Card (BudgetCategoryCard)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menampilkan kartu individual untuk satu pos pengeluaran anggaran bulanan:
 * icon, nama pos, alokasi target plafon, realisasi terpakai, sisa kuota,
 * progress bar pemakaian, dan badge status kesehatan anggaran.
 */

export interface BudgetCategoryItem {
  id?: string;
  name: string;
  icon: string;
  target: number;
  spent: number;
  remaining: number;
  usagePercent: number;
  status: string;
}

interface BudgetCategoryCardProps {
  category: BudgetCategoryItem;
}

export function BudgetCategoryCard({ category }: BudgetCategoryCardProps) {
  return (
    <Card className="rounded-xl border border-border/70 bg-card p-4 space-y-3.5 shadow-xs transition-colors hover:border-foreground/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl select-none" aria-hidden="true">
            {category.icon}
          </span>
          <div>
            <h3 className="text-xs font-bold text-foreground leading-snug">
              {category.name}
            </h3>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Target: Rp {category.target.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="text-[10px] font-medium tracking-tight px-2 py-0.5 rounded-full"
        >
          {category.status}
        </Badge>
      </div>

      {/* Progress Bar & Sisa Nominal */}
      <div className="space-y-1.5 pt-1 border-t border-border/40">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[11px] text-muted-foreground">Sisa Kuota:</span>
          <span className="font-semibold text-foreground tabular-nums">
            Rp {category.remaining.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/70 transition-all duration-300"
            style={{ width: `${Math.min(category.usagePercent, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
