/**
 * ==============================================================================
 * Kenzo Treasury — Shared Savings & Emergency Fund Vault Types (Fase B11)
 * ==============================================================================
 */

import type { SavingsAccount, NewSavingsAccount } from "@/db/schema";

export type { SavingsAccount, NewSavingsAccount };

export interface SavingsVaultSummary {
  id: string;
  userId: string;
  /** Saldo tabungan bebas di savings_account.balance */
  freeSavingsBalance: number;
  /** Saldo dana darurat di savings_account.emergency_fund_balance */
  emergencyFundBalance: number;
  /** Target ideal dana darurat di savings_account.emergency_fund_target */
  emergencyFundTarget: number;
  /** Total gabungan tabungan bebas + dana darurat */
  totalVaultBalance: number;
  /** Estimasi biaya hidup wajib bulanan untuk kalkulasi safety months */
  monthlyFixedExpense: number;
  /** Jumlah bulan bertahan hidup (1 desimal, misal 4.2 bulan) */
  safetyMonths: number;
  /** Persentase ketercapaian target dana darurat (0 - 100%) */
  percentageOfTarget: number;
  /** True bila saldo dana darurat >= target */
  isTargetReached: boolean;
  updatedAt: Date;
}
