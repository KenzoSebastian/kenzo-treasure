/**
 * ==============================================================================
 * Kenzo Treasury — Shared Liability & Installment Types (Fase B7)
 * ==============================================================================
 */

import type { Liability, NewLiability } from "@/db/schema";

export type { Liability, NewLiability };

export interface LiabilityWithProgress extends Liability {
  remainingAmount: number;
  percentage: number;
  remainingMonths: number;
}

export interface LiabilitiesSummary {
  items: LiabilityWithProgress[];
  activeLiabilities: LiabilityWithProgress[];
  settledLiabilities: LiabilityWithProgress[];
  totalDebtRemaining: number;
  totalPaidAmount: number;
  totalMonthlyCommitment: number;
}
