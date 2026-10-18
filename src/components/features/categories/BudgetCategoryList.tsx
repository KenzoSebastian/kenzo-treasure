import * as React from "react";
import { BudgetCategoryCard, type BudgetCategoryItem } from "./BudgetCategoryCard";

export type { BudgetCategoryItem } from "./BudgetCategoryCard";

/**
 * ==============================================================================
 * Kenzo Treasury — Budget Category List Grid (BudgetCategoryList)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menampilkan grid responsif seksi pos-pos pengeluaran bulanan beserta header
 * informasi total target alokasi terencana dari gaji pokok.
 */

interface BudgetCategoryListProps {
  /**
   * Daftar pos anggaran yang akan ditampilkan.
   */
  categories: BudgetCategoryItem[];
  /**
   * Pemasukan gaji pokok yang menjadi dasar alokasi.
   */
  salaryBase: number;
  /**
   * Total target akumulasi seluruh pos anggaran.
   */
  totalTarget: number;
}

export function BudgetCategoryList({
  categories,
  salaryBase,
  totalTarget,
}: BudgetCategoryListProps) {
  return (
    <div id="pos-anggaran" className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            7 Pos Pengeluaran Wajib
          </h2>
          <p className="text-xs text-muted-foreground">
            Alokasi pos terencana dari gaji pokok Rp {salaryBase.toLocaleString("id-ID")} untuk
            mencegah kebocoran kas.
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground hidden sm:inline tabular-nums">
          Total Target Wajib: Rp {totalTarget.toLocaleString("id-ID")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {categories.map((cat) => (
          <BudgetCategoryCard key={cat.name} category={cat} />
        ))}
      </div>
    </div>
  );
}
