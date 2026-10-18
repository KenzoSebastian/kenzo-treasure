/**
 * ==============================================================================
 * Kenzo Treasury — Shared Month & Category Types
 * ==============================================================================
 *
 * Kontrak tipe data untuk siklus bulanan (`months`), pos anggaran (`budget_categories`),
 * dan agregasi lembar kerja finansial bulanan.
 */

import type { BudgetStatus } from "@/lib/financial-calculations";

export interface MonthSummary {
  id: string;
  userId: string;
  name: string;
  year: number;
  monthIndex: number;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDetailItem {
  id: string;
  monthId: string;
  liabilityId: string | null;
  name: string;
  icon: string | null;
  group: "pos_wajib" | "kebutuhan" | "uang_bebas_tabungan";
  targetBudget: number;
  spentAmount: number;
  remainingBudget: number;
  status: BudgetStatus;
  isTemporary: boolean;
  sortOrder: number;
  liability?: {
    id: string;
    name: string;
    totalAmount: number;
    paidAmount: number;
    monthlyPayment: number;
    isSettled: boolean;
  } | null;
}

export interface MonthlyCycleDetail extends MonthSummary {
  incomes: Array<{
    id: string;
    source: string;
    amount: number;
    date: string;
    isBaseSalary: boolean;
  }>;
  categories: CategoryDetailItem[];
  totalIncome: number;
  totalBudget: number;
  totalSpent: number;
  netCashflow: number;
}
