/**
 * ==============================================================================
 * Kenzo Treasury — Income Types & Domain Contracts
 * ==============================================================================
 *
 * ── Kenapa berkas ini ada ──────────────────────────────────────────────────────
 *
 * Mendefinisikan tipe bersama (contracts) untuk domain pemasukan multi-sumber
 * (Multi-Source Incomes Engine) yang digunakan lintas Server Actions, queries,
 * dan komponen antarmuka.
 */

import type { incomes } from "@/db/schema";

/** Tipe baris data pemasukan hasil inferensi Drizzle ORM */
export type Income = typeof incomes.$inferSelect;

/** Tipe payload insert pemasukan baru */
export type NewIncome = typeof incomes.$inferInsert;

/**
 * Ringkasan agregasi seluruh pemasukan dalam satu siklus bulan.
 */
export interface MonthlyIncomesSummary {
  /** ID siklus bulan terkait */
  monthId: string;
  /** Daftar log entri pemasukan */
  incomes: Income[];
  /** Total seluruh pemasukan (Gaji Pokok + Freelance/Sampingan) dalam integer Rupiah */
  totalIncome: number;
  /** Nominal gaji pokok rutin (isBaseSalary = true) */
  baseSalary: number;
  /** Akumulasi pemasukan sampingan/freelance (isBaseSalary = false) */
  additionalIncomes: number;
  /** Jumlah transaksi/entri pemasukan tercatat */
  incomeCount: number;
}
