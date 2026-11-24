/**
 * ==============================================================================
 * Kenzo Treasury — Types: Savings Snapshots & Wealth Trajectory (Time-Series)
 * ==============================================================================
 */

export type TimeframeOption = "daily" | "weekly" | "monthly" | "yearly";

export interface WealthSnapshotPoint {
  date: string; // ISO date 'YYYY-MM-DD'
  label: string; // Tampilan label sumbu X, misal: "24 Nov", "Minggu 4", "Nov 2026", "2026"
  freeSavings: number;
  emergencyFund: number;
  totalWealth: number;
  delta: number;
}

export type AllTimeframeSnapshots = Record<TimeframeOption, WealthSnapshotPoint[]>;
